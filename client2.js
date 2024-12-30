const { io } = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjc4OTAiLCJpYXQiOjE3MzU1NDU4MDIsImV4cCI6MTczNTU0OTQwMn0.fRMIwHYTyyp5nKcroM3X3UQ8atEh62TV5uLguQjya50'; // Replace with the generated token

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
