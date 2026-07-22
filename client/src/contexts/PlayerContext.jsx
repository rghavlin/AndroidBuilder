import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { LineOfSight } from '../game/utils/LineOfSight.js';
import { ScentTrail } from '../game/utils/ScentTrail.js';
import { VehicleUtils } from '../game/utils/VehicleUtils.js';
import { AttributeProgressionManager } from '../game/systems/AttributeProgressionManager.js';
import { Pathfinding } from '../game/utils/Pathfinding.js';
import Logger from '../game/utils/Logger.js';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';
import engine from '../game/GameEngine.js';
import { EntityType } from '../game/entities/Entity.js';
import { ItemTrait } from '../game/inventory/traits.js';
import { isTurretPassableBy, TURRET_DEF_ID } from '../game/ai/TurretCombat.js';
import { isTerrainWalkable } from '../game/map/TerrainTypes.js';
import { MAX_VISION_RANGE } from '../game/config/VisionConfig.js';

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
          isStarving: false, isDehydrated: false,
          meleeHits: 0, meleeLvl: 0, rangedHits: 0, rangedLvl: 0,
          defenseHits: 0, defenseLvl: 0,
          craftingApUsed: 0, craftingLvl: 0,
          earbucks: 0,
          baseStrength: 20, currentStrength: 20,
          baseAgility: 20, currentAgility: 20,
          basePerception: 20, currentPerception: 20,
          baseConstitution: 20, currentConstitution: 20,
          strengthXP: 0, agilityXP: 0, perceptionXP: 0, constitutionXP: 0,
          strengthXpSpent: 0, agilityXpSpent: 0, perceptionXpSpent: 0, constitutionXpSpent: 0,
          armorAbsorption: 0, armorMaxAbsorption: 0, armorWeightRequirement: 0
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
  const animationCleanupRef = useRef(null);

  // Clean up animation loop on component unmount
  useEffect(() => {
    return () => {
      if (animationCleanupRef.current) {
        animationCleanupRef.current();
      }
    };
  }, []);
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
      drunkenness: 0,
      isStarving: false, isDehydrated: false,
      meleeHits: 0, meleeLvl: 0, rangedHits: 0, rangedLvl: 0,
      defenseHits: 0, defenseLvl: 0,
      craftingApUsed: 0, craftingLvl: 0,
      earbucks: 0,
      baseStrength: 20, currentStrength: 20,
      baseAgility: 20, currentAgility: 20,
      basePerception: 20, currentPerception: 20,
      baseConstitution: 20, currentConstitution: 20,
      armorAbsorption: 0, armorMaxAbsorption: 0, armorWeightRequirement: 0,
      isInfected: false,
      infectionTicksRemaining: 24,
      treatmentTicksRemaining: 0,
      treatmentSubtype: null,
      treatmentEffects: null,
      treatmentColor: null,
      treatmentName: null
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
      drunkenness: player.drunkenness || 0,
      isStarving: player.isStarving,
      isDehydrated: player.isDehydrated,
      meleeHits: player.meleeHits,
      meleeLvl: player.meleeLvl,
      rangedHits: player.rangedHits,
      rangedLvl: player.rangedLvl,
      defenseHits: player.defenseHits,
      defenseLvl: player.defenseLvl,
      craftingApUsed: player.craftingApUsed,
      craftingLvl: player.craftingLvl,
      earbucks: player.earbucks || 0,
      baseStrength: player.baseStrength,
      currentStrength: player.currentStrength,
      baseAgility: player.baseAgility,
      currentAgility: player.currentAgility,
      basePerception: player.basePerception,
      currentPerception: player.currentPerception,
      baseConstitution: player.baseConstitution,
      currentConstitution: player.currentConstitution,
      strengthXP: player.strengthXP || 0,
      agilityXP: player.agilityXP || 0,
      perceptionXP: player.perceptionXP || 0,
      constitutionXP: player.constitutionXP || 0,
      strengthXpSpent: player.strengthXpSpent || 0,
      agilityXpSpent: player.agilityXpSpent || 0,
      perceptionXpSpent: player.perceptionXpSpent || 0,
      constitutionXpSpent: player.constitutionXpSpent || 0,
      armorAbsorption: player.absorption || 0,
      armorMaxAbsorption: player.maxAbsorption || 0,
      armorWeightRequirement: player.weightRequirement || 0,
      ammo: 0, // Legacy
      isInfected: player.isInfected,
      infectionTicksRemaining: player.infectionTicksRemaining,
      treatmentTicksRemaining: player.treatmentTicksRemaining,
      treatmentSubtype: player.treatmentSubtype,
      treatmentEffects: player.treatmentEffects,
      treatmentColor: player.treatmentColor,
      treatmentName: player.treatmentName
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
   * Record a landed hit (not just a kill) for a specific weapon type and
   * handle skill leveling. Logic lives on the Entity class.
   */
  const recordHit = useCallback((type) => {
    if (!engine.player) return null;
    const result = engine.player.recordHit(type);
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
      const isPassable = tile && !tile.contents.some(e => e.blocksMovement && e.type !== 'window' && e.type !== 'door' && e.type !== 'garage_door') &&
        !tile.contents.some(e => e.defId === TURRET_DEF_ID && !isTurretPassableBy(e, player)) &&
        isTerrainWalkable(tile.terrain); // single source: TERRAIN_PROPS (T2)
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
      // MOVEMENT LOCK: If player is currently animating movement, the animation loop handles FOV updates.
      // We skip the redundant turn-based update here to prevent "flickering" between floor/round positions.
      if (isMovingRef.current && !gameMap._forcedFovUpdate) {
        return engine.playerFieldOfView || [];
      }

      // Sync vision parameters to engine for frame-by-frame movement recalculation
      const activeIsNight = isNight || !!(gameMap?.metadata?.alwaysDark);
      engine.setFOVOptions({ 
        isNight: activeIsNight, 
        isFlashlightOn, 
        isAimingWithScope, 
        flashlightRange,
        isNightVision,
        maxRange: MAX_VISION_RANGE
      });

      // Phase 28 Fix: Always use the central engine to calculate FOV.
      // This ensures that campfire light and other environmental sources are included.
      engine.recalculateFOV();
      
      const visibleTiles = engine.playerFieldOfView || [];
      setPlayerFieldOfView([...visibleTiles]);

      return visibleTiles;
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
      // Phase 28 Fix: Always use the central engine to calculate FOV during movement.
      const didRecalculate = engine.recalculateFOV({ x: smoothX, y: smoothY });
      const visibleTiles = engine.playerFieldOfView || [];
      
      if (didRecalculate) {
        setPlayerFieldOfView([...visibleTiles]);
      }

      // NOTE: Zombie tracking is intentionally NOT done here per-frame. Frame
      // sampling rounds the interpolated position and can skip tiles when a frame
      // advances more than one tile (long paths / dropped frames), missing tiles
      // where the player briefly entered a zombie's view. Tracking is instead done
      // tile-by-tile over the full path when the move completes (see below).

      visibleTiles.forEach(p => {
        const t = gameMap.getTile(p.x, p.y);
        if (t) t.flags.explored = true;
      });


      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Complete
        const final = path[path.length - 1];
        const start = path[0];

        // Phase 12 Fix: Manual sync removed (now handled by global playerMoved listener)

         // Final snap
         if (engine.gameMap && engine.player) {
            const options = { skipEdgeCheck: true };
            if (engine.dragging && engine.dragging.item) {
                options.draggedItemId = engine.dragging.item.instanceId;
            }
            if (engine.riding && engine.riding.item) {
                options.riddenItemId = engine.riding.item.instanceId;
            }
            engine.gameMap.moveEntity(engine.player.id, final.x, final.y, options);
            path.forEach((pos, idx) => { if (idx > 0) ScentTrail.dropScent(gameMap, pos.x, pos.y); });
         }

        // Release lock before final snap so updatePlayerFieldOfView isn't blocked
        setIsMoving(false);
        isMovingRef.current = false;

        updatePlayerFieldOfView(gameMap, isNight, isFlashlightOn, false, flashlightRange, isNightVision);
        updatePlayerCardinalPositions(gameMap);
        
        // Tile-accurate zombie tracking: evaluate EVERY tile the player traversed,
        // not just per-frame sampled positions. This guarantees a zombie that the
        // player briefly passed into view of gets registered as "spotted", so when
        // sight is lost again its last-known-position is set and it will investigate.
        // (Previously a single fast frame could skip the only-visible tile, leaving
        // the zombie with no LKP and making it fail to follow on repeat encounters.)
        if (engine.zombieTracker) {
          const finalVisibleTiles = engine.playerFieldOfView || [];
          for (let i = 1; i < path.length; i++) {
            const step = path[i];
            engine.zombieTracker.updateTracking(gameMap, { x: step.x, y: step.y, id: engine.player.id }, finalVisibleTiles);
          }
          engine.zombieTracker._lastTrackedX = final.x;
          engine.zombieTracker._lastTrackedY = final.y;
        }

        setMovementPath([]);
        setMovementProgress(0);
        GameEvents.emit(GAME_EVENT.PLAYER_MOVE_ENDED);
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [updatePlayerFieldOfView, updatePlayerCardinalPositions]);

  const startAnimatedMovement = useCallback((gameMap, camera, path, cost, isNight = false, isFlashlightOn = false, flashlightRange = 8, isNightVision = false, onComplete = null) => {
    if (!engine.player || !gameMap || !camera) return;
    if (isMovingRef.current) {
        console.debug('[PlayerContext] Rejecting movement: already moving');
        return;
    }
    
    engine.player.useAP(cost);

    // Phase 25: Motorized Wagon Battery Depletion
    const draggedWagon = engine.dragging?.item;
    if (draggedWagon && draggedWagon.isMotorized && draggedWagon.isMotorized()) {
      const distance = path.length - 1;
      if (draggedWagon.consumeMotorPower) {
        draggedWagon.consumeMotorPower(distance);
      }
    }

    // Scooter Ride Mode Battery Depletion
    const riddenScooter = engine.riding?.item;
    if (riddenScooter && riddenScooter.hasTrait?.(ItemTrait.SCOOTER)) {
      try {
        const distance = path.length - 1;
        if (riddenScooter.isScooterRideActive?.() && riddenScooter.consumeScooterPower) {
          console.debug('[PlayerContext] 🛵 Scooter ride mode active, consuming power for distance:', distance);
          riddenScooter.consumeScooterPower(distance);
        }
      } catch (err) {
        console.error('[PlayerContext] 🛵 Error in scooter battery depletion:', err);
      }
    }
    
    // Attribute XP Hooks: Wagon Pulling and Sprint Bonus
    try {
      const baseCostWithBonus = Pathfinding.calculateMovementCost(gameMap, path);
      const activeItems = [engine.dragging?.item, engine.riding?.item].filter(Boolean);
      
      // If we are dragging something, the extra AP spent is the difference between total cost and base cost
      if (activeItems.length > 0) {
        const dragPenalty = cost - baseCostWithBonus;
        if (dragPenalty > 0) {
          AttributeProgressionManager.recordAction(engine.player, 'PULL_WAGON', { apSpent: dragPenalty });
        }
      }

      // Calculate Sprint Bonus (fractional discount from Pathfinding.js)
      const numTiles = path.length - 1;
      const sprintBonus = Math.floor(numTiles / 5) * 0.5;
      if (sprintBonus > 0) {
        AttributeProgressionManager.recordAction(engine.player, 'SPRINT_BONUS', { apSaved: sprintBonus });
      }
    } catch (err) {
      console.error('[PlayerContext] Error calculating movement XP:', err);
    }
    
    // Prime vision at the start position before locking
    updatePlayerFieldOfView(gameMap, isNight, isFlashlightOn, false, flashlightRange, isNightVision);

    setIsMoving(true);
    isMovingRef.current = true;
    setMovementPath(path);
    setMovementProgress(0);
    camera.centerOn(path[0].x, path[0].y);
    console.log(`[PlayerContext] 🏃 Starting movement: (${path[0].x}, ${path[0].y}) -> (${path[path.length-1].x}, ${path[path.length-1].y}). Path: ${path.length} tiles. Cost: ${cost} AP.`);
    GameEvents.emit(GAME_EVENT.PLAYER_MOVE, { start: true });

    if (animationCleanupRef.current) {
      animationCleanupRef.current();
    }

    animationCleanupRef.current = smoothAnimateMovement(
      gameMap, camera, path, performance.now(), 1500, 
      isNight, isFlashlightOn, flashlightRange, 
      () => {
        animationCleanupRef.current = null;
        if (onComplete) onComplete();
      }, 
      isNightVision
    );
  }, [smoothAnimateMovement]);

  const startAnimatedMovementAsync = useCallback((gameMap, camera, path, cost, isNight = false, isFlashlightOn = false, flashlightRange = 8, isNightVision = false) => {
    return new Promise((resolve) => {
      if (!engine.player) { resolve(); return; }
      startAnimatedMovement(gameMap, camera, path, cost, isNight, isFlashlightOn, flashlightRange, isNightVision, resolve);
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

  const cancelMovement = useCallback(() => {
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
    setIsMoving(false);
    isMovingRef.current = false;
    setMovementPath([]);
    setMovementProgress(0);
    GameEvents.emit(GAME_EVENT.PLAYER_MOVE_ENDED);
  }, []);

  useEffect(() => {
    const handleShutdown = () => {
      setIsMoving(false);
      setMovementPath([]);
      setMovementProgress(0);
      setPlayerFieldOfView(null);
      setPlayerCardinalPositions([]);
    };
    window.addEventListener('game-shutdown', handleShutdown);
    return () => window.removeEventListener('game-shutdown', handleShutdown);
  }, []);

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
    recordHit,
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
    cancelMovement
   }), [enginePulse, playerStats, isMoving, movementPath, movementProgress, playerFieldOfView, playerCardinalPositions, cancelMovement]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};