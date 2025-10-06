const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Small word list
const WORDS = [
  'hola','mundo','teclado','rápido','carrera','amigo','codigo','javascript','socket','servidor',
  'cliente','teclear','dedos','virtual','reto','practica','velocidad','precisión','gato','perro'
];

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('create-room', (cb) => {
    const room = Math.random().toString(36).slice(2,8);
    socket.join(room);
    cb(room);
  });

  socket.on('join-room', ({room}, cb) => {
    const clients = io.sockets.adapter.rooms.get(room);
    const count = clients ? clients.size : 0;
    if (count >= 6) return cb({ error: 'room full' });
    socket.join(room);
    cb({ ok: true });
    io.to(room).emit('room-update', { players: getPlayersInRoom(room) });
  });

  socket.on('start-race', ({room, wordsCount}) => {
    // pick shuffled words
    const shuffled = shuffleArray(WORDS).slice(0, wordsCount || 20);
    io.to(room).emit('race-start', { words: shuffled });
  });

  socket.on('progress', ({room, progress}) => {
    socket.to(room).emit('opponent-progress', { id: socket.id, progress });
  });

  socket.on('finished', ({room, result}) => {
    io.to(room).emit('player-finished', { id: socket.id, result });
  });

  socket.on('disconnecting', () => {
    const rooms = socket.rooms; // Set
    rooms.forEach(r => {
      if (r === socket.id) return;
      io.to(r).emit('room-update', { players: getPlayersInRoom(r) });
    });
  });
});

function getPlayersInRoom(room) {
  const clients = io.sockets.adapter.rooms.get(room);
  if (!clients) return [];
  const players = [];
  for (const id of clients) {
    players.push({ id });
  }
  return players;
}

function shuffleArray(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

// Export helpers for tests
module.exports = { shuffleArray };
