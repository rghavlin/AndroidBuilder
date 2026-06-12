import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { BlueprintRegistry } from '../client/src/game/BlueprintRegistry.js';
import { Inventory } from '../client/src/game/components/Inventory.js';
import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';
import { Item, createItem, createItemFromDef } from '../client/src/game/inventory/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runReproduction() {
  console.log("=== REPRODUCING GROUND ITEM SYNC BUG ===");

  // Load blueprints
  const blueprintsPath = path.join(__dirname, '../client/src/game/config/blueprints.json');
  const blueprints = JSON.parse(fs.readFileSync(blueprintsPath, 'utf8'));
  BlueprintRegistry.load(blueprints);

  // Setup game components
  const gameMap = new GameMap(20, 20);
  const player = EntityFactory.createPlayer(10, 10);
  player.addComponent(new Inventory({ items: [], maxWeight: 50, maxSlots: 20 }));
  gameMap.addEntity(player, 10, 10);

  // Create an inventory manager for the player
  // Mock the engine for inventory manager
  const mockEngine = {
    gameMap,
    player,
    weather: { type: 'clear', intensity: 0 },
    setWeather() {},
    notifyUpdate() {}
  };
  
  const inventoryManager = new InventoryManager(mockEngine);
  mockEngine.inventoryManager = inventoryManager;
  
  // Connect playerMoved event listener
  player.on('playerMoved', ({ oldPosition, newPosition }) => {
    console.log(`[PlayerEvent] Player moved from (${oldPosition.x}, ${oldPosition.y}) to (${newPosition.x}, ${newPosition.y})`);
    inventoryManager.syncWithMap(
      oldPosition.x, oldPosition.y,
      newPosition.x, newPosition.y,
      gameMap
    );
  });

  // Step 1: Add a fireaxe and a screwdriver to tile (10, 11)
  console.log("\n--- Step 1: Spawning items at (10, 11) ---");
  const fireaxeData = createItemFromDef('weapon.fire_axe');
  console.log("Fire Axe original equippableSlot:", fireaxeData.equippableSlot);
  const fireaxe = gameMap.convertLegacyItemToECS(fireaxeData);
  const screwdriverData = createItem('tool', 'screwdriver');
  console.log("Screwdriver original background color:", screwdriverData.backgroundColor);
  const screwdriver = gameMap.convertLegacyItemToECS(screwdriverData);
  gameMap.setItemsOnTile(10, 11, [fireaxe, screwdriver]);
  
  console.log("Items on tile (10, 11) contents:", gameMap.getTile(10, 11).contents.map(e => e.name));
  console.log("Items on tile (10, 11) inventoryItems:", gameMap.getTile(10, 11).inventoryItems.map(e => e.name));

  // Step 2: Player moves onto tile (10, 11)
  console.log("\n--- Step 2: Player moves onto (10, 11) ---");
  player.moveTo(10, 11);

  console.log("Ground container items:", inventoryManager.groundContainer.getAllItems().map(e => `${e.name} (bg: ${e.backgroundColor}, slot: ${e.equippableSlot}, cond: ${e.condition})`));
  console.log("Items on tile (10, 11) contents:", gameMap.getTile(10, 11).contents.map(e => e.name));

  // Step 3: Player moves off tile (10, 11) to (10, 10)
  console.log("\n--- Step 3: Player moves off to (10, 10) ---");
  player.moveTo(10, 10);

  console.log("Ground container items:", inventoryManager.groundContainer.getAllItems().map(e => e.name));
  console.log("Items on tile (10, 11) contents:", gameMap.getTile(10, 11).contents.map(e => e.name));
  console.log("Items on tile (10, 11) inventoryItems:", gameMap.getTile(10, 11).inventoryItems.map(e => e.name));

  // Step 4: Player moves back onto tile (10, 11)
  console.log("\n--- Step 4: Player moves back onto (10, 11) ---");
  const tile11 = gameMap.getTile(10, 11);
  console.log("Tile contents detail:");
  tile11.contents.forEach(e => {
    console.log(`- Entity ID: ${e.id}, Type: ${e.type}, hasComponent: ${typeof e.hasComponent}`);
    if (typeof e.hasComponent === 'function') {
      console.log(`  Components in Map:`, Array.from(e.components.keys()));
      console.log(`  hasComponent('Item'):`, e.hasComponent('Item'));
    }
  });
  player.moveTo(10, 11);

  console.log("Ground container items:", inventoryManager.groundContainer.getAllItems().map(e => `${e.name} (bg: ${e.backgroundColor}, slot: ${e.equippableSlot}, cond: ${e.condition})`));
  console.log("Items on tile (10, 11) contents:", gameMap.getTile(10, 11).contents.map(e => e.name));
}

runReproduction().catch(err => {
  console.error("Error in reproduction:", err);
});

