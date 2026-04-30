const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
