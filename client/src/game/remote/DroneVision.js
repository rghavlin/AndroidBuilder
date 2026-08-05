import { LineOfSight } from '../utils/LineOfSight.js';
import { RcVehicleConfig } from '../config/RcVehicleConfig.js';
import { hasReceiver } from './RemoteDeviceKinds.js';

/**
 * Merges remote devices into the player's FOV — conceptually the rifle
 * scope's range extension, except the center is mobile and can leave the
 * player's own sight radius entirely. Tiles stay lit only while a device is
 * actually there; GameEngine.recalculateFOV's existing explored-flag pass
 * handles the rest once these tiles are unioned in.
 *
 * Deliberately imports nothing from entities/Entity.js or the RcVehicle layer:
 * this module is pulled in by GameEngine.js itself, and Entity.js/Item.js reach
 * back to the engine singleton — either import would close a cycle. The literal
 * 'drone'/'item' strings are EntityType values, and RemoteDeviceKinds is
 * dependency-free for exactly this reason.
 */
const DRONE_TYPE = 'drone';
const ITEM_TYPE = 'item';

/**
 * Every device contributing FOV right now, as {id, entity, range, key}.
 *
 * Drones see wherever they are, always — they're airborne and the player is
 * watching a live feed. An RC wagon only sees while the phone is actually
 * linked to it, at a fixed short range: it's a camera bolted to a cart, so it
 * doesn't get better at night just because the player is holding a flashlight.
 * `key` is a range-identity token for the dedupe hash — see deviceFovHashPart.
 */
function visionSources(gameMap, engine, baseRange) {
  if (!gameMap || typeof gameMap.getEntitiesByType !== 'function') return [];

  const sources = (gameMap.getEntitiesByType(DRONE_TYPE) || []).map(d => ({
    id: d.id,
    entity: d,
    range: baseRange + (d.sightBonus ?? 0),
    key: `d${d.sightBonus ?? 0}`
  }));

  // A wagon in the ground container is at the player's feet and has no entity,
  // so getEntity finds nothing and it correctly contributes no extra vision.
  const activeKey = engine?.activeDeviceId;
  const active = activeKey ? gameMap.getEntity?.(activeKey) : null;
  if (active && active.type === ITEM_TYPE && hasReceiver(active)) {
    sources.push({ id: active.id, entity: active, range: RcVehicleConfig.SIGHT_RANGE, key: 'rc' });
  }

  return sources;
}

/**
 * The tile a device sees from. Prefers the RENDER position so vision travels
 * with the sprite during a flight tween (logicalX/Y only updates at the final
 * snap, which would leave the drone's FOV stuck at its origin for the whole
 * flight). Outside a tween the two are identical — moveTo keeps them in sync.
 * Shared by both exports so the dedupe hash and the FOV can never disagree.
 */
function devicePos(device) {
  const rx = Number.isFinite(device.renderX) ? device.renderX : device.logicalX;
  const ry = Number.isFinite(device.renderY) ? device.renderY : device.logicalY;
  return { x: Math.round(rx), y: Math.round(ry) };
}

/**
 * Extra term folded into GameEngine's FOV dedupe hash so a moving device
 * always forces a repaint even when the player hasn't moved (the hash was
 * keyed on the player's tile only — the single sharpest trap in this
 * feature, see plan). Empty string when nothing is deployed, so the common
 * case doesn't touch the hash at all.
 *
 * Uses each source's `key` rather than its resolved range, so the part stays
 * independent of baseRange — GameEngine's outer hash already covers that.
 */
export function deviceFovHashPart(gameMap, engine) {
  const sources = visionSources(gameMap, engine, 0);
  if (sources.length === 0) return '';
  return sources
    .map(s => {
      const { x, y } = devicePos(s.entity);
      return `${s.id}:${x},${y},${s.key}`;
    })
    .join('|');
}

/**
 * Visible-tile list for every contributing device. Drones see at the player's
 * own effective sight range (`baseRange` — already adjusted for
 * day/night/weather/scope by the caller) plus their own bonus; an RC wagon sees
 * at its own fixed range. Returns [] with zero cost when nothing is deployed.
 */
export function collectDeviceFov(gameMap, baseRange, engine) {
  const sources = visionSources(gameMap, engine, baseRange);
  if (sources.length === 0) return [];

  const tiles = [];
  for (const source of sources) {
    const { x, y } = devicePos(source.entity);
    const fov = LineOfSight.calculateFieldOfView(gameMap, { x, y, id: source.id }, { maxRange: source.range });
    tiles.push(...fov.visibleTiles);
  }
  return tiles;
}
