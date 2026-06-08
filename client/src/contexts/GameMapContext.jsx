import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, useSyncExternalStore } from 'react';
import { usePlayer } from './PlayerContext';
import { Pathfinding } from '../game/utils/Pathfinding.js';
import { useLog } from './LogContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import engine from '../game/GameEngine.js';
import { EntityType } from '../game/entities/Entity.js';
import { VehicleUtils } from '../game/utils/VehicleUtils.js';

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

  const enginePulse = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getSnapshot()
  );

  const { addLog } = useLog();

  // Refs as bridge to engine singleton
  const gameMapRef = useRef(engine.gameMap);
  const worldManagerRef = useRef(engine.worldManager);

  // Sync with engine updates (especially map loads/transitions)
  useEffect(() => {
    const handleSync = () => {
      console.log('[GameMapContext] 🔄 engine triggered sync, updating map refs');
      gameMapRef.current = engine.gameMap;
      worldManagerRef.current = engine.worldManager;
    };

    engine.on('sync', handleSync);
    return () => {
      engine.off('sync', handleSync);
    };
  }, []);

  // Handle tile click for movement
  const handleTileClick = useCallback(async (x, y, player, camera, isPlayerTurn, isMoving, isAutosaving, startAnimatedMovement, isNight = false, isFlashlightOn = false, flashlightRange = 8, isAnimatingZombies = false) => {
    if (!engine.gameMap || !player) return;

    if (!isPlayerTurn || isAutosaving || isMoving || isAnimatingZombies) return;

    try {
      const targetTile = engine.gameMap.getTile(x, y);
      if (!targetTile) return;

      const entityFilter = (tile) => {
        if (!tile.flags || !tile.flags.explored) return false;
        if (['wall', 'building', 'fence', 'tree', 'water', 'tent_wall'].includes(tile.terrain)) return false;

        const draggedItemId = engine.dragging?.item?.instanceId;
        const riddenItemId = engine.riding?.item?.instanceId;
        return !tile.contents.some(entity => {
          if (entity.id === player.id) return false;
          if (entity.type === 'window' || entity.type === 'door' || entity.type === 'EntityType.WINDOW' || entity.type === 'EntityType.DOOR') return false;
          if (draggedItemId && (entity.id === draggedItemId || entity.instanceId === draggedItemId)) return false;
          if (riddenItemId && (entity.id === riddenItemId || entity.instanceId === riddenItemId)) return false;
          return entity.blocksMovement;
        });
      };

      if (!Pathfinding.isTileWalkable(targetTile, entityFilter)) return;

      const path = Pathfinding.findPath(engine.gameMap, player.x, player.y, x, y, { allowDiagonal: true, entityFilter });

      if (path.length === 0) return;

      let movementCost = Pathfinding.calculateMovementCost(engine.gameMap, path);
      
      // Phase 25: Drag AP Penalty (Consolidated via VehicleUtils)
      const activeItems = [engine.dragging?.item, engine.riding?.item].filter(Boolean);
      if (activeItems.length > 0 && path.length > 1) {
        movementCost = VehicleUtils.calculateDragCost(activeItems, path, engine.gameMap, movementCost);
      }

      if (movementCost > player.ap) return;

      // Start movement
      await startAnimatedMovement(engine.gameMap, camera, path, movementCost, isNight, isFlashlightOn, flashlightRange);

      // Transition check disabled for Exit item/manual transitions
      // const finalTile = engine.gameMap.getTile(x, y);
      // if (finalTile && finalTile.terrain === 'transition' && engine.worldManager) {
      //   const transitionInfo = engine.worldManager.checkTransitionPoint({ x, y }, engine.gameMap);
      //   if (transitionInfo) {
      //     setMapTransition(transitionInfo);
      //   }
      // }
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
        return !tile.contents.some(e => e.blocksMovement && e.id !== player.id && e.type !== 'window' && e.type !== 'door' && e.type !== 'EntityType.WINDOW' && e.type !== 'EntityType.DOOR');
      };

      const isWalkable = Pathfinding.isTileWalkable(targetTile, entityFilter);
      const path = Pathfinding.findPath(engine.gameMap, player.x, player.y, x, y, { allowDiagonal: true, entityFilter });
      const hasPath = path.length > 0 || (player.x === x && player.y === y);
      const isPossible = isWalkable && hasPath;

      let apCost = path.length === 0 ? Math.abs(x - player.x) + Math.abs(y - player.y) : Pathfinding.calculateMovementCost(engine.gameMap, path);
      
      // Phase 25: Drag AP Penalty Preview (Consolidated via VehicleUtils)
      const activeHoverItems = [engine.dragging?.item, engine.riding?.item].filter(Boolean);
      if (activeHoverItems.length > 0 && path.length > 1) {
        apCost = VehicleUtils.calculateDragCost(activeHoverItems, path, engine.gameMap, apCost);
      }
      
      let door = targetTile.contents.find(e => e.type === EntityType.DOOR);
      if (!door) {
        const north = engine.gameMap.getTile(x, y - 1);
        const nd = north?.contents.find(e => e.type === EntityType.DOOR && e.edge === 's');
        if (nd) door = nd;
        
        if (!door) {
          const south = engine.gameMap.getTile(x, y + 1);
          const sd = south?.contents.find(e => e.type === EntityType.DOOR && e.edge === 'n');
          if (sd) door = sd;
        }
        
        if (!door) {
          const west = engine.gameMap.getTile(x - 1, y);
          const wd = west?.contents.find(e => e.type === EntityType.DOOR && e.edge === 'e');
          if (wd) door = wd;
        }
        
        if (!door) {
          const east = engine.gameMap.getTile(x + 1, y);
          const ed = east?.contents.find(e => e.type === EntityType.DOOR && e.edge === 'w');
          if (ed) door = ed;
        }
      }

      let windowEntity = targetTile.contents.find(e => e.type === EntityType.WINDOW);
      if (!windowEntity) {
        const north = engine.gameMap.getTile(x, y - 1);
        const nw = north?.contents.find(e => e.type === EntityType.WINDOW && e.edge === 's');
        if (nw) windowEntity = nw;
        
        if (!windowEntity) {
          const south = engine.gameMap.getTile(x, y + 1);
          const sw = south?.contents.find(e => e.type === EntityType.WINDOW && e.edge === 'n');
          if (sw) windowEntity = sw;
        }
        
        if (!windowEntity) {
          const west = engine.gameMap.getTile(x - 1, y);
          const ww = west?.contents.find(e => e.type === EntityType.WINDOW && e.edge === 'e');
          if (ww) windowEntity = ww;
        }
        
        if (!windowEntity) {
          const east = engine.gameMap.getTile(x + 1, y);
          const ew = east?.contents.find(e => e.type === EntityType.WINDOW && e.edge === 'w');
          if (ew) windowEntity = ew;
        }
      }

      const zombie = targetTile.contents.find(e => e.type === EntityType.ZOMBIE);
      const rabbit = targetTile.contents.find(e => e.type === EntityType.RABBIT);
      setHoveredTile({ 
        x, y, apCost, 
        canAfford: isPossible && player.ap >= apCost, 
        zombie: zombie ? { subtype: zombie.subtype, hp: zombie.hp, maxHp: zombie.maxHp, currentAP: zombie.currentAP, maxAP: zombie.maxAP } : (data?.zombie || null),
        rabbit: rabbit ? { id: rabbit.id, type: rabbit.type, hp: rabbit.hp, maxHp: rabbit.maxHp, currentAP: rabbit.currentAP, maxAP: rabbit.maxAP } : (data?.rabbit || null),
        cropInfo: targetTile.cropInfo || data?.cropInfo || null,
        lootItems: targetTile.inventoryItems || null,
        specialBuilding: targetTile.contents.find(e => e.type === EntityType.PLACE_ICON)?.subtype || null,
        door: door,
        window: windowEntity,
        npc: targetTile.contents.find(e => e.type === EntityType.NPC)
      });
    } catch (error) {
      setHoveredTile(null);
    }
  }, []);

  // Map Transition execution logic
  const executeMapTransition = useCallback(async (transitionInfo, playerEntity, updatePlayerCardinalPositions, cancelMovement, cameraOperations, inventoryManager, turn, selectedPrizeId) => {
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

        // Spawn the selected prize if any
        if (selectedPrizeId) {
            try {
                const { createItemFromDef } = await import('../game/inventory/ItemDefs.js');
                let itemData = createItemFromDef(selectedPrizeId);
                if (itemData) {
                    if (selectedPrizeId === 'food.waterbottle') {
                        itemData.ammoCount = itemData.capacity || 5;
                    } else if (selectedPrizeId.startsWith('ammo.')) {
                        itemData.stackCount = 10;
                    } else {
                        // If it is a weapon (gun), set it up with ammo/magazine same as a weapon in a loot drop
                        const { Item } = await import('../game/inventory/Item.js');
                        const { ItemCategory } = await import('../game/inventory/traits.js');
                        
                        const isWeapon = (itemData.categories && itemData.categories.includes(ItemCategory.WEAPON)) || !!itemData.attachmentSlots;
                        if (isWeapon && (itemData.categories?.includes(ItemCategory.GUN) || itemData.attachmentSlots)) {
                            const itemObj = new Item(itemData);
                            const { LootGenerator } = await import('../game/map/LootGenerator.js');
                            LootGenerator.initializeWeaponAmmo(itemObj);
                            itemData = itemObj.toJSON();
                        }
                    }
                    const existingItems = newMap.getItemsOnTile(result.spawnPosition.x, result.spawnPosition.y) || [];
                    newMap.setItemsOnTile(result.spawnPosition.x, result.spawnPosition.y, [...existingItems, itemData]);
                    console.log(`[GameMapContext] Spawned prize ${selectedPrizeId} at spawn position (${result.spawnPosition.x}, ${result.spawnPosition.y})`);
                }
            } catch (err) {
                console.error('[GameMapContext] Failed to spawn map transition prize:', err);
            }
        }

        // 3. Update player reference and position
        engine.gameMap.removeEntity(playerEntity.id);
        
        // Phase 28 Fix: Explicitly update ALL coordinate systems to prevent 'snapback' or pathfinding failure
        playerEntity.x = result.spawnPosition.x;
        playerEntity.y = result.spawnPosition.y;
        playerEntity.logicalX = result.spawnPosition.x;
        playerEntity.logicalY = result.spawnPosition.y;
        playerEntity.gridX = result.spawnPosition.x;
        playerEntity.gridY = result.spawnPosition.y;

        newMap.addEntity(playerEntity, result.spawnPosition.x, result.spawnPosition.y);

        // 4. Update Engine
        engine.gameMap = newMap;
        engine.zombieTracker?.clearAllTracking();

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

  const handleMapTransitionConfirm = useCallback(async (player, updatePlayerCardinalPositions, cancelMovement, cameraOperations, inventoryManager, turn, selectedPrizeId) => {
    if (!player) return false;
    const success = await executeMapTransition(mapTransition, player, updatePlayerCardinalPositions, cancelMovement, cameraOperations, inventoryManager, turn, selectedPrizeId);
    if (success) setMapTransition(null);
    return success;
  }, [mapTransition, executeMapTransition]);

  const handleMapTransitionCancel = useCallback(() => setMapTransition(null), []);

  const contextValue = useMemo(() => ({
    gameMap: engine.gameMap,
    gameMapRef,
    worldManager: engine.worldManager,
    worldManagerRef,
    mapVersion: enginePulse,
    mapTransition,
    hoveredTile,
    setHoveredTile,
    setGameMap: () => {}, // Null-op for Phase 3
    setWorldManager: () => {},
    handleTileClick,
    handleTileHover,
    executeMapTransition,
    handleMapTransitionConfirm,
    handleMapTransitionCancel,
    setMapTransition,
    triggerMapUpdate: () => engine.notifyUpdate(),
    refreshZombieTracking: (p, fov) => engine.zombieTracker?.updateTracking(engine.gameMap, p, fov, null),
    zombieTracker: engine.zombieTracker,
    lootGenerator: engine.lootGenerator,
    setLootGenerator: () => {}
  }), [enginePulse, mapTransition, hoveredTile, setHoveredTile, handleTileClick, handleTileHover, executeMapTransition, handleMapTransitionConfirm, handleMapTransitionCancel]);

  return (
    <GameMapContext.Provider value={contextValue}>
      {children}
    </GameMapContext.Provider>
  );
};