
import engine from '../client/src/game/GameEngine.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { Player } from '../client/src/game/entities/Player.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';

console.log("Verifying Campfire Lighting FOV...");

// 1. Setup mock map and player
const map = new GameMap(30, 30);
const player = new Player({ id: 'player-1', x: 5, y: 5 });
map.addEntity(player, 5, 5);

engine.reset();
engine.gameMap = map;
engine.player = player;

// 2. Set to night, no flashlight
engine.setFOVOptions({ isNight: true, isFlashlightOn: false });

// 3. Initial FOV (should be very small, radius 1.5)
engine.recalculateFOV();
console.log(`Initial Night FOV tiles: ${engine.playerFieldOfView.length}`);

// 4. Place a lit campfire nearby
const campfireDef = ItemDefs['placeable.campfire'];
const campfire = {
    defId: 'placeable.campfire',
    instanceId: 'campfire-1',
    lifetimeTurns: 10,
    name: 'Campfire'
};
map.addItemsToTile(10, 10, [campfire]);

// 5. Recalculate FOV
engine.recalculateFOV();
console.log(`FOV with nearby campfire at (10,10): ${engine.playerFieldOfView.length}`);

// 6. Verify specific tile visibility
const isCampfireVisible = engine.playerFieldOfView.some(t => t.x === 10 && t.y === 10);
const isTileAroundCampfireVisible = engine.playerFieldOfView.some(t => t.x === 11 && t.y === 11);

console.log(`Is campfire tile (10,10) visible? ${isCampfireVisible ? 'YES' : 'NO'}`);
console.log(`Is nearby tile (11,11) visible? ${isTileAroundCampfireVisible ? 'YES' : 'NO'}`);

if (isCampfireVisible && isTileAroundCampfireVisible && engine.playerFieldOfView.length > 10) {
    console.log("SUCCESS: Campfire lighting is functional!");
} else {
    console.error("FAILURE: Campfire lighting failed to expand FOV.");
}
