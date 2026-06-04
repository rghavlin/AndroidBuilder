import { GameMap } from '../client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { LineOfSight } from '../client/src/game/utils/LineOfSight.js';

async function main() {
  const width = 45;
  const height = 125;
  const gameMap = new GameMap(width, height);
  gameMap.mapNumber = 1;

  const generator = new TemplateMapGenerator();
  const mapData = generator.generateFromTemplate('road', { mapNumber: 1 });
  await generator.applyToGameMap(gameMap, mapData);

  // Let's find the first residential building (at the bottom of the map, high Y values)
  const buildings = mapData.metadata.buildings.filter(b => b.type === 'residential');
  // Sort by Y descending to get the one closest to the bottom (spawn)
  buildings.sort((a, b) => b.y - a.y);
  const firstHouse = buildings[0];

  console.log('First House coordinates:', firstHouse);
  console.log('Entrance door:', mapData.metadata.doors.find(d => 
    d.x >= firstHouse.x && d.x < firstHouse.x + firstHouse.width &&
    d.y >= firstHouse.y && d.y < firstHouse.y + firstHouse.height
  ));

  // Let's find all doors and windows in this house
  const houseDoors = mapData.metadata.doors.filter(d => 
    d.x >= firstHouse.x && d.x < firstHouse.x + firstHouse.width &&
    d.y >= firstHouse.y && d.y < firstHouse.y + firstHouse.height
  );
  const houseWindows = mapData.metadata.windows.filter(w => 
    w.x >= firstHouse.x && w.x < firstHouse.x + firstHouse.width &&
    w.y >= firstHouse.y && w.y < firstHouse.y + firstHouse.height
  );

  console.log('House doors:', houseDoors);
  console.log('House windows:', houseWindows);

  // Let's find a valid floor tile inside the house to place the player
  let playerX = -1;
  let playerY = -1;
  for (let y = firstHouse.y + 1; y < firstHouse.y + firstHouse.height - 1; y++) {
    for (let x = firstHouse.x + 1; x < firstHouse.x + firstHouse.width - 1; x++) {
      const tile = gameMap.getTile(x, y);
      if (tile && tile.terrain === 'floor') {
        playerX = x;
        playerY = y;
        break;
      }
    }
    if (playerX !== -1) break;
  }

  // Let's override the player position to somewhere in the middle-bottom of the house
  playerX = firstHouse.x + Math.floor(firstHouse.width / 2);
  playerY = firstHouse.y + firstHouse.height - 3;

  console.log(`\n--- Running visibility from Player at (${playerX}, ${playerY}) ---`);
  
  const visible = LineOfSight.getVisibleTiles(gameMap, playerX, playerY, { maxRange: 15 });
  console.log(`Total visible tiles: ${visible.length}`);

  // Let's print the building terrain, windows, doors, and visibility
  console.log('\n--- House Layout and Visibility ---');
  for (let y = firstHouse.y - 2; y <= firstHouse.y + firstHouse.height + 1; y++) {
    let line = `${y.toString().padStart(3, ' ')} | `;
    for (let x = firstHouse.x - 2; x <= firstHouse.x + firstHouse.width + 1; x++) {
      const tile = gameMap.getTile(x, y);
      if (!tile) {
        line += ' ? ';
        continue;
      }

      const isVis = visible.some(v => v.x === x && v.y === y);
      const isPlayer = x === playerX && y === playerY;

      let char = '.';
      if (isPlayer) char = 'P';
      else if (tile.terrain === 'floor') char = 'f';
      else if (tile.terrain === 'grass') char = 'g';
      else if (tile.terrain === 'sidewalk') char = 's';
      else if (tile.terrain === 'road') char = 'r';

      // Check for doors/windows
      const door = gameMap.getItemsOnTile(x, y)?.find(e => e.type === 'door') || 
                   tile.contents.find(e => e.type === 'door');
      const window = gameMap.getItemsOnTile(x, y)?.find(e => e.type === 'window') || 
                     tile.contents.find(e => e.type === 'window');

      let itemChar = '';
      if (door) itemChar = 'D';
      else if (window) itemChar = 'W';

      // Edge wall indicator
      let edgeStr = '';
      if (tile.edgeWalls.n) edgeStr += 'n';
      if (tile.edgeWalls.s) edgeStr += 's';
      if (tile.edgeWalls.e) edgeStr += 'e';
      if (tile.edgeWalls.w) edgeStr += 'w';

      const visStr = isVis ? 'V' : '.';
      const cellLabel = (itemChar + char).padEnd(2, ' ');
      line += `(${cellLabel}:${visStr}:${edgeStr.padEnd(2, ' ')}) `;
    }
    console.log(line);
  }
}

main().catch(console.error);
