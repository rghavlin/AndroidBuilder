import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGame } from '../../contexts/GameContext.jsx';
import { useSleep } from '../../contexts/SleepContext.jsx';
import { useCombat } from '../../contexts/CombatContext.jsx';
import { useAction } from '../../contexts/ActionContext.jsx';
import { imageLoader } from '../../game/utils/ImageLoader.js';
import { useOverlays } from '../../contexts/OverlayContext';
import { getHourFromTurn } from '../../game/utils/TimeUtils.js';
import { useTheme } from '../../contexts/ThemeContext';

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
    isStarving: boolean;
    isDehydrated: boolean;
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

const StatBar = ({ label, current, max, suffix, className }: StatBarProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  let barFillClass = isLight ? "bg-foreground" : "bg-white";
  if (isLight && label.toLowerCase() === 'health') {
    barFillClass = ""; // Use inline style for custom sage green color
  }

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex justify-between items-baseline px-0.5">
        <div className="flex items-baseline gap-1.5 overflow-hidden">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-tight whitespace-nowrap",
            isLight ? "text-muted-foreground/60" : "text-white/40"
          )}>{label}</span>
          {suffix && <div className="flex-1 shrink-0">{suffix}</div>}
        </div>
        <span className={cn(
          "text-[10px] font-bold tabular-nums shrink-0",
          isLight ? "text-foreground" : "text-white/80"
        )}>
          {Number.isInteger(current) ? current : current.toFixed(1)}
          <span className={cn("mx-0.5 text-[8px]", isLight ? "text-muted-foreground/30" : "text-white/20")}>/</span>
          {max}
        </span>
      </div>
      <div className={cn(
        "h-2 w-full rounded-sm overflow-hidden border p-[1px]",
        isLight ? "bg-muted border-border" : "bg-zinc-800/80 border-white/5"
      )}>
        <div 
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-[1px]",
            barFillClass
          )} 
          style={{ 
            width: `${Math.min(100, Math.max(0, (current / max) * 100))}%`,
            ...(isLight && label.toLowerCase() === 'health' ? { backgroundColor: '#639A88' } : {})
          }} 
        />
      </div>
    </div>
  );
};

export default function GameControls({ 
  playerStats: demoStats, 
  gameState: demoState, 
  onEndTurn: demoEndTurn 
}: GameControlsProps) {
  
  const { playerStats, isMoving: isAnimatingMovement } = usePlayer();
  const { theme } = useTheme();
  const { 
    turn, 
    endTurn, 
    isInitialized, 
    isPlayerTurn, 
    isAutosaving,
    isAnimatingZombies,
    isProcessingTurn,
    isSkillsOpen,
    toggleSkills
  } = useGame();
  
  const { isSleeping, triggerSleep } = useSleep();
  const { isExtensionOpen, setIsExtensionOpen } = useOverlays();
  // We keep useCombat for possible future combat-related HUD elements, but remove non-existent handleEndTurn
  const combatContext = useCombat();

  const [endTurnImage, setEndTurnImage] = useState<string | null>(null);
  const [sleepImage, setSleepImage] = useState<string | null>(null);
  const [craftingImage, setCraftingImage] = useState<string | null>(null);
  const [statsImage, setStatsImage] = useState<string | null>(null);

  // Load UI images
  useEffect(() => {
    const loadUIImages = async () => {
      try {
        const endTurnImg = await imageLoader.getUIImage('endturn');
        if (endTurnImg) setEndTurnImage(endTurnImg.src);

        const sleepImg = await imageLoader.getUIImage('sleepbutton');
        if (sleepImg) setSleepImage(sleepImg.src);

        const craftingImg = await imageLoader.getUIImage('craftingbutton');
        if (craftingImg) setCraftingImage(craftingImg.src);

        const statsImg = await imageLoader.getUIImage('statsbutton');
        if (statsImg) setStatsImage(statsImg.src);
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

  const buttonsDisabled = !isPlayerTurn || isAutosaving || isAnimatingMovement || isSleeping || isAnimatingZombies || isProcessingTurn || (combatContext?.isProcessing);
  const sleepDisabled = buttonsDisabled || currentStats.energy >= 25;

  return (
    <div className="unified-footer px-4 py-1 flex items-center h-[82px] w-full shadow-[0_-8px_25px_rgba(0,0,0,0.15)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.8)] z-20" data-testid="game-controls">
      
      {/* 1. Primary Actions Group */}
      <div className="flex items-center gap-2 pr-4 border-r border-border dark:border-white/10 h-full">
        {/* End Turn */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                onClick={onEndTurnAction}
                disabled={buttonsDisabled}
                className={cn(
                  "p-0.5 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
                  theme === 'light' 
                    ? "bg-muted border border-zinc-300 hover:bg-muted/80 shadow-sm text-foreground" 
                    : "bg-primary hover:bg-primary/90 shadow-xl border border-border dark:border-white/10"
                )}
                style={{ width: '56px', height: '56px' }}
                data-testid="button-end-turn"
              >
                {endTurnImage ? (
                  <img 
                    src={endTurnImage} 
                    alt="End Turn" 
                    className="w-full h-full object-contain" 
                    style={{ filter: theme === 'light' ? 'invert(1)' : 'none' }}
                  />
                ) : (
                  <span className="text-xs font-black leading-tight text-white uppercase italic">END<br/>TURN</span>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs font-semibold">End your turn</p>
          </TooltipContent>
        </Tooltip>

        {/* Sleep */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                onClick={() => triggerSleep(1)}
                disabled={sleepDisabled}
                className={cn(
                  "p-0.5 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
                  theme === 'light' 
                    ? "bg-muted border border-zinc-300 hover:bg-muted/80 shadow-sm text-foreground" 
                    : "bg-primary hover:bg-primary/90 shadow-xl border border-border dark:border-white/10"
                )}
                style={{ width: '56px', height: '56px' }}
                data-testid="button-sleep"
              >
                {sleepImage ? (
                  <img 
                    src={sleepImage} 
                    alt="Sleep" 
                    className="w-full h-full object-contain" 
                    style={{ filter: theme === 'light' ? 'invert(1)' : 'none' }}
                  />
                ) : (
                  <span className="text-xs font-black leading-tight text-white uppercase italic">SLEEP</span>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs font-semibold">Sleep</p>
          </TooltipContent>
        </Tooltip>

        {/* Crafting */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                onClick={() => setIsExtensionOpen(!isExtensionOpen)}
                disabled={buttonsDisabled}
                className={cn(
                  "p-1 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
                  theme === 'light'
                    ? (isExtensionOpen ? "ring-2 ring-[#639A88] bg-[#639A88]/10 shadow-none text-black" : "bg-muted hover:bg-muted/80 border-none shadow-none")
                    : cn(
                        "bg-zinc-800 hover:bg-zinc-700 border shadow-lg",
                        isExtensionOpen 
                          ? "border-white bg-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                          : "border-white/10"
                      )
                )}
                style={{ width: '56px', height: '56px' }}
                data-testid="button-crafting"
              >
                {craftingImage ? (
                  <img
                    src={craftingImage}
                    alt="Crafting"
                    className={cn(
                      "w-full h-full object-contain p-1 grayscale",
                      theme === 'dark' && "invert",
                      isExtensionOpen ? "opacity-100" : "opacity-40"
                    )}
                  />
                ) : (
                  <span className="text-[10px] font-black leading-tight text-white/60">CRAFT</span>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs font-semibold">Crafting & Cooking</p>
          </TooltipContent>
        </Tooltip>

        {/* Character Stats (Skills) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                onClick={toggleSkills}
                disabled={buttonsDisabled}
                className={cn(
                  "p-1 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
                  theme === 'light'
                    ? (isSkillsOpen ? "ring-2 ring-[#639A88] bg-[#639A88]/10 shadow-none text-black" : "bg-muted hover:bg-muted/80 border-none shadow-none")
                    : cn(
                        "bg-zinc-800 hover:bg-zinc-700 border shadow-lg",
                        isSkillsOpen 
                          ? "border-white bg-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                          : "border-white/10"
                      )
                )}
                style={{ width: '56px', height: '56px' }}
                data-testid="button-stats"
              >
                {statsImage ? (
                  <img
                    src={statsImage}
                    alt="Skills"
                    className={cn(
                      "w-full h-full object-contain p-1 grayscale",
                      theme === 'dark' && "invert",
                      isSkillsOpen ? "opacity-100" : "opacity-40"
                    )}
                  />
                ) : (
                  <span className="text-[10px] font-black leading-tight text-white/60">CHR</span>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs font-semibold">Character Stats & Skills</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* 2. Central HUD: 2-Row Stats Display - Tightened spacing */}
      <div className="flex-1 flex flex-col justify-center px-4 md:px-6 gap-1 min-w-0">
        
        {/* Row 1: Combat (HP and AP) */}
        <div className="flex items-center gap-4 md:gap-8">
          <StatBar 
            label="Health" 
            current={currentStats.hp} 
            max={currentStats.maxHp} 
            suffix={
              <div className="flex items-center gap-1.5 overflow-hidden">
                {currentStats.condition !== 'Bleeding' && (
                  <span className={cn(
                    "text-[8px] font-bold px-1 rounded-sm uppercase tracking-tighter whitespace-nowrap",
                    currentStats.condition === 'Normal' ? "bg-muted text-muted-foreground/60 dark:bg-white/5 dark:text-white/40" : "bg-amber-500/20 text-amber-500"
                  )}>
                    {currentStats.condition}
                  </span>
                )}
                {currentStats.isBleeding && (
                  <span className="text-[8px] font-black text-red-500 animate-pulse uppercase tracking-tighter whitespace-nowrap shadow-[0_0_8px_rgba(239,68,68,0.4)] mr-1">
                    Bleeding
                  </span>
                )}
                {currentStats.isStarving && (
                  <span className="text-[8px] font-black text-red-400 animate-pulse uppercase tracking-tighter whitespace-nowrap shadow-[0_0_8px_rgba(248,113,113,0.4)]">
                    Starving
                  </span>
                )}
                {currentStats.isDehydrated && (
                  <span className="text-[8px] font-black text-red-400 animate-pulse uppercase tracking-tighter whitespace-nowrap shadow-[0_0_8px_rgba(248,113,113,0.4)]">
                    Dehydrated
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
        <div className="flex items-center gap-3 md:gap-6 opacity-90">
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

      {/* 3. Secondary HUD: World Info */}
      <div className="flex items-center gap-3 pl-4 border-l border-border dark:border-white/10 h-full shrink-0">
        
        {/* Compact Turn/Time vertical group */}
        <div className="flex flex-col gap-1.5 mr-1 hidden sm:flex">
          <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-muted-foreground/60 dark:text-white/30 uppercase tracking-tighter tabular-nums">
            <span>Turn</span>
            <span className="text-foreground dark:text-white/80">{currentTurn}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px] font-mono font-bold text-muted-foreground/60 dark:text-white/30 uppercase tracking-tighter tabular-nums">
            <span>Time</span>
            <span className="text-foreground dark:text-white/80">
              {String(getHourFromTurn(currentTurn)).padStart(2, '0')}:00
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}