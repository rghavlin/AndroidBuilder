import { LineOfSight } from '../client/src/game/utils/LineOfSight.js';

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

const map = new MockGameMap(85, 125);
let totalChecks = 0;
let errorsFound = 0;

for (let y = 0; y < map.height; y++) {
  for (let x = 0; x < map.width; x++) {
    totalChecks++;
    const range = 15;
    const visible = LineOfSight.getVisibleTiles(map, x, y, { maxRange: range });
    
    // Check if any visible tile is further than range
    const outOfRange = visible.filter(t => {
      const dx = t.x - x;
      const dy = t.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist > range;
    });
    
    if (outOfRange.length > 0) {
      console.log(`Error: Player at (${x}, ${y}) sees out-of-range tiles:`, outOfRange);
      errorsFound++;
    }
    
    // Check if visible contains out-of-bounds tiles
    const outOfBounds = visible.filter(t => t.x < 0 || t.x >= map.width || t.y < 0 || t.y >= map.height);
    if (outOfBounds.length > 0) {
      console.log(`Error: Player at (${x}, ${y}) sees out-of-bounds tiles:`, outOfBounds);
      errorsFound++;
    }
  }
}

console.log(`Exhaustive 85x125 test complete. Total positions checked: ${totalChecks}. Errors found: ${errorsFound}`);
