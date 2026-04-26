import React, { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { PlayerZombieTracker } from '../game/ai/PlayerZombieTracker.js';
import { ZombieAI } from '../game/ai/ZombieAI.js';
import { GameSaveSystem } from '../game/GameSaveSystem.js';
import GameInitializationManager from '../game/GameInitializationManager.js';
import { PlayerProvider, usePlayer } from './PlayerContext.jsx';
import { GameMapProvider, useGameMap } from './GameMapContext.jsx';
import { CameraProvider, useCamera } from './CameraContext.jsx';
import { InventoryProvider } from './InventoryContext.jsx';
import { useLog } from './LogContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import Logger from '../game/utils/Logger.js';
import { useAudio } from './AudioContext.jsx';
import engine from '../game/GameEngine.js';
import { EntityType } from '../game/entities/Entity.js';

const logger = Logger.scope('GameContext');

// Test functions are imported via inventory system

import { ItemTrait } from '../game/inventory/traits.js';
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
  const { setupPlayerEventListeners, updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions, getPlayerCardinalPositions, cancelMovement, playerFieldOfView, playerCardinalPositions } = usePlayer();
  const { triggerMapUpdate, handleTileClick: mapHandleTileClick, handleTileHover, lastTileClick, hoveredTile, mapTransition, handleMapTransitionConfirm: mapTransitionConfirm, handleMapTransitionCancel } = useGameMap();
  const { setCameraWorldBounds } = useCamera();
  const { addEffect } = useVisualEffects();
  const { addLog, clearLogs } = useLog();
  const { playSound } = useAudio();
  const [inventoryVersion, setInventoryVersion] = useState(0);


  // Phase 5A: inventoryManager is now managed by engine.inventoryManager
  const inventoryManager = engine.inventoryManager;

  // Refs for internal use
  const initManagerRef = useRef(null);

  // LastSeen tile tagging system to prevent zombie clustering
  const lastSeenTaggedTilesRef = useRef(new Set());

  // State machine state
  const [initializationState, setInitializationState] = useState(engine.initializationState);
  const [engineUpdate, setEngineUpdate] = useState(0); // For triggering re-renders on engine changes
  const initRef = useRef('idle'); // Mirror state in ref to avoid closure issues
  const runIdRef = useRef(0); // Track initialization runs
  const [initializationError, setInitializationError] = useState(null);

  // Context synchronization state
  const [contextSyncPhase, setContextSyncPhase] = useState('idle'); // 'idle', 'updating', 'ready'

  // Explicit UI gate to replace problematic contextSyncPhase logic
  const [isGameReady, setIsGameReady] = useState(false);

  // Computed from state machine and explicit gate
  const isInitialized = initializationState === 'complete' && isGameReady;

  useEffect(() => {
    initRef.current = initializationState;
  }, [initializationState]);

  // Phase 2: Listen for engine updates to trigger React re-renders
  // Phase 1: Engine heartbeat bridge (Atomic Sync)
  const enginePulse = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getSnapshot()
  );

  // Sync vital lifecycle flags on every pulse
  useEffect(() => {
    if (engine.initializationState) {
      setInitializationState(engine.initializationState);
    }
  }, [enginePulse]);

  const initializedRef = useRef(false);  const [turn, setTurn] = useState(1);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const hour = (6 + (turn - 1)) % 24;
  const isNight = hour >= 20 || hour < 6;

  // Phase 7: Robust light state for internal GameContext callers
  // Note: These use the local inventoryManager state directly, avoiding the broken useInventory() hierarchy
  const isFlashlightOnActual = useMemo(() => {
    if (!isFlashlightOn) return false;
    const fl = inventoryManager?.equipment['flashlight'];
    if (!fl) return false;
    if (fl.hasTrait(ItemTrait.IGNITABLE) && !fl.isLit) return false;
    return true;
  }, [isFlashlightOn, inventoryVersion, inventoryManager]);

  const getActiveFlashlightRange = useCallback(() => {
    const flashlight = inventoryManager?.equipment['flashlight'];
    if (flashlight) {
      return flashlight.lightRange || 8;
    }
    return 8;
  }, [inventoryManager, inventoryVersion]);


  /**
   * Centralized helper to check for zombies spotting the player.
   * Updates zombie 'isAlerted' state and emits ZOMBIE_ALERTED events.
   * @param {Object} overridePlayerPos - Optional {x,y} to check visibility from (e.g. during animations)
   */
  const checkZombieAwareness = useCallback((overridePlayerPos = null) => {
    const currentMap = engine.gameMap;
    const currentPlayer = engine.player;
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
        
        // BUG 1 FIX: We no longer call zombie.setTargetSighted(checkPlayer.x, checkPlayer.y) here.
        // Doing so overwrites the Last Known Position (LKP) with the player's live position, 
        // even if the zombie lost sight of the player during movement.
        // The PlayerZombieTracker now handles LKP setting accurately when LOS is lost.
      } else if (zombie.isAlerted) {
        // If they lost line of sight, they stay alerted (lastSeen mode)
        // until they reach the LastSeen position (handled in ZombieAI)
      }
    });

    return alertedNew;
  }, [engine]);

  const igniteTorch = useCallback((sourceItem = null) => {
    if (!engine.player || !inventoryManager) return;
    
    // Check AP (1 AP)
    if (engine.player.ap < 1) {
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
    if (!torch || !torch.hasTrait(ItemTrait.IGNITABLE)) {
       addLog('Equip a torch in your hand to ignite it.', 'error');
       return;
    }

    // Perform ignition
    engine.player.useAP(1);
    
    // 1. Consume 1 from source (Lighter/Matches)
    source.consumeCharge(1);
    
    // 2. Consume 1 from the torch instantly (Initial burn)
    torch.consumeCharge(1);
    
    torch.isLit = true;
    setIsFlashlightOn(true);
    
    playSound('Ignite'); 
    addLog(`You ignite the torch using ${source.name}. It uses 1 charge immediately.`, 'item');
    
    // If source empty and is matchbook, discard it
    if ((source.ammoCount || 0) <= 0 && source.defId === 'tool.matchbook' && container) {
      container.removeItem(source.instanceId);
      addLog('The matchbook is empty and discarded.', 'item');
    }

    setInventoryVersion(prev => prev + 1);
  }, [inventoryManager, addLog, playSound, setInventoryVersion]);

  const toggleFlashlight = useCallback(() => {
    const flashlight = inventoryManager?.equipment['flashlight'];
    if (!flashlight) {
      addLog('No lighting tool equipped.', 'error');
      return;
    }

    // Special logic for Torch
    if (flashlight.hasTrait(ItemTrait.IGNITABLE)) {
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

        // Apply INSTANT CONSUMPTION rule (Use 1 charge immediately when turning ON)
        const chargesBefore = flashlight.getCharges();
        const success = flashlight.consumeCharge(1);

        if (!success) {
          console.warn('[GameContext] Cannot turn on flashlight: No battery or empty');
          addLog(`${flashlight.name} has no charges left.`, 'error');
          playSound('EmptyClick');
          return false;
        }

        console.log(`[GameContext] ${flashlight.name} turned on. Instant consumption: 1 charge. Charges remaining: ${flashlight.getCharges()}`);
        addLog(`${flashlight.name} turned on (Uses 1 charge).`, 'info');
        playSound('SwitchOn');
      } else {
        playSound('SwitchOff');
      }

      updatePlayerFieldOfView(engine.gameMap, isNight, newState, false, getActiveFlashlightRange());
      return newState;
    });
  }, [isNight, updatePlayerFieldOfView, inventoryManager, addLog, igniteTorch, playSound, getActiveFlashlightRange, isFlashlightOnActual]);

  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAnimatingZombies, setIsAnimatingZombies] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);

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
      const currentMap = engine.gameMap;
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
  }, [engine]);

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

      console.log('[GameContext] ✅ Initialization complete, synchronizing sub-contexts...');
      
      // Sub-contexts (Player, Map, Inventory) already provide reactive access to engine data
      // Orchestration functions below use the engine directly.

      // Final setup on engine objects
      engine.camera.setWorldBounds(engine.gameMap.width, engine.gameMap.height);
      engine.camera.centerOn(engine.player.x, engine.player.y);
      setupPlayerEventListeners();

      attachInventorySyncListener(engine.player, engine.inventoryManager);

      // Phase 3: Final Settle Handshake
      // Execute handshake immediately to prevent mount/unmount flickering
      console.log('[GameContext] 🤝 Handshake settle starting. Syncing engine...');
      
      // Initial ground sync for the starting tile
      if (engine.inventoryManager && engine.player && engine.gameMap) {
        engine.inventoryManager.syncWithMap(engine.player.x, engine.player.y, engine.player.x, engine.player.y, engine.gameMap);
      }

      engine.emit('sync', engine);
      engine.notifyUpdate();
      if (engine.player) engine.camera.centerOn(engine.player.x, engine.player.y);
      setIsGameReady(true);
      console.log('[GameContext] 🚀 Game ready - UI gate opened (Atomic Sync)');

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
  }, [setupPlayerEventListeners]);

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
  
  // REACTIVE DEFEAT DETECTION: Monitor engine stats directly to catch death immediately
  useEffect(() => {
    if (isInitialized && engine.player && engine.player.hp < 1 && !isDefeated) {
      console.warn('[GameContext] 💀 REACTIVE DEATH DETECTED - Triggering Defeat Dialog');
      setIsDefeated(true);
      setIsPlayerTurn(false); // Lock input immediately
    }
  }, [enginePulse, isInitialized, isDefeated]);

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
    engine.zombieTracker = zombieTracker;

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
    if (contextSyncPhase === 'updating' && engine.gameMap && engine.player && engine.camera && engine.worldManager) {
      console.log('[GameContext] All contexts synchronized, executing final setup...');

      // Development assertions
      if (process.env.NODE_ENV === 'development') {
        if (!engine.player.x || !engine.player.y) {
          console.error('[GameContext] DEV ASSERTION FAILED: Player has invalid position', engine.player);
        }
        if (!engine.gameMap.width || !engine.gameMap.height) {
          console.error('[GameContext] DEV ASSERTION FAILED: GameMap has invalid dimensions', engine.gameMap);
        }
        if (!engine.camera.x && engine.camera.x !== 0 || !engine.camera.y && engine.camera.y !== 0) {
          console.error('[GameContext] DEV ASSERTION FAILED: Camera has invalid position', engine.camera);
        }
      }

      // Now safe to do operations that depend on all contexts
      if (typeof updatePlayerFieldOfView === 'function') {
        updatePlayerFieldOfView(engine.gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
      }
      if (typeof updatePlayerCardinalPositions === 'function') {
        updatePlayerCardinalPositions(engine.gameMap);
      }

      // Mark as fully ready
      setContextSyncPhase('ready');
      console.log('[GameContext] Initialization fully complete - all contexts ready for operations');
    }
  }, [contextSyncPhase, updatePlayerFieldOfView, updatePlayerCardinalPositions, isNight, isFlashlightOnActual, getActiveFlashlightRange]);



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

      // Sync ALL engine state atomically from loaded save
      engine.sync(loadedState);
      
      // Phase 23 Fix: Ensure Turn state and derived values are set correctly during autosave load
      setTurn(loadedState.turn);
      setIsPlayerTurn(true);
      setIsGameReady(true);
      setIsAutosaving(false);
      setIsDefeated(false);
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
  }, [setupPlayerEventListeners, updatePlayerFieldOfView, updatePlayerCardinalPositions]);

  const loadGame = useCallback(async (slotName = 'quicksave') => {
    try {
      const loadedState = await GameSaveSystem.loadFromLocalStorage(slotName);
      if (!loadedState) {
        console.warn(`[GameContext] No save found in slot: ${slotName}`);
        return false;
      }
      console.log('[GameContext] Applying loaded state...');

      // Atomic engine sync
      engine.sync(loadedState);
      
      setTurn(loadedState.turn);
      setIsPlayerTurn(true);
      setIsAutosaving(false);
      setIsGameReady(true);
      setIsDefeated(false);
      setInitializationState('complete');
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
  }, [setupPlayerEventListeners, updatePlayerFieldOfView, updatePlayerCardinalPositions]);

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
      
      // Phase 25/Power Fix: Reset the global engine state to clear transient states like 'dragging'
      engine.reset();

      setInitializationState('idle');
      wireManagerEvents(initManagerRef.current, runIdRef.current);
    }

    setIsDefeated(false);
    setIsPlayerTurn(true);
    setIsAnimatingZombies(false);
    setIsFlashlightOn(false);
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



  const performAutosave = useCallback((turnOverride = null) => {
    if (!isInitialized) return false;

    try {
      setIsAutosaving(true);

      // FIX 4: CRITICAL - Verify player is on map before saving
      const playersOnMap = engine.gameMap?.getEntitiesByType('player') || [];
      if (playersOnMap.length === 0) {
        console.error('[GameContext] Autosave aborted - no player on map!');
        setIsAutosaving(false);
        return false;
      }

      console.log('[GameContext] Performing autosave with valid game state...');

      const currentGameState = {
        gameMap: engine.gameMap,
        worldManager: engine.worldManager,
        player: engine.player,
        camera: engine.camera,
        inventoryManager: inventoryManager,
        turn: turnOverride !== null ? turnOverride : turn,
        playerStats: { hp: engine.player?.hp || 100, maxHp: engine.player?.maxHp || 100, ap: engine.player?.ap || 12, maxAp: engine.player?.maxAp || 12, ammo: 0 }
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
  }, [isInitialized, inventoryManager, turn]);

  // NPC Animation Orchestration
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
          console.log(`[GameContext] ${movedNPCs.length} NPCs moved, but none are currently visible in FOV. Resetting paths.`);
          movedNPCs.forEach(n => {
            n.isAnimating = false;
            n.animationProgress = 0;
            if (n.movementPath && n.movementPath.length > 1) {
              n.movementPath = [{ x: n.x, y: n.y }];
            }
          });
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

      // PHASE 11 FIXED: Global timeout safety for animations
      const safetyTimeout = setTimeout(() => {
        console.warn('[GameContext] ⚠️ Animation timeout reached! Forcing resolution.');
        setIsAnimatingZombies(false);
        resolve();
      }, duration + 500);

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
          clearTimeout(safetyTimeout);
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
    const gameMap = engine.gameMap;
    const player = engine.player;
    if (!isInitialized || !player || !gameMap || !isPlayerTurn) {
      console.warn('[GameContext] Cannot end turn - missing requirements', {
        isInitialized,
        hasPlayer: !!player,
        hasGameMap: !!gameMap,
        isPlayerTurn
      });
      return;
    }

    try {
      console.log('[GameContext] >>> END TURN START');
      // Process map-level turn effects (e.g. campfire expiration) EARLY 
      // This ensures 0.5 turns vanish as soon as player hits endTurn.
      if (gameMap && gameMap.processTurn) {
        gameMap.processTurn(player, engine.isSleeping, turn);
      }

      // Also process turn effects for items currently in the active ground container
      if (inventoryManager && inventoryManager.processTurn) {
        const playerTile = gameMap.getTile(player.x, player.y);
        const isPlayerOutdoors = playerTile ? ['road', 'sidewalk', 'grass'].includes(playerTile.terrain) : false;
        inventoryManager.processTurn(turn, isPlayerOutdoors);
      }

      setIsPlayerTurn(false);
      GameEvents.emit(GAME_EVENT.TURN_ENDED);
      lastSeenTaggedTilesRef.current.clear();
      logger.debug('Cleared all LastSeen tagged tiles for new zombie turn phase');

      // Process Player Turn-End Status (Sickness, Regen, etc.)
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
      const midAnimationActions = []; // BREACH ACTIONS (attack window/door while moving)
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
          const willMoveInTurn = turnResult.actions.some(a => a.type === 'move' || a.type === 'momentum_move');
          let hasMovedYet = false;
          
          turnResult.actions.forEach(action => {
            // Track if the zombie has started moving during this turn sequence
            if (action.type === 'move' || action.type === 'momentum_move') {
              hasMovedYet = true;
            }

            if (action.type === 'attackDoor' || action.type === 'attackWindow' || action.type === 'attack' || action.type === 'wait') {
              const actionData = { zombieId: zombie.id, ...action };
              
              // New Timing Heuristic:
              // 1. Structure Breaches by moving zombies -> midAnimation (150ms delay)
              // 2. Pre-movement actions -> immediate (0ms delay)
              // 3. Post-movement actions -> delayed (plays after arrival)
              
              if (!hasMovedYet) {
                // If it's a structure attack and the zombie moves later, trigger it mid-way for visual impact
                if (willMoveInTurn && (action.type === 'attackDoor' || action.type === 'attackWindow')) {
                  midAnimationActions.push(actionData);
                } else {
                  immediateActions.push(actionData);
                }
              } else {
                delayedActions.push(actionData);
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
            // Trigger visual synchronization for animations
            const doorTile = gameMap.getTile(action.doorPos.x, action.doorPos.y);
            const doorEntity = doorTile?.contents.find(e => e.type === EntityType.DOOR);
            if (doorEntity && typeof doorEntity.syncVisualState === 'function') {
                doorEntity.syncVisualState();
            }

            GameEvents.emit(action.doorBroken ? GAME_EVENT.DOOR_BROKEN : GAME_EVENT.DOOR_BANG, action);
            if (addEffect) {
              addEffect({ type: 'damage', x: action.doorPos.x, y: action.doorPos.y, value: 'bang', color: '#ffffff', duration: 800 });
              addEffect({ type: 'tile_flash', x: action.doorPos.x, y: action.doorPos.y, color: 'rgba(139, 115, 85, 0.4)', duration: 300 });
            }
          } else if (action.type === 'attackWindow' && action.windowPos) {
            // Trigger visual synchronization for animations
            const windowTile = gameMap.getTile(action.windowPos.x, action.windowPos.y);
            const windowEntity = windowTile?.contents.find(e => e.type === EntityType.WINDOW);
            if (windowEntity && typeof windowEntity.syncVisualState === 'function') {
                windowEntity.syncVisualState();
            }

            GameEvents.emit(GAME_EVENT.WINDOW_SMASH, action);
            if (addEffect) {
              addEffect({ type: 'damage', x: action.windowPos.x, y: action.windowPos.y, value: 'SMASH', color: '#ffffff', duration: 1000 });
              addEffect({ type: 'tile_flash', x: action.windowPos.x, y: action.windowPos.y, color: 'rgba(255, 255, 255, 0.6)', duration: 400 });
            }
          } else if (action.type === 'attack' && action.target === EntityType.PLAYER) {
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

        console.log('[GameContext] Starting NPC animations...');
        
        // Non-blocking call to start animations
        const animationPromise = animateVisibleNPCs([...zombies, ...rabbits], playerFieldOfView);

        // SYNC: Process mid-animation breach actions after a short delay
        // This allows the zombie to "step forward" into the window before it shatters
        if (midAnimationActions.length > 0) {
          setTimeout(() => {
            console.log(`[GameContext] Executing ${midAnimationActions.length} mid-animation breach actions`);
            processZombieActions(midAnimationActions);
          }, 150); // 150ms is roughly 1/4 of a standard tile move duration
        }

        await animationPromise;
      }

      // 3. Process DELAYED actions (Moving zombies attack after arrival)
      if (delayedActions.length > 0) {
        console.log(`[GameContext] Executing ${delayedActions.length} delayed post-movement actions`);
        processZombieActions(delayedActions);
      }

      console.log('[GameContext] Processing survival stats and AP regeneration...');
      // Regenerate 1 HP at start of new turn phase if survival stats are sufficient (>= 5)
      // Regen logic: 1 HP per turn if healthy, nutrition/hydration threshold met
      if (player.nutrition >= 5 && player.hydration >= 5 && player.condition === 'Normal' && !player.isBleeding) {
        player.heal(1, true); // Silent heal for turn-based regen
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
          const success = flashlight.consumeCharge(1);
          if (success) {
            console.log(`[GameContext] ${flashlight.name} consumption (Turn change): 1 charge. Remaining: ${flashlight.getCharges()}`);
          } else {
            if (flashlight.hasTrait(ItemTrait.IGNITABLE)) {
              addLog('The torch has burned out.', 'item');
            } else {
              addLog(`${flashlight.name} has run out of power.`, 'item');
            }
            setIsFlashlightOn(false);
            setInventoryVersion(prev => prev + 1);
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
      const energyLost = Math.max(0, 25 - player.energy);
      let energyPenalty = 0;
      if (player.energy >= 5) {
        energyPenalty = Math.floor(energyLost / 5);
      } else {
        energyPenalty = 8 - player.energy;
      }

      const hpLost = Math.max(0, 20 - player.hp);
      let hpPenalty = 0;
      if (player.hp >= 5) {
        hpPenalty = Math.floor(hpLost / 5);
      } else {
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
      
      // Phase 25: Update procedural weather system
      if (engine.weatherManager) {
        engine.weatherManager.update(newTurn);
      }

      const nextHour = (6 + (newTurn - 1)) % 24;
      const nextIsNight = nextHour >= 20 || nextHour < 6;

      updatePlayerFieldOfView(gameMap, nextIsNight, isFlashlightOn);
      updatePlayerCardinalPositions(gameMap);
      triggerMapUpdate();

      setTurn(newTurn);
      console.log('[GameContext] Turn processing logic complete. New turn:', newTurn);

      // Final synchronization after all turn processing (zombies, survival, AP regen)
      engine.notifyUpdate();

      // DEFEAT DETECTION: Check at the absolute start of the NEW turn
      if (player.hp < 1) {
        console.warn('[GameContext] 💀 Player is dead! Suppressing autosave and triggering defeat dialog.');
        setIsDefeated(true);
        setIsPlayerTurn(false); // Explicit lock
        return; // HALT everything else
      }

      await performAutosave(newTurn);

    } catch (error) {
      console.error('[GameContext] ❌ ERROR during endTurn:', error);
    } finally {
      // Only unlock turn if the player survived
      const isDead = engine.player?.hp < 1;
      setIsPlayerTurn(!isDead);
      setIsAnimatingZombies(false);
      console.log(`[GameContext] <<< END TURN FINISHED (Input ${!isDead ? 'Unlocked' : 'LOCKED - Player Dead'})`);
    }
  }, [turn, isInitialized, isPlayerTurn, playerFieldOfView, inventoryManager, updatePlayerFieldOfView, updatePlayerCardinalPositions, performAutosave, animateVisibleNPCs, checkZombieAwareness, getPlayerCardinalPositions, updatePlayerStats, isFlashlightOn]);

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
    const gameMap = engine.gameMap;
    const player = engine.player;
    if (!gameMap || !player) return;

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
  }, [updatePlayerFieldOfView, isNight, isFlashlightOnActual, getActiveFlashlightRange]);

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
        const gameMap = engine.gameMap;
        const player = engine.player;

        if (!gameMap) {
          console.error('[GameContext] DEV ASSERTION FAILED: Attempting to save with null gameMap');
          return false;
        }
        if (!player) {
          console.error('[GameContext] DEV ASSERTION FAILED: Attempting to save with null player');
          return false;
        }
        const playersOnMap = gameMap.getEntitiesByType('player');
        if (playersOnMap.length === 0) {
          console.error('[GameContext] DEV ASSERTION FAILED: No player on map before save');
          return false;
        }
        if (playersOnMap.length > 1) {
          console.error('[GameContext] DEV ASSERTION FAILED: Multiple players on map before save', playersOnMap.length);
        }

        // CRITICAL: Verify player on map matches engine
        const playerOnMap = playersOnMap[0];
        if (playerOnMap !== player) {
          console.error('[GameContext] DEV ASSERTION FAILED: Player instance mismatch!');
          console.error('[GameContext] - Engine Player:', player.id, 'at', player.x, player.y);
          console.error('[GameContext] - Player on map:', playerOnMap.id, 'at', playerOnMap.x, playerOnMap.y);
          console.error('[GameContext] - Same instance?', playerOnMap === player);
          return false;
        }
      }

      const currentGameState = {
        gameMap: engine.gameMap,
        worldManager: engine.worldManager,
        player: engine.player,
        camera: engine.camera,
        inventoryManager: inventoryManager,
        turn: turn,
        playerStats: { hp: engine.player?.hp || 100, maxHp: engine.player?.maxHp || 100, ap: engine.player?.ap || 12, maxAp: engine.player?.maxAp || 12, ammo: 0 }
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
        gameMap: engine.gameMap,
        worldManager: engine.worldManager,
        player: engine.player,
        camera: engine.camera,
        inventoryManager: inventoryManager,
        turn: turn,
        playerStats: { hp: engine.player?.hp || 100, maxHp: engine.player?.maxHp || 100, ap: engine.player?.ap || 12, maxAp: engine.player?.maxAp || 12, ammo: 0 },
        lastSeenTaggedTiles: lastSeenTaggedTilesRef.current
      };
      return GameSaveSystem.exportToFile(currentGameState, filename);
    } catch (error) {
      console.error('[GameContext] Failed to export game:', error);
      return false;
    }
  }, [isInitialized, turn, inventoryManager]);

  // Wrapper methods for map transitions that include player context functions
  const handleMapTransitionConfirmWrapper = useCallback(async () => {
    console.log('[GameContext] Map transition confirmation wrapper called');
    console.log('[GameContext] - Player:', engine.player ? `${engine.player.id} at (${engine.player.x}, ${engine.player.y})` : 'null');

    if (!engine.player) {
      console.error('[GameContext] Cannot execute transition - no player available');
      return false;
    }

    // Gather camera operations from CameraContext
    const cameraOperations = {
      setWorldBounds: setCameraWorldBounds,
      centerOn: (x, y) => {
        if (engine.camera) {
          engine.camera.centerOn(x, y);
        }
      }
    };

    // Call GameMapContext handleMapTransitionConfirm with required parameters including camera operations
    const success = await mapTransitionConfirm(engine.player, updatePlayerCardinalPositions, cancelMovement, cameraOperations, inventoryManager, turn);

    if (success) {
      // Update PlayerContext data after successful transition (no timer)
      updatePlayerFieldOfView(engine.gameMap, isNight, isFlashlightOn, false, getActiveFlashlightRange());
      updatePlayerCardinalPositions(engine.gameMap);
      console.log('[GameContext] Player FOV and cardinal positions updated after map transition');
    }

    return success;
  }, [mapTransitionConfirm, updatePlayerFieldOfView, updatePlayerCardinalPositions, cancelMovement, setCameraWorldBounds, inventoryManager, isNight, isFlashlightOn, getActiveFlashlightRange]);

  const contextValue = useMemo(() => ({
    // Game lifecycle state only
    isInitialized,
    isGameReady,
    initializationState,
    initializationError,

    // Turn management
    turn,
    setTurn,
    isNight,
    hour,
    isFlashlightOn,
    setIsFlashlightOn,
    toggleFlashlight,
    igniteTorch,
    isPlayerTurn,
    setIsPlayerTurn,
    isAutosaving,
    isAnimatingZombies,
    isSkillsOpen,
    toggleSkills,
    engine,
    enginePulse,

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

    checkZombieAwareness,
    animateVisibleNPCs,
    isFlashlightOnActual,
    getActiveFlashlightRange,

    // Phase 5A: Expose inventoryManager for InventoryProvider
    inventoryManager,

    isDefeated,
    setIsDefeated,

    // Internal refs for debugging
    lastSeenTaggedTiles: lastSeenTaggedTilesRef.current
  }), [
    isInitialized,
    isGameReady,
    initializationState,
    initializationError,
    setTurn,
    isNight,
    hour,
    isFlashlightOn,
    setIsFlashlightOn,
    toggleFlashlight,
    igniteTorch,
    isPlayerTurn,
    setIsPlayerTurn,
    isAutosaving,
    isAnimatingZombies,
    isSkillsOpen,
    toggleSkills,
    enginePulse,
    initializeGame,
    endTurn,
    spawnTestEntities,
    spawnInitialZombies,
    saveGame,
    loadGame,
    loadGameDirect,
    loadAutosave,
    checkZombieAwareness,
    animateVisibleNPCs,
    isFlashlightOnActual,
    getActiveFlashlightRange,
    mapTransition,
    handleMapTransitionConfirmWrapper,
    handleMapTransitionCancel,
    isDefeated,
    setIsDefeated
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
