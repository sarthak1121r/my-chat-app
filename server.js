const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- 1. CONNECT TO MONGODB ---
const mongoURI = "mongodb+srv://sarthakv276_db_user:NUQleLWdleGXLbF2@cluster0.4ynqcwa.mongodb.net/NeonChat?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- 2. USER SCHEMA ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// --- 3. MULTI-PAGE ROUTES ---
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/welcome.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/dashboard.html');
});

app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/profile', (req, res) => {
  res.sendFile(__dirname + '/profile.html');
});

app.get('/games/tictactoe', (req, res) => {
  res.sendFile(__dirname + '/tictactoe.html');
});

// --- 4. SOCKET & SIGNALING LOGIC ---
io.on('connection', (socket) => {
  console.log('A user connected!');

  // Existing Chat & Auth Logic
  socket.on('login', async (data, callback) => {
    try {
      let user = await User.findOne({ username: data.username });
      if (user) {
        if (user.password === data.password) {
          callback({ success: true, message: "Login successful!" });
        } else {
          callback({ success: false, message: "Incorrect password!" });
        }
      } else {
        const newUser = new User({ username: data.username, password: data.password });
        await newUser.save();
        callback({ success: true, message: "New account created!" });
      }
    } catch (error) {
      callback({ success: false, message: "Database error." });
    }
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('typing', (name) => {
    socket.broadcast.emit('typing', name);
  });

  // ==========================================
  // --- NEW: WEBRTC SIGNALING EVENTS ---
  // ==========================================

  // 1. When a caller sends an "Offer" to start a call
  socket.on('call-offer', (data) => {
    socket.broadcast.emit('call-offer', data);
  });

  // 2. When the receiver accepts and sends an "Answer" back
  socket.on('call-answer', (data) => {
    socket.broadcast.emit('call-answer', data);
  });

  // 3. ICE Candidates: These are network coordinates browsers use to find each other
  socket.on('ice-candidate', (data) => {
    socket.broadcast.emit('ice-candidate', data);
  });

  // ==========================================

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});