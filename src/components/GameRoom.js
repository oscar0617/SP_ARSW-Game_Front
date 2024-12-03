import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import io from 'socket.io-client';
import useSound from 'use-sound';
import preGame from './music/preGame.mp3';

const colorOptions = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFA500', '#800080'
];

function App({ roomId }) {
  const [nombreSala, setNombreSala] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState([
    { id: '1', name: 'Player 1', color: '#FF0000', ready: false },
    { id: '2', name: 'Player 2', color: '#00FF00', ready: false },
    { id: '3', name: 'Player 3', color: '#0000FF', ready: false },
    { id: '4', name: 'Player 4', color: '#FFFF00', ready: false },
  ]);
  const [anyPlayerReady, setAnyPlayerReady] = useState(false); // Nuevo estado

  const [countdown, setCountdown] = useState(null);
  const [preGameSound, { sound }] = useSound(preGame, { volume: 0 });
  const storedVolume = parseFloat(sessionStorage.getItem("volume")) || 0.5;
  const [volume, setVolume] = useState(storedVolume);

  useEffect(() => {
    if (sound) {
      sound.volume(volume);
    }
  }, [sound, volume]);

  useEffect(() => {
    preGameSound();
    return () => {
      if (sound) {
        sound.stop();
      }
    };
  }, [preGameSound, sound]);

  useEffect(() => {
    setNombreSala(roomId);
    const userData = sessionStorage.getItem('userData');
    setNombreUsuario(userData ? JSON.parse(userData).displayName || "prueba" : "prueba");
  }, [roomId]);

  useEffect(() => {
    if (nombreSala) {
      const newSocket = io('http://10.0.0.6:8085', {
        transports: ['websocket'],
        query: { room: nombreSala }
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log("Conectado al servidor en la sala:", nombreSala);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log("Desconectado del servidor");
        setIsConnected(false);
      });

      newSocket.on("estado_actualizado", (data) => {
        setPlayers((prevPlayers) =>
          prevPlayers.map(player =>
            player.id === data.id ? { ...player, ready: data.ready, name: data.nombreUsuario } : player
          )
        );
      });

      newSocket.on("color_presionado", (data) => {
        setPlayers((prevPlayers) =>
          prevPlayers.map(player =>
            player.id === data.id ? { ...player, color: data.color } : player
          )
        );
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [nombreSala]);

  const toggleReady = (id) => {
    const updatedPlayers = players.map(player =>
      player.id === id ? { ...player, ready: true } : player
    );
    setPlayers(updatedPlayers);
    setAnyPlayerReady(true); // Indicar que ya hay un jugador listo

    if (socket && socket.connected) {
      const playerData = { nombreSala, nombreUsuario, id, ready: true };
      socket.emit("enviar_listo", playerData);
    } else {
      console.log("Socket no está conectado");
    }
    sessionStorage.setItem('idPlayer', id);
  };

  const changeColor = (id, newColor) => {
    if (players.some(player => player.color === newColor)) {
      alert("Este color ya está en uso. Por favor, elige otro.");
      return;
    }
    setPlayers(players.map(player =>
      player.id === id ? { ...player, color: newColor } : player
    ));

    if (socket && socket.connected) {
      const colorData = { nombreSala, id, color: newColor };
      socket.emit("cambiar_color", colorData);
    }
  };

  useEffect(() => {
    if (players.every(player => player.ready) && countdown === null) {
      setCountdown(5);
    }
    sessionStorage.setItem('playersInfo', JSON.stringify(players));
  }, [players, countdown]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      fetch(`http://10.0.0.4:8080/lobby/v1/map/${sessionStorage.getItem("idRoom")}`)
        .then((response) => response.json())
        .then((data) => {
          window.location.href = `/game/${data}`; 
        })
        .catch((error) => console.error("Error fetching map:", error));
    }
  }, [countdown, roomId]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-purple-700 rounded-3xl relative shadow-2xl p-8">
        <h1 className="text-yellow-400 text-4xl font-bold mb-8 text-center">SALA DE JUEGO</h1>
        <div className="text-center mb-4">
          <p className="text-white">Estado de conexión: {isConnected ? "Conectado" : "Desconectado"}</p>
          <p className="text-white">Sala actual: {nombreSala}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 mb-8">
          {players.map((player) => (
            <div key={player.id} className="bg-purple-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border-2 ${player.color === color ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => changeColor(player.id, color)}
                      disabled={anyPlayerReady} // Deshabilitar cambios si alguien está listo
                    />
                  ))}
                </div>
                <div className="ml-4">
                  <h2 className="text-white text-xl font-semibold">{player.name}</h2>
                  <p className="text-purple-300">Color: {player.color}</p>
                </div>
              </div>
              <Button
                onClick={() => toggleReady(player.id)}
                className={`${player.ready ? 'bg-green-500' : 'bg-red-500'} text-white`}
                disabled={anyPlayerReady || player.ready} // Deshabilitar si alguien ya está listo
              >
                {player.ready ? 'LISTO' : 'NO LISTO'}
              </Button>
            </div>
          ))}
        </div>
        {countdown !== null && (
          <div className="text-center">
            <p className="text-white text-2xl mb-4">El juego comenzará en:</p>
            <p className="text-yellow-400 text-6xl font-bold">{countdown}</p>
          </div>
        )}
        <div className="mt-8 flex justify-between">
          <Button onClick={() => window.location.href = '/salas'} className="bg-red-500 hover:bg-red-600 text-white">
            ABANDONAR SALA
          </Button>
          <Button onClick={() => window.location.href = `/spectate/${roomId}`} className="bg-blue-500 hover:bg-blue-600 text-white">
            MODO ESPECTADOR
          </Button>
          <Button onClick={() => window.open(`/sala/${roomId}/settings`, '_blank', 'width=800,height=600')} className="bg-yellow-500 hover:bg-yellow-600 text-white">
            AJUSTES DEL JUEGO
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
