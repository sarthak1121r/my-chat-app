const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- 1. CONNECT TO MONGODB ---
// This connects to your "NeonChat" database in the cloud
const mongoURI = "mongodb+srv://sarthakv276_db_user:NUQleLWdleGXLbF2@cluster0.4ynqcwa.mongodb.net/NeonChat?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- 2. CREATE A USER TEMPLATE (SCHEMA) ---
// This tells MongoDB how to store user accounts
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Send the HTML file to the browser
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// When a user connects to the server
io.on('connection', (socket) => {
  console.log('A user connected!');

  // --- 3. LOGIN & REGISTRATION LOGIC ---
  // Checks if user exists; if not, creates a new one
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

  // --- 4. CHAT MESSAGE LOGIC ---
  // Broadcasts messages to everyone in the chat
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // --- 5. TYPING INDICATOR LOGIC ---
  // Broadcasts the 'typing' status to everyone EXCEPT the person typing
  socket.on('typing', (name) => {
    socket.broadcast.emit('typing', name);
  });

  // When a user leaves the site
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server on port 3000
server.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});