import { Pathfinding } from '../utils/Pathfinding.js';
import { isTerrainWalkable } from '../map/TerrainTypes.js';
import { EntityType } from '../entities/Entity.js';
import { TURRET_DEF_ID, isTurretPassableBy } from '../ai/TurretCombat.js';
import { VehicleUtils } from '../utils/VehicleUtils.js';
import { RcVehicleConfig } from '../config/RcVehicleConfig.js';
import { getActiveRcVehicle, driveBlockedReason } from './RcVehicle.js';
import { tweenAlongPath } from './RemoteTween.js';

/**
 * Click-to-drive for the active RC wagon. A player-turn action outside the
 * simulation loop — same as the player's own movement — so this is called
 * directly from GameMapContext, not through TurnManager.
 *
 * The wagon ROLLS, which is the opposite of the drone's "high ceilings
 * everywhere" rule: terrain, walls, closed doors and blocking entities all stop
 * it. Two exemptions — it can't block itself, and the player's own tile is
 * always a legal destination, because recalling the wagon to your feet is the
 * whole point of fitting a receiver.
 *
 * The Item, not the map entity, is canonical for the duration of a drive. An
 * on-map wagon entity holds raw JSON attachments, so the battery it spends has
 * to be spent on the real Item and that Item re-placed at the destination — the
 * same remove-and-place dance launch()/land() do for the drone.
 */

/** Mirrors Tile.isWalkable's content rules, minus the wagon and the player. */
function makeRcFilter(engine, wagonKey) {
  const playerId = engine?.player?.id;

  return (tile) => {
    if (!tile) return false;

    // An open door on an otherwise solid tile is still a way in.
    const hasEntry = tile.contents.some(e =>
      (e.type === EntityType.DOOR || e.type === EntityType.GARAGE_DOOR) && e.isOpen
    );
    if (!isTerrainWalkable(tile.terrain) && !hasEntry) return false;

    for (const e of tile.contents) {
      // Edge-anchored structures sit on tile boundaries; blocking for those is
      // Pathfinding.isEdgeBlocked's job, not the tile's.
      if ((e.type === EntityType.DOOR || e.type === EntityType.WINDOW || e.type === EntityType.GARAGE_DOOR)
          && e.edge !== undefined) continue;
      if ((e.type === EntityType.DOOR || e.type === EntityType.GARAGE_DOOR) && e.isOpen) continue;

      // The wagon never blocks itself, and it can always come home to you.
      if (e.instanceId === wagonKey || e.id === wagonKey) continue;
      if (playerId && e.id === playerId) continue;

      if (e.defId === TURRET_DEF_ID) {
        if (isTurretPassableBy(e, engine?.player)) continue;
        return false;
      }

      if (e.blocksMovement) return false;
    }

    return true;
  };
}

function findRcPath(device, x, y, engine) {
  return Pathfinding.findPath(
    engine.gameMap,
    device.x, device.y,
    x, y,
    { allowDiagonal: true, entityFilter: makeRcFilter(engine, device.item.instanceId) }
  );
}

/**
 * Cost preview for the hover tooltip — must return the exact same numbers
 * driveActiveVehicle will charge, or the preview and the real cost drift.
 * @returns {{possible: boolean, tiles?: number, apCost?: number, canAfford?: boolean, reason?: string}|null}
 */
export function previewDriveCost(x, y, engine) {
  const device = getActiveRcVehicle(engine);
  if (!device) return null;

  const reason = driveBlockedReason(device.item, engine);
  if (reason) return { possible: false, reason };

  const path = findRcPath(device, x, y, engine);
  if (path.length === 0) return { possible: false, reason: 'No path' };

  // findPath's return includes the start tile (path[0]) — the number of actual
  // steps is one less than the node count.
  const tiles = path.length - 1;
  const apCost = VehicleUtils.calculateRemoteDriveCost(device.item, path, engine.gameMap);
  const canAfford = engine.player ? engine.player.ap >= apCost : false;

  return { possible: true, tiles, apCost, canAfford };
}

/**
 * Lift the wagon out of whichever home it occupies and put a render ghost on
 * the map at its current tile. Afterwards the item exists in exactly one place
 * (the caller's `item` reference) plus one disposable entity, so a save taken
 * mid-drive can't duplicate or lose it.
 * @returns {Object|null} the on-map entity to animate
 */
function materializeGhost(device, engine) {
  if (device.source === 'map') return device.entity;

  const inv = engine.inventoryManager;
  const gameMap = engine.gameMap;

  // Destroy-then-place, back to back and synchronously: syncWithMap early-returns
  // while the player is stationary, and finishDrive clears the tile again a few
  // hundred milliseconds later.
  inv.destroyItem(device.item.instanceId);
  const existing = gameMap.getItemsOnTile(device.x, device.y) || [];
  gameMap.setItemsOnTile(device.x, device.y, [...existing, device.item.toJSON()]);

  return gameMap.getEntity(device.item.instanceId);
}

/**
 * Authoritative placement: destroy the ghost, put the real Item at the target.
 * dropItemAtLocation handles the "target is the player's own tile" case (see
 * GroundManager.placeItemAtTile), so recalling the wagon to your feet doesn't
 * need a branch here.
 */
function finishDrive(device, ghost, x, y, engine) {
  const inv = engine.inventoryManager;
  const gameMap = engine.gameMap;

  if (ghost) gameMap.removeEntity(ghost.id);
  inv.dropItemAtLocation(device.item, x, y, gameMap);

  engine.isDeviceAnimating = false;
  engine.invalidateFOV?.();
  engine.recalculateFOV?.();
  engine.notifyUpdate?.();
}

/**
 * Drive the active RC wagon to (x, y): spend player AP + the wagon's motor
 * batteries, then tween it along the path.
 *
 * `engine.activeDeviceId` is left alone throughout — it's the item's
 * instanceId, which is stable across both homes and the ghost.
 */
export function driveActiveVehicle(x, y, engine) {
  const device = getActiveRcVehicle(engine);
  const player = engine?.player;
  if (!device || !player || !engine.gameMap) {
    return Promise.resolve({ success: false, reason: 'No active device' });
  }

  const blocked = driveBlockedReason(device.item, engine);
  if (blocked) return Promise.resolve({ success: false, reason: blocked });

  const path = findRcPath(device, x, y, engine);
  if (path.length <= 1) return Promise.resolve({ success: false, reason: 'No path' });

  const tiles = path.length - 1;
  const apCost = VehicleUtils.calculateRemoteDriveCost(device.item, path, engine.gameMap);

  if (apCost > player.ap) return Promise.resolve({ success: false, reason: 'Not enough AP' });
  if (!player.useAP(apCost)) return Promise.resolve({ success: false, reason: 'Not enough AP' });

  // No battery pre-check: consumeMotorPower clamps at zero, exactly as it does
  // when the wagon is hand-dragged. Driving until the batteries die at the far
  // end of the map is the intended consequence, not an error state.
  device.item.consumeMotorPower(tiles);

  const ghost = materializeGhost(device, engine);
  const target = path[path.length - 1];
  const result = { success: true, tiles, apCost };

  // No ghost means nothing to animate (the tile write failed); the wagon still
  // has to arrive, or the AP and charge were spent for nothing.
  if (!ghost) {
    finishDrive(device, null, target.x, target.y, engine);
    return Promise.resolve(result);
  }

  return tweenAlongPath(ghost, path, engine, { msPerTile: RcVehicleConfig.MS_PER_TILE },
    () => finishDrive(device, ghost, target.x, target.y, engine)
  ).then(() => result);
}
