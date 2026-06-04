import { GameMap } from '../client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';

async function main() {
  const width = 70;
  const height = 84;
  const gameMap = new GameMap(width, height);
  gameMap.mapNumber = 10; // Lab is map 10 in progression

  const generator = new TemplateMapGenerator();
  const mapData = generator.generateFromTemplate('lab', { mapNumber: 10 });
  await generator.applyToGameMap(gameMap, mapData);

  console.log('Map width:', gameMap.width, 'height:', gameMap.height);
  console.log('--- Doors in Metadata ---');
  console.log(JSON.stringify(mapData.metadata.doors, null, 2));

  console.log('\n--- Building Metadata ---');
  console.log(JSON.stringify(mapData.metadata.buildings, null, 2));

  // Let's print the terrain layout of the building area (X: 27 to 44, Y: 17 to 66)
  console.log('\n--- Building Terrain Grid (X: 27 to 44) ---');
  // Print header
  let header = '   ';
  for (let x = 27; x <= 44; x++) {
    header += x.toString().padStart(3, ' ');
  }
  console.log(header);

  for (let y = 17; y <= 66; y++) {
    let line = y.toString().padStart(3, ' ') + ' ';
    for (let x = 27; x <= 44; x++) {
      const tile = gameMap.getTile(x, y);
      let char = '.';
      if (!tile) char = '?';
      else if (tile.terrain === 'building') char = 'W';
      else if (tile.terrain === 'floor') char = 'f';
      else if (tile.terrain === 'road') char = 'r';
      else if (tile.terrain === 'sidewalk') char = 's';
      else if (tile.terrain === 'grass') char = 'g';
      else if (tile.terrain === 'transition') char = 't';
      else char = tile.terrain[0];

      // Check if there is a door on this tile
      const hasDoor = mapData.metadata.doors.some(d => d.x === x && d.y === y);
      if (hasDoor) {
        char = 'D';
      }

      line += char.padStart(3, ' ');
    }
    console.log(line);
  }
}

main().catch(console.error);
