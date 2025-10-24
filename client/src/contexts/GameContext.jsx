import React, { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { TestEntity, Item } from '../game/entities/TestEntity.js';
import { Zombie } from '../game/entities/Zombie.js';
import { ZombieAI } from '../game/ai/ZombieAI.js';
import { PlayerZombieTracker } from '../game/ai/PlayerZombieTracker.js';
import { GameSaveSystem } from '../game/GameSaveSystem.js';
import GameInitializationManager from '../game/GameInitializationManager.js';
import { PlayerProvider, usePlayer } from './PlayerContext.jsx';
import { GameMapProvider, useGameMap } from './GameMapContext.jsx';
import { CameraProvider, useCamera } from './CameraContext.jsx';
import { InventoryProvider } from './InventoryContext.jsx';
import '../game/inventory/index.js';

// Test functions are imported via inventory system

const GameContext = createContext();

export { GameContext }; // Export the context for direct useContext access

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    // During development hot reloads, provide a fallback to prevent crashes
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GameContext] Context not available during hot reload, providing fallback');
      return {
        isInitialized: false,
        initializationError: null,
        turn: 1,
        isPlayerTurn: true,
        isAutosaving: false,
        initializeGame: () => {},
        endTurn: () => {},
        saveGame: () => {},
        loadGame: () => {},
        loadAutosave: () => {},
        exportGame: () => {},
        spawnTestEntities: () => {}
      };
    }
    throw new Error('useGame must be used within a GameProvider');
  }

  // Phase 1: Only expose orchestration functions and game lifecycle state
  // No more sub-context data aggregation
  return context;
};

const GameContextInner = ({ children }) => {
  // Use context hooks
  const { playerRef, setPlayerRef, setPlayerPosition, setupPlayerEventListeners, updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions, getPlayerCardinalPositions, startAnimatedMovement, cancelMovement, isMoving: isAnimatingMovement } = usePlayer();
  const { gameMapRef, worldManagerRef, gameMap, worldManager, setGameMap, setWorldManager, setZombieTracker, handleTileClick: mapHandleTileClick, handleTileHover, lastTileClick, hoveredTile, mapTransition, handleMapTransitionConfirm: mapTransitionConfirm, handleMapTransitionCancel } = useGameMap();
  const { cameraRef, camera, setCamera, setCameraWorldBounds } = useCamera();

  // Phase 5A: Store inventoryManager from initialization
  const [inventoryManager, setInventoryManager] = useState(null);

  // Refs for internal use
  const initManagerRef = useRef(null);

  // LastSeen tile tagging system to prevent zombie clustering
  const lastSeenTaggedTilesRef = useRef(new Set());

  // State machine state
  const [initializationState, setInitializationState] = useState('idle');
  const initRef = useRef('idle'); // Mirror state in ref to avoid closure issues
  const runIdRef = useRef(0); // Track initialization runs
  const [initializationError, setInitializationError] = useState(null);

  // Context synchronization state
  const [contextSyncPhase, setContextSyncPhase] = useState('idle'); // 'idle', 'updating', 'ready'
  
  // Explicit UI gate to replace problematic contextSyncPhase logic
  const [isGameReady, setIsGameReady] = useState(false);
  
  // Computed from state machine and explicit gate
  const isInitialized = initializationState === 'complete' && isGameReady;
  
  // Sync ref whenever state changes
  useEffect(() => { 
    initRef.current = initializationState; 
  }, [initializationState]);
  const [turn, setTurn] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAutosaving, setIsAutosaving] = useState(false);



  const wireManagerEvents = useCallback((manager, runId) => {
    const handleStateChanged = ({ current }) => {
      // Ignore events from old runs
      if (runIdRef.current !== runId) {
        console.log(`[GameContext] Ignoring stale state change from run ${runId}, current run is ${runIdRef.current}`);
        return;
      }
      setInitializationState(current);
      console.log('[GameContext] Initialization state changed to:', current);
    };

    const handleInitializationComplete = (gameObjects) => {
      if (runIdRef.current !== runId) {
        console.log(`[GameContext] Ignoring stale completion from run ${runId}`);
        return;
      }
      
      console.log('[GameContext] State machine initialization completed');
      setContextSyncPhase('updating');

      // Set up context references synchronously (Phase 5A: includes inventoryManager)
      setInventoryManager(gameObjects.inventoryManager);
      setGameMap(gameObjects.gameMap);
      setPlayerRef(gameObjects.player);
      setCamera(gameObjects.camera);
      setWorldManager(gameObjects.worldManager);

      // Set up camera and player
      const { gameMap, player, camera } = gameObjects;
      camera.setWorldBounds(gameMap.width, gameMap.height);
      camera.centerOn(player.x, player.y);
      setupPlayerEventListeners();
      
      setIsGameReady(true);
      console.log('[GameContext] Game is ready - UI gate opened');
    };

    const handleInitializationError = (error) => {
      if (runIdRef.current !== runId) {
        console.log(`[GameContext] Ignoring stale error from run ${runId}`);
        return;
      }
      console.error('[GameContext] State machine initialization failed:', error);
      setInitializationError(error.message);
    };

    manager.removeAllListeners(); // Clean slate
    manager.on('stateChanged', handleStateChanged);
    manager.on('initializationComplete', handleInitializationComplete);
    manager.on('initializationError', handleInitializationError);
  }, [setInventoryManager, setGameMap, setPlayerRef, setCamera, setWorldManager, setupPlayerEventListeners]);

  useEffect(() => {
    console.log('[GameContext] 🏗️ CHECKING FOR EXISTING INITIALIZATION MANAGER...');
    
    // SINGLETON PATTERN: Prevent multiple initialization managers
    if (initManagerRef.current) {
      console.warn('[GameContext] ⚠️ GameInitializationManager already exists, skipping creation');
      console.log('[GameContext] - Existing manager instance ID:', initManagerRef.current.instanceId);
      return;
    }
    
    // Check global instances to prevent race conditions
    if (window.gameInitInstances && window.gameInitInstances.size > 0) {
      console.error('[GameContext] 🚨 GLOBAL INSTANCES ALREADY EXIST! Preventing duplicate creation');
      console.error('[GameContext] - Existing instances:', Array.from(window.gameInitInstances));
      return;
    }
    
    console.log('[GameContext] ✅ Creating NEW GameInitializationManager...');
    
    const zombieTracker = new PlayerZombieTracker();
    setZombieTracker(zombieTracker);
    
    initManagerRef.current = new GameInitializationManager();
    console.log('[GameContext] ✅ GameInitializationManager created:', initManagerRef.current.instanceId);

    const manager = initManagerRef.current;

    wireManagerEvents(manager, runIdRef.current);

    return () => {
      console.log('[GameContext] 🧹 CLEANUP: Removing initialization manager listeners');
      if (initManagerRef.current) {
        console.log('[GameContext] - Cleaning up manager:', initManagerRef.current.instanceId);
        initManagerRef.current.removeAllListeners();
        
        // Remove from global tracking
        if (window.gameInitInstances && initManagerRef.current.instanceId) {
          window.gameInitInstances.delete(initManagerRef.current.instanceId);
          console.log('[GameContext] - Removed from global tracking. Remaining instances:', window.gameInitInstances.size);
        }
        
        initManagerRef.current = null;
      }
    };
  }, []); // CRITICAL: Remove all dependencies to prevent re-runs

  // Context Synchronization: Wait for all sub-contexts to have data before marking as ready
  useEffect(() => {
    if (contextSyncPhase === 'updating' && gameMap && playerRef.current && camera && worldManager) {
      console.log('[GameContext] All contexts synchronized, executing final setup...');
      
      // Development assertions
      if (process.env.NODE_ENV === 'development') {
        if (!playerRef.current.x || !playerRef.current.y) {
          console.error('[GameContext] DEV ASSERTION FAILED: Player has invalid position', playerRef.current);
        }
        if (!gameMap.width || !gameMap.height) {
          console.error('[GameContext] DEV ASSERTION FAILED: GameMap has invalid dimensions', gameMap);
        }
        if (!camera.x && camera.x !== 0 || !camera.y && camera.y !== 0) {
          console.error('[GameContext] DEV ASSERTION FAILED: Camera has invalid position', camera);
        }
      }
      
      // Now safe to do operations that depend on all contexts
      updatePlayerFieldOfView(gameMap);
      updatePlayerCardinalPositions(gameMap);
      
      // Mark as fully ready
      setContextSyncPhase('ready');
      console.log('[GameContext] Initialization fully complete - all contexts ready for operations');
    }
  }, [contextSyncPhase, gameMap, camera, worldManager, updatePlayerFieldOfView, updatePlayerCardinalPositions]);



  const loadGame = useCallback(async (slotName = 'quicksave') => {
    try {
      const loadedState = await GameSaveSystem.loadFromLocalStorage(slotName);
      if (!loadedState) {
        console.warn(`[GameContext] No save found in slot: ${slotName}`);
        return false;
      }
      console.log('[GameContext] Applying loaded state...');

      // Set up loaded state in contexts
      setGameMap(loadedState.gameMap);
      setPlayerRef(loadedState.player);
      setCamera(loadedState.camera);
      setWorldManager(loadedState.worldManager);

      setTurn(loadedState.turn);
      setIsPlayerTurn(true);
      setIsAutosaving(false);
      lastSeenTaggedTilesRef.current = loadedState.lastSeenTaggedTiles || new Set();

      console.log('[GameContext] Setting up event listeners for loaded player...');
      setupPlayerEventListeners();

      // Recenter camera on loaded player position
      if (loadedState.camera && loadedState.player) {
        loadedState.camera.centerOn(loadedState.player.x, loadedState.player.y);
        console.log(`[GameContext] Camera recentered on loaded player position (${loadedState.player.x}, ${loadedState.player.y})`);
      }

      setTimeout(() => {
        updatePlayerFieldOfView(loadedState.gameMap);
        updatePlayerCardinalPositions(loadedState.gameMap);
        console.log(`[GameContext] Game loaded successfully from slot: ${slotName}`);
        console.log(`[GameContext] Player position after load: (${loadedState.player.x}, ${loadedState.player.y})`);
      }, 50);

      return true;
    } catch (error) {
      console.error('[GameContext] Failed to load game:', error);
      return false;
    }
  }, [setGameMap, setPlayerRef, setCamera, setWorldManager, setupPlayerEventListeners, updatePlayerFieldOfView, updatePlayerCardinalPositions]);

  const initializeGame = useCallback(async (loadGameAfterInit = false, slotName = 'autosave') => {
    if (!initManagerRef.current) {
      console.error('[GameContext] GameInitializationManager not available');
      return;
    }
    
    const now = initRef.current; // Use ref, not captured state
    
    // Block if actively initializing
    if (now === 'preloading' || now === 'core_setup' || now === 'world_population') {
      console.warn('[GameContext] Initialization already in progress, ignoring duplicate call');
      return;
    }
    
    // Allow restart from terminal states
    if (now === 'complete' || now === 'error') {
      console.log('[GameContext] Restarting from terminal state:', now);
      runIdRef.current += 1; // Invalidate old event handlers
      setIsGameReady(false);
      setInitializationError(null);
      
      // Reset existing manager instead of creating new one
      if (initManagerRef.current.reset) {
        initManagerRef.current.reset();
      }
      
      setInitializationState('idle');
      wireManagerEvents(initManagerRef.current, runIdRef.current);
    }
    
    console.log(`[GameContext] Starting game initialization (run ${runIdRef.current})...`);
    setInitializationError(null);
    setContextSyncPhase('idle'); // Reset sync phase for new initialization

    let postInitCallback = null;
    if (loadGameAfterInit) {
      postInitCallback = async (gameObjects) => {
        console.log('[GameContext] Post-init: Loading save data over initialized game...');
        const success = await loadGame(slotName);
        if (!success) {
          console.warn('[GameContext] Post-init: Failed to load save data, continuing with new game');
        } else {
          console.log('[GameContext] Post-init: Save data loaded successfully');
        }
      };
    }

    const success = await initManagerRef.current.startInitialization(postInitCallback);
    if (!success) {
      const error = initManagerRef.current.getError();
      setInitializationError(error || 'Unknown initialization error');
    }
  }, [wireManagerEvents, loadGame]);



  const performAutosave = useCallback(() => {
    if (!isInitialized) return false;

    try {
      setIsAutosaving(true);

      // FIX 4: CRITICAL - Verify player is on map before saving
      const playersOnMap = gameMapRef.current?.getEntitiesByType('player') || [];
      if (playersOnMap.length === 0) {
        console.error('[GameContext] Autosave aborted - no player on map!');
        setIsAutosaving(false);
        return false;
      }

      console.log('[GameContext] Performing autosave with valid game state...');

      const currentGameState = {
        gameMap: gameMapRef.current,
        worldManager: worldManagerRef.current,
        player: playerRef.current,
        camera: cameraRef.current,
        turn: turn,
        playerStats: { hp: playerRef.current?.hp || 100, maxHp: playerRef.current?.maxHp || 100, ap: playerRef.current?.ap || 10, maxAp: playerRef.current?.maxAp || 10, ammo: 0 }
      };

      const success = GameSaveSystem.saveToLocalStorage(currentGameState, 'autosave');
      if (success) {
        console.log('[GameContext] Autosave completed successfully');
      } else {
        console.warn('[GameContext] Autosave failed');
      }

      setIsAutosaving(false);
      return success;
    } catch (error) {
      console.error('[GameContext] Autosave error:', error);
      setIsAutosaving(false);
      return false;
    }
  }, [isInitialized, turn, playerRef, gameMapRef, worldManagerRef, cameraRef]);

  const endTurn = useCallback(async () => {
    if (!isInitialized || !playerRef.current || !gameMap || !isPlayerTurn) {
      console.warn('[GameContext] Cannot end turn - missing requirements', {
        isInitialized, 
        hasPlayer: !!playerRef.current, 
        hasGameMap: !!gameMap, 
        isPlayerTurn
      });
      return;
    }

    try {
      setIsPlayerTurn(false);
      lastSeenTaggedTilesRef.current.clear();
      console.log('[GameContext] Cleared all LastSeen tagged tiles for new zombie turn phase');

      const player = playerRef.current;
      const zombies = gameMap.getEntitiesByType('zombie');
      console.log(`[GameContext] Processing ${zombies.length} zombie turns`);

      zombies.forEach(zombie => {
        const turnResult = ZombieAI.executeZombieTurn(
          zombie,
          gameMap,
          player,
          getPlayerCardinalPositions(),
          lastSeenTaggedTilesRef.current
        );

        if (turnResult.success) {
          console.log(`[GameContext] Zombie ${zombie.id} turn completed:`, {
            behavior: turnResult.behaviorTriggered,
            apUsed: turnResult.apUsed,
            actions: turnResult.actions.length
          });
          turnResult.actions.forEach((action, index) => {
            if (action.type === 'move') {
              console.log(`[GameContext] - Action ${index + 1}: Moved from (${action.from.x}, ${action.from.y}) to (${action.to.x}, ${action.to.y})`);
            }
          });
        } else {
          console.warn(`[GameContext] Zombie ${zombie.id} turn failed:`, turnResult.reason || turnResult.error);
        }
      });

      player.restoreAP(player.maxAp - player.ap);
      updatePlayerStats({ ap: player.ap });
      console.log(`[GameContext] Player AP restored to: ${player.ap}`);

      updatePlayerFieldOfView(gameMap);
      updatePlayerCardinalPositions(gameMap);

      const newTurn = turn + 1;
      setTurn(newTurn);
      console.log('[GameContext] Turn ended. Current turn:', newTurn);

      await performAutosave();

      setIsPlayerTurn(true);

    } catch (error) {
      console.error('[GameContext] Error ending turn:', error);
      setIsPlayerTurn(true);
    }
  }, [turn, isInitialized, isPlayerTurn, updatePlayerFieldOfView, updatePlayerCardinalPositions, performAutosave, playerRef, gameMap, getPlayerCardinalPositions, updatePlayerStats]);

  // Legacy wrapper methods (these should be removed in Phase 2)
  const handleTileClick = useCallback((x, y) => {
    console.warn('[GameContext] handleTileClick called - this should be accessed directly from GameMapContext');
    return;
  }, []);

  const handleTileHoverWrapper = useCallback((x, y) => {
    console.warn('[GameContext] handleTileHover called - this should be accessed directly from GameMapContext');
    return;
  }, []);

  const spawnInitialZombies = useCallback((gameMap, playerEntity) => {
    // This method is now handled by GameInitializationManager during setup
    console.log('[GameContext] spawnInitialZombies called - this is now handled by GameInitializationManager');
    return 0;
  }, []);

  const spawnTestEntities = useCallback(() => {
    if (!gameMap || !playerRef.current) return;

    const player = playerRef.current;
    const existingTestEntities = gameMap.getEntitiesByType('test').concat(gameMap.getEntitiesByType('item'));
    existingTestEntities.forEach(entity => {
      if (entity.id.startsWith('test-') || entity.id.startsWith('item-')) {
        gameMap.removeEntity(entity.id);
      }
    });

    const testEntities = [
      new TestEntity('test-zombie-1', player.x + 3, player.y + 2, 'zombie'),
      new TestEntity('test-zombie-2', player.x - 2, player.y + 4, 'zombie'),
      new TestEntity('test-obstacle-1', player.x + 1, player.y + 3, 'obstacle'),
      new Item('item-weapon-1', player.x + 4, player.y - 1, 'weapon'),
      new Item('item-ammo-1', player.x - 3, player.y - 2, 'ammo'),
    ];

    let spawnedCount = 0;
    testEntities.forEach(entity => {
      const tile = gameMap.getTile(entity.x, entity.y);
      if (tile && tile.isWalkable()) {
        if (gameMap.addEntity(entity, entity.x, entity.y)) {
          spawnedCount++;
        }
      }
    });

    console.log(`[GameContext] Spawned ${spawnedCount} test entities for LOS testing`);
    updatePlayerFieldOfView(gameMap);
    return spawnedCount;
  }, [updatePlayerFieldOfView, playerRef, gameMap]);

  const saveGame = useCallback((slotName = 'quicksave') => {
    if (!isInitialized || contextSyncPhase !== 'ready') {
      console.warn('[GameContext] Cannot save - contexts not synchronized', {
        isInitialized, contextSyncPhase
      });
      return false;
    }
    try {
      // Development assertions before save
      if (process.env.NODE_ENV === 'development') {
        if (!gameMapRef.current) {
          console.error('[GameContext] DEV ASSERTION FAILED: Attempting to save with null gameMap');
          return false;
        }
        if (!playerRef.current) {
          console.error('[GameContext] DEV ASSERTION FAILED: Attempting to save with null player');
          return false;
        }
        const playersOnMap = gameMapRef.current.getEntitiesByType('player');
        if (playersOnMap.length === 0) {
          console.error('[GameContext] DEV ASSERTION FAILED: No player on map before save');
          return false;
        }
        if (playersOnMap.length > 1) {
          console.error('[GameContext] DEV ASSERTION FAILED: Multiple players on map before save', playersOnMap.length);
        }
      }
      
      const currentGameState = {
        gameMap: gameMapRef.current,
        worldManager: worldManagerRef.current,
        player: playerRef.current,
        camera: cameraRef.current,
        turn: turn,
        playerStats: { hp: playerRef.current?.hp || 100, maxHp: playerRef.current?.maxHp || 100, ap: playerRef.current?.ap || 10, maxAp: playerRef.current?.maxAp || 10, ammo: 0 }
      };
      const success = GameSaveSystem.saveToLocalStorage(currentGameState, slotName);
      if (success) {
        console.log(`[GameContext] Game saved successfully to slot: ${slotName}`);
      }
      return success;
    } catch (error) {
      console.error('[GameContext] Failed to save game:', error);
      return false;
    }
  }, [isInitialized, contextSyncPhase, turn]);

  const loadAutosave = useCallback(async () => {
    return await loadGame('autosave');
  }, [loadGame]);

  const exportGame = useCallback((filename) => {
    if (!isInitialized || contextSyncPhase !== 'ready') {
      console.warn('[GameContext] Cannot export - contexts not synchronized', {
        isInitialized, contextSyncPhase
      });
      return false;
    }
    try {
      const currentGameState = {
        gameMap: gameMapRef.current,
        worldManager: worldManagerRef.current,
        player: playerRef.current,
        camera: cameraRef.current,
        turn: turn,
        playerStats: { hp: playerRef.current?.hp || 100, maxHp: playerRef.current?.maxHp || 100, ap: playerRef.current?.ap || 10, maxAp: playerRef.current?.maxAp || 10, ammo: 0 },
        lastSeenTaggedTiles: lastSeenTaggedTilesRef.current
      };
      return GameSaveSystem.exportToFile(currentGameState, filename);
    } catch (error) {
      console.error('[GameContext] Failed to export game:', error);
      return false;
    }
  }, [isInitialized, turn, playerRef, gameMapRef, worldManagerRef, cameraRef]);

  // Wrapper methods for map transitions that include player context functions
  const handleMapTransitionConfirmWrapper = useCallback(async () => {
    console.log('[GameContext] Map transition confirmation wrapper called');
    console.log('[GameContext] - Player:', playerRef.current ? `${playerRef.current.id} at (${playerRef.current.x}, ${playerRef.current.y})` : 'null');
    
    if (!playerRef.current) {
      console.error('[GameContext] Cannot execute transition - no player available');
      return false;
    }
    
    // Gather camera operations from CameraContext
    const cameraOperations = {
      setWorldBounds: setCameraWorldBounds,
      centerOn: (x, y) => {
        if (cameraRef.current) {
          cameraRef.current.centerOn(x, y);
        }
      }
    };
    
    // Call GameMapContext handleMapTransitionConfirm with required parameters including camera operations
    const success = await mapTransitionConfirm(playerRef.current, updatePlayerCardinalPositions, cancelMovement, cameraOperations);
    
    if (success) {
      // Update PlayerContext data after successful transition (no timer)
      updatePlayerFieldOfView(gameMapRef.current);
      updatePlayerCardinalPositions(gameMapRef.current);
      console.log('[GameContext] Player FOV and cardinal positions updated after map transition');
    }
    
    return success;
  }, [mapTransitionConfirm, playerRef, updatePlayerFieldOfView, updatePlayerCardinalPositions, cancelMovement, gameMapRef, setCameraWorldBounds, cameraRef]);

  const contextValue = useMemo(() => ({
    // Game lifecycle state only
    isInitialized,
    isGameReady,
    initializationState,
    initializationError,

    // Turn management
    turn,
    isPlayerTurn,
    isAutosaving,

    // Orchestration functions only
    initializeGame,
    endTurn,
    spawnTestEntities,
    spawnInitialZombies,

    // Save/Load orchestration
    saveGame,
    loadGame,
    loadAutosave,
    performAutosave,
    exportGame,

    // Map transition wrapper
    handleMapTransitionConfirmWrapper,

    // Internal refs for debugging
    lastSeenTaggedTiles: lastSeenTaggedTilesRef.current
  }), [
    isInitialized,
    isGameReady,
    initializationState,
    initializationError,
    turn,
    isPlayerTurn,
    isAutosaving,
    initializeGame,
    endTurn,
    spawnTestEntities,
    spawnInitialZombies,
    saveGame,
    loadGame,
    loadAutosave,
    performAutosave,
    exportGame,
    handleMapTransitionConfirmWrapper
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {inventoryManager ? (
        <InventoryProvider manager={inventoryManager}>
          {children}
        </InventoryProvider>
      ) : (
        children
      )}
    </GameContext.Provider>
  );
};

export const GameProvider = ({ children }) => {
  return (
    <GameContextInner>
      {children}
    </GameContextInner>
  );
};