const { io } = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzNDUiLCJpYXQiOjE3MzU1NDU3NzAsImV4cCI6MTczNTU0OTM3MH0.SdMXzBkCu4iaMM6neMJgaEOgKHoyQrVTvZXsOG10YVg'; // Replace with the generated token

const socket = io('http://localhost:8080', {
    auth: {
        token,
    },
});

socket.on('connect', () => {
    console.log('Connected to server with socket ID:', socket.id);
});

socket.on('NEW_NOTIFICATION', (message) => {
    console.log('Received notification:', message);
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
});
