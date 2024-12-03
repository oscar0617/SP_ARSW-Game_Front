import { useEffect } from 'react'
import { redirect, useParams } from 'react-router-dom';

import GameRoom from '../../components/GameRoom'

export default function SalaPage() {
  const { roomId } = useParams()

  if (!roomId) {
    throw redirect("/salas")
  }

  useEffect(() => {
    console.log(`Cargando la sala con ID: ${roomId}`);
  }, [roomId])

  return <GameRoom roomId={roomId} />
}

