import React from 'react';
import { useParams } from 'react-router-dom';
import TronGame from '../../components/TronGame';
import TronGameDonutMap from '../../components/TronDonutGame';
import TronGameFunkyMap from '../../components/TronCustomMap';
import CaptureTheFlag from '../../components/CaptureTheFlagGame';
import TronGame2v2 from '../../components/TronGame2v2';


const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();

  console.log(gameId);

  let TronGameComponent;
  if (gameId === '2') {
    TronGameComponent = TronGameDonutMap;
  } else if (gameId === '3') {
    TronGameComponent = TronGameFunkyMap;
  } else if (gameId === '4') {
    TronGameComponent = CaptureTheFlag;
  } else if (gameId === '6') {
    TronGameComponent = TronGame2v2;
  } else {
    TronGameComponent = TronGame;
  }

  return (
    <div>
      <h1>Sala {gameId}</h1>
      <TronGameComponent roomId={gameId} />
    </div>
  );
};

export default GamePage;
