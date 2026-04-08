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
import { useLog } from './LogContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import Logger from '../game/utils/Logger.js';
import { Item, createItemFromDef } from '../game/inventory/index.js';
import { ItemTrait } from '../game/inventory/traits.js';
import { useAudio } from './AudioContext.jsx';

const logger = Logger.scope('GameContext');

// Test functions are imported via inventory system

import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';

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
        isDevConsoleOpen: false,
        toggleDevConsole: () => { },
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
  const { playerRef, setPlayerRef, setPlayerPosition, setupPlayerEventListeners, updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions, getPlayerCardinalPositions, startAnimatedMovement, cancelMovement, isMoving: isAnimatingMovement, playerFieldOfView } = usePlayer();
  const { gameMapRef, worldManagerRef, gameMap, worldManager, setGameMap, setWorldManager, setZombieTracker, setLootGenerator, triggerMapUpdate, handleTileClick: mapHandleTileClick, handleTileHover, lastTileClick, hoveredTile, mapTransition, handleMapTransitionConfirm: mapTransitionConfirm, handleMapTransitionCancel } = useGameMap();
  const { cameraRef, camera, setCamera, setCameraWorldBounds } = useCamera();
  const { addEffect } = useVisualEffects();
  const { addLog, clearLogs } = useLog();
  const { playSound } = useAudio();
  const [inventoryVersion, setInventoryVersion] = useState(0);


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

  // Phase 7: Robust light state for internal GameContext callers
  // Note: These use the local inventoryManager state directly, avoiding the broken useInventory() hierarchy
  const isFlashlightOnActual = useMemo(() => {
    if (!isFlashlightOn) return false;
    const fl = inventoryManager?.equipment['flashlight'];
    if (!fl) return false;
    if (fl.defId === 'tool.torch' && !fl.isLit) return false;
    return true;
  }, [isFlashlightOn, inventoryVersion, inventoryManager]);

  const getActiveFlashlightRange = useCallback(() => {
    const flashlight = inventoryManager?.equipment['flashlight'];
    if (flashlight && flashlight.defId === 'tool.torch') return 5;
    return 8;
  }, [inventoryManager, inventoryVersion]);


  /**
   * Centralized helper to check for zombies spotting the player.
   * Updates zombie 'isAlerted' state and emits ZOMBIE_ALERTED events.
   * @param {Object} overridePlayerPos - Optional {x,y} to check visibility from (e.g. during animations)
   */
  const checkZombieAwareness = useCallback((overridePlayerPos = null) => {
    const currentMap = gameMapRef.current;
    const currentPlayer = playerRef.current;
    if (!currentMap || !currentPlayer) return false;

    const checkPlayer = overridePlayerPos || { x: currentPlayer.x, y: currentPlayer.y };
    const zombies = currentMap.getEntitiesByType('zombie');
    let alertedNew = false;

    zombies.forEach(zombie => {
      const canSee = zombie.canSeeEntity(currentMap, checkPlayer);

      if (canSee) {
        if (!zombie.isAlerted) {
          zombie.isAlerted = true;
          alertedNew = true;
          // Global event triggers sound (Zombie1) and log entry
          GameEvents.emit(GAME_EVENT.ZOMBIE_ALERTED, { zombie });
          console.log(`[GameContext] Zombie ${zombie.id} spotted player at (${checkPlayer.x}, ${checkPlayer.y})!`);
        }
        
        // Critical: Update coordinates so the zombie tracks the player in real-time
        zombie.setTargetSighted(checkPlayer.x, checkPlayer.y);
      } else if (zombie.isAlerted) {
        // If they lost line of sight, they stay alerted (lastSeen mode)
        // until they reach the LastSeen position (handled in ZombieAI)
      }
    });

    return alertedNew;
  }, [gameMapRef, playerRef]);

  const igniteTorch = useCallback((sourceItem = null) => {
    if (!playerRef.current || !inventoryManager) return;
    
    // Check AP (1 AP)
    if (playerRef.current.ap < 1) {
      addLog('Not enough AP to ignite torch (1 required)', 'error');
      return;
    }

    let source = sourceItem;
    let container = null;

    if (!source) {
      // Find all potential ignition sources (lighters/matches)
      const availableItems = [];
      
      // Check backpack and pockets
      const containers = [
        inventoryManager.getBackpackContainer(),
        ...inventoryManager.getPocketContainers()
      ].filter(c => c !== null);

      for (const c of containers) {
        for (const item of c.items.values()) {
          if (item.defId === 'tool.lighter' || item.defId === 'tool.matchbook') {
            if ((item.ammoCount || 0) > 0) {
              availableItems.push({ item, container: c });
            }
          }
        }
      }

      if (availableItems.length === 0) {
        addLog('You need a lighter or matches to ignite the torch.', 'error');
        playSound('EmptyClick');
        return;
      }

      // Use the smallest stack (lowest ammoCount)
      availableItems.sort((a, b) => (a.item.ammoCount || 0) - (b.item.ammoCount || 0));
      source = availableItems[0].item;
      container = availableItems[0].container;
    } else {
      // Verify source has fuel
      if ((source.ammoCount || 0) <= 0) {
        addLog(`${source.name} is empty.`, 'error');
        playSound('EmptyClick');
        return;
      }
      // We need the container to potentially remove empty matchbooks
      container = inventoryManager.findItem(source.instanceId)?.container;
    }

    // Get the torch
    const torch = inventoryManager.equipment['flashlight'];
    if (!torch || torch.defId !== 'tool.torch') {
       addLog('Equip a torch in your hand to ignite it.', 'error');
       return;
    }

    // Perform ignition
    playerRef.current.useAP(1);
    source.ammoCount = Math.max(0, (source.ammoCount || 0) - 1);
    torch.isLit = true;
    setIsFlashlightOn(true);
    
    playSound('Ignite'); 
    addLog(`You ignite the torch using ${source.name}.`, 'item');
    
    // If source empty and is matchbook, discard it
    if ((source.ammoCount || 0) <= 0 && source.defId === 'tool.matchbook' && container) {
      container.removeItem(source.instanceId);
      addLog('The matchbook is empty and discarded.', 'item');
    }

    setInventoryVersion(prev => prev + 1);
  }, [playerRef, inventoryManager, addLog, playSound, setInventoryVersion]);

  const toggleFlashlight = useCallback(() => {
    const flashlight = inventoryManager?.equipment['flashlight'];
    if (!flashlight) {
      addLog('No lighting tool equipped.', 'error');
      return;
    }

    // Special logic for Torch
    if (flashlight.defId === 'tool.torch') {
      if (!flashlight.isLit) {
        igniteTorch();
      } else {
        addLog('The torch is already lit. Unequip it to extinguish.', 'info');
      }
      return;
    }

    setIsFlashlightOn(prev => {
      const newState = !prev;

      if (newState) {
        // Turning ON - verify equipment and charges
        if (!flashlight) {
          console.warn('[GameContext] Cannot turn on flashlight: None equipped');
          return false;
        }

        const battery = typeof flashlight.getBattery === 'function' ? flashlight.getBattery() : null;
        if (!battery || (battery.ammoCount || 0) <= 0) {
          console.warn('[GameContext] Cannot turn on flashlight: No battery or empty');
          addLog('Flashlight battery is dead or missing.', 'error');
          playSound('EmptyClick');
          return false;
        }

        playSound('SwitchOn');
      } else {
        playSound('SwitchOff');
      }

      updatePlayerFieldOfView(gameMapRef.current, isNight, newState, false, getActiveFlashlightRange());
      return newState;
    });
  }, [gameMapRef, isNight, updatePlayerFieldOfView, inventoryManager, addLog, igniteTorch, playSound, getActiveFlashlightRange, isFlashlightOnActual]);

  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAnimatingZombies, setIsAnimatingZombies] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepProgress, setSleepProgress] = useState(0);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [sleepMultiplier, setSleepMultiplier] = useState(1);
  const [targetingItem, setTargetingItem] = useState(null);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);

  const toggleSkills = useCallback(() => {
    setIsSkillsOpen(prev => !prev);
  }, []);

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

      logger.info(`Player shifted from (${oldPosition.x}, ${oldPosition.y}) to (${newPosition.x}, ${newPosition.y}) - syncing ground items`);
      inventoryManager.syncWithMap(
        oldPosition.x, oldPosition.y,
        newPosition.x, newPosition.y,
        currentMap
      );
      
      // Update crop metadata for the tile we just left to ensure outlines/tooltips are fresh
      if (typeof currentMap.updateCropMetadata === 'function') {
        currentMap.updateCropMetadata(oldPosition.x, oldPosition.y);
      }
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
      logger.debug('Initialization state changed to:', current);
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
      setZombieTracker(gameObjects.zombieTracker);
      setLootGenerator(gameObjects.lootGenerator);

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
  }, [setInventoryManager, setGameMap, setPlayerRef, setCamera, setWorldManager, setLootGenerator, setupPlayerEventListeners]);

  // Phase 5B: Sync local inventory version with manager events
  useEffect(() => {
    if (!inventoryManager) return;

    const handleInventoryChanged = () => {
      logger.debug('🔄 GameContext: Inventory changed, bumping local version');
      setInventoryVersion(prev => prev + 1);
    };

    if (typeof inventoryManager.on === 'function') {
      inventoryManager.on('inventoryChanged', handleInventoryChanged);
      return () => {
        inventoryManager.off('inventoryChanged', handleInventoryChanged);
      };
    }
  }, [inventoryManager]);

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
      if (typeof updatePlayerFieldOfView === 'function') {
        updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
      }
      if (typeof updatePlayerCardinalPositions === 'function') {
        updatePlayerCardinalPositions(gameMap);
      }

      // Mark as fully ready
      setContextSyncPhase('ready');
      console.log('[GameContext] Initialization fully complete - all contexts ready for operations');
    }
  }, [contextSyncPhase, gameMap, camera, worldManager, updatePlayerFieldOfView, updatePlayerCardinalPositions, isNight, isFlashlightOnActual, getActiveFlashlightRange]);



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
      setLootGenerator(loadedState.lootGenerator);
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
      logger.info('🎉 DIRECT LOAD COMPLETE - Game ready without initialization');
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

      // 5. LootGenerator
      setLootGenerator(loadedState.lootGenerator);

      // 6. Player LAST - after inventory is ready
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

  const initializeGame = useCallback(async (config = null) => {
    console.log('[GameContext] 🎮 initializeGame called with config:', !!config);
    setIsGameReady(false); // FORCED IMMEDIATE STATE RESET
    
    if (!initManagerRef.current) {
      console.error('[GameContext] GameInitializationManager not available');
      return false;
    }

    const now = initRef.current; // Use ref, not captured state
    console.log('[GameContext] Current initialization state:', now);

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
    clearLogs(); // Clear log from previous game

    const success = await initManagerRef.current.startInitialization(null, config);
    if (!success) {
      const error = initManagerRef.current.getError();
      setInitializationError(error || 'Unknown initialization error');
      return false;
    }

    return true;
  }, [wireManagerEvents]);

  // Decoupled Console Bridge: Listen for launch commands from the root UI layer
  useEffect(() => {
    const handleLaunch = (e) => {
      console.log('[GameContext] 🛰️ Global launch-custom-game event received. Config:', !!e.detail);
      initializeGame(e.detail);
    };

    window.addEventListener('launch-custom-game', handleLaunch);
    return () => window.removeEventListener('launch-custom-game', handleLaunch);
  }, [initializeGame]);



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
  }, [isInitialized, gameMapRef, worldManagerRef, playerRef, cameraRef, inventoryManager, turn]);

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

        // Find entities on this tile that might block the search
        const door = tile.contents.find(e => e.type === 'door');
        const isClosedDoor = door && !door.isOpen;

        const window = tile.contents.find(e => e.type === 'window');
        const isClosedWindow = window && !window.isOpen && !window.isBroken;

        // Blockers: Walls, Building, Fence, Closed Door, Closed Window
        // Note: 'building' and 'window' are terrain types used by the generator
        const blocksBFS = (
          tile.terrain === 'wall' || 
          tile.terrain === 'building' || 
          tile.terrain === 'fence' || 
          (tile.terrain === 'window' && isClosedWindow) || 
          isClosedDoor
        );

        if (blocksBFS) {
          visited.add(key);
          continue;
        }

        // Openings: Anything not floor (grass, road, etc.) OR an open/broken window
        if (tile.terrain !== 'floor' || (tile.terrain === 'window' && !isClosedWindow)) {
          return false; // Not sheltered
        }

        visited.add(key);
        queue.push(next);
      }
    }

    return true; // No opening found, or limit reached (assume sheltered if building is HUGE)
  }, []);

  const isPlayerInSameBuildingAsDoor = useCallback((player, doorPos, gameMap) => {
    if (!player || !gameMap || !doorPos) {
      console.log(`[GameContext] isPlayerInSameBuildingAsDoor failed due to missing params`);
      return false;
    }

    const startTile = gameMap.getTile(player.x, player.y);
    if (!startTile) return false;

    if (startTile.terrain !== 'floor') {
      console.log(`[GameContext] isPlayerInSameBuildingAsDoor failed: player not on floor (terrain: ${startTile.terrain})`);
      return false;
    }

    const queue = [{ x: player.x, y: player.y }];
    const visited = new Set([`${player.x},${player.y}`]);
    const maxCheckedTiles = 400;

    let head = 0;
    while (head < queue.length && queue.length < maxCheckedTiles) {
      const { x, y } = queue[head++];
      
      const neighbors = [
        { x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }
      ];

      for (const next of neighbors) {
        if (next.x === doorPos.x && next.y === doorPos.y) {
          console.log(`[GameContext] isPlayerInSameBuildingAsDoor SUCCESS: reached door at (${doorPos.x}, ${doorPos.y})`);
          return true; // Reached the door!
        }

        const key = `${next.x},${next.y}`;
        if (visited.has(key)) continue;

        const tile = gameMap.getTile(next.x, next.y);
        if (!tile) continue;

        const isWall = tile.terrain === 'wall' || tile.terrain === 'building' || tile.terrain === 'fence';
        const door = tile.contents.find(e => e.type === 'door');
        const isClosedDoor = door && !door.isOpen;

        if (isWall || isClosedDoor) {
          visited.add(key);
          continue;
        }

        if (tile.terrain !== 'floor') {
          visited.add(key);
          continue;
        }

        visited.add(key);
        queue.push(next);
      }
    }
    
    console.log(`[GameContext] isPlayerInSameBuildingAsDoor failed: BFS exhausted without finding door`);
    return false;
  }, []);

  const performSleep = useCallback(async (hours, energyMultiplier = 1) => {
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
        player.modifyStat('energy', 2.5 * energyMultiplier);
        player.modifyStat('nutrition', -1);
        player.modifyStat('hydration', -1);

        // HP recovery: 0.5 HP per hour if nutrition and hydration are > 0
        // HP recovery: 0.5 HP per hour if healthy, nutrition and hydration are > 0
        if (player.nutrition > 0 && player.hydration > 0 && player.condition === 'Normal' && !player.isBleeding) {
          player.heal(0.5);
        } else if (player.condition !== 'Normal' || player.isBleeding) {
          console.log(`[GameContext] Sleep HP regeneration cancelled due to condition: ${player.condition}${player.isBleeding ? ', Bleeding' : ''}`);
        }

        // Apply bleeding damage during sleep
        if (player.isBleeding) {
          player.takeDamage(1, { id: 'bleeding', type: 'status' });
        }

        // Advanced Turn and Progress
        currentTurn++;
        const hour = (6 + (currentTurn - 1)) % 24;
        const isNight = hour >= 20 || hour < 6;
        
        setTurn(currentTurn);
        setSleepProgress(prev => prev - 1);

        // 1. World & Inventory Processing
        gameMap.processTurn();
        inventoryManager?.processTurn();

        // 2. Battery consumption if flashlight left ON
        if (isFlashlightOn) {
          const flashlight = inventoryManager?.equipment['flashlight'];
          if (flashlight) {
            const battery = typeof flashlight.getBattery === 'function' ? flashlight.getBattery() : null;
            if (battery && battery.ammoCount > 0) {
              battery.ammoCount = Math.max(0, battery.ammoCount - 1);
              if (battery.ammoCount <= 0) {
                setIsFlashlightOn(false);
              }
            } else {
              setIsFlashlightOn(false);
            }
          } else {
            setIsFlashlightOn(false);
          }
        }

        // 3. NPC/Zombie processing
        const zombies = gameMap.getEntitiesByType('zombie');
        const rabbits = gameMap.getEntitiesByType('rabbit');
        const cardinalPositions = getPlayerCardinalPositions(gameMap);
        lastSeenTaggedTilesRef.current.clear();
        let doorAttackedInBuilding = false;

        // Process Zombie Turns
        zombies.forEach(zombie => {
          const turnResult = ZombieAI.executeZombieTurn(
            zombie,
            gameMap,
            player,
            cardinalPositions,
            lastSeenTaggedTilesRef.current
          );

          // Trigger visual effects for attacks (even if player is sleeping, state should be consistent)
          if (turnResult.success) {
            turnResult.actions.forEach(action => {
              if (action.type === 'attackDoor' && action.doorPos) {
                playSound('Bang1');
                if (isPlayerInSameBuildingAsDoor({ x: player.x, y: player.y }, action.doorPos, gameMap)) {
                  addLog(action.doorBroken ? 'Zombie breaks door!' : 'Zombie bangs door!', 'combat');
                  doorAttackedInBuilding = true;
                }
                if (addEffect) {
                  addEffect({ type: 'damage', x: action.doorPos.x, y: action.doorPos.y, value: 'bang', color: '#ffffff', duration: 800 });
                  addEffect({ type: 'tile_flash', x: action.doorPos.x, y: action.doorPos.y, color: 'rgba(139, 115, 85, 0.4)', duration: 300 });
                }
              } else if (action.type === 'attackWindow' && action.windowPos) {
                playSound('GlassBreak');
                addLog('Zombie smashes a window!', 'combat');
                if (addEffect) {
                  addEffect({ type: 'damage', x: action.windowPos.x, y: action.windowPos.y, value: 'SMASH', color: '#ffffff', duration: 1000 });
                  addEffect({ type: 'tile_flash', x: action.windowPos.x, y: action.windowPos.y, color: 'rgba(255, 255, 255, 0.6)', duration: 400 });
                }
              } else if (action.type === 'attack' && action.target === 'player') {
                addLog(`Zombie attacks: ${action.damage} damage`, 'combat');
              }
            });
          }
        });

        // Process Rabbit Turns
        const { RabbitAI } = await import('../game/ai/RabbitAI.js');
        rabbits.forEach(rabbit => {
          RabbitAI.executeRabbitTurn(rabbit, gameMap, player, zombies);
        });
 
        // Animate visible NPCs (zombies and rabbits) during sleep
        await animateVisibleNPCs([...zombies, ...rabbits], playerFieldOfView);

        // Sync stats to UI
        updatePlayerStats({
          hp: player.hp,
          energy: player.energy,
          nutrition: player.nutrition,
          hydration: player.hydration,
          isBleeding: player.isBleeding
        });

        // 4. Interruption check
        let interruption = false;
        let interruptionReason = "";

        // Check if zombies can see player OR if they are adjacent (possibly attacking) 
        // OR if they are banging on the building's door
        const seePlayer = zombies.some(z => z.canSeeEntity(gameMap, player));
        const adjacentZombie = zombies.some(z => Math.abs(z.x - player.x) <= 1 && Math.abs(z.y - player.y) <= 1);

        if (seePlayer || adjacentZombie) {
          interruption = true;
          interruptionReason = "You were woken up by a nearby zombie!";
        } else if (doorAttackedInBuilding) {
          interruption = true;
          interruptionReason = "You were woken up by a zombie banging on the door!";
        }

        // Only check for random spawns if sheltered and not already interrupted
        if (!interruption) {
          const isSheltered = checkIsSheltered(player, gameMap);
          if (!isSheltered && Math.random() < 0.25) {
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
              interruption = true;
              interruptionReason = "Something woke you up!";
            }
          }
        }

        if (interruption) {
          addLog(interruptionReason, 'warning');
          console.log(`[GameContext] Sleep interrupted: ${interruptionReason}`);
          setIsSleeping(false);
          setSleepProgress(0);
          
          updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
          updatePlayerCardinalPositions(gameMap);
          setIsPlayerTurn(true);
          return; // Exit loop
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

  const triggerSleep = useCallback((multiplier = 1) => {
    setSleepMultiplier(multiplier);
    setIsSleepModalOpen(true);
  }, []);

  const startTargetingItem = useCallback((item) => {
    setTargetingItem(item);
  }, []);

  const cancelTargetingItem = useCallback(() => {
    setTargetingItem(null);
    if (typeof window.inv?.clearSelected === 'function') {
      window.inv.clearSelected();
    }
  }, []);

  const digHole = useCallback((x, y) => {
    const player = playerRef.current;
    const gameMap = gameMapRef.current;
    
    // Safety guards
    if (!player || !gameMap || !targetingItem || !inventoryManager) {
      console.warn('[GameContext] digHole guard triggered', { 
        hasPlayer: !!player, 
        hasMap: !!gameMap, 
        hasTarget: !!targetingItem, 
        hasInv: !!inventoryManager 
      });
      return { success: false };
    }

    // The context menu already ensures the tool can dig. If targeting is active, proceed.
    if (!targetingItem || !targetingItem.hasTrait || !targetingItem.hasTrait(ItemTrait.CAN_DIG)) {
      if (targetingItem && !targetingItem.traits?.includes(ItemTrait.CAN_DIG) && !targetingItem.traits?.includes('canDig')) {
        return { success: false, reason: 'Requires digging tool' };
      }
    }

    // Cost 5AP
    if (player.ap < 5) {
      addLog("Not enough AP to dig (requires 5)", "warning");
      return { success: false, reason: 'Need 5 AP' };
    }

    // Get the ground container for the tile we are targeting
    if (!inventoryManager.groundContainer) {
      console.error('[GameContext] No ground container found in InventoryManager');
          return { success: false };
    }

    // Create hole item
    const itemData = createItemFromDef('provision.hole');
    const holeItem = Item.fromJSON(itemData);
    
    // Add to ground container (x, y are grid coordinates passed from UI)
    const success = inventoryManager.groundContainer.addItem(holeItem, x, y);
    
    if (!success) {
      addLog("Could not dig here - space is occupied", "system");
      return { success: false, reason: 'Grid placement failed' };
    }

    // Deduct AP
    const DIG_AP_COST = 5;
    const newAp = Math.max(0, player.ap - DIG_AP_COST);
    player.useAP(DIG_AP_COST);
    updatePlayerStats({ ap: newAp });
    
    addLog("You dig a hole in the ground.", "world");
    gameMap.emitNoise(player.x, player.y, 5);
    
    if (addEffect) {
      addEffect({
        type: 'tile_flash',
        x: player.x,
        y: player.y,
        color: 'rgba(139, 115, 85, 0.4)',
        duration: 300
      });
    }

    // Degrade shovel
    if (targetingItem.hasTrait('degradable')) {
      targetingItem.degrade(2);
      if (targetingItem.condition <= 0) {
        addLog(`Your ${targetingItem.name} broke!`, 'warning');
        inventoryManager.destroyItem(targetingItem.instanceId);
        setTargetingItem(null);
      }
    }

    // Clear targeting after success
    setTargetingItem(null);
    
    // Refresh UI directly
    if (typeof window.inv?.refresh === 'function') {
      window.inv.refresh();
    } else {
      inventoryManager.emit('inventoryChanged');
    }
    
    return { success: true, item: holeItem };
  }, [playerRef, gameMapRef, targetingItem, inventoryManager, updatePlayerStats, addLog, addEffect]);

  const plantSeed = useCallback((gridX, gridY, seedOverride = null) => {
    const player = playerRef.current;
    const gameMap = gameMapRef.current;
    
    // Choose which seed to use: the override (from cursor) or the targeting state
    const activeSeed = seedOverride || targetingItem;
    
    if (!player || !activeSeed || !inventoryManager) return { success: false };

    if (player.ap < 1) {
      addLog("Not enough AP to plant (requires 1)", "warning");
      return { success: false, reason: 'Need 1 AP' };
    }

    // Find the hole in the ground container at gridX, gridY
    const groundSource = inventoryManager.groundContainer;
    const hole = groundSource.getAllItems().find(i => 
      i.defId === 'provision.hole' && i.x === gridX && i.y === gridY
    );

    if (!hole) {
      addLog("Must plant in a hole!", "warning");
      return { success: false, reason: 'No hole' };
    }

    // Determine plant type from seed
    const seedToPlant = {
      'food.cornseeds': 'provision.corn_plant',
      'food.tomatoseeds': 'provision.tomato_plant',
      'food.carrotseeds': 'provision.carrot_plant'
    };

    const plantDefId = seedToPlant[activeSeed.defId];
    if (!plantDefId) {
      addLog("You can't plant this here.", "warning");
      return { success: false, reason: 'Invalid seed' };
    }

    // Replace hole with plant
    const plantData = createItemFromDef(plantDefId);
    const plantItem = Item.fromJSON(plantData);

    // Ground container update: remove hole and add plant at SAME position
    groundSource.removeItem(hole.instanceId);
    const success = groundSource.addItem(plantItem, gridX, gridY);
    
    if (!success) {
       console.error('[GameContext] Failed to place plant in hole at:', gridX, gridY);
       // Fallback: try to put the hole back
       groundSource.addItem(hole, gridX, gridY);
       return { success: false, reason: 'Placement failed' };
    }

    // Refresh UI
    if (typeof window.inv?.refresh === 'function') {
      window.inv.refresh();
    } else {
      inventoryManager.emit('inventoryChanged');
    }
    if (success) {
      console.log(`[GameContext] Planting success: ${plantItem.name} (${plantItem.instanceId}), imageId: ${plantItem.imageId}`);
      player.modifyStat('ap', -1);
      
      // Consume 1 seed (handle stacks)
      if (activeSeed.stackCount > 1) {
        activeSeed.stackCount -= 1;
      } else {
        // Remove the seed item from its container
        const seedContainer = activeSeed._container;
        if (seedContainer) {
          seedContainer.removeItem(activeSeed.instanceId);
        }
        setTargetingItem(null);
        if (typeof window.inv?.clearSelected === 'function') {
          window.inv.clearSelected();
        }
      }
      
      addLog(`You plant the ${activeSeed.name.toLowerCase()}.`, "info");
      updatePlayerStats({ ap: player.ap });

      return { success: true };
    }

    return { success: false };
  }, [playerRef, targetingItem, inventoryManager, addLog, updatePlayerStats]);

  const harvestPlant = useCallback((plantItem) => {
    const player = playerRef.current;
    if (!player || !inventoryManager) return;

    const ground = inventoryManager.groundContainer;
    const x = plantItem.x;
    const y = plantItem.y;

    // Remove plant
    ground.removeItem(plantItem.instanceId);

    // Generate 4-7 produce
    const count = 4 + Math.floor(Math.random() * 4);
    const produceDefId = plantItem.produce || 'food.corn'; // Fallback to corn for safety
    const produceData = createItemFromDef(produceDefId);
    const produceItem = Item.fromJSON(produceData);
    produceItem.stackCount = count;

    // Helper for correct pluralization
    const getLogName = (item, qty) => {
      const name = item.name.toLowerCase();
      if (qty <= 1) return name;
      if (item.defId === 'food.corn') return name; // Corn remains corn
      if (name === 'tomato') return 'tomatoes';
      return name.endsWith('s') ? name : `${name}s`;
    };

    const logName = getLogName(produceItem, count);

    // Add to ground at same position
    const success = ground.addItem(produceItem, x, y);
    
    if (success) {
      addLog(`You harvest ${count} ${logName}.`, "info");
      if (inventoryManager) {
        if (player && gameMapRef.current) {
          inventoryManager.syncWithMap(player.x, player.y, player.x, player.y, gameMapRef.current);
        }
        inventoryManager.emit('inventoryChanged');
      }
      if (triggerMapUpdate) triggerMapUpdate();
    } else {
      // Fallback: try adding anywhere in ground
      ground.addItem(produceItem);
      addLog(`You harvest ${count} ${logName}.`, "info");
      if (inventoryManager) {
        if (player && gameMapRef.current) {
          inventoryManager.syncWithMap(player.x, player.y, player.x, player.y, gameMapRef.current);
        }
        inventoryManager.emit('inventoryChanged');
      }
      if (triggerMapUpdate) triggerMapUpdate();
    }
  }, [playerRef, inventoryManager, addLog, triggerMapUpdate]);

  const useBreakingToolOnStructure = useCallback((x, y) => {
    const player = playerRef.current;
    const gameMap = gameMapRef.current;
    if (!player || !gameMap || !targetingItem) return { success: false };

    // DISPATCHER: Handle specialized tool actions
    if (targetingItem.hasTrait && targetingItem.hasTrait(ItemTrait.CAN_DIG)) {
      return digHole(x, y);
    }
    // POJO fallback
    if (targetingItem.traits?.includes(ItemTrait.CAN_DIG) || targetingItem.traits?.includes('canDig')) {
      return digHole(x, y);
    }

    const seeds = ['food.cornseeds', 'food.tomatoseeds', 'food.carrotseeds'];
    if (seeds.includes(targetingItem.defId)) {
      return plantSeed(x, y);
    }

    // Guard: Prevent action with broken tool
    if (targetingItem.condition !== null && targetingItem.condition <= 0) {
      console.warn(`[GameContext] Blocked structure action with broken tool: ${targetingItem.name}`);
      if (addEffect) {
        addEffect({
          type: 'damage',
          x: player.x,
          y: player.y,
          value: 'Broke!',
          color: '#ef4444',
          duration: 1000
        });
      }
      // Try destroying it again
      if (inventoryManager) {
        inventoryManager.destroyItem(targetingItem.instanceId);
      }
      setTargetingItem(null);
      return { success: false, reason: 'Tool is broken' };
    }

    // Distance check (adjacency)
    const dx = Math.abs(player.x - x);
    const dy = Math.abs(player.y - y);
    const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

    if (!isAdjacent) {
      return { success: false, reason: 'Too far' };
    }

    const tile = gameMap.getTile(x, y);
    const structure = tile?.contents.find(e => e.type === 'door' || e.type === 'window');

    if (!structure) {
      return { success: false, reason: 'No door or window' };
    }

    if (!structure.isLocked || structure.isOpen || structure.isBroken) {
      return { success: false, reason: 'Already open or broken' };
    }

    if (player.ap < 2) {
      return { success: false, reason: 'Need 2 AP' };
    }

    // Perform action: Unlock and open the structure (don't break windows, just pry them open)
    structure.isLocked = false;
    structure.isOpen = true;
    structure.isDamaged = true; // Use damaged flag to show it was forced
    structure.updateBlocking();
    
    // Play sound (prying a structure usually sounds like opening it forcibly)
    playSound('ForceOpen');
    
    addLog(`You pry the ${structure.type} open with your ${targetingItem.name}.`, 'world');
    gameMap.emitNoise(x, y, 3);

    player.useAP(2);

    // Reduce condition
    if (targetingItem.hasTrait('degradable')) {
      targetingItem.degrade(2);
      
      if (targetingItem.condition <= 0) {
        console.log(`[GameContext] Tool ${targetingItem.name} BROKE!`);
        if (addEffect) {
          addEffect({
            type: 'damage',
            x: player.x,
            y: player.y,
            value: 'Broke!',
            color: '#fbbf24',
            duration: 1500
          });
        }
        
        // Destroy broken tool
        if (inventoryManager) {
          inventoryManager.destroyItem(targetingItem.instanceId);
        }
        setTargetingItem(null); // Stop targeting since it broke
      }
    }

    setTargetingItem(null);
    updatePlayerStats({ ap: player.ap });
    updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
    updatePlayerCardinalPositions(gameMap);

    // Force re-render of map
    if (typeof gameMap.emitEvent === 'function') {
      gameMap.emitEvent('mapUpdated'); // Generic update event
    }

    return { success: true };
  }, [playerRef, gameMapRef, targetingItem, inventoryManager, updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions, isNight, isFlashlightOnActual, getActiveFlashlightRange, addLog, playSound, addEffect, digHole, plantSeed]);

  const animateVisibleNPCs = useCallback((npcs, currentFov) => {
    return new Promise((resolve) => {
      // 1. Identify NPCs that moved and are visible
      const currentFovSafe = currentFov || [];
      const movedNPCs = npcs.filter(n => n.movementPath && n.movementPath.length > 1);
      
      const animatingNPCs = movedNPCs.filter(npc => {
        // Visibility check: Was it visible at start OR is it visible at end?
        const startPos = npc.movementPath[0];
        const endPos = npc.movementPath[npc.movementPath.length - 1];
        
        const isStartVisible = currentFovSafe.some(pos => pos.x === startPos.x && pos.y === startPos.y);
        const isEndVisible = currentFovSafe.some(pos => pos.x === endPos.x && pos.y === endPos.y);
        
        return isStartVisible || isEndVisible;
      });

      if (animatingNPCs.length === 0) {
        if (movedNPCs.length > 0) {
          console.log(`[GameContext] ${movedNPCs.length} NPCs moved, but none are currently visible in FOV`);
        }
        setIsAnimatingZombies(false);
        resolve();
        return;
      }

      console.log(`[GameContext] 🏃 ANIMATING ${animatingNPCs.length} visible NPCs...`);

      // Dynamic duration based on movement distance
      const maxTilesMoved = animatingNPCs.reduce((max, n) => Math.max(max, (n.movementPath?.length || 1) - 1), 1);
      const duration = Math.min(1000, 300 + (maxTilesMoved * 70));
      console.log(`[GameContext] Animating visible NPCs (maxDist=${maxTilesMoved}) duration: ${duration}ms`);

      // 2. Start animation
      // We still use setIsAnimatingZombies as the global UI gate for "NPCs are moving"
      setIsAnimatingZombies(true);
      animatingNPCs.forEach(n => {
        n.isAnimating = true;
        n.animationProgress = 0;
      });

      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);

        animatingNPCs.forEach(n => {
          n.animationProgress = progress;
        });

        // Trigger map re-render
        if (triggerMapUpdate) triggerMapUpdate();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete
          npcs.forEach(n => {
            n.isAnimating = false;
            n.animationProgress = 0;
            // Clear movement path after animation to prevent snap-back on future frames
            if (n.movementPath && n.movementPath.length > 1) {
              n.movementPath = [{ x: n.x, y: n.y }];
            }
          });
          setIsAnimatingZombies(false);
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }, [triggerMapUpdate]);

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
      logger.debug('Cleared all LastSeen tagged tiles for new zombie turn phase');

      // Process Player Turn-End Status (Sickness, Regen, etc.)
      const player = playerRef.current;
      if (player.sickness > 0) {
        player.sickness -= 1;
        // Take damage from sickness (e.g. 1 hp per turn)
        player.takeDamage(1, { id: 'sickness', type: 'status' });

        if (player.sickness === 0) {
          player.condition = 'Normal';
          console.log('[GameContext] Player recovered from sickness');
        }

        // Update stats to trigger UI update
        updatePlayerStats({
          hp: player.hp,
          sickness: player.sickness,
          condition: player.condition
        });
      }

      // Check awareness one last time before zombie turn
      checkZombieAwareness();

      const zombies = gameMap.getEntitiesByType('zombie');
      console.log(`[GameContext] Processing ${zombies.length} zombie turns`);

      // Phase 11 & Animation Bugfix: Lock animations globally during turn processing
      setIsAnimatingZombies(true);

      // Give React a chance to render the animation lock before logical map mutations occur.
      // This prevents the 'flash' of the final destination during AI calculation.
      await new Promise(resolve => setTimeout(resolve, 0));

      const immediateActions = []; // Actions for stationary zombies (attack now)
      const delayedActions = [];   // Actions for moving zombies (attack after move)

      zombies.forEach(zombie => {
        const turnResult = ZombieAI.executeZombieTurn(
          zombie,
          gameMap,
          player,
          getPlayerCardinalPositions(),
          lastSeenTaggedTilesRef.current
        );

        if (turnResult.success) {
          const hasMoved = zombie.movementPath && zombie.movementPath.length > 1;
          
          turnResult.actions.forEach(action => {
            if (action.type === 'attackDoor' || action.type === 'attackWindow' || action.type === 'attack' || action.type === 'wait') {
              const actionData = { zombieId: zombie.id, ...action };
              if (hasMoved) {
                delayedActions.push(actionData);
              } else {
                immediateActions.push(actionData);
              }
            }
          });
        }
      });
  
      // Helper to process zombie actions (combat, banging, waiting)
      const processZombieActions = (actions) => {
        // Group actions by zombie to aggregate sound triggers
        const zombieActionGroups = new Map();
        
        actions.forEach(action => {
          if (!zombieActionGroups.has(action.zombieId)) {
            zombieActionGroups.set(action.zombieId, {
              attacks: [],
              other: []
            });
          }
          const group = zombieActionGroups.get(action.zombieId);
          if (action.type === 'attack') {
            group.attacks.push(action);
          } else {
            group.other.push(action);
          }
        });

        // 1. Process all aggregated attack results for audio
        zombieActionGroups.forEach((group, zombieId) => {
          if (group.attacks.length > 0) {
            const hasAnyHit = group.attacks.some(a => a.success);
            GameEvents.emit(GAME_EVENT.ZOMBIE_ATTACK_RESULT, { success: hasAnyHit, zombieId });
          }
        });

        // 2. Process physical changes and specific event emissions
        actions.forEach(action => {
          const zombieEntity = zombies.find(z => z.id === action.zombieId);
          if (!zombieEntity) return;

          if (action.type === 'attackDoor' && action.doorPos) {
            playSound('Bang1');
            GameEvents.emit(action.doorBroken ? GAME_EVENT.DOOR_BROKEN : GAME_EVENT.DOOR_BANG, action);
            if (addEffect) {
              addEffect({ type: 'damage', x: action.doorPos.x, y: action.doorPos.y, value: 'bang', color: '#ffffff', duration: 800 });
              addEffect({ type: 'tile_flash', x: action.doorPos.x, y: action.doorPos.y, color: 'rgba(139, 115, 85, 0.4)', duration: 300 });
            }
          } else if (action.type === 'attackWindow' && action.windowPos) {
            playSound('GlassBreak');
            GameEvents.emit(GAME_EVENT.WINDOW_SMASH, action);
            if (addEffect) {
              addEffect({ type: 'damage', x: action.windowPos.x, y: action.windowPos.y, value: 'SMASH', color: '#ffffff', duration: 1000 });
              addEffect({ type: 'tile_flash', x: action.windowPos.x, y: action.windowPos.y, color: 'rgba(255, 255, 255, 0.6)', duration: 400 });
            }
          } else if (action.type === 'attack' && action.target === 'player') {
            if (action.success) {
              player.takeDamage(action.damage, zombieEntity);
              if (action.bleedingInflicted) player.setBleeding(true);
            }
            // ZOMBIE_ATTACK is still emitted for visual components but NO sound is played there anymore.
            GameEvents.emit(GAME_EVENT.ZOMBIE_ATTACK, { ...action, zombie: zombieEntity });
          } else if (action.type === 'wait') {
            // Optional: Shuffle sound or growl for waiting zombies
            GameEvents.emit(GAME_EVENT.ZOMBIE_WAIT, { ...action, zombie: zombieEntity });
          }
        });
      };

      // 1. Process IMMEDIATE actions (Stationary zombies attack now)
      if (immediateActions.length > 0) {
        console.log(`[GameContext] Executing ${immediateActions.length} immediate stationary actions`);
        processZombieActions(immediateActions);
      }

      // 2. Animate visible NPCs
      if (typeof animateVisibleNPCs === 'function') {
        const rabbits = gameMap.getEntitiesByType('rabbit');
        const { RabbitAI } = await import('../game/ai/RabbitAI.js');
        rabbits.forEach(rabbit => {
          RabbitAI.executeRabbitTurn(rabbit, gameMap, player, zombies);
        });

        await animateVisibleNPCs([...zombies, ...rabbits], playerFieldOfView);
      }

      // 3. Process DELAYED actions (Moving zombies attack after arrival)
      if (delayedActions.length > 0) {
        console.log(`[GameContext] Executing ${delayedActions.length} delayed post-movement actions`);
        processZombieActions(delayedActions);
      }

 
      // Regenerate 1 HP at start of new turn phase if survival stats are sufficient (>= 5)
      // Regen logic: 1 HP per turn if healthy, nutrition/hydration threshold met
      if (player.nutrition >= 5 && player.hydration >= 5 && player.condition === 'Normal' && !player.isBleeding) {
        player.heal(1);
      } else if (player.condition !== 'Normal' || player.isBleeding) {
        console.log(`[GameContext] Turn HP regeneration cancelled due to condition: ${player.condition}${player.isBleeding ? ', Bleeding' : ''}`);
      } else {
        console.log(`[GameContext] HP regeneration skipped (threshold 5): Nutrition=${player.nutrition}, Hydration=${player.hydration}`);
      }

      // Apply Diseased condition penalties (Diseased condition reduces AP and HP by 1 per turn)
      if (player.condition === 'Diseased') {
        console.log('[GameContext] Player is Diseased - reducing AP and HP by 1');
        player.modifyStat('ap', -1);
        player.takeDamage(1, { id: 'disease', type: 'infection' });
        GameEvents.emit(GAME_EVENT.PLAYER_DAMAGE, { damage: 1, source: { id: 'disease' } });
      }

      // Apply Bleeding condition penalties
      if (player.isBleeding) {
        console.log('[GameContext] Player is Bleeding - reducing HP by 1');
        player.takeDamage(1, { id: 'bleeding', type: 'status' });
        GameEvents.emit(GAME_EVENT.PLAYER_DAMAGE, { damage: 1, source: { id: 'bleeding' } });
      }

      // Reduce survival stats by 1 on end turn
      player.modifyStat('nutrition', -1);
      player.modifyStat('hydration', -1);
      player.modifyStat('energy', -1);

      // Battery/Torch consumption if flashlight left ON
      if (isFlashlightOn) {
        const flashlight = inventoryManager?.equipment['flashlight'];
        if (flashlight) {
          if (flashlight.defId === 'tool.torch') {
            // Torch consumption (uses condition)
            flashlight.condition = Math.max(0, (flashlight.condition || 0) - 1);
            console.log(`[GameContext] Torch consumption (End Turn): 1 charge. Remaining: ${flashlight.condition}`);
            
            if (flashlight.condition <= 0) {
              addLog('The torch has burned out and crumbles into ash.', 'item');
              setIsFlashlightOn(false);
              inventoryManager.unequipItem('flashlight');
              inventoryManager.destroyItem(flashlight.instanceId);
              forceRefresh();
            }
          } else {
            // Flashlight consumption (uses battery ammoCount)
            const battery = typeof flashlight.getBattery === 'function' ? flashlight.getBattery() : null;
            if (battery && (battery.ammoCount || 0) > 0) {
              battery.ammoCount = Math.max(0, battery.ammoCount - 1);
              console.log(`[GameContext] Flashlight consumption (End Turn): 1 charge. Remaining: ${battery.ammoCount}`);

              if (battery.ammoCount <= 0) {
                console.log('[GameContext] Flashlight battery depleted. Turning off.');
                setIsFlashlightOn(false);
              }
            } else {
              // Flashlight was on but battery is gone/empty
              setIsFlashlightOn(false);
            }
          }
        } else {
          setIsFlashlightOn(false);
        }
      }

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

      // Restore AP based on energy and HP levels
      // 1. Energy Penalty: 
      //    For every 5 points below 25, gain one less AP.
      //    Below 5, regain 1 less AP for every point.
      const energyLost = Math.max(0, 25 - player.energy);
      let energyPenalty = 0;
      if (player.energy >= 5) {
        energyPenalty = Math.floor(energyLost / 5);
      } else {
        // Penalty at 5 is 4. At 4 it is 4, at 3 it is 5... so (8 - energy) works:
        // 5 -> 3? No, user said "regain 1 less ap every turn that their energy does not go above 5"
        // At 4 energy, they get 16ap (Penalty 4).
        // At 3 energy, they get 15ap (Penalty 5).
        // Penalty = 8 - energy.
        energyPenalty = 8 - player.energy;
      }

      // 2. HP Penalty: Same effect as energy (threshold 20 instead of 25)
      const hpLost = Math.max(0, 20 - player.hp);
      let hpPenalty = 0;
      if (player.hp >= 5) {
        hpPenalty = Math.floor(hpLost / 5);
      } else {
        // Penalty at 5 is 3. At 4 it is 3, at 3 it is 4... so (7 - HP) works:
        // 5 -> 2? No, 20-5 = 15. 15/5 = 3.
        // HP Penalty = 7 - player.hp.
        hpPenalty = 7 - player.hp;
      }

      const totalPenalty = energyPenalty + hpPenalty;
      const turnAllotment = Math.max(0, 20 - totalPenalty);

      // Add the turn's AP allotment to what remains from the last turn (capped at 20)
      player.restoreAP(turnAllotment);

      updatePlayerStats({
        ap: player.ap,
        nutrition: player.nutrition,
        hydration: player.hydration,
        energy: player.energy,
        hp: player.hp, // Ensure HP is updated
        isBleeding: player.isBleeding
      });
      console.log(`[GameContext] AP allotment of ${turnAllotment} added. Player AP is now: ${player.ap}`);

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
  }, [turn, isInitialized, isPlayerTurn, inventoryManager, updatePlayerFieldOfView, updatePlayerCardinalPositions, performAutosave, animateVisibleNPCs, checkZombieAwareness, playerRef, gameMap, getPlayerCardinalPositions, updatePlayerStats, isFlashlightOn]);

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
    updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
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
    const success = await mapTransitionConfirm(playerRef.current, updatePlayerCardinalPositions, cancelMovement, cameraOperations, inventoryManager, turn);

    if (success) {
      // Update PlayerContext data after successful transition (no timer)
      updatePlayerFieldOfView(gameMapRef.current, isNight, isFlashlightOn, false, getActiveFlashlightRange());
      updatePlayerCardinalPositions(gameMapRef.current);
      console.log('[GameContext] Player FOV and cardinal positions updated after map transition');
    }

    return success;
  }, [mapTransitionConfirm, playerRef, updatePlayerFieldOfView, updatePlayerCardinalPositions, cancelMovement, gameMapRef, setCameraWorldBounds, cameraRef, inventoryManager, isNight, isFlashlightOn, getActiveFlashlightRange]);

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
    setIsFlashlightOn,
    toggleFlashlight,
    igniteTorch,
    isPlayerTurn,
    isAutosaving,
    isSkillsOpen,
    toggleSkills,

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

    // Map transition components
    mapTransition,
    handleMapTransitionConfirmWrapper,
    handleMapTransitionCancel,

    // Phase 6: Sleep functionality
    isSleeping,
    sleepProgress,
    isSleepModalOpen,
    setIsSleepModalOpen,
    sleepMultiplier,
    triggerSleep,
    performSleep,

    // Crowbar Usage Phase
    targetingItem,
    startTargetingItem,
    cancelTargetingItem,
    digHole,
    plantSeed,
    harvestPlant,
    useBreakingToolOnStructure,
    checkZombieAwareness,

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
    igniteTorch,
    isPlayerTurn,
    isAnimatingZombies,
    isAutosaving,
    isSkillsOpen,
    toggleSkills,
    initializeGame,
    endTurn,
    spawnTestEntities,
    spawnInitialZombies,
    saveGame,
    loadGame,
    loadGameDirect,
    loadAutosave,
    performSleep,
    triggerSleep,
    isSleeping,
    sleepProgress,
    isSleepModalOpen,
    setIsSleepModalOpen,
    sleepMultiplier,
    inventoryManager,
    targetingItem,
    startTargetingItem,
    cancelTargetingItem,
    digHole,
    plantSeed,
    harvestPlant,
    useBreakingToolOnStructure,
    checkZombieAwareness,
    mapTransition,
    handleMapTransitionConfirmWrapper,
    handleMapTransitionCancel
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