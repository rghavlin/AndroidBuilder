import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { usePlayer } from './PlayerContext';
import { Pathfinding } from '../game/utils/Pathfinding.js';
import { useLog } from './LogContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import engine from '../game/GameEngine.js';
import { EntityType } from '../game/entities/Entity.js';

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
          setGameMap: () => { },
          setWorldManager: () => { },
          handleTileClick: () => { },
          handleTileHover: () => { },
          checkPathForZombieVisibility: () => { },
          executeMapTransition: () => { },
          handleMapTransitionConfirm: () => { },
          handleMapTransitionCancel: () => { },
          setMapTransition: () => { }
        };
      }
    throw new Error('useGameMap must be used within a GameMapProvider');
  }
  return context;
};

export const GameMapProvider = ({ children }) => {
  // Map-related state - keep UI-specific states
  const [mapTransition, setMapTransition] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);
  const [mapVersion, setMapVersion] = useState(0);

  const { addLog } = useLog();

  // Refs as bridge to engine singleton
  const gameMapRef = useRef(engine.gameMap);
  const worldManagerRef = useRef(engine.worldManager);

  // Sync with engine updates (especially map loads/transitions)
  useEffect(() => {
    const handleSync = () => {
      console.log('[GameMapContext] 🔄 engine triggered sync, updating map version');
      gameMapRef.current = engine.gameMap;
      worldManagerRef.current = engine.worldManager;
      setMapVersion(v => v + 1);
    };

    engine.on('sync', handleSync);
    return () => {
      engine.off('sync', handleSync);
    };
  }, []);

  // Handle tile click for movement
  const handleTileClick = useCallback(async (x, y, player, camera, isPlayerTurn, isMoving, isAutosaving, startAnimatedMovement, isNight = false, isFlashlightOn = false, flashlightRange = 8) => {
    if (!engine.gameMap || !player) return;

    if (!isPlayerTurn || isAutosaving || isMoving) return;

    try {
      const targetTile = engine.gameMap.getTile(x, y);
      if (!targetTile) return;

      const entityFilter = (tile) => {
        if (!tile.flags || !tile.flags.explored) return false;
        if (['wall', 'building', 'fence', 'tree', 'water', 'tent_wall'].includes(tile.terrain)) return false;
        return !tile.contents.some(entity => entity.blocksMovement && entity.id !== player.id);
      };

      if (!Pathfinding.isTileWalkable(targetTile, entityFilter)) return;

      const path = Pathfinding.findPath(engine.gameMap, player.x, player.y, x, y, { allowDiagonal: true, entityFilter });

      if (path.length === 0) return;

      let movementCost = Pathfinding.calculateMovementCost(engine.gameMap, path);
      
      // Phase 25: Drag AP Penalty (with Terrain Bonuses)
      const dragging = engine.dragging;
      if (dragging && path.length > 1) {
        const basePenalty = dragging.item.dragApPenalty || 2;
        let dragPenaltyTotal = 0;
        
        // Calculate penalty per step based on terrain
        for (let i = 1; i < path.length; i++) {
          const tile = engine.gameMap.getTile(path[i].x, path[i].y);
          let stepPenalty = basePenalty;
          if (tile && (tile.terrain === 'road' || tile.terrain === 'sidewalk')) {
            stepPenalty -= 0.5;
          }
          dragPenaltyTotal += stepPenalty;
        }
        movementCost += dragPenaltyTotal;
      }

      if (movementCost > player.ap) return;

      // Start movement
      await startAnimatedMovement(engine.gameMap, camera, path, movementCost, isNight, isFlashlightOn, flashlightRange);

      // Transition check
      const finalTile = engine.gameMap.getTile(x, y);
      if (finalTile && finalTile.terrain === 'transition' && engine.worldManager) {
        const transitionInfo = engine.worldManager.checkTransitionPoint({ x, y }, engine.gameMap);
        if (transitionInfo) {
          setMapTransition(transitionInfo);
        }
      }
    } catch (error) {
      console.error('[GameMapContext] Error handling tile click:', error);
    }
  }, []);

  // Handle tile hover for path preview
  const handleTileHover = useCallback(async (x, y, player, isNight = false, isFlashlightOn = false, data = null) => {
    if (!player || !engine.gameMap) return;

    const targetTile = engine.gameMap.getTile(x, y);
    if (!targetTile || !targetTile.flags?.explored) {
      setHoveredTile(null);
      return;
    }

    try {
      const entityFilter = (tile) => {
        if (!tile.flags || !tile.flags.explored) return false;
        if (['wall', 'building', 'fence', 'tree', 'water', 'tent_wall'].includes(tile.terrain)) return false;
        return !tile.contents.some(e => e.blocksMovement && e.id !== player.id);
      };

      const path = Pathfinding.findPath(engine.gameMap, player.x, player.y, x, y, { allowDiagonal: true, entityFilter });
      let apCost = path.length === 0 ? Math.abs(x - player.x) + Math.abs(y - player.y) : Pathfinding.calculateMovementCost(engine.gameMap, path);
      
      // Phase 25: Drag AP Penalty Preview (with Terrain Bonuses)
      const dragging = engine.dragging;
      if (dragging && path.length > 1) {
        const basePenalty = dragging.item.dragApPenalty || 2;
        let dragPenaltyTotal = 0;
        for (let i = 1; i < path.length; i++) {
          const tile = engine.gameMap.getTile(path[i].x, path[i].y);
          let stepPenalty = basePenalty;
          if (tile && (tile.terrain === 'road' || tile.terrain === 'sidewalk')) {
            stepPenalty -= 0.5;
          }
          dragPenaltyTotal += stepPenalty;
        }
        apCost += dragPenaltyTotal;
      }
      
      const zombie = targetTile.contents.find(e => e.type === EntityType.ZOMBIE);
      setHoveredTile({ 
        x, y, apCost, 
        canAfford: player.ap >= apCost, 
        zombie: zombie ? { subtype: zombie.subtype, hp: zombie.hp, maxHp: zombie.maxHp, currentAP: zombie.currentAP, maxAP: zombie.maxAP } : (data?.zombie || null),
        cropInfo: targetTile.cropInfo || data?.cropInfo || null,
        lootItems: targetTile.inventoryItems || null,
        specialBuilding: targetTile.contents.find(e => e.type === EntityType.PLACE_ICON)?.subtype || null,
        door: targetTile.contents.find(e => e.type === EntityType.DOOR),
        window: targetTile.contents.find(e => e.type === EntityType.WINDOW)
      });
    } catch (error) {
      setHoveredTile(null);
    }
  }, []);

  // Map Transition execution logic
  const executeMapTransition = useCallback(async (transitionInfo, playerEntity, updatePlayerCardinalPositions, cancelMovement, cameraOperations, inventoryManager, turn) => {
    if (!engine.worldManager || !playerEntity) return false;

    try {
        console.log('[GameMapContext] ========== EXECUTING MAP TRANSITION (Phase 3) ==========');
        
        // 1. Save old map
        if (inventoryManager) {
            // Phase 25: Flush items to old map, carrying only the dragged item
            inventoryManager.flushGroundItems(engine.gameMap);
        }
        engine.worldManager.saveCurrentMap(engine.gameMap, engine.worldManager.currentMapId, turn);

        // 2. Perform transition
        const result = await engine.worldManager.executeTransition(transitionInfo.nextMapId, transitionInfo.spawnPosition, turn);
        if (!result.success) return false;

        const newMap = result.gameMap;

        // 3. Update player reference and position
        engine.gameMap.removeEntity(playerEntity.id);
        playerEntity.x = result.spawnPosition.x;
        playerEntity.y = result.spawnPosition.y;
        newMap.addEntity(playerEntity, playerEntity.x, playerEntity.y);

        // 4. Update Engine
        engine.gameMap = newMap;
        engine.zombieTracker?.updateVisibility?.(newMap, playerEntity, []); // Initial blackout

        // 5. Centering and Syncing
        if (cameraOperations?.setWorldBounds) cameraOperations.setWorldBounds(newMap.width, newMap.height);
        if (cameraOperations?.centerOn) cameraOperations.centerOn(playerEntity.x, playerEntity.y);
        
        if (inventoryManager) {
            inventoryManager.syncWithMap(playerEntity.x, playerEntity.y, playerEntity.x, playerEntity.y, newMap);
        }

        console.log('[GameMapContext] Map transition successful, triggering global sync...');
        engine.notifySync();
        addLog(`Entered ${result.mapId}`, 'world');
        return true;
    } catch (error) {
      console.error('[GameMapContext] Map transition error:', error);
      return false;
    }
  }, []);

  const handleMapTransitionConfirm = useCallback(async (player, updatePlayerCardinalPositions, cancelMovement, cameraOperations, inventoryManager, turn) => {
    if (!player) return false;
    const success = await executeMapTransition(mapTransition, player, updatePlayerCardinalPositions, cancelMovement, cameraOperations, inventoryManager, turn);
    if (success) setMapTransition(null);
    return success;
  }, [mapTransition, executeMapTransition]);

  const handleMapTransitionCancel = useCallback(() => setMapTransition(null), []);

  const contextValue = useMemo(() => ({
    gameMap: engine.gameMap,
    gameMapRef,
    worldManager: engine.worldManager,
    worldManagerRef,
    mapVersion,
    mapTransition,
    hoveredTile,
    setGameMap: () => {}, // Null-op for Phase 3
    setWorldManager: () => {},
    handleTileClick,
    handleTileHover,
    executeMapTransition,
    handleMapTransitionConfirm,
    handleMapTransitionCancel,
    setMapTransition,
    triggerMapUpdate: () => setMapVersion(v => v + 1),
    refreshZombieTracking: (p, fov) => engine.zombieTracker?.updateTracking(engine.gameMap, p, fov, null),
    zombieTracker: engine.zombieTracker,
    lootGenerator: engine.lootGenerator,
    setLootGenerator: () => {}
  }), [mapVersion, mapTransition, hoveredTile, handleTileClick, handleTileHover, executeMapTransition, handleMapTransitionConfirm, handleMapTransitionCancel]);

  return (
    <GameMapContext.Provider value={contextValue}>
      {children}
    </GameMapContext.Provider>
  );
};