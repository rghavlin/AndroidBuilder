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

export default function StartMenuButtons({ className = '' }: StartMenuButtonsProps) {
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

  // Pre-labeled tiles packed into a 6-column x 3-row grid at the real grid slot
  // size, so the cluster reads as if these items were lying together on the
  // ground. Load Game is a 2x2 (its 128px art scales up like the in-game .357);
  // every other tile is 2x1 except the 4x1 Credits spear. The packing fills all
  // 18 cells exactly and mirrors the mockup:
  //   [Load Game][ Campaign ][Create Char]
  //   [Load Game][ Free Play][  Options  ]
  //   [Custom Map][   Credits (4 wide)   ]
  const slot = scalableSlotSize || 48;
  const COLS = 6;
  const ROWS = 3;
  const gridWidth = COLS * slot + (COLS - 1) * GAP_SIZE;

  // Mirror the grid overlay's per-theme item styling so these tiles restyle in
  // lockstep with real inventory items when the theme changes. The slab fill is
  // tuned to the *ground grid cell* colour for each theme (the .inset-slot
  // backgrounds in index.css) so the tiles read as part of the ground grid
  // rather than as darker item cards; the icon filter / blend mirror
  // UniversalGrid.getAdjustedBgColor.
  const slabBg =
    theme === 'light' ? '#e4e4e7'
    : theme === 'light2' ? '#e8ecf2'
    : theme === 'steampunk' ? 'linear-gradient(to bottom, #58595d 0%, #68696d 100%)'
    : theme === 'metallic' ? 'var(--metallic-slab)'
    : 'radial-gradient(circle at center, #242429 0%, #0c0c0f 100%)'; // dark & dark2
  // Border matched to the ground grid cell border (not the near-black
  // sunken-item-slab default) so the lattice around the tiles reads as light as
  // the real grid rather than a heavy dark cage.
  const slabBorder =
    theme === 'light' || theme === 'light2' ? 'rgba(0, 0, 0, 0.12)'
    : theme === 'steampunk' ? '#4a4b4f'
    : theme === 'metallic' ? '#4a4b4f'
    : '#2d2d35'; // dark & dark2
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
    // NOTE: a <div role="button"> (not a <button>) is deliberate. The metallic /
    // steampunk / light2 themes style every `[data-testid="ground-items-grid"]
    // button` with heavy gradient card chrome; a div sidesteps that so these
    // read as bare item tiles on the black panel, like grid items.
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
            className={`group outline-none transition-transform ${
              def.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95'
            }`}
            style={{
              gridColumn: `${def.col} / span ${def.w}`,
              gridRow: `${def.row} / span ${def.h}`,
            }}
          >
            {/* Themed item slab — same chrome as an inventory item: neutral slab
                fill, sunken border/highlight, and a recessed inner shadow. */}
            <div
              className={cn(
                "relative w-full h-full rounded-[3px] sunken-item-slab transition-all duration-200",
                !def.disabled && "group-hover:brightness-125"
              )}
              style={{ background: slabBg, borderColor: slabBorder }}
            >
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
              {/* Recessed inner shadow overlay — softened so the tile fill stays
                  close to the ground grid tone rather than reading darker. */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] rounded-[3px]" />
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
    <div className={`w-full py-2 bg-black border-b border-border select-none ${className}`}>
      {/* Menu tiles packed into a 6x3 grid, sized to the real ground slot so they
          read as items lying together on the ground. */}
      <div
        className="grid mx-auto"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${slot}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${slot}px)`,
          gap: `${GAP_SIZE}px`,
          width: `${gridWidth}px`,
        }}
      >
        {buttons.map(renderButton)}
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
