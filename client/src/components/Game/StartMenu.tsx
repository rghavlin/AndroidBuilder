
import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import OptionsWindow from './OptionsWindow';
import CreditsWindow from './CreditsWindow';
import HelpWindow from './HelpWindow';
import LoadGameWindow from './LoadGameWindow';
import ScenarioPickerWindow from './ScenarioPickerWindow';
import musicManager from '@/game/utils/MusicManager';
import { GameSaveSystem } from '@/game/GameSaveSystem';
import { CharacterRegistry } from '@/game/CharacterRegistry';
import CharacterRegistryWindow from './CharacterRegistryWindow';

interface StartMenuProps {
  onStartGame: (mode?: boolean | string | { customStats: any }) => void;
}

export default function StartMenu({ onStartGame }: StartMenuProps) {
  // Phase 2: Only use GameContext for game lifecycle methods
  const { loadGame, initializeGame } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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
      console.warn('[StartMenu] Failed to check save slots:', e);
      setHasSave(false);
    }
  };

  useEffect(() => {
    checkSave();
  }, []);

  useEffect(() => {
    // Attempt to play the menu music on mount.
    // In environments where autoplay is allowed (or enabled like in Electron), this will work immediately.
    musicManager.playPlaylist('menu');

    // For environments with strict autoplay policies (like standard web browsers),
    // we listen for the first user interaction to start the menu music if it hasn't started yet.
    const handleInteraction = () => {
      // Only play the menu music if it's not already playing AND we haven't already started a game (which sets standard playlist)
      if (!musicManager.isPlaying && musicManager.currentPlaylist !== 'standard') {
        musicManager.playPlaylist('menu');
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const handleNewGame = () => {
    console.log('[StartMenu] Opening registry to select character for new game...');
    setRegistryMode('select');
    setShowRegistry(true);
  };

  const handleSelectCharacter = async (character: any) => {
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

        // Delete conflicting save slots
        for (const slot of conflictingSlots) {
          await GameSaveSystem.deleteSaveSlot(slot.slotName);
        }
        // Re-check save slots to update the Start Menu's Load Game button state
        await checkSave();
      }
    } catch (e) {
      console.warn('[StartMenu] Failed to scan or delete conflicting saves:', e);
    }

    setShowRegistry(false);

    if (pendingScenarioData) {
      console.log('[StartMenu] Starting custom game with character:', character.name, 'and map:', pendingScenarioData.name);
      musicManager.playPlaylist('standard');
      window.dispatchEvent(new CustomEvent('launch-custom-game', {
        detail: {
          scenarioData: pendingScenarioData,
          easyStart: false,
          customStats: character
        }
      }));
      setPendingScenarioData(null);
    } else {
      console.log('[StartMenu] Starting new game with character:', character.name);
      musicManager.playPlaylist('standard');
      if (onStartGame) {
        // Pass the selected character's stats as customStats
        onStartGame({ customStats: character });
      }
    }
  };

  const handleLoadSlot = async (slotName: string) => {
    setIsLoading(true);
    console.log(`[StartMenu] Requesting load from slot ${slotName}...`);
    musicManager.playPlaylist('standard');
    if (onStartGame) {
      onStartGame(`load:${slotName}`);
    }
    setShowLoadGame(false);
    setIsLoading(false);
  };

  const handleScenarioLoad = (scenarioData: any) => {
    console.log(`[StartMenu] Scenario picked: "${scenarioData.name}". Opening registry to select character...`);
    setPendingScenarioData(scenarioData);
    setShowScenarios(false);
    setRegistryMode('select');
    setShowRegistry(true);
  };

  return (
    <div 
      className="relative h-full w-full bg-no-repeat select-none"
      style={{ backgroundImage: "url('./images/background/menubackground.png')", backgroundSize: '100% 100%' }}
    >
      {/* Solid black, sharply angled geometric panel behind the menu list to completely obscure the background art */}
      <div 
        className="absolute right-0 bottom-0 w-[32%] min-w-[380px] h-[55%] bg-black z-5 pointer-events-none"
        style={{ clipPath: 'polygon(12% 18%, 100% 0, 100% 100%, 0 100%)' }}
      />

      {/* Menu buttons positioned in the bottom-right corner with tight compression */}
      <div className="absolute bottom-8 right-[4%] z-10 flex flex-col gap-[1px] items-center justify-end min-w-[280px]">
        <button
          onClick={handleNewGame}
          disabled={isLoading}
          className="menu-btn-stencil"
          data-testid="button-new-game"
        >
          New Game
        </button>

        <button
          onClick={() => {
            setRegistryMode('manage');
            setShowRegistry(true);
          }}
          disabled={isLoading}
          className="menu-btn-stencil"
          data-testid="button-create-character"
        >
          Create Character
        </button>
        
        <button
          onClick={() => setShowLoadGame(true)}
          disabled={isLoading || !hasSave}
          className="menu-btn-stencil"
          data-testid="button-load-game"
        >
          {isLoading ? 'Loading...' : 'Load Game'}
        </button>

        <button
          onClick={() => setShowScenarios(true)}
          disabled={isLoading}
          className="menu-btn-stencil"
          data-testid="button-custom-map"
        >
          Custom Map
        </button>

        <button
          onClick={() => setShowOptions(true)}
          disabled={isLoading}
          className="menu-btn-stencil"
          data-testid="button-start-options"
        >
          Options
        </button>

        <button
          onClick={() => setShowCredits(true)}
          disabled={isLoading}
          className="menu-btn-stencil"
          data-testid="button-start-credits"
        >
          Credits
        </button>

        <button
          onClick={() => setShowHelp(true)}
          disabled={isLoading}
          className="menu-btn-stencil"
          data-testid="button-start-help"
        >
          Help
        </button>
      </div>

      {showOptions && <OptionsWindow onClose={() => {
        setShowOptions(false);
        checkSave();
      }} />}
      {showCredits && <CreditsWindow onClose={() => setShowCredits(false)} />}
      {showHelp && <HelpWindow onClose={() => setShowHelp(false)} />}
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
