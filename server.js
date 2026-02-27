const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose'); // NEW: Bring in Mongoose!

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- 1. CONNECT TO MONGODB ---
// I added /NeonChat to the end of your link so it names your database folder!
const mongoURI = "mongodb+srv://sarthakv276_db_user:NUQleLWdleGXLbF2@cluster0.4ynqcwa.mongodb.net/NeonChat?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- 2. CREATE A USER TEMPLATE (SCHEMA) ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Send the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// When a user connects
io.on('connection', (socket) => {
  console.log('A user connected!');

  // --- 3. NEW LOGIN & REGISTRATION LOGIC ---
  socket.on('login', async (data, callback) => {
    try {
      // Look for the user in the database
      let user = await User.findOne({ username: data.username });
      
      if (user) {
        // User exists! Let's check if the password matches
        if (user.password === data.password) {
          callback({ success: true, message: "Login successful!" });
        } else {
          callback({ success: false, message: "Incorrect password!" });
        }
      } else {
        // User does NOT exist! Let's create a new account for them
        const newUser = new User({ username: data.username, password: data.password });
        await newUser.save();
        callback({ success: true, message: "New account created!" });
      }
    } catch (error) {
      callback({ success: false, message: "Database error." });
    }
  });

  // Listen for a message
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // Listen for typing
  socket.on('typing', (name) => {
    socket.broadcast.emit('typing', name);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});