import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, useSyncExternalStore } from 'react';
import { usePlayer } from './PlayerContext';
import { Pathfinding } from '../game/utils/Pathfinding.js';
import { useLog } from './LogContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import engine from '../game/GameEngine.js';
import { EntityType } from '../game/entities/Entity.js';
import { findEdgeStructure } from '../game/utils/EdgeStructure.js';
import { VehicleUtils } from '../game/utils/VehicleUtils.js';
import { isTurretPassableBy, TURRET_DEF_ID } from '../game/ai/TurretCombat.js';
import { isTerrainWalkable } from '../game/map/TerrainTypes.js';
import * as DroneMovement from '../game/remote/DroneMovement.js';
import { getActiveDevice } from '../game/remote/RemoteDeviceRegistry.js';
import * as RcVehicleMovement from '../game/remote/RcVehicleMovement.js';
import { getActiveRcVehicle, getAutonomousVehicle } from '../game/remote/RcVehicle.js';
import * as AutoWagonOrders from '../game/remote/AutoWagonOrders.js';
import { findRcPath } from '../game/remote/RcPathing.js';

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

    if (!isPlayerTurn || isAutosaving || isMoving || isAnimatingZombies || engine.movementLocked) return;

    // While a remote device has camera/control focus, clicks drive it instead of
    // the player — camera target IS control target (see selectRemoteDevice).
    // Viewing a GROUNDED drone stays look-only: the camera is somewhere else
    // entirely, so a click must not walk the player toward it.
    if (engine.activeDeviceId) {
      if (getActiveDevice(engine)) {
        await DroneMovement.moveActiveDevice(x, y, engine);
      } else if (engine.deviceControlMode === 'auto' && getAutonomousVehicle(engine)) {
        // Autonomous mode: the click sets a destination rather than spending the
        // player's AP now. One click, one order — drop straight back to remote
        // so the next click doesn't silently re-task the wagon.
        const result = AutoWagonOrders.setDestination(x, y, engine);
        addLog(result.message, result.success ? 'info' : 'error');
        if (result.success) engine.deviceControlMode = 'remote';
        engine.notifyUpdate?.();
      } else if (getActiveRcVehicle(engine)) {
        const result = await RcVehicleMovement.driveActiveVehicle(x, y, engine);
        if (!result.success && result.reason) addLog(result.reason, 'error');
      }
      return;
    }

    try {
      const targetTile = engine.gameMap.getTile(x, y);
      if (!targetTile) return;

      const entityFilter = (tile) => {
        if (!tile.flags || !tile.flags.explored) return false;
        if (!isTerrainWalkable(tile.terrain)) return false; // single source: TERRAIN_PROPS (T2)

        // If the player is riding a golf cart, floor tiles are unwalkable
        if (tile.terrain === 'floor' && engine?.riding?.item?.defId === 'vehicle.golf_cart') {
          return false;
        }

        const blockedByTurret = tile.contents.some(e => e.defId === TURRET_DEF_ID && !isTurretPassableBy(e, player));
        if (blockedByTurret) return false;

        const draggedItemId = engine.dragging?.item?.instanceId;
        const riddenItemId = engine.riding?.item?.instanceId;
        return !tile.contents.some(entity => {
          if (entity.id === player.id) return false;
          if (entity.type === 'window' || entity.type === 'door' || entity.type === 'garage_door') return false;
          if (draggedItemId && (entity.id === draggedItemId || entity.instanceId === draggedItemId)) return false;
          if (riddenItemId && (entity.id === riddenItemId || entity.instanceId === riddenItemId)) return false;
          return entity.blocksMovement;
        });
      };

      if (!Pathfinding.isTileWalkable(targetTile, entityFilter)) return;

      const path = Pathfinding.findPath(engine.gameMap, player.x, player.y, x, y, { allowDiagonal: true, entityFilter });

      if (path.length === 0) return;

      // Phase 25: Drag AP Penalty (Consolidated via VehicleUtils)
      const activeItems = [engine.dragging?.item, engine.riding?.item].filter(Boolean);

      // No sprint discount while riding or hauling — see Pathfinding.calculateMovementCost.
      let movementCost = Pathfinding.calculateMovementCost(engine.gameMap, path, null, {
        sprintBonus: activeItems.length === 0
      });

      if (activeItems.length > 0 && path.length > 1) {
        movementCost = VehicleUtils.calculateDragCost(activeItems, path, engine.gameMap, movementCost, {
          playerStrength: player?.currentStrength ?? 20,
          riddenItemId: engine.riding?.item?.instanceId ?? null
        });
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
  }, [addLog]);

  // Handle tile hover for path preview
  const handleTileHover = useCallback(async (x, y, player, isNight = false, isFlashlightOn = false, data = null) => {
    if (!player || !engine.gameMap) return;

    const targetTile = engine.gameMap.getTile(x, y);

    // A drone hovering over this tile, if any. Surfaced on hoveredTile so the
    // tooltip layer knows to render (it pre-filters on these fields), while the
    // tooltip itself re-reads live stats off the entity.
    const hoveredDrone = engine.gameMap.getEntitiesByType(EntityType.DRONE)
      .find(d => Math.round(d.x) === x && Math.round(d.y) === y) || null;

    if (engine.activeDeviceId && getActiveDevice(engine)) {
      if (!targetTile) { setHoveredTile(null); return; }
      const preview = DroneMovement.previewMoveCost(x, y, engine);
      setHoveredTile(preview?.possible
        ? { x, y, apCost: preview.apCost, canAfford: preview.canAfford, isDroneTarget: true, drone: hoveredDrone }
        : null);
      return;
    }

    // Arming an autonomous destination: the wagon pays, not the player, so the
    // useful number is how long the trip takes rather than what it costs.
    if (engine.activeDeviceId && engine.deviceControlMode === 'auto' && getAutonomousVehicle(engine)) {
      if (!targetTile) { setHoveredTile(null); return; }
      const device = getAutonomousVehicle(engine);
      const path = findRcPath(device.x, device.y, x, y, engine, device.item.instanceId);
      if (path.length <= 1) {
        setHoveredTile({ x, y, apCost: 0, canAfford: false, isRcTarget: true, reason: 'No route there' });
        return;
      }
      const turns = AutoWagonOrders.estimateTurns(path, device.item, engine.gameMap);
      setHoveredTile(Number.isFinite(turns)
        ? { x, y, apCost: 0, canAfford: true, isRcTarget: true, label: `${turns}t` }
        : { x, y, apCost: 0, canAfford: false, isRcTarget: true, reason: 'No power to move' });
      return;
    }

    // A linked RC wagon is drivable, so it gets a real cost cursor — note the
    // deliberate absence of isRemoteView, which MapCanvas uses to suppress it.
    if (engine.activeDeviceId && getActiveRcVehicle(engine)) {
      if (!targetTile) { setHoveredTile(null); return; }
      const preview = RcVehicleMovement.previewDriveCost(x, y, engine);
      if (!preview) { setHoveredTile(null); return; }
      setHoveredTile(preview.possible
        ? { x, y, apCost: preview.apCost, canAfford: preview.canAfford, isRcTarget: true }
        // Still show the tile when the drive is refused, so the player sees the
        // cursor react rather than nothing at all.
        : { x, y, apCost: 0, canAfford: false, isRcTarget: true, reason: preview.reason });
      return;
    }

    // Viewing a grounded drone: read-only. Surface what's on the tile for the
    // tooltip layer, but no movement cursor — neither the player nor the
    // powered-down drone can go anywhere from here.
    const isRemoteView = !!engine.activeDeviceId;

    if (!targetTile || !targetTile.flags?.explored) {
      setHoveredTile(null);
      return;
    }

    try {
      const entityFilter = (tile) => {
        if (!tile.flags || !tile.flags.explored) return false;
        if (!isTerrainWalkable(tile.terrain)) return false; // single source: TERRAIN_PROPS (T2)

        // If the player is riding a golf cart, floor tiles are unwalkable
        if (tile.terrain === 'floor' && engine?.riding?.item?.defId === 'vehicle.golf_cart') {
          return false;
        }

        const blockedByEntity = tile.contents.some(e => e.blocksMovement && e.id !== player.id && e.type !== 'window' && e.type !== 'door' && e.type !== 'garage_door');
        const blockedByTurret = tile.contents.some(e => e.defId === TURRET_DEF_ID && !isTurretPassableBy(e, player));
        return !blockedByEntity && !blockedByTurret;
      };

      // Remote view can't move anyone, so skip the pathfinding entirely.
      const isWalkable = isRemoteView ? false : Pathfinding.isTileWalkable(targetTile, entityFilter);
      const path = isRemoteView
        ? []
        : Pathfinding.findPath(engine.gameMap, player.x, player.y, x, y, { allowDiagonal: true, entityFilter });
      const hasPath = path.length > 0 || (player.x === x && player.y === y);
      const isPossible = isWalkable && hasPath;

      // Phase 25: Drag AP Penalty Preview (Consolidated via VehicleUtils)
      const activeHoverItems = [engine.dragging?.item, engine.riding?.item].filter(Boolean);

      let apCost = path.length === 0
        ? Math.abs(x - player.x) + Math.abs(y - player.y)
        : Pathfinding.calculateMovementCost(engine.gameMap, path, null, {
            sprintBonus: activeHoverItems.length === 0
          });

      if (activeHoverItems.length > 0 && path.length > 1) {
        apCost = VehicleUtils.calculateDragCost(activeHoverItems, path, engine.gameMap, apCost, {
          playerStrength: player?.currentStrength ?? 20,
          riddenItemId: engine.riding?.item?.instanceId ?? null
        });
      }
      
      const { structure: door } = findEdgeStructure(engine.gameMap, x, y, { type: 'door' });
      const { structure: windowEntity } = findEdgeStructure(engine.gameMap, x, y, { type: 'window' });

      const zombie = targetTile.contents.find(e => e.type === EntityType.ZOMBIE);
      const rabbit = targetTile.contents.find(e => e.type === EntityType.RABBIT);
      setHoveredTile({
        x, y, apCost: isRemoteView ? 0 : apCost,
        isRemoteView,
        canAfford: !isRemoteView && isPossible && !engine.movementLocked && player.ap >= apCost,
        zombie: zombie ? { subtype: zombie.subtype, hp: zombie.hp, maxHp: zombie.maxHp, currentAP: zombie.currentAP, maxAP: zombie.maxAP } : (data?.zombie || null),
        rabbit: rabbit ? { id: rabbit.id, type: rabbit.type, hp: rabbit.hp, maxHp: rabbit.maxHp, currentAP: rabbit.currentAP, maxAP: rabbit.maxAP } : (data?.rabbit || null),
        cropInfo: targetTile.cropInfo || data?.cropInfo || null,
        lootItems: targetTile.inventoryItems || null,
        specialBuilding: targetTile.contents.find(e => e.type === EntityType.PLACE_ICON)?.subtype || null,
        door: door,
        window: windowEntity,
        npc: targetTile.contents.find(e => e.type === EntityType.NPC),
        drone: hoveredDrone
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
        if (typeof cancelMovement === 'function') {
            console.log('[GameMapContext] Cancelling ongoing player movement prior to map transition');
            cancelMovement();
        }
        
        // 1. Save old map
        if (inventoryManager) {
            // Phase 25: Flush items to old map, carrying only the dragged item
            inventoryManager.flushGroundItems(engine.gameMap);
        }
        engine.worldManager.saveCurrentMap(engine.gameMap, engine.worldManager.currentMapId, turn);

        // 2. Perform transition
        const result = await engine.worldManager.executeTransition(
          transitionInfo.nextMapId,
          transitionInfo.spawnPosition,
          turn,
          transitionInfo.isCustom ? { targetType: transitionInfo.targetType, targetId: transitionInfo.nextMapId, level: transitionInfo.level } : null
        );
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
        // Any deployed drone belongs to the map being left behind — return
        // control to the player rather than leave activeDeviceId pointing at
        // an entity that no longer exists on the new map.
        engine.activeDeviceId = null;
        // Standing orders are keyed the same way and go stale for the same
        // reason. WagonSystem prunes unresolvable ones on the next end-turn,
        // but the destination markers are drawn straight from this map — left
        // in place they'd paint a phantom crosshair on the new map's tiles.
        engine.autoWagonOrders?.clear();

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