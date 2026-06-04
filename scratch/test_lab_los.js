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

  // Player position in the room (Let's assume player is at x=30, y=55)
  const playerX = 30;
  const playerY = 55;

  console.log(`--- Checking visibility from player at (${playerX}, ${playerY}) ---`);

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
  
  // Print a small grid showing visibility of column 27 (outer wall) and column 28 (floor) around y=54 to 65
  console.log('\n--- Visibility and EdgeWalls Grid ---');
  for (let y = 53; y <= 66; y++) {
    let line = `${y.toString().padStart(2, ' ')} | `;
    for (let x = 27; x <= 29; x++) {
      const tile = gameMap.getTile(x, y);
      const isVis = visible.some(v => v.x === x && v.y === y);
      
      let terrainChar = tile.terrain === 'floor' ? 'f' : tile.terrain[0];
      const isOrigWall = mapData.tiles[y][x].terrain === 'building';
      if (isOrigWall) terrainChar = 'W';

      // Visibility indicator
      const visStr = isVis ? 'V' : '.';

      // Edgewalls indicator
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
