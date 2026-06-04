import { LineOfSight } from './client/src/game/utils/LineOfSight.js';

// Mock GameMap
class MockGameMap {
  constructor(w, h) {
    this.width = w;
    this.height = h;
    this.tiles = Array(h).fill().map(() => Array(w).fill().map(() => ({
      terrain: 'grass',
      contents: [],
      edgeWalls: {}
    })));
  }
  getTile(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.tiles[y][x];
    }
    return null;
  }
}

const map = new MockGameMap(45, 125);
const visible = LineOfSight.getVisibleTiles(map, 22, 120, { maxRange: 15 });

console.log(`Total visible tiles: ${visible.length}`);
const outOfRange = visible.filter(t => t.distance > 15);
console.log(`Out of range tiles (> 15): ${outOfRange.length}`);
if (outOfRange.length > 0) {
  console.log('Sample out of range tiles:', outOfRange.slice(0, 10));
}

const hasCorner = visible.some(t => t.x === 0 && t.y === 124);
console.log(`Is (0, 124) in visible tiles? ${hasCorner ? 'YES' : 'NO'}`);
