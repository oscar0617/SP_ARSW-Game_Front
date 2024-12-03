import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const GRID_SIZE = 100;

interface Player {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  turbos: number;
  jumps: number;
}

let players: Player[] = [];
let gameState: 'waiting' | 'playing' | 'finished' = 'waiting';
let timeLeft = 180; // 3 minutes in seconds
let gameInterval: NodeJS.Timeout | null = null;

const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];

function startGame() {
  gameState = 'playing';
  timeLeft = 180;
  gameInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      gameState = 'finished';
      clearInterval(gameInterval!);
    }
    io.emit('gameState', { players, gameState, timeLeft });
  }, 1000);
}

io.on('connection', (socket) => {
  console.log('Un jugador se ha conectado');

  if (players.length < 4) {
    const newPlayer: Player = {
      id: socket.id,
      name: `Player ${players.length + 1}`,
      color: colors[players.length],
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
      direction: 'right',
      turbos: 3,
      jumps: 3
    };

    players.push(newPlayer);

    if (players.length === 4) {
      startGame();
    }

    io.emit('gameState', { players, gameState, timeLeft });
  }

  socket.on('move', (direction: 'up' | 'down' | 'left' | 'right') => {
    const player = players.find(p => p.id === socket.id);
    if (player && gameState === 'playing') {
      player.direction = direction;
      movePlayer(player);
      io.emit('gameState', { players, gameState, timeLeft });
    }
  });

  socket.on('turbo', () => {
    const player = players.find(p => p.id === socket.id);
    if (player && player.turbos > 0 && gameState === 'playing') {
      player.turbos--;
      movePlayer(player);
      movePlayer(player);
      io.emit('gameState', { players, gameState, timeLeft });
    }
  });

  socket.on('jump', () => {
    const player = players.find(p => p.id === socket.id);
    if (player && player.jumps > 0 && gameState === 'playing') {
      player.jumps--;
      movePlayer(player);
      movePlayer(player);
      io.emit('gameState', { players, gameState, timeLeft });
    }
  });

  socket.on('restartGame', () => {
    if (gameState === 'finished') {
      players = players.map(p => ({
        ...p,
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        direction: 'right',
        turbos: 3,
        jumps: 3
      }));
      startGame();
    }
  });

  socket.on('disconnect', () => {
    console.log('Un jugador se ha desconectado');
    players = players.filter(p => p.id !== socket.id);
    if (players.length < 2) {
      gameState = 'waiting';
      if (gameInterval) {
        clearInterval(gameInterval);
      }
    }
    io.emit('gameState', { players, gameState, timeLeft });
  });
});

function movePlayer(player: Player) {
  switch (player.direction) {
    case 'up':
      player.y = (player.y - 1 + GRID_SIZE) % GRID_SIZE;
      break;
    case 'down':
      player.y = (player.y + 1) % GRID_SIZE;
      break;
    case 'left':
      player.x = (player.x - 1 + GRID_SIZE) % GRID_SIZE;
      break;
    case 'right':
      player.x = (player.x + 1) % GRID_SIZE;
      break;
  }

  // Comprobar colisiones
  if (players.some(p => p !== player && p.x === player.x && p.y === player.y)) {
    gameState = 'finished';
    if (gameInterval) {
      clearInterval(gameInterval);
    }
  }
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});