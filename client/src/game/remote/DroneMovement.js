import { Pathfinding } from '../utils/Pathfinding.js';
import { isTerrainWalkable } from '../map/TerrainTypes.js';
import { DroneConfig } from '../config/DroneConfig.js';
import { canAffordFlight, consumeFlightCharge } from './DronePower.js';

/**
 * Click-to-fly for the active remote device. A player-turn action outside
 * the simulation loop — same as the player's own movement — so this is
 * called directly from GameMapContext, not through TurnManager.
 *
 * The drone flies over every entity (zombies, NPCs, the player); only
 * terrain and edge structures (walls, closed doors/windows — the latter
 * already enforced inside Pathfinding.findPath itself) block it. This is
 * the "high ceilings everywhere" rule: normal terrain/LOS pathing, no
 * entity-blocking at all.
 */
const droneEntityFilter = (tile) => !!tile && isTerrainWalkable(tile.terrain);

function getActiveDrone(engine) {
  if (!engine?.activeDeviceId || !engine.gameMap) return null;
  const entity = engine.gameMap.getEntity(engine.activeDeviceId);
  return (entity && entity.type === 'drone') ? entity : null;
}

function findDronePath(drone, x, y, engine) {
  return Pathfinding.findPath(
    engine.gameMap,
    Math.round(drone.logicalX), Math.round(drone.logicalY),
    x, y,
    { allowDiagonal: true, entityFilter: droneEntityFilter }
  );
}

/**
 * Cost preview for the hover tooltip — must return the exact same numbers
 * moveActiveDevice will charge, or the preview and the real cost drift.
 */
export function previewMoveCost(x, y, engine) {
  const drone = getActiveDrone(engine);
  if (!drone) return null;

  const path = findDronePath(drone, x, y, engine);
  if (path.length === 0) return { possible: false };

  // findPath's return includes the start tile (path[0]) — the number of
  // actual flight steps is one less than the node count.
  const tiles = path.length - 1;
  const apPerTile = drone.apPerTile ?? DroneConfig.AP_PER_TILE;
  const apCost = Math.round(tiles * apPerTile * 10) / 10;
  const canAffordAp = engine.player ? engine.player.ap >= apCost : false;
  const canAffordCharge = canAffordFlight(drone, tiles);

  return { possible: true, tiles, apCost, canAfford: canAffordAp && canAffordCharge };
}

/**
 * Fly the active device to (x, y): spend player AP + drone battery charge,
 * then animate the path tile by tile, recentering the camera and FOV as it
 * goes (mirrors the player's own smoothAnimateMovement in spirit, but the
 * drone's SequencerAction-driven playAction handles the animation itself).
 */
export async function moveActiveDevice(x, y, engine) {
  const drone = getActiveDrone(engine);
  const player = engine?.player;
  if (!drone || !player || !engine.gameMap) return { success: false, reason: 'No active device' };

  const path = findDronePath(drone, x, y, engine);
  if (path.length === 0) return { success: false, reason: 'No path' };

  // findPath's return includes the start tile (path[0]) — see previewMoveCost.
  const tiles = path.length - 1;
  const apPerTile = drone.apPerTile ?? DroneConfig.AP_PER_TILE;
  const apCost = Math.round(tiles * apPerTile * 10) / 10;

  if (apCost > player.ap) return { success: false, reason: 'Not enough AP' };
  if (!canAffordFlight(drone, tiles)) return { success: false, reason: 'Not enough battery charge' };

  if (!player.useAP(apCost)) return { success: false, reason: 'Not enough AP' };
  if (!consumeFlightCharge(drone, tiles)) {
    // Unreachable given the canAffordFlight pre-check, but never leave AP
    // spent with nothing to show for it.
    player.restoreAP(apCost);
    return { success: false, reason: 'Not enough battery charge' };
  }

  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    await drone.playAction({ type: 'MOVE', data: { from, to } });
    engine.gameMap.moveEntity(drone.id, to.x, to.y, { flying: true });
    engine.camera?.centerOn(to.x, to.y);
    engine.invalidateFOV?.();
    engine.recalculateFOV?.();
  }

  engine.notifyUpdate?.();
  return { success: true, tiles, apCost };
}
