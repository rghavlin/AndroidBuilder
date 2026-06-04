import { GameMap } from '../client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { LineOfSight } from '../client/src/game/utils/LineOfSight.js';

async function main() {
  const width = 70;
  const height = 84;
  const gameMap = new GameMap(width, height);
  gameMap.mapNumber = 10;

  const generator = new TemplateMapGenerator();
  const mapData = generator.generateFromTemplate('lab', { mapNumber: 10 });
  await generator.applyToGameMap(gameMap, mapData);

  // MANUALLY REVERT OUTER WALLS TO SOLID 'building' TERRAIN FOR TESTING
  const b = mapData.metadata.buildings.find(b => b.type === 'lab');
  console.log('Lab building bounds:', b);

  for (let y = b.y; y < b.y + b.height; y++) {
    for (let x = b.x; x < b.x + b.width; x++) {
      const isPerim = (y === b.y || y === b.y + b.height - 1 || x === b.x || x === b.x + b.width - 1);
      
      // Exclude main entrance doors from being turned back into walls
      const isDoor = mapData.metadata.doors.some(d => d.x === x && d.y === y);
      
      if (isPerim && !isDoor) {
        const tile = gameMap.getTile(x, y);
        tile.terrain = 'building';
        tile.edgeWalls = { n: false, e: false, s: false, w: false };
      }
    }
  }

  // Player position in Room 4
  const playerX = 30;
  const playerY = 55;

  console.log(`\n--- Checking visibility from player at (${playerX}, ${playerY}) ---`);

  // Target wall tile at x=27, y=60
  const targetX = 27;
  const targetY = 60;

  const tile = gameMap.getTile(targetX, targetY);
  console.log(`Target tile (${targetX}, ${targetY}):`, {
    terrain: tile.terrain,
    edgeWalls: tile.edgeWalls
  });

  const res = LineOfSight.hasLineOfSight(gameMap, playerX, playerY, targetX, targetY, { maxRange: 15 });
  console.log(`hasLineOfSight to (${targetX}, ${targetY}): ${res.hasLineOfSight}`);
  if (res.blockedBy) {
    console.log(`Blocked by:`, JSON.stringify(res.blockedBy));
  }

  // Check which tiles are visible
  const visible = LineOfSight.getVisibleTiles(gameMap, playerX, playerY, { maxRange: 15 });
  console.log(`Total visible tiles: ${visible.length}`);
  
  // Print a small grid showing visibility
  console.log('\n--- Visibility and EdgeWalls Grid (Manual Revert to Solid Walls) ---');
  for (let y = 53; y <= 66; y++) {
    let line = `${y.toString().padStart(2, ' ')} | `;
    for (let x = 27; x <= 29; x++) {
      const tile = gameMap.getTile(x, y);
      const isVis = visible.some(v => v.x === x && v.y === y);
      
      const terrainChar = tile.terrain === 'floor' ? 'f' : tile.terrain === 'building' ? 'B' : tile.terrain[0];
      const visStr = isVis ? 'V' : '.';
      const edgeStr = (tile.edgeWalls.n ? 'n' : '') +
                      (tile.edgeWalls.s ? 's' : '') +
                      (tile.edgeWalls.e ? 'e' : '') +
                      (tile.edgeWalls.w ? 'w' : '');

      line += `(${x}:${terrainChar}:${visStr}:${edgeStr.padEnd(2, ' ')}) `;
    }
    console.log(line);
  }
}

main().catch(console.error);
