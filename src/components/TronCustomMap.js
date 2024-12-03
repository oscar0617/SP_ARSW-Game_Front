import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import useSound from 'use-sound';
import crash from './music/crash.mp3'
import gameOver from './music/gameOver.mp3'
import gameWon from './music/gameWon.mp3'

const GRID_SIZE = 100;
const BORDER_OFFSET = 5;
const INITIAL_TURBOS = 3;
let INITIAL_JUMPS = 3;  //traer esto de configuraciones
const GAME_DURATION = 180;//traer esto de configuraciones
let BASE_SPEED = 0.5;   //traer esto de configuraciones
const TURBO_SPEED = 1;
const TURBO_DURATION = 5;
const JUMP_DISTANCE = 1;
let BOOST_ACTIVATED = true;
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
        BASE_SPEED = data.speed;
        BOOST_ACTIVATED = data.boost;
        console.log("saltos" + INITIAL_JUMPS);
        console.log("Speed" + BASE_SPEED);
        console.log("Turbo" + BOOST_ACTIVATED);
      })
}

const obstacles = [
  { x: 10, y: 10, width: 15, height: 15, type: 'building' },
  { x: 40, y: 20, width: 20, height: 3, type: 'road' },
  { x: 30, y: 35, width: 17, height: 17, type: 'building' },
  { x: 60, y: 50, width: 25, height: 25, type: 'park' },
  { x: 70, y: 70, width: 20, height: 20, type: 'building' },
  { x: 5, y: 60, width: 3, height: 30, type: 'road' },
  { x: 80, y: 10, width: 10, height: 40, type: 'building' },
  { x: 20, y: 80, width: 30, height: 3, type: 'road' }
];

const drawPixelBike = (ctx, x, y, direction, color, cellSize, isJumping, name) => {
  console.log('Drawing bike at:', { x, y, direction, color, cellSize }); // Debug
  ctx.save();
  ctx.translate(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);

  const rotationAngles = {
    'right': 0,
    'left': Math.PI,
    'up': -Math.PI / 2,
    'down': Math.PI / 2
  };
  ctx.rotate(rotationAngles[direction]);

  const pixelSize = cellSize / 4;

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

  bikeDesign.forEach((row, i) => {
    row.forEach((pixel, j) => {
      if (pixel !== 0) {
        switch (pixel) {
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

  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.restore();
};

const initialPlayers = [
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
function TronCityGame({ roomId }) {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef();
  const [socket, setSocket] = useState(null);
  const storedVolume = sessionStorage.getItem("volumeEffects");
  const [volume, setVolume] = useState(storedVolume ? parseFloat(storedVolume) : 0.5);
  const [crashSound] = useSound(crash, { volume });
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

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    setNombreSala(sessionStorage.getItem("idRoom"));
    const userData = sessionStorage.getItem('userData');
    console.log("Tron City Game initialized");

      //Cargar settings

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [roomId]);

  useEffect(() => {
    if (!nombreSala) return;

    const newSocket = io("http://10.0.0.6:8085", {
      transports: ["websocket"],
      query: { room: nombreSala }
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log("Connected to server in room:", nombreSala);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log("Disconnected from server");
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

  const isValidTurn = (currentDirection, newDirection) => {
    const oppositeDirections = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };
    return oppositeDirections[currentDirection] !== newDirection;
  };

  const isObstacle = (x, y) => {
    return obstacles.some(obs =>
      x >= obs.x && x < obs.x + obs.width &&
      y >= obs.y && y < obs.y + obs.height
    );
  };

  const getObstacleType = (x, y) => {
    const obstacle = obstacles.find(obs =>
      x >= obs.x && x < obs.x + obs.width &&
      y >= obs.y && y < obs.y + obs.height
    );
    return obstacle ? obstacle.type : null;
  };

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
          speed: BASE_SPEED + 0.1,
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
    // Check if player is out of bounds
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return true;

    // Check if player collides with an obstacle
    if (isObstacle(x, y)) {
      const obstacleType = getObstacleType(x, y);

      // Treat both "building" and "park" as collidable obstacles
      if (obstacleType === 'building' || obstacleType === 'park') {
        return true;
      } else if (obstacleType === 'road') {
        return false;
      }
    }

    const player = players.find(p => p.id === playerId);
    if (!player || player.isJumping) return false; 
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return true; // Colisión con el borde
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
      setCollisionMessage(`${player.name} has crashed!`);
      return newPlayer;
    }

    newPlayer.x = newX;
    newPlayer.y = newY;
    if(player.name != "disk"){newPlayer.trail = [...newPlayer.trail, { x: Math.floor(newX), y: Math.floor(newY) }];}
    return newPlayer;
  }, [checkCollision]);

  const sendWinnerPersistency = (numeroGanador) => {
    const userData = sessionStorage.getItem('userData');
    console.log(sessionStorage.getItem('idPlayer'));
    if (numeroGanador == sessionStorage.getItem('idPlayer')) {
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
            console.log(`Message sent to player: "${sessionStorage.getItem("displayName")}" successfully`);
          } else {
            alert("Error sending");
          }
        })
        .catch(error => {
          console.error("Error in send request", error);
          alert("Error sending");
        });
    } else {
      console.log("Not sending anything because I didn't win");
    }
  }

  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateGame = () => {
      setPlayers(prevPlayers => {
        const newPlayers = prevPlayers.map(movePlayer);
        const alivePlayers = newPlayers.filter(p => p.isAlive);
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
  }, [gameState, players]);

  const emitKeyPress = (playerId, direction) => {
    if (socket && socket.connected) {
      socket.emit("presionar_tecla", { playerId: String(playerId), direction: String(direction) });
      console.log("Pressing a key", { playerId, direction });
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

    // Draw the road background
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw buildings
    drawBuildings(ctx, cellSize);
    
    // Draw roads
    drawRoads(ctx, cellSize);

    // Draw parks
    drawParks(ctx, cellSize);

    // Draw player trails and current positions
    players.forEach(player => {
      if (!player.isAlive) return;
      ctx.fillStyle = player.color;
      player.trail.forEach(pos => {
        ctx.fillRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
      });
      ctx.fillStyle = player.isTurboActive ? '#FFFFFF' : player.color;
      ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
      drawPixelBike(ctx, player.x, player.y, player.direction, player.color, cellSize, player.isJumping, player.name);
    });
  }, [players, windowSize, obstacles]);

  const drawBuildings = (ctx, cellSize) => {
    obstacles.filter(obs => obs.type === 'building').forEach(obs => {
      ctx.fillStyle = '#34495e';
      ctx.fillRect(
        obs.x * cellSize,
        obs.y * cellSize,
        obs.width * cellSize,
        obs.height * cellSize
      );
      // Add windows
      ctx.fillStyle = '#f1c40f';
      for (let i = 0; i < obs.width; i += 2) {
        for (let j = 0; j < obs.height; j += 2) {
          if (Math.random() > 0.5) {
            ctx.fillRect(
              (obs.x + i) * cellSize + 1,
              (obs.y + j) * cellSize + 1,
              cellSize - 2,
              cellSize - 2
            );
          }
        }
      }
    });
  };

  const drawRoads = (ctx, cellSize) => {
    obstacles.filter(obs => obs.type === 'road').forEach(obs => {
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(
        obs.x * cellSize,
        obs.y * cellSize,
        obs.width * cellSize,
        obs.height * cellSize
      );
      // Add road markings
      ctx.strokeStyle = '#f1c40f';
      ctx.setLineDash([cellSize, cellSize]);
      ctx.beginPath();
      if (obs.width > obs.height) {
        ctx.moveTo(obs.x * cellSize, (obs.y + obs.height / 2) * cellSize);
        ctx.lineTo((obs.x + obs.width) * cellSize, (obs.y + obs.height / 2) * cellSize);
      } else {
        ctx.moveTo((obs.x + obs.width / 2) * cellSize, obs.y * cellSize);
        ctx.lineTo((obs.x + obs.width / 2) * cellSize, (obs.y + obs.height) * cellSize);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });
  };

  const drawParks = (ctx, cellSize) => {
    obstacles.filter(obs => obs.type === 'park').forEach(obs => {
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(
        obs.x * cellSize,
        obs.y * cellSize,
        obs.width * cellSize,
        obs.height * cellSize
      );
      // Add trees
      ctx.fillStyle = '#27ae60';
      for (let i = 0; i < obs.width; i += 2) {
        for (let j = 0; j < obs.height; j += 2) {
          if (Math.random() > 0.7) {
            ctx.beginPath();
            ctx.arc(
              (obs.x + i + 0.5) * cellSize,
              (obs.y + j + 0.5) * cellSize,
              cellSize / 2,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }
    });
  };

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

  return React.createElement('div', { className: "w-screen h-screen flex flex-col items-center justify-center bg-gray-900 p-4" },
    React.createElement('div', { className: "text-center mb-4" },
      React.createElement('p', { className: "text-white" }, `Connection status: ${isConnected ? "Connected" : "Disconnected"}`),
      React.createElement('p', { className: "text-white" }, `Current room: ${nombreSala}`)
    ),
    React.createElement('div', { className: "w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-4" },
      players.filter(player => player.name !== "disk").map((player) => (
        React.createElement('div', { key: player.id, className: `flex items-center space-x-2 bg-gray-800 p-2 rounded-lg ${!player.isAlive ? 'opacity-50' : ''}` },
          React.createElement('div', { className: "w-4 h-4 rounded-full", style: { backgroundColor: player.color } }),
          React.createElement('span', { className: "text-white font-bold" }, player.name),
          React.createElement('div', { className: "flex space-x-2 text-sm" },
            React.createElement('span', { className: "text-yellow-400" }, `T:${player.turbos}`),
            React.createElement('span', { className: "text-blue-400" }, `J:${player.jumps}`)
          )
        )
      ))
    ),
    React.createElement('div', { className: "relative" },
      React.createElement('canvas', { ref: canvasRef, className: "rounded-lg shadow-2xl border-2 border-gray-700" }),
      React.createElement('div', { className: "absolute bottom-4 right-4 bg-gray-800 p-2 rounded-lg text-white" },
        `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${Math.floor(timeLeft % 60).toString().padStart(2, '0')}`
      )
    ),
    gameState === 'finished' && React.createElement('div', { className: "absolute inset-0 flex items-center justify-center bg-black bg-opacity-75" },
      React.createElement('div', { className: "text-white text-4xl font-bold mb-4" }, "Game Over!"),
      React.createElement('button', {
        onClick: () => setGameState('playing'),
        className: "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
      }, "Play Again")
    ),
    collisionMessage && React.createElement('div', { className: "mt-4 p-2 bg-red-500 text-white rounded-lg" }, collisionMessage)
  );
}


export default TronCityGame;