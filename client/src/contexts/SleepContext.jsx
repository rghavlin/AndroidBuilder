import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import engine from '../game/GameEngine.js';
import { useLog } from './LogContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import { usePlayer } from './PlayerContext.jsx';
import { useGameMap } from './GameMapContext.jsx';
import { useAudio } from './AudioContext.jsx';
import { useGame } from './GameContext.jsx';
import { EntityType } from '../game/entities/Entity.js';
import { GameMap } from '../game/map/GameMap.js';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';
import { ItemTrait } from '../game/inventory/traits.js';
import { SimulationManager } from '../game/managers/SimulationManager.js';
import { getHourFromTurn } from '../game/utils/TimeUtils.js';
import { recalcCharacter, tickInfection } from '../game/utils/SurvivalCascade.js';

const SleepContext = createContext();

export const useSleep = () => {
  const context = useContext(SleepContext);
  if (!context) {
    throw new Error('useSleep must be used within a SleepProvider');
  }
  return context;
};

export const SleepProvider = ({ children }) => {
  const { 
    isInitialized, 
    turn, 
    setTurn, 
    isPlayerTurn, 
    setIsPlayerTurn, 
    performAutosave,
    animateVisibleNPCs,
    clearNPCAnimations,
    isNight,
    isFlashlightOnActual,
    getActiveFlashlightRange,
    runIdRef
  } = useGame();

  const { addLog } = useLog();
  const { addEffect } = useVisualEffects();
  const { updatePlayerStats, playerRef, updatePlayerFieldOfView, updatePlayerCardinalPositions, getPlayerCardinalPositions } = usePlayer();
  const { triggerMapUpdate } = useGameMap();
  const { playSound } = useAudio();

  const [isSleeping, setIsSleeping] = useState(engine.isSleeping || false);
  const [sleepProgress, setSleepProgress] = useState(engine.sleepProgress || 0);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [sleepMultiplier, setSleepMultiplier] = useState(1);

  const isResumingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Sync with engine when it changes (e.g. after load)
  useEffect(() => {
    const handleSync = () => {
      setIsSleeping(engine.isSleeping);
      setSleepProgress(engine.sleepProgress);
    };
    engine.on('sync', handleSync);
    return () => engine.off('sync', handleSync);
  }, []);

  const lastSeenTaggedTilesRef = useRef(new Set());
  const turnRef = useRef(turn);
  const isSleepingRef = useRef(isSleeping);

  // Keep refs in sync with props/state
  useEffect(() => { turnRef.current = turn; }, [turn]);
  useEffect(() => { isSleepingRef.current = isSleeping; }, [isSleeping]);

  const wakePlayer = useCallback((reason = null) => {
    engine.isSleeping = false;
    engine.sleepProgress = 0;
    setIsSleeping(false);
    setSleepProgress(0);
    setIsPlayerTurn(true);

    // Force sync visual states on wake-up to catch up any silent simulation changes
    const gameMap = engine.gameMap;
    if (gameMap && gameMap.entityMap) {
      gameMap.entityMap.forEach(e => {
        if (typeof e.syncVisualState === 'function') {
          e.syncVisualState();
        }
      });
    }

    if (reason) addLog(reason, 'warning');
  }, [addLog, setIsPlayerTurn]);

  const performSleep = useCallback(async (hours, energyMultiplier = 1, isResuming = false) => {
    const gameMap = engine.gameMap;
    const player = engine.player;
    // Phase 27 Fix: Allow resuming if already sleeping (bypassing isPlayerTurn check)
    if (!isInitialized || !player || !gameMap || (!isPlayerTurn && !isResuming)) return;

    // Snapshot the run this sleep belongs to. gameMap/player above are captured
    // once and reused every hour; if a new game starts mid-sleep (engine.reset()
    // + a fresh player/gameMap), this loop must stop touching the live engine
    // with this stale player's values instead of corrupting the new game.
    const runIdAtStart = runIdRef.current;

    try {
      isResumingRef.current = true;
      if (!isResuming) {
        engine.isSleeping = true;
        engine.sleepProgress = hours;
        setIsSleeping(true);
        setIsPlayerTurn(false);
        setSleepProgress(hours);
      }

      let currentTurn = turnRef.current;

      for (let i = 0; i < hours; i++) {
        // Phase 28 Fix: Allow cancellation if game is reset or player wakes up
        if (!engine.isSleeping || !mountedRef.current) break;

        const hpBeforeHour = player.hp;
        await new Promise(resolve => setTimeout(resolve, 1000));

        // A new game can start during the 1s wait above. Bail out (not just
        // break) so none of this stale hour's per-hour mutations below —
        // especially updatePlayerStats, which writes onto engine.player
        // directly — run against the freshly-initialized game's player.
        if (runIdRef.current !== runIdAtStart) {
          console.warn('[SleepContext] 🚫 performSleep resumed for a stale run; aborting.');
          return;
        }

        if (!mountedRef.current) break;

        player.modifyStat('energy', 2.5 * energyMultiplier);
        player.modifyStat('nutrition', -1);
        player.modifyStat('hydration', -1);
        recalcCharacter(player);

        // Phase 27: Starvation/Dehydration HP penalties (consistent with endTurn)
        if (player.nutrition <= 0) {
          player.takeDamage(1, { id: 'survival', type: 'starvation' });
        }
        if (player.hydration <= 0) {
          player.takeDamage(1, { id: 'survival', type: 'dehydration' });
        }

        // Sickness recovery: sleep reduces remaining sickness turns
        if (player.sickness > 0) {
          player.sickness = Math.max(0, player.sickness - 1);
          if (player.sickness === 0) {
            player.condition = 'Normal';
            addLog('You are feeling much better after resting.', 'status');
          }
        }

        // Tick infection/treatment hourly during sleep
        tickInfection(player, (msg, type) => addLog(msg, type));

        if (player.drunkenness > 0) {
          player.drunkenness = Math.max(0, player.drunkenness - 1);
        }

        // Suspended HP loss for sickness during sleep; heal only if healthy/normal
        if (player.nutrition > 0 && player.hydration > 0 && player.condition === 'Normal' && !player.isBleeding) {
          player.heal(0.5, true);
        }

        if (player.isBleeding) {
          // Damage continues but no longer causes interruption on its own
          player.takeDamage(1, { id: 'bleeding', type: 'status' });
        }

        currentTurn++;
        setTurn(currentTurn);
        
        engine.sleepProgress = Math.max(0, engine.sleepProgress - 1);
        setSleepProgress(engine.sleepProgress);

        const isPlayerOutdoors = !GameMap.isSheltered(gameMap, player.x, player.y);
        const cardinalPos = getPlayerCardinalPositions();
        const mapActions = gameMap.processTurn(
          player, 
          true, 
          currentTurn, 
          cardinalPos, 
          lastSeenTaggedTilesRef.current
        );
        const simActions = SimulationManager.runTurn(gameMap, {
          player,
          isSleeping: true,
          turn: currentTurn,
          playerCardinalPositions: cardinalPos,
          lastSeenTaggedTiles: lastSeenTaggedTilesRef.current
        });
        const hourlyActions = [...mapActions, ...simActions];
        lastSeenTaggedTilesRef.current.clear();
        
        engine.inventoryManager?.processTurn(currentTurn, isPlayerOutdoors);

        // Phase 25: Ensure weather updates while sleeping
        if (engine.weatherManager) {
          engine.weatherManager.update(currentTurn);
        }

        // Battery drain
        if (isFlashlightOnActual) {
          const flashlight = engine.inventoryManager?.equipment['flashlight'];
          if (flashlight) {
            const battery = typeof flashlight.getBattery === 'function' ? flashlight.getBattery() : null;
            if (battery && battery.ammoCount > 0) {
              battery.ammoCount = Math.max(0, battery.ammoCount - 1);
              if (battery.ammoCount === 0) {
                // Charges ran out! Turn off the flashlight/torch
                engine.isFlashlightOn = false;
                if (flashlight.hasTrait('ignitable') || (typeof flashlight.hasTrait === 'function' && flashlight.hasTrait(ItemTrait.IGNITABLE))) {
                  flashlight.isLit = false;
                }
                addLog(`${flashlight.name} has run out of power/burned out.`, 'warning');
                // Recalculate FOV immediately so that AI logic for subsequent hours behaves correctly
                const currentHour = getHourFromTurn(currentTurn);
                const finalIsNight = currentHour >= 20 || currentHour < 6;
                const isNVG = flashlight.lightType === 'nightvision';
                const range = flashlight.lightRange || 8;
                updatePlayerFieldOfView(gameMap, finalIsNight, false, false, range, isNVG);
              }
            } else {
              // It was already 0 but somehow still on?
              engine.isFlashlightOn = false;
              if (flashlight.hasTrait('ignitable') || (typeof flashlight.hasTrait === 'function' && flashlight.hasTrait(ItemTrait.IGNITABLE))) {
                flashlight.isLit = false;
              }
            }
          }
        }

        // Process hourly actions to detect sleep-interrupting events
        let noiseInterruption = false;
        let hitByZombie = false;
        let npcInterruption = false;

        hourlyActions.forEach(action => {
          const entity = gameMap.getEntity(action.entityId);

          if (action.type === 'STRUCTURE_INTERACT') {
            const targetPos = action.data.to;
            if (GameMap.isSameBuildingShell(gameMap, { x: player.x, y: player.y }, targetPos)) {
              if (action.data.targetType === 'door') {
                addLog(action.data.broken ? 'Zombie breaks door!' : 'Zombie bangs door!', 'combat');
                GameEvents.emit(action.data.broken ? GAME_EVENT.DOOR_BROKEN : GAME_EVENT.DOOR_BANG, action.data);
              } else {
                addLog('Zombie smashes a window!', 'combat');
                GameEvents.emit(GAME_EVENT.WINDOW_SMASH, action.data);
              }
              noiseInterruption = true;
            }
            if (addEffect) {
              addEffect({ type: 'damage', x: targetPos.x, y: targetPos.y, value: 'bang', color: '#ffffff', duration: 800 });
            }
          } else if (action.type === 'ATTACK' && action.data.targetType === 'player') {
            if (entity && (entity.type === EntityType.ZOMBIE)) {
              if (action.data.success) {
                player.takeDamage(action.data.damage, entity);
                // Mirror TurnManager's awake ATTACK handling: apply ALL afflictions.
                // Without these lines, a zombie that hits a sleeping player would
                // apply them when awake but not asleep.
                if (action.data.bleedingInflicted) player.setBleeding(true);
                if (action.data.sickInflicted) player.inflictSickness(24);
                if (action.data.infectionInflicted) player.inflictInfection();
                addLog(`Zombie attacks while you sleep! ${action.data.damage} damage`, 'combat');
              } else {
                addLog(`A zombie swipes at you and misses!`, 'combat');
              }
              GameEvents.emit(GAME_EVENT.ZOMBIE_ATTACK_RESULT, { success: action.data.success, zombieId: entity.id });
              hitByZombie = true;
            } else if (entity && (entity.type === EntityType.NPC)) {
              npcInterruption = true;
            }
          } else if (action.type === 'DEMAND') {
            if (entity && (entity.type === EntityType.NPC) && !entity.hasDemanded) {
              npcInterruption = true;
            }
          }
        });

        // Phase 28: Skip visual animations during sleep to prevent desyncs and performance lag
        // We still need to clear the movement paths set by the AI moveTo calls
        const zombies = gameMap.getEntitiesByType(EntityType.ZOMBIE || 'zombie');
        const rabbits = gameMap.getEntitiesByType(EntityType.RABBIT || 'rabbit');
        const npcs = gameMap.getEntitiesByType(EntityType.NPC || 'npc');
        clearNPCAnimations([...zombies, ...rabbits, ...npcs]);

        updatePlayerStats({
          hp: player.hp,
          energy: player.energy,
          nutrition: player.nutrition,
          hydration: player.hydration,
          isBleeding: player.isBleeding,
          isStarving: player.isStarving,
          isDehydrated: player.isDehydrated,
          condition: player.condition,
          sickness: player.sickness,
          drunkenness: player.drunkenness,
          isInfected: player.isInfected,
          infectionTicksRemaining: player.infectionTicksRemaining,
          treatmentTicksRemaining: player.treatmentTicksRemaining,
          treatmentSubtype: player.treatmentSubtype,
          treatmentColor: player.treatmentColor,
          treatmentName: player.treatmentName
        });

        // Phase 27: Death Guard - check if player died in their sleep
        if (player.hp <= 0) {
          const deathMsg = player.isInfected && player.infectionTicksRemaining <= 0
            ? 'You succumbed to the zombie virus.'
            : 'You collapsed from your injuries.';
          wakePlayer(deathMsg);
          triggerMapUpdate();
          return;
        }

        // DIAGNOSTIC LOGGING: Helps track why sleep breaks if it ever happens again
        console.log(`[Sleep] Hour ${i+1}: HP ${hpBeforeHour.toFixed(1)} -> ${player.hp.toFixed(1)}, Noise: ${noiseInterruption}, Hit: ${hitByZombie}, NPC: ${npcInterruption}`);

        // FINAL INTERRUPTION CHECK: Active threats only
        let interruption = noiseInterruption || hitByZombie || npcInterruption;
        let interruptionReason = npcInterruption ? "You were woken up by someone!" : (noiseInterruption ? "Loud banging woke you up!" : "A zombie attack woke you up!");

        if (interruption) {
          // Resume audio context on wake to ensure queued sounds (like bangs/smashes) play
          const audioCtx = engine.audioManager?.audioCtx;
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
          }

          wakePlayer(interruptionReason);
          
          // PHASE 28 FIX: Correct FOV parameters on wake
          const inv = engine.inventoryManager;
          const fl = inv?.equipment['flashlight'];
          const isNVG = fl?.lightType === 'nightvision';
          const range = fl?.lightRange || 8;
          
          updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, range, isNVG);
          updatePlayerCardinalPositions(gameMap);
          
          // Force immediate engine pulse to refresh all UI and renderer visibility sets
          engine.notifyUpdate();
          triggerMapUpdate();
          return;
        }
      }

      player.restoreAP(player.maxAp - player.ap);
      updatePlayerStats({ ap: player.ap });
      wakePlayer();
      
      const hour = getHourFromTurn(currentTurn);
      const finalIsNight = hour >= 20 || hour < 6;
      
      // Final FOV sync after full sleep
      const inv = engine.inventoryManager;
      const fl = inv?.equipment['flashlight'];
      const isNVG = fl?.lightType === 'nightvision';
      const range = fl?.lightRange || 8;
      updatePlayerFieldOfView(gameMap, finalIsNight, isFlashlightOnActual, false, range, isNVG);
      engine.notifyUpdate();
      triggerMapUpdate();

    } catch (error) {
      console.error('[SleepContext] Error during sleep:', error);
      wakePlayer();
    } finally {
      isResumingRef.current = false;
    }
  }, [isInitialized, isPlayerTurn, isNight, isFlashlightOnActual, getActiveFlashlightRange, wakePlayer, animateVisibleNPCs, addLog, addEffect, updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions, getPlayerCardinalPositions, performAutosave, setTurn, setIsPlayerTurn, triggerMapUpdate]);

  const triggerSleep = useCallback((multiplier = 1) => {
    setSleepMultiplier(multiplier);
    setIsSleepModalOpen(true);
  }, []);

  // Phase 27: Auto-resume sleep if loaded while sleeping
  useEffect(() => {
    if (isInitialized && engine.isSleeping && engine.sleepProgress > 0 && !isResumingRef.current) {
      console.log('[SleepContext] Detected sleep state after initialization, resuming loop...');
      isResumingRef.current = true;
      performSleep(engine.sleepProgress, 1, true).finally(() => {
        isResumingRef.current = false;
      });
    }
  }, [isInitialized, performSleep]);

  useEffect(() => {
    const handleShutdown = () => {
      setIsSleeping(false);
      setSleepProgress(0);
      setIsSleepModalOpen(false);
      setSleepMultiplier(1);
    };
    window.addEventListener('game-shutdown', handleShutdown);
    return () => window.removeEventListener('game-shutdown', handleShutdown);
  }, []);

  const value = {
    isSleeping,
    sleepProgress,
    isSleepModalOpen,
    setIsSleepModalOpen,
    sleepMultiplier,
    triggerSleep,
    performSleep
  };

  return (
    <SleepContext.Provider value={value}>
      {children}
    </SleepContext.Provider>
  );
};
