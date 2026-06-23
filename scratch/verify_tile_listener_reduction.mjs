// Mock localStorage and other global variables BEFORE any imports/execution
const mockLocalStorage = {
  getItem() { return null; },
  setItem() {}
};
global.localStorage = mockLocalStorage;
globalThis.localStorage = mockLocalStorage;

if (typeof global.document === 'undefined') {
  global.document = {
    createElement(tag) {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext(ctxId) {
            return {
              clearRect() {},
              drawImage() {},
              fillRect() {},
              restore() {},
              save() {}
            };
          }
        };
      }
      return {};
    }
  };
}

// Dynamic imports to prevent ESM hoisting
const { GameMap } = await import('../client/src/game/map/GameMap.js');
const { Tile } = await import('../client/src/game/map/Tile.js');
const assert = (await import('assert')).default;

async function runTest() {
  console.log("Starting Tile listener reduction verification...");

  // Create a 5x5 map
  const map = new GameMap(5, 5);
  
  // --- Test 1: Assert listeners Map is not allocated on Tiles ---
  console.log("Running Test 1: Checking Tile listener footprint...");
  const sampleTile = map.getTile(2, 2);
  assert.strictEqual(sampleTile.listeners, undefined, "Tile should not allocate a listeners Map/object");
  console.log("✅ Test 1 passed.");

  // --- Test 2: Event bubbling to GameMap ---
  console.log("Running Test 2: Checking event bubbling for tileClick & tileHover...");
  let clickedEventReceived = null;
  let hoveredEventReceived = null;
  
  map.on('tileClicked', (data) => {
    clickedEventReceived = data;
  });
  
  map.on('tileHovered', (data) => {
    hoveredEventReceived = data;
  });
  
  sampleTile.handleClick('examine');
  assert.ok(clickedEventReceived, "GameMap should receive bubbled tileClicked event");
  assert.strictEqual(clickedEventReceived.tile.x, 2, "Event payload should have correct X coordinate");
  assert.strictEqual(clickedEventReceived.tile.y, 2, "Event payload should have correct Y coordinate");
  assert.strictEqual(clickedEventReceived.action, 'examine', "Event payload should have correct action type");
  
  sampleTile.handleHover({ x: 0, y: 0 }); // player is at (0,0), distance to (2,2) is 4
  assert.ok(hoveredEventReceived, "GameMap should receive bubbled tileHovered event");
  assert.strictEqual(hoveredEventReceived.tile.x, 2, "Event payload should have correct X coordinate");
  assert.strictEqual(hoveredEventReceived.tile.y, 2, "Event payload should have correct Y coordinate");
  assert.strictEqual(hoveredEventReceived.apCost, 4, "Event payload should have correct Manhattan distance (AP cost)");
  console.log("✅ Test 2 passed.");

  // --- Test 3: Deserialization links restoration ---
  console.log("Running Test 3: Checking deserialized tile-to-map links...");
  const serialized = map.toJSON();
  
  // Deserialize
  const restoredMap = await GameMap.fromJSONSelective(serialized);
  
  const restoredTile = restoredMap.getTile(2, 2);
  assert.strictEqual(restoredTile.gameMap, restoredMap, "Restored tile should link to the restored GameMap instance");
  
  let restoredClickedEvent = null;
  restoredMap.on('tileClicked', (data) => {
    restoredClickedEvent = data;
  });
  
  restoredTile.handleClick('move');
  assert.ok(restoredClickedEvent, "Deserialized GameMap should receive bubbled events from restored tiles");
  assert.strictEqual(restoredClickedEvent.tile.x, 2);
  assert.strictEqual(restoredClickedEvent.action, 'move');
  console.log("✅ Test 3 passed.");

  console.log("✅ All Tile listener reduction checks passed successfully!");
}

runTest();
