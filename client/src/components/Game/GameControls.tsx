import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGame } from '../../contexts/GameContext.jsx';
import { useSleep } from '../../contexts/SleepContext.jsx';
import { useCombat } from '../../contexts/CombatContext.jsx';
import { useAction } from '../../contexts/ActionContext.jsx';
import { imageLoader } from '../../game/utils/ImageLoader.js';

interface GameControlsProps {
  playerStats: {
    hp: number;
    maxHp: number;
    ap: number;
    maxAp: number;
    nutrition: number;
    hydration: number;
    energy: number;
    condition: string;
    isBleeding: boolean;
  };
  gameState: {
    turn: number;
    playerName: string;
  };
  onEndTurn: () => void;
  onRest: () => void;
}

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  suffix?: React.ReactNode;
  className?: string;
}

const StatBar = ({ label, current, max, suffix, className }: StatBarProps) => (
  <div className={cn("flex flex-col gap-0.5", className)}>
    <div className="flex justify-between items-baseline px-0.5">
      <div className="flex items-baseline gap-1.5 overflow-hidden">
        <span className="text-[9px] font-black text-white/40 uppercase tracking-tight whitespace-nowrap">{label}</span>
        {suffix && <div className="flex-1 shrink-0">{suffix}</div>}
      </div>
      <span className="text-[10px] font-bold text-white/80 tabular-nums shrink-0">
        {Number.isInteger(current) ? current : current.toFixed(1)}<span className="text-white/20 mx-0.5 text-[8px]">/</span>{max}
      </span>
    </div>
    <div className="h-2 w-full bg-zinc-800/80 rounded-sm overflow-hidden border border-white/5 p-[1px]">
      <div 
        className="h-full bg-white transition-all duration-500 ease-out rounded-[1px]" 
        style={{ width: `${Math.min(100, Math.max(0, (current / max) * 100))}%` }} 
      />
    </div>
  </div>
);

export default function GameControls({ 
  playerStats: demoStats, 
  gameState: demoState, 
  onEndTurn: demoEndTurn 
}: GameControlsProps) {
  
  const { playerStats, isMoving: isAnimatingMovement } = usePlayer();
  const { 
    turn, 
    endTurn, 
    isInitialized, 
    isPlayerTurn, 
    isAutosaving,
    isAnimatingZombies,
    isSkillsOpen,
    toggleSkills
  } = useGame();
  
  const { isSleeping, triggerSleep } = useSleep();
  // We keep useCombat for possible future combat-related HUD elements, but remove non-existent handleEndTurn
  const combatContext = useCombat();

  const [endTurnImage, setEndTurnImage] = useState<string | null>(null);
  const [playerIcon, setPlayerIcon] = useState<string | null>(null);

  // Load UI images
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
  const currentStats = isInitialized ? playerStats : demoStats;
  const currentTurn = isInitialized ? turn : demoState.turn;
  const onEndTurnAction = isInitialized ? endTurn : demoEndTurn;

  const buttonsDisabled = !isPlayerTurn || isAutosaving || isAnimatingMovement || isSleeping || isAnimatingZombies || (combatContext?.isProcessing);
  const sleepDisabled = buttonsDisabled || currentStats.energy >= 25;

  return (
    <div className="bg-card border-t border-border px-4 py-1 flex items-center h-[82px] w-full shadow-[0_-8px_25px_rgba(0,0,0,0.8)] z-20" data-testid="game-controls">
      
      {/* 1. Primary Action: End Turn */}
      <div className="flex items-center pr-4 border-r border-white/10 h-full">
        <Button
          onClick={onEndTurnAction}
          disabled={buttonsDisabled}
          className="p-0.5 bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl border border-white/10"
          style={{ width: '56px', height: '56px' }}
          data-testid="button-end-turn"
        >
          {endTurnImage ? (
            <img src={endTurnImage} alt="End Turn" className="w-full h-full object-contain" />
          ) : (
            <span className="text-xs font-black leading-tight text-white uppercase italic">END<br/>TURN</span>
          )}
        </Button>
      </div>

      {/* 2. Central HUD: 2-Row Stats Display - Tightened vertical spacing */}
      <div className="flex-1 flex flex-col justify-center px-4 md:px-8 gap-1.5 min-w-0">
        
        {/* Row 1: Combat (HP and AP) */}
        <div className="flex items-center gap-6 md:gap-12">
          <StatBar 
            label="Health" 
            current={currentStats.hp} 
            max={currentStats.maxHp} 
            suffix={
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className={cn(
                  "text-[8px] font-bold px-1 rounded-sm uppercase tracking-tighter whitespace-nowrap",
                  currentStats.condition === 'Normal' ? "bg-white/5 text-white/40" : "bg-amber-500/20 text-amber-500"
                )}>
                  {currentStats.condition}
                </span>
                {currentStats.isBleeding && (
                  <span className="text-[8px] font-black text-red-500 animate-pulse uppercase tracking-tighter whitespace-nowrap shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                    Bleeding
                  </span>
                )}
              </div>
            }
            className="flex-1"
          />
          <StatBar 
            label="Action" 
            current={currentStats.ap} 
            max={currentStats.maxAp} 
            className="flex-1"
          />
        </div>

        {/* Row 2: Survival (Nutrition, Hydration, Energy) */}
        <div className="flex items-center gap-4 md:gap-8 opacity-90">
          <StatBar 
            label="Nutrition" 
            current={currentStats.nutrition} 
            max={25} 
            className="flex-1"
          />
          <StatBar 
            label="Hydration" 
            current={currentStats.hydration} 
            max={25} 
            className="flex-1"
          />
          <StatBar 
            label="Energy" 
            current={currentStats.energy} 
            max={25} 
            className="flex-1"
          />
        </div>
      </div>

      {/* 3. Secondary HUD: World Info & Actions */}
      <div className="flex items-center gap-3 pl-4 border-l border-white/10 h-full shrink-0">
        
        {/* Compact Turn/Time vertical group */}
        <div className="flex flex-col gap-1.5 mr-1 hidden sm:flex">
          <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-white/30 uppercase tracking-tighter tabular-nums">
            <span>Turn</span>
            <span className="text-white/80">T{currentTurn}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px] font-mono font-bold text-white/30 uppercase tracking-tighter tabular-nums">
            <span>Time</span>
            <span className="text-white/80">
              {String((6 + (currentTurn - 1)) % 24).padStart(2, '0')}:00
            </span>
          </div>
        </div>

        <Button
          onClick={() => triggerSleep(1)}
          disabled={sleepDisabled}
          className="h-10 px-3 bg-zinc-800 hover:bg-zinc-700 text-[9px] font-black text-white/70 rounded border border-white/10 uppercase tracking-widest disabled:opacity-20 transition-all font-mono"
        >
          Sleep
        </Button>

        <Button
          onClick={toggleSkills}
          disabled={buttonsDisabled}
          className={cn(
            "p-1 bg-zinc-800 hover:bg-zinc-700 transition-all border shadow-lg active:scale-95",
            isSkillsOpen ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] bg-zinc-700" : "border-white/10"
          )}
          style={{ width: '56px', height: '56px' }}
          title="Character Stats"
        >
          {playerIcon ? (
            <img
              src={playerIcon}
              alt="Skills"
              className={cn(
                "w-full h-full object-contain p-1 invert grayscale",
                isSkillsOpen ? "opacity-100" : "opacity-40"
              )}
            />
          ) : (
            <span className="text-[10px] font-black leading-tight text-white/60">CHR</span>
          )}
        </Button>
      </div>

    </div>
  );
}