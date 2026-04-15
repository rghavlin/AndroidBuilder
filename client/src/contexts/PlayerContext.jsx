import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { LineOfSight } from '../game/utils/LineOfSight.js';
import { ScentTrail } from '../game/utils/ScentTrail.js';
import Logger from '../game/utils/Logger.js';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';
import engine from '../game/GameEngine.js';

const logger = Logger.scope('PlayerContext');

const PlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[usePlayer] Context not available during hot reload, providing fallback');
      return {
        player: null,
        playerStats: { 
          hp: 20, maxHp: 20, ap: 12, maxAp: 12, ammo: 0, 
          nutrition: 25, maxNutrition: 25, hydration: 25, maxHydration: 25, 
          energy: 25, maxEnergy: 25, condition: 'Normal', isBleeding: false,
          meleeKills: 0, meleeLvl: 0, rangedKills: 0, rangedLvl: 0,
          craftingApUsed: 0, craftingLvl: 0
        },
        isMoving: false,
        movementPath: [],
        movementProgress: 0,
        playerFieldOfView: null,
        playerRenderPosition: { x: 0, y: 0 },
        setPlayerRef: () => { },
        setPlayer: () => { },
        setPlayerPosition: () => { },
        updatePlayerStats: () => { },
        startAnimatedMovement: () => { },
        updatePlayerFieldOfView: () => { },
        updatePlayerCardinalPositions: () => { },
        setupPlayerEventListeners: () => { },
        getPlayerCardinalPositions: () => []
      };
    }
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  // Bridge to engine singleton
  const playerRef = useRef(engine.player);

  // Logic Migrated to GameEngine: playerRef moved to engine.player
  const enginePulse = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getSnapshot()
  );
  const initializedRef = useRef(false);
  
  const [isMoving, setIsMoving] = useState(false);
  const isMovingRef = useRef(false);
  const [movementPath, setMovementPath] = useState([]);
  const [movementProgress, setMovementProgress] = useState(0);
  const [playerFieldOfView, setPlayerFieldOfView] = useState(null);
  const [playerCardinalPositions, setPlayerCardinalPositions] = useState([]);

  // Phase 3: Single source of truth for stats
  const playerStats = useMemo(() => {
    const player = engine.player;
    if (!player) return {
      hp: 20, maxHp: 20, ap: 12, maxAp: 12, ammo: 0, 
      nutrition: 25, maxNutrition: 25, hydration: 25, maxHydration: 25, 
      energy: 25, maxEnergy: 25, condition: 'Normal', isBleeding: false,
      meleeKills: 0, meleeLvl: 0, rangedKills: 0, rangedLvl: 0,
      craftingApUsed: 0, craftingLvl: 0
    };

    return {
      hp: player.hp,
      maxHp: player.maxHp,
      ap: player.ap,
      maxAp: player.maxAp,
      nutrition: player.nutrition,
      maxNutrition: player.maxNutrition,
      hydration: player.hydration,
      maxHydration: player.maxHydration,
      energy: player.energy,
      maxEnergy: player.maxEnergy,
      condition: player.condition,
      isBleeding: player.isBleeding,
      meleeKills: player.meleeKills,
      meleeLvl: player.meleeLvl,
      rangedKills: player.rangedKills,
      rangedLvl: player.rangedLvl,
      craftingApUsed: player.craftingApUsed,
      craftingLvl: player.craftingLvl,
      ammo: 0 // Legacy
    };
  }, [enginePulse]);

  // Sync ref whenever engine updates
  useEffect(() => {
    playerRef.current = engine.player;
  }, [enginePulse]);
  
  // Monitor heartbeat in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && enginePulse > 0) {
      console.log(`[PlayerContext] 💓 Heartbeat #${enginePulse} - Stats: AP ${engine.player?.ap}, HP ${engine.player?.hp}`);
    }
  }, [enginePulse]);

  // Update position (Legacy compatibility for map transitions)
  const setPlayerPosition = useCallback((x, y) => {
    if (engine.player) {
      engine.player.x = x;
      engine.player.y = y;
      engine.notifyUpdate();
    }
  }, []);

  /**
   * Record a kill for a specific weapon type and handle leveling
   * Logic moved to Player.js class.
   */
  const recordKill = useCallback((type) => {
    if (!engine.player) return null;
    const result = engine.player.recordKill(type);
    engine.notifyUpdate();
    return result;
  }, []);

  // Calculate and cache player cardinal positions
  const updatePlayerCardinalPositions = useCallback((gameMap) => {
    if (!engine.player || !gameMap) return;

    const player = engine.player;
    const positions = [
      { x: player.x + 1, y: player.y, direction: 'right' },
      { x: player.x - 1, y: player.y, direction: 'left' },
      { x: player.x, y: player.y + 1, direction: 'down' },
      { x: player.x, y: player.y - 1, direction: 'up' }
    ].map(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      const isPassable = tile && !tile.contents.some(e => e.blocksMovement) &&
        !['wall', 'building', 'fence', 'tree'].includes(tile.terrain);
      const hasZombie = tile && tile.contents.some(e => e.type === 'zombie');
      const zombieId = hasZombie ? tile.contents.find(e => e.type === 'zombie')?.id : null;

      return {
        ...pos,
        isPassable,
        hasZombie,
        zombieId,
        priority: isPassable ? (hasZombie ? 2 : 1) : 3
      };
    }).sort((a, b) => a.priority - b.priority);

    setPlayerCardinalPositions(positions);
  }, []);

  // Get player cardinal positions
  const getPlayerCardinalPositions = useCallback(() => playerCardinalPositions, [playerCardinalPositions]);

  // Update player field of view
  const updatePlayerFieldOfView = useCallback((gameMap, isNight = false, isFlashlightOn = false, isAimingWithScope = false, flashlightRange = 8, isNightVision = false) => {
    if (!gameMap || !engine.player) {
      setPlayerFieldOfView([]);
      return [];
    }

    try {
      const player = engine.player;
      
      // MOVEMENT LOCK: If player is currently animating movement, the animation loop handles FOV updates.
      // We skip the redundant turn-based update here to prevent "flickering" between floor/round positions.
      if (isMovingRef.current && !gameMap._forcedFovUpdate) {
        return engine.playerFieldOfView || [];
      }

      const flooredPlayer = {
        x: Math.round(player.x),
        y: Math.round(player.y),
        id: player.id,
        sightRange: player.sightRange
      };
      
      let maxRange = isNight ? (isFlashlightOn ? (flashlightRange) : 1.5) : 15;
      
      // Phase NVG: Night Vision range override
      if (isFlashlightOn && isNightVision) {
          if (isNight) {
              maxRange = 15; // Full day range at night
          } else {
              maxRange = 0.5; // Blinded during day
          }
      }

      // Scope Visibility restriction
      if (isAimingWithScope) {
          const canSeeThroughScope = !isNight || (isFlashlightOn && isNightVision);
          if (canSeeThroughScope) {
              maxRange = 20;
          }
      }

      // Sync vision parameters to engine for frame-by-frame movement recalculation
      engine.setFOVOptions({ 
        isNight, 
        isFlashlightOn, 
        isAimingWithScope, 
        flashlightRange,
        isNightVision,
        maxRange: 15 // Default daylight range
      });

      const fovData = LineOfSight.calculateFieldOfView(gameMap, flooredPlayer, {
        maxRange,
        ignoreTerrain: [],
        ignoreEntities: [player.id]
      });

      setPlayerFieldOfView(fovData.visibleTiles);

      // Sync to engine for persistent/background systems
      engine.playerFieldOfView = fovData.visibleTiles;

      // Mark tiles as explored
      fovData.visibleTiles.forEach(pos => {
        const tile = gameMap.getTile(pos.x, pos.y);
        if (tile) tile.flags.explored = true;
      });

      return fovData.visibleTiles;
    } catch (error) {
      console.error('[PlayerContext] FOV calculation error:', error);
      return [];
    }
  }, []);

  // Smooth animation function
  const smoothAnimateMovement = useCallback((gameMap, camera, path, startTime, duration = 1500, isNight = false, isFlashlightOn = false, flashlightRange = 8, onComplete = null, isNightVision = false) => {
    if (!engine.player || !gameMap || !camera) {
      setIsMoving(false);
      isMovingRef.current = false;
      return;
    }

    const originalPosition = { x: engine.player.x, y: engine.player.y };
    let animationFrameId;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const pathProgress = easeProgress * (path.length - 1);
      const segIdx = Math.floor(pathProgress);
      const segProg = pathProgress - segIdx;

      const curr = path[segIdx];
      const next = path[Math.min(segIdx + 1, path.length - 1)];

      const smoothX = curr.x + (next.x - curr.x) * segProg;
      const smoothY = curr.y + (next.y - curr.y) * segProg;

      setMovementProgress(easeProgress);
      camera.centerOn(smoothX, smoothY);

      // Real-time FOV/LOS updates during movement (60fps Local State)
      // This ensures vision moves perfectly with the sprite without engine/react pulse lag
      const smoothPlayer = { x: Math.round(smoothX), y: Math.round(smoothY), id: engine.player.id };
      let maxRange = isNight ? (isFlashlightOn ? (isNightVision ? 15 : flashlightRange) : 1.5) : (isFlashlightOn && isNightVision ? 0.5 : 15);
      
      // Note: Smooth animation doesn't typicaly have isAimingWithScope passed in currently, 
      // but if we ever add it, it should follow the same rules as updatePlayerFieldOfView.
      // For now we keep it consistent with the base range calculation.

      const fov = LineOfSight.calculateFieldOfView(gameMap, smoothPlayer, { maxRange, ignoreTerrain: [], ignoreEntities: [engine.player.id] });
      setPlayerFieldOfView(fov.visibleTiles);
      
      // Alert nearby zombies
      gameMap.getEntitiesByType('zombie').forEach(z => {
          if (z.canSeeEntity(gameMap, smoothPlayer)) {
              if (!z.isAlerted) {
                  z.isAlerted = true;
                  GameEvents.emit(GAME_EVENT.ZOMBIE_ALERTED, { zombie: z });
              }
              z.setTargetSighted(smoothPlayer.x, smoothPlayer.y);
          }
      });

      fov.visibleTiles.forEach(p => {
        const t = gameMap.getTile(p.x, p.y);
        if (t) t.flags.explored = true;
      });


      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Complete
        const final = path[path.length - 1];
        const start = path[0];

        // Phase 12 Fix: Sync ground loot BEFORE physically moving entity in engine.
        if (engine.inventoryManager) {
            engine.inventoryManager.syncWithMap(start.x, start.y, final.x, final.y, gameMap);
        }

        // Final snap
        if (engine.gameMap && engine.player) {
           engine.gameMap.moveEntity(engine.player.id, final.x, final.y);
           path.forEach((pos, idx) => { if (idx > 0) ScentTrail.dropScent(gameMap, pos.x, pos.y, 3); });
        }

        // Release lock before final snap so updatePlayerFieldOfView isn't blocked
        setIsMoving(false);
        isMovingRef.current = false;

        updatePlayerFieldOfView(gameMap, isNight, isFlashlightOn, false, flashlightRange, isNightVision);
        updatePlayerCardinalPositions(gameMap);
        
        setMovementPath([]);
        setMovementProgress(0);
        GameEvents.emit(GAME_EVENT.PLAYER_MOVE_ENDED);
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [updatePlayerFieldOfView, updatePlayerCardinalPositions]);

  const startAnimatedMovement = useCallback((gameMap, camera, path, cost, isNight = false, isFlashlightOn = false, flashlightRange = 8, isNightVision = false) => {
    if (!engine.player || !gameMap || !camera) return;
    if (isMovingRef.current) {
        console.debug('[PlayerContext] Rejecting movement: already moving');
        return;
    }
    
    
    engine.player.useAP(cost);
    
    // Prime vision at the start position before locking
    updatePlayerFieldOfView(gameMap, isNight, isFlashlightOn, false, flashlightRange, isNightVision);

    setIsMoving(true);
    isMovingRef.current = true;
    setMovementPath(path);
    setMovementProgress(0);
    camera.centerOn(path[0].x, path[0].y);
    GameEvents.emit(GAME_EVENT.PLAYER_MOVE, { start: true });
    smoothAnimateMovement(gameMap, camera, path, performance.now(), 1500, isNight, isFlashlightOn, flashlightRange, null, isNightVision);
  }, [smoothAnimateMovement]);

  const startAnimatedMovementAsync = useCallback((gameMap, camera, path, cost, isNight = false, isFlashlightOn = false, flashlightRange = 8, isNightVision = false) => {
    return new Promise((resolve) => {
      if (!engine.player) { resolve(); return; }
      startAnimatedMovement(gameMap, camera, path, cost, isNight, isFlashlightOn, flashlightRange, isNightVision);
      // approximation for async completion
      setTimeout(resolve, 1600); 
    });
  }, [startAnimatedMovement]);

  const playerRenderPosition = useMemo(() => {
    if (!isMoving || movementPath.length === 0 || !engine.player) {
      return engine.player ? { x: engine.player.x, y: engine.player.y } : { x: 0, y: 0 };
    }
    const pathProgress = movementProgress * (movementPath.length - 1);
    const segIdx = Math.floor(pathProgress);
    const segProg = pathProgress - segIdx;
    const curr = movementPath[segIdx];
    const next = movementPath[Math.min(segIdx + 1, movementPath.length - 1)];
    return {
      x: curr.x + (next.x - curr.x) * segProg,
      y: curr.y + (next.y - curr.y) * segProg
    };
  }, [isMoving, movementPath, movementProgress, enginePulse]);

  const contextValue = useMemo(() => ({
    player: engine.player,
    playerRef, // Static bridge ref
    playerStats,
    isMoving,
    movementPath,
    movementProgress,
    playerRenderPosition,
    playerFieldOfView,
    setPlayerPosition,
    startAnimatedMovement,
    startAnimatedMovementAsync,
    updatePlayerFieldOfView,
    updatePlayerCardinalPositions,
    getPlayerCardinalPositions,
    recordKill,
    // Legacy null placeholders to prevent crashes in other components
    setPlayerRef: () => {},
    setPlayer: () => {},
    updatePlayerStats: (stats) => {
      if (!engine.player) return;
      Object.keys(stats).forEach(key => {
        if (engine.player[key] !== undefined) {
          engine.player[key] = stats[key];
        }
      });
      engine.notifyUpdate();
    },
    setupPlayerEventListeners: () => {},
    cancelMovement: () => {}
   }), [enginePulse, playerStats, isMoving, movementPath, movementProgress, playerFieldOfView, playerCardinalPositions]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};