const { io } = require("socket.io-client");

const SERVER_URL = "https://gods-war-tcg.onrender.com";
console.log(`[Test] Connecting to Staging Server: ${SERVER_URL}`);

const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: false
});

socket.on("connect_error", (err) => {
    console.error(`[Error] Connection Failed: ${err.message}`);
    process.exit(1);
});

socket.on("connect", () => {
    console.log(`[Success] Connected to Server with ID: ${socket.id}`);
    
    const guestName = 'TestAgent_' + Math.floor(Math.random() * 1000);
    const guestId = '123e4567-e89b-12d3-a456-426614174000'; // Dummy UUID
    
    console.log(`[Test] Attempting Guest Login with: ${guestName}`);
    socket.emit('login_guest', { id: guestId, username: guestName });
});

socket.on("login_success", (data) => {
    console.log(`[Success] Guest Login successful! Player Data:`, data);
    console.log(`[Test] Server is fully functional.`);
    process.exit(0);
});

socket.on("system_message", (msg) => {
    console.log(`[Server Message] ${msg}`);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.error(`[Error] Test timed out after 10 seconds. No response from server.`);
    process.exit(1);
}, 10000);
