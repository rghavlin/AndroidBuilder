
import React from 'react';
import { CameraProvider } from '../../contexts/CameraContext.jsx';
import { GameMapProvider } from '../../contexts/GameMapContext.jsx';
import { PlayerProvider } from '../../contexts/PlayerContext.jsx';
import { GameProvider } from '../../contexts/GameContext.jsx';
import { LogProvider } from '../../contexts/LogContext.jsx';
import { AudioProvider } from '../../contexts/AudioContext.jsx';
import { VisualEffectsProvider } from '../../contexts/VisualEffectsContext.jsx';
import GameScreen from './GameScreen.tsx';

export default function Game() {
  return (
    <LogProvider>
      <AudioProvider>
        <VisualEffectsProvider>
          <CameraProvider>
            <GameMapProvider>
              <PlayerProvider>
                <GameProvider>
                  <GameScreen />
                </GameProvider>
              </PlayerProvider>
            </GameMapProvider>
          </CameraProvider>
        </VisualEffectsProvider>
      </AudioProvider>
    </LogProvider>
  );
}
