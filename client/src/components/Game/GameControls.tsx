import { Button } from "@/components/ui/button";
import { Heart, Zap } from "lucide-react";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

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
    condition: string;
    isBleeding: boolean;
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
import DevConsole from './DevConsole';

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
    triggerSleep,
    performSleep,
    isSkillsOpen,
    toggleSkills,
    enginePulse
  } = useGame();

  // Phase 2: Movement animation handled by PlayerContext
  const [endTurnImage, setEndTurnImage] = useState<string | null>(null);
  const [playerIcon, setPlayerIcon] = useState<string | null>(null);

  // DEBUG: Track engine pulse in UI
  useEffect(() => {
    if (enginePulse > 0) {
      console.log(`[GameControls] 💓 Engine Pulse #${enginePulse} received in UI`);
    }
  }, [enginePulse]);

  // Load UI images on component mount
  useEffect(() => {
    const loadUIImages = async () => {
      try {
        const endTurnImg = await imageLoader.getUIImage('endturn');
        if (endTurnImg) setEndTurnImage(endTurnImg.src);
        
        const playerImg = await imageLoader.getImage('player');
        if (playerImg) setPlayerIcon(playerImg.src);
      } catch (error) {
        console.error('[GameControls] Failed to load UI images:', error);
      }
    };
    loadUIImages();
  }, []);

  // Use real game state when available, fallback to demo props
  // We prioritize the hook-provided playerStats as it is bound to the enginePulse
  const currentStats = isInitialized ? playerStats : demoStats;
  const currentTurn = isInitialized ? turn : demoState.turn;
  const handleEndTurn = isInitialized ? endTurn : demoEndTurn;

  // Calculate if buttons should be disabled

  // Calculate if buttons should be disabled
  const maxSleepHours = Math.max(0, Math.ceil((25 - currentStats.energy) / 2.5));
  const buttonsDisabled = !isPlayerTurn || isAutosaving || isAnimatingMovement || isSleeping;
  const sleepDisabled = buttonsDisabled || currentStats.energy >= 25;

  return (
    <div className="bg-card border-t border-border p-1.5 flex items-center" data-testid="game-controls">

      {/* End Turn Button and Stats with tighter gap */}
      <div className="flex items-center gap-2">
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

        {/* Stats - Expanded to fill middle area, now with flexible width and tighter padding */}
        <div className="flex flex-col flex-1 min-w-0 gap-1.5 px-1">
          {/* Row 1: Combat Stats */}
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5" data-testid="stat-health">
              <span className="text-white mr-0.5">HP</span>
              <span className="text-white font-bold">{currentStats.hp}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/60">{currentStats.maxHp}</span>
            </div>

            <div className="flex items-center gap-1.5 ml-4" data-testid="stat-action-points">
              <span className="text-white mr-0.5">AP</span>
              <span className="text-white font-bold">{currentStats.ap}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/60">{currentStats.maxAp}</span>
            </div>

            <div className="flex items-center gap-1 border-l border-white/10 pl-4" data-testid="stat-condition">
              <span className="text-white/60 mr-0.5 lowercase font-normal italic">Condition:</span>
              <span className="text-white font-bold">
                {[
                  currentStats.condition !== 'Normal' ? currentStats.condition : null,
                  currentStats.isBleeding ? 'Bleeding' : null
                ].filter(Boolean).join(', ') || 'Normal'}
              </span>
            </div>
          </div>

          {/* Row 2: Survival Stats + Turn Info + Clock - Compressed Gaps */}
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
            <div className="flex items-center gap-1.5" data-testid="stat-nutrition">
              <span className="text-white/60 mr-0.5">Nutrition</span>
              <span className="text-white">{currentStats.nutrition}</span>
            </div>

            <div className="flex items-center gap-1.5" data-testid="stat-hydration">
              <span className="text-white/60 mr-0.5">Hydration</span>
              <span className="text-white">{currentStats.hydration}</span>
            </div>

            <div className="flex items-center gap-1.5" data-testid="stat-energy">
              <span className="text-white/60 mr-0.5">Energy</span>
              <span className="text-white">{currentStats.energy}</span>
            </div>

            {/* Turn Pill - Flexible margin */}
            <div className="bg-zinc-800 px-2 py-0.5 rounded border border-white/10 text-white">
              T{currentTurn}
            </div>

            {/* 24-Hour Clock Pill */}
            <div className="bg-zinc-800 px-2 py-0.5 rounded border border-white/10 text-white font-mono">
              {String((6 + (currentTurn - 1)) % 24).padStart(2, '0')}00
            </div>

            {/* Sleep Button */}
            <div className="flex items-center gap-1">
              <Button
                onClick={() => triggerSleep(1)}
                disabled={sleepDisabled}
                className="h-[18px] px-2 bg-indigo-600 hover:bg-indigo-700 text-[9px] font-bold text-white rounded border border-white/10 uppercase tracking-tighter disabled:bg-indigo-900/50"
                data-testid="button-sleep-trigger"
              >
                Sleep
              </Button>
            </div>

            </div>

            {/* Status Messages */}
            {!isPlayerTurn && isAutosaving && (
              <span className="text-white animate-pulse ml-1 text-[9px]">
                AUTOSAVING
              </span>
            )}

          </div>
        </div>

        {/* Skills Button - Tighter fixed position */}
        <div className="flex-shrink-0 flex items-center gap-1 ml-2 border-l border-white/5 pl-2">
          <Button
            onClick={toggleSkills}
            disabled={buttonsDisabled}
            className={cn(
              "p-1 bg-zinc-800 hover:bg-zinc-700 transition-all border",
              isSkillsOpen ? "border-primary shadow-[0_0_8px_rgba(34,197,94,0.3)] bg-primary/10" : "border-white/10"
            )}
            style={{ width: '40px', height: '40px' }}
            title="Character Skills"
            data-testid="button-skills-toggle"
          >
            {playerIcon ? (
              <img
                src={playerIcon}
                alt="Skills"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-[10px] font-bold">SKILLS</span>
            )}
          </Button>
        </div>


      {/* Right side buttons container - kept for structural balance but empty of buttons */}
      <div className="ml-auto flex items-center gap-2 pr-4 border-l border-white/10 h-10">
        {/* The blue line mentioned is likely this border/separator */}
      </div>

    </div>
  );
}