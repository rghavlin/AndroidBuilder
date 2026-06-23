import { TileRenderer } from '../client/src/game/renderer/TileRenderer.js';
import { imageLoader } from '../client/src/game/utils/ImageLoader.js';
import assert from 'assert';

// Mock Canvas Context
class MockCanvasContext {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 0;
    this.rects = [];
    this.images = [];
  }
  fillRect(x, y, w, h) {
    this.rects.push({ action: 'fill', x, y, w, h, style: this.fillStyle });
  }
  strokeRect(x, y, w, h) {
    this.rects.push({ action: 'stroke', x, y, w, h, style: this.strokeStyle, width: this.lineWidth });
  }
  drawImage(image, ...args) {
    this.images.push({ image, args });
  }
}

// Mock localStorage for ConfigManager to load in node
if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    getItem() { return null; },
    setItem() {}
  };
}

// Mock engine
const mockEngine = {
  renderDebugColors: false
};

function runTest() {
  console.log("Starting TileRenderer optimizations verification...");

  // --- Test 1: P6-01 Base Color & Hoisted TERRAIN_COLORS ---
  const ctx1 = new MockCanvasContext();
  const grassTile = { terrain: 'grass', flags: { explored: true } };
  TileRenderer.drawTile(ctx1, 0, 0, 48, grassTile, true, true, false, mockEngine, null);
  
  // Assert grass base color is resolved correctly from the hoisted TERRAIN_COLORS map
  assert.strictEqual(ctx1.fillStyle, '#1a3c1a', "Expected grass base color to be #1a3c1a");

  // --- Test 2: P6-03 Lazy _variantIndex caching on Grass Tile ---
  const ctx2 = new MockCanvasContext();
  const mockSprites = {
    'tile_spritesheet': 'mock-sheet-img'
  };
  
  // Back up global imageLoader and set to mock/spritesheet
  const originalTileSet = imageLoader.tileSet;
  imageLoader.tileSet = 'spritesheet';

  // Grass tile should start without _variantIndex
  const testGrassTile = { terrain: 'grass', flags: { explored: true } };
  assert.strictEqual(testGrassTile._variantIndex, undefined, "Initially grass tile should not have _variantIndex");

  TileRenderer.drawTile(ctx2, 5, 10, 48, testGrassTile, true, true, false, mockEngine, mockSprites);
  
  const index = testGrassTile._variantIndex;
  assert.ok(typeof index === 'number', "Should calculate and cache _variantIndex on grass tile");
  assert.ok(index >= 0 && index < 8, "_variantIndex should be a valid index into grass variants (0 to 7)");

  // Run again and assert it reuses the cached _variantIndex
  testGrassTile._variantIndex = 4; // manually override to a specific index
  const ctx2b = new MockCanvasContext();
  TileRenderer.drawTile(ctx2b, 5, 10, 48, testGrassTile, true, true, false, mockEngine, mockSprites);
  assert.strictEqual(testGrassTile._variantIndex, 4, "Should preserve the manually overridden/cached variant index");

  // --- Test 3: P6-03 Lazy _variantIndex caching on Road Tile ---
  const testRoadTile = { terrain: 'road', flags: { explored: true } };
  assert.strictEqual(testRoadTile._variantIndex, undefined, "Initially road tile should not have _variantIndex");

  const ctx3 = new MockCanvasContext();
  TileRenderer.drawTile(ctx3, 12, 18, 48, testRoadTile, true, true, false, mockEngine, mockSprites);
  assert.ok(typeof testRoadTile._variantIndex === 'number', "Should calculate and cache _variantIndex on road tile");
  assert.ok([0, 1, 2].includes(testRoadTile._variantIndex), "_variantIndex should be 0, 1, or 2");

  // --- Test 4: P6-02 Fire Overlay pulse uses currentTime ---
  const burningTile = { terrain: 'grass', fireTurns: 5, flags: { explored: true } };
  const timeA = 1000;
  const timeB = 5000;

  const ctx4a = new MockCanvasContext();
  TileRenderer.drawTile(ctx4a, 0, 0, 48, burningTile, true, true, false, mockEngine, null, timeA);
  
  const ctx4b = new MockCanvasContext();
  TileRenderer.drawTile(ctx4b, 0, 0, 48, burningTile, true, true, false, mockEngine, null, timeB);

  // We should find the fire overlay fillRect styling in the rects log
  const fireRectA = ctx4a.rects.find(r => r.style.startsWith('rgba(249, 115, 22'));
  const fireRectB = ctx4b.rects.find(r => r.style.startsWith('rgba(249, 115, 22'));

  assert.ok(fireRectA, "Should render fire overlay at timeA");
  assert.ok(fireRectB, "Should render fire overlay at timeB");
  assert.notStrictEqual(fireRectA.style, fireRectB.style, "Fire overlay pulse opacity should differ between timeA and timeB");

  // Restore global imageLoader
  imageLoader.tileSet = originalTileSet;

  console.log("✅ All TileRenderer rendering optimization tests passed successfully!");
}

runTest();
