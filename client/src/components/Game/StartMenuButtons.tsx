import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import OptionsWindow from './OptionsWindow';
import CreditsWindow from './CreditsWindow';
import LoadGameWindow from './LoadGameWindow';
import ScenarioPickerWindow from './ScenarioPickerWindow';
import CharacterRegistryWindow from './CharacterRegistryWindow';
import { GameSaveSystem } from '@/game/GameSaveSystem';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StartMenuButtonsProps {
  className?: string;
}

interface MenuButtonDef {
  id: string;
  label: string;
  imageId: string;
  tooltip: string;
  action: () => void;
  disabled?: boolean;
}

export default function StartMenuButtons({ className = '' }: StartMenuButtonsProps) {
  const { loadGameDirect, initializeGame, shutdownGame } = useGame();
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
    
    // Shutdown current start menu sandbox first
    shutdownGame();

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
    shutdownGame();
    console.log(`[StartMenuButtons] Loading slot ${slotName}...`);
    await loadGameDirect(slotName);
  };

  const handleScenarioLoad = (scenarioData: any) => {
    setPendingScenarioData(scenarioData);
    setShowScenarios(false);
    setRegistryMode('select');
    setShowRegistry(true);
  };

  return (
    <div className={`w-full p-2 bg-black/90 border-b border-border select-none ${className}`}>
      {/* 3-Row Grid Container matching mockup structure */}
      <div className="flex flex-col gap-2">
        {/* Row 1: Load Game (.357), Campaign (Knife), Create Character (Water Bottle) */}
        <div className="grid grid-cols-3 gap-2 items-center">
          {/* Load Game (.357 Pistol) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowLoadGame(true)}
                disabled={!hasSave}
                className={`flex flex-col items-center justify-center p-1.5 rounded border transition-all active:scale-95 ${
                  hasSave 
                    ? 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-400 hover:bg-zinc-800' 
                    : 'bg-zinc-950/50 border-zinc-800/40 opacity-40 cursor-not-allowed'
                }`}
              >
                <img
                  src="./images/items/357.png"
                  alt="Load Game"
                  className="h-10 object-contain filter invert contrast-200"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="text-[10px] font-black text-white uppercase tracking-wider mt-0.5 drop-shadow">
                  LOAD GAME
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs font-semibold">{hasSave ? 'Load a saved game' : 'No save games available'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Campaign (Knife) - No-op for now */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {}}
                className="flex flex-col items-center justify-center p-1.5 rounded border border-zinc-700 bg-zinc-900/90 hover:border-zinc-400 hover:bg-zinc-800 transition-all active:scale-95"
              >
                <img
                  src="./images/items/knife.png"
                  alt="Campaign"
                  className="h-7 object-contain filter invert contrast-200"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="text-[10px] font-black text-white uppercase tracking-wider mt-0.5 drop-shadow">
                  CAMPAIGN
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs font-semibold">Story Campaign mode</p>
            </TooltipContent>
          </Tooltip>

          {/* Create Character (Water Bottle) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setRegistryMode('manage');
                  setShowRegistry(true);
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded border border-zinc-700 bg-zinc-900/90 hover:border-zinc-400 hover:bg-zinc-800 transition-all active:scale-95"
              >
                <img
                  src="./images/items/waterbottle.png"
                  alt="Create Character"
                  className="h-7 object-contain filter invert contrast-200"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="text-[10px] font-black text-white uppercase tracking-wider mt-0.5 drop-shadow text-center leading-none">
                  CREATE<br/>CHARACTER
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs font-semibold">Create & manage custom characters</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Row 2: Spacer/Free Play (Molotov), Options (NVG) */}
        <div className="grid grid-cols-2 gap-2 items-center">
          {/* Free Play (Molotov Cocktail) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleFreePlay}
                className="flex flex-col items-center justify-center p-1.5 rounded border border-amber-600/60 bg-amber-950/40 hover:bg-amber-900/60 hover:border-amber-400 transition-all active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
              >
                <img
                  src="./images/items/molotovcocktail.png"
                  alt="Free Play"
                  className="h-8 object-contain filter invert contrast-200"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="text-[11px] font-black text-amber-200 uppercase tracking-widest mt-0.5 drop-shadow">
                  FREE PLAY
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs font-semibold">Start a new survival game</p>
            </TooltipContent>
          </Tooltip>

          {/* Options (Night Vision Goggles) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowOptions(true)}
                className="flex flex-col items-center justify-center p-1.5 rounded border border-zinc-700 bg-zinc-900/90 hover:border-zinc-400 hover:bg-zinc-800 transition-all active:scale-95"
              >
                <img
                  src="./images/items/nightvision.png"
                  alt="Options"
                  className="h-7 object-contain filter invert contrast-200"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="text-[10px] font-black text-white uppercase tracking-wider mt-0.5 drop-shadow">
                  OPTIONS
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs font-semibold">Game audio & display settings</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Row 3: Custom Map (Wrench), Credits (Spear) */}
        <div className="grid grid-cols-2 gap-2 items-center">
          {/* Custom Map (Wrench) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowScenarios(true)}
                className="flex flex-col items-center justify-center p-1.5 rounded border border-zinc-700 bg-zinc-900/90 hover:border-zinc-400 hover:bg-zinc-800 transition-all active:scale-95"
              >
                <img
                  src="./images/items/wrench.png"
                  alt="Custom Map"
                  className="h-6 object-contain filter invert contrast-200"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="text-[10px] font-black text-white uppercase tracking-wider mt-0.5 drop-shadow">
                  CUSTOM MAP
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs font-semibold">Play user-created custom scenarios</p>
            </TooltipContent>
          </Tooltip>

          {/* Credits (Spear) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowCredits(true)}
                className="flex flex-col items-center justify-center p-1.5 rounded border border-zinc-700 bg-zinc-900/90 hover:border-zinc-400 hover:bg-zinc-800 transition-all active:scale-95"
              >
                <img
                  src="./images/items/spear.png"
                  alt="Credits"
                  className="h-6 object-contain filter invert contrast-200"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="text-[10px] font-black text-white uppercase tracking-wider mt-0.5 drop-shadow">
                  CREDITS
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs font-semibold">View game development credits</p>
            </TooltipContent>
          </Tooltip>
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
