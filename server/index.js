const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Setup Web3 & Supabase (from Environment Variables)
const supabase = createClient(process.env.SUPABASE_URL || "https://dummy.supabase.co", process.env.SUPABASE_KEY || "dummy");
let contract = null;
try {
    if (process.env.ALCHEMY_URL && process.env.PRIVATE_KEY) {
        const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const CONTRACT_ADDRESS = "0xb98d4015577faAdAe3343f0a6bF4b91459094aDF";
        const CONTRACT_ABI = ["function serverMint(address to, uint256 id, uint256 amount) public"];
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
        console.log("Web3 Contract Initialized!");
    }
} catch(e) { console.warn("Web3 Init Failed:", e.message); }

const server = http.createServer(app);

// Allow connections from Vercel frontend or localhost
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

let queue = [];
let rooms = {};

io.on('connection', (socket) => {
    console.log(`[+] Player connected: ${socket.id}`);

    // Handle Matchmaking
    socket.on('joinQueue', (playerData) => {
        console.log(`[Q] Player joined queue: ${socket.id}`);
        // Store player data attached to socket id
        const player = {
            id: socket.id,
            faction: playerData.faction,
            deck: playerData.deck, // Custom deck from DB
            username: playerData.username || "Player"
        };

        // Check if player is already in queue to prevent duplicates
        const existingIdx = queue.findIndex(p => p.id === socket.id);
        if (existingIdx === -1) {
            queue.push(player);
        }

        // Try to match players
        if (queue.length >= 2) {
            const p1 = queue.shift();
            const p2 = queue.shift();

            const roomId = `room_${p1.id}_${p2.id}`;
            
            // Put both sockets in a room
            const socket1 = io.sockets.sockets.get(p1.id);
            const socket2 = io.sockets.sockets.get(p2.id);

            if (socket1 && socket2) {
                socket1.join(roomId);
                socket2.join(roomId);

                rooms[roomId] = {
                    p1, p2,
                    turn: p1.id, // P1 starts first
                    state: 'playing'
                };

                console.log(`[MATCH] Room created: ${roomId}`);

                // Notify both players
                io.to(p1.id).emit('matchFound', { roomId, opponent: p2, isFirst: true });
                io.to(p2.id).emit('matchFound', { roomId, opponent: p1, isFirst: false });
            }
        }
    });

    socket.on('leaveQueue', () => {
        queue = queue.filter(p => p.id !== socket.id);
        console.log(`[Q] Player left queue: ${socket.id}`);
    });

    socket.on('playerAction', (actionData) => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.p1.id === socket.id || room.p2.id === socket.id) {
                const opponentId = room.p1.id === socket.id ? room.p2.id : room.p1.id;
                io.to(opponentId).emit('opponentAction', actionData);
                break;
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`[-] Player disconnected: ${socket.id}`);
        // Remove from queue
        queue = queue.filter(p => p.id !== socket.id);

        // Check if they were in a room
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.p1.id === socket.id || room.p2.id === socket.id) {
                const opponentId = room.p1.id === socket.id ? room.p2.id : room.p1.id;
                io.to(opponentId).emit('opponentDisconnected');
                delete rooms[roomId];
                console.log(`[ROOM] Destroyed ${roomId} due to disconnect`);
                break;
            }
        }
    });
});

app.get('/', (req, res) => {
    res.send('Gods War TCG Multiplayer Server is running!');
});

// API for Gasless Minting
app.post('/api/mint', async (req, res) => {
    if (!contract) return res.status(500).json({ error: "Server Web3 not configured." });
    
    try {
        const { playerId, walletAddress } = req.body;
        if (!playerId || !walletAddress) return res.status(400).json({ error: "Missing parameters" });

        // Verify Player from Supabase
        const { data: player, error: fetchErr } = await supabase.from('players').select('level, free_mint_claimed').eq('id', playerId).single();
        if (fetchErr || !player) return res.status(404).json({ error: "Player not found" });

        // Verify Rules
        if (player.free_mint_claimed) return res.status(400).json({ error: "Already claimed" });
        if (player.level < 2) return res.status(400).json({ error: "Must be Level 2 or higher" });

        // Prevent double minting by marking as claimed FIRST
        await supabase.from('players').update({ free_mint_claimed: true, wallet_address: walletAddress }).eq('id', playerId);

        console.log(`[MINT] Minting Rare Card to ${walletAddress} for player ${playerId}...`);
        
        // Execute Gasless Mint (Server pays Gas)
        const rareCardId = 1; // Example: 1 = Rare Zeus Card
        const tx = await contract.serverMint(walletAddress, rareCardId, 1);
        
        // Wait for network confirmation
        await tx.wait(1);
        console.log(`[MINT] Success! TxHash: ${tx.hash}`);

        res.json({ success: true, txHash: tx.hash });
    } catch (err) {
        console.error("Minting Error:", err);
        res.status(500).json({ error: "Minting failed: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
