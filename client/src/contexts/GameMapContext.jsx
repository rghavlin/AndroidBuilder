import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';
import { usePlayer } from './PlayerContext';
import { Pathfinding } from '../game/utils/Pathfinding.js';
import { Zombie } from '../game/entities/Zombie.js';

const GameMapContext = createContext();

export const useGameMap = () => {
  const context = useContext(GameMapContext);
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[useGameMap] Context not available during hot reload, providing fallback');
      return {
        gameMap: null,
        worldManager: null,
        mapTransition: null,
        setGameMap: () => {},
        setWorldManager: () => {},
        handleTileClick: () => {},
        handleTileHover: () => {},
        checkPathForZombieVisibility: () => {},
        executeMapTransition: () => {},
        handleMapTransitionConfirm: () => {},
        handleMapTransitionCancel: () => {},
        setMapTransition: () => {}
      };
    }
    throw new Error('useGameMap must be used within a GameMapProvider');
  }
  return context;
};

export const GameMapProvider = ({ children }) => {
  // GameMapContext focuses only on map state - camera operations passed as parameters

  // Map-related refs
  const gameMapRef = useRef(null);
  const worldManagerRef = useRef(null);
  const zombieTrackerRef = useRef(null);

  // Map-related state - keep mapTransition and hoveredTile for UI state
  const [mapTransition, setMapTransition] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);
  
  // Version state for rare structural re-renders on map transitions
  const [mapVersion, setMapVersion] = useState(0);

  // Set game map ref (called during initialization)
  const setGameMap = useCallback((gameMap) => {
    console.log('[GameMapContext] setGameMap called with:', gameMap ? `GameMap(${gameMap.width}x${gameMap.height})` : 'null');
    gameMapRef.current = gameMap;
    setMapVersion(v => v + 1); // Trigger useMemo recalculation
    console.log('[GameMapContext] gameMapRef.current now:', gameMapRef.current ? `GameMap(${gameMapRef.current.width}x${gameMapRef.current.height})` : 'null');
    console.log('[GameMapContext] mapVersion incremented to trigger context value update');
  }, []);

  // Set world manager ref (called during initialization)
  const setWorldManager = useCallback((worldManager) => {
    worldManagerRef.current = worldManager;
  }, []);

  // Set zombie tracker ref (called during initialization)
  const setZombieTracker = useCallback((zombieTracker) => {
    zombieTrackerRef.current = zombieTracker;
  }, []);

  // Check path for zombie visibility changes during player movement
  const checkPathForZombieVisibility = useCallback((path, player) => {
    if (!gameMapRef.current || !player || !path || path.length === 0) {
      console.log('[GameMapContext] Invalid parameters for zombie visibility check');
      return;
    }

    console.log(`[GameMapContext] Checking ${path.length} tiles in path for zombie visibility changes`);

    if (zombieTrackerRef.current) {
      const zombies = gameMapRef.current.getEntitiesByType('zombie');
      const zombieVisibilityMap = new Map();

      // Record initial zombie visibility
      zombies.forEach(zombie => {
        const canSeePlayer = zombie.canSeeEntity(gameMapRef.current, player);
        zombieVisibilityMap.set(zombie.id, {
          wasVisible: canSeePlayer,
          lastVisiblePosition: canSeePlayer ? { x: player.x, y: player.y } : null
        });
      });

      // Check visibility along entire path
      for (let i = 0; i < path.length; i++) {
        const pathTile = path[i];
        const tempPlayer = {
          ...player,
          x: pathTile.x,
          y: pathTile.y
        };

        zombies.forEach(zombie => {
          const zombieData = zombieVisibilityMap.get(zombie.id);
          const canStillSeePlayer = zombie.canSeeEntity(gameMapRef.current, tempPlayer);

          if (zombieData.wasVisible && canStillSeePlayer) {
            // Update last known position
            zombieData.lastVisiblePosition = { x: pathTile.x, y: pathTile.y };
          } else if (zombieData.wasVisible && !canStillSeePlayer) {
            // Zombie lost sight - set LastSeen position
            if (zombieData.lastVisiblePosition) {
              console.log(`[GameMapContext] Zombie ${zombie.id} lost sight of player at path step ${i}, setting LastSeen to (${zombieData.lastVisiblePosition.x}, ${zombieData.lastVisiblePosition.y})`);
              zombie.setTargetSighted(zombieData.lastVisiblePosition.x, zombieData.lastVisiblePosition.y);
            }
            zombieData.wasVisible = false;
          }
        });
      }
    }

    console.log(`[GameMapContext] Path visibility check complete for ${path.length} tiles`);
  }, []);

  // Handle tile click for movement
  const handleTileClick = useCallback(async (x, y, player, camera, isPlayerTurn, isMoving, isAutosaving, startAnimatedMovement) => {
    if (!gameMapRef.current || !player) {
      console.warn('[GameMapContext] Cannot handle tile click - game map or player not available');
      return;
    }

    if (!isPlayerTurn || isAutosaving) {
      console.log('[GameMapContext] Not player turn or autosaving, ignoring click');
      return;
    }

    if (isMoving) {
      console.log('[GameMapContext] Movement already in progress, ignoring click');
      return;
    }

    try {
      const currentPlayerPosition = { x: player.x, y: player.y };
      console.log(`[GameMapContext] Tile clicked at coordinates: (${x}, ${y}), Player currently at: (${currentPlayerPosition.x}, ${currentPlayerPosition.y})`);

      const targetTile = gameMapRef.current.getTile(x, y);
      if (!targetTile) {
        console.log('[GameMapContext] Target tile does not exist');
        return;
      }

      const entityFilter = (tile) => {
        const blockingEntities = tile.contents.filter(entity => {
          return entity.blocksMovement && entity.id !== player.id;
        });
        return blockingEntities.length === 0;
      };

      if (!Pathfinding.isTileWalkable(targetTile, entityFilter)) {
        console.log('[GameMapContext] Target tile is not walkable');
        return;
      }

      const path = Pathfinding.findPath(
        gameMapRef.current,
        currentPlayerPosition.x,
        currentPlayerPosition.y,
        x,
        y,
        {
          allowDiagonal: true,
          entityFilter: entityFilter,
          debug: true
        }
      );

      if (path.length === 0) {
        console.log('[GameMapContext] No path found to target location');
        return;
      }

      const movementCost = Pathfinding.calculateMovementCost(path);

      if (movementCost > player.ap) {
        console.log('[GameMapContext] Insufficient AP for movement:', { cost: movementCost, available: player.ap });
        return;
      }

      // Check path for zombie visibility changes
      checkPathForZombieVisibility(path, player);

      // Start animated movement
      startAnimatedMovement(gameMapRef.current, camera, path, movementCost);

      // Check for map transitions after movement completes (no timer - immediate check)
      const finalTile = gameMapRef.current.getTile(x, y);
      if (finalTile && finalTile.terrain === 'transition' && worldManagerRef.current) {
        const transitionInfo = worldManagerRef.current.checkTransitionPoint(
          { x, y },
          gameMapRef.current
        );
        if (transitionInfo) {
          console.log('[GameMapContext] Transition point detected:', transitionInfo);
          setMapTransition(transitionInfo);
        }
      }

      // Update last tile click
      // setLastTileClick({ x, y, timestamp: Date.now() });

    } catch (error) {
      console.error('[GameMapContext] Error handling tile click:', error);
    }
  }, [checkPathForZombieVisibility]);

  // Handle tile hover for path preview
  const handleTileHover = useCallback(async (x, y, player) => {
    if (!player || !gameMapRef.current) return;

    const targetTile = gameMapRef.current.getTile(x, y);
    if (!targetTile) return;

    try {
      const entityFilter = (tile) => {
        const blockingEntities = tile.contents.filter(entity => {
          return entity.blocksMovement && entity.id !== player.id;
        });
        return blockingEntities.length === 0;
      };

      const path = Pathfinding.findPath(
        gameMapRef.current,
        player.x,
        player.y,
        x,
        y,
        {
          allowDiagonal: true,
          entityFilter: entityFilter
        }
      );

      let apCost;
      if (path.length === 0) {
        // Fallback to Manhattan distance if no path found
        apCost = Math.abs(x - player.x) + Math.abs(y - player.y);
      } else {
        apCost = Pathfinding.calculateMovementCost(path);
      }

      const canAfford = player.ap >= apCost;
      setHoveredTile({ x, y, apCost, canAfford });
    } catch (error) {
      console.warn('[GameMapContext] Error calculating hover cost:', error);
      // Fallback calculation
      const distance = Math.abs(x - player.x) + Math.abs(y - player.y);
      const apCost = distance;
      const canAfford = player.ap >= apCost;
      setHoveredTile({ x, y, apCost, canAfford });
    }
  }, []);

  // Execute map transition
  const executeMapTransition = useCallback(async (transitionInfo, playerEntity, updatePlayerCardinalPositions, cancelMovement, cameraOperations) => {
    if (!worldManagerRef.current || !playerEntity) {
      console.error('[GameMapContext] Cannot execute transition - missing refs');
      return false;
    }

    try {
      console.log('[GameMapContext] ========== STARTING MAP TRANSITION ==========');
      console.log('[GameMapContext] Transition info:', transitionInfo);
      console.log('[GameMapContext] Player at start:', playerEntity ? `${playerEntity.id} at (${playerEntity.x}, ${playerEntity.y})` : 'null');
      console.log('[GameMapContext] Current map:', worldManagerRef.current?.currentMapId || 'unknown');

      // FIX 1: Cancel movement and wait for it to complete BEFORE any map operations
      if (cancelMovement) {
        console.log('[GameMapContext] Cancelling movement before transition...');
        cancelMovement();
        // Wait for animation frame to fully stop
        await new Promise(resolve => setTimeout(resolve, 150));
        console.log('[GameMapContext] Movement cancelled, proceeding with transition');
      }

      // CRITICAL: Check for multiple player entities and DUPLICATES
      const currentMapPlayers = gameMapRef.current.getEntitiesByType('player');
      console.log('[GameMapContext] 🔍 DUPLICATE INVESTIGATION: Players on current map before transition:');
      currentMapPlayers.forEach((mapPlayer, index) => {
        console.log(`[GameMapContext] - Player ${index + 1}: ${mapPlayer.id} at (${mapPlayer.x}, ${mapPlayer.y}), instance hash: ${mapPlayer.constructor.name}_${mapPlayer.id}_${Date.now()}`);
        console.log(`[GameMapContext] - Is same as passed player?`, mapPlayer === playerEntity ? '✅ SAME INSTANCE' : '❌ DIFFERENT INSTANCE');
      });
      console.log('[GameMapContext] 🚨 TOTAL PLAYER ENTITIES FOUND:', currentMapPlayers.length);

      if (currentMapPlayers.length > 1) {
        console.error('[GameMapContext] 🚨🚨🚨 CRITICAL: MULTIPLE PLAYERS DETECTED! This indicates initialization ran multiple times!');
        console.error('[GameMapContext] All players on map:');
        currentMapPlayers.forEach((p, i) => {
          console.error(`[GameMapContext]   Player ${i + 1}: ${p.id} at (${p.x}, ${p.y}), constructor: ${p.constructor.name}`);
          console.error(`[GameMapContext]     - Event listeners count: ${p.listeners ? p.listeners.size || 'no size prop' : 'no listeners'}`);
          console.error(`[GameMapContext]     - HP/AP: ${p.hp}/${p.maxHp} HP, ${p.ap}/${p.maxAp} AP`);
        });
      }

      // INVESTIGATION POINT 2: Verify player instance references
      console.log('[GameMapContext] 🔍 PLAYER REFERENCE VERIFICATION:');
      console.log('[GameMapContext] - Passed player instance:', playerEntity.id, 'at', `(${playerEntity.x}, ${playerEntity.y})`);
      console.log('[GameMapContext] - Player object type:', typeof playerEntity, 'constructor:', playerEntity.constructor.name);
      console.log('[GameMapContext] - Player in entityMap:', gameMapRef.current.entityMap.has(playerEntity.id) ? 'EXISTS' : 'MISSING');

      const entityMapPlayer = gameMapRef.current.entityMap.get(playerEntity.id);
      if (entityMapPlayer) {
        console.log('[GameMapContext] - EntityMap player:', entityMapPlayer.id, 'at', `(${entityMapPlayer.x}, ${entityMapPlayer.y})`);
        console.log('[GameMapContext] - Same instance reference?', playerEntity === entityMapPlayer ? '✅ YES' : '❌ NO - THIS IS THE PROBLEM!');
        console.log('[GameMapContext] - EntityMap player type:', typeof entityMapPlayer, 'constructor:', entityMapPlayer.constructor.name);
      }

      // INVESTIGATION POINT 3: Animation cancellation verification
      console.log('[GameMapContext] 🔍 ANIMATION CANCELLATION CHECK:');
      if (cancelMovement) {
        console.log('[GameMapContext] - cancelMovement function available: YES');
        console.log('[GameMapContext] Calling cancelMovement() before map transition...');
        cancelMovement();
        console.log('[GameMapContext] - cancelMovement() called successfully');

        // Wait to see if movement stops
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('[GameMapContext] - cancelMovement completed');
      } else {
        console.log('[GameMapContext] - cancelMovement function available: NO');
      }

      // Store current player reference to ensure consistency
      const currentPlayerRef = playerEntity;
      const oldMapRef = gameMapRef.current;

      // Save current map before transitioning
      worldManagerRef.current.saveCurrentMap(oldMapRef, worldManagerRef.current.currentMapId);
      console.log('[GameMapContext] Current map saved');

      const result = await worldManagerRef.current.executeTransition(
        transitionInfo.nextMapId,
        transitionInfo.spawnPosition
      );

      if (!result.success) {
        console.error('[GameMapContext] Map transition failed:', result.error || 'Unknown error');
        return false;
      }

      console.log('[GameMapContext] WorldManager transition successful, updating contexts...');

      // Remove player from OLD map using the saved reference
      if (oldMapRef && oldMapRef.entityMap.has(currentPlayerRef.id)) {
        console.log(`[GameMapContext] Removing player from old map at (${currentPlayerRef.x}, ${currentPlayerRef.y})`);
        oldMapRef.removeEntity(currentPlayerRef.id);
      }

      // Remove any existing player entities from the new map to prevent duplicates
      const existingPlayer = result.gameMap.entityMap.get(currentPlayerRef.id);
      if (existingPlayer) {
        console.log(`[GameMapContext] Removing existing player entity from new map at (${existingPlayer.x}, ${existingPlayer.y})`);
        result.gameMap.removeEntity(currentPlayerRef.id);
      }

      // CORRECTED FIX: Update player position FIRST, before any camera operations
      console.log(`[GameMapContext] Updating player position from (${currentPlayerRef.x}, ${currentPlayerRef.y}) to spawn position (${result.spawnPosition.x}, ${result.spawnPosition.y})`);

      // Update player coordinates directly BEFORE camera centering
      currentPlayerRef.x = result.spawnPosition.x;
      currentPlayerRef.y = result.spawnPosition.y;

      // Verify player position was updated
      console.log(`[GameMapContext] Player position after update: (${currentPlayerRef.x}, ${currentPlayerRef.y})`);

      // Add player to new map at spawn position
      const addSuccess = result.gameMap.addEntity(currentPlayerRef, result.spawnPosition.x, result.spawnPosition.y);
      if (!addSuccess) {
        console.error(`[GameMapContext] Failed to add player to new map at (${result.spawnPosition.x}, ${result.spawnPosition.y})`);

        // Try to force add the player by clearing the tile first
        const spawnTile = result.gameMap.getTile(result.spawnPosition.x, result.spawnPosition.y);
        if (spawnTile) {
          console.log('[GameMapContext] Attempting to clear spawn tile and re-add player...');
          spawnTile.contents = spawnTile.contents.filter(e => e.id !== currentPlayerRef.id);
          const retryAdd = result.gameMap.addEntity(currentPlayerRef, result.spawnPosition.x, result.spawnPosition.y);
          if (!retryAdd) {
            console.error('[GameMapContext] Retry add also failed');
            return false;
          }
          console.log('[GameMapContext] Retry add succeeded');
        }
      }

      console.log(`[GameMapContext] Player successfully placed at (${currentPlayerRef.x}, ${currentPlayerRef.y}) on new map`);

      // Verify player is at correct position on the map
      const verifyTile = result.gameMap.getTile(result.spawnPosition.x, result.spawnPosition.y);
      const playerOnTile = verifyTile ? verifyTile.contents.find(e => e.id === currentPlayerRef.id) : null;
      if (!playerOnTile) {
        console.error(`[GameMapContext] CRITICAL: Player not found on spawn tile after placement! Expected at (${result.spawnPosition.x}, ${result.spawnPosition.y})`);
        console.error(`[GameMapContext] Spawn tile contents:`, verifyTile ? verifyTile.contents.map(e => `${e.id}(${e.x},${e.y})`) : 'tile not found');
        console.error(`[GameMapContext] Player entity:`, `${currentPlayerRef.id}(${currentPlayerRef.x},${currentPlayerRef.y})`);
        return false;
      } else {
        console.log(`[GameMapContext] Verified: Player ${currentPlayerRef.id} is on spawn tile (${result.spawnPosition.x}, ${result.spawnPosition.y})`);
      }

      // Update camera bounds FIRST
      console.log('[GameMapContext] Setting camera world bounds:', result.gameMap.width, 'x', result.gameMap.height);
      if (cameraOperations && cameraOperations.setWorldBounds) {
        cameraOperations.setWorldBounds(result.gameMap.width, result.gameMap.height);
      }
      
      // CORRECTED FIX: Now center camera on player's UPDATED position (not stale coordinates)
      if (cameraOperations && cameraOperations.centerOn) {
        cameraOperations.centerOn(currentPlayerRef.x, currentPlayerRef.y);
        console.log(`[GameMapContext] Camera centered on player's updated position (${currentPlayerRef.x}, ${currentPlayerRef.y})`);
      }

      // FIX: Stamp reciprocal south transition on new map (if not first map)
      if (result.mapId !== 'map_001') {
        console.log(`[GameMapContext] Stamping south transition at (17, 124) on ${result.mapId}`);
        result.gameMap.setTerrain(17, 124, 'transition');
      }

      // FIX: Re-save the map to WorldManager with player included (using result.mapId, not undefined targetMapId)
      console.log('[GameMapContext] Re-saving map to WorldManager with player included...');
      worldManagerRef.current.saveCurrentMap(result.gameMap, result.mapId);
      console.log('[GameMapContext] Map re-saved with player successfully');

      // FIX: Update game map reference using setGameMap (not undefined setGameMapState)
      // This also increments mapVersion for structural re-render
      setGameMap(result.gameMap);
      console.log('[GameMapContext] Game map reference updated and version incremented');

      // Check for existing zombies on new map
      const existingZombies = result.gameMap.getEntitiesByType('zombie');
      console.log(`[GameMapContext] New map ${result.mapId} has ${existingZombies.length} existing zombies`);

      // Spawn zombies if none exist
      if (existingZombies.length === 0) {
        console.log(`[GameMapContext] Spawning zombies on new map ${result.mapId}`);
        const zombiesToSpawn = 4;
        let spawnedCount = 0;
        const maxAttempts = 50;
        const lowerHalfStartY = Math.floor(result.gameMap.height * 0.5);

        for (let i = 0; i < zombiesToSpawn; i++) {
          let attempts = 0;
          let spawned = false;

          while (!spawned && attempts < maxAttempts) {
            const x = Math.floor(Math.random() * result.gameMap.width);
            const y = lowerHalfStartY + Math.floor(Math.random() * (result.gameMap.height - lowerHalfStartY));
            const tile = result.gameMap.getTile(x, y);
            const distanceFromPlayer = Math.abs(x - result.spawnPosition.x) + Math.abs(y - result.spawnPosition.y);
            const minDistanceFromPlayer = 5;

            if (tile && tile.isWalkable() && distanceFromPlayer >= minDistanceFromPlayer) {
              const hasEntities = tile.contents.length > 0;
              if (!hasEntities) {
                const zombieId = `zombie-${result.mapId}-${i + 1}`;

                if (result.gameMap.addEntity(new Zombie(zombieId, x, y, 'basic'), x, y)) {
                  spawnedCount++;
                  spawned = true;
                  console.log(`[GameMapContext] Spawned zombie '${zombieId}' on ${result.mapId} at (${x}, ${y}), distance from player: ${distanceFromPlayer}`);
                }
              }
            }
            attempts++;
          }

          if (!spawned) {
            console.warn(`[GameMapContext] Failed to spawn zombie ${i + 1} on ${result.mapId} after ${maxAttempts} attempts`);
          }
        }
        console.log(`[GameMapContext] Spawned ${spawnedCount} zombies on new map ${result.mapId}`);
      }

      console.log(`[GameMapContext] Map transition completed successfully to ${result.mapId}`);
      console.log(`[GameMapContext] Player spawned at (${result.spawnPosition.x}, ${result.spawnPosition.y})`);

      // FIX 3: PATCH code removed - player position is now set once and remains consistent
      // Animation is cancelled before transition, camera follows actual player position

      return true;

    } catch (error) {
      console.error('[GameMapContext] Map transition error:', error);
      console.error('[GameMapContext] Error stack:', error.stack);
      return false;
    }
  }, []);

  // Handle map transition confirmation
  const handleMapTransitionConfirm = useCallback(async (player, updatePlayerCardinalPositions, cancelMovement, cameraOperations) => {
    console.log(`[GameMapContext] Starting map transition confirmation with player: ${typeof player !== 'undefined' && player ? `${player.id} at (${player.x}, ${player.y})` : 'null'}`);
    console.log('[GameMapContext] Player object type:', typeof player, 'constructor:', player?.constructor?.name || 'undefined');

    if (!player) {
      console.error('[GameMapContext] Cannot execute transition - no player available');
      return false;
    }

    const success = await executeMapTransition(mapTransition, player, updatePlayerCardinalPositions, cancelMovement, cameraOperations);
    if (success) {
      setMapTransition(null);
      console.log('[GameMapContext] Map transition completed successfully, dialog closed');
      return true;
    } else {
      console.error('[GameMapContext] Map transition failed, keeping dialog open');
      return false;
    }
  }, [mapTransition, executeMapTransition]);

  // Handle map transition cancellation
  const handleMapTransitionCancel = useCallback(() => {
    setMapTransition(null);
  }, []);

  const contextValue = useMemo(() => ({
    // Map data - expose both ref and current value
    gameMapRef,
    gameMap: gameMapRef.current,
    worldManagerRef,
    worldManager: worldManagerRef.current,
    mapVersion,

    // Map state
    mapTransition, // Kept for handleMapTransitionConfirm/Cancel
    hoveredTile, // UI state for tile hover effects

    // Methods
    setGameMap,
    setWorldManager,
    setZombieTracker,
    handleTileClick,
    handleTileHover,
    checkPathForZombieVisibility,
    executeMapTransition,
    handleMapTransitionConfirm,
    handleMapTransitionCancel,
    setMapTransition
  }), [
    mapVersion, // Version triggers updates when gameMap ref changes
    mapTransition,
    hoveredTile,
    setGameMap,
    setWorldManager,
    setZombieTracker,
    handleTileClick,
    handleTileHover,
    checkPathForZombieVisibility,
    executeMapTransition,
    handleMapTransitionConfirm,
    handleMapTransitionCancel,
    setMapTransition
  ]);

  return (
    <GameMapContext.Provider value={contextValue}>
      {children}
    </GameMapContext.Provider>
  );
};