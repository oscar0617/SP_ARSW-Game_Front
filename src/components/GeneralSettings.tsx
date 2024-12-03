import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


export default function GeneralSettings() {
  const [settings, setSettings] = useState({
    musicVolume: 50,
    soundEffectsVolume: 75,
    language: 'es',
    showFPS: false,
  })

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    sessionStorage.setItem("volume", (settings.musicVolume/100).toString());
    sessionStorage.setItem("volumeEffects", (settings.soundEffectsVolume/100).toString());
    alert("Configuración guardada.");
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-white text-lg mb-2 block">Volumen de Música</label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[settings.musicVolume]}
          onValueChange={(value) => updateSetting('musicVolume', value[0])}
          className="w-full"
        />
        <p className="text-purple-300 mt-2">Volumen: {settings.musicVolume}%</p>
      </div>

      <div>
        <label className="text-white text-lg mb-2 block">Volumen de Efectos de Sonido</label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[settings.soundEffectsVolume]}
          onValueChange={(value) => updateSetting('soundEffectsVolume', value[0])}
          className="w-full"
        />
        <p className="text-purple-300 mt-2">Volumen: {settings.soundEffectsVolume}%</p>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white">
          GUARDAR CONFIGURACIÓN
        </Button>
      </div>
    </div>
  )
}
