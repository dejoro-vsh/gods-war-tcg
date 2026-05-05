const express = require('express');
const crypto = require('crypto');
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

// Load Card Database for Validation
let CardDatabase = null;
try {
    CardDatabase = require('../js/cards.js');
} catch(e) {
    console.log("Could not load cards.js locally, validation might be limited.");
}

function getNftId(cardName, grade) {
    const hash = crypto.createHash('md5').update(cardName + "_" + grade).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
}

let contract = null;
let web3Error = "Unknown error";
try {
    if (process.env.ALCHEMY_URL && process.env.PRIVATE_KEY) {
        const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const CONTRACT_ADDRESS = "0x4ECaFff2F1412297Ef24Ea7906940825623580f4";
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
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
    }
});

let queue = [];
let rooms = {};

io.on('connection', (socket) => {
    if (socket.recovered) {
        console.log(`[+] Player recovered: ${socket.id}`);
        // Clear disconnect timeout if they were in a room
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.p1.id === socket.id || room.p2.id === socket.id) {
                if (room.disconnectTimeout) {
                    clearTimeout(room.disconnectTimeout);
                    room.disconnectTimeout = null;
                    console.log(`[ROOM] Cleared disconnect timeout for ${roomId}`);
                }
            }
        }
    } else {
        console.log(`[+] Player connected: ${socket.id}`);
    }

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
                    p1: { ...p1, hp: 5, ess: 1, maxEss: 1, field: [], leaderRest: false },
                    p2: { ...p2, hp: 5, ess: 0, maxEss: 0, field: [], leaderRest: false },
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
            const isP1 = room.p1.id === socket.id;
            const isP2 = room.p2.id === socket.id;
            
            if (isP1 || isP2) {
                const player = isP1 ? room.p1 : room.p2;
                const opponent = isP1 ? room.p2 : room.p1;
                
                // --- SERVER-SIDE VALIDATION ---
                // 1. Validate Turn
                if (room.turn !== socket.id && actionData.type !== 'leave') {
                    console.log(`[CHEAT] Player ${socket.id} acted out of turn.`);
                    socket.emit('actionRejected', { error: 'ยังไม่ใช่เทิร์นของคุณ!' });
                    return;
                }

                // 2. Validate Actions
                if (actionData.type === 'endTurn') {
                    room.turn = opponent.id;
                    if (opponent.maxEss === 0) {
                        opponent.maxEss = 2; // P2 turn 1 gets 2 maxEss
                    } else {
                        opponent.maxEss = Math.min(10, opponent.maxEss + 2);
                    }
                    opponent.ess = opponent.maxEss;
                    opponent.field.forEach(c => c.isRest = false);
                    opponent.leaderRest = false;
                    
                } else if (actionData.type === 'playCard') {
                    const card = actionData.card;
                    if (player.ess < card.cost) {
                        console.log(`[CHEAT] Player ${socket.id} played card without enough essence.`);
                        socket.emit('actionRejected', { error: 'Essence ไม่พอ!' });
                        return;
                    }
                    player.ess -= card.cost;
                    if (card.type !== 'event' && card.type !== 'stage') {
                        card.isRest = !(card.skills && card.skills.includes('rush'));
                        player.field.push(card);
                    }
                    
                } else if (actionData.type === 'attack') {
                    let attacker;
                    if (actionData.attackerType === 'leader') {
                        if (player.leaderRest) {
                            socket.emit('actionRejected', { error: 'Leader โจมตีไปแล้ว!' });
                            return;
                        }
                        attacker = { name: "Leader", atk: 5000, isRest: false };
                    } else {
                        attacker = player.field[actionData.attackerIdx];
                        if (!attacker || attacker.isRest) {
                            socket.emit('actionRejected', { error: 'ทหารโจมตีไปแล้ว หรือไม่มีอยู่จริง!' });
                            return;
                        }
                    }

                    // Target
                    let target;
                    if (actionData.targetType === 'leader') {
                        target = { hp: opponent.hp };
                    } else {
                        target = opponent.field[actionData.targetIdx];
                        if (!target) {
                            socket.emit('actionRejected', { error: 'เป้าหมายไม่มีอยู่จริง!' });
                            return;
                        }
                    }
                    
                    // Apply combat results to shadow state
                    if (actionData.targetType === 'leader') {
                        opponent.hp--;
                    } else {
                        // For simplicity, we assume attack always kills target if valid (unless evade, handled below)
                        if (target.skills && target.skills.includes('evade')) {
                            target.skills = target.skills.filter(s => s !== 'evade'); // Remove evade locally
                        } else {
                            opponent.field.splice(actionData.targetIdx, 1);
                        }
                    }
                    
                    if (actionData.attackerType === 'leader') {
                        player.leaderRest = true;
                    } else {
                        attacker.isRest = true;
                    }
                }

                // If valid, broadcast to opponent
                io.to(opponent.id).emit('opponentAction', actionData);
                break;
            }
        }
    });

    socket.on('matchEnded', (data) => {
        if (data && data.roomId && rooms[data.roomId]) {
            rooms[data.roomId].isFinished = true;
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
                if (room.isFinished) {
                    delete rooms[roomId];
                    console.log(`[ROOM] Destroyed ${roomId} gracefully after match end`);
                    break;
                }
                
                // Set a grace period for reconnection
                const opponentId = room.p1.id === socket.id ? room.p2.id : room.p1.id;
                
                if (room.disconnectTimeout) {
                    clearTimeout(room.disconnectTimeout);
                }
                
                room.disconnectTimeout = setTimeout(() => {
                    if (rooms[roomId]) {
                        io.to(opponentId).emit('opponentDisconnected');
                        delete rooms[roomId];
                        console.log(`[ROOM] Destroyed ${roomId} due to disconnect timeout`);
                    }
                }, 15000);
                
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

// API: Request Mint Signature (Hybrid Minting)
app.post('/api/mint/signature', async (req, res) => {
    try {
        const { playerId, inventoryId, walletAddress } = req.body;
        if (!playerId || !inventoryId || !walletAddress) return res.status(400).json({ error: "Missing parameters." });

        if (!process.env.PRIVATE_KEY) {
            return res.status(500).json({ error: "Server missing private key for signing." });
        }

        // Verify ownership and rarity
        const { data: card, error: fetchErr } = await supabase.from('player_inventory')
            .select('*').eq('id', inventoryId).eq('player_id', playerId).single();

        if (fetchErr || !card) return res.status(400).json({ error: "Card not found or not owned by you." });
        
        if (card.is_minted) return res.status(400).json({ error: "This card has already been minted." });

        const allowedGrades = ['Epic', 'Legendary', 'Mythic'];
        if (!allowedGrades.includes(card.grade)) {
            return res.status(400).json({ error: "Only Epic, Legendary, and Mythic cards can be minted to Web3." });
        }

        // Generate signature
        const nftId = getNftId(card.card_name, card.grade);
        // Convert UUID to a uint256 compatible hex string
        const nonce = "0x" + card.id.replace(/-/g, "");

        // Hash the message identically to Solidity: keccak256(abi.encodePacked(msg.sender, id, nonce))
        const messageHash = ethers.solidityPackedKeccak256(
            ["address", "uint256", "uint256"],
            [walletAddress, nftId, nonce]
        );
        
        // Sign the hash (ethers automatically applies the Ethereum Signed Message prefix)
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
        const signature = await wallet.signMessage(ethers.getBytes(messageHash));

        res.json({ success: true, signature, nftId, nonce });
    } catch (err) {
        console.error("Signature Error:", err);
        res.status(500).json({ error: "Failed to generate signature: " + err.message });
    }
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
    try {
        res.json({
            cardDbExists: !!CardDatabase,
            cardDbKeys: CardDatabase ? Object.keys(CardDatabase) : null,
            cwd: process.cwd(),
            dir: __dirname,
            testNftId: CardDatabase ? getNftId('Wukong', 'Epic') : null
        });
    } catch(e) {
        res.status(500).json({error: e.message, stack: e.stack});
    }
});

// API: Metadata for OpenSea
app.get('/api/metadata/:id', (req, res) => {
    const id = parseInt(req.params.id.replace('.json', ''));
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    if (!CardDatabase) {
        return res.status(500).json({ error: "Card database not loaded" });
    }

    const allCards = [...CardDatabase.chinaCards, ...CardDatabase.greekCards];
    const grades = ['Epic', 'Legendary', 'Mythic'];
    
    let matchedCard = null;
    let matchedGrade = null;

    for (const card of allCards) {
        for (const grade of grades) {
            if (getNftId(card.name, grade) === id) {
                matchedCard = card;
                matchedGrade = grade;
                break;
            }
        }
        if (matchedCard) break;
    }

    // Fallback for cards minted before deterministic ID generation (which defaulted to ID 1)
    if (!matchedCard && id === 1) {
        matchedCard = allCards.find(c => c.name === "Divine Elixir") || allCards[0];
        matchedGrade = "Mythic";
    }

    if (!matchedCard) {
        return res.status(404).json({ error: "Metadata not found for this Token ID" });
    }

    // Point directly to the raw GitHub files since GitHub Pages might not be active or paths might differ
    const baseUrl = "https://raw.githubusercontent.com/dejoro-vsh/gods-war-tcg/main";
    const imageUrl = baseUrl + matchedCard.img.replace('./', '/');

    const metadata = {
        name: `${matchedCard.name} (${matchedGrade})`,
        description: `A ${matchedGrade} grade ${matchedCard.faction} ${matchedCard.type} card from Gods War TCG.`,
        image: imageUrl,
        attributes: [
            { trait_type: "Faction", value: matchedCard.faction },
            { trait_type: "Grade", value: matchedGrade },
            { trait_type: "Type", value: matchedCard.type },
            { trait_type: "Attack", value: matchedCard.atk || 0 },
            { trait_type: "Cost", value: matchedCard.cost || 0 }
        ]
    };

    res.json(metadata);
});

// API: Confirm Mint Success
app.post('/api/mint/confirm', async (req, res) => {
    try {
        const { playerId, inventoryId, txHash } = req.body;
        if (!playerId || !inventoryId || !txHash) return res.status(400).json({ error: "Missing parameters." });

        // Ideally, we should verify the txHash on the blockchain to ensure it was successful.
        // For now, we trust the client and update the database.
        
        const { error: updErr } = await supabase.from('player_inventory')
            .update({ is_minted: true })
            .eq('id', inventoryId).eq('player_id', playerId);

        if (updErr) return res.status(500).json({ error: "Failed to update mint status." });

        res.json({ success: true, message: "Mint successful!" });
    } catch (err) {
        console.error("Confirm Error:", err);
        res.status(500).json({ error: "Confirmation failed: " + err.message });
    }
});

// API: Buy Gacha Pack (Mock Payment & RNG Engine)
app.post('/api/shop/buy-pack-mock', async (req, res) => {
    try {
        const { playerId, packType } = req.body;
        if (!playerId || !packType) return res.status(400).json({ error: "Missing parameters." });

        let { data: player, error: fetchErr } = await supabase.from('players').select('gold').eq('id', playerId).single();
        if (fetchErr || !player) return res.status(500).json({ error: "Player not found." });

        let currentGold = player.gold || 0;
        let numCards = 3;
        let guaranteedRarity = 'Normal';

        if (packType === 'basic') {
            if (currentGold < 1000) return res.status(400).json({ error: "ทองไม่พอ (Need 1000 Gold)" });
            currentGold -= 1000;
            numCards = 3;
        } else if (packType === 'premium') {
            // Mock Crypto Payment
            numCards = 5;
            guaranteedRarity = 'Rare';
        } else if (packType === 'god') {
            // Mock Fiat Payment
            numCards = 5;
            guaranteedRarity = 'Epic';
        } else {
            return res.status(400).json({ error: "Invalid pack type." });
        }

        // Check Inventory Capacity
        let { data: invCounts, error: invErr } = await supabase.from('player_inventory').select('faction').eq('player_id', playerId).eq('is_overflow', false);
        if (invErr) return res.status(500).json({ error: "Failed to check inventory." });

        let currentChina = 0;
        let currentGreek = 0;
        if (invCounts) {
            invCounts.forEach(c => {
                if (c.faction === 'china') currentChina++;
                if (c.faction === 'greek') currentGreek++;
            });
        }

        if (currentChina >= 150 && currentGreek >= 150) {
            return res.status(400).json({ error: "กระเป๋าเต็มทั้ง 2 ฝ่าย! (150/150) กรุณาไปรวมการ์ดเพื่อเพิ่มพื้นที่ว่าง" });
        }

        // Deduct Gold if Basic Pack
        if (packType === 'basic') {
            const { error: updErr } = await supabase.from('players').update({ gold: currentGold }).eq('id', playerId);
            if (updErr) return res.status(500).json({ error: "Failed to deduct gold." });
        }

        // RNG Engine
        const chinaCards = ["Wukong", "Guan Yu", "Nezha", "Zhu Bajie", "Erlang", "Hou Yi", "Qilin", "Mazu", "Jade Emperor", "Meditation", "Divine Elixir", "Nuwa's Flood", "Heavenly Court"];
        const greekCards = ["Achilles", "Ares", "Hercules", "Valkyrie", "Spartan", "Poseidon", "Pegasus", "Medusa", "Zeus", "Oracle's Vision", "Ambrosia", "Zeus's Wrath", "Mount Olympus"];
        const allCardsNames = [...chinaCards, ...greekCards];
        const styles = ['original', 'disney', 'pixar', 'anime', 'bishounen'];

        let rolledCards = [];
        for (let i = 0; i < numCards; i++) {
            const cardName = allCardsNames[Math.floor(Math.random() * allCardsNames.length)];
            const faction = chinaCards.includes(cardName) ? 'china' : 'greek';
            const style = styles[Math.floor(Math.random() * styles.length)];

            let rollGrade = Math.random();
            let grade = 'Normal';

            // Base Rates
            if (rollGrade > 0.99) grade = 'Mythic';        // 1%
            else if (rollGrade > 0.95) grade = 'Legendary'; // 4%
            else if (rollGrade > 0.80) grade = 'Epic';      // 15%
            else if (rollGrade > 0.50) grade = 'Rare';      // 30%

            // Apply Guarantees for the very first card in the pack
            if (i === 0) {
                if (guaranteedRarity === 'Rare' && (grade === 'Normal')) grade = 'Rare';
                if (guaranteedRarity === 'Epic' && (grade === 'Normal' || grade === 'Rare')) grade = 'Epic';
            }

            let is_overflow = false;
            if (faction === 'china') {
                if (currentChina >= 150) is_overflow = true;
                else currentChina++;
            } else {
                if (currentGreek >= 150) is_overflow = true;
                else currentGreek++;
            }

            rolledCards.push({ player_id: playerId, card_name: cardName, grade: grade, style: style, faction: faction, is_free: false, is_overflow: is_overflow });
        }

        // Save to DB
        const { error: insErr } = await supabase.from('player_inventory').insert(rolledCards);
        if (insErr) {
            console.error("Gacha Insert Error:", insErr);
            return res.status(500).json({ error: "Failed to add cards to inventory." });
        }

        res.json({ success: true, newGold: packType === 'basic' ? currentGold : undefined, cards: rolledCards });
    } catch (err) {
        console.error("Gacha Error:", err);
        res.status(500).json({ error: "Server error: " + err.message });
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

// API: Admin Fix Inventory (Retroactively apply overflow rules)
app.post('/api/admin/fix-inventory', async (req, res) => {
    try {
        const { data: inv, error } = await supabase.from('player_inventory').select('id, player_id, faction').eq('is_overflow', false);
        if (error) return res.status(500).json({ error: error.message });
        
        let playerStats = {};
        let overflowIds = [];
        
        inv.forEach(c => {
            if (!playerStats[c.player_id]) playerStats[c.player_id] = { china: 0, greek: 0 };
            
            if (c.faction === 'china') {
                if (playerStats[c.player_id].china >= 150) overflowIds.push(c.id);
                else playerStats[c.player_id].china++;
            } else if (c.faction === 'greek') {
                if (playerStats[c.player_id].greek >= 150) overflowIds.push(c.id);
                else playerStats[c.player_id].greek++;
            }
        });
        
        if (overflowIds.length > 0) {
            // Update in chunks to avoid URL too long or payload too large
            const chunkSize = 100;
            for (let i = 0; i < overflowIds.length; i += chunkSize) {
                const chunk = overflowIds.slice(i, i + chunkSize);
                await supabase.from('player_inventory').update({ is_overflow: true }).in('id', chunk);
            }
        }
        res.json({ success: true, message: `Fixed inventory. Moved ${overflowIds.length} cards to overflow.` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: Claim Overflow Cards
app.post('/api/inventory/claim-overflow', async (req, res) => {
    try {
        const { playerId, faction } = req.body;
        if (!playerId || !faction) return res.status(400).json({ error: "Missing parameters" });
        
        // Check current space
        const { data: active, error: countErr } = await supabase.from('player_inventory').select('id').eq('player_id', playerId).eq('faction', faction).eq('is_overflow', false);
        if (countErr) return res.status(500).json({ error: "Failed to check space." });
        
        const spaceLeft = 150 - (active ? active.length : 0);
        if (spaceLeft <= 0) return res.status(400).json({ error: `กระเป๋าฝ่าย ${faction} เต็มแล้ว ไม่สามารถดึงการ์ดล่องลอยได้` });
        
        // Get overflow cards
        const { data: overflowCards, error: getErr } = await supabase.from('player_inventory').select('id').eq('player_id', playerId).eq('faction', faction).eq('is_overflow', true).limit(spaceLeft);
        if (getErr || !overflowCards || overflowCards.length === 0) return res.status(400).json({ error: "ไม่มีการ์ดล่องลอยให้ดึง" });
        
        const idsToClaim = overflowCards.map(c => c.id);
        const { error: updErr } = await supabase.from('player_inventory').update({ is_overflow: false }).in('id', idsToClaim);
        if (updErr) return res.status(500).json({ error: "Failed to claim cards." });
        
        res.json({ success: true, message: `ดึงการ์ดล่องลอยกลับมา ${idsToClaim.length} ใบเรียบร้อยแล้ว` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: Craft / Ascend Cards
app.post('/api/craft/ascend', async (req, res) => {
    try {
        const { playerId, cardIds, targetGrade } = req.body;
        if (!playerId || !cardIds || !Array.isArray(cardIds) || cardIds.length === 0 || !targetGrade) {
            return res.status(400).json({ error: "Missing parameters." });
        }
        
        // Rules: 4 Normal -> 1 Rare | 3 Rare -> 1 Epic | 3 Epic -> 1 Legendary | 2 Legendary -> 1 Mythic
        let requiredCount = 0;
        let sourceGrade = '';
        let goldCost = 0;
        if (targetGrade === 'Rare') { sourceGrade = 'Normal'; requiredCount = 4; goldCost = 100; }
        else if (targetGrade === 'Epic') { sourceGrade = 'Rare'; requiredCount = 3; goldCost = 500; }
        else if (targetGrade === 'Legendary') { sourceGrade = 'Epic'; requiredCount = 3; goldCost = 2000; }
        else if (targetGrade === 'Mythic') { sourceGrade = 'Legendary'; requiredCount = 2; goldCost = 10000; }
        else return res.status(400).json({ error: "Invalid target grade." });
        
        if (cardIds.length !== requiredCount) return res.status(400).json({ error: `ต้องใช้การ์ดระดับ ${sourceGrade} จำนวน ${requiredCount} ใบ` });

        // Check gold
        let { data: player, error: fetchErr } = await supabase.from('players').select('gold').eq('id', playerId).single();
        if (fetchErr || !player) return res.status(500).json({ error: "Player not found." });
        
        let currentGold = player.gold || 0;
        if (currentGold < goldCost) return res.status(400).json({ error: `ทองไม่พอ! การหลอมรวมนี้ต้องใช้ ${goldCost} ทอง` });
        
        // Verify ownership and identical cards
        const { data: cards, error: getErr } = await supabase.from('player_inventory').select('*').in('id', cardIds).eq('player_id', playerId).eq('is_overflow', false);
        if (getErr || !cards || cards.length !== requiredCount) return res.status(400).json({ error: "หาการ์ดไม่ครบ หรือการ์ดไม่ได้อยู่ในกระเป๋าหลัก" });
        
        // Verify identical name and grade
        const firstCard = cards[0];
        const allSame = cards.every(c => c.card_name === firstCard.card_name && c.grade === sourceGrade);
        if (!allSame) return res.status(400).json({ error: `การ์ดที่นำมารวมต้องเป็นการ์ดเดียวกัน และต้องเป็นระดับ ${sourceGrade} ทั้งหมด` });
        
        // Delete consumed cards
        const { error: delErr } = await supabase.from('player_inventory').delete().in('id', cardIds);
        if (delErr) return res.status(500).json({ error: "Failed to consume cards." });
        
        // Create new ascended card (keep the original style if possible, or random style? Let's keep original 'original' or first card's style)
        // Wait, if merging, the resulting style can just be the first card's style.
        const newCard = {
            player_id: playerId,
            card_name: firstCard.card_name,
            faction: firstCard.faction,
            style: firstCard.style,
            grade: targetGrade,
            is_free: false,
            is_overflow: false
        };
        
        const { data: insData, error: insErr } = await supabase.from('player_inventory').insert([newCard]).select().single();
        if (insErr) return res.status(500).json({ error: "Failed to create ascended card." });
        
        // Deduct Gold
        const newGold = currentGold - goldCost;
        const { error: updErr } = await supabase.from('players').update({ gold: newGold }).eq('id', playerId);
        if (updErr) return res.status(500).json({ error: "Failed to deduct gold." });
        
        res.json({ success: true, message: "อัปเกรดการ์ดสำเร็จ!", newCard: insData, newGold: newGold });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// API: Leaderboard (Top 50 by Level then Wins)
app.get('/api/leaderboard', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('username, level, win_count, avatar')
            .order('level', { ascending: false })
            .order('win_count', { ascending: false })
            .limit(50);
            
        if (error) throw error;
        
        res.json({ success: true, leaderboard: data });
    } catch (e) {
        console.error("Leaderboard fetch error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// API: Record Match Result & Process Level Up
app.post('/api/match/result', async (req, res) => {
    try {
        const { playerId, win, kills, heals, playTime } = req.body;
        if (!playerId) return res.status(400).json({ error: "Missing player ID." });

        const { data: player, error: fetchErr } = await supabase.from('players')
            .select('*').eq('id', playerId).single();
            
        if (fetchErr || !player) return res.status(404).json({ error: "Player not found." });

        let w = player.win_count || 0;
        let l = player.loss_count || 0;
        let g = player.gold || 0;
        let k = (player.kills || 0) + (kills || 0);
        let h = (player.heals || 0) + (heals || 0);
        let pt = (player.play_time_seconds || 0) + (playTime || 0);
        
        g += win ? 50 : 10;
        let xp = (player.exp || 0) + (win ? 100 : 25);
        let lvl = player.level || 1;
        
        const oldLvl = lvl;
        let levelsGained = 0;
        
        while (xp >= Math.floor(100 * Math.pow(lvl, 1.5))) {
            xp -= Math.floor(100 * Math.pow(lvl, 1.5));
            lvl++;
            levelsGained++;
        }

        if (win) w++; else l++;
        
        let rewardDrops = [];
        let totalBonusGold = 0;
        
        // Process Level Up Rewards
        if (levelsGained > 0) {
            const styles = ['original', 'disney', 'pixar', 'anime', 'bishounen'];
            const chinaCards = ["Wukong", "Guan Yu", "Nezha", "Zhu Bajie", "Erlang", "Hou Yi", "Qilin", "Mazu", "Jade Emperor", "Meditation", "Divine Elixir", "Nuwa's Flood", "Heavenly Court"];
            const greekCards = ["Achilles", "Ares", "Hercules", "Valkyrie", "Spartan", "Poseidon", "Pegasus", "Medusa", "Zeus", "Oracle's Vision", "Ambrosia", "Zeus's Wrath", "Mount Olympus"];
            const allCardsNames = [...chinaCards, ...greekCards];

            for (let currentLvl = oldLvl + 1; currentLvl <= lvl; currentLvl++) {
                let goldReward = 0;
                let numCards = 0;
                let rates = { Normal: 0, Rare: 0, Epic: 0, Legendary: 0, Mythic: 0 };
                let guarantees = [];

                if (currentLvl >= 2 && currentLvl <= 4) {
                    goldReward = 150; numCards = 1; rates = { Normal: 0.9, Rare: 1 };
                } else if (currentLvl === 5) {
                    goldReward = 500; numCards = 2; rates = { Normal: 0.8, Rare: 0.8, Epic: 1 }; guarantees = ['Rare'];
                } else if (currentLvl >= 6 && currentLvl <= 9) {
                    goldReward = 200; numCards = 2; rates = { Normal: 0.8, Rare: 1 };
                } else if (currentLvl === 10) {
                    goldReward = 1000; numCards = 3; rates = { Rare: 0.8, Epic: 1 }; guarantees = ['Epic'];
                } else if (currentLvl >= 11 && currentLvl <= 19) {
                    goldReward = 300; numCards = 3; rates = { Normal: 0.6, Rare: 0.95, Epic: 1 };
                } else if (currentLvl === 20) {
                    goldReward = 2500; numCards = 5; rates = { Rare: 0.8, Epic: 1 }; guarantees = ['Legendary'];
                } else if (currentLvl >= 21 && currentLvl <= 29) {
                    goldReward = 500; numCards = 5; rates = { Normal: 0.4, Rare: 0.9, Epic: 1 };
                } else if (currentLvl === 30) {
                    goldReward = 5000; numCards = 7; rates = { Epic: 0.8, Legendary: 1 }; guarantees = ['Mythic'];
                } else if (currentLvl >= 31 && currentLvl <= 49) {
                    goldReward = 800; numCards = 7; rates = { Rare: 0.7, Epic: 0.95, Legendary: 1 };
                } else if (currentLvl >= 50) {
                    goldReward = 10000; numCards = 10; rates = { Epic: 0.5, Legendary: 1 }; guarantees = ['Mythic', 'Mythic'];
                }

                totalBonusGold += goldReward;

                for (let i = 0; i < numCards; i++) {
                    const cardName = allCardsNames[Math.floor(Math.random() * allCardsNames.length)];
                    const faction = chinaCards.includes(cardName) ? 'china' : 'greek';
                    const style = styles[Math.floor(Math.random() * styles.length)];

                    let grade = 'Normal';
                    if (guarantees.length > 0) {
                        grade = guarantees.pop();
                    } else {
                        const roll = Math.random();
                        let cumulative = 0;
                        for (const [g, prob] of Object.entries(rates)) {
                            cumulative += prob;
                            if (roll <= cumulative) { grade = g; break; }
                        }
                    }

                    rewardDrops.push({
                        player_id: playerId,
                        card_name: cardName,
                        grade: grade,
                        style: style,
                        faction: faction,
                        is_free: true,
                        is_overflow: true // Level up rewards go to overflow to prevent capacity issues
                    });
                }
            }
        }
        
        g += totalBonusGold;

        // Update Player Stats
        const { error: updErr } = await supabase.from('players')
            .update({ win_count: w, loss_count: l, kills: k, heals: h, play_time_seconds: pt, exp: xp, level: lvl, gold: g })
            .eq('id', playerId);
            
        if (updErr) return res.status(500).json({ error: "Failed to update stats." });

        // Insert Reward Drops
        if (rewardDrops.length > 0) {
            const { error: insErr } = await supabase.from('player_inventory').insert(rewardDrops);
            if (insErr) console.error("LevelUp Insert Error:", insErr);
        }

        res.json({
            success: true,
            levelUp: levelsGained > 0,
            newLevel: lvl,
            bonusGold: totalBonusGold,
            cards: rewardDrops,
            newGoldTotal: g,
            newExp: xp
        });
    } catch (e) {
        console.error("Match Result Error:", e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
