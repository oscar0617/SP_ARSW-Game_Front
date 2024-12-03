import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Room {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
}

interface UserData {
  displayName: string;
  userPrincipalName: string;
  id: string;
}

export default function RoomList() {
  
  var [players, setPlayers] = useState([0,0,0,0]);
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', name: 'Sala 1', players: players[0], maxPlayers: 4 },
    { id: '2', name: 'Sala 2', players: players[1], maxPlayers: 4 },
    { id: '3', name: 'Sala 3', players: players[2], maxPlayers: 4 },
    { id: '4', name: 'Sala 4', players: players[3], maxPlayers: 4 },
  ])
  useEffect(() => {
    setRooms([
      { id: '1', name: 'Sala 1', players: players[0], maxPlayers: 4 },
      { id: '2', name: 'Sala 2', players: players[1], maxPlayers: 4 },
      { id: '3', name: 'Sala 3', players: players[2], maxPlayers: 4 },
      { id: '4', name: 'Sala 4', players: players[3], maxPlayers: 4 },
    ]);
  }, [players]);


  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    // Primero intentamos obtener los datos del sessionStorage
    const storedUserData = sessionStorage.getItem('userData');
    
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
      // Si hay datos en la URL, actualizamos el storage
      checkAndUpdateFromURL();
    } else {
      // Si no hay datos en storage, intentamos obtenerlos de la URL
      checkAndUpdateFromURL();
    }

    // Limpiamos la URL después de guardar los datos
    cleanURL();
  }, []);

  const checkAndUpdateFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const displayName = params.get('displayName');
    const userPrincipalName = params.get('userPrincipalName');
    const id = params.get('id');

    if (displayName && userPrincipalName && id) {
      const newUserData = {
        displayName,
        userPrincipalName,
        id
      };
      
      // Guardamos en el estado y en sessionStorage
      setUserData(newUserData);
      sessionStorage.setItem('userData', JSON.stringify(newUserData));
    }
  };

  const cleanURL = () => {
    // Limpiamos la URL sin recargar la página
    if (window.history.pushState) {
      const newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({ path: newURL }, '', newURL);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (userData) {
      window.location.href = `/sala/${roomId}`;
      try {
        sessionStorage.setItem("idRoom", roomId);
        const playerStorage = sessionStorage.getItem("userData");
        if(playerStorage){
          var playerName = JSON.parse(playerStorage).displayName
          const res = await fetch(`http://10.0.0.4:8080/lobby/v1/join/${playerName}/${roomId}`, {
            method: 'POST'
          });
          console.log(res);
        }
      } catch (error) {
        console.error('Error en la solicitud:', error);
      }

    } else {
      alert('Necesitas iniciar sesión para unirte a una sala');
    }
  }

  const handleBackToMenu = () => {
    window.location.href = "/";
  }

  const handleLogout = () => {
    sessionStorage.removeItem('userData');
    setUserData(null);
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-purple-700 rounded-3xl relative shadow-2xl p-8">
        {userData && (
          <div className="mb-4 text-yellow-300 flex justify-between items-center">
            <p>Bienvenido, {userData.displayName}</p>
            <Button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm"
            >
              Cerrar Sesión
            </Button>
          </div>
        )}

        <h1 className="text-yellow-400 text-4xl font-bold mb-8 text-center">SALAS DISPONIBLES</h1>
        
        <div className="mb-6">
          <Input 
            type="text" 
            placeholder="Buscar sala..." 
            className="w-full bg-purple-600 text-white placeholder-purple-300 border-none"
          />
        </div>

        <div className="space-y-4">
          {rooms.map((room) => (
            <div key={room.id} className="bg-purple-800 rounded-lg p-4 flex justify-between items-center">
              <div>
                <h2 className="text-yellow-300 text-xl font-semibold">{room.name}</h2>
                <p className="text-purple-300">Jugadores: {room.players}/{room.maxPlayers}</p>
              </div>
              <Button 
                onClick={() => joinRoom(room.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={room.players === room.maxPlayers}
              >
                {room.players === room.maxPlayers ? 'LLENA' : 'UNIRSE'}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-between">
          <Button 
            onClick={handleBackToMenu}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            VOLVER AL MENÚ
          </Button>
          <Button 
            onClick={() => window.location.href = '/crear-sala'} 
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            CREAR SALA
          </Button>
        </div>
      </div>
    </div>
  )
}