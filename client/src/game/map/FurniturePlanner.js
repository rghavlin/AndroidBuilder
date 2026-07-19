import { gameRandom } from '../utils/SeededRandom.js';
import { makeGameMapGrid, findRooms, assignRoles } from './RoomGraph.js';

/**
 * FurniturePlanner - Places decorative floorplan-style furniture outlines in
 * residential buildings. Purely visual: pieces live in gameMap.furniture as
 * {type, x, y, w, h, rot} and are drawn by TileRenderer.drawFurniture in a
 * dedicated MapCanvas pass. No collision, no gameplay effect.
 *
 * rot is quarter-turns clockwise (0-3) from the base orientation ("head" at
 * top). x/y anchor the top-left of the ROTATED footprint; w/h are the rotated
 * footprint in tiles.
 *
 * Room roles come from building.rooms (tagged authoritatively at generation by
 * MapBuilder). When that data is absent (e.g. hand-built test maps), we fall
 * back to classifying rooms here so behaviour degrades gracefully.
 */

// Base (unrotated) footprints in tiles, matching TileRenderer's drawings.
export const FURNITURE_FOOTPRINTS = {
  bed: { w: 2, h: 3 },
  table: { w: 2, h: 3 },
  couch: { w: 3, h: 1 },
  desk: { w: 2, h: 1 },
  counter: { w: 2, h: 1 },
  bathtub: { w: 1, h: 2 },
  toilet: { w: 1, h: 1 },
};

// Per-role furnishing plan. Each entry names a piece, the placement strategy
// that decides where it looks right, and an optional minimum room area.
//   wall   - backs flush against a wall (couches, baths)
//   corner - tucked into a corner, two perpendicular walls (desks, beds, counters)
//   center - stands free with clearance on all sides (dining tables)
const FURNISH_PLAN = {
  living: [
    { type: 'couch', strategy: 'wall' },
    { type: 'table', strategy: 'center' },
  ],
  bedroom: [
    { type: 'bed', strategy: 'corner' },
    // Only add a desk when the room is roomy enough to keep a gap from the bed,
    // so bedrooms don't become a bed+desk cluster.
    { type: 'desk', strategy: 'corner', minArea: 14 },
  ],
  bathroom: [
    { type: 'toilet', strategy: 'corner' },
    { type: 'bathtub', strategy: 'wall' },
  ],
  kitchen: [
    { type: 'counter', strategy: 'corner' },
    { type: 'table', strategy: 'center', minArea: 12 },
  ],
  hall: [],
};

const HEAD_SIDE = ['n', 'e', 's', 'w']; // side the piece's head faces per rotation

/**
 * Whether a room's bounding box is large enough for a given furniture piece to
 * look sensible (not merely physically fit).
 */
function roomCanHold(room, type) {
  if (room.shape === 'hall') return false;
  const width = room.maxX - room.minX + 1;
  const height = room.maxY - room.minY + 1;
  const minSpan = Math.min(width, height);
  const maxSpan = Math.max(width, height);

  switch (type) {
    case 'table':
    case 'bed':
      return minSpan >= 2 && maxSpan >= 3;
    case 'couch':
      return minSpan >= 2 && maxSpan >= 3;
    case 'desk':
    case 'counter':
    case 'bathtub':
      return maxSpan >= 2;
    case 'toilet':
      return true;
    default:
      return true;
  }
}

/**
 * Hard placement constraints: footprint on room floor, unoccupied, no items
 * beneath, clear of doorways, and not straddling an internal edge wall.
 */
function footprintPlaceable(gameMap, grid, room, occupied, ax, ay, fw, fh) {
  for (let y = ay; y < ay + fh; y++) {
    for (let x = ax; x < ax + fw; x++) {
      if (!room.tiles.has(`${x},${y}`)) return false;
      if (occupied.has(`${x},${y}`)) return false;
      const items = gameMap.getItemsOnTile ? gameMap.getItemsOnTile(x, y) : [];
      if (items && items.length > 0) return false;
      // Keep a one-tile berth around every doorway so nothing blocks traffic.
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (grid.doorAt(x + dx, y + dy)) return false;
        }
      }
      if (x + 1 < ax + fw && grid.edgeWallAt(x, y, 'e')) return false;
      if (x + 1 < ax + fw && grid.edgeWallAt(x + 1, y, 'w')) return false;
      if (y + 1 < ay + fh && grid.edgeWallAt(x, y, 's')) return false;
      if (y + 1 < ay + fh && grid.edgeWallAt(x, y + 1, 'n')) return false;
    }
  }
  return true;
}

/** Which faces of the footprint back onto a room boundary (wall or exterior). */
function contactSides(room, ax, ay, fw, fh) {
  const inRoom = (x, y) => room.tiles.has(`${x},${y}`);
  let n = true, s = true, e = true, w = true;
  for (let x = ax; x < ax + fw; x++) {
    if (inRoom(x, ay - 1)) n = false;
    if (inRoom(x, ay + fh)) s = false;
  }
  for (let y = ay; y < ay + fh; y++) {
    if (inRoom(ax - 1, y)) w = false;
    if (inRoom(ax + fw, y)) e = false;
  }
  return { n, s, e, w };
}

/** Count of surrounding-ring tiles that are room floor — higher = more central. */
function ringOpenness(room, ax, ay, fw, fh) {
  const inRoom = (x, y) => room.tiles.has(`${x},${y}`);
  let open = 0;
  for (let x = ax - 1; x <= ax + fw; x++) {
    if (inRoom(x, ay - 1)) open++;
    if (inRoom(x, ay + fh)) open++;
  }
  for (let y = ay; y < ay + fh; y++) {
    if (inRoom(ax - 1, y)) open++;
    if (inRoom(ax + fw, y)) open++;
  }
  return open;
}

/**
 * Score a candidate placement for a strategy. Returns {ok, score}; higher score
 * is a better spot. `ok:false` means the candidate violates the strategy.
 */
function scoreCandidate(room, ax, ay, fw, fh, rot, strategy) {
  const c = contactSides(room, ax, ay, fw, fh);
  const contactCount = (c.n ? 1 : 0) + (c.s ? 1 : 0) + (c.e ? 1 : 0) + (c.w ? 1 : 0);
  const hasCorner = (c.n && c.e) || (c.e && c.s) || (c.s && c.w) || (c.w && c.n);
  const headFlush = c[HEAD_SIDE[rot]];
  const openness = ringOpenness(room, ax, ay, fw, fh);

  switch (strategy) {
    case 'wall':
      // Back (head) against a wall; prefer more wall contact, penalise corners
      // slightly so wall pieces spread out rather than all bunching in corners.
      if (!headFlush) return { ok: false, score: 0 };
      return { ok: true, score: 100 + contactCount * 2 - (hasCorner ? 1 : 0) };
    case 'corner':
      // Two perpendicular walls; head against a wall for directional pieces.
      if (!hasCorner || !headFlush) return { ok: false, score: 0 };
      return { ok: true, score: 200 + contactCount };
    case 'center':
      // Free-standing with clearance. Prefer fully detached; fall back to at
      // most one wall touch in rooms too tight to float furniture.
      if (contactCount === 0) return { ok: true, score: 300 + openness };
      if (contactCount === 1) return { ok: true, score: 150 + openness };
      return { ok: false, score: 0 };
    default:
      return { ok: true, score: 1 };
  }
}

/** True if the footprint keeps `gap` empty tiles clear of existing furniture. */
function clearOfOccupied(occupied, ax, ay, fw, fh, gap) {
  for (let y = ay - gap; y < ay + fh + gap; y++) {
    for (let x = ax - gap; x < ax + fw + gap; x++) {
      if (occupied.has(`${x},${y}`)) return false;
    }
  }
  return true;
}

/**
 * Chebyshev distance from the footprint centre to the nearest existing furniture
 * tile (capped). Used as a tiebreaker so pieces spread out across a room rather
 * than bunching near the first one placed. Returns a large value when the room
 * is otherwise empty.
 */
function spreadFromOccupied(occupied, ax, ay, fw, fh) {
  if (occupied.size === 0) return 99;
  const cx = ax + (fw - 1) / 2;
  const cy = ay + (fh - 1) / 2;
  let best = 99;
  for (const key of occupied) {
    const [ox, oy] = key.split(',').map(Number);
    const d = Math.max(Math.abs(ox - cx), Math.abs(oy - cy));
    if (d < best) best = d;
  }
  return best;
}

/**
 * Place one piece of `type` in `room` using `strategy`. Prefers a one-tile gap
 * from other furniture (anti-cluster), relaxing to touching only if nothing
 * else fits. Marks occupancy and returns the piece, or null if nothing fits.
 */
function tryPlaceStrategic(gameMap, grid, room, occupied, type, strategy) {
  const base = FURNITURE_FOOTPRINTS[type];
  if (!base) return null;

  for (const gap of [1, 0]) {
    const scored = [];
    for (const rot of [0, 1, 2, 3]) {
      const fw = (rot % 2) ? base.h : base.w;
      const fh = (rot % 2) ? base.w : base.h;
      for (let ay = room.minY; ay <= room.maxY - fh + 1; ay++) {
        for (let ax = room.minX; ax <= room.maxX - fw + 1; ax++) {
          if (!footprintPlaceable(gameMap, grid, room, occupied, ax, ay, fw, fh)) continue;
          if (!clearOfOccupied(occupied, ax, ay, fw, fh, gap)) continue;
          const { ok, score } = scoreCandidate(room, ax, ay, fw, fh, rot, strategy);
          if (ok) {
            const spread = spreadFromOccupied(occupied, ax, ay, fw, fh);
            scored.push({ ax, ay, fw, fh, rot, score, spread });
          }
        }
      }
    }
    if (scored.length === 0) continue;

    // Strategy score first, then maximise separation from existing furniture, then
    // a deterministic order with a random tie-break among the truly-equal spots.
    scored.sort((a, b) =>
      b.score - a.score || b.spread - a.spread || a.ay - b.ay || a.ax - b.ax || a.rot - b.rot);
    const best = scored[0];
    const tied = scored.filter(s => s.score === best.score && s.spread === best.spread);
    const pick = tied[gameRandom.nextInt(0, tied.length - 1)];

    for (let y = pick.ay; y < pick.ay + pick.fh; y++) {
      for (let x = pick.ax; x < pick.ax + pick.fw; x++) {
        occupied.add(`${x},${y}`);
      }
    }
    return { type, x: pick.ax, y: pick.ay, w: pick.fw, h: pick.fh, rot: pick.rot };
  }
  return null;
}

/**
 * Resolve each room's role. Uses the authoritative roles MapBuilder persisted on
 * building.rooms when present, otherwise classifies here for graceful fallback.
 */
function resolveRoles(building, rooms) {
  let usedPersisted = false;
  if (building.rooms && building.rooms.length) {
    for (const slim of building.rooms) {
      const rr = rooms.find(r => r.tiles.has(`${slim.seedX},${slim.seedY}`));
      if (rr) { rr.role = slim.role; usedPersisted = true; }
    }
  }
  if (!usedPersisted) {
    assignRoles(building, rooms);
    return;
  }
  // Any room the persisted set didn't cover: sensible default by shape.
  for (const r of rooms) {
    if (!r.role) r.role = r.shape === 'hall' ? 'hall' : 'bedroom';
  }
}

/**
 * Plan decorative furniture for all residential buildings on the map.
 * Fills gameMap.furniture. Call after all item spawning so real items
 * (lootable beds, planks, safes) can be avoided. Uses only gameRandom,
 * so output is seed-stable.
 */
export function planFurniture(gameMap) {
  gameMap.furniture = [];
  const grid = makeGameMapGrid(gameMap);
  const buildings = (gameMap.buildings || []).filter(
    b => b.type === 'residential' || b.type === 'starting_home'
  );

  for (const building of buildings) {
    const rooms = findRooms(grid, building);
    if (rooms.length === 0) continue;
    resolveRoles(building, rooms);

    const occupied = new Set();
    for (const room of rooms) {
      const plan = FURNISH_PLAN[room.role] || [];
      for (const entry of plan) {
        if (!roomCanHold(room, entry.type)) continue;
        if (entry.minArea && room.area < entry.minArea) continue;
        const piece = tryPlaceStrategic(gameMap, grid, room, occupied, entry.type, entry.strategy);
        if (piece) gameMap.furniture.push(piece);
      }
    }
  }

  console.log(`[FurniturePlanner] Placed ${gameMap.furniture.length} furniture outlines across ${buildings.length} residential buildings`);
}
