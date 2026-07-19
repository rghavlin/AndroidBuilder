/**
 * RoomGraph - shared room discovery + role classification for building
 * interiors. Used both at generation time (MapBuilder tags authoritative room
 * roles onto each building) and by FurniturePlanner (which reconstructs exact
 * tiles and adopts those roles when present).
 *
 * A "room" is a flood-filled connected component of floor tiles bounded by edge
 * walls. Partition walls remain present under doorways (the door is a separate
 * entity/metadata), so a doorway still separates two rooms. Roles:
 *   living | bedroom | bathroom | kitchen | hall | closet
 *
 * Callers supply a lightweight `grid` adapter so this works against both
 * MapBuilder's in-progress layout array and a finished GameMap. Nothing here
 * mutates the map; callers decide what to persist.
 */

// Rooms at or below this many tiles can be tagged as a bathroom (on the
// full-footprint area scale). Provisional until layout generation carves
// dedicated small bathrooms.
export const BATHROOM_MAX_AREA = 16;

export const DIRS = [
  { dx: 0, dy: -1, edge: 'n', opposite: 's' },
  { dx: 1, dy: 0, edge: 'e', opposite: 'w' },
  { dx: 0, dy: 1, edge: 's', opposite: 'n' },
  { dx: -1, dy: 0, edge: 'w', opposite: 'e' },
];

/** Grid adapter over a finished GameMap. */
export function makeGameMapGrid(gameMap) {
  return {
    width: gameMap.width,
    height: gameMap.height,
    terrainAt: (x, y) => gameMap.getTile(x, y)?.terrain ?? null,
    edgeWallAt: (x, y, e) => !!gameMap.getTile(x, y)?.edgeWalls?.[e],
    doorAt: (x, y) => {
      const t = gameMap.getTile(x, y);
      return !!(t && t.contents && t.contents.some(en => en.type === 'door'));
    },
  };
}

/** Grid adapter over MapBuilder's in-progress layout + door metadata. */
export function makeLayoutGrid(layout, doors = []) {
  const h = layout.length;
  const w = h > 0 ? layout[0].length : 0;
  const doorSet = new Set(doors.map(d => `${d.x},${d.y}`));
  const inB = (x, y) => x >= 0 && x < w && y >= 0 && y < h;
  return {
    width: w,
    height: h,
    terrainAt: (x, y) => (inB(x, y) ? layout[y][x].terrain : null),
    edgeWallAt: (x, y, e) => (inB(x, y) ? !!layout[y][x].edgeWalls[e] : false),
    doorAt: (x, y) => doorSet.has(`${x},${y}`),
  };
}

export function hasDoorOnTile(grid, x, y) {
  return grid.doorAt(x, y);
}

export function isNearDoor(grid, x, y) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (grid.doorAt(x + dx, y + dy)) return true;
    }
  }
  return false;
}

// Raw edge-wall check between two adjacent tiles. Partition walls persist under
// doorways, so this treats a doorway as a boundary for room separation.
export function edgeBlocked(grid, x, y, dir) {
  const tA = grid.terrainAt(x, y);
  const tB = grid.terrainAt(x + dir.dx, y + dir.dy);
  if (tA === null || tB === null) return true;
  return grid.edgeWallAt(x, y, dir.edge) || grid.edgeWallAt(x + dir.dx, y + dir.dy, dir.opposite);
}

/**
 * Bounding box of a building's floor area. Residential buildings (drawBuilding)
 * floor the ENTIRE footprint and hang the exterior walls as edge walls on that
 * outer tile ring, so the ring is real, usable floor — rooms must include it or
 * furniture ends up one tile shy of the exterior wall. We span the full
 * footprint and let findRooms' `terrain === 'floor'` test drop any genuinely
 * non-floor perimeter (e.g. a solid wall ring or a hand-built test map).
 */
export function interiorBounds(building) {
  return {
    minX: building.x,
    maxX: building.x + building.width - 1,
    minY: building.y,
    maxY: building.y + building.height - 1,
  };
}

/**
 * Classify a room by shape alone. Hallways are narrow corridors (often 2 tiles
 * wide) or very small elongated connector rooms; they should not receive large
 * furniture.
 */
export function classifyShape(room) {
  const width = room.maxX - room.minX + 1;
  const height = room.maxY - room.minY + 1;
  const minSpan = Math.min(width, height);
  const maxSpan = Math.max(width, height);
  const aspect = maxSpan / Math.max(1, minSpan);
  if (minSpan <= 2 || (aspect >= 2.5 && room.area <= 12)) return 'hall';
  return 'room';
}

/**
 * Flood-fill the building interior into rooms separated by edge walls.
 * @param {object} grid  adapter from makeGameMapGrid / makeLayoutGrid
 * @returns {Array} rooms, each {tiles:Set<"x,y">, minX,minY,maxX,maxY, area,
 *   doorCount, seedX, seedY, shape}
 */
export function findRooms(grid, building) {
  const { minX, maxX, minY, maxY } = interiorBounds(building);
  const visited = new Set();
  const rooms = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      if (grid.terrainAt(x, y) !== 'floor') continue;

      const room = { tiles: new Set(), minX: x, minY: y, maxX: x, maxY: y, area: 0, doorCount: 0 };
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
          if (grid.terrainAt(nx, ny) !== 'floor') continue;
          if (edgeBlocked(grid, cur.x, cur.y, dir)) continue;
          visited.add(nKey);
          queue.push({ x: nx, y: ny });
        }
      }
      room.area = room.tiles.size;
      room.shape = classifyShape(room);
      // Perimeter door count (circulation proxy) + a guaranteed-interior seed
      // tile (the tile nearest the room centroid).
      let cx = 0, cy = 0;
      for (const t of room.tiles) {
        const [tx, ty] = t.split(',').map(Number);
        cx += tx; cy += ty;
        if (grid.doorAt(tx, ty)) room.doorCount++;
      }
      cx /= room.area; cy /= room.area;
      let best = null, bestD = Infinity;
      for (const t of room.tiles) {
        const [tx, ty] = t.split(',').map(Number);
        const d = (tx - cx) ** 2 + (ty - cy) ** 2;
        if (d < bestD) { bestD = d; best = { x: tx, y: ty }; }
      }
      room.seedX = best ? best.x : room.minX;
      room.seedY = best ? best.y : room.minY;
      rooms.push(room);
    }
  }
  return rooms;
}

/**
 * Assign a role to every room in place. Heuristics (authoritative source of
 * truth once persisted): entrance-adjacent hub -> living; smallest small
 * enclosed room -> bathroom; a second sizeable room near the living room ->
 * kitchen (only when there are enough rooms that we aren't stealing the sole
 * bedroom); remaining proper rooms -> bedroom; narrow corridors -> hall.
 */
export function assignRoles(building, rooms) {
  for (const room of rooms) room.role = room.shape === 'hall' ? 'hall' : null;

  const proper = rooms.filter(r => r.role !== 'hall');
  if (proper.length === 0) return rooms;

  // Living room: the proper room containing the tile just inside the entrance,
  // else the largest proper room.
  let living = null;
  if (building.entranceX !== undefined && building.entranceY !== undefined) {
    for (const dir of DIRS) {
      const key = `${building.entranceX + dir.dx},${building.entranceY + dir.dy}`;
      const r = proper.find(rm => rm.tiles.has(key));
      if (r) { living = r; break; }
    }
  }
  if (!living) living = proper.reduce((a, b) => (b.area > a.area ? b : a));
  living.role = 'living';

  const rest = proper.filter(r => r !== living);

  // Bathroom: the smallest enclosed room, but only when doing so still leaves the
  // home a bedroom (rest.length >= 2) and the room is genuinely small on the
  // corrected area scale. NOTE: current layouts rarely produce small rooms, so
  // bathrooms stay rare until layout generation carves dedicated ones — see the
  // planned "more bathrooms" work.
  let bathroom = null;
  if (rest.length >= 2) {
    const small = rest.filter(r => r.area <= BATHROOM_MAX_AREA);
    if (small.length > 0) {
      bathroom = small.reduce((a, b) => (b.area < a.area ? b : a));
      bathroom.role = 'bathroom';
    }
  }

  const remaining = rest.filter(r => r !== bathroom);

  // Kitchen: only when at least two rooms remain, so a small home keeps its sole
  // bedroom. Prefer the remaining room nearest the living room's centroid.
  if (remaining.length >= 2) {
    const lx = (living.minX + living.maxX) / 2;
    const ly = (living.minY + living.maxY) / 2;
    let kitchen = remaining[0], bestD = Infinity;
    for (const r of remaining) {
      const rx = (r.minX + r.maxX) / 2, ry = (r.minY + r.maxY) / 2;
      const d = (rx - lx) ** 2 + (ry - ly) ** 2;
      if (d < bestD) { bestD = d; kitchen = r; }
    }
    kitchen.role = 'kitchen';
  }

  for (const r of remaining) {
    if (!r.role) r.role = 'bedroom';
  }
  return rooms;
}

/** Slim, save-friendly descriptor for persistence on building.rooms. */
export function toSlimRoom(room) {
  return {
    role: room.role,
    minX: room.minX, minY: room.minY, maxX: room.maxX, maxY: room.maxY,
    area: room.area,
    seedX: room.seedX, seedY: room.seedY,
  };
}
