import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import engine from '../game/GameEngine.js';
import { useLog } from './LogContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import { usePlayer } from './PlayerContext.jsx';
import { useGameMap } from './GameMapContext.jsx';
import { useAudio } from './AudioContext.jsx';
import { Zombie } from '../game/entities/Zombie.js';
import { ZombieAI } from '../game/ai/ZombieAI.js';
import { RabbitAI } from '../game/ai/RabbitAI.js';
import { useGame } from './GameContext.jsx';
import { EntityType } from '../game/entities/Entity.js';
import { GameMap } from '../game/map/GameMap.js';

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
    isNight,
    isFlashlightOnActual,
    getActiveFlashlightRange
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
    if (reason) addLog(reason, 'warning');
  }, [addLog, setIsPlayerTurn]);

  const performSleep = useCallback(async (hours, energyMultiplier = 1, isResuming = false) => {
    const gameMap = engine.gameMap;
    const player = engine.player;
    // Phase 27 Fix: Allow resuming if already sleeping (bypassing isPlayerTurn check)
    if (!isInitialized || !player || !gameMap || (!isPlayerTurn && !isResuming)) return;

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
        const hpBeforeHour = player.hp;
        await new Promise(resolve => setTimeout(resolve, 1000));

        player.modifyStat('energy', 2.5 * energyMultiplier);
        player.modifyStat('nutrition', -1);
        player.modifyStat('hydration', -1);

        // Phase 27: Starvation/Dehydration HP penalties (consistent with endTurn)
        let survivalHpLoss = 0;
        if (player.nutrition <= 0) survivalHpLoss += 1;
        if (player.hydration <= 0) survivalHpLoss += 1;
        if (survivalHpLoss > 0) {
          player.takeDamage(survivalHpLoss, { id: 'survival', type: 'starvation' });
        }

        // Sickness recovery: sleep reduces remaining sickness turns
        if (player.sickness > 0) {
          player.sickness = Math.max(0, player.sickness - 1);
          if (player.sickness === 0) {
            player.condition = 'Normal';
            addLog('You are feeling much better after resting.', 'status');
          }
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
        gameMap.processTurn(player, true, currentTurn);
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
            }
          }
        }

        // NPC turns
        const zombies = gameMap.getEntitiesByType(EntityType.ZOMBIE);
        const rabbits = gameMap.getEntitiesByType(EntityType.RABBIT);
        const cardinalPos = getPlayerCardinalPositions();
        lastSeenTaggedTilesRef.current.clear();
        
        let noiseInterruption = false;
        let hitByZombie = false;

        zombies.forEach(zombie => {
          const turnResult = ZombieAI.executeZombieTurn(zombie, gameMap, player, cardinalPos, lastSeenTaggedTilesRef.current);
          if (turnResult.success) {
            turnResult.actions.forEach(action => {
              // WAKE ON NOISE: Banging/Smashing in the building shell
              if ((action.type === 'attackDoor' && action.doorPos) || (action.type === 'attackWindow' && action.windowPos)) {
                 const targetPos = action.doorPos || action.windowPos;
                 if (GameMap.isSameBuildingShell(gameMap, { x: player.x, y: player.y }, targetPos)) {
                    if (action.type === 'attackDoor') {
                      addLog(action.doorBroken ? 'Zombie breaks door!' : 'Zombie bangs door!', 'combat');
                    } else {
                      addLog('Zombie smashes a window!', 'combat');
                    }
                    noiseInterruption = true;
                 }
                 if (addEffect) {
                    addEffect({ type: 'damage', x: targetPos.x, y: targetPos.y, value: 'bang', color: '#ffffff', duration: 800 });
                 }
              } else if (action.type === 'attack' && action.target === 'player') {
                 // WAKE ON ATTACK: Targeted bites/swipes terminate sleep
                 addLog(`Zombie attacks while you sleep! ${action.damage} damage`, 'combat');
                 hitByZombie = true;
              }
            });
          }
        });

        // Rabbit turns
        rabbits.forEach(rabbit => RabbitAI.executeRabbitTurn(rabbit, gameMap, player, zombies));

        await animateVisibleNPCs([...zombies, ...rabbits], null);

        updatePlayerStats({
          hp: player.hp,
          energy: player.energy,
          nutrition: player.nutrition,
          hydration: player.hydration,
          isBleeding: player.isBleeding,
          condition: player.condition,
          sickness: player.sickness
        });

        // Phase 27: Death Guard - check if player died in their sleep
        if (player.hp <= 0) {
          wakePlayer('You collapsed from your injuries.');
          triggerMapUpdate();
          return;
        }

        // DIAGNOSTIC LOGGING: Helps track why sleep breaks if it ever happens again
        console.log(`[Sleep] Hour ${i+1}: HP ${hpBeforeHour.toFixed(1)} -> ${player.hp.toFixed(1)}, Noise: ${noiseInterruption}, Hit: ${hitByZombie}`);

        // FINAL INTERRUPTION CHECK: Active threats only
        let interruption = noiseInterruption || hitByZombie;
        let interruptionReason = noiseInterruption ? "Loud banging woke you up!" : "A zombie attack woke you up!";

        if (interruption) {
          wakePlayer(interruptionReason);
          updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
          updatePlayerCardinalPositions(gameMap);
          triggerMapUpdate();
          return;
        }
      }

      player.restoreAP(player.maxAp - player.ap);
      updatePlayerStats({ ap: player.ap });
      wakePlayer();
      
      const hour = (6 + (currentTurn - 1)) % 24;
      const finalIsNight = hour >= 20 || hour < 6;
      updatePlayerFieldOfView(gameMap, finalIsNight, isFlashlightOnActual);
      updatePlayerCardinalPositions(gameMap);
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
