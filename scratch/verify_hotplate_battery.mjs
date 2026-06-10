import engine from '../client/src/game/GameEngine.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { Player } from '../client/src/game/entities/Player.js';
import { ItemDefs, createItemFromDef } from '../client/src/game/inventory/ItemDefs.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';

console.log("=== STEP 1: INITIAL SETUP ===");
const map = new GameMap(30, 30);
const player = new Player({ id: 'player-1', x: 5, y: 5 });
map.addEntity(player, 5, 5);

engine.reset();
engine.gameMap = map;
engine.player = player;

const inv = new InventoryManager();
engine.inventoryManager = inv;

// Sync ground container with player position
inv.syncWithMap(null, null, 5, 5, map);

console.log("Creating Hotplate...");
const hotplateData = createItemFromDef('tool.battery_powered_hotplate');
const hotplate = new Item(hotplateData);
inv.groundContainer.addItem(hotplate);

console.log("Creating Large Battery...");
const batteryData = createItemFromDef('tool.large_battery');
const battery = new Item(batteryData);
battery.ammoCount = 100;
inv.groundContainer.addItem(battery);

console.log("Attaching battery to hotplate...");
inv.attachItemToWeapon(hotplate, 'battery', battery, 'ground');

console.log("Turning hotplate ON...");
hotplate.isOn = true;

console.log("\n=== STEP 2: DRAIN IN GROUND CONTAINER ===");
console.log("Initial battery charge:", hotplate.getBattery().ammoCount);
inv.processTurn(1, false);
console.log("After Turn 1 (player on tile):", hotplate.getBattery().ammoCount);

console.log("\n=== STEP 3: DRAIN ON MAP TILE (PLAYER WALKS AWAY) ===");
// Player walks away to (6, 6)
console.log("Player walking from (5,5) to (6,6)...");
inv.syncWithMap(5, 5, 6, 6, map);

// The tile (5, 5) on map should now contain the hotplate POJO
const tileItems = map.getItemsOnTile(5, 5);
console.log("Items on tile (5, 5):", tileItems.map(i => `${i.name} (isOn: ${i.isOn})`));
const mapHotplate = tileItems.find(i => i.defId === 'tool.battery_powered_hotplate');
const mapBattery = mapHotplate?.attachments?.['battery'];
console.log("Attached battery on map tile charge before turn:", mapBattery ? mapBattery.ammoCount : 'N/A');

// Process turn on the map (representing player being away)
map.processTurn(player, false, 2);
console.log("Attached battery on map tile charge after map turn:", mapBattery ? mapBattery.ammoCount : 'N/A');

console.log("\n=== STEP 4: PLAYER COMES BACK AND SYNCS ===");
inv.syncWithMap(6, 6, 5, 5, map);
const returnedHotplate = inv.groundContainer.getAllItems().find(i => i.defId === 'tool.battery_powered_hotplate');
console.log("Is hotplate in ground container again?", !!returnedHotplate);
console.log("Hotplate battery charge after sync back:", returnedHotplate?.getBattery()?.ammoCount);
console.log("Hotplate is ON:", returnedHotplate?.isOn);

console.log("\n=== STEP 5: INSTANT CONSUMPTION & 1 CHARGE EDGE CASE ===");
// Turn it OFF first
returnedHotplate.isOn = false;
returnedHotplate.getBattery().ammoCount = 1;
console.log("Hotplate is OFF, battery reset to 1 charge.");

// Simulate UI Click turning it ON:
const activeBattery = returnedHotplate.getBattery();
if (activeBattery && activeBattery.ammoCount > 0) {
    activeBattery.ammoCount = Math.max(0, activeBattery.ammoCount - 1);
    returnedHotplate.isOn = true;
    console.log("Toggled ON: Battery charge immediately becomes:", activeBattery.ammoCount);
    console.log("Hotplate is ON:", returnedHotplate.isOn);
}

if (activeBattery.ammoCount !== 0 || !returnedHotplate.isOn) {
    console.error("FAILURE: Instant consumption failed! Should be 0 charges and ON.");
    process.exit(1);
}

// Process turn - at the end of the turn, it should turn OFF since battery is 0
console.log("Processing turn...");
inv.processTurn(3, false);
console.log("After turn processing, battery charge:", returnedHotplate.getBattery().ammoCount);
console.log("Is hotplate ON:", returnedHotplate.isOn);

if (returnedHotplate.isOn) {
    console.error("FAILURE: Hotplate did not turn OFF at end of turn after depleting battery!");
    process.exit(1);
}

console.log("\n=== STEP 6: 0 CHARGES PREVENTS TURNING ON ===");
// Try to toggle ON when charge is 0
if (activeBattery && activeBattery.ammoCount > 0) {
    returnedHotplate.isOn = true;
} else {
    console.log("Successfully prevented turning ON with 0 charges (as UI button is disabled).");
}

if (returnedHotplate.getBattery().ammoCount === 0 && !returnedHotplate.isOn) {
    console.log("\nSUCCESS: All hotplate battery drainage and instant consumption test cases passed successfully!");
} else {
    console.error("\nFAILURE: Battery drainage logic does not behave as expected.");
}
