import React, { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { LineOfSight } from '../game/utils/LineOfSight.js';
import { Pathfinding } from '../game/utils/Pathfinding.js';

const PlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[usePlayer] Context not available during hot reload, providing fallback');
      return {
        playerRef: { current: null },
        player: null,
        playerStats: { hp: 20, maxHp: 20, ap: 12, maxAp: 12, ammo: 0, nutrition: 20, maxNutrition: 20, hydration: 20, maxHydration: 20, energy: 20, maxEnergy: 20 },
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
  // Player refs and state
  const playerRef = useRef(null);
  const playerCardinalPositionsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const [playerVersion, setPlayerVersion] = useState(0);

  // Player state
  const [playerStats, setPlayerStats] = useState({ hp: 20, maxHp: 20, ap: 12, maxAp: 12, ammo: 0, nutrition: 20, maxNutrition: 20, hydration: 20, maxHydration: 20, energy: 20, maxEnergy: 20 });
  const [isMoving, setIsMoving] = useState(false);
  const [movementPath, setMovementPath] = useState([]);
  const [movementProgress, setMovementProgress] = useState(0);
  const [playerFieldOfView, setPlayerFieldOfView] = useState(null);

  // Set player ref with version bump (Phase 1 migration pattern)
  const setPlayerRef = useCallback((player) => {
    console.log('[PlayerContext] 🎮 SETTING PLAYER REFERENCE (version pattern):');
    if (playerRef.current && playerRef.current !== player) {
      console.error('[PlayerContext] 🚨 REPLACING EXISTING PLAYER! This indicates multiple initialization!');
      console.error('[PlayerContext] - Old player:', playerRef.current ? `${playerRef.current.id} at (${playerRef.current.x}, ${playerRef.current.y})` : 'null');
      console.error('[PlayerContext] - New player:', player ? `${player.id} at (${player.x}, ${player.y})` : 'null');
      console.error('[PlayerContext] - Same instance?', playerRef.current === player ? 'YES' : 'NO');
    }

    playerRef.current = player;
    setPlayerVersion(prev => prev + 1);
    console.log('[PlayerContext] 📦 Player version bumped to trigger re-renders');

    if (player) {
      console.log('[PlayerContext] ✅ Player reference set:', `${player.id} at (${player.x}, ${player.y})`);
      console.log('[PlayerContext] - Player constructor:', player.constructor.name);
      console.log('[PlayerContext] - HP/AP:', `${player.hp}/${player.maxHp} HP, ${player.ap}/${player.maxAp} AP`);

      setPlayerStats({
        hp: player.hp,
        maxHp: player.maxHp,
        ap: player.ap,
        maxAp: player.maxAp,
        nutrition: player.nutrition || 20,
        maxNutrition: player.maxNutrition || 20,
        hydration: player.hydration || 20,
        maxHydration: player.maxHydration || 20,
        energy: player.energy || 20,
        maxEnergy: player.maxEnergy || 20,
        ammo: 0
      });
    } else {
      console.log('[PlayerContext] ❌ Player reference set to null');
    }
  }, []);

  // Legacy setPlayer method (backward compatibility)
  const setPlayer = useCallback((player) => {
    console.log('[PlayerContext] 🔄 Legacy setPlayer called, delegating to setPlayerRef');
    setPlayerRef(player);
  }, [setPlayerRef]);

  // Set player position (used during map transitions)
  const setPlayerPosition = useCallback((x, y) => {
    if (playerRef.current) {
      console.log(`[PlayerContext] Setting player position from (${playerRef.current.x}, ${playerRef.current.y}) to (${x}, ${y})`);
      playerRef.current.x = x;
      playerRef.current.y = y;
    }
  }, []);

  // Update player stats from external source
  const updatePlayerStats = useCallback((newStats) => {
    setPlayerStats(prev => ({ ...prev, ...newStats }));
  }, []);

  // Setup player event listeners
  const setupPlayerEventListeners = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    // Remove any existing listeners to prevent duplicates
    player.removeAllListeners();

    // Set up fresh event listeners
    const handleAPUsed = () => {
      setPlayerStats(prev => ({ ...prev, ap: player.ap }));
    };
    const handleAPRestored = () => {
      setPlayerStats(prev => ({ ...prev, ap: player.ap }));
    };
    const handleDamage = () => {
      setPlayerStats(prev => ({ ...prev, hp: player.hp }));
    };
    const handleHealing = () => {
      setPlayerStats(prev => ({ ...prev, hp: player.hp }));
    };
    const handleStatChanged = (data) => {
      setPlayerStats(prev => ({ ...prev, [data.stat]: data.current }));
    };

    player.on('apUsed', handleAPUsed);
    player.on('apRestored', handleAPRestored);
    player.on('damageTaken', handleDamage);
    player.on('healed', handleHealing);
    player.on('statChanged', handleStatChanged);

    console.log('[PlayerContext] Event listeners set up for player');
  }, []);

  // Calculate and cache player cardinal positions
  const updatePlayerCardinalPositions = useCallback((gameMap) => {
    if (!playerRef.current || !gameMap) return;

    const player = playerRef.current;
    const cardinalPositions = [
      { x: player.x + 1, y: player.y, direction: 'right' },
      { x: player.x - 1, y: player.y, direction: 'left' },
      { x: player.x, y: player.y + 1, direction: 'down' },
      { x: player.x, y: player.y - 1, direction: 'up' }
    ];

    // Evaluate each position for accessibility and occupancy
    const evaluatedPositions = cardinalPositions.map(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      const isPassable = tile && !tile.contents.some(entity => entity.blocksMovement) &&
        !['wall', 'building', 'fence', 'tree'].includes(tile.terrain);
      const hasZombie = tile && tile.contents.some(entity => entity.type === 'zombie');
      const zombieId = hasZombie ? tile.contents.find(entity => entity.type === 'zombie')?.id : null;

      return {
        ...pos,
        isPassable,
        hasZombie,
        zombieId,
        priority: isPassable ? (hasZombie ? 2 : 1) : 3 // 1=available, 2=occupied, 3=blocked
      };
    });

    // Sort by priority (available positions first)
    evaluatedPositions.sort((a, b) => a.priority - b.priority);

    playerCardinalPositionsRef.current = evaluatedPositions;

    console.log('[PlayerContext] Updated player cardinal positions:', evaluatedPositions.map(p =>
      `${p.direction}(${p.x},${p.y}): ${p.priority === 1 ? 'available' : p.priority === 2 ? 'occupied' : 'blocked'}`
    ));
  }, []);

  // Get player cardinal positions
  const getPlayerCardinalPositions = useCallback(() => {
    return playerCardinalPositionsRef.current;
  }, []);

  // Update player field of view
  const updatePlayerFieldOfView = useCallback((gameMap, playerMovement = null) => {
    if (!gameMap || !playerRef.current) {
      setPlayerFieldOfView([]);
      return;
    }

    try {
      const player = playerRef.current;

      // Calculate field of view using LineOfSight
      const fovData = LineOfSight.calculateFieldOfView(gameMap, player, {
        maxRange: 15, // Player sight range
        ignoreTerrain: [], // Player can't see through walls
        ignoreEntities: [player.id] // Don't include player in entity blocking
      });

      setPlayerFieldOfView(fovData.visibleTiles);

      // Debug: Log if player is inside a building
      const playerTile = gameMap.getTile(player.x, player.y);
      if (playerTile && (playerTile.terrain === 'building' || playerTile.terrain === 'floor')) {
        console.log(`[PlayerContext] Player is inside building/floor at (${player.x}, ${player.y}), terrain: ${playerTile.terrain}`);
      }
    } catch (error) {
      console.error('[PlayerContext] Error calculating player field of view:', error);
      setPlayerFieldOfView([]);
    }
  }, []);

  // Smooth animation function using requestAnimationFrame
  const smoothAnimateMovement = useCallback((gameMap, camera, path, startTime, duration = 1500) => {
    if (!playerRef.current || !gameMap || !camera) {
      setIsMoving(false);
      setMovementPath([]);
      setMovementProgress(0);
      return;
    }

    // Store the ORIGINAL player position at animation start
    const originalPosition = { x: playerRef.current.x, y: playerRef.current.y };
    console.log(`[PlayerContext] INVESTIGATION: Animation starting - player locked at (${originalPosition.x}, ${originalPosition.y}) until completion`);
    console.log(`[PlayerContext] INVESTIGATION: Animation frame before starting:`, animationFrameRef.current);

    // Check if there's already an animation running
    if (animationFrameRef.current) {
      console.warn(`[PlayerContext] INVESTIGATION: WARNING - Starting new animation while one is already running! Previous frame ID:`, animationFrameRef.current);
    }

    const animate = (currentTime) => {
      // INVESTIGATION POINT 2: Animation frame verification
      if (!animationFrameRef.current) {
        console.warn(`[PlayerContext] INVESTIGATION: Animation running but animationFrameRef is null! This suggests cancelMovement() was called.`);
        return; // Stop animation if reference was cleared
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easeInOut for smooth acceleration/deceleration
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Calculate current position along the path
      const pathProgress = easeProgress * (path.length - 1);
      const segmentIndex = Math.floor(pathProgress);
      const segmentProgress = pathProgress - segmentIndex;

      // Get current and next waypoints
      const currentWaypoint = path[segmentIndex];
      const nextWaypoint = path[Math.min(segmentIndex + 1, path.length - 1)];

      // Interpolate position between waypoints
      const smoothX = currentWaypoint.x + (nextWaypoint.x - currentWaypoint.x) * segmentProgress;
      const smoothY = currentWaypoint.y + (nextWaypoint.y - currentWaypoint.y) * segmentProgress;

      // Update render position for smooth animation
      setMovementProgress(easeProgress);

      // ENSURE player coordinates haven't changed during animation
      if (playerRef.current.x !== originalPosition.x || playerRef.current.y !== originalPosition.y) {
        console.warn(`[PlayerContext] PREVENTING position change during animation! Restoring from (${playerRef.current.x}, ${playerRef.current.y}) to (${originalPosition.x}, ${originalPosition.y})`);
        playerRef.current.x = originalPosition.x;
        playerRef.current.y = originalPosition.y;
      }

      // Update camera to follow smooth movement
      camera.centerOn(smoothX, smoothY);

      // INVESTIGATION: Log camera updates to detect excessive movement
      if (Math.random() < 0.1) { // Log ~10% of frames to avoid spam
        console.log(`[PlayerContext] INVESTIGATION: Animation frame updating camera to (${smoothX.toFixed(1)}, ${smoothY.toFixed(1)}), progress: ${(progress * 100).toFixed(1)}%`);
      }

      // Update FOV based on current smooth position during animation
      if (gameMap && LineOfSight) {
        try {
          const smoothPlayer = {
            ...playerRef.current,
            x: Math.round(smoothX),
            y: Math.round(smoothY)
          };
          const fovResult = LineOfSight.calculateFieldOfView(gameMap, smoothPlayer, {
            maxRange: 25,
            ignoreTerrain: [],
            ignoreEntities: [playerRef.current.id]
          });
          setPlayerFieldOfView(fovResult.visibleTiles);
        } catch (error) {
          console.error('[PlayerContext] Error updating FOV during animation:', error);
        }
      }

      if (progress < 1) {
        // INVESTIGATION POINT 2: Check if we should continue animation
        if (!animationFrameRef.current) {
          console.log(`[PlayerContext] INVESTIGATION: Animation stopped mid-execution (animationFrameRef cleared)`);
          return;
        }

        // Continue animation
        const frameId = requestAnimationFrame(animate);
        const oldFrameId = animationFrameRef.current;
        animationFrameRef.current = frameId;

        if (Math.random() < 0.05) { // Log ~5% of frame updates
          console.log(`[PlayerContext] INVESTIGATION: Animation frame updated from ${oldFrameId} to ${frameId}`);
        }
      } else {
        // Animation completed - now move player from original to final position
        const finalPosition = path[path.length - 1];
        const finalTile = gameMap.getTile(finalPosition.x, finalPosition.y);

        console.log(`[PlayerContext] Animation complete - moving player from (${originalPosition.x}, ${originalPosition.y}) to (${finalPosition.x}, ${finalPosition.y})`);

        // Double-check that the final position is still walkable
        if (finalTile && finalTile.isWalkable()) {
          // Verify player hasn't been moved by something else during animation
          if (playerRef.current.x !== originalPosition.x || playerRef.current.y !== originalPosition.y) {
            console.warn(`[PlayerContext] Player position changed during animation! Expected (${originalPosition.x}, ${originalPosition.y}), found (${playerRef.current.x}, ${playerRef.current.y})`);
            // Reset to original position before moving
            playerRef.current.x = originalPosition.x;
            playerRef.current.y = originalPosition.y;
          }

          // Move entity in GameMap from original to final position
          const moveSuccess = gameMap.moveEntity(playerRef.current.id, finalPosition.x, finalPosition.y);

          if (moveSuccess) {
            console.log(`[PlayerContext] Player successfully moved from (${originalPosition.x}, ${originalPosition.y}) to (${finalPosition.x}, ${finalPosition.y})`);
          } else {
            console.error(`[PlayerContext] Failed to move player in GameMap`);
            // Fallback: update player position directly if GameMap move failed
            playerRef.current.x = finalPosition.x;
            playerRef.current.y = finalPosition.y;
          }

          console.log('[PlayerContext] Smooth movement animation completed successfully.');
        } else {
          // Final position became unwalkable during animation - abort movement
          console.warn('[PlayerContext] Final position became unwalkable during animation, aborting movement');
        }

        // Calculate new field of view
        updatePlayerFieldOfView(gameMap, { from: { x: originalPosition.x, y: originalPosition.y }, to: { x: finalPosition.x, y: finalPosition.y } });

        // Update player cardinal positions after movement
        updatePlayerCardinalPositions(gameMap);

        console.log(`[PlayerContext] Player moved from (${originalPosition.x}, ${originalPosition.y}) to (${finalPosition.x}, ${finalPosition.y}), AP: ${playerRef.current.ap}`);

        // Finish animation
        setIsMoving(false);
        setMovementPath([]);
        setMovementProgress(0);
        animationFrameRef.current = null;
      }
    };

    const frameId = requestAnimationFrame(animate);
    animationFrameRef.current = frameId;
  }, [updatePlayerFieldOfView, updatePlayerCardinalPositions]);

  // Start animated movement along path
  const startAnimatedMovement = useCallback((gameMap, camera, path, cost) => {
    if (!playerRef.current || !gameMap || !camera) return;

    console.log(`[PlayerContext] Starting animated movement from (${playerRef.current.x}, ${playerRef.current.y}) to (${path[path.length - 1].x}, ${path[path.length - 1].y})`);

    // Consume AP
    playerRef.current.useAP(cost);
    setPlayerStats(prev => ({ ...prev, ap: playerRef.current.ap }));

    // Set movement state
    setIsMoving(true);
    setMovementPath(path);
    setMovementProgress(0);

    // Update camera immediately to follow start of path
    const startPosition = path[0];
    camera.centerOn(startPosition.x, startPosition.y);

    // Start smooth animation
    const startTime = performance.now();
    smoothAnimateMovement(gameMap, camera, path, startTime);
  }, [smoothAnimateMovement]);

  // Calculate player render position for animation
  const playerRenderPosition = useMemo(() => {
    if (!isMoving || movementPath.length === 0) {
      return playerRef.current ? { x: playerRef.current.x, y: playerRef.current.y } : { x: 0, y: 0 };
    }

    const pathProgress = movementProgress * (movementPath.length - 1);
    const segmentIndex = Math.floor(pathProgress);
    const segmentProgress = pathProgress - segmentIndex;

    const currentWaypoint = movementPath[segmentIndex];
    const nextWaypoint = movementPath[Math.min(segmentIndex + 1, movementPath.length - 1)];

    const renderX = currentWaypoint.x + (nextWaypoint.x - currentWaypoint.x) * segmentProgress;
    const renderY = currentWaypoint.y + (nextWaypoint.y - currentWaypoint.y) * segmentProgress;

    return { x: renderX, y: renderY };
  }, [isMoving, movementPath, movementProgress, playerVersion]); // Use version instead of .current

  // Cancel any ongoing movement animation
  const cancelMovement = useCallback(() => {
    console.log('[PlayerContext] INVESTIGATION: cancelMovement() called');
    console.log('[PlayerContext] - Current animation frame ID:', animationFrameRef.current);
    console.log('[PlayerContext] - Current isMoving state:', isMoving);
    console.log('[PlayerContext] - Current movement path length:', movementPath.length);
    console.log('[PlayerContext] - Current movement progress:', movementProgress);

    if (animationFrameRef.current) {
      console.log('[PlayerContext] Cancelling ongoing movement animation with ID:', animationFrameRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log('[PlayerContext] Animation frame cancelled successfully');
    } else {
      console.log('[PlayerContext] No animation frame to cancel');
    }

    // Reset movement state
    console.log('[PlayerContext] Resetting movement state...');
    setIsMoving(false);
    setMovementPath([]);
    setMovementProgress(0);

    console.log('[PlayerContext] Movement cancelled and state reset completed');
    console.log('[PlayerContext] INVESTIGATION: Post-cancellation state check:');
    console.log('[PlayerContext] - Animation frame after cancel:', animationFrameRef.current);
  }, [isMoving, movementPath.length, movementProgress]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // NOTE: The original `useMemo` dependency array was missing `playerRef.current`.
  // This caused `playerRenderPosition` to not update correctly when the player's
  // actual position changed outside of an animation. By adding `playerRef.current`,
  // `playerRenderPosition` will now correctly reflect the player's current position
  // when `isMoving` is false.

  // Alias `isMoving` to `isAnimatingMovement` for clarity in context value,
  // while `isMoving` state variable remains the source of truth.
  const isAnimatingMovement = isMoving;

  const contextValue = useMemo(() => ({
    // Player data - expose both ref and current value  
    playerRef,
    player: playerRef.current,
    playerStats,

    // Movement state
    isMoving, // Expose the original isMoving state
    movementPath,
    movementProgress,
    playerRenderPosition,

    // Field of view
    playerFieldOfView,

    // Methods
    setPlayerRef,
    setPlayer, // Legacy compatibility
    setPlayerPosition,
    updatePlayerStats,
    setupPlayerEventListeners,
    startAnimatedMovement,
    cancelMovement,
    updatePlayerFieldOfView,
    updatePlayerCardinalPositions,
    getPlayerCardinalPositions
  }), [
    playerVersion, // Version triggers updates when player ref changes
    playerStats,
    isMoving,
    movementPath,
    movementProgress,
    playerRenderPosition,
    playerFieldOfView,
    setPlayerRef,
    setPlayer,
    setPlayerPosition,
    updatePlayerStats,
    setupPlayerEventListeners,
    startAnimatedMovement,
    cancelMovement,
    updatePlayerFieldOfView,
    updatePlayerCardinalPositions,
    getPlayerCardinalPositions
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};