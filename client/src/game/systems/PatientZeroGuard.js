import { ItemDefs } from '../inventory/ItemDefs.js';
import { TURRET_DEF_ID } from '../ai/TurretCombat.js';
import { computeTollGateLayout } from '../map/TollGate.js';
import { getTownTurretPositions } from '../map/MapUtils.js';
import { PATIENT_ZERO_SUBTYPE } from '../entities/ZombieTypes.js';

/**
 * Keeps Patient Zero out of range of the map's non-player turrets.
 *
 * Patient Zero is the run's single unique zombie (map 5) and the player has to
 * find it. Town-faction turrets shoot zombies unconditionally, so if it wanders
 * into the town square (or up to the tollgate) it is gunned down before the
 * player ever meets it. Rather than special-casing the turrets, Patient Zero
 * treats every tile within turret range (plus a buffer) as off-limits: it is
 * never spawned there and the AI refuses any step into it.
 *
 * The zone is built from two sources, merged:
 *  - planned positions derived from map metadata (town compound + tollgate), so
 *    it is correct at spawn time, before the turrets are actually placed, and
 *    while the player stands on a turret's tile (which detaches the turret
 *    from the map into the ground container);
 *  - a live scan of on-map non-player turret items, to cover any others.
 */

// Tiles of margin beyond the turret's firing range.
const KEEP_OUT_BUFFER = 2;

/** @returns {number} the radius (Euclidean tiles) Patient Zero must stay beyond */
function keepOutRadius() {
  const maxRange = ItemDefs[TURRET_DEF_ID]?.turretStats?.maxRange ?? 15;
  return maxRange + KEEP_OUT_BUFFER;
}

function plannedTurretPositions(gameMap) {
  const positions = getTownTurretPositions(gameMap);
  if (gameMap.metadata?.tollGate) {
    const centerX = Math.floor(gameMap.width / 2);
    const exit = gameMap.metadata?.exits?.north || { x: centerX, y: 0 };
    positions.push(...computeTollGateLayout(exit, { edge: 'north' }).turrets);
  }
  return positions;
}

function liveTurretPositions(gameMap) {
  const positions = [];
  for (const item of gameMap.getEntitiesByType?.('item') || []) {
    if (!item || item.defId !== TURRET_DEF_ID) continue;
    if (!item.factionId || item.factionId === 'player') continue;
    if (item.logicalX === undefined || item.logicalY === undefined) continue;
    positions.push({ x: item.logicalX, y: item.logicalY });
  }
  return positions;
}

/**
 * Build the keep-out zone for a map. Cheap enough to rebuild once per AI pass.
 * @param {GameMap} gameMap
 * @returns {{turrets: {x:number,y:number}[], radius: number}}
 */
export function getTurretKeepOutZone(gameMap) {
  const seen = new Set();
  const turrets = [];
  for (const p of [...plannedTurretPositions(gameMap), ...liveTurretPositions(gameMap)]) {
    const key = `${p.x},${p.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    turrets.push(p);
  }
  return { turrets, radius: keepOutRadius() };
}

/** Euclidean distance from (x, y) to the nearest turret in the zone. */
function nearestTurretDistance(zone, x, y) {
  let best = Infinity;
  for (const t of zone.turrets) {
    const d = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
    if (d < best) best = d;
  }
  return best;
}

/** Whether (x, y) lies within turret range (plus buffer) of any turret. */
export function isInTurretKeepOut(zone, x, y) {
  return nearestTurretDistance(zone, x, y) <= zone.radius;
}

export function isPatientZero(entity) {
  return entity?.type === 'zombie' && entity.subtype === PATIENT_ZERO_SUBTYPE;
}

/**
 * Whether Patient Zero may step from (fromX, fromY) to (toX, toY). Steps
 * outside the zone are always fine. Steps inside it are refused, except one
 * that moves further from the nearest turret — so a Patient Zero that is
 * already inside (e.g. an older save) can still walk back out.
 */
export function isPatientZeroStepAllowed(zone, fromX, fromY, toX, toY) {
  const toDist = nearestTurretDistance(zone, toX, toY);
  if (toDist > zone.radius) return true;
  return toDist > nearestTurretDistance(zone, fromX, fromY);
}
