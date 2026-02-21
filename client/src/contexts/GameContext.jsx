import React, { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { TestEntity, Item as LegacyItem } from '../game/entities/TestEntity.js';
import { Zombie } from '../game/entities/Zombie.js';
import { ZombieAI } from '../game/ai/ZombieAI.js';
import { PlayerZombieTracker } from '../game/ai/PlayerZombieTracker.js';
import { GameSaveSystem } from '../game/GameSaveSystem.js';
import GameInitializationManager from '../game/GameInitializationManager.js';
import { PlayerProvider, usePlayer } from './PlayerContext.jsx';
import { GameMapProvider, useGameMap } from './GameMapContext.jsx';
import { CameraProvider, useCamera } from './CameraContext.jsx';
import { InventoryProvider } from './InventoryContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';

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
        initializeGame: () => { },
        endTurn: () => { },
        saveGame: () => { },
        loadGame: () => { },
        loadAutosave: () => { },
        exportGame: () => { },
        spawnTestEntities: () => { }
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
  const { gameMapRef, worldManagerRef, gameMap, worldManager, setGameMap, setWorldManager, setZombieTracker, triggerMapUpdate, handleTileClick: mapHandleTileClick, handleTileHover, lastTileClick, hoveredTile, mapTransition, handleMapTransitionConfirm: mapTransitionConfirm, handleMapTransitionCancel } = useGameMap();
  const { cameraRef, camera, setCamera, setCameraWorldBounds } = useCamera();
  const { addEffect } = useVisualEffects();


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
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const hour = (6 + (turn - 1)) % 24;
  const isNight = hour >= 20 || hour < 6;

  const toggleFlashlight = useCallback(() => {
    setIsFlashlightOn(prev => {
      const newState = !prev;
      updatePlayerFieldOfView(gameMapRef.current, isNight, newState);
      return newState;
    });
  }, [gameMapRef, isNight, updatePlayerFieldOfView]);

  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepProgress, setSleepProgress] = useState(0);
  const [targetingItem, setTargetingItem] = useState(null);

  const attachInventorySyncListener = useCallback((player, inventoryManager) => {
    if (!player || !inventoryManager) return;

    // Remove existing listeners to prevent duplicates and stale closures
    player.removeAllListeners('playerMoved');

    // Phase 5B: Add ground container synchronization listener
    // This listener handles moving items between the ground container and map tiles
    player.on('playerMoved', ({ oldPosition, newPosition }) => {
      // ALWAYS use the latest map from the ref to avoid stale closures during map transitions
      const currentMap = gameMapRef.current;
      if (!currentMap) return;

      console.log(`[GameContext] Player shifted from (${oldPosition.x}, ${oldPosition.y}) to (${newPosition.x}, ${newPosition.y}) - syncing ground items`);
      inventoryManager.syncWithMap(
        oldPosition.x, oldPosition.y,
        newPosition.x, newPosition.y,
        currentMap
      );
    });

    console.log('[GameContext] Inventory synchronization listener attached to player');
  }, [gameMapRef]);

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

      attachInventorySyncListener(player, gameObjects.inventoryManager);

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

    // HMR Fix: Clear stale global instances on development hot reload
    if (process.env.NODE_ENV === 'development' && window.gameInitInstances && window.gameInitInstances.size > 0) {
      console.warn('[GameContext] 🔄 HMR detected - clearing stale global instances');
      window.gameInitInstances.clear();
    }

    // Check global instances to prevent race conditions (after HMR cleanup)
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
      updatePlayerFieldOfView(gameMap, isNight, isFlashlightOn);
      updatePlayerCardinalPositions(gameMap);

      // Mark as fully ready
      setContextSyncPhase('ready');
      console.log('[GameContext] Initialization fully complete - all contexts ready for operations');
    }
  }, [contextSyncPhase, gameMap, camera, worldManager, updatePlayerFieldOfView, updatePlayerCardinalPositions, isNight, isFlashlightOn]);



  const loadGameDirect = useCallback(async (slotName = 'autosave') => {
    console.log('[GameContext] 🎮 DIRECT LOAD - Skipping initialization, loading save directly...');

    try {
      const loadedState = await GameSaveSystem.loadFromLocalStorage(slotName);
      if (!loadedState) {
        console.warn(`[GameContext] ❌ No save found in slot: ${slotName}`);
        return false; // Let caller decide whether to fallback to new game
      }

      console.log('[GameContext] ✅ Save file found, applying state directly...');
      console.log(`[GameContext] - Turn: ${loadedState.turn}`);
      console.log(`[GameContext] - Player: ${loadedState.player.id} at (${loadedState.player.x}, ${loadedState.player.y})`);
      console.log(`[GameContext] - Map: ${loadedState.gameMap.width}x${loadedState.gameMap.height}`);

      // Set all contexts directly from loaded state (Phase 5A: includes inventoryManager)
      setInventoryManager(loadedState.inventoryManager);
      setGameMap(loadedState.gameMap);
      setPlayerRef(loadedState.player);
      setCamera(loadedState.camera);
      setWorldManager(loadedState.worldManager);
      setTurn(loadedState.turn);
      setIsPlayerTurn(true);
      setIsAutosaving(false);
      lastSeenTaggedTilesRef.current = loadedState.lastSeenTaggedTiles || new Set();

      // Set camera world bounds and recenter on loaded player position
      if (loadedState.camera && loadedState.player && loadedState.gameMap) {
        loadedState.camera.setWorldBounds(loadedState.gameMap.width, loadedState.gameMap.height);
        loadedState.camera.centerOn(loadedState.player.x, loadedState.player.y);
        console.log(`[GameContext] ✅ Camera configured - bounds: ${loadedState.gameMap.width}x${loadedState.gameMap.height}, centered on (${loadedState.player.x}, ${loadedState.player.y})`);
      }

      // Set up player event listeners and update derived state
      setupPlayerEventListeners();
      attachInventorySyncListener(loadedState.player, loadedState.inventoryManager);

      // Calculate isNight for the loaded turn
      const loadedHour = (6 + (loadedState.turn - 1)) % 24;
      const loadedIsNight = loadedHour >= 20 || loadedHour < 6;
      // Note: isFlashlightOn is currently not persisted in save state, defaults to false

      updatePlayerFieldOfView(loadedState.gameMap, loadedIsNight, false);
      updatePlayerCardinalPositions(loadedState.gameMap);

      // Open the UI gate
      setInitializationState('complete'); // FIX: Ensure isInitialized becomes true
      setIsGameReady(true);
      console.log('[GameContext] 🎉 DIRECT LOAD COMPLETE - Game ready without initialization');
      console.log(`[GameContext] - Final player position: (${loadedState.player.x}, ${loadedState.player.y})`);
      console.log(`[GameContext] - Entities on map: ${loadedState.gameMap.getAllEntities().length}`);
      console.log(`[GameContext] - InventoryManager: ${loadedState.inventoryManager ? 'loaded' : 'missing'}`);

      return true;
    } catch (error) {
      console.error('[GameContext] ❌ DIRECT LOAD FAILED:', error);
      return false;
    }
  }, [setInventoryManager, setGameMap, setPlayerRef, setCamera, setWorldManager, setupPlayerEventListeners, updatePlayerFieldOfView, updatePlayerCardinalPositions]);

  const loadGame = useCallback(async (slotName = 'quicksave') => {
    try {
      const loadedState = await GameSaveSystem.loadFromLocalStorage(slotName);
      if (!loadedState) {
        console.warn(`[GameContext] No save found in slot: ${slotName}`);
        return false;
      }
      console.log('[GameContext] Applying loaded state...');

      // CRITICAL: Set ALL state synchronously in the correct order
      // 1. WorldManager (no dependencies)
      setWorldManager(loadedState.worldManager);

      // 2. GameMap (needed for player FOV calculations)
      setGameMap(loadedState.gameMap);

      // 3. Camera (independent of player)
      setCamera(loadedState.camera);

      // 4. InventoryManager BEFORE player to ensure equipment references are valid
      if (loadedState.inventoryManager) {
        setInventoryManager(loadedState.inventoryManager);
        console.log('[GameContext] InventoryManager restored from save');
        console.log('[GameContext] Equipped backpack:', loadedState.inventoryManager.equipment.backpack?.name || 'none');

        // Log equipment state for debugging
        const equippedItems = Object.entries(loadedState.inventoryManager.equipment)
          .filter(([slot, item]) => item !== null)
          .map(([slot, item]) => `${slot}: ${item.name}`);
        console.log('[GameContext] All equipped items:', equippedItems.length > 0 ? equippedItems.join(', ') : 'none');
      }

      // 5. Player LAST - after inventory is ready
      setPlayerRef(loadedState.player);

      setTurn(loadedState.turn);
      setIsPlayerTurn(true);
      setIsAutosaving(false);
      lastSeenTaggedTilesRef.current = loadedState.lastSeenTaggedTiles || new Set();

      console.log('[GameContext] Setting up event listeners for loaded player...');
      setupPlayerEventListeners();
      attachInventorySyncListener(loadedState.player, loadedState.inventoryManager);

      // Recenter camera on loaded player position
      if (loadedState.camera && loadedState.player) {
        loadedState.camera.centerOn(loadedState.player.x, loadedState.player.y);
        console.log(`[GameContext] Camera recentered on loaded player position (${loadedState.player.x}, ${loadedState.player.y})`);
      }

      // Calculate isNight for the loaded turn
      const loadedHour = (6 + (loadedState.turn - 1)) % 24;
      const loadedIsNight = loadedHour >= 20 || loadedHour < 6;

      // Update derived player state
      updatePlayerFieldOfView(loadedState.gameMap, loadedIsNight, false);
      updatePlayerCardinalPositions(loadedState.gameMap);

      console.log(`[GameContext] Game loaded successfully from slot: ${slotName}`);
      console.log(`[GameContext] Player position after load: (${loadedState.player.x}, ${loadedState.player.y})`);

      return true;
    } catch (error) {
      console.error('[GameContext] Failed to load game:', error);
      return false;
    }
  }, [setInventoryManager, setGameMap, setPlayerRef, setCamera, setWorldManager, setupPlayerEventListeners, updatePlayerFieldOfView, updatePlayerCardinalPositions]);

  const initializeGame = useCallback(async () => {
    if (!initManagerRef.current) {
      console.error('[GameContext] GameInitializationManager not available');
      return false;
    }

    const now = initRef.current; // Use ref, not captured state

    // Block if actively initializing
    if (now === 'preloading' || now === 'core_setup' || now === 'world_population') {
      console.warn('[GameContext] Initialization already in progress, ignoring duplicate call');
      return false;
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

    console.log(`[GameContext] Starting new game initialization (run ${runIdRef.current})...`);
    setInitializationError(null);
    setContextSyncPhase('idle'); // Reset sync phase for new initialization
    setTurn(1); // Reset turn counter to 1 for new game (06:00 start)

    const success = await initManagerRef.current.startInitialization(null);
    if (!success) {
      const error = initManagerRef.current.getError();
      setInitializationError(error || 'Unknown initialization error');
      return false;
    }

    return true;
  }, [wireManagerEvents]);



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
        inventoryManager: inventoryManager,
        turn: turn,
        playerStats: { hp: playerRef.current?.hp || 100, maxHp: playerRef.current?.maxHp || 100, ap: playerRef.current?.ap || 12, maxAp: playerRef.current?.maxAp || 12, ammo: 0 }
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

  const checkIsSheltered = useCallback((player, gameMap) => {
    if (!player || !gameMap) return false;

    const startTile = gameMap.getTile(player.x, player.y);
    // If not on floor, definitely not sheltered
    if (!startTile || startTile.terrain !== 'floor') return false;

    // BFS to find if there's a path to any non-floor, non-wall tile
    const queue = [{ x: player.x, y: player.y }];
    const visited = new Set([`${player.x},${player.y}`]);
    const maxCheckedTiles = 400; // Safety limit for performance

    let head = 0;
    while (head < queue.length && queue.length < maxCheckedTiles) {
      const { x, y } = queue[head++];

      const neighbors = [
        { x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }
      ];

      for (const next of neighbors) {
        const key = `${next.x},${next.y}`;
        if (visited.has(key)) continue;

        const tile = gameMap.getTile(next.x, next.y);
        if (!tile) continue;

        // Wall/Building/Fence/Closed Door block the search
        const isWall = tile.terrain === 'wall' || tile.terrain === 'building' || tile.terrain === 'fence';
        const door = tile.contents.find(e => e.type === 'door');
        const isClosedDoor = door && !door.isOpen;

        if (isWall || isClosedDoor) {
          visited.add(key);
          continue;
        }

        // If it's a non-floor tile (like grass, road), we found an opening to the outside
        if (tile.terrain !== 'floor') {
          return false; // Not sheltered
        }

        visited.add(key);
        queue.push(next);
      }
    }

    return true; // No opening found, or limit reached (assume sheltered if building is HUGE)
  }, []);

  const performSleep = useCallback(async (hours) => {
    if (!isInitialized || !playerRef.current || !gameMap || !isPlayerTurn || isSleeping) return;

    try {
      setIsSleeping(true);
      setIsPlayerTurn(false);
      setSleepProgress(hours);

      const player = playerRef.current;
      let currentTurn = turn;

      for (let i = 0; i < hours; i++) {
        // 1 second delay per hour slept
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update stats for this hour
        player.modifyStat('energy', 2.5);
        player.modifyStat('nutrition', -1);
        player.modifyStat('hydration', -1);

        // HP recovery: 0.5 HP per hour if nutrition and hydration are > 0
        if (player.nutrition > 0 && player.hydration > 0) {
          player.heal(0.5);
        }

        // Advance turn by 1
        currentTurn++;
        setTurn(currentTurn);
        setSleepProgress(prev => prev - 1);

        // Sync stats to UI
        updatePlayerStats({
          hp: player.hp,
          energy: player.energy,
          nutrition: player.nutrition,
          hydration: player.hydration
        });

        // Interruption check: If not sheltered, check for zombies
        const isSheltered = checkIsSheltered(player, gameMap);
        if (!isSheltered) {
          const zombies = gameMap.getEntitiesByType('zombie');
          let interrupters = zombies.filter(z => z.canSeeEntity(gameMap, player));

          // If no zombies see the player, check for random spawn
          if (interrupters.length === 0 && Math.random() < 0.25) {
            console.log('[GameContext] Random zombie spawned during sleep!');
            const neighbors = [
              { x: player.x + 1, y: player.y }, { x: player.x - 1, y: player.y },
              { x: player.x, y: player.y + 1 }, { x: player.x, y: player.y - 1 }
            ].filter(n => {
              const t = gameMap.getTile(n.x, n.y);
              return t && t.isWalkable();
            });

            if (neighbors.length > 0) {
              const spawnPos = neighbors[Math.floor(Math.random() * neighbors.length)];
              const zombieId = `sleep-interrupter-${Date.now()}`;
              const zombie = new Zombie(zombieId, spawnPos.x, spawnPos.y);
              gameMap.addEntity(zombie, spawnPos.x, spawnPos.y);
              interrupters.push(zombie);
            }
          }

          if (interrupters.length > 0) {
            console.log(`[GameContext] Sleep interrupted by ${interrupters.length} zombie(s)!`);

            // 1. Awaken the player
            setIsSleeping(false);
            setSleepProgress(0);

            // 2. Zombies attack with max AP
            const cardinalPositions = getPlayerCardinalPositions(gameMap);
            const lastSeenTiles = lastSeenTaggedTilesRef.current;

            for (const zombie of interrupters) {
              zombie.startTurn(); // Ensure they start with max AP
              ZombieAI.executeZombieTurn(zombie, gameMap, player, cardinalPositions, lastSeenTiles);
            }

            // 3. Final state sync after attacks
            const interrupterHour = (6 + (currentTurn - 1)) % 24;
            const interrupterIsNight = interrupterHour >= 20 || interrupterHour < 6;
            updatePlayerStats({ hp: player.hp, ap: player.ap });
            updatePlayerFieldOfView(gameMap, interrupterIsNight, isFlashlightOn);
            updatePlayerCardinalPositions(gameMap);
            setIsPlayerTurn(true);
            return; // Exit sleep loop
          }
        }
      }

      // After sleep completes
      player.restoreAP(player.maxAp - player.ap);
      updatePlayerStats({ ap: player.ap });

      setIsSleeping(false);
      setIsPlayerTurn(true);
      setSleepProgress(0);

      // Final state sync and effects
      const finalHour = (6 + (currentTurn - 1)) % 24;
      const finalIsNight = finalHour >= 20 || finalHour < 6;
      updatePlayerFieldOfView(gameMap, finalIsNight, isFlashlightOn);
      updatePlayerCardinalPositions(gameMap);

      await performAutosave();

    } catch (error) {
      console.error('[GameContext] Error during sleep:', error);
      setIsSleeping(false);
      setIsPlayerTurn(true);
      setSleepProgress(0);
    }
  }, [isInitialized, playerRef, gameMap, isPlayerTurn, isSleeping, checkIsSheltered, updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions, getPlayerCardinalPositions, performAutosave]);

  const startTargetingItem = useCallback((item) => {
    setTargetingItem(item);
  }, []);

  const cancelTargetingItem = useCallback(() => {
    setTargetingItem(null);
  }, []);

  const useBreakingToolOnDoor = useCallback((x, y) => {
    const player = playerRef.current;
    const gameMap = gameMapRef.current;
    if (!player || !gameMap || !targetingItem) return { success: false };

    // Distance check (adjacency)
    const dx = Math.abs(player.x - x);
    const dy = Math.abs(player.y - y);
    const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

    if (!isAdjacent) {
      return { success: false, reason: 'Too far' };
    }

    const tile = gameMap.getTile(x, y);
    const door = tile?.contents.find(e => e.type === 'door');

    if (!door || !door.isLocked || door.isOpen) {
      return { success: false, reason: 'Can only use on locked doors' };
    }

    if (player.ap < 2) {
      return { success: false, reason: 'Need 2 AP' };
    }

    // Perform action
    door.isLocked = false;
    door.isOpen = true;
    door.isDamaged = true;
    door.updateBlocking();

    player.useAP(2);

    // Reduce condition
    if (targetingItem.hasTrait('degradable')) {
      targetingItem.degrade(2);
      // If broken, it should be removed (Item.degrade usually handles this if integrated with container)
      // But we need to make sure the UI reflects this.
      if (inventoryManager) {
        inventoryManager.emit('inventoryChanged');
      }
    }

    setTargetingItem(null);
    updatePlayerStats({ ap: player.ap });
    updatePlayerFieldOfView(gameMap, isNight, isFlashlightOn);
    updatePlayerCardinalPositions(gameMap);

    // Force re-render of map
    if (typeof gameMap.emitEvent === 'function') {
      gameMap.emitEvent('mapUpdated'); // Generic update event
    }

    return { success: true };
  }, [playerRef, gameMapRef, targetingItem, inventoryManager, updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions]);

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
      // Process map-level turn effects (e.g. campfire expiration) EARLY 
      // This ensures 0.5 turns vanish as soon as player hits endTurn.
      if (gameMap && gameMap.processTurn) {
        gameMap.processTurn();
      }

      // Also process turn effects for items currently in the active ground container
      if (inventoryManager && inventoryManager.processTurn) {
        inventoryManager.processTurn();
      }

      setIsPlayerTurn(false);
      setTargetingItem(null); // Cancel targeting on end turn
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
            } else if (action.type === 'attackDoor' && action.doorPos) {
              console.log(`[GameContext] - Action ${index + 1}: Attacking door at (${action.doorPos.x}, ${action.doorPos.y})`);

              // Trigger visual effects for door attack
              if (addEffect) {
                // Floating "bang" text
                addEffect({
                  type: 'damage',
                  x: action.doorPos.x,
                  y: action.doorPos.y,
                  value: 'bang',
                  color: '#ffffff', // White text for door bangs
                  duration: 800
                });

                // Brownish-gray tile flash
                addEffect({
                  type: 'tile_flash',
                  x: action.doorPos.x,
                  y: action.doorPos.y,
                  color: 'rgba(139, 115, 85, 0.4)', // Door color
                  duration: 300
                });
              }
            }

          });
        } else {
          console.warn(`[GameContext] Zombie ${zombie.id} turn failed:`, turnResult.reason || turnResult.error);
        }
      });

      // Regenerate 1 HP at start of new turn phase if survival stats are sufficient (>= 5)
      if (player.nutrition >= 5 && player.hydration >= 5) {
        player.heal(1);
      } else {
        console.log(`[GameContext] HP regeneration skipped (threshold 5): Nutrition=${player.nutrition}, Hydration=${player.hydration}`);
      }

      // Apply Diseased condition penalties (Diseased condition reduces AP and HP by 1 per turn)
      if (player.condition === 'Diseased') {
        console.log('[GameContext] Player is Diseased - reducing AP and HP by 1');
        player.modifyStat('ap', -1);
        player.takeDamage(1, { id: 'disease', type: 'infection' });
      }

      // Reduce survival stats by 1 on end turn
      player.nutrition = Math.max(0, player.nutrition - 1);
      player.hydration = Math.max(0, player.hydration - 1);
      player.energy = Math.max(0, player.energy - 1);

      // Apply HP loss if nutrition or hydration is zero
      let hpLoss = 0;
      if (player.nutrition === 0) {
        hpLoss += 1;
      }
      if (player.hydration === 0) {
        hpLoss += 1;
      }
      if (hpLoss > 0) {
        player.takeDamage(hpLoss, { id: 'survival', type: 'starvation' });
        console.log(`[GameContext] Player lost ${hpLoss} HP due to low nutrition/hydration.`);
      }

      // Restore AP based on energy levels (Penalty if energy < 10, min 3 AP)
      // This happens AFTER decay, so it reflects the energy available for the upcoming turn.
      const targetAp = Math.max(3, player.maxAp - Math.max(0, 10 - player.energy));
      player.restoreAP(targetAp - player.ap);

      updatePlayerStats({
        ap: player.ap,
        nutrition: player.nutrition,
        hydration: player.hydration,
        energy: player.energy,
        hp: player.hp // Ensure HP is updated
      });
      console.log(`[GameContext] Player AP restored to: ${player.ap}`);

      const newTurn = turn + 1;
      const nextHour = (6 + (newTurn - 1)) % 24;
      const nextIsNight = nextHour >= 20 || nextHour < 6;

      updatePlayerFieldOfView(gameMap, nextIsNight, isFlashlightOn);
      updatePlayerCardinalPositions(gameMap);
      triggerMapUpdate();

      setTurn(newTurn);
      console.log('[GameContext] Turn ended. Current turn:', newTurn);

      await performAutosave();

      setIsPlayerTurn(true);

    } catch (error) {
      console.error('[GameContext] Error ending turn:', error);
      setIsPlayerTurn(true);
    }
  }, [turn, isInitialized, isPlayerTurn, inventoryManager, updatePlayerFieldOfView, updatePlayerCardinalPositions, performAutosave, playerRef, gameMap, getPlayerCardinalPositions, updatePlayerStats]);

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
      new LegacyItem('item-weapon-1', player.x + 4, player.y - 1, 'weapon'),
      new LegacyItem('item-ammo-1', player.x - 3, player.y - 2, 'ammo'),
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
    updatePlayerFieldOfView(gameMap, isNight, isFlashlightOn);
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

        // CRITICAL: Verify player on map matches playerRef
        const playerOnMap = playersOnMap[0];
        if (playerOnMap !== playerRef.current) {
          console.error('[GameContext] DEV ASSERTION FAILED: Player instance mismatch!');
          console.error('[GameContext] - playerRef.current:', playerRef.current.id, 'at', playerRef.current.x, playerRef.current.y);
          console.error('[GameContext] - Player on map:', playerOnMap.id, 'at', playerOnMap.x, playerOnMap.y);
          console.error('[GameContext] - Same instance?', playerOnMap === playerRef.current);
          return false;
        }
      }

      const currentGameState = {
        gameMap: gameMapRef.current,
        worldManager: worldManagerRef.current,
        player: playerRef.current,
        camera: cameraRef.current,
        inventoryManager: inventoryManager,
        turn: turn,
        playerStats: { hp: playerRef.current?.hp || 100, maxHp: playerRef.current?.maxHp || 100, ap: playerRef.current?.ap || 12, maxAp: playerRef.current?.maxAp || 12, ammo: 0 }
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
        inventoryManager: inventoryManager,
        turn: turn,
        playerStats: { hp: playerRef.current?.hp || 100, maxHp: playerRef.current?.maxHp || 100, ap: playerRef.current?.ap || 12, maxAp: playerRef.current?.maxAp || 12, ammo: 0 },
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
    const success = await mapTransitionConfirm(playerRef.current, updatePlayerCardinalPositions, cancelMovement, cameraOperations, inventoryManager);

    if (success) {
      // Update PlayerContext data after successful transition (no timer)
      updatePlayerFieldOfView(gameMapRef.current, isNight, isFlashlightOn);
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
    isNight,
    hour,
    isFlashlightOn,
    toggleFlashlight,
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
    loadGameDirect,
    loadAutosave,
    performAutosave,
    exportGame,

    // Map transition wrapper
    handleMapTransitionConfirmWrapper,

    // Phase 6: Sleep functionality
    isSleeping,
    sleepProgress,
    performSleep,

    // Crowbar Usage Phase
    targetingItem,
    startTargetingItem,
    cancelTargetingItem,
    useBreakingToolOnDoor,

    // Phase 5A: Expose inventoryManager for InventoryProvider
    inventoryManager,

    // Internal refs for debugging
    lastSeenTaggedTiles: lastSeenTaggedTilesRef.current
  }), [
    isInitialized,
    isGameReady,
    initializationState,
    initializationError,
    turn,
    isNight,
    hour,
    isFlashlightOn,
    toggleFlashlight,
    isPlayerTurn,
    isAutosaving,
    initializeGame,
    endTurn,
    spawnTestEntities,
    spawnInitialZombies,
    saveGame,
    loadGame,
    loadGameDirect,
    loadAutosave,
    performSleep,
    inventoryManager,
    targetingItem,
    startTargetingItem,
    cancelTargetingItem,
    useBreakingToolOnDoor
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
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