import { useState, useEffect, useContext } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { InventoryProvider } from '../../contexts/InventoryContext.jsx';
import { CombatProvider } from '../../contexts/CombatContext.jsx';
import MapInterface from './MapInterface';
import InventoryPanel from "../Inventory/InventoryPanel";
import GameControls from './GameControls';
import StartMenu from './StartMenu';
import { useWindowSize } from "@/hooks/useWindowSize";
import { GameErrorBoundary } from './ErrorBoundary.tsx';
import { MapTransitionDialog } from './MapTransitionDialog';
import SleepOverlay from './SleepOverlay';
import SleepModal from './SleepModal';


function GameScreenContent() {
  // Phase 2 Migration: This component now uses direct sub-context access
  // - PlayerContext for player data
  // - GameMapContext for map/world data  
  // - GameContext only for initialization lifecycle
  const [showStartMenu, setShowStartMenu] = useState(true);
  const [gameState, setGameState] = useState({
    turn: 15,
    playerName: "Alex Chen",
    location: "Abandoned Mall",
    zombieCount: 3,
  });

  const [playerStats, setPlayerStats] = useState({
    hp: 20,
    maxHp: 20,
    ap: 12,
    maxAp: 12,
    ammo: 24,
    nutrition: 20,
    maxNutrition: 20,
    hydration: 20,
    maxHydration: 20,
    energy: 20,
    maxEnergy: 20,
  });

  // Phase 2: Direct sub-context access - ALL HOOKS CALLED IN CONSISTENT ORDER
  const { playerStats: realPlayerStats } = usePlayer();
  const {
    gameMap,
    worldManager
  } = useGameMap();

  // Phase 4: Only use orchestration functions from GameContext
  const {
    isInitialized,
    isGameReady,
    initializationState,
    initializationError,
    turn,
    endTurn,
    initializeGame,
    loadGameDirect,
    mapTransition,
    handleMapTransitionConfirmWrapper,
    handleMapTransitionCancel,
    inventoryManager
  } = useGame();

  // Hide start menu when initialization starts OR when game is ready (from init or direct load)
  useEffect(() => {
    if (initializationState === 'preloading' && showStartMenu) {
      console.log('[GameScreenContent] Hiding start menu - initialization began');
      setShowStartMenu(false);
    }
    if (isGameReady && showStartMenu) {
      console.log('[GameScreenContent] Hiding start menu - game is ready');
      setShowStartMenu(false);
    }
  }, [initializationState, isGameReady, showStartMenu]);

  const handleStartGame = async (mode?: boolean | string) => {
    // Don't hide menu here - let the effect above do it when state changes

    if (mode === 'load') {
      console.log('[GameScreenContent] Loading saved game directly...');
      const success = await loadGameDirect('autosave');
      if (!success) {
        console.warn('[GameScreenContent] Load failed, falling back to new game');
        await initializeGame();
      }
      return;
    }

    // Only initialize a new game if no game was loaded and game is not already ready
    if (!isGameReady && !initializationError) {
      console.log('[GameScreenContent] Starting new game - initializing...');
      await initializeGame();
    } else if (isGameReady) {
      console.log('[GameScreenContent] Game already ready, proceeding to game view');
    }
  };

  const handleEndTurn = () => {
    if (isGameReady && endTurn) {
      endTurn();
    } else {
      // Fallback for demo mode
      setGameState(prev => ({ ...prev, turn: prev.turn + 1 }));
      setPlayerStats(prev => ({ ...prev, ap: prev.maxAp }));
    }
  };

  const handleRest = () => {
    setPlayerStats(prev => ({
      ...prev,
      ap: Math.min(prev.ap + 3, prev.maxAp),
      hp: Math.min(prev.hp + 10, prev.maxHp)
    }));
  };

  return (
    <InventoryProvider manager={inventoryManager}>
      <CombatProvider>
        {showStartMenu ? (
          <StartMenu onStartGame={handleStartGame} />
        ) : !isGameReady ? (
          <div className="h-screen w-screen bg-background flex items-center justify-center">
            <div className="text-center p-8">
              <p className="text-foreground text-xl">Loading game...</p>
              {initializationError && (
                <p className="text-red-500 mt-4">Error: {initializationError}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="game-container h-screen flex" data-testid="game-screen">
            {/* Left Side: Map + Controls */}
            <div className="w-1/2 flex flex-col h-full">
              <MapInterface gameState={{ ...gameState, turn }} />
              <div className="flex-shrink-0">
                <GameControls
                  playerStats={isGameReady ? realPlayerStats : playerStats}
                  gameState={{ ...gameState, turn }}
                  onEndTurn={handleEndTurn}
                  onRest={handleRest}
                />
              </div>
            </div>

            {/* Right Side: Inventory (Full Height) */}
            <InventoryPanel />

            {/* Map Transition Dialog */}
            {mapTransition && (
              <MapTransitionDialog
                open={!!mapTransition}
                onOpenChange={(open) => !open && handleMapTransitionCancel()}
                onConfirm={handleMapTransitionConfirmWrapper}
                direction={mapTransition.direction}
                currentMapId={worldManager?.currentMapId || 'unknown'}
                nextMapId={mapTransition.nextMapId}
              />
            )}

            {/* Sleep Overlay */}
            <SleepOverlay />
            {/* Sleep Modal */}
            <SleepModal />
          </div>
        )}
      </CombatProvider>
    </InventoryProvider>
  );
}

export default function GameScreen() {
  return (
    <GameErrorBoundary>
      <GameScreenContent />
    </GameErrorBoundary>
  );
}