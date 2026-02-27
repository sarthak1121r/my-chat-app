const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Send the HTML file to the user when they visit the site
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// When a user connects to the server
io.on('connection', (socket) => {
  console.log('A user connected!');

  // Listen for a message from this user
  socket.on('chat message', (msg) => {
    // Broadcast the message to EVERYONE connected
    io.emit('chat message', msg);
  });

  // Listen for the 'typing' signal from a user
  socket.on('typing', (name) => {
    // Broadcast the signal to EVERYONE ELSE except the sender
    socket.broadcast.emit('typing', name);
  });

  // When a user closes the tab
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server on port 3000
server.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});