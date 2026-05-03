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
let web3Error = "Unknown error";
try {
    if (process.env.ALCHEMY_URL && process.env.PRIVATE_KEY) {
        const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const CONTRACT_ADDRESS = "0xb98d4015577faAdAe3343f0a6bF4b91459094aDF";
        const CONTRACT_ABI = ["function serverMint(address to, uint256 id, uint256 amount) public"];
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
        console.log("Web3 Contract Initialized!");
        web3Error = null;
    } else {
        web3Error = "Missing ALCHEMY_URL or PRIVATE_KEY in Render Environment Variables";
    }
} catch(e) { 
    console.warn("Web3 Init Failed:", e.message);
    web3Error = e.message;
}

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
    if (!contract) return res.status(500).json({ error: `Server Web3 not configured. Reason: ${web3Error}` });
    
    try {
        const { playerId, walletAddress } = req.body;
        if (!playerId || !walletAddress) return res.status(400).json({ error: "Missing parameters" });

        // Verify Player from Supabase
        const { data: player, error: fetchErr } = await supabase.from('players').select('level, free_mint_claimed').eq('id', playerId).single();
        if (fetchErr || !player) return res.status(404).json({ error: "Player not found" });

        // Verify Rules
        if (player.free_mint_claimed) return res.status(400).json({ error: "Already claimed" });
        if (player.level < 2) return res.status(400).json({ error: "Must be Level 2 or higher" });

        // Gacha Logic: Roll Card, Grade, Style
        const chinaCards = ["Wukong", "Guan Yu", "Nezha", "Zhu Bajie", "Erlang", "Hou Yi", "Qilin", "Mazu", "Jade Emperor", "Meditation", "Divine Elixir", "Nuwa's Flood", "Heavenly Court"];
        const greekCards = ["Achilles", "Ares", "Hercules", "Valkyrie", "Spartan", "Poseidon", "Pegasus", "Medusa", "Zeus", "Oracle's Vision", "Ambrosia", "Zeus's Wrath", "Mount Olympus"];
        const allCardsNames = [...chinaCards, ...greekCards];
        
        const cardName = allCardsNames[Math.floor(Math.random() * allCardsNames.length)];
        const faction = chinaCards.includes(cardName) ? 'china' : 'greek';

        // Check Inventory Limit for this faction
        const { count: invCount, error: countErr } = await supabase
            .from('player_inventory')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', playerId)
            .eq('faction', faction);

        if (countErr) return res.status(500).json({ error: "Failed to check inventory limit." });
        if (invCount >= 150) return res.status(400).json({ error: `ช่องเก็บของฝ่าย ${faction} ของคุณเต็มแล้ว (150/150)` });
        
        const rollGrade = Math.random();
        let grade = 'Normal';
        if (rollGrade > 0.99) grade = 'Mythic';        // 1%
        else if (rollGrade > 0.95) grade = 'Legendary'; // 4%
        else if (rollGrade > 0.80) grade = 'Epic';      // 15%
        else if (rollGrade > 0.50) grade = 'Rare';      // 30%
        // Normal 50%

        const styles = ['original', 'disney', 'pixar', 'anime', 'bishounen'];
        const style = styles[Math.floor(Math.random() * styles.length)];

        // Get a serial number (1-1000)
        const { data: issued } = await supabase.from('players').select('nft_serial').not('nft_serial', 'is', null);
        const issuedSerials = issued ? issued.map(p => p.nft_serial) : [];
        let availableSerials = [];
        for (let i = 1; i <= 1000; i++) {
            if (!issuedSerials.includes(i)) availableSerials.push(i);
        }

        if (availableSerials.length === 0) return res.status(400).json({ error: "Sold out" });
        const selectedSerial = availableSerials[Math.floor(Math.random() * availableSerials.length)];

        // Insert into player_inventory FIRST
        const { error: invErr } = await supabase.from('player_inventory').insert([
            { player_id: playerId, card_name: cardName, grade: grade, style: style, faction: faction, is_free: false }
        ]);

        if (invErr) {
            console.error("Inventory Insert Error:", invErr);
            return res.status(500).json({ error: "Failed to add card to inventory." });
        }

        // Mark as claimed and assign serial
        const { error: updateErr } = await supabase.from('players')
            .update({ free_mint_claimed: true, wallet_address: walletAddress, nft_serial: selectedSerial })
            .eq('id', playerId);
            
        if (updateErr) {
            console.error("DB Update Error (Possible Serial Collision):", updateErr);
            return res.status(500).json({ error: "Collision occurred, please try again." });
        }

        console.log(`[MINT] Minting ${grade} ${cardName} (Style: ${style}, Serial #${selectedSerial}) to ${walletAddress}...`);
        
        // Execute Gasless Mint (Server pays Gas)
        const nftId = 1; // Example standard ERC1155 ID
        const tx = await contract.serverMint(walletAddress, nftId, 1);
        
        // Wait for network confirmation
        await tx.wait(1);
        console.log(`[MINT] Success! TxHash: ${tx.hash}`);

        res.json({ success: true, txHash: tx.hash, serial: selectedSerial, cardName, grade, style });
    } catch (err) {
        console.error("Minting Error:", err);
        res.status(500).json({ error: "Minting failed: " + err.message });
    }
});

// API: Claim Starter Deck (70 China + 70 Greek)
app.post('/api/claim-starter', async (req, res) => {
    try {
        const { playerId } = req.body;
        if (!playerId) return res.status(400).json({ error: "Missing player ID." });

        let { data: player, error: fetchErr } = await supabase.from('players').select('starter_claimed').eq('id', playerId).single();
        
        if (fetchErr || !player) {
            // Auto-create player record to prevent foreign key errors
            const { data: newPlayer, error: insErr } = await supabase.from('players').upsert([{ id: playerId, username: 'Guest' }]).select('starter_claimed').single();
            if (insErr) return res.status(500).json({ error: "Failed to initialize player profile in database." });
            player = newPlayer;
        }

        if (player.starter_claimed) return res.status(400).json({ error: "Starter deck already claimed." });

        const chinaCards = ["Wukong", "Guan Yu", "Nezha", "Zhu Bajie", "Erlang", "Hou Yi", "Qilin", "Mazu", "Jade Emperor", "Meditation", "Divine Elixir", "Nuwa's Flood", "Heavenly Court"];
        const greekCards = ["Achilles", "Ares", "Hercules", "Valkyrie", "Spartan", "Poseidon", "Pegasus", "Medusa", "Zeus", "Oracle's Vision", "Ambrosia", "Zeus's Wrath", "Mount Olympus"];
        const freeStyles = ['disney', 'pixar', 'anime', 'bishounen'];

        let newCards = [];

        // Function to distribute 70 cards evenly among available card names
        const generateFactionCards = (factionNames, factionLabel) => {
            let cards = [];
            // Calculate base amount per card (70 / 13 = 5, remainder 5)
            const baseAmount = Math.floor(70 / factionNames.length);
            let remainder = 70 % factionNames.length;

            for (const cName of factionNames) {
                let amountToGive = baseAmount + (remainder > 0 ? 1 : 0);
                if (remainder > 0) remainder--;

                for (let i = 0; i < amountToGive; i++) {
                    cards.push({
                        player_id: playerId,
                        card_name: cName,
                        grade: 'Normal',
                        style: freeStyles[Math.floor(Math.random() * freeStyles.length)],
                        faction: factionLabel,
                        is_free: true
                    });
                }
            }
            return cards;
        };

        newCards = newCards.concat(generateFactionCards(chinaCards, 'china'));
        newCards = newCards.concat(generateFactionCards(greekCards, 'greek'));

        // Insert 140 cards into inventory
        const { error: invErr } = await supabase.from('player_inventory').insert(newCards);
        if (invErr) {
            console.error("Failed to insert starter cards:", invErr);
            return res.status(500).json({ error: "Failed to generate starter cards." });
        }

        // Mark as claimed
        await supabase.from('players').update({ starter_claimed: true }).eq('id', playerId);

        res.json({ success: true, message: "Claimed 140 Starter Cards successfully!" });
    } catch (err) {
        console.error("Claim Starter Error:", err);
        res.status(500).json({ error: "Claiming failed: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
