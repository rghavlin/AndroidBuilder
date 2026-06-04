import { LineOfSight } from './client/src/game/utils/LineOfSight.js';
import { GameMap } from './client/src/game/map/GameMap.js';
import { RoadGenerator } from './client/src/game/map/generators/RoadGenerator.js';
import { TemplateMapGenerator } from './client/src/game/map/TemplateMapGenerator.js';

async function test() {
  const width = 45;
  const height = 125;
  const gameMap = new GameMap(width, height);
  gameMap.mapNumber = 1;

  const generator = new TemplateMapGenerator();
  const mapData = generator.generateFromTemplate('road', { mapNumber: 1 });
  await generator.applyToGameMap(gameMap, mapData);

  const startX = 22;
  const startY = 123;

  console.log('\n--- Trace Line of Sight from (22, 123) to (0, 90) ---');
  const res = LineOfSight.hasLineOfSight(gameMap, 22, 123, 0, 90, { maxRange: 125 });
  console.log(`hasLineOfSight: ${res.hasLineOfSight}`);
  if (res.blockedBy) {
    console.log(`Blocked by: ${JSON.stringify(res.blockedBy)}`);
  }

  const testRanges = [15, 20, 125, undefined, NaN];

  for (const r of testRanges) {
    console.log(`\n--- Testing maxRange: ${r} ---`);
    const visible = LineOfSight.getVisibleTiles(gameMap, startX, startY, { maxRange: r });
    console.log(`Total visible tiles: ${visible.length}`);

    const targets = [
      { x: 22, y: 0 },
      { x: 0, y: 124 },
      { x: 44, y: 124 }
    ];

    targets.forEach(t => {
      const isFound = visible.some(v => v.x === t.x && v.y === t.y);
      console.log(`Tile (${t.x}, ${t.y}) in visible? ${isFound ? 'YES' : 'NO'}`);
    });
  }
}

test().catch(console.error);
