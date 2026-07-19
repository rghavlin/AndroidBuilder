import { gameRandom } from '../utils/SeededRandom.js';

/**
 * FurniturePlanner - Places decorative floorplan-style furniture outlines in
 * residential buildings. Purely visual: pieces live in gameMap.furniture as
 * {type, x, y, w, h, rot} and are drawn by TileRenderer.drawFurniture in a
 * dedicated MapCanvas pass. No collision, no gameplay effect.
 *
 * rot is quarter-turns clockwise (0-3) from the base orientation ("head" at
 * top). x/y anchor the top-left of the ROTATED footprint; w/h are the rotated
 * footprint in tiles.
 */

// Base (unrotated) footprints in tiles, matching TileRenderer's drawings.
export const FURNITURE_FOOTPRINTS = {
  bed: { w: 2, h: 3 },
  table: { w: 2, h: 3 },
  couch: { w: 2, h: 2 },
  desk: { w: 2, h: 1 },
  bathtub: { w: 1, h: 2 },
  toilet: { w: 1, h: 1 },
};

const DIRS = [
  { dx: 0, dy: -1, edge: 'n', opposite: 's' },
  { dx: 1, dy: 0, edge: 'e', opposite: 'w' },
  { dx: 0, dy: 1, edge: 's', opposite: 'n' },
  { dx: -1, dy: 0, edge: 'w', opposite: 'e' },
];

function hasDoorOnTile(gameMap, x, y) {
  const tile = gameMap.getTile(x, y);
  return !!(tile && tile.contents && tile.contents.some(e => e.type === 'door'));
}

function isNearDoor(gameMap, x, y) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (hasDoorOnTile(gameMap, x + dx, y + dy)) return true;
    }
  }
  return false;
}

// Raw edge-wall check between two adjacent tiles (doors/windows still count as
// boundaries — a doorway separates rooms for classification purposes).
function edgeBlocked(gameMap, x, y, dir) {
  const a = gameMap.getTile(x, y);
  const b = gameMap.getTile(x + dir.dx, y + dir.dy);
  if (!a || !b) return true;
  return !!(a.edgeWalls?.[dir.edge] || b.edgeWalls?.[dir.opposite]);
}

/**
 * Classify a room by shape. Hallways are narrow corridors (often 2 tiles wide)
 * or very small connector rooms; they should not receive large furniture.
 */
function classifyRoom(room) {
  const width = room.maxX - room.minX + 1;
  const height = room.maxY - room.minY + 1;
  const minSpan = Math.min(width, height);
  const maxSpan = Math.max(width, height);
  const aspect = maxSpan / Math.max(1, minSpan);

  // Generated hallways are 2 tiles across; small elongated rooms are also halls.
  if (minSpan <= 2 || (aspect >= 2.5 && room.area <= 12)) {
    return 'hall';
  }
  return 'room';
}

/**
 * Check whether a room's bounding box is large enough for a given furniture
 * piece to look sensible (not just physically fit).
 */
function roomCanHold(room, type) {
  if (room.type === 'hall') return false;

  const width = room.maxX - room.minX + 1;
  const height = room.maxY - room.minY + 1;
  const minSpan = Math.min(width, height);
  const maxSpan = Math.max(width, height);

  switch (type) {
    case 'table':
    case 'bed':
      return minSpan >= 2 && maxSpan >= 3;
    case 'couch':
      return minSpan >= 2 && maxSpan >= 2;
    case 'desk':
    case 'bathtub':
      return maxSpan >= 2;
    case 'toilet':
      return true;
    default:
      return true;
  }
}

/**
 * Flood-fill the building interior into rooms separated by edge walls.
 * @returns {Array<{tiles: Set<string>, minX, minY, maxX, maxY, area: number, type: string}>}
 */
function findRooms(gameMap, building) {
  const minX = building.x + 1, maxX = building.x + building.width - 2;
  const minY = building.y + 1, maxY = building.y + building.height - 2;
  const visited = new Set();
  const rooms = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      const startTile = gameMap.getTile(x, y);
      if (!startTile || startTile.terrain !== 'floor') continue;

      const room = { tiles: new Set(), minX: x, minY: y, maxX: x, maxY: y, area: 0 };
      const queue = [{ x, y }];
      visited.add(key);
      while (queue.length > 0) {
        const cur = queue.pop();
        room.tiles.add(`${cur.x},${cur.y}`);
        room.minX = Math.min(room.minX, cur.x);
        room.maxX = Math.max(room.maxX, cur.x);
        room.minY = Math.min(room.minY, cur.y);
        room.maxY = Math.max(room.maxY, cur.y);

        for (const dir of DIRS) {
          const nx = cur.x + dir.dx, ny = cur.y + dir.dy;
          const nKey = `${nx},${ny}`;
          if (nx < minX || nx > maxX || ny < minY || ny > maxY) continue;
          if (visited.has(nKey)) continue;
          const nTile = gameMap.getTile(nx, ny);
          if (!nTile || nTile.terrain !== 'floor') continue;
          if (edgeBlocked(gameMap, cur.x, cur.y, dir)) continue;
          visited.add(nKey);
          queue.push({ x: nx, y: ny });
        }
      }
      room.area = room.tiles.size;
      room.type = classifyRoom(room);
      rooms.push(room);
    }
  }
  return rooms;
}

/**
 * Check whether a footprint can sit at (ax, ay) in the room.
 * headDir: which way the piece's head faces after rotation (0=N,1=E,2=S,3=W);
 * the head edge must be flush against a room boundary.
 */
function footprintFits(gameMap, room, occupied, ax, ay, fw, fh, rot) {
  for (let y = ay; y < ay + fh; y++) {
    for (let x = ax; x < ax + fw; x++) {
      if (!room.tiles.has(`${x},${y}`)) return false;
      if (occupied.has(`${x},${y}`)) return false;
      const items = gameMap.getItemsOnTile ? gameMap.getItemsOnTile(x, y) : [];
      if (items && items.length > 0) return false;
      if (isNearDoor(gameMap, x, y)) return false;
      // No internal edge walls straddled by the footprint
      if (x + 1 < ax + fw && edgeBlocked(gameMap, x, y, DIRS[1])) return false;
      if (y + 1 < ay + fh && edgeBlocked(gameMap, x, y, DIRS[2])) return false;
    }
  }

  // Head edge flush against a room boundary (every tile beyond it outside the room)
  const headTiles = [];
  if (rot === 0) { for (let x = ax; x < ax + fw; x++) headTiles.push(`${x},${ay - 1}`); }
  else if (rot === 1) { for (let y = ay; y < ay + fh; y++) headTiles.push(`${ax + fw},${y}`); }
  else if (rot === 2) { for (let x = ax; x < ax + fw; x++) headTiles.push(`${x},${ay + fh}`); }
  else { for (let y = ay; y < ay + fh; y++) headTiles.push(`${ax - 1},${y}`); }
  return headTiles.every(key => !room.tiles.has(key));
}

/**
 * Try to place one piece of the given type in the room. Marks occupancy and
 * returns the piece, or null if nothing fits.
 */
function tryPlace(gameMap, room, occupied, type) {
  const base = FURNITURE_FOOTPRINTS[type];
  if (!base) return null;

  const rotations = gameRandom.shuffle([0, 1, 2, 3]);
  for (const rot of rotations) {
    const fw = (rot % 2) ? base.h : base.w;
    const fh = (rot % 2) ? base.w : base.h;
    const candidates = [];
    for (let ay = room.minY; ay <= room.maxY - fh + 1; ay++) {
      for (let ax = room.minX; ax <= room.maxX - fw + 1; ax++) {
        if (footprintFits(gameMap, room, occupied, ax, ay, fw, fh, rot)) {
          candidates.push({ ax, ay });
        }
      }
    }
    if (candidates.length > 0) {
      const pick = candidates[gameRandom.nextInt(0, candidates.length - 1)];
      for (let y = pick.ay; y < pick.ay + fh; y++) {
        for (let x = pick.ax; x < pick.ax + fw; x++) {
          occupied.add(`${x},${y}`);
        }
      }
      return { type, x: pick.ax, y: pick.ay, w: fw, h: fh, rot };
    }
  }
  return null;
}

/** Find the room containing the interior tile just inside the building entrance. */
function findEntranceRoom(gameMap, building, rooms) {
  if (building.entranceX === undefined || building.entranceY === undefined) return null;
  for (const dir of DIRS) {
    const key = `${building.entranceX + dir.dx},${building.entranceY + dir.dy}`;
    const room = rooms.find(r => r.tiles.has(key));
    if (room) return room;
  }
  return null;
}

/**
 * Plan decorative furniture for all residential buildings on the map.
 * Fills gameMap.furniture. Call after all item spawning so real items
 * (lootable beds, planks, safes) can be avoided. Uses only gameRandom,
 * so output is seed-stable.
 */
export function planFurniture(gameMap) {
  gameMap.furniture = [];
  const buildings = (gameMap.buildings || []).filter(
    b => b.type === 'residential' || b.type === 'starting_home'
  );

  for (const building of buildings) {
    const rooms = findRooms(gameMap, building);
    if (rooms.length === 0) continue;

    const occupied = new Set();
    const place = (room, type) => {
      if (!room || !roomCanHold(room, type)) return;
      const piece = tryPlace(gameMap, room, occupied, type);
      if (piece) gameMap.furniture.push(piece);
    };

    // Don't let the entrance hallway become the living room; pick the largest
    // proper room, falling back to the largest room of any kind.
    let livingRoom = findEntranceRoom(gameMap, building, rooms);
    if (!livingRoom || livingRoom.type === 'hall') {
      const properRooms = rooms.filter(r => r.type !== 'hall');
      livingRoom = properRooms.length > 0
        ? properRooms.reduce((a, b) => (b.area > a.area ? b : a))
        : rooms.reduce((a, b) => (b.area > a.area ? b : a));
    }

    if (rooms.length === 1) {
      place(livingRoom, 'couch');
      place(livingRoom, 'table');
      continue;
    }

    const others = rooms.filter(r => r !== livingRoom);
    // Bathrooms must be proper rooms; hallways can't host plumbing fixtures.
    const smallRooms = others.filter(r => r.type !== 'hall' && r.area <= 9);
    const bathroom = smallRooms.length > 0
      ? smallRooms.reduce((a, b) => (b.area < a.area ? b : a))
      : null;

    place(livingRoom, 'couch');
    place(livingRoom, 'table');
    if (bathroom) {
      place(bathroom, 'toilet');
      place(bathroom, 'bathtub');
    }
    for (const room of others) {
      if (room === bathroom || room.type === 'hall') continue;
      place(room, 'bed');
      if (room.area >= 10) place(room, 'desk');
    }
  }

  console.log(`[FurniturePlanner] Placed ${gameMap.furniture.length} furniture outlines across ${buildings.length} residential buildings`);
}
