import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award } from 'lucide-react';

interface Score {
  rank: number;
  username: string;
  score: number;
  date: string;
}

interface Player {
  nickName: string;
  email: string;
  level: number;
  score: number;
}

export default function Puntajes() {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    fetch(`http://10.0.0.5:8080/player/v1/allplayers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => response.json())
      .then((data: Player[]) => {
        const sortedScores: Score[] = data.sort((a: Player, b: Player) => b.score - a.score).map((player: Player, index: number) => ({
          rank: index + 1,
          username: player.nickName,
          score: player.score,
          date: new Date().toISOString().split('T')[0]
        }));
        setScores(sortedScores);
      })
      .catch(error => console.error('Error fetching player data:', error));
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-yellow-600" />;
      default:
        return null;
    }
  };

  const handleBackToMenu = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-purple-700 rounded-3xl relative shadow-2xl p-8">
        <h1 className="text-yellow-400 text-4xl font-bold mb-8 text-center">TABLA DE PUNTAJES</h1>

        <div className="space-y-4 mb-8">
          {scores.map((score) => (
            <div key={score.rank} className="bg-purple-800 rounded-lg p-4 flex items-center">
              <div className="w-8 text-2xl font-bold text-yellow-300 flex items-center justify-center">
                {getRankIcon(score.rank) || score.rank}
              </div>
              <div className="flex-grow ml-4">
                <h2 className="text-yellow-300 text-xl font-semibold">{score.username}</h2>
                <p className="text-purple-300 text-sm">{score.date}</p>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {score.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button onClick={handleBackToMenu} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 text-lg">
            VOLVER AL MENÚ
          </Button>
        </div>
      </div>
    </div>
  );
}
