import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { planFurniture } from '../client/src/game/map/FurniturePlanner.js';
import { makeGameMapGrid, findRooms } from '../client/src/game/map/RoomGraph.js';
import { gameRandom } from '../client/src/game/utils/SeededRandom.js';

const log = console.log;
console.log = () => {};

const roleCounts = {};
let buildingsSeen = 0, roomsSeen = 0;
let overlaps = 0, straddles = 0, outOfRoom = 0;
let deskTotal = 0, deskCorner = 0;
let tableTotal = 0, tableFloating = 0;
let clusterViolations = 0;
let furnitureTotal = 0, mapsWithFurniture = 0;

const gen = new TemplateMapGenerator();

for (let i = 0; i < 40; i++) {
  gameRandom.seed(1000 + i);
  const { gameMap } = await gen.generateValidatedMap(
    'winding_road', { mapNumber: 4, roadThickness: 5, sidewalkThickness: 1 },
    GameMap, { maxAttempts: 4 }
  );

  const grid = makeGameMapGrid(gameMap);
  const residential = (gameMap.buildings || []).filter(b => b.type === 'residential' || b.type === 'starting_home');

  // Role distribution from persisted building.rooms
  for (const b of residential) {
    buildingsSeen++;
    for (const r of (b.rooms || [])) {
      roomsSeen++;
      roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
    }
  }

  planFurniture(gameMap);
  const furniture = gameMap.furniture || [];
  furnitureTotal += furniture.length;
  if (furniture.length) mapsWithFurniture++;

  // Map each piece to its room for placement audits
  const roomsByBuilding = new Map();
  for (const b of residential) roomsByBuilding.set(b, findRooms(grid, b));

  const occ = new Map(); // "x,y" -> piece index
  furniture.forEach((p, idx) => {
    // overlap + wall-straddle
    for (let y = p.y; y < p.y + p.h; y++) {
      for (let x = p.x; x < p.x + p.w; x++) {
        const key = `${x},${y}`;
        if (occ.has(key)) overlaps++;
        occ.set(key, idx);
        if (x + 1 < p.x + p.w && (grid.edgeWallAt(x, y, 'e') || grid.edgeWallAt(x + 1, y, 'w'))) straddles++;
        if (y + 1 < p.y + p.h && (grid.edgeWallAt(x, y, 's') || grid.edgeWallAt(x, y + 1, 'n'))) straddles++;
      }
    }

    // find the room this piece sits in
    let room = null;
    for (const b of residential) {
      const rs = roomsByBuilding.get(b);
      room = rs.find(r => r.tiles.has(`${p.x},${p.y}`));
      if (room) break;
    }
    if (!room) { outOfRoom++; return; }
    const inRoom = (x, y) => room.tiles.has(`${x},${y}`);

    if (p.type === 'desk' || p.type === 'counter') {
      deskTotal++;
      const c = {
        n: !Array.from({ length: p.w }, (_, k) => inRoom(p.x + k, p.y - 1)).some(Boolean),
        s: !Array.from({ length: p.w }, (_, k) => inRoom(p.x + k, p.y + p.h)).some(Boolean),
        w: !Array.from({ length: p.h }, (_, k) => inRoom(p.x - 1, p.y + k)).some(Boolean),
        e: !Array.from({ length: p.h }, (_, k) => inRoom(p.x + p.w, p.y + k)).some(Boolean),
      };
      if ((c.n && c.e) || (c.e && c.s) || (c.s && c.w) || (c.w && c.n)) deskCorner++;
    }
    if (p.type === 'table') {
      tableTotal++;
      let touches = 0;
      for (let k = 0; k < p.w; k++) { if (!inRoom(p.x + k, p.y - 1)) touches++; if (!inRoom(p.x + k, p.y + p.h)) touches++; }
      for (let k = 0; k < p.h; k++) { if (!inRoom(p.x - 1, p.y + k)) touches++; if (!inRoom(p.x + p.w, p.y + k)) touches++; }
      if (touches === 0) tableFloating++;
    }
  });

  // Anti-cluster: count furniture pairs sharing an edge (touching)
  furniture.forEach((p, idx) => {
    for (let y = p.y - 1; y < p.y + p.h + 1; y++) {
      for (let x = p.x - 1; x < p.x + p.w + 1; x++) {
        const inRing = (x < p.x || x >= p.x + p.w || y < p.y || y >= p.y + p.h);
        if (!inRing) continue;
        const other = occ.get(`${x},${y}`);
        if (other !== undefined && other !== idx) { clusterViolations++; return; }
      }
    }
  });
}

log('=== Room role distribution (persisted building.rooms) ===');
log(`buildings=${buildingsSeen} rooms=${roomsSeen}`);
for (const [role, n] of Object.entries(roleCounts).sort((a, b) => b[1] - a[1])) {
  log(`  ${role.padEnd(9)} ${n}  (${(100 * n / roomsSeen).toFixed(1)}%)`);
}
log('\n=== Furniture placement audit ===');
log(`maps with furniture: ${mapsWithFurniture}/40, total pieces: ${furnitureTotal}`);
log(`overlaps: ${overlaps}  (want 0)`);
log(`wall-straddles: ${straddles}  (want 0)`);
log(`pieces outside any room: ${outOfRoom}  (want 0)`);
log(`corner desks/counters: ${deskCorner}/${deskTotal}  (want high)`);
log(`floating tables (no wall contact): ${tableFloating}/${tableTotal}  (want most)`);
log(`furniture pairs touching (cluster): ${clusterViolations}  (lower better; some ok in tight rooms)`);
