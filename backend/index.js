require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const Note = require('./model/note'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }, 
});


app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

app.post('/notes', async (req, res) => {
  try {
    const note = new Note({ title: req.body.title });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.get('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching note' });
  }
});

app.put('/notes/:id', async (req, res) => {
  try {
    const { content } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { content, updatedAt: Date.now() },
      { new: true }
    );
    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ error: 'Error saving note' });
  }
});


const activeUsers = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_note', ({ noteId }) => {
    socket.join(noteId);

    
    if (!activeUsers[noteId]) activeUsers[noteId] = new Set();
    activeUsers[noteId].add(socket.id);

    
    socket.to(noteId).emit('user_joined', 'A user');

    
    io.to(noteId).emit('active_users', activeUsers[noteId].size);

   
    socket.on('note_update', (content) => {
      socket.to(noteId).emit('note_update', content);
    });

    
    socket.on('leave_note', ({ noteId }) => {
      socket.leave(noteId);

      if (activeUsers[noteId]) {
        activeUsers[noteId].delete(socket.id);
        socket.to(noteId).emit('user_left', 'A user');
        io.to(noteId).emit('active_users', activeUsers[noteId].size);

        if (activeUsers[noteId].size === 0) {
          delete activeUsers[noteId];
        }
      }
    });

    
    socket.on('disconnect', () => {
      for (const noteId in activeUsers) {
        if (activeUsers[noteId].has(socket.id)) {
          activeUsers[noteId].delete(socket.id);
          socket.to(noteId).emit('user_left', 'A user');
          io.to(noteId).emit('active_users', activeUsers[noteId].size);

          if (activeUsers[noteId].size === 0) {
            delete activeUsers[noteId];
          }
        }
      }

      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
});


const PORT =  4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
