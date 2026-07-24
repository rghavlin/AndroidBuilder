import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import OptionsWindow from './OptionsWindow';
import CreditsWindow from './CreditsWindow';
import LoadGameWindow from './LoadGameWindow';
import ScenarioPickerWindow from './ScenarioPickerWindow';
import CharacterRegistryWindow from './CharacterRegistryWindow';
import { GameSaveSystem } from '@/game/GameSaveSystem';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGridSize } from "@/contexts/GridSizeContext";
import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { GAP_SIZE } from "../Inventory/constants";

interface StartMenuButtonsProps {
  className?: string;
  isTransparentGround?: boolean;
  tileImageUrl?: string;
}

interface MenuButtonDef {
  id: string;
  /** Pre-labeled image basename in ./images/UI (icon + baked-in label). */
  image: string;
  /** 1-based placement + span in the 6x3 tile grid. */
  col: number;
  row: number;
  w: number;
  h: number;
  tooltip: string;
  action: () => void;
  disabled?: boolean;
}

export default function StartMenuButtons({ className = '', isTransparentGround = false, tileImageUrl }: StartMenuButtonsProps) {
  const { loadGameDirect, initializeGame, shutdownGame } = useGame();
  const { scalableSlotSize } = useGridSize();
  const { theme } = useTheme();
  const [showOptions, setShowOptions] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showLoadGame, setShowLoadGame] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showRegistry, setShowRegistry] = useState(false);
  const [registryMode, setRegistryMode] = useState<'select' | 'manage'>('select');
  const [hasSave, setHasSave] = useState(false);
  const [pendingScenarioData, setPendingScenarioData] = useState<any>(null);

  const checkSave = async () => {
    try {
      const slots = await GameSaveSystem.listSaveSlots();
      const found = slots.some(
        s => ['autosave', 'autosave_backup', 'manual_1', 'manual_2'].includes(s.slotName) ||
             s.slotName.startsWith('autosave_backup_')
      );
      setHasSave(found);
    } catch (e) {
      console.warn('[StartMenuButtons] Failed to check save slots:', e);
      setHasSave(false);
    }
  };

  useEffect(() => {
    checkSave();
  }, []);

  const handleFreePlay = () => {
    setRegistryMode('select');
    setShowRegistry(true);
  };

  const handleSelectCharacter = async (character: any) => {
    // Warn (and, on confirm, delete) if this character is already tied to
    // active save games — starting a new game clobbers those saves.
    try {
      const slots = await GameSaveSystem.listSaveSlots();
      const conflictingSlots = slots.filter((s: any) => s.characterId === character.id);

      if (conflictingSlots.length > 0) {
        const confirmDelete = window.confirm(
          `Warning: The character "${character.name}" is already in use in ${conflictingSlots.length} active save game(s). ` +
          `Starting a new game will delete the existing save games for this character.\n\n` +
          `Do you want to proceed and delete the conflicting saves?`
        );
        if (!confirmDelete) return;

        for (const slot of conflictingSlots) {
          await GameSaveSystem.deleteSaveSlot(slot.slotName);
        }
        // Refresh the Load Game button's enabled state after deletion.
        await checkSave();
      }
    } catch (e) {
      console.warn('[StartMenuButtons] Failed to scan or delete conflicting saves:', e);
    }

    setShowRegistry(false);

    if (pendingScenarioData) {
      console.log('[StartMenuButtons] Starting custom game with character:', character.name, 'and map:', pendingScenarioData.name);
      window.dispatchEvent(new CustomEvent('launch-custom-game', {
        detail: {
          scenarioData: pendingScenarioData,
          easyStart: false,
          customStats: character
        }
      }));
      setPendingScenarioData(null);
    } else {
      console.log('[StartMenuButtons] Starting Free Play with character:', character.name);
      await initializeGame({ customStats: character });
    }
  };

  const handleLoadSlot = async (slotName: string) => {
    setShowLoadGame(false);
    console.log(`[StartMenuButtons] Loading slot ${slotName}...`);
    await loadGameDirect(slotName);
  };

  const handleScenarioLoad = (scenarioData: any) => {
    setPendingScenarioData(scenarioData);
    setShowScenarios(false);
    setRegistryMode('select');
    setShowRegistry(true);
  };

  const slot = scalableSlotSize || 48;
  const COLS = 6;
  const ROWS = 3;
  const gridWidth = COLS * slot + (COLS - 1) * GAP_SIZE;
  const gridHeight = ROWS * slot + (ROWS - 1) * GAP_SIZE;

  const getItemSlabBg = (themeName: string) => {
    if (themeName === 'light2') return 'rgba(255, 255, 255, 0.15)';
    if (themeName === 'steampunk') return 'var(--sp-slab)';
    if (themeName === 'metallic') return 'var(--metallic-slab)';
    if (themeName === 'light') return '#e4e4e7';
    return 'var(--card)'; // dark & dark2 item background
  };

  const iconFilter =
    theme === 'steampunk' ? 'var(--sp-icon-filter)'
    : theme === 'metallic' ? 'var(--metallic-icon-filter)'
    : theme === 'light2' ? 'invert(0.75)'
    : theme === 'light' ? 'invert(1)'
    : undefined;
  const iconBlend =
    (!theme.startsWith('dark') && theme !== 'metallic') ? 'mix-blend-multiply' : 'mix-blend-screen';

  const buttons: MenuButtonDef[] = [
    {
      id: 'load-game', image: 'loadgame', col: 1, row: 1, w: 2, h: 2,
      tooltip: hasSave ? 'Load a saved game' : 'No save games available',
      action: () => setShowLoadGame(true), disabled: !hasSave,
    },
    {
      id: 'campaign', image: 'campaign', col: 3, row: 1, w: 2, h: 1,
      tooltip: 'Story Campaign mode', action: () => {},
    },
    {
      id: 'create-character', image: 'createcharacter', col: 5, row: 1, w: 2, h: 1,
      tooltip: 'Create & manage custom characters',
      action: () => { setRegistryMode('manage'); setShowRegistry(true); },
    },
    {
      id: 'free-play', image: 'freeplay', col: 3, row: 2, w: 2, h: 1,
      tooltip: 'Start a new survival game', action: handleFreePlay,
    },
    {
      id: 'options', image: 'options', col: 5, row: 2, w: 2, h: 1,
      tooltip: 'Game audio & display settings', action: () => setShowOptions(true),
    },
    {
      id: 'custom-map', image: 'custommap', col: 1, row: 3, w: 2, h: 1,
      tooltip: 'Play user-created custom scenarios', action: () => setShowScenarios(true),
    },
    {
      id: 'credits', image: 'credits', col: 3, row: 3, w: 4, h: 1,
      tooltip: 'View game development credits', action: () => setShowCredits(true),
    },
  ];

  const renderButton = (def: MenuButtonDef) => {
    const leftPos = (def.col - 1) * (slot + GAP_SIZE);
    const topPos = (def.row - 1) * (slot + GAP_SIZE);
    const buttonWidth = def.w * slot + (def.w - 1) * GAP_SIZE;
    const buttonHeight = def.h * slot + (def.h - 1) * GAP_SIZE;

    return (
      <Tooltip key={def.id}>
        <TooltipTrigger asChild>
          <div
            role="button"
            tabIndex={def.disabled ? -1 : 0}
            aria-disabled={def.disabled}
            aria-label={def.id}
            data-testid={`start-menu-${def.id}`}
            onClick={def.disabled ? undefined : def.action}
            onKeyDown={(e) => {
              if (!def.disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                def.action();
              }
            }}
            className={cn(
              "absolute z-10 pointer-events-auto select-none rounded-[3px] sunken-item-slab transition-all duration-200 group outline-none",
              def.disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-95 hover:brightness-125"
            )}
            style={{
              left: `${leftPos}px`,
              top: `${topPos}px`,
              width: `${buttonWidth}px`,
              height: `${buttonHeight}px`,
              background: getItemSlabBg(theme),
            }}
            data-inventory-ui="true"
          >
            <div className="w-full h-full relative">
              <img
                src={`./images/UI/${def.image}.png`}
                alt={def.id}
                className={cn(
                  "w-full h-full object-contain pointer-events-none select-none",
                  iconBlend
                )}
                style={{ filter: iconFilter }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              {/* Recessed inner shadow overlay — exact same as UniversalGrid item overlays */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_3px_6px_rgba(0,0,0,0.85)] rounded-[3px] z-10" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs font-semibold">{def.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className={cn("w-full py-2 border-b border-border select-none flex justify-center", className)}>
      <div
        className="relative flex-shrink-0"
        style={{
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
        }}
      >
        {/* Layer 1: Ground grid cells mesh (18 1x1 slots) */}
        <div
          className={cn(
            "grid absolute inset-0 select-none",
            isTransparentGround && tileImageUrl && "tile-backed-grid"
          )}
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${slot}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${slot}px)`,
            gap: `${GAP_SIZE}px`,
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            ...(isTransparentGround && tileImageUrl ? {
              backgroundImage: `url(${tileImageUrl})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '64px',
            } : {}),
          }}
          data-inventory-ui="true"
        >
          {Array.from({ length: COLS * ROWS }).map((_, i) => {
            const x = i % COLS;
            const y = Math.floor(i / COLS);
            return (
              <div
                key={`menu-bg-slot-${x}-${y}`}
                className={cn(
                  "flex-shrink-0 relative rounded-[3px]",
                  isTransparentGround ? "transparent-ground-slot" : "inset-slot"
                )}
                style={{ width: `${slot}px`, height: `${slot}px` }}
              />
            );
          })}
        </div>

        {/* Layer 2: Menu Button Item Overlays */}
        <div
          className="absolute inset-0 select-none pointer-events-none"
          style={{ width: `${gridWidth}px`, height: `${gridHeight}px` }}
        >
          {buttons.map(renderButton)}
        </div>
      </div>

      {/* Modal Dialog Windows */}
      {showOptions && <OptionsWindow onClose={() => { setShowOptions(false); checkSave(); }} />}
      {showCredits && <CreditsWindow onClose={() => setShowCredits(false)} />}
      {showLoadGame && (
        <LoadGameWindow
          onClose={() => setShowLoadGame(false)}
          onLoad={handleLoadSlot}
        />
      )}
      {showScenarios && (
        <ScenarioPickerWindow
          onClose={() => setShowScenarios(false)}
          onLoad={handleScenarioLoad}
        />
      )}
      {showRegistry && (
        <CharacterRegistryWindow
          mode={registryMode}
          onClose={() => {
            setShowRegistry(false);
            setPendingScenarioData(null);
          }}
          onSelect={handleSelectCharacter}
        />
      )}
    </div>
  );
}
