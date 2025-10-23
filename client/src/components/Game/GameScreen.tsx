import { useState, useEffect, useContext } from 'react';
import { GameProvider, useGame } from '../../contexts/GameContext.jsx';
import { PlayerProvider, usePlayer } from '../../contexts/PlayerContext.jsx';
import { GameMapProvider, useGameMap } from '../../contexts/GameMapContext.jsx';
import { CameraProvider } from '../../contexts/CameraContext.jsx';
import MapInterface from './MapInterface';
import InventoryPanel from './InventoryPanel';
import GameControls from './GameControls';
import StartMenu from './StartMenu';
import { useWindowSize } from "@/hooks/useWindowSize";
import { GameErrorBoundary } from './ErrorBoundary.tsx';
import DevConsole from './DevConsole';
import { MapTransitionDialog } from './MapTransitionDialog';


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
    hp: 75,
    maxHp: 100,
    ap: 8,
    maxAp: 10,
    ammo: 24,
  });

  // Phase 2: Direct sub-context access - ALL HOOKS CALLED IN CONSISTENT ORDER
  const { playerStats: realPlayerStats } = usePlayer();
  const { 
    gameMap, 
    worldManager, 
    mapTransition, 
    handleMapTransitionConfirm, 
    handleMapTransitionCancel 
  } = useGameMap();

  // Phase 4: Only use orchestration functions from GameContext
  const { 
    isInitialized, 
    isGameReady,
    initializationError, 
    turn, 
    endTurn, 
    initializeGame,
    handleMapTransitionConfirmWrapper
  } = useGame();

  const handleStartGame = async (mode?: boolean | string) => {
    setShowStartMenu(false);

    if (mode === 'load') {
      console.log('[GameScreenContent] Starting new game with post-initialization loading...');
      await initializeGame(true, 'autosave');
      return;
    }

    if (mode === true) {
      console.log('[GameScreenContent] Game was loaded from save, proceeding to game view');
      // Don't initialize - game is already loaded
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

  // Show start menu if not initialized or if explicitly showing start menu
  if (showStartMenu) {
    return <StartMenu onStartGame={handleStartGame} />;
  }

  // Show loading if game is not ready
  if (!isGameReady) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-foreground text-xl">Loading game...</p>
          {initializationError && (
            <p className="text-red-500 mt-4">Error: {initializationError}</p>
          )}
        </div>
      </div>
    );
  }

  // Use real game state when available, fallback to demo state
  const currentStats = isGameReady ? realPlayerStats : playerStats;
  const currentState = isGameReady ? { ...gameState, turn } : gameState;

  return (
    <div className="game-container h-screen flex" data-testid="game-screen">
      {/* Left Side: Map + Controls */}
      <div className="w-1/2 flex flex-col h-full">
        <MapInterface gameState={currentState} />
        <div className="flex-shrink-0">
          <GameControls
            playerStats={currentStats}
            gameState={currentState}
            onEndTurn={handleEndTurn}
            onRest={handleRest}
          />
        </div>
      </div>

      {/* Right Side: Inventory (Full Height) */}
      <InventoryPanel />

      {/* Development Console */}
      <DevConsole />

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
    </div>
  );
}

export default function GameScreen() {
  // Phase 1: Ensure correct provider order: PlayerProvider → CameraProvider → GameMapProvider → GameProvider
  console.log('[GameScreen] Provider composition order: PlayerProvider → CameraProvider → GameMapProvider → GameProvider');
  return (
    <GameErrorBoundary>
      <PlayerProvider>
        <CameraProvider>
          <GameMapProvider>
            <GameProvider>
              <GameScreenContent />
            </GameProvider>
          </GameMapProvider>
        </CameraProvider>
      </PlayerProvider>
    </GameErrorBoundary>
  );
}