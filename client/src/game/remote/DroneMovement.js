import { Pathfinding } from '../utils/Pathfinding.js';
import { isTerrainFlyable } from '../map/TerrainTypes.js';
import { DroneConfig } from '../config/DroneConfig.js';
import { canAffordFlight, consumeFlightCharge } from './DronePower.js';
import { getActiveDevice } from './RemoteDeviceRegistry.js';
import { tweenAlongPath } from './RemoteTween.js';

/**
 * Click-to-fly for the active remote device. A player-turn action outside
 * the simulation loop — same as the player's own movement — so this is
 * called directly from GameMapContext, not through TurnManager.
 *
 * The drone flies over every entity (zombies, NPCs, the player); only
 * full-height terrain and edge structures (walls, closed doors/windows — the
 * latter already enforced inside Pathfinding.findPath itself) block it. This
 * is the "high ceilings everywhere" rule: normal terrain/LOS pathing, no
 * entity-blocking at all.
 *
 * The gate is isTerrainFlyable, NOT isTerrainWalkable: a drone crosses and
 * hovers over low terrain a walker can't (a fence, open water). It must stay
 * in lockstep with the options.flying branch of Tile.isWalkable — a tile the
 * path can reach but moveEntity then refuses leaves the drone's logical
 * position behind its rendered one, which reads in-game as the drone
 * teleporting back to where it was before every subsequent move.
 */
const droneEntityFilter = (tile) => !!tile && isTerrainFlyable(tile.terrain);

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
  const drone = getActiveDevice(engine);
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

// Flight tween pacing; the tween itself lives in RemoteTween, shared with the
// RC wagon so the two never drift into different motion languages.
const MS_PER_TILE = 110;

/** Snap the drone to the end of the path — the authoritative placement. */
function finishFlight(drone, path, engine) {
  const final = path[path.length - 1];
  const placed = engine.gameMap.moveEntity(drone.id, final.x, final.y, { flying: true, skipEdgeCheck: true });
  if (!placed) {
    // The tween has already dragged the render coords onto the target. If the
    // placement is refused anyway, snap them back to where the drone actually
    // is rather than leaving it drawn a tile (or ten) from its logical
    // position: that silent desync is what surfaced as the drone teleporting
    // back to its old tile at the start of its next flight, and as it landing
    // somewhere it was never shown to be.
    console.warn(`[DroneMovement] placement at (${final.x}, ${final.y}) refused; drone stays at (${drone.logicalX}, ${drone.logicalY})`);
    drone.renderX = drone.logicalX;
    drone.renderY = drone.logicalY;
  }
  drone.movementPath = [];
  drone.isAnimating = false;
  // engine.isDeviceAnimating is owned by RemoteTween's reference count — do not
  // clear it here, or a second concurrent tween loses its render loop.
  engine.recalculateFOV?.();
  engine.notifyUpdate?.();
}

/**
 * Fly the active device to (x, y): spend player AP + drone battery charge,
 * then tween it along the path.
 *
 * Cost and charge are settled up front, then RemoteTween interpolates the whole
 * path (mirroring PlayerContext.smoothAnimateMovement) with a single
 * authoritative moveEntity snap at the end.
 */
export function moveActiveDevice(x, y, engine) {
  const drone = getActiveDevice(engine);
  const player = engine?.player;
  if (!drone || !player || !engine.gameMap) {
    return Promise.resolve({ success: false, reason: 'No active device' });
  }

  const path = findDronePath(drone, x, y, engine);
  if (path.length === 0) return Promise.resolve({ success: false, reason: 'No path' });

  // findPath's return includes the start tile (path[0]) — see previewMoveCost.
  const tiles = path.length - 1;
  const apPerTile = drone.apPerTile ?? DroneConfig.AP_PER_TILE;
  const apCost = Math.round(tiles * apPerTile * 10) / 10;

  if (apCost > player.ap) return Promise.resolve({ success: false, reason: 'Not enough AP' });
  if (!canAffordFlight(drone, tiles)) {
    return Promise.resolve({ success: false, reason: 'Not enough battery charge' });
  }

  if (!player.useAP(apCost)) return Promise.resolve({ success: false, reason: 'Not enough AP' });
  if (!consumeFlightCharge(drone, tiles)) {
    // Unreachable given the canAffordFlight pre-check, but never leave AP
    // spent with nothing to show for it.
    player.restoreAP(apCost);
    return Promise.resolve({ success: false, reason: 'Not enough battery charge' });
  }

  const result = { success: true, tiles, apCost };

  return tweenAlongPath(drone, path, engine, { msPerTile: MS_PER_TILE },
    () => finishFlight(drone, path, engine)
  ).then(() => result);
}
