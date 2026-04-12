
import React from 'react';
import { CameraProvider } from '../../contexts/CameraContext.jsx';
import { GameMapProvider } from '../../contexts/GameMapContext.jsx';
import { PlayerProvider } from '../../contexts/PlayerContext.jsx';
import { GameProvider } from '../../contexts/GameContext.jsx';
import { SleepProvider } from '../../contexts/SleepContext.jsx';
import { ActionProvider } from '../../contexts/ActionContext.jsx';
import { LogProvider } from '../../contexts/LogContext.jsx';
import { AudioProvider } from '../../contexts/AudioContext.jsx';
import { VisualEffectsProvider } from '../../contexts/VisualEffectsContext.jsx';
import { InventoryProvider } from '../../contexts/InventoryContext.jsx';
import { CombatProvider } from '../../contexts/CombatContext.jsx';
import GameScreen from './GameScreen.tsx';

export default function Game() {
  return (
    <LogProvider>
      <AudioProvider>
        <VisualEffectsProvider>
          <CameraProvider>
            <GameMapProvider>
              <PlayerProvider>
                <InventoryProvider>
                  <CombatProvider>
                    <GameProvider>
                      <SleepProvider>
                        <ActionProvider>
                          <GameScreen />
                        </ActionProvider>
                      </SleepProvider>
                    </GameProvider>
                  </CombatProvider>
                </InventoryProvider>
              </PlayerProvider>
            </GameMapProvider>
          </CameraProvider>
        </VisualEffectsProvider>
      </AudioProvider>
    </LogProvider>
  );
}
