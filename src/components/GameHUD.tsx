import { useState, useEffect } from 'react'

interface Player {
  id: string;
  name: string;
  color: string;
  turbos: number;
  jumps: number;
}

export default function GameHUD() {
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Player 1', color: '#FF0000', turbos: 3, jumps: 3 },
    { id: '2', name: 'Player 2', color: '#00FF00', turbos: 3, jumps: 3 },
    { id: '3', name: 'Player 3', color: '#0000FF', turbos: 3, jumps: 3 },
    { id: '4', name: 'Player 4', color: '#FFFF00', turbos: 3, jumps: 3 },
  ])
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-900 bg-opacity-75 text-white p-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          {players.map((player) => (
            <div key={player.id} className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }}></div>
              <span className="font-bold">{player.name}</span>
              <span className="text-yellow-400">T:{player.turbos}</span>
              <span className="text-blue-400">J:{player.jumps}</span>
            </div>
          ))}
        </div>
        <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
      </div>
    </div>
  )
}