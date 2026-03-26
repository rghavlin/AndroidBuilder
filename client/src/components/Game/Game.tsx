
import React from 'react';
import { CameraProvider } from '../../contexts/CameraContext.jsx';
import { GameMapProvider } from '../../contexts/GameMapContext.jsx';
import { PlayerProvider } from '../../contexts/PlayerContext.jsx';
import { GameProvider } from '../../contexts/GameContext.jsx';
import { LogProvider } from '../../contexts/LogContext.jsx';
import { AudioProvider } from '../../contexts/AudioContext.jsx';
import GameScreen from './GameScreen.tsx';

export default function Game() {
  return (
    <LogProvider>
      <AudioProvider>
        <CameraProvider>
        <GameMapProvider>
          <PlayerProvider>
            <GameProvider>
              <GameScreen />
            </GameProvider>
          </PlayerProvider>
        </GameMapProvider>
      </CameraProvider>
      </AudioProvider>
    </LogProvider>
  );
}
