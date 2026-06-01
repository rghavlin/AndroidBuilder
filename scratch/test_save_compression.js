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

// Mock saveGameState and loadGameState to avoid loading the whole engine and maps
const originalSaveGameState = GameSaveSystem.saveGameState;
const originalLoadGameState = GameSaveSystem.loadGameState;

GameSaveSystem.saveGameState = function(gameState) {
  return gameState; // just pass through
};

GameSaveSystem.loadGameState = async function(saveData) {
  return saveData; // just pass through
};

async function runTests() {
  console.log("=== Running Save System Compression Tests ===");

  const dummyState = {
    version: '1.1.0',
    timestamp: Date.now(),
    turn: 42,
    details: "This is a dummy state to test saving, compression, listing and loading."
  };

  // Clear mock storage
  window.localStorage.clear();

  // Test 1: Save state to storage
  console.log("\n[Test 1] Saving game state to slot 'quicksave'...");
  const saveSuccess = await GameSaveSystem.saveToStorage(dummyState, 'quicksave');
  console.log("Save Success:", saveSuccess);

  // Check storage key
  const storedValue = window.localStorage.getItem('zombie_road_save_quicksave');
  console.log("Stored key exists:", !!storedValue);
  console.log("Stored value starts with '_gz_':", storedValue?.startsWith('_gz_:'));
  console.log("Stored string length:", storedValue?.length);

  // Test 2: List save slots
  console.log("\n[Test 2] Listing save slots...");
  const slots = await GameSaveSystem.listSaveSlots();
  console.log("Save Slots found:", slots.length);
  if (slots.length > 0) {
    console.log("Found slot:", slots[0]);
    console.log("Slot turn:", slots[0].turn);
    console.log("Slot timestamp:", slots[0].timestamp);
  }

  // Test 3: Load save state from storage
  console.log("\n[Test 3] Loading game state from slot 'quicksave'...");
  const loadedState = await GameSaveSystem.loadFromStorage('quicksave');
  console.log("Loaded State exists:", !!loadedState);
  if (loadedState) {
    console.log("Loaded State details match:", loadedState.details === dummyState.details);
    console.log("Loaded State turn match:", loadedState.turn === dummyState.turn);
  }

  // Test 4: Backward compatibility (loading uncompressed saves)
  console.log("\n[Test 4] Testing backward compatibility with uncompressed save...");
  const legacyState = {
    version: '1.1.0',
    timestamp: Date.now() - 10000,
    turn: 12,
    details: "This is a legacy uncompressed save data."
  };
  
  // Directly set uncompressed string in localStorage (legacy behavior)
  window.localStorage.setItem('zombie_road_save_legacy', JSON.stringify(legacyState));

  // Try to list slots with mixed compressed/uncompressed formats
  console.log("Listing slots with mixed save formats...");
  const mixedSlots = await GameSaveSystem.listSaveSlots();
  console.log("Mixed slots count:", mixedSlots.length);
  console.log("Mixed slots details:", mixedSlots);

  // Load the legacy uncompressed save
  console.log("Loading legacy save...");
  const loadedLegacy = await GameSaveSystem.loadFromStorage('legacy');
  console.log("Loaded legacy exists:", !!loadedLegacy);
  if (loadedLegacy) {
    console.log("Loaded legacy details match:", loadedLegacy.details === legacyState.details);
    console.log("Loaded legacy turn match:", loadedLegacy.turn === legacyState.turn);
  }

  // Cleanup/Restore original methods
  GameSaveSystem.saveGameState = originalSaveGameState;
  GameSaveSystem.loadGameState = originalLoadGameState;
  
  console.log("\n=== Save System Compression Tests Finished ===");
}

runTests().catch(console.error);
