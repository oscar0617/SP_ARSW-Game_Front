import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import useSound from 'use-sound';
import mainMenu from './music/mainMenu.mp3';

export default function ArcadeMachine() {
  const [selectedOption, setSelectedOption] = useState('VER SALAS');
  const [requestCount, setRequestCount] = useState(0);
  const storedVolume = parseFloat(sessionStorage.getItem("volume") || "0.5");
  const [volume, setVolume] = useState(storedVolume); 
  const [mainMenuSound, { stop }] = useSound(mainMenu, { loop: true, volume });

  useEffect(() => {
    mainMenuSound();
    return () => stop(); 
  }, [mainMenuSound, stop]);


  const initializePlayer = async () => {
    setRequestCount(prevCount => {
      const newCount = prevCount + 1;
      return newCount;
    });
  };


  const options = [
    { label: 'VER SALAS', path: '/salas', action: initializePlayer },
    { label: 'CONFIGURACIONES', path: '/configuraciones' },
    { label: 'PUNTAJES', path: '/puntajes' },
    { label: 'INICIAR SESIÓN', path: 'http://localhost:8080' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md aspect-[3/4] bg-purple-700 rounded-t-3xl relative shadow-2xl">
        {/* Arcade top */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-purple-800 rounded-t-3xl flex items-center justify-center">
          <div className="text-yellow-400 text-3xl font-bold tracking-widest">ECI TRON</div>
        </div>

        {/* Side panels */}
        <div className="absolute top-16 bottom-0 left-0 w-6 bg-blue-500 rounded-bl-3xl"></div>
        <div className="absolute top-16 bottom-0 right-0 w-6 bg-blue-500 rounded-br-3xl"></div>

        {/* Screen */}
        <div className="absolute top-20 left-8 right-8 bottom-32 bg-black rounded-lg overflow-hidden">
          <div className="w-full h-full bg-gradient-to-b from-blue-500 to-purple-500 p-6 flex flex-col items-center justify-center">
            <div className="text-yellow-300 text-xl mb-4">HI-SCORE: 97777</div>
            <div className="text-white text-2xl mb-6">LVL-1</div>
            <div className="text-yellow-300 text-xl mb-8 animate-pulse">PRESS START</div>
            <div className="space-y-4 w-full max-w-xs">
              {options.map(({ label, path, action }) => (
                <Button
                  key={label}
                  className={`w-full py-2 text-lg ${
                    selectedOption === label
                      ? 'bg-yellow-400 text-black'
                      : 'bg-blue-700 text-white hover:bg-blue-600'
                  }`}
                  onClick={() => {
                    setSelectedOption(label);
                    if (action) action();
                  }}
                >
                  <a href={path} className="w-full h-full flex items-center justify-center">
                    {label}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Control panel */}
        <div className="absolute bottom-0 left-8 right-8 h-28 bg-gray-800 rounded-t-lg flex justify-around items-center">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-red-500 border-4 border-red-700"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
