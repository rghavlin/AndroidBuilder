import { GameMap } from '../client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { MapBuilder } from '../client/src/game/map/MapBuilder.js';

async function main() {
  const width = 45;
  const height = 125;
  const builder = new MapBuilder(width, height);
  builder.mapNumber = 1;

  // Let's intercept drawBuilding to inspect our first house
  const originalDrawBuilding = builder.drawBuilding;
  builder.drawBuilding = function(x, y, w, h, frontage, type = 'residential') {
    originalDrawBuilding.call(this, x, y, w, h, frontage, type);
    if (x === 5 && y === 109) {
      console.log('--- Step 1: Immediately after drawBuilding ---');
      console.log(`(15, 115) terrain: ${this.getTerrain(15, 115)}`);
      console.log(`(16, 115) terrain: ${this.getTerrain(16, 115)}`);
    }
  };

  const generator = new TemplateMapGenerator();
  const mapData = generator.generateFromTemplate('road', { mapNumber: 1 });
  
  console.log('--- Step 2: After generateFromTemplate ---');
  // Check the tiles in mapData.tiles
  console.log(`(15, 115) terrain in mapData: ${mapData.tiles[115][15].terrain}`);
  console.log(`(16, 115) terrain in mapData: ${mapData.tiles[115][16].terrain}`);

  const gameMap = new GameMap(width, height);
  gameMap.mapNumber = 1;
  await generator.applyToGameMap(gameMap, mapData);

  console.log('--- Step 3: After applyToGameMap ---');
  console.log(`(15, 115) terrain in gameMap: ${gameMap.getTile(15, 115).terrain}`);
  console.log(`(16, 115) terrain in gameMap: ${gameMap.getTile(16, 115).terrain}`);
}

main().catch(console.error);
