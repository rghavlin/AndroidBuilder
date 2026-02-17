import { Button } from "@/components/ui/button";
import { Heart, Zap } from "lucide-react";
import { useState, useEffect } from 'react';

interface GameControlsProps {
  playerStats: {
    hp: number;
    maxHp: number;
    ap: number;
    maxAp: number;
    ammo: number;
    nutrition: number;
    maxNutrition: number;
    hydration: number;
    maxHydration: number;
    energy: number;
    maxEnergy: number;
  };
  gameState: {
    turn: number;
    playerName: string;
    location: string;
    zombieCount: number;
  };
  onEndTurn: () => void;
  onRest: () => void;
}

import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGame } from '../../contexts/GameContext.jsx';
import { imageLoader } from '../../game/utils/ImageLoader.js';
import DevConsole from './DevConsole.jsx';

export default function GameControls({ playerStats: demoStats, gameState: demoState, onEndTurn: demoEndTurn, onRest }: GameControlsProps) {
  // Phase 1: Direct sub-context access
  const { playerStats, isMoving: isAnimatingMovement } = usePlayer();

  // Get only orchestration functions from GameContext (no data aggregation)
  const {
    turn,
    endTurn,
    isInitialized,
    isPlayerTurn,
    isAutosaving,
    loadAutosave,
    isSleeping,
    sleepProgress,
    performSleep
  } = useGame();

  // Phase 2: Movement animation handled by PlayerContext
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [endTurnImage, setEndTurnImage] = useState<string | null>(null);
  const [loadGameImage, setLoadGameImage] = useState<string | null>(null);

  // Load UI images on component mount
  useEffect(() => {
    console.log('[GameControls] useEffect triggered - component mounted');
    console.log('[GameControls] imageLoader object:', imageLoader);
    console.log('[GameControls] Starting UI image loading...');

    const loadUIImages = async () => {
      try {
        // Test if electron context is available
        console.log('[GameControls] Electron context check:', {
          hasWindow: typeof window !== 'undefined',
          hasElectronAPI: typeof window !== 'undefined' && !!window.electronAPI,
          electronAPI: typeof window !== 'undefined' ? window.electronAPI : 'undefined'
        });

        // Add small delay to ensure electron is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));

        // Test loading an entity image first (we know this works)
        console.log('[GameControls] Testing entity image loading first...');
        const testEntityImg = await imageLoader.getImage('player');
        console.log('[GameControls] Test entity image result:', testEntityImg ? 'SUCCESS' : 'FAILED');

        console.log('[GameControls] Loading endturn image...');
        const endTurnImg = await imageLoader.getUIImage('endturn');
        if (endTurnImg) {
          console.log('[GameControls] End turn image loaded successfully:', endTurnImg.src);
          setEndTurnImage(endTurnImg.src);
        } else {
          console.log('[GameControls] End turn image not found or failed to load');
        }

        console.log('[GameControls] Loading loadgame image...');
        const loadGameImg = await imageLoader.getUIImage('loadgame');
        if (loadGameImg) {
          console.log('[GameControls] Load game image loaded successfully:', loadGameImg.src);
          setLoadGameImage(loadGameImg.src);
        } else {
          console.log('[GameControls] Load game image not found or failed to load');
        }
      } catch (error) {
        console.error('[GameControls] Failed to load UI images:', error);
      }
    };

    loadUIImages();
  }, []);

  // Use real game state when available, fallback to demo props
  const currentStats = isInitialized ? playerStats : demoStats;
  const currentTurn = isInitialized ? turn : demoState.turn;
  const handleEndTurn = isInitialized ? endTurn : demoEndTurn;

  // Handle load autosave
  const handleLoadGame = async () => {
    if (!isInitialized) return;

    try {
      console.log('[GameControls] Loading autosave...');
      const success = await loadAutosave();
      if (success) {
        console.log('[GameControls] Autosave loaded successfully');
      } else {
        console.warn('[GameControls] Failed to load autosave');
      }
    } catch (error) {
      console.error('[GameControls] Error loading autosave:', error);
    }
  };

  // Calculate if buttons should be disabled
  const maxSleepHours = Math.max(0, Math.ceil((25 - currentStats.energy) / 2.5));
  const buttonsDisabled = !isPlayerTurn || isAutosaving || isAnimatingMovement || isSleeping;
  const sleepDisabled = buttonsDisabled || currentStats.energy >= 25;

  return (
    <div className="bg-card border-t border-border p-2 flex items-center" data-testid="game-controls">

      {/* End Turn Button and Stats */}
      <div className="flex items-center gap-4">
        {/* End Turn Button - Square image button */}
        <Button
          onClick={handleEndTurn}
          disabled={buttonsDisabled}
          className="p-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ width: '40px', height: '40px' }}
          data-testid="button-end-turn"
        >
          {endTurnImage ? (
            <img
              src={endTurnImage}
              alt="End Turn"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xs font-bold">END</span>
          )}
        </Button>

        {/* Stats - Expanded to fill middle area */}
        <div className="flex flex-col gap-1.5 px-2">
          {/* Row 1: Combat Stats */}
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1" data-testid="stat-health">
              <span className="text-white mr-0.5">HP</span>
              <span className="text-white font-bold">{currentStats.hp}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/60">{currentStats.maxHp}</span>
            </div>

            <div className="flex items-center gap-1" data-testid="stat-action-points">
              <span className="text-white mr-0.5">AP</span>
              <span className="text-white font-bold">{currentStats.ap}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/60">{currentStats.maxAp}</span>
            </div>

            <div className="flex items-center gap-1 border-l border-white/10 pl-4" data-testid="stat-condition">
              <span className="text-white/60 mr-0.5 lowercase font-normal italic">Condition:</span>
              <span className="text-white font-bold">{currentStats.condition || 'Normal'}</span>
            </div>
          </div>

          {/* Row 2: Survival Stats + Turn Info + Clock */}
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-tight">
            <div className="flex items-center gap-1" data-testid="stat-nutrition">
              <span className="text-white/60 mr-0.5">NUT</span>
              <span className="text-white">{currentStats.nutrition}</span>
            </div>

            <div className="flex items-center gap-1" data-testid="stat-hydration">
              <span className="text-white/60 mr-0.5">HYD</span>
              <span className="text-white">{currentStats.hydration}</span>
            </div>

            <div className="flex items-center gap-1" data-testid="stat-energy">
              <span className="text-white/60 mr-0.5">NRG</span>
              <span className="text-white">{currentStats.energy}</span>
            </div>

            {/* Turn Pill - Moved to the right of survival stats */}
            <div className="bg-zinc-800 px-1.5 py-0.5 rounded border border-white/10 text-white ml-1">
              T{currentTurn}
            </div>

            {/* 24-Hour Clock Pill - New component */}
            <div className="bg-zinc-800 px-1.5 py-0.5 rounded border border-white/10 text-white font-mono">
              {String((6 + (currentTurn - 1)) % 24).padStart(2, '0')}00
            </div>

            {/* Sleep Button - To the right of the clock */}
            <div className="flex items-center gap-1 ml-1">
              <Button
                onClick={() => setShowSleepModal(true)}
                disabled={sleepDisabled}
                className="h-[18px] px-2 bg-indigo-600 hover:bg-indigo-700 text-[9px] font-bold text-white rounded border border-white/10 uppercase tracking-tighter disabled:bg-indigo-900/50"
                data-testid="button-sleep-trigger"
              >
                Sleep
              </Button>
            </div>

            {/* Status Messages */}
            {!isPlayerTurn && (
              <span className="text-white animate-pulse ml-1 text-[9px]">
                {isAutosaving ? 'AUTOSAVING' : 'ENEMY TURN'}
              </span>
            )}

            {isAnimatingMovement && (
              <span className="text-white animate-pulse ml-1 text-[9px]">
                MOVING
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side buttons */}
      <div className="ml-auto flex items-center gap-2">
        {/* Dev Console Button */}
        <Button
          onClick={() => setShowDevConsole(true)}
          disabled={buttonsDisabled}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ width: '40px', height: '40px' }}
          data-testid="button-dev-console"
        >
          <span className="text-xs font-mono">DEV</span>
        </Button>

        {/* Load Game Button - Square image button */}
        <Button
          onClick={handleLoadGame}
          disabled={buttonsDisabled}
          className="p-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ width: '40px', height: '40px' }}
          data-testid="button-load-game"
        >
          {loadGameImage ? (
            <img
              src={loadGameImage}
              alt="Load Game"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xs font-bold">LOAD</span>
          )}
        </Button>
      </div>

      {/* Dev Console Window */}
      {showDevConsole && (
        <DevConsole
          isOpen={showDevConsole}
          onClose={() => setShowDevConsole(false)}
        />
      )}

      {/* Sleep Duration Modal */}
      {showSleepModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-lg max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">How long to sleep?</h2>
            <p className="text-zinc-400 text-[10px] mb-4 uppercase">Max sleep based on energy: {maxSleepHours}h</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hours => (
                <Button
                  key={hours}
                  disabled={hours > maxSleepHours}
                  onClick={() => {
                    performSleep(hours);
                    setShowSleepModal(false);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-10 border border-white/5 disabled:opacity-20 disabled:grayscale"
                >
                  {hours}h
                </Button>
              ))}
            </div>
            <Button
              onClick={() => setShowSleepModal(false)}
              className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-100 font-bold uppercase tracking-widest text-xs border border-red-500/20"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}