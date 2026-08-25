import { gameRandom } from '../utils/SeededRandom.js';

const VEHICLE_TYPES = ['car', 'pickup', 'van'];

/**
 * Checks if two bounding boxes overlap.
 */
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/**
 * Checks if all tiles in a given rectangle are walkable road tiles without items or doors.
 */
function isAllRoad(gameMap, x, y, w, h) {
  if (x < 0 || y < 0 || x + w > gameMap.width || y + h > gameMap.height) {
    return false;
  }
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const tile = gameMap.getTile(x + dx, y + dy);
      if (!tile || tile.terrain !== 'road') {
        return false;
      }
      if (gameMap.getItemsOnTile && gameMap.getItemsOnTile(x + dx, y + dy)?.length > 0) {
        return false;
      }
      if (tile.edgeWalls?.n?.door || tile.edgeWalls?.s?.door || tile.edgeWalls?.e?.door || tile.edgeWalls?.w?.door) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Measures the contiguous span of road tiles along the X and Y axes centered at (cx, cy).
 */
function measureRoadSpans(gameMap, cx, cy) {
  let spanX = 1;
  let spanY = 1;

  for (let dx = 1; dx <= 10; dx++) {
    const tile = gameMap.getTile(cx + dx, cy);
    if (tile && tile.terrain === 'road') spanX++;
    else break;
  }
  for (let dx = 1; dx <= 10; dx++) {
    const tile = gameMap.getTile(cx - dx, cy);
    if (tile && tile.terrain === 'road') spanX++;
    else break;
  }

  for (let dy = 1; dy <= 10; dy++) {
    const tile = gameMap.getTile(cx, cy + dy);
    if (tile && tile.terrain === 'road') spanY++;
    else break;
  }
  for (let dy = 1; dy <= 10; dy++) {
    const tile = gameMap.getTile(cx, cy - dy);
    if (tile && tile.terrain === 'road') spanY++;
    else break;
  }

  return { spanX, spanY };
}

/**
 * Checks if a proposed bounding box is too close to any already placed vehicle.
 */
function isTooCloseToVehicles(placedVehicles, x, y, w, h, minDistance = 14) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  for (const p of placedVehicles) {
    const pcx = p.x + p.w / 2;
    const pcy = p.y + p.h / 2;
    const dist = Math.max(Math.abs(cx - pcx), Math.abs(cy - pcy));
    if (dist < minDistance) {
      return true;
    }
  }
  return false;
}

/**
 * Procedurally places sparse vehicle outlines on roads for newly generated maps.
 * Matches vehicle orientation to road direction (North/South vs East/West)
 * with ~50% facing the opposite direction of traffic.
 * 
 * @param {import('./GameMap.js').GameMap} gameMap
 * @param {Object} [options]
 * @param {number} [options.minVehicles]
 * @param {number} [options.maxVehicles]
 * @param {number} [options.minDistance]
 */
export function planRoadVehicles(gameMap, options = {}) {
  if (!gameMap || !gameMap.width || !gameMap.height) return [];
  if (!Array.isArray(gameMap.furniture)) {
    gameMap.furniture = [];
  }

  const { width, height } = gameMap;

  // Buffer from map edges / transition zones (exits at top and bottom)
  const edgeBufferY = Math.min(8, Math.floor(height * 0.08));
  const edgeBufferX = Math.min(4, Math.floor(width * 0.08));

  // Count total road tiles to scale target vehicle count to actual road network size
  let roadTileCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = gameMap.getTile(x, y);
      if (tile && tile.terrain === 'road') {
        roadTileCount++;
      }
    }
  }

  // Scale target: ~1 vehicle per 160-200 road tiles (e.g. 3-5 on small roads, 35-55 on huge city grids)
  const densityTarget = Math.max(2, Math.round(roadTileCount / 180));
  const minVehicles = options.minVehicles ?? Math.max(2, Math.floor(densityTarget * 0.8));
  const maxVehicles = options.maxVehicles ?? Math.max(minVehicles, Math.ceil(densityTarget * 1.2));
  const targetCount = minVehicles + Math.floor(gameRandom.next() * (maxVehicles - minVehicles + 1));
  const minDistance = options.minDistance ?? 14;

  const candidates = [];

  // Scan road tiles for valid candidate vehicle placements
  for (let y = edgeBufferY; y <= height - edgeBufferY - 4; y++) {
    for (let x = edgeBufferX; x <= width - edgeBufferX - 4; x++) {
      const tile = gameMap.getTile(x, y);
      if (!tile || tile.terrain !== 'road') continue;

      const { spanX, spanY } = measureRoadSpans(gameMap, x + 1, y + 1);

      // Try vertical placement (2x4) if road is predominantly vertical or fits 2x4
      const fitsVertical = isAllRoad(gameMap, x, y, 2, 4);
      // Try horizontal placement (4x2) if road is predominantly horizontal or fits 4x2
      const fitsHorizontal = isAllRoad(gameMap, x, y, 4, 2);

      if (fitsVertical && (!fitsHorizontal || spanY >= spanX)) {
        candidates.push({
          x,
          y,
          w: 2,
          h: 4,
          isVertical: true,
        });
      } else if (fitsHorizontal) {
        candidates.push({
          x,
          y,
          w: 4,
          h: 2,
          isVertical: false,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  // Shuffle candidates deterministically using gameRandom
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom.next() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const placedVehicles = [];

  for (const cand of candidates) {
    if (placedVehicles.length >= targetCount) break;

    const candRect = { x: cand.x, y: cand.y, w: cand.w, h: cand.h };

    // Ensure no overlap with existing furniture
    if (gameMap.furniture.some(p => rectsOverlap(p, candRect))) {
      continue;
    }

    // Maintain sparse clearance from other road vehicles
    if (isTooCloseToVehicles(placedVehicles, cand.x, cand.y, cand.w, cand.h, minDistance)) {
      continue;
    }

    // Pick random vehicle type
    const typeIndex = Math.floor(gameRandom.next() * VEHICLE_TYPES.length);
    const type = VEHICLE_TYPES[typeIndex];

    // Determine rotation:
    // If vertical road: 50% North (rot 0), 50% South (rot 2)
    // If horizontal road: 50% East (rot 1), 50% West (rot 3)
    let rot = 0;
    if (cand.isVertical) {
      rot = gameRandom.next() < 0.5 ? 0 : 2;
    } else {
      rot = gameRandom.next() < 0.5 ? 1 : 3;
    }

    const piece = {
      type,
      x: cand.x,
      y: cand.y,
      w: cand.w,
      h: cand.h,
      rot,
    };

    placedVehicles.push(piece);
    gameMap.furniture.push(piece);
  }

  if (placedVehicles.length > 0) {
    console.log(`[RoadVehiclePlanner] Placed ${placedVehicles.length} vehicle outline(s) on road tiles`);
  }

  return placedVehicles;
}
