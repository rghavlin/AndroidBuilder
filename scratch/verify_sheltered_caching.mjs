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
const { Door } = await import('../client/src/game/entities/Door.js');
const { Window } = await import('../client/src/game/entities/Window.js');
const assert = (await import('assert')).default;

function runTest() {
  console.log("Starting GameMap.isSheltered caching verification...");

  // Create a 5x5 map
  const map = new GameMap(5, 5);
  
  // Set tile (2,2) to floor (indoors) so isSheltered returns true/false based on BFS
  map.setTerrain(2, 2, 'floor');
  
  // --- Test 1: Basic caching and verification ---
  console.log("Running Test 1: Cache hit checks...");
  assert.strictEqual(map._shelteredCache, null, "Initially cache should be null");
  
  const val1 = GameMap.isSheltered(map, 2, 2);
  assert.ok(map._shelteredCache instanceof Map, "Cache should be initialized as a Map");
  assert.strictEqual(map._shelteredCache.has("2,2"), true, "Cache should contain entry for '2,2'");
  
  // Manually override cache value to see if subsequent calls return the cached value
  map._shelteredCache.set("2,2", "cached-fake-value");
  const val2 = GameMap.isSheltered(map, 2, 2);
  assert.strictEqual(val2, "cached-fake-value", "isSheltered should return cached value if present");
  console.log("✅ Test 1 passed.");

  // --- Test 2: Invalidation on turn advance ---
  console.log("Running Test 2: Invalidation on turn advance...");
  map.processTurn();
  assert.strictEqual(map._shelteredCache, null, "Cache should be cleared (null) after processTurn");
  console.log("✅ Test 2 passed.");

  // --- Test 3: Invalidation on terrain change ---
  console.log("Running Test 3: Invalidation on terrain change...");
  GameMap.isSheltered(map, 2, 2); // repopulate cache
  assert.ok(map._shelteredCache instanceof Map, "Cache should be repopulated");
  
  map.setTerrain(1, 1, 'water');
  assert.strictEqual(map._shelteredCache, null, "Cache should be cleared (null) after setTerrain");
  console.log("✅ Test 3 passed.");

  // --- Test 4: Invalidation on door state change ---
  console.log("Running Test 4: Invalidation on door interaction...");
  const door = new Door('test-door-1', 2, 1, false, false);
  map.addEntity(door, 2, 1);
  
  GameMap.isSheltered(map, 2, 2); // repopulate cache
  assert.ok(map._shelteredCache instanceof Map, "Cache should be repopulated");
  
  door.open();
  assert.strictEqual(map._shelteredCache, null, "Cache should be cleared (null) after door open");
  
  GameMap.isSheltered(map, 2, 2); // repopulate cache
  door.close();
  assert.strictEqual(map._shelteredCache, null, "Cache should be cleared (null) after door close");
  console.log("✅ Test 4 passed.");

  // --- Test 5: Invalidation on window state change ---
  console.log("Running Test 5: Invalidation on window interaction...");
  const win = new Window('test-window-1', 2, 3, false, false);
  map.addEntity(win, 2, 3);
  
  GameMap.isSheltered(map, 2, 2); // repopulate cache
  assert.ok(map._shelteredCache instanceof Map, "Cache should be repopulated");
  
  win.break();
  assert.strictEqual(map._shelteredCache, null, "Cache should be cleared (null) after window break");
  console.log("✅ Test 5 passed.");

  console.log("✅ All isSheltered caching checks passed successfully!");
}

runTest();
