import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams } from 'react-router-dom';

export default function GameSettings() {
  const { roomId } = useParams();
  const [settings, setSettings] = useState({
    gameMode: 'ffa',
    maxJumps: 0,
    boost: false,
    obstacles: false,
    speed: 1.0,
    map: 1,
  });

  useEffect(() => {
    fetch(`http://10.0.0.4:8080/lobby/v1/settings/${roomId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error");
        }
        return response.json();
      })
      .then((data) => {
        setSettings(data);
      })
  }, [roomId]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  //Admin
  const handleSave = async () => {
    try {
      const playerStorage = sessionStorage.getItem("userData");
      if (playerStorage) {
        const nickName = JSON.parse(playerStorage).displayName;
        const idRoom = sessionStorage.getItem("idRoom");

        const response = await fetch(`http://10.0.0.4:8080/lobby/v1/settings/${nickName}/${idRoom}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        if (!response.ok) {
          throw new Error("Error en la red");
        }
        console.log("Configuración guardada:", settings);
        window.location.href = `/sala/${roomId}`;
      } else {
        console.error("No se encontró información en sessionStorage");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
    window.close();
  };

  const handleMapSelection = (map) => {
    updateSetting('map', map);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-purple-700 rounded-3xl shadow-2xl p-8">
        <h1 className="text-yellow-400 text-4xl font-bold mb-8 text-center">AJUSTES DEL JUEGO</h1>
  
        <div className="space-y-6">
          <div>
            <label className="text-white text-lg mb-2 block">Modo de Juego</label>
            <Select 
              value={settings.gameMode} 
              onValueChange={(value) => updateSetting('gameMode', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona el modo de juego" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ctf">Captura la bandera</SelectItem>
                <SelectItem value="2v2">2 vs 2</SelectItem>
                <SelectItem value="ffa">Todos contra Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
  
          <div>
            <label className="text-white text-lg mb-2 block">Máximo de Saltos</label>
            <Slider
              min={0}
              max={5}
              step={1}
              value={[settings.maxJumps]}
              onValueChange={(value) => updateSetting('maxJumps', value[0])}
              className="w-full"
            />
            <p className="text-purple-300 mt-2">Saltos permitidos: {settings.maxJumps}</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-white text-lg">Turbos Habilitados</label>
            <Switch
              checked={settings.boost}
              onCheckedChange={(checked) => updateSetting('boost', checked)}
            />
          </div>
  
          <div>
            <label className="text-white text-lg mb-2 block">Velocidad del Juego</label>
            <Slider
              min={0.5}
              max={2}
              step={0.1}
              value={[settings.speed]}
              onValueChange={(value) => updateSetting('speed', value[0])}
              className="w-full"
            />
            <p className="text-purple-300 mt-2">Velocidad: x{settings.speed.toFixed(1)}</p>
          </div>
        </div>
  
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white">
            GUARDAR CONFIGURACIÓN
          </Button>
        </div>
  
        <div className="mt-8 flex justify-center space-x-4">
          {/* Mostrar mapas según el modo de juego */}
          {settings.gameMode === "ffa" ? (
            <>
              <button 
                className={`p-2 ${settings.map === 1 ? 'border border-yellow-500' : ''}`}
                onClick={() => handleMapSelection(1)}
              >
                <img src={require("./1.png")} alt="Map 1" className="w-32 h-32" />
              </button>
              <button 
                className={`p-2 ${settings.map === 2 ? 'border border-yellow-500' : ''}`}
                onClick={() => handleMapSelection(2)}
              >
                <img src={require("./2.png")} alt="Map 2" className="w-32 h-32" />
              </button>
              <button 
                className={`p-2 ${settings.map === 3 ? 'border border-yellow-500' : ''}`}
                onClick={() => handleMapSelection(3)}
              >
                <img src={require("./3.png")} alt="Map 3" className="w-32 h-32" />
              </button>
            </>
          ) : (
            <button 
              className={`p-2 ${
                (settings.gameMode === "ctf" && settings.map === 5) ||
                (settings.gameMode === "2v2" && settings.map === 6)
                  ? 'border border-yellow-500'
                  : ''
              }`}
              onClick={() => handleMapSelection(settings.gameMode === "ctf" ? 5 : 6)}
            >
              <img src={require("./1.png")} alt="Map 1" className="w-32 h-32" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
  
  

}
