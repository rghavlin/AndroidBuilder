import { GameMap } from './client/src/game/map/GameMap.js';
import { planFurniture } from './client/src/game/map/FurniturePlanner.js';
import { gameRandom } from './client/src/game/utils/SeededRandom.js';

gameRandom.seed(4242);

const map = new GameMap(20, 20);
for (let y = 3; y <= 12; y++) {
  for (let x = 3; x <= 12; x++) {
    map.getTile(x, y).terrain = 'floor';
  }
}
for (let x = 3; x <= 12; x++) {
  map.getTile(x, 3).edgeWalls.n = true;
  map.getTile(x, 12).edgeWalls.s = true;
}
for (let y = 3; y <= 12; y++) {
  map.getTile(3, y).edgeWalls.w = true;
  map.getTile(12, y).edgeWalls.e = true;
}
for (let y = 3; y <= 12; y++) {
  map.getTile(7, y).edgeWalls.e = true;
}
for (let x = 10; x <= 12; x++) {
  map.getTile(x, 9).edgeWalls.s = true;
}
for (let y = 10; y <= 12; y++) {
  map.getTile(9, y).edgeWalls.e = true;
}
map.buildings = [{
  type: 'residential',
  x: 2, y: 2, width: 12, height: 12,
  entranceX: 2, entranceY: 5, frontage: 'west',
}];

planFurniture(map);
console.log('Furniture:', map.furniture.map(p => `${p.type} at (${p.x},${p.y}) rot=${p.rot} size=${p.w}x${p.h}`));
