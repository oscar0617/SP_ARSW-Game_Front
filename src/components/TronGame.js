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
let INITIAL_JUMPS = 3; 
const GAME_DURATION = 180;
let BASE_SPEED = 0.5;   
const TURBO_SPEED = 1;
const TURBO_DURATION = 5;
const JUMP_DISTANCE = 1;
let BOOST_ACTIVATED = true;
let BOOST_SPEED = 1;
let NUMBER_DISK = 1;

const fetchSettings = () =>{
  fetch(`http://10.0.0.4:8080/lobby/v1/settings/${sessionStorage.getItem("idRoom")}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error");
        }
        return response.json();
      })
      .then((data) => {
        INITIAL_JUMPS = data.maxJumps;
        BOOST_SPEED = data.speed;
        BOOST_ACTIVATED = data.boost;
        console.log("saltos" + INITIAL_JUMPS);
        console.log("Speed" + BOOST_SPEED);
        console.log("Turbo" + BOOST_ACTIVATED);
      })
}


const drawPixelBike = (ctx, x, y, direction, color, cellSize, isJumping, name) => {
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
  //// 0 = transparente, 1 = color principal, 2 = negro, 3 = rojo, 4 = blanco
  var bikeDesign = [
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

  const bikeDesignNoJump = [
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

  const diskDesign = [
    [0, 0, 0, 2, 2, 2, 0, 0, 0],
    [0, 0, 2, 1, 1, 2, 0, 0, 0],
    [0, 2, 1, 1, 1, 2, 0, 0, 0],
    [2, 1, 1, 2, 2, 1, 2, 2, 0],
    [2, 1, 1, 2, 2, 1, 2, 2, 0],
    [2, 2, 1, 2, 2, 1, 2, 2, 0],
    [0, 2, 2, 1, 1, 2, 0, 0, 0],
    [0, 0, 2, 1, 1, 2, 0, 0, 0],
    [0, 0, 0, 2, 2, 2, 0, 0, 0]
  ];

  const bikeDesignJump =[
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3],
    [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [4, 4, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [4, 4, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [4, 4, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [4, 4, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3],
    [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3]
  ];
  
  if(isJumping){bikeDesign = bikeDesignJump;}
  else if(name == 'disk'){bikeDesign = diskDesign;}
  else{bikeDesign = bikeDesignNoJump;}
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


var initialPlayers = [
  {
    id: '1',
    name: sessionStorage.getItem('playersInfo') 
    ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '1')?.name || 'Player 1'
    : 'Player 1',
    color: sessionStorage.getItem('playersInfo') 
      ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '1')?.color || '#FF0000'
      : '#FF0000',
    x: BORDER_OFFSET,
    y: BORDER_OFFSET,
    direction: 'right',
    turbos: INITIAL_TURBOS,
    jumps: INITIAL_JUMPS,
    trail: [{ x: BORDER_OFFSET, y: BORDER_OFFSET }],
    speed: BASE_SPEED,
    isAlive: true,
    isTurboActive: false,
    turboEndTime: 0,
    isJumping: false
  },
  {
    id: '2',
    name: sessionStorage.getItem('playersInfo') 
    ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '2')?.name || 'Player 2'
    : 'Player 2',
    color: sessionStorage.getItem('playersInfo') 
      ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '2')?.color || '#00FF00'
      : '#00FF00',
    x: GRID_SIZE - BORDER_OFFSET,
    y: BORDER_OFFSET,
    direction: 'left',
    turbos: INITIAL_TURBOS,
    jumps: INITIAL_JUMPS,
    trail: [{ x: GRID_SIZE - BORDER_OFFSET, y: BORDER_OFFSET }],
    speed: BASE_SPEED,
    isAlive: true,
    isTurboActive: false,
    turboEndTime: 0,
    isJumping: false
  },
  {
    id: '3',
    name: sessionStorage.getItem('playersInfo') 
    ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '3')?.name || 'Player 3'
    : 'Player 3',
    color: sessionStorage.getItem('playersInfo') 
      ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '3')?.color || '#0000FF'
      : '#0000FF',
    x: BORDER_OFFSET,
    y: GRID_SIZE - BORDER_OFFSET,
    direction: 'right',
    turbos: INITIAL_TURBOS,
    jumps: INITIAL_JUMPS,
    trail: [{ x: BORDER_OFFSET, y: GRID_SIZE - BORDER_OFFSET }],
    speed: BASE_SPEED,
    isAlive: true,
    isTurboActive: false,
    turboEndTime: 0,
    isJumping: false
  },
  {
    id: '4',
    name: sessionStorage.getItem('playersInfo') 
    ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '4')?.name || 'Player 4'
    : 'Player 4',
    color: sessionStorage.getItem('playersInfo') 
      ? JSON.parse(sessionStorage.getItem('playersInfo')).find(p => p.id === '4')?.color || '#FFFF00'
      : '#FFFF00',
    x: GRID_SIZE - BORDER_OFFSET,
    y: GRID_SIZE - BORDER_OFFSET,
    direction: 'left',
    turbos: INITIAL_TURBOS,
    jumps: INITIAL_JUMPS,
    trail: [{ x: GRID_SIZE - BORDER_OFFSET, y: GRID_SIZE - BORDER_OFFSET }],
    speed: BASE_SPEED,
    isAlive: true,
    isTurboActive: false,
    turboEndTime: 0,
    isJumping: false
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

function TronGame({ roomId }) {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef();
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState(initialPlayers);
  const [gameState, setGameState] = useState('playing');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [collisionMessage, setCollisionMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [nombreSala, setNombreSala] = useState(roomId || sessionStorage.getItem("idRoom") || "");
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const storedVolume = sessionStorage.getItem("volumeEffects");
  const [volume, setVolume] = useState(storedVolume ? parseFloat(storedVolume) : 0.5);
  const [crashSound] = useSound(crash, { volume });
  const [gameOverSound] = useSound(gameOver, { volume });
  const [gameWonSound] = useSound(gameWon, { volume });


  useEffect(() => {
    setNombreSala(sessionStorage.getItem("idRoom"));
    const userData = sessionStorage.getItem('userData');
  }, [roomId]);

  useEffect(() => {
    fetchSettings();
  }, []);
  
  useEffect(() => {
    if (!nombreSala) return;

    const newSocket = io("http://10.0.0.6:8085", {
      transports: ["websocket"], 
      query: { room: nombreSala }
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
      if(direction === 'shift'){
        activateTurbo(playerId);
      }
      else if(direction === ' '){
        jumpPlayer(playerId);
      }
      else if(direction === 'disk'){
        disk(playerId);
      }
      else{
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.id === playerId && isValidTurn(player.direction, direction)
              ? { ...player, direction: direction }
              : player
          )
        );
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [nombreSala]);

  const jumpPlayer = (idPlayer) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === idPlayer ? { ...player, isJumping: true } : player
      )
    );
    setTimeout(() => {
      deactivateJump(idPlayer);
    }, JUMP_DISTANCE * 1000);
  };

  const disk = (idPlayer) => {
    setPlayers((prevPlayers) => {
      const player = prevPlayers.find((p) => p.id === idPlayer);
      if (player && NUMBER_DISK > -1) {
        let currentX = Math.floor(player.x);
        let currentY = Math.floor(player.y);
        if(player.direction === 'right'){currentX += 2;}
        if(player.direction === 'left'){currentX -= 2;}
        if(player.direction === 'up'){currentY -= 2;}
        if(player.direction === 'down'){currentY += 2;}
        const newDiskPlayer = {
          id: 'disk' + (prevPlayers.length + 1),
          name: 'disk',
          color: player.color,
          x: currentX,
          y: currentY,
          direction: player.direction,
          turbos: 0,
          jumps: 0,
          trail: [],
          speed: BASE_SPEED + 1,
          isAlive: true,
          isTurboActive: false,
          isJumping: false,
        };
        NUMBER_DISK = NUMBER_DISK - 1;
        return [...prevPlayers, newDiskPlayer];
      }
      return prevPlayers;
    });
  };
  
   


const deactivateJump = (playerId) => {
  setPlayers((prevPlayers) =>
    prevPlayers.map((player) => {
      if (player.id === playerId && player.isJumping) {
        return {
          ...player,
          isJumping: false,
        };
      }
      return player;
    })
  );
};


const checkCollision = useCallback((x, y, playerId) => {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
    setPlayers(prevPlayers => {
      return prevPlayers.map(player =>
        player.id === playerId ? { ...player, isAlive: false } : player
      );
    });
    return true;
  }

  const player = players.find(p => p.id === playerId);
  if (!player || player.isJumping) return false; 

  return players.some((otherPlayer) => {
    if (otherPlayer.id === playerId || !otherPlayer.isAlive) return false; 

    if (Math.floor(x) === Math.floor(otherPlayer.x) && Math.floor(y) === Math.floor(otherPlayer.y) && player.name !== 'disk') {
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (p.id === playerId || p.id === otherPlayer.id) {
            return { ...p, isAlive: false }; 
          }
          return p;
        });
      });
      setCollisionMessage(`¡${player.name} y ${otherPlayer.name} chocaron!`);
      crashSound();
      return true;
    }
    if (player.name === 'disk' && otherPlayer.isAlive) {
      if (Math.floor(x) === Math.floor(otherPlayer.x) && Math.floor(y) === Math.floor(otherPlayer.y)) {
        setPlayers(prevPlayers => {
          return prevPlayers.map(p => {
            if (p.id === otherPlayer.id) {
              return { ...p, isAlive: false }; 
            }
            return p;
          });
        });
        setCollisionMessage(`¡El disco de ${player.name} ha eliminado a ${otherPlayer.name}!`);
        crashSound();
        return true;
      }
    }
    const collidedWithTrail = otherPlayer.trail.some(pos =>
      Math.floor(x) === Math.floor(pos.x) && Math.floor(y) === Math.floor(pos.y)
    );

    if (collidedWithTrail && player.name !== 'disk') {
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (p.id === playerId) {
            return { ...p, isAlive: false }; 
          }
          return p;
        });
      });
      setCollisionMessage(`¡${player.name} ha chocado contra el rastro de ${otherPlayer.name}!`);
      crashSound();
      return true;
    }

    return false;
  });
}, [players, crashSound]);

  
const movePlayer = useCallback(
  (player) => {
    if (!player.isAlive) return player;

    const newPlayer = { ...player };
    let newX = player.x;
    let newY = player.y;

    // Actualizar posición según dirección
    switch (player.direction) {
      case 'up':
        newY -= player.speed;
        break;
      case 'down':
        newY += player.speed;
        break;
      case 'left':
        newX -= player.speed;
        break;
      case 'right':
        newX += player.speed;
        break;
      default:
        break;
    }

    if (checkCollision(newX, newY, player.id)) {
      newPlayer.isAlive = false; 
      setCollisionMessage(`¡${player.name} ha chocado!`);
      crashSound();
      return newPlayer;
    }

    newPlayer.x = newX;
    newPlayer.y = newY;

    if (player.name !== 'disk') {
      newPlayer.trail = [...newPlayer.trail, { x: Math.floor(newX), y: Math.floor(newY) }];
    }

    return newPlayer;
  },
  [checkCollision, crashSound]
);



  const sendWinnerPersistency =(numeroGanador)=>{
    const userData = sessionStorage.getItem('userData');
    console.log(sessionStorage.getItem('idPlayer'));
    if(numeroGanador == sessionStorage.getItem('idPlayer')){
      var nombrejugador = JSON.parse(userData).displayName;
      const mensajeData = { nombrejugador };
      fetch(`http://10.0.0.5:8080/player/v1/score/${nombrejugador}`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(mensajeData) 
      })

      .then(response => {
        if (response.ok) {
          console.log(`Mensaje enviado al jugador: "${sessionStorage.getItem("displayName")}" exitosamente`);
          gameWonSound();
        } else {
          alert("Error al enviar");
        }
      })
      .catch(error => {
        console.error("Error en la solicitud de envío", error);
        alert("Error al enviar");
      });
    }else{
      gameOverSound();
      console.log("no envio nada pq no gane");
    }
  }

  //No borrar
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateGame = () => {
      setPlayers(prevPlayers => {
        const newPlayers = prevPlayers.map(movePlayer);
        const alivePlayers = newPlayers.filter(p => p.isAlive);
        console.log(alivePlayers.length, "a")
        if (alivePlayers.length === 0) {
          setGameState('finished');
          setCollisionMessage('¡Empate!');
          console.log("empate");
        }
        if (alivePlayers.length === 1){
          setGameState('finished');
          setCollisionMessage(alivePlayers.length === 1 ? `¡${alivePlayers[0].name} es el ganador!` : '¡Empate!');
          console.log("id ganador "+alivePlayers[0].id);
          sendWinnerPersistency(alivePlayers[0].id);
        }
        return newPlayers;
      });
      setTimeLeft(prev => prev <= 0 ? 0 : prev - 0.05);
      if (timeLeft <= 0) setGameState('finished');
    };
    gameLoopRef.current = window.setInterval(updateGame, 50);
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, movePlayer, timeLeft]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing') return;
      let playerId = null;
      let newDirection = null;
      switch (e.key.toLowerCase()) {
        case 'w': playerId = sessionStorage.getItem('idPlayer'); newDirection = 'up'; break;
        case 's': playerId = sessionStorage.getItem('idPlayer'); newDirection = 'down'; break;
        case 'a': playerId = sessionStorage.getItem('idPlayer'); newDirection = 'left'; break;
        case 'd': playerId = sessionStorage.getItem('idPlayer'); newDirection = 'right'; break;
        case ' ': playerId = sessionStorage.getItem('idPlayer'); newDirection = ' '; INITIAL_JUMPS = INITIAL_JUMPS - 1; break;
        case 'shift': playerId = sessionStorage.getItem('idPlayer'); newDirection = 'shift'; break;
        case 'q': playerId = sessionStorage.getItem('idPlayer'); newDirection = 'disk'; break;
        default:
          return;
      }
      if (
        //playerId &&
        newDirection != 'shift' && newDirection != ' ' && newDirection != 'disk' &&
        isValidTurn(players.find(p => p.id === playerId).direction, newDirection)
      ) {
        setPlayers(prevPlayers =>
          prevPlayers.map(player =>
            player.id === playerId ? { ...player, direction: newDirection } : player
          )
        );
        emitKeyPress(playerId, newDirection);
      }
      if(newDirection == ' ' && INITIAL_JUMPS > -1){
        emitKeyPress(playerId, newDirection);
      }
      if(newDirection == 'shift' && BOOST_ACTIVATED){
        emitKeyPress(playerId, newDirection);
      }
      if(newDirection == 'disk'){
        emitKeyPress(playerId, newDirection);
      }
    };

    

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState,  players]);

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

    // Dibujar rastros y motos
    players.forEach(player => {
      if (!player.isAlive) return;
      
      // Dibujar rastro con efecto de brillo
      ctx.shadowBlur = 10;
      ctx.shadowColor = player.color;
      ctx.fillStyle = player.color + '40';
      player.trail.forEach(pos => {
        ctx.fillRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
      });
      
      // Último segmento del rastro más brillante
      ctx.fillStyle = player.color + '80';
      player.trail.slice(-1).forEach(pos => {
        ctx.fillRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
      });
      
      // Dibujar la moto en pixel art
      drawPixelBike(ctx, player.x, player.y, player.direction, player.color, cellSize, player.isJumping, player.name);
    });
  }, [players, windowSize]);

  const activateTurbo = (playerId) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => {
        if (player.id === playerId && !player.isTurboActive && player.turbos > 0) {
          return {
            ...player,
            speed: TURBO_SPEED, // Aumenta la velocidad
            isTurboActive: true,
            turbos: player.turbos - 1, // Consume un turbo
            turboEndTime: Date.now() + TURBO_DURATION * 1000, // Calcula el tiempo de finalización
          };
        }
        return player;
      })
    );
    setTimeout(() => {
      deactivateTurbo(playerId);
    }, TURBO_DURATION * 1000);
  };

  const deactivateTurbo = (playerId) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => {
        if (player.id === playerId && player.isTurboActive) {
          return {
            ...player,
            speed: BASE_SPEED, 
            isTurboActive: false, 
          };
        }
        return player;
      })
    );
  };
  
  

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="text-center mb-4">
        <p className="text-white">Estado de conexión: {isConnected ? "Conectado" : "Desconectado"}</p>
        <p className="text-white">Sala actual: {nombreSala}</p>
      </div>
      <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {players.map(player => (
    // Añadimos la condición para no mostrar el "disk"
    player.name !== "disk" && (
      <div 
        key={player.id} 
        className={`flex items-center space-x-2 p-2 rounded-lg ${!player.isAlive ? 'opacity-50' : ''}`}
        style={{
          backgroundColor: player.color + '20',
          borderColor: player.color,
          borderWidth: '2px'
        }}
      >
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }} />
        <span className="text-white font-bold">{player.name}</span>
        <div className="flex space-x-2 text-sm">
          <span className="text-yellow-400">T:{player.turbos}</span>
          <span className="text-blue-400">J:{player.jumps}</span>
        </div>
      </div>
    )
  ))}
      </div>
      <div className="relative">
        <canvas ref={canvasRef} className="rounded-lg shadow-2xl border-2 border-gray-700" />
        <div className="absolute top-4 right-4 bg-gray-800 p-2 rounded-lg">
          <Progress value={(timeLeft / GAME_DURATION) * 100} className="w-32 mb-2" />
          <div className="text-white text-center">{`${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${Math.floor(timeLeft % 60).toString().padStart(2, '0')}`}</div>
        </div>
      </div>
      {gameState === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-4xl font-bold mb-4">¡Juego Terminado!</div>
          <Button onClick={() => setGameState('playing')} className="bg-blue-500 hover:bg-blue-600 mt-4">Jugar de Nuevo</Button>
        </div>
      )}
      {collisionMessage && (
        <div className="mt-4 p-2 bg-red-500 text-white rounded-lg">
          {collisionMessage}
        </div>
      )}
    </div>
  );
}

export default TronGame;