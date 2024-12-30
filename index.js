const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Redis client setup
const redisClient = createClient();
redisClient.connect();

redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (err) => console.error('Redis error:', err));

// Function to validate Redis list key
const validateRedisListKey = async (key) => {
    const type = await redisClient.type(key);
    if (type !== 'list' && type !== 'none') { // 'none' means the key doesn't exist
        console.log(`Resetting key ${key} as it is not a list.`);
        await redisClient.del(key);
    }
};

// Middleware for Socket.IO authentication
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }

    try {
        const payload = jwt.verify(token, 'test1'); // Replace with your secret key
        socket.user_id = payload.user_id;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});

// Handle Socket.IO connections
io.on('connection', async (socket) => {
    const userId = socket.user_id;
    const socketId = socket.id;

    console.log(`User connected: user_id=${userId}, socket_id=${socketId}`);

    // Ensure the Redis key is a list
    const redisKey = `user_sockets:${userId}`;
    await validateRedisListKey(redisKey);

    // Add the socket ID to Redis
    await redisClient.rPush(redisKey, socketId);

    socket.on('message', (msg) => {
        console.log(`Message from user_id=${userId}:`, msg);
    });

    socket.on('disconnect', async () => {
        console.log(`User disconnected: user_id=${userId}, socket_id=${socketId}`);
        await redisClient.lRem(redisKey, 1, socketId);
    });
});

// Broadcast message to all sockets of a user
const broadcastToUser = async (userId, message) => {
    const redisKey = `user_sockets:${userId}`;
    await validateRedisListKey(redisKey);

    const socketIds = await redisClient.lRange(redisKey, 0, -1);
    if (socketIds.length > 0) {
        console.log(`Broadcasting to user_id=${userId}:`, message);
        socketIds.forEach((id) => {
            io.to(id).emit('NEW_NOTIFICATION', message);
        });
        return { userId, status: 'success' }; // Add success return value
    } else {
        console.log(`No clients connected for user_id=${userId}`);
        return { userId, status: 'no_clients' }; // Add specific response for no connected clients
    }
};

// API to trigger broadcast
app.post('/broadcast', express.json(), async (req, res) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ error: 'userId and message are required' });
    }

    if (Array.isArray(userId)) {
        // Handle multiple user IDs
        const results = await Promise.allSettled(
            userId.map((id) => broadcastToUser(id, message))
        );

        const successful = results.filter((result) => result.status === 'fulfilled');
        const failed = results.filter((result) => result.status === 'rejected');

        return res.status(200).json({
            success: true,
            message: `Notifications sent to ${successful.length} users. ${failed.length} failed.`,
            details: {
                successful: successful.map((r) => r.value), // Optional: log successes
                failed: failed.map((r) => r.reason), // Optional: log failures
            },
        });
    } else {
        // Handle single user ID
        await broadcastToUser(userId, message);
        return res.status(200).json({ success: true, message: 'Notification sent!' });
    }
});


// Start the server
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
