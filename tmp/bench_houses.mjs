import { MapBuilder } from '../client/src/game/map/MapBuilder.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { planFurniture } from '../client/src/game/map/FurniturePlanner.js';
import { gameRandom } from '../client/src/game/utils/SeededRandom.js';

const WIDTH = 220, HEIGHT = 260;
gameRandom.seed(42);
const builder = new MapBuilder(WIDTH, HEIGHT);
builder.fill('grass');

// Place a grid of residential lots so floorplans actually trigger.
const lotW = 18, lotH = 18, gap = 4;
let placed = 0;
for (let y = 2; y + lotH < HEIGHT - 2; y += lotH + gap) {
  for (let x = 2; x + lotW < WIDTH - 2; x += lotW + gap) {
    // Pick varied frontages to exercise rotation.
    const frontage = ['south','north','east','west'][placed % 4];
    builder.drawBuilding(x, y, lotW, lotH, frontage, 'residential');
    placed++;
  }
}
console.log('houses placed', placed, 'metadata buildings', builder.metadata.buildings.length);

const mapData = builder.getFinalMapData('test', {});
const t0 = performance.now();
const gameMap = await GameMap.fromJSON(mapData);
gameMap.buildings = mapData.metadata.buildings || [];
const t1 = performance.now();
planFurniture(gameMap);
const t2 = performance.now();
console.log(`fromJSON=${(t1-t0).toFixed(1)}ms planFurniture=${(t2-t1).toFixed(1)}ms pieces=${gameMap.furniture.length}`);
