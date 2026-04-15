import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import engine from '../game/GameEngine.js';
import { useLog } from './LogContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import { usePlayer } from './PlayerContext.jsx';
import { useGameMap } from './GameMapContext.jsx';
import { useAudio } from './AudioContext.jsx';
import { Zombie } from '../game/entities/Zombie.js';
import { ZombieAI } from '../game/ai/ZombieAI.js';
import { useGame } from './GameContext.jsx';

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

  // Helper: check if player is sheltered (inside a building)
  const checkIsSheltered = useCallback((player, gameMap) => {
    if (!player || !gameMap) return false;

    const startTile = gameMap.getTile(player.x, player.y);
    // PHASE 15 Fix: Support tent_floor and transition (doorways) as sheltered terrain
    const isIndoorTerrain = startTile && (startTile.terrain === 'floor' || startTile.terrain === 'tent_floor' || startTile.terrain === 'transition');
    if (!isIndoorTerrain) return false;

    const queue = [{ x: player.x, y: player.y }];
    const visited = new Set([`${player.x},${player.y}`]);
    const maxCheckedTiles = 2000; // Expanded for large/sprawling player bases

    let head = 0;
    while (head < queue.length && queue.length < maxCheckedTiles) {
      const { x, y } = queue[head++];
      const neighbors = [{ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }];

      for (const next of neighbors) {
        const key = `${next.x},${next.y}`;
        if (visited.has(key)) continue;

        const tile = gameMap.getTile(next.x, next.y);
        if (!tile) continue;

        const door = tile.contents.find(e => e.type === 'door');
        const isClosedDoor = door && !door.isOpen;
        const window = tile.contents.find(e => e.type === 'window');
        const isClosedWindow = window && !window.isOpen && !window.isBroken;

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

        // PHASE 15 Fix: Support tent_floor and transition in shelter search
        const isIndoors = tile.terrain === 'floor' || tile.terrain === 'tent_floor' || tile.terrain === 'transition';
        if (!isIndoors || (tile.terrain === 'window' && !isClosedWindow)) {
          return false;
        }

        visited.add(key);
        queue.push(next);
      }
    }
    return true;
  }, []);

  const isPlayerInSameBuildingAsDoor = useCallback((playerPos, targetPos, gameMap) => {
    if (!playerPos || !targetPos || !gameMap) return false;

    const startTile = gameMap.getTile(playerPos.x, playerPos.y);
    const isIndoors = (tile) => tile && (tile.terrain === 'floor' || tile.terrain === 'tent_floor' || tile.terrain === 'transition' || tile.terrain === 'building');
    
    if (!isIndoors(startTile)) return false;

    // Phase 22: Manhattan distance check first - if it's too far, it's irrelevant for sleep noise
    const manhattanDist = Math.abs(playerPos.x - targetPos.x) + Math.abs(playerPos.y - targetPos.y);
    if (manhattanDist > 15) return false; 

    const queue = [{ x: playerPos.x, y: playerPos.y, dist: 0, closedDoors: 0 }];
    const visited = new Set([`${playerPos.x},${playerPos.y}`]);
    const maxDist = 30; // Search up to 30 tiles for building bounds

    while (queue.length > 0) {
      const { x, y, dist, closedDoors } = queue.shift();

      if (x === targetPos.x && y === targetPos.y) {
          // INTERRUPTION RULE: Noise only wakes player if it passes through 0 or 1 closed doors.
          // 2 or more closed doors (e.g. hallway door + bedroom door) provide complete insulation.
          return closedDoors <= 1;
      }
      
      if (dist >= maxDist) continue;
      if (closedDoors > 1) continue; // Optimization: Stop searching paths that are already too insulated

      const neighbors = [
        { x: x + 1, y: y }, { x: x - 1, y: y },
        { x: x, y: y + 1 }, { x: x, y: y - 1 }
      ];

      for (const next of neighbors) {
        const key = `${next.x},${next.y}`;
        if (visited.has(key)) continue;

        const tile = gameMap.getTile(next.x, next.y);
        const entity = gameMap.getEntityAt(next.x, next.y);
        const isWall = tile && tile.blocksMovement && !entity;
        
        // UNIFIED BUILDING SHELL: BFS passes through doors/windows to correctly identify the whole house
        // but stops at non-indoor terrain (grass/road) or walls.
        if (isWall || !isIndoors(tile)) {
          visited.add(key);
          continue;
        }

        // Phase 22: Insulation detection - Track how many closed doors we pass through
        let nextClosedDoors = closedDoors;
        const door = tile.contents.find(e => e.type === 'door');
        if (door && !door.isOpen) {
            nextClosedDoors++;
        }

        visited.add(key);
        queue.push({ ...next, dist: dist + 1, closedDoors: nextClosedDoors });
      }
    }

    return false;
  }, []);

  const performSleep = useCallback(async (hours, energyMultiplier = 1) => {
    const gameMap = engine.gameMap;
    const player = engine.player;
    if (!isInitialized || !player || !gameMap || !isPlayerTurn || isSleeping) return;

    try {
      engine.isSleeping = true;
      engine.sleepProgress = hours;
      setIsSleeping(true);
      setIsPlayerTurn(false);
      setSleepProgress(hours);

      let currentTurn = turn;

      for (let i = 0; i < hours; i++) {
        const hpBeforeHour = player.hp;
        await new Promise(resolve => setTimeout(resolve, 1000));

        player.modifyStat('energy', 2.5 * energyMultiplier);
        player.modifyStat('nutrition', -1);
        player.modifyStat('hydration', -1);

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
        engine.sleepProgress = prev => {
          const next = typeof prev === 'function' ? prev(engine.sleepProgress) : engine.sleepProgress - 1;
          return next;
        };
        setSleepProgress(prev => prev - 1);
        engine.sleepProgress = Math.max(0, engine.sleepProgress);

        gameMap.processTurn();
        engine.inventoryManager?.processTurn();

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
        const zombies = gameMap.getEntitiesByType('zombie');
        const rabbits = gameMap.getEntitiesByType('rabbit');
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
                 if (isPlayerInSameBuildingAsDoor({ x: player.x, y: player.y }, targetPos, gameMap)) {
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
        const { RabbitAI } = await import('../game/ai/RabbitAI.js');
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

        // DIAGNOSTIC LOGGING: Helps track why sleep breaks if it ever happens again
        console.log(`[Sleep] Hour ${i+1}: HP ${hpBeforeHour.toFixed(1)} -> ${player.hp.toFixed(1)}, Noise: ${noiseInterruption}, Hit: ${hitByZombie}`);

        // FINAL INTERRUPTION CHECK: Active threats only
        let interruption = noiseInterruption || hitByZombie;
        let interruptionReason = noiseInterruption ? "Loud banging woke you up!" : "A zombie attack woke you up!";

        if (interruption) {
          addLog(interruptionReason, 'warning');
          engine.isSleeping = false;
          engine.sleepProgress = 0;
          setIsSleeping(false);
          setSleepProgress(0);
          updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
          updatePlayerCardinalPositions(gameMap);
          setIsPlayerTurn(true);
          return;
        }
      }

      player.restoreAP(player.maxAp - player.ap);
      updatePlayerStats({ ap: player.ap });
      engine.isSleeping = false;
      engine.sleepProgress = 0;
      setIsSleeping(false);
      setIsPlayerTurn(true);
      setSleepProgress(0);
      
      const hour = (6 + (currentTurn - 1)) % 24;
      const finalIsNight = hour >= 20 || hour < 6;
      updatePlayerFieldOfView(gameMap, finalIsNight, isFlashlightOnActual);
      updatePlayerCardinalPositions(gameMap);
      await performAutosave();

    } catch (error) {
      console.error('[SleepContext] Error during sleep:', error);
      setIsSleeping(false);
      setIsPlayerTurn(true);
      setSleepProgress(0);
    }
  }, [isInitialized, isPlayerTurn, isSleeping, turn, isNight, isFlashlightOnActual, getActiveFlashlightRange, checkIsSheltered, isPlayerInSameBuildingAsDoor, animateVisibleNPCs, addLog, addEffect, updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions, getPlayerCardinalPositions, performAutosave, setTurn, setIsPlayerTurn]);

  const triggerSleep = useCallback((multiplier = 1) => {
    setSleepMultiplier(multiplier);
    setIsSleepModalOpen(true);
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
