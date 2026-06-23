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
      return {};
    }
  };
}

import engine from '../client/src/game/GameEngine.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';

console.log("Verifying Campfire Lighting FOV...");

// 1. Setup mock map and player
const map = new GameMap(30, 30);
const player = EntityFactory.createPlayer(5, 5);
player.id = 'player-1';
map.addEntity(player, 5, 5);

engine.reset();
engine.gameMap = map;
engine.player = player;
engine.turn = 17; // Set turn to 17 (corresponds to hour 22, full night where range is 1.5)

// 2. Set to night, no flashlight
engine.setFOVOptions({ isNight: true, isFlashlightOn: false });

// 3. Initial FOV (should be very small, radius 1.5)
engine.recalculateFOV();
console.log(`Initial Night FOV tiles: ${engine.playerFieldOfView.length}`);
const initialFovLength = engine.playerFieldOfView.length;

// Verify campfire tile is NOT initially visible
const isCampfireVisibleInitially = engine.playerFieldOfView.some(t => t.x === 10 && t.y === 10);
console.log(`Is campfire tile (10,10) visible initially? ${isCampfireVisibleInitially ? 'YES' : 'NO'}`);

// 4. Place a lit campfire nearby (distance 5 tiles)
const campfire = {
    defId: 'placeable.campfire',
    instanceId: 'campfire-1',
    lifetimeTurns: 10,
    name: 'Campfire'
};
map.addItemsToTile(10, 10, [campfire]);

const items = map.getEntitiesByType('item');
console.log(`Ground items count: ${items.length}`);
if (items.length > 0) {
  console.log(`First item: defId=${items[0].defId}, instanceId=${items[0].instanceId}, x=${items[0].x}, y=${items[0].y}, lifetimeTurns=${items[0].lifetimeTurns}`);
}

// 5. Force invalidate FOV cache and Recalculate
engine.invalidateFOV();
engine.recalculateFOV();
console.log(`FOV with nearby campfire at (10,10): ${engine.playerFieldOfView.length}`);

// 6. Verify specific tile visibility
const isCampfireVisible = engine.playerFieldOfView.some(t => t.x === 10 && t.y === 10);
const isTileAroundCampfireVisible = engine.playerFieldOfView.some(t => t.x === 11 && t.y === 11);

console.log(`Is campfire tile (10,10) visible? ${isCampfireVisible ? 'YES' : 'NO'}`);
console.log(`Is nearby tile (11,11) visible? ${isTileAroundCampfireVisible ? 'YES' : 'NO'}`);

let success = true;
if (isCampfireVisible && isTileAroundCampfireVisible && engine.playerFieldOfView.length > initialFovLength) {
    console.log("SUCCESS: Campfire lighting is functional when player is at (5,5)!");
} else {
    console.error("FAILURE: Campfire lighting failed to expand FOV when player is at (5,5).");
    success = false;
}

// Test Case 2: Move player onto the campfire tile (10, 10)
console.log("\nRunning Test Case 2: Player moving directly onto the campfire tile...");
player.x = 10;
player.y = 10;
engine.inventoryManager.syncWithMap(5, 5, 10, 10, map);

console.log(`Ground container items count: ${engine.inventoryManager.groundContainer.getItemCount()}`);
const groundItemsInContainer = engine.inventoryManager.groundContainer.getAllItems();
if (groundItemsInContainer.length > 0) {
  console.log(`Ground container item: defId=${groundItemsInContainer[0].defId}, instanceId=${groundItemsInContainer[0].instanceId}`);
}

engine.invalidateFOV();
engine.recalculateFOV();

console.log(`FOV with player on top of campfire: ${engine.playerFieldOfView.length}`);

// Verify surrounding tiles are illuminated correctly (e.g. tile (11,11) is illuminated)
const isTileAroundCampfireVisibleCase2 = engine.playerFieldOfView.some(t => t.x === 11 && t.y === 11);
console.log(`Is nearby tile (11,11) visible when standing on campfire? ${isTileAroundCampfireVisibleCase2 ? 'YES' : 'NO'}`);

if (isTileAroundCampfireVisibleCase2) {
    console.log("SUCCESS: Campfire lighting is functional when player stands on it!");
} else {
    console.error("FAILURE: Campfire lighting failed to expand FOV when player stands on it.");
    success = false;
}

if (!success) {
    process.exit(1);
} else {
    console.log("\nALL TESTS PASSED successfully!");
}
