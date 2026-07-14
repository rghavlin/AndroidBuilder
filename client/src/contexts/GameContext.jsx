import React, { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { PlayerZombieTracker } from '../game/ai/PlayerZombieTracker.js';
import StartModeDialog from '../components/Game/StartModeDialog.tsx';
import { SimulationManager } from '../game/managers/SimulationManager.js';
import turnManager from '../game/managers/TurnManager.js';
import audioManager from '../game/utils/AudioManager.js';
import musicManager from '../game/utils/MusicManager.js';
import { GameSaveSystem } from '../game/GameSaveSystem.js';
import GameInitializationManager from '../game/GameInitializationManager.js';
import { PlayerProvider, usePlayer } from './PlayerContext.jsx';
import { GameMapProvider, useGameMap } from './GameMapContext.jsx';
import { CameraProvider, useCamera } from './CameraContext.jsx';
import { InventoryProvider } from './InventoryContext.jsx';
import { useLog } from './LogContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import { useSpeechBubbles } from './SpeechBubbleContext.jsx';
import eventRunner from '../game/quest/EventRunner.js';
import { resolveMapEvents } from '../game/quest/migrateEvents.js';
import Logger from '../game/utils/Logger.js';
import { useAudio } from './AudioContext.jsx';
import { useOverlays } from './OverlayContext';
import engine from '../game/GameEngine.js';
import { EntityType } from '../game/entities/Entity.js';
import { CombatSystem } from '../game/systems/CombatSystem.js';
import { recalcCharacter, tickInfection, rollWoundInfectionCure } from '../game/utils/SurvivalCascade.js';
import { AttributeProgressionManager } from '../game/systems/AttributeProgressionManager.js';
import { toast } from '../hooks/use-toast';

const logger = Logger.scope('GameContext');

// Test functions are imported via inventory system

import { ItemTrait, EquipmentSlot } from '../game/inventory/traits.js';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';
import { getHourFromTurn } from '../game/utils/TimeUtils.js';
import { TestEntity, Item as LegacyItem } from '../game/entities/TestEntity.js';

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
  const { isMoving: isAnimatingMovement, setupPlayerEventListeners, updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions, getPlayerCardinalPositions, cancelMovement, playerFieldOfView, playerCardinalPositions } = usePlayer();
  const { triggerMapUpdate, handleTileClick: mapHandleTileClick, handleTileHover, lastTileClick, hoveredTile, mapTransition, handleMapTransitionConfirm: mapTransitionConfirm, handleMapTransitionCancel } = useGameMap();
  const { setCameraWorldBounds } = useCamera();
  const { addEffect } = useVisualEffects();
  const { isBubbleActive } = useSpeechBubbles();
  const { addLog, clearLogs } = useLog();
  const { playSound } = useAudio();
  const { resetAll, activeTradeNpc, isBartering, isShopOpen, tollGuard, logHistoryOpen, showMainMenu, isExtensionOpen } = useOverlays();


  // Phase 5A: inventoryManager is now managed by engine.inventoryManager
  const inventoryManager = engine.inventoryManager;

  // Refs for internal use
  const initManagerRef = useRef(null);
  const autosaveTimeoutRef = useRef(null);
  const noAutosaveRef = useRef(false);
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const difficultyResolveRef = useRef(null);
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);
  const characterCreatorResolveRef = useRef(null);

  const resolveCharacterCreator = useCallback((stats) => {
    if (characterCreatorResolveRef.current) {
      characterCreatorResolveRef.current.resolve(stats);
      characterCreatorResolveRef.current = null;
    }
  }, []);

  const cancelCharacterCreator = useCallback(() => {
    if (characterCreatorResolveRef.current) {
      characterCreatorResolveRef.current.reject(new Error('Character creation cancelled'));
      characterCreatorResolveRef.current = null;
    }
  }, []);

  // LastSeen tile tagging system to prevent zombie clustering
  const lastSeenTaggedTilesRef = useRef(new Set());

  // Clean up pending autosaves on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // Set up addLog reference on the engine dynamically
  useEffect(() => {
    engine.addLog = addLog;
    return () => {
      engine.addLog = null;
    };
  }, [addLog]);


  // State machine state
  const initializationState = engine.initializationState;
  const initRef = useRef(initializationState);
  initRef.current = initializationState;
  
  const [engineUpdate, setEngineUpdate] = useState(0); // For triggering re-renders on engine changes
  const runIdRef = useRef(0); // Track initialization runs
  const [initializationError, setInitializationError] = useState(null);

  // Context synchronization state
  const [contextSyncPhase, setContextSyncPhase] = useState('idle'); // 'idle', 'updating', 'ready'

  // Explicit UI gate to replace problematic contextSyncPhase logic
  const [isGameReady, setIsGameReady] = useState(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const isProcessingTurnRef = useRef(false);

  // Computed from state machine and explicit gate
  // Phase 2 Refactor: isGameReady is the definitive signal that UI orchestration can begin.
  const isInitialized = isGameReady;

  // Phase 2: Listen for engine updates to trigger React re-renders
  // Phase 1: Engine heartbeat bridge (Atomic Sync)
  const enginePulse = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getSnapshot()
  );

  const setInitializationState = useCallback((val) => {
    engine.initializationState = typeof val === 'function' ? val(engine.initializationState) : val;
    engine.notifyUpdate();
  }, []);

  const initializedRef = useRef(false);
  const turn = engine.turn;
  const setTurn = useCallback((val) => {
    engine.turn = typeof val === 'function' ? val(engine.turn) : val;
    engine.notifyUpdate();
  }, []);
  const isFlashlightOn = engine.isFlashlightOn;
  const setIsFlashlightOn = useCallback((val) => {
    engine.isFlashlightOn = typeof val === 'function' ? val(engine.isFlashlightOn) : val;
    engine.notifyUpdate();
  }, []);
  const hour = getHourFromTurn(turn);
  const isNight = useMemo(() => {
    if (engine.gameMap?.metadata?.alwaysDark) {
      return true;
    }
    return hour >= 20 || hour < 6;
  }, [hour, enginePulse]);

  // Phase 7: Robust light state for internal GameContext callers
  // Note: These use the local inventoryManager state directly, avoiding the broken useInventory() hierarchy
  const isFlashlightOnActual = useMemo(() => {
    if (!isFlashlightOn) return false;
    const fl = inventoryManager?.equipment['flashlight'];
    if (!fl) return false;
    return true;
  }, [isFlashlightOn, enginePulse, inventoryManager]);

  const isNightVisionActual = useMemo(() => {
    if (!isFlashlightOnActual) return false;
    const fl = inventoryManager?.equipment['flashlight'];
    if (!fl) return false;
    return fl.lightType === 'nightvision';
  }, [isFlashlightOnActual, inventoryManager]);

  const getActiveFlashlightRange = useCallback(() => {
    const flashlight = inventoryManager?.equipment['flashlight'];
    if (flashlight) {
      return flashlight.lightRange || 8;
    }
    return 8;
  }, [inventoryManager, enginePulse]);


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
        
        // CRITICAL: Always update LKP when zombie has confirmed LOS.
        // This ensures the zombie has a valid investigation target if it loses
        // sight of the player before its turn runs (e.g. player steps in then out).
        const pX = Math.round(checkPlayer.logicalX !== undefined ? checkPlayer.logicalX : checkPlayer.x);
        const pY = Math.round(checkPlayer.logicalY !== undefined ? checkPlayer.logicalY : checkPlayer.y);
        zombie.setTargetSighted(pX, pY);
      }
    });

    return alertedNew;
  }, []);

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
    
    const equippedTorch = inventoryManager.equipment['flashlight'];
    if (equippedTorch && equippedTorch.instanceId === torch.instanceId) {
      torch.isLit = true;
      setIsFlashlightOn(true);
      playSound('Ignite'); 
      addLog(`You ignite the torch using ${source.name}. It uses 1 charge immediately.`, 'item');
    } else {
      setIsFlashlightOn(false);
      playSound('Ignite');
      addLog(`You ignite the torch using ${source.name}, but it burns out immediately and crumbles to ash.`, 'warning');
    }
    
    // If source empty and is matchbook or lighter, discard it
    if ((source.ammoCount || 0) <= 0 && (source.defId === 'tool.matchbook' || source.defId === 'tool.lighter')) {
      if (container) {
        container.removeItem(source.instanceId);
      } else {
        inventoryManager.destroyItem(source.instanceId);
      }
      source.stackCount = 0;
      addLog(`The ${source.name.toLowerCase()} is empty and discarded.`, 'item');
    }
  }, [inventoryManager, addLog, playSound]);

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

      updatePlayerFieldOfView(engine.gameMap, isNight, newState, false, getActiveFlashlightRange(), isNightVisionActual);
      return newState;
    });
  }, [isNight, updatePlayerFieldOfView, inventoryManager, addLog, igniteTorch, playSound, getActiveFlashlightRange, isFlashlightOnActual]);

  const turnPhase = engine.turnPhase;
  const setTurnPhase = useCallback((val) => {
    const nextPhase = typeof val === 'function' ? val(engine.turnPhase) : val;

    if (nextPhase === 'PLAYER_TURN') {
      if (engine.player && engine.player.pendingAPRefill !== undefined && engine.player.pendingAPRefill !== null) {
        engine.player.restoreAP(engine.player.pendingAPRefill);
        engine.player.pendingAPRefill = null;
        updatePlayerStats({ ap: engine.player.ap });
      }
    }

    engine.turnPhase = nextPhase;
    engine.notifyUpdate();
  }, [updatePlayerStats]);

  const isPlayerTurn = useMemo(() => engine.turnPhase === 'PLAYER_TURN' && !isProcessingTurn, [enginePulse, isProcessingTurn]);
  const setIsPlayerTurn = useCallback((val) => {
    setTurnPhase(val ? 'PLAYER_TURN' : 'SIMULATING');
  }, [setTurnPhase]);
  const isAnimatingZombies = useMemo(() => engine.turnPhase === 'ANIMATING' || engine.turnPhase === 'SIMULATING' || isProcessingTurn, [enginePulse, isProcessingTurn]);
  const setIsAnimatingZombies = useCallback((val) => {
    const prev = engine.turnPhase;
    if (val) {
      engine.turnPhase = 'ANIMATING';
    } else if (prev === 'ANIMATING') {
      engine.turnPhase = 'SIMULATING';
    }
    engine.notifyUpdate();
  }, []);
  
  const [activeNpcDemand, setActiveNpcDemand] = useState(null); // { npc, player }
  // activeDialog is derived below from eventRunner's active run (unified event
  // model — see QUEST_SYSTEM_PLAN.md §6 / client/src/game/quest/EventRunner.js).
  // { id, steps: [{speaker, text}] } shape kept for DialogOverlay compatibility.
  const activeDialog = (() => {
    const step = eventRunner.getActiveDialogStep();
    return step ? { id: eventRunner.getActiveEventId(), steps: [step] } : null;
  })();
  const isAutosaving = engine.isAutosaving;
  const setIsAutosaving = useCallback((val) => {
    engine.isAutosaving = typeof val === 'function' ? val(engine.isAutosaving) : val;
    engine.notifyUpdate();
  }, []);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);

  // Unified input-blocking flag: true whenever any modal/dialog is up and
  // gameplay input (inventory clicks/drags, tile clicks, etc.) should be ignored.
  // Crafting/cooking (isExtensionOpen) and the skills window (isSkillsOpen) are
  // intentionally excluded - inventory interaction must stay usable while those are open.
  const isModalBlocking = useMemo(() => {
    return !!(
      activeNpcDemand ||
      activeDialog ||
      isBubbleActive ||
      mapTransition ||
      (activeTradeNpc && !isBartering) ||
      logHistoryOpen ||
      showMainMenu ||
      engine.isSleeping
    );
  }, [
    activeNpcDemand, activeDialog, isBubbleActive, mapTransition,
    activeTradeNpc, isBartering,
    logHistoryOpen, showMainMenu, enginePulse
  ]);
  const [isDefeated, setIsDefeatedState] = useState(false);
  const isDefeatedRef = useRef(false);
  const setIsDefeated = useCallback((val) => {
    const nextVal = typeof val === 'function' ? val(isDefeatedRef.current) : val;
    isDefeatedRef.current = nextVal;
    setIsDefeatedState(nextVal);
  }, []);

  const toggleSkills = useCallback(() => {
    setIsSkillsOpen(prev => !prev);
  }, []);

  const animateVisibleNPCs = useCallback((npcs, playerFOV = null) => {
    if (!npcs || npcs.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
      const animatingNPCs = npcs.filter(n => n.movementPath && n.movementPath.length > 1);
      
      if (animatingNPCs.length === 0) {
        resolve();
        return;
      }

      animatingNPCs.forEach(n => {
        n.isAnimating = true;
        n.animationProgress = 0;
      });

      const duration = 350;
      const startTime = performance.now();

      // PHASE 11 FIXED: Global timeout safety for animations
      const safetyTimeout = setTimeout(() => {
        console.warn('[GameContext] ⚠️ Animation timeout reached! Forcing resolution and cleanup.');
        
        // CRITICAL: Must clear state on timeout to prevent "ghosting"
        npcs.forEach(n => {
          n.isAnimating = false;
          n.animationProgress = 0;
          if (n.movementPath && n.movementPath.length > 1) {
            n.movementPath = [{ x: n.x, y: n.y }];
          }
        });

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
            if (n.movementPath && n.movementPath.length > 1) {
              n.movementPath = [{ x: n.x, y: n.y }];
            }
          });
          setTurnPhase('SIMULATING'); // Done animating, but still processing turn
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }, [triggerMapUpdate]);

  const clearNPCAnimations = useCallback((npcs) => {
    if (!npcs) return;
    npcs.forEach(n => {
      n.isAnimating = false;
      n.animationProgress = 0;
      
      // PHASE 28 FIX: Explicitly snap visual position to logical position.
      // This prevents 'invisible' or 'ghost' entities after sleep/simulation.
      if (n.logicalX !== undefined) n.x = n.logicalX;
      if (n.logicalY !== undefined) n.y = n.logicalY;
      if (n.logicalX !== undefined) n.renderX = n.logicalX; // Some entities use renderX
      if (n.logicalY !== undefined) n.renderY = n.logicalY;

      if (n.movementPath && n.movementPath.length > 1) {
        n.movementPath = [{ x: n.x, y: n.y }];
      }
    });
    setTurnPhase('SIMULATING');
  }, []);

  // processEntityActions is deprecated in favor of TurnManager, but we'll remove it in a separate pass if needed.

  /**
   * Phase 2 Refactor: Simulation Phase
   * Calculates all mathematical outcomes of the turn instantly.
   * Produces an actionQueue for visual playback.
   */
  const simulateTurn = useCallback(() => {
    const gameMap = engine.gameMap;
    const player = engine.player;
    const actionQueue = []; // Flat sequential queue
    let demandTriggered = false;

    // Initialize logical positions for all entities at start of turn.
    // CRITICAL: Use gridX/gridY (the authoritative logical position) NOT renderX/renderY.
    // At high turn counts renderX/Y can drift from true position due to off-screen snaps
    // and animation edge cases. Copying render coords into logicalX/Y poisons the AI.
    gameMap.entityMap.forEach(e => {
      if (e.gridX !== undefined) {
        e.logicalX = e.gridX;
        e.logicalY = e.gridY;
      } else {
        // Fallback for entities without gridX (e.g. proxy items)
        e.logicalX = e.x;
        e.logicalY = e.y;
      }
    });

    // 1. Map/Inventory Logic
    if (gameMap.processTurn) {
      const mapActions = gameMap.processTurn(
        player, 
        engine.isSleeping, 
        turn, 
        getPlayerCardinalPositions(), 
        lastSeenTaggedTilesRef.current
      );
      if (mapActions) actionQueue.push(...mapActions);
    }

    // Call AI simulation directly
    const simActions = SimulationManager.runTurn(gameMap, {
      player,
      isSleeping: engine.isSleeping,
      turn,
      playerCardinalPositions: getPlayerCardinalPositions(),
      lastSeenTaggedTiles: lastSeenTaggedTilesRef.current
    });
    if (simActions) actionQueue.push(...simActions);

    if (inventoryManager && inventoryManager.processTurn) {
      const playerTile = gameMap.getTile(player.logicalX, player.logicalY);
      const isPlayerOutdoors = playerTile ? ['road', 'sidewalk', 'grass'].includes(playerTile.terrain) : false;
      inventoryManager.processTurn(turn, isPlayerOutdoors);
    }


    lastSeenTaggedTilesRef.current.clear();

    // 2. Player Pre-Turn Math
    tickInfection(player, (msg, type) => addLog(msg, type));

    if (player.sickness > 0) {
      // Sickness no longer deals direct HP damage — it saps Constitution (lowering
      // maxHp) via the survival cascade below. Here we just tick down its duration.
      player.sickness -= 1;
      AttributeProgressionManager.recordAction(player, 'ENDURE_HARDSHIP');
      if (player.sickness === 0) {
        player.condition = 'Normal';
        AttributeProgressionManager.recordAction(player, 'DISEASE_RECOVERED');
      }
    }
    // Wound infection: like sickness it saps attributes via the survival cascade, but it
    // doesn't tick down on a timer — each turn the player gets a Constitution roll to beat
    // it, and otherwise it persists (cured also by antibiotics/antiseptic).
    if (player.woundInfection) {
      AttributeProgressionManager.recordAction(player, 'ENDURE_HARDSHIP');
      const cured = rollWoundInfectionCure(player, { asleep: false, logCallback: (msg, type) => addLog(msg, type) });
      if (cured) {
        AttributeProgressionManager.recordAction(player, 'DISEASE_RECOVERED');
      }
    }
    if (player.drunkenness > 0) {
      player.drunkenness = Math.max(0, player.drunkenness - 1);
    }

    // 3. Awareness
    checkZombieAwareness();

    // 4. Entity Turn processing is handled by SimulationManager.runTurn above.
    // We scan the resulting actionQueue for any NPC DEMAND actions to trigger dialog events.
    const demandAction = actionQueue.find(a => a.type === 'DEMAND');
    if (demandAction) {
      const npc = gameMap.getEntity(demandAction.entityId);
      if (npc) {
        console.log(`[GameContext] 🚨 NPC Demand detected for NPC ${npc.id}`);
        demandTriggered = { npc, player, isNpcTurn: true };
      }
    }

    // 7. Survival & AP Regen
    if (player.nutrition >= 5 && player.hydration >= 5 && player.condition === 'Normal' && !player.isBleeding) {
      player.heal(1, true);
    }
    // Disease no longer pokes HP or AP directly. Being sick saps Constitution (→ maxHp)
    // and Agility/Perception (→ maxAp, dodge, crit, hearing) through the survival cascade
    // below, so the whole "Diseased" effect flows through the attribute layer.
    if (player.isBleeding) {
      player.takeDamage(1, { id: 'bleeding', type: 'status' });
    }

    player.modifyStat('nutrition', -1);
    player.modifyStat('hydration', -1);
    player.modifyStat('energy', -1);

    // Flashlight consumption
    if (isFlashlightOn) {
      const flashlight = inventoryManager?.equipment['flashlight'];
      if (flashlight) {
        const success = flashlight.consumeCharge(1);
        const stillEquipped = inventoryManager?.equipment['flashlight'] === flashlight;
        if (!success || !stillEquipped) {
          setIsFlashlightOn(false);
          if (!stillEquipped) {
            addLog(`${flashlight.name} has burned out and crumbled to ash.`, 'warning');
          }
        }
      } else {
        setIsFlashlightOn(false);
      }
    }

    // Survival penalties
    if (player.nutrition === 0) {
      player.takeDamage(1, { id: 'survival', type: 'starvation' });
      AttributeProgressionManager.recordAction(player, 'ENDURE_HARDSHIP');
    }
    if (player.hydration === 0) {
      player.takeDamage(1, { id: 'survival', type: 'dehydration' });
      AttributeProgressionManager.recordAction(player, 'ENDURE_HARDSHIP');
    }

    // Survival cascade + derived stats: refresh current Str/Agi/Per/Con from needs,
    // then re-derive maxHp/maxAp — must run BEFORE the AP allotment below so it reads
    // a fresh maxAp.
    recalcCharacter(player);

    // AP Allotment. Exhaustion is now baked into maxAp itself (recalcCharacter), so
    // only the injury penalty (missing HP) and drunkenness reduce the refill further.
    const injuryPenalty = Math.floor(Math.max(0, player.maxHp - player.hp) / 5);
    player.pendingAPRefill = Math.max(0, player.maxAp - injuryPenalty - (player.drunkenness || 0));

    // 8. Time/Weather
    const newTurn = turn + 1;
    if (engine.weatherManager) engine.weatherManager.update(newTurn);
    const nextHour = getHourFromTurn(newTurn);
    const nextIsNight = nextHour >= 20 || nextHour < 6;

    GameEvents.emit(GAME_EVENT.TURN_ENDED);
    return { actionQueue, demandTriggered, newTurn, nextIsNight };
  }, [turn, inventoryManager, checkZombieAwareness, getPlayerCardinalPositions, isFlashlightOn, setIsFlashlightOn]);

  const performAutosave = useCallback(async (turnOverride = null) => {
    if (!isInitialized || engine.isSleeping) return false;
    if (noAutosaveRef.current) {
      console.log('[GameContext] Autosave skipped — noAutosave is set for this scenario');
      return false;
    }
    try {
      setIsAutosaving(true);
      engine.isAutosaving = true; // Phase 28 Fix: Immediate sync to prevent interaction races
      
      // FIX 4: CRITICAL - Verify player is on map before saving
      if (!engine.player || !engine.gameMap || !engine.gameMap.getTile(engine.player.x, engine.player.y)) {
        console.warn('[GameContext] ABORTING AUTOSAVE: Player not found on map');
        setIsAutosaving(false);
        engine.isAutosaving = false;
        return false;
      }

      // 1. Prepare minimal state snapshot
      const currentGameState = {
        turn: turnOverride || turn,
        gameMap: engine.gameMap,
        worldManager: engine.worldManager,
        player: engine.player,
        inventoryManager: engine.inventoryManager,
        camera: engine.camera,
        playerStats: {
            hp: engine.player.hp,
            maxHp: engine.player.maxHp,
            ap: engine.player.ap,
            maxAp: engine.player.maxAp,
            nutrition: engine.player.nutrition,
            maxNutrition: engine.player.maxNutrition,
            hydration: engine.player.hydration,
            maxHydration: engine.player.maxHydration,
            energy: engine.player.energy,
            maxEnergy: engine.player.maxEnergy
        },
        metadata: engine.gameMap.metadata || {}
      };

      // 2. Perform IO
      const success = await GameSaveSystem.saveToStorage(currentGameState, 'autosave');
      
      if (success) {
        console.log(`[GameContext] 💾 Autosave successful at Turn ${turnOverride || turn}`);
        
        // Backup every 5 turns
        const activeTurn = turnOverride || turn;
        if (activeTurn > 0 && activeTurn % 5 === 0) {
          const backupSlotName = 'autosave_backup';
          const backupSuccess = await GameSaveSystem.saveToStorage(currentGameState, backupSlotName);
          if (backupSuccess) {
            toast({
              title: "Game Backup Saved",
              description: `Turn ${activeTurn} backup created successfully.`,
              duration: 2000
            });
          }
        } else {
          toast({
            title: "Game Saved",
            description: `Autosave complete at turn ${activeTurn}.`,
            duration: 2000
          });
        }
      } else {
        toast({
          title: "Save Failed",
          description: "Failed to autosave. Please check the console for details.",
          variant: "destructive"
        });
      }

      setIsAutosaving(false);
      engine.isAutosaving = false;
      return success;
    } catch (error) {
      console.error('[GameContext] Autosave error:', error);
      toast({
        title: "Save Error",
        description: "An error occurred while saving.",
        variant: "destructive"
      });
      setIsAutosaving(false);
      engine.isAutosaving = false;
      return false;
    }
  }, [isInitialized, inventoryManager, turn]);

  /**
   * Phase 3 Refactor: Playback Phase
   * Plays out the actionQueue visually to the player.
   */
  const playbackTurn = useCallback(async (actionQueue, demandTriggered, newTurn, nextIsNight, runIdAtStart = runIdRef.current) => {
    const gameMap = engine.gameMap;
    const player = engine.player;

    // 1. Lock UI & Play actions
    setTurnPhase('ANIMATING');
    engine.turnPhase = 'ANIMATING'; // Phase 28 Fix: Immediate sync
    setIsAnimatingZombies(true);

    try {
      // Convert old actionQueue if it's still in the old format (defensive)
      const flatActions = Array.isArray(actionQueue) ? actionQueue : [
          ...(actionQueue.immediate || []),
          ...(actionQueue.animations || []),
          ...(actionQueue.midAnimation || []),
          ...(actionQueue.delayed || [])
      ];

      await turnManager.processQueue(flatActions, { gameMap, player, addEffect, addLog });

      // A new game can start (bumping runIdRef) while the await above is
      // in flight — cancelPlayback() stops the animation queue quickly but
      // doesn't stop THIS function from resuming afterward. Without this
      // check, the code below would write this stale turn's captured player
      // stats onto whatever engine.player now is (the freshly-initialized
      // new game's player), and force engine.turnPhase back to PLAYER_TURN
      // regardless of the new game's own init state. This is the exact
      // "old game plays on in the background after dying + New Game" bug.
      if (runIdRef.current !== runIdAtStart) {
        console.warn('[GameContext] 🚫 playbackTurn resumed for a stale run; skipping post-playback engine sync.');
        return;
      }

      // 4. Sync UI & State
      updatePlayerStats({
        ap: player.ap,
        nutrition: player.nutrition,
        hydration: player.hydration,
        energy: player.energy,
        hp: player.hp,
        isBleeding: player.isBleeding,
        sickness: player.sickness,
        woundInfection: player.woundInfection,
        condition: player.condition,
        drunkenness: player.drunkenness
      });

      updatePlayerFieldOfView(gameMap, nextIsNight, isFlashlightOnActual, false, getActiveFlashlightRange(), isNightVisionActual);
      updatePlayerCardinalPositions(gameMap);
      if (engine.zombieTracker) {
        const currentFov = engine.playerFieldOfView || [];
        engine.zombieTracker.updateTracking(gameMap, player, currentFov);
        engine.zombieTracker._lastTrackedX = player.x;
        engine.zombieTracker._lastTrackedY = player.y;
      }
      setTurn(newTurn);
      triggerMapUpdate();
      engine.notifyUpdate();

      console.log('[GameContext] 🎬 Playback actions complete, notifying update...');
      engine.notifyUpdate();
    } finally {
      // Visual sync of the captured (possibly detached/stale) gameMap's entities
      // is harmless even for a stale run — it never touches the live engine.
      gameMap.entityMap.forEach(e => {
        if (typeof e.endTurn === 'function') e.endTurn();
        if (typeof e.syncVisualState === 'function') e.syncVisualState();
      });

      // Safety Reset: Ensure the singleton is NOT left in ANIMATING state if
      // playback finishes/crashes. Only for the run that's still current —
      // a stale run must never overwrite a fresh game's turnPhase.
      if (runIdRef.current === runIdAtStart) {
        engine.turnPhase = 'PLAYER_TURN';
      }
    }
  }, [updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions, triggerMapUpdate, performAutosave, isFlashlightOnActual, setTurn, setTurnPhase]);

  const endTurn = useCallback(async () => {
    const timestamp = Date.now();
    console.log(`[GameContext] 🏁 endTurn requested [ID:${timestamp}]`, { 
        isInitialized, 
        turnPhase, 
        isProcessing: isProcessingTurnRef.current,
        hasPlayer: !!engine.player, 
        hasMap: !!engine.gameMap,
        isSleeping: engine.isSleeping
    });

    if (!isInitialized || !engine.player || !engine.gameMap || turnPhase !== 'PLAYER_TURN' || isAnimatingMovement || isAnimatingZombies || isProcessingTurnRef.current) {
      console.warn(`[GameContext] 🛑 endTurn BLOCKED [ID:${timestamp}]:`, { 
        isInitialized, 
        hasPlayer: !!engine.player, 
        hasMap: !!engine.gameMap, 
        turnPhase,
        isAnimatingMovement,
        isAnimatingZombies,
        isProcessing: isProcessingTurnRef.current
      });
      return;
    }

    // Snapshot the current game run. If a new game starts (runIdRef is bumped)
    // while this turn is still playing back — e.g. the player dies mid-turn and
    // immediately restarts — the continuation below must NOT touch turn phase or
    // autosave, or it will re-disable the End Turn button on the fresh game.
    const myRunId = runIdRef.current;

    isProcessingTurnRef.current = true;
    setIsProcessingTurn(true);

    try {
      console.log(`[GameContext] ⚙️ Starting turn simulation phase... [ID:${timestamp}]`);
      setTurnPhase('SIMULATING');
      engine.turnPhase = 'SIMULATING'; // Phase 28 Fix: Immediate sync to prevent coordinate leakage

      const results = simulateTurn();
      const { actionQueue, demandTriggered, newTurn, nextIsNight } = results;

      console.log(`[GameContext] 📺 Starting turn playback phase... [ID:${timestamp}]`, {
          actionCount: Array.isArray(actionQueue) ? actionQueue.length : (actionQueue.immediate?.length || 0) + (actionQueue.midAnimation?.length || 0) + (actionQueue.delayed?.length || 0),
          demandTriggered
      });

      await playbackTurn(actionQueue, demandTriggered, newTurn, nextIsNight, myRunId);

      // Abort if a new game was started while this turn was playing back.
      if (myRunId !== runIdRef.current) {
        console.warn(`[GameContext] 🚫 Turn [ID:${timestamp}] completed for a stale run (${myRunId} != ${runIdRef.current}); skipping phase/autosave finalization.`);
        return;
      }

      // Finalize the phase change here at the absolute end
      if (demandTriggered) {
        setActiveNpcDemand(demandTriggered);
        setTurnPhase('PAUSED_FOR_EVENT');
      } else if (engine.player && engine.player.hp < 1) {
        setIsDefeated(true);
        setTurnPhase('ANIMATING'); 
      } else {
        setTurnPhase('PLAYER_TURN');
        console.log(`[GameContext] ✅ Turn completed successfully [ID:${timestamp}] - UI Enabled`);
        
        if (autosaveTimeoutRef.current) {
          clearTimeout(autosaveTimeoutRef.current);
        }
        autosaveTimeoutRef.current = setTimeout(() => {
          autosaveTimeoutRef.current = null;
          performAutosave(newTurn);
        }, 100);
      }
    } catch (error) {
      console.error(`[GameContext] ❌ FATAL ERROR during turn cycle [ID:${timestamp}]:`, error);
      setTurnPhase('PLAYER_TURN'); // Recovery
      engine.turnPhase = 'PLAYER_TURN';
    } finally {
      isProcessingTurnRef.current = false;
      setIsProcessingTurn(false);
    }
  }, [isInitialized, turnPhase, simulateTurn, playbackTurn, isAnimatingMovement, isAnimatingZombies, setTurnPhase]);



  const extortPlayer = useCallback((npc) => {
    const player = engine.player;
    if (!npc || !player || !inventoryManager) return;

    console.log(`[GameContext] 💸 EXTORTER: NPC ${npc.id} is taking everything from ${player.id}`);

    // 1. Unequip everything except upper/lower body
    const slotsToStrip = Object.keys(inventoryManager.equipment).filter(slot => 
      slot !== EquipmentSlot.UPPER_BODY && slot !== EquipmentSlot.LOWER_BODY
    );

    slotsToStrip.forEach(slot => {
      const item = inventoryManager.equipment[slot];
      if (item) {
        // Unequip directly without AP cost
        inventoryManager.equipment[slot] = null;
        item.isEquipped = false;
        // Move to NPC
        npc.inventory.addItem(item);
      }
    });

    // 2. Check pockets of remaining clothing
    const upperBody = inventoryManager.equipment[EquipmentSlot.UPPER_BODY];
    if (upperBody && upperBody.getPocketContainers) {
      upperBody.getPocketContainers().forEach(pocket => {
        const items = pocket.getAllItems();
        items.forEach(it => {
          pocket.removeItem(it.instanceId);
          npc.inventory.addItem(it);
        });
      });
    }

    const lowerBody = inventoryManager.equipment[EquipmentSlot.LOWER_BODY];
    if (lowerBody && lowerBody.getPocketContainers) {
      lowerBody.getPocketContainers().forEach(pocket => {
        const items = pocket.getAllItems();
        items.forEach(it => {
          pocket.removeItem(it.instanceId);
          npc.inventory.addItem(it);
        });
      });
    }

    // Update NPC state
    npc.hasExtorted = true;
    npc.behaviorState = 'escaping';
    npc.hasDemanded = true;
    
    // Sync UI
    engine.notifyUpdate();
    addLog(`${npc.name} took all your belongings and is making an escape!`, 'hostile');
  }, [inventoryManager]);

  const handleNpcDemandResponse = useCallback(async (choice) => {
    if (!activeNpcDemand) return;
    const { npc } = activeNpcDemand;
    
    try {
      if (choice === 'surrender') {
        extortPlayer(npc);
      } else {
        // Refuse
        npc.hasDemanded = true;
        npc.isHostile = true;
        npc.behaviorState = 'attacking';
        addLog(`You refused ${npc.name}'s demands. Prepare for a fight!`, 'hostile');
      }

      // Follow-up only if it's the NPC's turn phase
      if (activeNpcDemand.isNpcTurn) {
        console.log(`[GameContext] ⚔️ NPC ${npc.name} preparing retaliation (Current AP: ${npc.ap})`);
        
        // Ensure NPC has fresh AP for the follow-up if they used it all to approach
        if (npc.ap < 2.0) {
          console.log(`[GameContext] ⚡ Boosting NPC AP for follow-up attack`);
          npc.ap = 4.0; 
        }
        
        setTurnPhase('ANIMATING'); // Lock UI
        engine.turnPhase = 'ANIMATING';

        const retryResult = SimulationManager.executeNPCTurn(npc, engine.gameMap, engine.player, [], true);
        
        if (retryResult.success && retryResult.actions.length > 0) {
           console.log(`[GameContext] 🏃 NPC ${npc.name} performing ${retryResult.actions.length} follow-up actions...`, retryResult.actions);
           const currentEngineTurn = engine.turn;
           const nextHour = getHourFromTurn(currentEngineTurn);
           const nextIsNight = nextHour >= 20 || nextHour < 6;

           await playbackTurn(retryResult.actions, false, currentEngineTurn, nextIsNight);
        } else {
          console.log(`[GameContext] ⏹️ NPC ${npc.name} has no follow-up actions (Final AP: ${npc.ap})`);
        }
      }
    } catch (err) {
      console.error('[GameContext] Error during NPC demand response:', err);
    } finally {
      setActiveNpcDemand(null);
      setTurnPhase('PLAYER_TURN'); // Resume game
      engine.turnPhase = 'PLAYER_TURN';
      engine.notifyUpdate();
    }
  }, [activeNpcDemand, extortPlayer, playbackTurn, turn, addLog, setTurnPhase]);

  // Dismiss/advance the currently-showing dialog step. The unified runner
  // handles turnPhase + chaining/further steps internally.
  const handleDialogDismiss = useCallback(() => {
    console.log(`[GameContext] Dialog step dismissed: "${eventRunner.getActiveEventId()}"`);
    eventRunner.advance();
  }, []);

  // Replay just the dialog steps (tutorial video + caption) of the event at the
  // player's current tile, ignoring repeat:'once' state. Used by the
  // placeable.help item click. Deliberately does NOT re-run the event's other
  // steps (speech/give/setFlag/chain/...) — those already happened the first
  // time and shouldn't fire again just because the player wants to rewatch a
  // video.
  const fireDialogAtPlayerTile = useCallback(() => {
    const player = engine.player;
    const gameMap = engine.gameMap;
    if (!player || !gameMap) return;
    const events = resolveMapEvents(gameMap.metadata);
    const event = events.find(e => e?.placement?.kind === 'tile' && e.placement.x === player.x && e.placement.y === player.y);
    if (!event) return;
    const dialogSteps = (event.steps || []).filter(s => s.type === 'dialog');
    if (dialogSteps.length === 0) return;
    eventRunner.runEvent({ ...event, steps: dialogSteps }, { ignoreOnce: true });
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
  }, []);

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
      
      if (engine.zombieTracker && engine.player && engine.gameMap) {
        const initialFov = updatePlayerFieldOfView(engine.gameMap, isNight, isFlashlightOn, false, getActiveFlashlightRange(), isNightVisionActual);
        engine.zombieTracker.updateTracking(engine.gameMap, engine.player, initialFov);
        engine.zombieTracker._lastTrackedX = engine.player.x;
        engine.zombieTracker._lastTrackedY = engine.player.y;
      }
      
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

  
  // REACTIVE DEFEAT DETECTION: Monitor engine stats directly to catch death immediately
  useEffect(() => {
    if (isInitialized && engine.player && engine.player.hp < 1 && !isDefeatedRef.current) {
      console.warn('[GameContext] 💀 REACTIVE DEATH DETECTED - Triggering Defeat Dialog');
      setIsDefeated(true);
      setIsPlayerTurn(false); // Lock input immediately
      // Stop the in-flight turn the moment the player dies. Without this the
      // queued actions (and their sounds) keep playing behind the defeat dialog,
      // and the lingering turn can clobber a fresh game's state on restart.
      turnManager.cancelPlayback();
      audioManager.stopAllSounds();
    }
  }, [enginePulse, isInitialized]);
  

  // Proximity check: Trigger NPC demand if player walks adjacent to a hostile NPC
  useEffect(() => {
    const handleMoveEnded = () => {
      const player = engine.player;
      const gameMap = engine.gameMap;
      if (!player || !gameMap) return;

      const npcs = gameMap.getEntitiesByType('npc');
      for (const npc of npcs) {
        if (npc.isHostile && !npc.hasDemanded) {
          const dist = Math.abs(npc.x - player.x) + Math.abs(npc.y - player.y);
          if (dist === 1) {
            console.log(`[GameContext] 🚨 Proximity demand triggered by ${npc.id}`);
            npc.behaviorState = 'demanding';
            setActiveNpcDemand({ npc, player, isNpcTurn: false });
            setTurnPhase('PAUSED_FOR_EVENT');
            break;
          }
        }
      }
    };

    GameEvents.on(GAME_EVENT.PLAYER_MOVE_ENDED, handleMoveEnded);
    return () => {
      GameEvents.off(GAME_EVENT.PLAYER_MOVE_ENDED, handleMoveEnded);
    };
  }, []);

  // Listen for attribute roll and upgrade notifications from engine
  useEffect(() => {
    const handleRollReady = (data) => {
      toast({
        title: 'Dice Roll Available!',
        description: `You have earned enough XP to roll for a ${data.statLabel} upgrade! Open the Abilities screen to roll.`
      });
    };

    const handleAttributeUpgraded = (data) => {
      const formattedStat = data.statType.charAt(0).toUpperCase() + data.statType.slice(1);
      toast({
        title: 'Attribute Upgraded!',
        description: `Your ${formattedStat} increased by +${data.roll}!`
      });
    };

    GameEvents.on(GAME_EVENT.ATTRIBUTE_ROLL_READY, handleRollReady);
    GameEvents.on(GAME_EVENT.ATTRIBUTE_UPGRADED, handleAttributeUpgraded);

    return () => {
      GameEvents.off(GAME_EVENT.ATTRIBUTE_ROLL_READY, handleRollReady);
      GameEvents.off(GAME_EVENT.ATTRIBUTE_UPGRADED, handleAttributeUpgraded);
    };
  }, []);

  // Unified event trigger check on player move (replaces the previously-separate
  // dialog and speech-bubble trigger detection — one runner, one check). Also
  // re-checks auto/parallel events and active movement locks here, since
  // moving is one of the things that can change their eligibility.
  useEffect(() => {
    const checkEventTrigger = () => {
      const player = engine.player;
      const gameMap = engine.gameMap;
      if (!player || !gameMap) return;
      eventRunner.checkAndFireAt(player.x, player.y);
      eventRunner.recheckLocks();
      eventRunner.checkAutoEvents();
    };

    GameEvents.on(GAME_EVENT.PLAYER_MOVE_ENDED, checkEventTrigger);
    return () => GameEvents.off(GAME_EVENT.PLAYER_MOVE_ENDED, checkEventTrigger);
  }, []);

  // Once the map is ready: seed any never-before-touched flag/var from the
  // map's Switches & Variables registry (see QuestState.seedFromRegistry),
  // then check auto/parallel events so one whose preconditions are already
  // satisfied (possibly BY that seeding) fires immediately without requiring
  // the player to move or touch their inventory first.
  useEffect(() => {
    if (!isInitialized) return;
    engine.questState?.seedFromRegistry(engine.gameMap?.metadata?.questRegistry);
    eventRunner.checkAutoEvents();
  }, [isInitialized]);

  useEffect(() => {
    console.log('[GameContext] 🏗️ CHECKING FOR EXISTING INITIALIZATION MANAGER...');

    // SINGLETON PATTERN: Prevent multiple initialization managers
    if (initManagerRef.current) {
      console.warn('[GameContext] ⚠️ GameInitializationManager already exists, skipping creation');
      console.log('[GameContext] - Existing manager instance ID:', initManagerRef.current.instanceId);
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
        updatePlayerFieldOfView(engine.gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange(), isNightVisionActual);
      }
      if (typeof updatePlayerCardinalPositions === 'function') {
        updatePlayerCardinalPositions(engine.gameMap);
      }

      // Mark as fully ready
      setContextSyncPhase('ready');
      console.log('[GameContext] Initialization fully complete - all contexts ready for operations');
    }
  }, [contextSyncPhase, updatePlayerFieldOfView, updatePlayerCardinalPositions, isNight, isFlashlightOnActual, getActiveFlashlightRange]);

  // Apply a fully-deserialized save state to the engine + React UI. Shared by the
  // direct-load paths (loadGameFromStateData / loadGameDirect), which differ only
  // in where the state comes from and whether they fire the 'game-loaded' event.
  const applyLoadedState = useCallback((loadedState, { dispatchGameLoaded = false } = {}) => {
    // Sync ALL engine state atomically from the loaded save
    turnManager.cancelPlayback();
    audioManager.stopAllSounds();
    engine.sync(loadedState);

    setTurn(loadedState.turn);
    setTurnPhase(loadedState.isPlayerTurn !== undefined ? (loadedState.isPlayerTurn ? 'PLAYER_TURN' : 'SIMULATING') : 'PLAYER_TURN');
    setIsGameReady(true);
    setIsAutosaving(false);
    setIsDefeated(false);
    lastSeenTaggedTilesRef.current = loadedState.lastSeenTaggedTiles || new Set();

    // Set camera world bounds and recenter on loaded player position
    if (loadedState.camera && loadedState.player && loadedState.gameMap) {
      loadedState.camera.setWorldBounds(loadedState.gameMap.width, loadedState.gameMap.height);
      loadedState.camera.centerOn(loadedState.player.x, loadedState.player.y);
    }

    // Set up player event listeners and update derived state
    setupPlayerEventListeners();
    attachInventorySyncListener(loadedState.player, loadedState.inventoryManager);

    // Calculate isNight for the loaded turn
    const loadedHour = getHourFromTurn(loadedState.turn);
    const loadedIsNight = loadedHour >= 20 || loadedHour < 6;

    // Restore flashlight state
    const isFlashlightOnLoaded = loadedState.interactionState?.isFlashlightOn || false;
    setIsFlashlightOn(isFlashlightOnLoaded);

    const fl = loadedState.inventoryManager?.equipment['flashlight'];
    const isNVG = fl ? fl.lightType === 'nightvision' : false;
    const range = fl ? fl.lightRange || 8 : 8;

    updatePlayerFieldOfView(loadedState.gameMap, loadedIsNight, isFlashlightOnLoaded, false, range, isNVG);
    updatePlayerCardinalPositions(loadedState.gameMap);

    if (engine.zombieTracker && loadedState.player && loadedState.gameMap) {
      const initialFov = engine.playerFieldOfView || [];
      engine.zombieTracker.updateTracking(loadedState.gameMap, loadedState.player, initialFov);
      engine.zombieTracker._lastTrackedX = loadedState.player.x;
      engine.zombieTracker._lastTrackedY = loadedState.player.y;
    }

    // Open the UI gate
    setInitializationState('complete');
    setIsGameReady(true);
    console.log(`[GameContext] - Final player position: (${loadedState.player.x}, ${loadedState.player.y})`);
    console.log(`[GameContext] - Entities on map: ${loadedState.gameMap.getAllEntities().length}`);
    console.log(`[GameContext] - InventoryManager: ${loadedState.inventoryManager ? 'loaded' : 'missing'}`);

    // Dispatch event so that any open menus (like MainMenuWindow) can close
    if (dispatchGameLoaded) {
      window.dispatchEvent(new CustomEvent('game-loaded'));
    }
  }, [setupPlayerEventListeners, updatePlayerFieldOfView, updatePlayerCardinalPositions]);

  const loadGameFromStateData = useCallback(async (saveData) => {
    console.log('[GameContext] 🎮 STATE DATA LOAD - Skipping storage, loading save data directly...');
    resetAll();

    try {
      const loadedState = await GameSaveSystem.loadGameState(saveData);
      if (!loadedState) {
        console.warn(`[GameContext] ❌ Failed to deserialize save data`);
        return false;
      }

      console.log('[GameContext] ✅ Save data deserialized, applying state directly...');
      applyLoadedState(loadedState, { dispatchGameLoaded: true });
      logger.info('🎉 STATE DATA LOAD COMPLETE - Game ready without initialization');
      return true;
    } catch (error) {
      console.error('[GameContext] ❌ STATE DATA LOAD FAILED:', error);
      return false;
    }
  }, [applyLoadedState, resetAll]);

  const loadGameDirect = useCallback(async (slotName = 'autosave') => {
    console.log('[GameContext] 🎮 DIRECT LOAD - Skipping initialization, loading save directly...');
    resetAll();

    try {
      const loadedState = await GameSaveSystem.loadFromStorage(slotName);
      if (!loadedState) {
        console.warn(`[GameContext] ❌ No save found in slot: ${slotName}`);
        return false; // Let caller decide whether to fallback to new game
      }

      console.log('[GameContext] ✅ Save file found, applying state directly...');
      applyLoadedState(loadedState, { dispatchGameLoaded: false });
      logger.info('🎉 DIRECT LOAD COMPLETE - Game ready without initialization');
      return true;
    } catch (error) {
      console.error('[GameContext] ❌ DIRECT LOAD FAILED:', error);
      return false;
    }
  }, [applyLoadedState, resetAll]);

  const loadGame = useCallback(async (slotName = 'quicksave') => {
    resetAll();
    try {
      const loadedState = await GameSaveSystem.loadFromStorage(slotName);
      if (!loadedState) {
        console.warn(`[GameContext] No save found in slot: ${slotName}`);
        return false;
      }
      console.log('[GameContext] Applying loaded state...');

      // Atomic engine sync
      turnManager.cancelPlayback();
      audioManager.stopAllSounds();
      engine.sync(loadedState);
      
      setTurn(loadedState.turn);
      setTurnPhase(loadedState.interactionState?.isPlayerTurn !== undefined ? (loadedState.interactionState.isPlayerTurn ? 'PLAYER_TURN' : 'SIMULATING') : 'PLAYER_TURN');
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
      const loadedHour = getHourFromTurn(loadedState.turn);
      const loadedIsNight = loadedHour >= 20 || loadedHour < 6;

      // Restore flashlight state
      const isFlashlightOnLoaded = loadedState.interactionState?.isFlashlightOn || false;
      setIsFlashlightOn(isFlashlightOnLoaded);

      const fl = loadedState.inventoryManager?.equipment['flashlight'];
      const isNVG = fl ? fl.lightType === 'nightvision' : false;
      const range = fl ? fl.lightRange || 8 : 8;

      // Update derived player state
      updatePlayerFieldOfView(loadedState.gameMap, loadedIsNight, isFlashlightOnLoaded, false, range, isNVG);
      updatePlayerCardinalPositions(loadedState.gameMap);
      
      if (engine.zombieTracker && loadedState.player && loadedState.gameMap) {
        const initialFov = engine.playerFieldOfView || [];
        engine.zombieTracker.updateTracking(loadedState.gameMap, loadedState.player, initialFov);
        engine.zombieTracker._lastTrackedX = loadedState.player.x;
        engine.zombieTracker._lastTrackedY = loadedState.player.y;
      }
 
      console.log(`[GameContext] Game loaded successfully from slot: ${slotName}`);
      console.log(`[GameContext] Player position after load: (${loadedState.player.x}, ${loadedState.player.y})`);

      return true;
    } catch (error) {
      console.error('[GameContext] Failed to load game:', error);
      return false;
    }
  }, [setupPlayerEventListeners, updatePlayerFieldOfView, updatePlayerCardinalPositions, resetAll]);

  const initializeGame = useCallback(async (config = null) => {
    console.log('[GameContext] 🎮 initializeGame called with config:', !!config);
    resetAll();
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
      turnManager.cancelPlayback();
      audioManager.stopAllSounds();
      engine.reset();
      eventRunner.reset();

      setInitializationState('idle');
      wireManagerEvents(initManagerRef.current, runIdRef.current);
    }

    setIsDefeated(false);
    setIsPlayerTurn(true);
    setIsAnimatingZombies(false);
    setIsFlashlightOn(false);
    // Clear any lingering turn-processing flag so a turn that was in flight when
    // the previous game ended can't leave the End Turn button disabled.
    isProcessingTurnRef.current = false;
    setIsProcessingTurn(false);
    console.log(`[GameContext] Starting new game initialization (run ${runIdRef.current})...`);
    setInitializationError(null);
    setContextSyncPhase('idle'); // Reset sync phase for new initialization
    setTurn(1); // Reset turn counter to 1 for new game (06:00 start)
    clearLogs(); // Clear log from previous game

    // Character Creator interception
    let chosenStats = config && config.customStats !== undefined ? config.customStats : null;
    if (chosenStats === null) {
      setShowCharacterCreator(true);
      try {
        chosenStats = await new Promise((resolve, reject) => {
          characterCreatorResolveRef.current = { resolve, reject };
        });
      } catch (err) {
        console.log('[GameContext] Character creation cancelled.');
        setShowCharacterCreator(false);
        return false;
      }
      setShowCharacterCreator(false);
    }

    // Generate persistent ID if not present
    if (chosenStats && !chosenStats.id) {
      chosenStats.id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : 'char_' + Math.random().toString(36).substring(2, 15);
    }

    // Easy Start difficulty selection interception
    let chosenEasyStart = config && config.easyStart !== undefined ? config.easyStart : null;
    
    if (chosenEasyStart === null) {
      setShowDifficultySelect(true);
      chosenEasyStart = await new Promise((resolve) => {
        difficultyResolveRef.current = resolve;
      });
      setShowDifficultySelect(false);
    }

    const finalConfig = { ...config, easyStart: chosenEasyStart, customStats: chosenStats };
    noAutosaveRef.current = !!finalConfig.scenarioData?.noAutosave;

    const success = await initManagerRef.current.startInitialization(null, finalConfig);
    if (!success) {
      const error = initManagerRef.current.getError();
      setInitializationError(error || 'Unknown initialization error');
      return false;
    }

    return true;
  }, [wireManagerEvents, resetAll]);



  useEffect(() => {
    const handleDemand = (data) => {
      setActiveNpcDemand(data);
    };
    GameEvents.on(GAME_EVENT.NPC_DEMAND_TRIGGERED, handleDemand);
    return () => GameEvents.off(GAME_EVENT.NPC_DEMAND_TRIGGERED, handleDemand);
  }, []);

  // Decoupled Console Bridge: Listen for launch commands from the root UI layer
  useEffect(() => {
    const handleLaunch = (e) => {
      console.log('[GameContext] 🛰️ Global launch-custom-game event received. Config:', !!e.detail);
      initializeGame(e.detail);
    };

    window.addEventListener('launch-custom-game', handleLaunch);
    return () => window.removeEventListener('launch-custom-game', handleLaunch);
  }, [initializeGame]);








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
    updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange(), isNightVisionActual);
    return spawnedCount;
  }, [updatePlayerFieldOfView, isNight, isFlashlightOnActual, getActiveFlashlightRange]);

  const saveGame = useCallback(async (slotName = 'quicksave') => {
    if (!isInitialized) {
      console.warn('[GameContext] Cannot save - game not initialized');
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
        playerStats: {
          hp: engine.player?.hp || 100,
          maxHp: engine.player?.maxHp || 100,
          ap: engine.player?.ap || 12,
          maxAp: engine.player?.maxAp || 12,
          nutrition: engine.player?.nutrition || 25,
          maxNutrition: engine.player?.maxNutrition || 25,
          hydration: engine.player?.hydration || 25,
          maxHydration: engine.player?.maxHydration || 25,
          energy: engine.player?.energy || 25,
          maxEnergy: engine.player?.maxEnergy || 25,
          ammo: 0
        }
      };
      const success = await GameSaveSystem.saveToStorage(currentGameState, slotName);
      if (success) {
        console.log(`[GameContext] Game saved successfully to slot: ${slotName}`);
        let slotLabel = slotName;
        if (slotName === 'manual_1') slotLabel = 'Manual Slot 1';
        else if (slotName === 'manual_2') slotLabel = 'Manual Slot 2';
        else if (slotName === 'autosave') slotLabel = 'Autosave Slot 1';
        else if (slotName === 'autosave_backup') slotLabel = 'Autosave Backup Slot 2';

        toast({
          title: "Game Saved",
          description: `Game manually saved to ${slotLabel} at turn ${turn}.`,
          duration: 2000
        });
      } else {
        toast({
          title: "Save Failed",
          description: "Failed to save game. Please check the console for details.",
          variant: "destructive"
        });
      }
      return success;
    } catch (error) {
      console.error('[GameContext] Failed to save game:', error);
      return false;
    }
  }, [isInitialized, turn, inventoryManager]);

  const loadAutosave = useCallback(async () => {
    return await loadGame('autosave');
  }, [loadGame]);

  const exportGame = useCallback((filename) => {
    if (!isInitialized) {
      console.warn('[GameContext] Cannot export - game not initialized');
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

  const getSerializedSaveData = useCallback(() => {
    if (!isInitialized) {
      console.warn('[GameContext] Cannot serialize - game not initialized');
      return null;
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
      const saveData = GameSaveSystem.saveGameState(currentGameState);
      return JSON.stringify(saveData, null, 2);
    } catch (error) {
      console.error('[GameContext] Failed to serialize game state:', error);
      return null;
    }
  }, [isInitialized, turn, inventoryManager]);

  // ==========================================================
  // TURN SYSTEM ORCHESTRATION & RECOVERY
  // ==========================================================

  // Turn State Watchdog: If stuck in SIMULATING or ANIMATING for too long, reset to PLAYER_TURN
  useEffect(() => {
    if (turnPhase === 'SIMULATING' || turnPhase === 'ANIMATING') {
      const timeoutId = setTimeout(() => {
        console.warn(`[GameContext] 🚨 TURN WATCHDOG TRIGGERED: Stuck in ${turnPhase} for 10s. Forcing recovery.`);
        setTurnPhase('PLAYER_TURN');
        setIsAnimatingZombies(false);
      }, 10000);
      return () => clearTimeout(timeoutId);
    }
  }, [turnPhase]);

  // Wrapper methods for map transitions that include player context functions
  const handleMapTransitionConfirmWrapper = useCallback(async (selectedPrizeId) => {
    console.log('[GameContext] Map transition confirmation wrapper called', selectedPrizeId);
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
    const success = await mapTransitionConfirm(engine.player, updatePlayerCardinalPositions, cancelMovement, cameraOperations, inventoryManager, turn, selectedPrizeId);

    if (success) {
      // The new map may define registry flags/vars never touched before —
      // seed them, then re-check auto/parallel events in case seeding just
      // satisfied one's preconditions.
      engine.questState?.seedFromRegistry(engine.gameMap?.metadata?.questRegistry);
      eventRunner.checkAutoEvents();

      // Update PlayerContext data after successful transition (no timer)
      updatePlayerFieldOfView(engine.gameMap, isNight, isFlashlightOn, false, getActiveFlashlightRange(), isNightVisionActual);
      updatePlayerCardinalPositions(engine.gameMap);
      console.log('[GameContext] Player FOV and cardinal positions updated after map transition');
    }

    return success;
  }, [mapTransitionConfirm, updatePlayerFieldOfView, updatePlayerCardinalPositions, cancelMovement, setCameraWorldBounds, inventoryManager, isNight, isFlashlightOn, getActiveFlashlightRange, isNightVisionActual]);

  const shutdownGame = useCallback(() => {
    console.log('[GameContext] 🔌 shutdownGame requested - resetting states and engine');

    // Invalidate any ongoing async runs
    runIdRef.current += 1;

    // Stop playback, music, and all sounds
    turnManager.cancelPlayback();
    audioManager.stopAllSounds();
    if (musicManager && typeof musicManager.stop === 'function') {
      musicManager.stop();
    }

    // Reset game initialization manager
    if (initManagerRef.current && typeof initManagerRef.current.reset === 'function') {
      initManagerRef.current.reset();
    }

    // Manager.reset() strips all event listeners, so re-wire them for the new
    // run before the manager is used again by a subsequent initializeGame() call.
    if (initManagerRef.current) {
      wireManagerEvents(initManagerRef.current, runIdRef.current);
    }

    // Reset core engine state
    engine.reset();

    // Reset local state variables
    setIsGameReady(false);
    setInitializationState('idle');
    setInitializationError(null);
    setIsDefeated(false);
    setIsPlayerTurn(true);
    setIsAnimatingZombies(false);
    setIsFlashlightOn(false);
    isProcessingTurnRef.current = false;
    setIsProcessingTurn(false);
    setContextSyncPhase('idle');
    setIsSkillsOpen(false);
    setActiveNpcDemand(null);
    eventRunner.reset();
    setShowDifficultySelect(false);
    setShowCharacterCreator(false);
    if (typeof handleMapTransitionCancel === 'function') {
      handleMapTransitionCancel();
    }

    // Clear all active overlays
    resetAll();

    // Dispatch global event for GameScreen to show the start menu
    window.dispatchEvent(new CustomEvent('game-shutdown'));
  }, [resetAll, wireManagerEvents, handleMapTransitionCancel]);

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
    setIsAnimatingZombies,
    isSkillsOpen,
    toggleSkills,
    isModalBlocking,
    engine,
    enginePulse,
    turnPhase,
    setTurnPhase,

    // Orchestration functions only
    initializeGame,
    endTurn,
    spawnTestEntities,
    spawnInitialZombies,
    shutdownGame,
    showCharacterCreator,
    resolveCharacterCreator,
    cancelCharacterCreator,

    // Save/Load orchestration
    saveGame,
    loadGame,
    loadGameDirect,
    loadGameFromStateData,
    loadAutosave,
    performAutosave,
    enableAutosave: () => { noAutosaveRef.current = false; },
    exportGame,
    getSerializedSaveData,

    // Map transition components
    mapTransition,
    handleMapTransitionConfirmWrapper,
    handleMapTransitionCancel,

    checkZombieAwareness,
    animateVisibleNPCs,
    isFlashlightOnActual,
    isNightVisionActual,
    // Stable ref (identity never changes) bumped on every new-game/restart.
    // Lets long-running async loops that capture engine.player/engine.gameMap
    // once (e.g. SleepContext.performSleep) detect a mid-flight new game and
    // stop applying their stale results to the live engine.
    runIdRef,
    getActiveFlashlightRange,
    clearNPCAnimations,

    // Phase 5A: Expose inventoryManager for InventoryProvider
    inventoryManager,

    isDefeated,
    setIsDefeated,
    isProcessingTurn,

    // Internal refs for debugging
    lastSeenTaggedTiles: lastSeenTaggedTilesRef.current,
    
    // NPC Demand System
    activeNpcDemand,
    handleNpcDemandResponse,

    // Dialog System
    activeDialog,
    handleDialogDismiss,
    fireDialogAtPlayerTile,
    enableAutosave: () => { noAutosaveRef.current = false; },
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
    setIsAnimatingZombies,
    isSkillsOpen,
    toggleSkills,
    isModalBlocking,
    activeNpcDemand,
    handleNpcDemandResponse,
    enginePulse,
    turnPhase,
    setTurnPhase,
    initializeGame,
    endTurn,
    showCharacterCreator,
    resolveCharacterCreator,
    cancelCharacterCreator,
    spawnTestEntities,
    spawnInitialZombies,
    shutdownGame,
    saveGame,
    loadGame,
    loadGameDirect,
    loadGameFromStateData,
    loadAutosave,
    checkZombieAwareness,
    animateVisibleNPCs,
    clearNPCAnimations,
    isFlashlightOnActual,
    isNightVisionActual,
    getActiveFlashlightRange,
    mapTransition,
    handleMapTransitionConfirmWrapper,
    handleMapTransitionCancel,
    isDefeated,
    setIsDefeated,
    isProcessingTurn,
    activeDialog,
    handleDialogDismiss,
    fireDialogAtPlayerTile
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
      {showDifficultySelect && (
        <StartModeDialog
          onSelect={(choice) => {
            if (difficultyResolveRef.current) {
              difficultyResolveRef.current(choice);
            }
          }}
        />
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
