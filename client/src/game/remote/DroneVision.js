import { LineOfSight } from '../utils/LineOfSight.js';

/**
 * Merges airborne devices into the player's FOV — conceptually the rifle
 * scope's range extension, except the center is mobile and can leave the
 * player's own sight radius entirely. Tiles stay lit only while a device is
 * actually there; GameEngine.recalculateFOV's existing explored-flag pass
 * handles the rest once these tiles are unioned in.
 *
 * Deliberately imports nothing from entities/Entity.js: this module is
 * pulled in by GameEngine.js itself, and Entity.js imports the engine
 * singleton — importing Entity's EntityType here would create a cycle back
 * into GameEngine.js. The literal 'drone' string is EntityType.DRONE's value.
 */
const DRONE_TYPE = 'drone';

function listAirborneDevices(gameMap) {
  if (!gameMap || typeof gameMap.getEntitiesByType !== 'function') return [];
  return gameMap.getEntitiesByType(DRONE_TYPE) || [];
}

/**
 * Extra term folded into GameEngine's FOV dedupe hash so a moving drone
 * always forces a repaint even when the player hasn't moved (the hash was
 * keyed on the player's tile only — the single sharpest trap in this
 * feature, see plan). Empty string when nothing is deployed, so the common
 * case doesn't touch the hash at all.
 */
export function deviceFovHashPart(gameMap) {
  const devices = listAirborneDevices(gameMap);
  if (devices.length === 0) return '';
  return devices
    .map(d => `${d.id}:${Math.round(d.logicalX)},${Math.round(d.logicalY)},${d.sightBonus ?? 0}`)
    .join('|');
}

/**
 * Visible-tile list for every airborne device, at the player's own effective
 * sight range (`baseRange` — already adjusted for day/night/weather/scope by
 * the caller) plus each device's own bonus. Returns [] with zero cost when
 * nothing is deployed.
 */
export function collectDeviceFov(gameMap, baseRange) {
  const devices = listAirborneDevices(gameMap);
  if (devices.length === 0) return [];

  const tiles = [];
  for (const drone of devices) {
    const range = baseRange + (drone.sightBonus ?? 0);
    const x = Math.round(drone.logicalX);
    const y = Math.round(drone.logicalY);
    const fov = LineOfSight.calculateFieldOfView(gameMap, { x, y, id: drone.id }, { maxRange: range });
    tiles.push(...fov.visibleTiles);
  }
  return tiles;
}
