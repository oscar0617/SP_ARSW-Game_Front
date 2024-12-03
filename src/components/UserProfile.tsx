import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Camera, LogOut } from 'lucide-react'

interface UserData {
  name: string;
  photo: string;
  xp: number;
  level: number;
}

export default function UserProfile() {
  const [userData, setUserData] = useState<UserData>({
    name: "TronMaster",
    photo: "/placeholder.svg?height=100&width=100",
    xp: 7500,
    level: 15
  })

  const xpToNextLevel = 10000 // Ejemplo: 10000 XP para subir de nivel
  const progress = (userData.xp / xpToNextLevel) * 100

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUserData(prev => ({ ...prev, photo: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogout = () => {
    // Aquí iría la lógica de cierre de sesión
    console.log('Cerrando sesión...')
    // Redirigir o realizar alguna acción adicional al cerrar sesión
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-purple-700 rounded-3xl relative shadow-2xl p-8">
        <h1 className="text-yellow-400 text-4xl font-bold mb-8 text-center">PERFIL DE USUARIO</h1>
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-yellow-400">
              <AvatarImage src={userData.photo} alt={userData.name} />
              <AvatarFallback>{userData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input 
                id="photo-upload" 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <h2 className="text-white text-2xl font-bold mt-4">{userData.name}</h2>
        </div>

        <div className="bg-purple-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-yellow-300 text-lg">Nivel {userData.level}</span>
            <span className="text-green-400 text-lg">{userData.xp} XP</span>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-purple-300 text-sm mt-2">
            {xpToNextLevel - userData.xp} XP para el siguiente nivel
          </p>
        </div>

        <div className="flex justify-between">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            EDITAR PERFIL
          </Button>
          <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
            <LogOut className="mr-2 h-4 w-4" /> CERRAR SESIÓN
          </Button>
        </div>
      </div>
    </div>
  )
}
