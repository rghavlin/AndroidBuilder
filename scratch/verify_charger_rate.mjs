import engine from '../client/src/game/GameEngine.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { ItemDefs, createItemFromDef } from '../client/src/game/inventory/ItemDefs.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';

async function testCharger() {
    try {
        console.log("=== Testing Battery Charger Rate ===");
        const map = new GameMap(30, 30);
        const player = EntityFactory.createPlayer(5, 5);
        map.addEntity(player, 5, 5);

        engine.reset();
        engine.gameMap = map;
        engine.player = player;

        const inv = new InventoryManager();
        engine.inventoryManager = inv;
        inv.syncWithMap(null, null, 5, 5, map);

        // 1. Create a generator (provides power)
        console.log("Creating Generator...");
        const generatorData = createItemFromDef('furniture.generator');
        const generator = new Item(generatorData);
        generator.isOn = true;
        generator.ammoCount = 100;
        inv.groundContainer.addItem(generator);

        // 2. Create plain battery charger
        console.log("Creating Plain Battery Charger...");
        const chargerData = createItemFromDef('tool.battery_charger');
        const charger = new Item(chargerData);
        inv.groundContainer.addItem(charger);

        // 3. Create a battery and put it inside the charger
        console.log("Creating empty Battery...");
        const batteryData = createItemFromDef('tool.battery');
        const battery = new Item(batteryData);
        battery.ammoCount = 0;
        
        const chargerContainer = charger.getContainerGrid();
        chargerContainer.addItem(battery);

        console.log("Battery initial charge:", battery.ammoCount);
        
        // 4. Process a turn
        console.log("Processing 1 turn...");
        inv.processTurn(1, false);

        console.log("Battery charge after 1 turn:", battery.ammoCount);
        if (battery.ammoCount !== 5) {
            throw new Error(`Expected battery charge to be 5, but got ${battery.ammoCount}`);
        }
        console.log("✅ SUCCESS: Plain battery charger charged at 5 charges per turn!");

        // 5. Test Solar charger should still charge at 1 per turn (not 5)
        console.log("\nTesting Solar Charger...");
        const solarData = createItemFromDef('tool.solar_charger');
        const solar = new Item(solarData);
        inv.groundContainer.addItem(solar);
        
        const solarBattery = new Item(createItemFromDef('tool.battery'));
        solarBattery.ammoCount = 0;
        solar.getContainerGrid().addItem(solarBattery);

        // Solar charger needs outdoors, daylight, and not in player inventory
        inv.processTurn(1, true); // turn = 1 (daylight), isOutdoors = true
        console.log("Solar Battery charge after 1 turn:", solarBattery.ammoCount);
        if (solarBattery.ammoCount !== 1) {
            throw new Error(`Expected solar battery charge to be 1, but got ${solarBattery.ammoCount}`);
        }
        console.log("✅ SUCCESS: Solar charger charged at 1 charge per turn!");

    } catch (e) {
        console.error("❌ TEST FAILED:", e);
        process.exit(1);
    }
}

testCharger();
