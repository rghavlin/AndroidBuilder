import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { planFurniture } from '../client/src/game/map/FurniturePlanner.js';
import { gameRandom } from '../client/src/game/utils/SeededRandom.js';

const templates = ['road','split_road','winding_road','mirrored_winding_road','branching_road','starting_road'];
const tmg = new TemplateMapGenerator();

for (const name of templates) {
  gameRandom.seed(123);
  const t0 = performance.now();
  const mapData = tmg.generateFromTemplate(name, { mapNumber: 1 });
  const t1 = performance.now();
  const gameMap = await GameMap.fromJSON(mapData);
  const t2 = performance.now();
  planFurniture(gameMap);
  const t3 = performance.now();
  const residential = (gameMap.buildings || []).filter(b => b.type === 'residential' || b.type === 'starting_home').length;
  console.log(`${name}: gen=${(t1-t0).toFixed(1)}ms fromJSON=${(t2-t1).toFixed(1)}ms furniture=${(t3-t2).toFixed(1)}ms pieces=${gameMap.furniture.length} residential=${residential}`);
}
