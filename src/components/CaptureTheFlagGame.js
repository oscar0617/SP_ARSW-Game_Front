import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import io from 'socket.io-client';
import useSound from 'use-sound';
import crash from './music/crash.mp3'
import gameOver from './music/gameOver.mp3'
import gameWon from './music/gameWon.mp3'

const GRID_SIZE = 100;
const BORDER_OFFSET = 5;
const INITIAL_TURBOS = 3;
const INITIAL_JUMPS = 3;
const GAME_DURATION = 180;
const BASE_SPEED = 0.5;
const RESPAWN_TIME = 6000; // 6 segundos en milisegundos
const FLAG_POINTS = 100;
const KILL_POINTS = 50;
const DEATH_PENALTY = 25;
const WINNING_SCORE = 1500;
const TRAIL_LIMIT = 50;
const FLAG_SPAWN_INTERVAL = 8000; // 8 segundos

const getRandomPosition = () => ({
    x: Math.floor(Math.random() * (GRID_SIZE - 2 * BORDER_OFFSET)) + BORDER_OFFSET,
    y: Math.floor(Math.random() * (GRID_SIZE - 2 * BORDER_OFFSET)) + BORDER_OFFSET
  });

  const getInitialPosition = (playerId) => {
    switch(playerId) {
      case '1': return { x: BORDER_OFFSET, y: BORDER_OFFSET };
      case '2': return { x: GRID_SIZE - BORDER_OFFSET, y: BORDER_OFFSET };
      case '3': return { x: BORDER_OFFSET, y: GRID_SIZE - BORDER_OFFSET };
      case '4': return { x: GRID_SIZE - BORDER_OFFSET, y: GRID_SIZE - BORDER_OFFSET };
      default: return { x: BORDER_OFFSET, y: BORDER_OFFSET };
    }
  };
  const drawPixelBike = (ctx, x, y, direction, color, cellSize) => {
    ctx.save();
    ctx.translate(x * cellSize + cellSize/2, y * cellSize + cellSize/2);
    
    // Rotación según dirección
    const rotationAngles = {
      'right': 0,
      'left': Math.PI,
      'up': -Math.PI/2,
      'down': Math.PI/2
    };
    ctx.rotate(rotationAngles[direction]);
    
    const pixelSize = cellSize / 4; // Tamaño de cada "pixel" de la moto
    
    // Array que representa el diseño de la moto en pixeles
    // 0 = transparente, 1 = color principal, 2 = negro, 3 = rojo, 4 = blanco
    const bikeDesign = [
      [0,0,0,0,0,0,0,0,2,3],
      [0,0,0,0,0,0,2,2,2,2],
      [0,0,0,0,2,2,2,2,2,2],
      [4,0,2,2,2,2,2,2,2,2],
      [4,2,2,2,2,2,2,2,2,2],
      [4,2,2,2,2,2,2,2,2,2],
      [4,0,2,2,2,2,2,2,2,2],
      [0,0,0,0,2,2,2,2,2,2],
      [0,0,0,0,0,0,2,2,2,2],
      [0,0,0,0,0,0,0,0,2,3]
    ];
  
    // Offset para centrar la moto
    const offsetX = -bikeDesign[0].length * pixelSize / 2;
    const offsetY = -bikeDesign.length * pixelSize / 2;
  
    // Dibujar la moto pixel por pixel
    bikeDesign.forEach((row, i) => {
      row.forEach((pixel, j) => {
        if (pixel !== 0) {
          switch(pixel) {
            case 1:
              ctx.fillStyle = color;
              break;
            case 2:
              ctx.fillStyle = '#222222';
              break;
            case 3:
              ctx.fillStyle = '#FF0000';
              break;
            case 4:
              ctx.fillStyle = '#FFFFFF';
              break;
          }
          ctx.fillRect(
            offsetX + j * pixelSize,
            offsetY + i * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      });
    });
  
    // Añadir efecto de brillo
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    
    ctx.restore();
  };

const initialPlayers = [
  // Definición inicial de los jugadores
  {
    id: '1',
    name: sessionStorage.getItem('playersInfo') 
    ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '1')?.name || 'Player 1'
    : 'Player 1',
    color: sessionStorage.getItem('playersInfo') 
      ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '1')?.color || '#00FF00'
      : '#00FF00',
    ...getInitialPosition('1'),
    direction: 'right',
    turbos: INITIAL_TURBOS,
    jumps: INITIAL_JUMPS,
    trail: [{ x: BORDER_OFFSET, y: BORDER_OFFSET }],
    speed: BASE_SPEED,
    isAlive: true,
    isTurboActive: false,
    score: 0,
    hasFlag: false
  },
  {
    id: '2',
    name: sessionStorage.getItem('playersInfo') 
    ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '2')?.name || 'Player 2'
    : 'Player 2',
    color: sessionStorage.getItem('playersInfo') 
      ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '2')?.color || '#00FF00'
      : '#00FF00',
    ...getInitialPosition('2'),
    direction: 'left',
    turbos: INITIAL_TURBOS,
    jumps: INITIAL_JUMPS,
    trail: [{ x: GRID_SIZE - BORDER_OFFSET, y: BORDER_OFFSET }],
    speed: BASE_SPEED,
    isAlive: true,
    isTurboActive: false,
    score: 0,
    hasFlag: false
  },
  {
    id: '3',
    name: sessionStorage.getItem('playersInfo') 
    ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '3')?.name || 'Player 3'
    : 'Player 3',
    color: sessionStorage.getItem('playersInfo') 
      ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '3')?.color || '#0000FF'
      : '#0000FF',
      ...getInitialPosition('3'),
    direction: 'right',
    turbos: INITIAL_TURBOS,
    jumps: INITIAL_JUMPS,
    trail: [{ x: BORDER_OFFSET, y: GRID_SIZE - BORDER_OFFSET }],
    speed: BASE_SPEED,
    isAlive: true,
    isTurboActive: false,
    score: 0,
    hasFlag: false
  },
  {
    id: '4',
    name: sessionStorage.getItem('playersInfo') 
    ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '4')?.name || 'Player 4'
    : 'Player 4',
    color: sessionStorage.getItem('playersInfo') 
      ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '4')?.color || '#FFFF00'
      : '#FFFF00',
    ...getInitialPosition('4'),
    direction: 'left',
    turbos: INITIAL_TURBOS,
    jumps: INITIAL_JUMPS,
    trail: [{ x: GRID_SIZE - BORDER_OFFSET, y: GRID_SIZE - BORDER_OFFSET }],
    speed: BASE_SPEED,
    isAlive: true,
    isTurboActive: false,
    score: 0,
    hasFlag: false
  }
];

const isValidTurn = (currentDirection, newDirection) => {
  const oppositeDirections = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left'
  };
  return oppositeDirections[currentDirection] !== newDirection;
};

function CaptureTheFlag({ roomId }) {
    const [players, setPlayers] = useState(initialPlayers);
    const [flag, setFlag] = useState(null);
    const canvasRef = useRef(null);
    const gameLoopRef = useRef();
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState('playing');
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [collisionMessage, setCollisionMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [nombreSala, setNombreSala] = useState(roomId || sessionStorage.getItem("idRoom") || "");
    const [windowSize, setWindowSize] = useState({
      width: window.innerWidth,
      height: window.innerHeight
    });
    const [volume, setVolume] = useState(0.5); // Estado para el volumen
    const [crashSound] = useSound(crash, { volume });
    const [gameOverSound] = useSound(gameOver, { volume });
    const [gameWonSound] = useSound(gameWon, { volume });

    const determineWinner = useCallback(() => {
        const winner = players.reduce((maxPlayer, currentPlayer) => {
          return currentPlayer.score > maxPlayer.score ? currentPlayer : maxPlayer;
        }, players[0]);
  
        return winner;
      }, [players]);

      const handleGameEnd = useCallback(() => {
        const winner = determineWinner();
        setGameState('finished');
        setCollisionMessage(`¡${winner.name} ha ganado el juego con ${winner.score} puntos!`);
      }, [determineWinner]);
  
      const spawnFlag = useCallback(() => {
          setFlag(getRandomPosition());
      }, []);  
 

  useEffect(() => {
    setNombreSala(sessionStorage.getItem("idRoom"));
    const userData = sessionStorage.getItem('userData');
  }, [roomId]);
  
  useEffect(() => {
    if (!nombreSala) return;
  
    const userData = sessionStorage.getItem('userData');
    const parsedUserData = userData ? JSON.parse(userData) : {};
    
    const newSocket = io("http://10.0.0.6:8085", {
      transports: ["websocket"],
      query: {
        room: nombreSala,
        nickName: parsedUserData.displayName,
        userId: parsedUserData.id
      }
    });
  
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log("Conectado al servidor en la sala:", nombreSala);
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log("Desconectado del servidor");
    });

    newSocket.on("tecla_presionada", (data) => {
      const { playerId, direction } = data;
  
      console.log("Recibida información actualizada", data);
      
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === playerId && isValidTurn(player.direction, direction)
            ? { ...player, direction: direction }
            : player
        )
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, [nombreSala]);

  const checkCollision = useCallback((x, y, playerId) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        setPlayers(prevPlayers =>
          prevPlayers.map(p =>
            p.id === playerId
              ? { ...p, isAlive: false, score: Math.max(0, p.score - DEATH_PENALTY) }
              : p
          )
        );
      }
      crashSound();
      return true;
    }
    return players.some(otherPlayer => {
      if (otherPlayer.id === playerId || !otherPlayer.isAlive) return false;
      return otherPlayer.trail.some(pos =>
        Math.floor(x) === Math.floor(pos.x) &&
        Math.floor(y) === Math.floor(pos.y)
      );
    });
  }, [players]);

  const movePlayer = useCallback((player) => {
    if (!player.isAlive) return player;

    const newPlayer = { ...player };
    let newX = player.x;
    let newY = player.y;

    switch (player.direction) {
      case 'up': newY -= player.speed; break;
      case 'down': newY += player.speed; break;
      case 'left': newX -= player.speed; break;
      case 'right': newX += player.speed; break;
    }

    if (checkCollision(newX, newY, player.id)) {
      newPlayer.isAlive = false;
      setCollisionMessage(`¡${player.name} ha chocado!`);
      newPlayer.score = Math.max(0, newPlayer.score - DEATH_PENALTY);
      
      const killerPlayer = players.find(p => 
        p.id !== player.id && 
        p.isAlive && 
        p.trail.some(pos => 
          Math.floor(newX) === Math.floor(pos.x) && 
          Math.floor(newY) === Math.floor(pos.y)
        )
      );
      
      if (killerPlayer) {
        setPlayers(prevPlayers => 
          prevPlayers.map(p => 
            p.id === killerPlayer.id 
              ? { ...p, score: p.score + KILL_POINTS } 
              : p
          )
        );
      }

      setTimeout(() => {
        const initialPos = getInitialPosition(player.id);
        setPlayers(prevPlayers =>
          prevPlayers.map(p => 
            p.id === player.id 
              ? { 
                  ...p, 
                  isAlive: true, 
                  x: initialPos.x, 
                  y: initialPos.y, 
                  trail: [], 
                  hasFlag: false 
                } 
              : p
          )
        );
      }, RESPAWN_TIME);
      
      return newPlayer;
    }

    // Capturar la bandera
    if (flag && Math.floor(newX) === Math.floor(flag.x) && Math.floor(newY) === Math.floor(flag.y)) {
      newPlayer.hasFlag = true;
      newPlayer.score += FLAG_POINTS; // Sumar puntos inmediatamente al capturar la bandera
      setFlag(null);
      console.log(`¡${newPlayer.name} ha capturado la bandera! Nuevo puntaje: ${newPlayer.score}`);
    }

    // Verificar si el jugador con la bandera ha regresado a su posición inicial
    if (newPlayer.hasFlag) {
      const initialPos = getInitialPosition(player.id);
      if (Math.abs(Math.floor(newX) - initialPos.x) <= 1 && 
          Math.abs(Math.floor(newY) - initialPos.y) <= 1) {
        newPlayer.score += FLAG_POINTS; // Sumar puntos adicionales por llevar la bandera a la base
        newPlayer.hasFlag = false;
        spawnFlag();
        console.log(`¡${newPlayer.name} ha llevado la bandera a su base! Nuevo puntaje: ${newPlayer.score}`);

        if (newPlayer.score >= WINNING_SCORE) {
          setGameState('finished');
          setCollisionMessage(`¡${newPlayer.name} ha ganado el juego!`);
        }
      }
    }
    
    newPlayer.x = newX;
    newPlayer.y = newY;
    newPlayer.trail = [...newPlayer.trail.slice(-TRAIL_LIMIT + 1), { x: Math.floor(newX), y: Math.floor(newY) }];
    return newPlayer;
}, [checkCollision, flag, spawnFlag, players]);

  const handleFlagCapture = (player) => {
    if (player.hasFlag) {
      player.score += FLAG_POINTS;
      player.hasFlag = false;
      spawnFlag(); // Generar una nueva bandera después de la captura
      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.id === player.id
            ? { ...p, score: player.score }
            : p
        )
      );
      if (player.score >= WINNING_SCORE) {
        setGameState('finished');
        setCollisionMessage(`¡${player.name} ha ganado el juego!`);
      }
    }
  };

  const handleKill = (killerId, victimId) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player => {
        if (player.id === killerId) {
          player.score += KILL_POINTS;
          if (player.score >= WINNING_SCORE) {
            setGameState('finished');
            setCollisionMessage(`¡${player.name} ha ganado el juego!`);
          }
        }
        return player;
      })
    );
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    
    spawnFlag();
    const flagInterval = setInterval(spawnFlag, FLAG_SPAWN_INTERVAL);
    
    return () => clearInterval(flagInterval);
  }, [gameState, spawnFlag]);

  //No borrar
  useEffect(() => {
    if (gameState !== 'playing') return;
  
    const updateGame = () => {
      setPlayers(prevPlayers => {
        const newPlayers = prevPlayers.map(movePlayer);
        // Verificar si alguien alcanzó el puntaje de victoria
        if (newPlayers.some(player => player.score >= WINNING_SCORE)) {
          const winner = newPlayers.find(player => player.score >= WINNING_SCORE);
          setGameState('finished');
          setCollisionMessage(`¡${winner.name} ha ganado el juego con ${winner.score} puntos!`);
        }          
        return newPlayers;
      });

      setTimeLeft(prev => {
        const newTime = prev <= 0 ? 0 : prev - 0.05;
        if (newTime <= 0) {
          handleGameEnd();
        }
        return newTime;
      });
    };
    
    gameLoopRef.current = window.setInterval(updateGame, 50);
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, movePlayer, timeLeft, handleGameEnd]);
  

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing') return;
      let playerId = null;
      let newDirection = null;
      switch (e.key.toLowerCase()) {
        //Player1
        case 'arrowup': playerId = '1'; newDirection = 'up'; break;
        case 'arrowdown': playerId = '1'; newDirection = 'down'; break;
        case 'arrowleft': playerId = '1'; newDirection = 'left'; break;
        case 'arrowright': playerId = '1'; newDirection = 'right'; break;
        //Player2
        case 'w': playerId = '2'; newDirection = 'up'; break;
        case 's': playerId = '2'; newDirection = 'down'; break;
        case 'a': playerId = '2'; newDirection = 'left'; break;
        case 'd': playerId = '2'; newDirection = 'right'; break;
        //Player3
        case 'i': playerId = '3'; newDirection = 'up'; break;
        case 'k': playerId = '3'; newDirection = 'down'; break;
        case 'j': playerId = '3'; newDirection = 'left'; break;
        case 'l': playerId = '3'; newDirection = 'right'; break;
        //Player4
        case '8': playerId = '4'; newDirection = 'up'; break;
        case '5': playerId = '4'; newDirection = 'down'; break;
        case '4': playerId = '4'; newDirection = 'left'; break;
        case '6': playerId = '4'; newDirection = 'right'; break;
        default:
          return;
      }
      if (
        playerId &&
        newDirection &&
        isValidTurn(players.find(p => p.id === playerId).direction, newDirection)
      ) {
        setPlayers(prevPlayers =>
          prevPlayers.map(player =>
            player.id === playerId ? { ...player, direction: newDirection } : player
          )
        );
        emitKeyPress(playerId, newDirection);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, players]);

  const emitKeyPress = (playerId, direction) => {
    if (socket && socket.connected) {
      socket.emit("presionar_tecla", { playerId: String(playerId), direction: String(direction) });
      console.log("Estoy presionando una tecla", { playerId, direction });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = Math.min(windowSize.width * 0.8, windowSize.height * 0.8);
    canvas.width = size;
    canvas.height = size;
    const cellSize = size / GRID_SIZE;

    // Fondo
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar la bandera
    if (flag) {
      ctx.fillStyle = '#FFD700'; // Color dorado para la bandera
      ctx.fillRect(flag.x * cellSize, flag.y * cellSize, cellSize, cellSize);
    }

    // Dibujar jugadores
    players.forEach(player => {
      if (!player.isAlive) return;
      
      // Dibujar trail
      ctx.fillStyle = player.color;
      player.trail.forEach(pos => {
        ctx.fillRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
      });

      // Dibujar jugador
      ctx.fillStyle = player.hasFlag ? '#FFD700' : player.color;
      ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
      drawPixelBike(ctx, player.x, player.y, player.direction, player.color, cellSize);
    });
  }, [players, flag, windowSize]);


  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
        <div className="text-center mb-4">
            <p className="text-white">Estado de conexión: {isConnected ? "Conectado" : "Desconectado"}</p>
            <p className="text-white">Sala actual: {nombreSala}</p>
        </div>
        <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {players.map((player) => (
                <div key={player.id} className={`flex items-center space-x-2 bg-gray-800 p-2 rounded-lg ${!player.isAlive ? 'opacity-50' : ''}`}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }} />
                    <span className="text-white font-bold">{player.name}</span>
                    <div className="flex space-x-2 text-sm">
                        <span className="text-yellow-400">Puntos: {player.score}</span>
                        <span className="text-yellow-400">T:{player.turbos}</span>
                        <span className="text-blue-400">J:{player.jumps}</span>
                        {player.hasFlag && <span className="text-yellow-400">🚩</span>}
                    </div>
                </div>
            ))}
        </div>
        <div className="relative">
            <canvas ref={canvasRef} className="rounded-lg shadow-2xl border-2 border-gray-700" />
            <div className="absolute top-4 right-4 bg-gray-800 p-2 rounded-lg">
                <Progress value={(timeLeft / GAME_DURATION) * 100} className="w-32 mb-2" />
                <div className="text-white text-center">
                    {`${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${Math.floor(timeLeft % 60).toString().padStart(2, '0')}`}
                </div>
            </div>
        </div>
        {gameState === 'finished' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75">
                <div className="text-white text-4xl font-bold mb-4">
                    {collisionMessage}
                </div>
                <div className="text-white text-xl mb-4">
                    Puntuaciones finales:
                    {players.sort((a, b) => b.score - a.score).map(player => (
                        <div key={player.id} className="flex items-center space-x-2 mt-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                            <span>{player.name}: {player.score} puntos</span>
                        </div>
                    ))}
                </div>
                <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600 mt-4">
                    Jugar de Nuevo
                </Button>
            </div>
        )}
        {collisionMessage && gameState !== 'finished' && (
            <div className="mt-4 p-2 bg-red-500 text-white rounded-lg">
                {collisionMessage}
            </div>
        )}
    </div>
);
}

export default CaptureTheFlag;
