// Mock global window and localStorage
global.window = {
  localStorage: {
    _store: {},
    length: 0,
    setItem(key, value) {
      this._store[key] = String(value);
      this.length = Object.keys(this._store).length;
    },
    getItem(key) {
      return this._store[key] || null;
    },
    removeItem(key) {
      delete this._store[key];
      this.length = Object.keys(this._store).length;
    },
    key(index) {
      return Object.keys(this._store)[index] || null;
    },
    clear() {
      this._store = {};
      this.length = 0;
    }
  }
};

import { GameSaveSystem } from '../client/src/game/GameSaveSystem.js';
import { WorldManager } from '../client/src/game/WorldManager.js';

// Mock GameMap to have basic serialization/restoration
class MockGameMap {
  constructor(id, data = "map-grid-data") {
    this.id = id;
    this.data = data;
  }
  getAllEntities() {
    return [];
  }
  getEntitiesByType(type) {
    if (type === 'player') {
      return [{ id: 'player-1', x: 2, y: 2, hp: 100, maxHp: 100, ap: 100, maxAp: 100 }];
    }
    return [];
  }
  toJSON() {
    return { id: this.id, data: this.data };
  }
  static fromJSON(json) {
    return new MockGameMap(json.id, json.data);
  }
  static fromJSONSelective(json, options) {
    return new MockGameMap(json.id, json.data);
  }
}

// Override restoreGameMapFromJSON and GameMap import inside GameSaveSystem / WorldManager
// Since they use dynamic import, we mock GameSaveSystem.restoreGameMapFromJSON
GameSaveSystem.restoreGameMapFromJSON = async function(mapData) {
  return MockGameMap.fromJSON(mapData);
};

// Also mock GameMap in WorldManager dynamically, or intercept GameMap.fromJSON/fromJSONSelective
// Since dynamic imports are used, let's override them globally
// We'll mock the module imports by defining them as global variables or mocking the loader if needed,
// but actually, we can temporarily mock them or override dynamic import target behaviors.
// Let's modify the dynamically loaded modules by override in save/load functions.
// Or we can just mock WorldManager's imports of GameMap:
// We can intercept WorldManager's methods. Let's see.

async function runTests() {
  console.log("=== Running Save System Chunk Serialization Tests ===");

  // Create WorldManager
  const worldManager = new WorldManager();
  
  // Set maps
  const map1 = new MockGameMap('map_001', 'grid-data-1');
  const map2 = new MockGameMap('map_002', 'grid-data-2');
  const map3 = new MockGameMap('map_003', 'grid-data-3');

  // Populate maps into worldManager (we use saveCurrentMap which does compression asynchronously)
  worldManager.currentMapId = 'map_001';
  worldManager.saveCurrentMap(map1, 'map_001', 1, 'road');
  worldManager.saveCurrentMap(map2, 'map_002', 1, 'road');
  worldManager.saveCurrentMap(map3, 'map_003', 1, 'road');

  // Set active map to map3
  worldManager.currentMapId = 'map_003';

  // Wait a small delay for async compression to finish
  await new Promise(resolve => setTimeout(resolve, 100));

  // Check that inactive maps (map_001 and map_002) have serializedMap === null in memory, but compressedMap is populated
  const wmMap1 = worldManager.maps.get('map_001');
  const wmMap2 = worldManager.maps.get('map_002');
  const wmMap3 = worldManager.maps.get('map_003');

  console.log("Map 1 (inactive) serializedMap is null:", wmMap1.serializedMap === null);
  console.log("Map 1 (inactive) compressedMap is populated:", !!wmMap1.compressedMap);
  console.log("Map 3 (active) serializedMap is populated:", !!wmMap3.serializedMap);

  // Build fake game state
  const gameState = {
    turn: 5,
    gameMap: map3,
    worldManager: worldManager,
    player: { id: 'player-1', x: 2, y: 2, hp: 100, maxHp: 100, ap: 100, maxAp: 100 },
    inventoryManager: { toJSON: () => ({ items: [] }) },
    camera: { x: 0, y: 0 }
  };

  console.log("\nSaving game state to slot 'slot_test'...");
  const success = await GameSaveSystem.saveToStorage(gameState, 'slot_test');
  console.log("Save Success:", success);

  // Verify stored keys in localStorage
  const keys = Object.keys(window.localStorage._store);
  console.log("\nStored keys in localStorage:", keys);

  // We expect:
  // - zombie_road_save_slot_test (main save)
  // - zombie_road_save_slot_test_chunk_map_001 (chunk 1)
  // - zombie_road_save_slot_test_chunk_map_002 (chunk 2)
  console.log("Contains main save:", keys.includes('zombie_road_save_slot_test'));
  console.log("Contains chunk map_001:", keys.includes('zombie_road_save_slot_test_chunk_map_001'));
  console.log("Contains chunk map_002:", keys.includes('zombie_road_save_slot_test_chunk_map_002'));
  // map_003 is the current/active map, so it is NOT saved as an inactive chunk. It is part of the main save!
  console.log("Does NOT contain chunk map_003 (saved inside main file instead):", !keys.includes('zombie_road_save_slot_test_chunk_map_003'));

  // Verify size reduction of main save:
  const mainSaveStr = window.localStorage.getItem('zombie_road_save_slot_test');
  console.log("Main save content length (chars):", mainSaveStr.length);

  // Verify chunk content
  const chunk1Str = window.localStorage.getItem('zombie_road_save_slot_test_chunk_map_001');
  console.log("Chunk 1 starts with '_gz_':", chunk1Str.startsWith('_gz_:'));

  // Load slot back
  console.log("\nLoading save slot 'slot_test'...");
  const loadedComponents = await GameSaveSystem.loadFromStorage('slot_test');
  console.log("Load Success:", !!loadedComponents);
  console.log("Loaded worldManager saveSlot set:", loadedComponents?.worldManager?.saveSlot === 'slot_test');

  // Verify loading inactive map 1 from chunk storage!
  // We simulate transition back to map_001 by clearing map_001 from memory first
  const loadedWM = loadedComponents.worldManager;
  loadedWM.maps.get('map_001').serializedMap = null;
  loadedWM.maps.get('map_001').compressedMap = null;

  console.log("Map 1 in memory is cleared (both serialized and compressed are null)");
  console.log("Loading Map 1 from chunk (on-demand loading)...");
  
  // Directly loadMap
  const loadedMapResult = await loadedWM.loadMap('map_001');
  console.log("Loaded map instance exists:", !!loadedMapResult.gameMap);
  console.log("Loaded map correct constructor:", loadedMapResult.gameMap.constructor.name === 'GameMap');
  console.log("Loaded map correct dimensions:", loadedMapResult.gameMap.width === 20 && loadedMapResult.gameMap.height === 20);

  // Delete save slot
  console.log("\nDeleting save slot 'slot_test'...");
  const deleteSuccess = await GameSaveSystem.deleteSaveSlot('slot_test');
  console.log("Delete success:", deleteSuccess);

  // Verify all keys are removed
  const finalKeys = Object.keys(window.localStorage._store);
  console.log("Remaining keys in storage:", finalKeys);
  console.log("Main save deleted:", !finalKeys.includes('zombie_road_save_slot_test'));
  console.log("Chunk map_001 deleted:", !finalKeys.includes('zombie_road_save_slot_test_chunk_map_001'));
  console.log("Chunk map_002 deleted:", !finalKeys.includes('zombie_road_save_slot_test_chunk_map_002'));

  console.log("\n=== Chunk Serialization Tests Finished ===");
}

runTests().catch(console.error);
