
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
import { SpeechBubbleProvider } from '../../contexts/SpeechBubbleContext.jsx';
import { OverlayProvider } from '../../contexts/OverlayContext';
import GameScreen from './GameScreen.tsx';
import OverlayManager from './OverlayManager.tsx';
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Game() {
  return (
    <TooltipProvider delayDuration={300}>
      <OverlayProvider>
        <LogProvider>
          <AudioProvider>
            <VisualEffectsProvider>
              <CameraProvider>
                <GameMapProvider>
                  <PlayerProvider>
                    <InventoryProvider>
                      <CombatProvider>
                        <SpeechBubbleProvider>
                          <GameProvider>
                            <SleepProvider>
                              <ActionProvider>
                                <GameScreen />
                                <OverlayManager />
                              </ActionProvider>
                            </SleepProvider>
                          </GameProvider>
                        </SpeechBubbleProvider>
                      </CombatProvider>
                    </InventoryProvider>
                  </PlayerProvider>
                </GameMapProvider>
              </CameraProvider>
            </VisualEffectsProvider>
          </AudioProvider>
        </LogProvider>
      </OverlayProvider>
    </TooltipProvider>
  );
}
