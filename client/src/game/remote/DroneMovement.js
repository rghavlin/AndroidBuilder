import { Pathfinding } from '../utils/Pathfinding.js';
import { isTerrainWalkable } from '../map/TerrainTypes.js';
import { DroneConfig } from '../config/DroneConfig.js';
import { canAffordFlight, consumeFlightCharge } from './DronePower.js';
import { getActiveDevice } from './RemoteDeviceRegistry.js';

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

// Flight tween pacing. One continuous tween across the WHOLE path (like the
// player's smoothAnimateMovement) rather than a per-tile animation — stepping
// tile-by-tile reads as choppy because the camera jumps a full tile at a time
// and the render loop can go idle between steps.
const MS_PER_TILE = 110;
const MIN_FLIGHT_MS = 300;
const MAX_FLIGHT_MS = 1200;

// Same ease-in/ease-out curve the player's movement uses, so a drone flight
// reads as the same "thing moving" motion language.
function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Snap the drone to the end of the path with no tween (headless / no rAF). */
function finishFlight(drone, path, engine) {
  const final = path[path.length - 1];
  engine.gameMap.moveEntity(drone.id, final.x, final.y, { flying: true, skipEdgeCheck: true });
  drone.movementPath = [];
  drone.isAnimating = false;
  engine.isDeviceAnimating = false;
  engine.recalculateFOV?.();
  engine.notifyUpdate?.();
}

/**
 * Fly the active device to (x, y): spend player AP + drone battery charge,
 * then tween it along the path.
 *
 * Mirrors PlayerContext.smoothAnimateMovement: one rAF loop interpolating the
 * whole path, driving the drone's render position and the camera every frame,
 * with a single authoritative moveEntity snap at the end. Notes:
 *  - `engine.isDeviceAnimating` keeps MapCanvas's gated render loop in
 *    continuous mode for the duration (it has no React state for devices).
 *  - FOV is recalculated per frame, but GameEngine's options-hash dedupe (which
 *    includes each device's ROUNDED tile) makes that a no-op until the drone
 *    actually crosses a tile boundary. Do NOT call invalidateFOV() here — that
 *    would defeat the dedupe and force a full shadowcast every frame.
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

  // Headless (tests / Node): no rAF to tween on — snap straight to the target.
  if (typeof requestAnimationFrame === 'undefined') {
    finishFlight(drone, path, engine);
    return Promise.resolve(result);
  }

  const duration = Math.min(MAX_FLIGHT_MS, Math.max(MIN_FLIGHT_MS, tiles * MS_PER_TILE));
  const startTime = performance.now();

  // Drive render coords directly and leave movementPath empty so EntityRenderer
  // falls through to entity.x/entity.y rather than running its own competing
  // animationProgress interpolation.
  drone.movementPath = [];
  drone.isAnimating = true;
  engine.isDeviceAnimating = true;

  return new Promise((resolve) => {
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const p = ease(progress) * (path.length - 1);
      const idx = Math.floor(p);
      const frac = p - idx;
      const curr = path[idx];
      const next = path[Math.min(idx + 1, path.length - 1)];

      const smoothX = curr.x + (next.x - curr.x) * frac;
      const smoothY = curr.y + (next.y - curr.y) * frac;

      drone.renderX = smoothX;
      drone.renderY = smoothY;
      engine.camera?.centerOn(smoothX, smoothY);
      engine.recalculateFOV?.();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        finishFlight(drone, path, engine);
        resolve(result);
      }
    };
    requestAnimationFrame(animate);
  });
}
