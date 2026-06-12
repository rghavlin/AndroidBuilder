import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { BlueprintRegistry } from '../client/src/game/BlueprintRegistry.js';
import { IntentQueue } from '../client/src/game/managers/IntentQueue.js';
import { PickupIntent } from '../client/src/game/components/PickupIntent.js';
import { DropIntent } from '../client/src/game/components/DropIntent.js';
import { Inventory } from '../client/src/game/components/Inventory.js';
import { Entity } from '../client/src/game/entities/Entity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log("=== PHASE 3 ECS INVENTORY SYSTEM VERIFICATION ===");

  // ----------------------------------------------------
  // 1. Blueprint Registry Loading
  // ----------------------------------------------------
  console.log("\n--- Step 1: Loading Blueprint Templates ---");
  const blueprintsPath = path.join(__dirname, '../client/src/game/config/blueprints.json');
  const blueprints = JSON.parse(fs.readFileSync(blueprintsPath, 'utf8'));
  BlueprintRegistry.load(blueprints);
  
  if (BlueprintRegistry.has('fireaxe') && BlueprintRegistry.has('canned_peaches')) {
    console.log("✔ Blueprints loaded successfully into BlueprintRegistry.");
  } else {
    throw new Error("❌ Failed to load blueprints into BlueprintRegistry.");
  }

  // ----------------------------------------------------
  // 2. Dynamic Assembly
  // ----------------------------------------------------
  console.log("\n--- Step 2: Dynamic Blueprint Assembly ---");
  const fireaxe = EntityFactory.assembleFromBlueprint('fireaxe');
  const cannedPeaches = EntityFactory.assembleFromBlueprint('canned_peaches');

  if (fireaxe.hasComponent('Item') && fireaxe.hasComponent('MeleeWeapon') && fireaxe.hasComponent('Renderable')) {
    console.log("✔ Fireaxe entity assembled successfully with ECS components.");
    const itemComp = fireaxe.getComponent('Item');
    const weaponComp = fireaxe.getComponent('MeleeWeapon');
    const renderComp = fireaxe.getComponent('Renderable');
    console.log(`  - Name: "${itemComp.name}", Weight: ${itemComp.weight}`);
    console.log(`  - Melee Damage: ${weaponComp.damage}`);
    console.log(`  - Render details: Sprite="${renderComp.spriteId}", Color="${renderComp.color}"`);
  } else {
    throw new Error("❌ Fireaxe assembly components check failed.");
  }

  if (cannedPeaches.hasComponent('Item') && cannedPeaches.hasComponent('Consumable') && cannedPeaches.hasComponent('Renderable')) {
    console.log("✔ Canned Peaches entity assembled successfully with ECS components.");
    const itemComp = cannedPeaches.getComponent('Item');
    const foodComp = cannedPeaches.getComponent('Consumable');
    console.log(`  - Name: "${itemComp.name}", Nutrition: ${foodComp.nutrition}, Hydration: ${foodComp.hydration}`);
  } else {
    throw new Error("❌ Canned Peaches assembly components check failed.");
  }

  // ----------------------------------------------------
  // 3. Map Setup and Spawning
  // ----------------------------------------------------
  console.log("\n--- Step 3: Game Map Spawning ---");
  const gameMap = new GameMap(20, 20);
  
  // Create Player
  const player = EntityFactory.createPlayer(10, 10);
  // Ensure player has the ECS Inventory component (with items: [])
  player.addComponent(new Inventory({ items: [], maxWeight: 50, maxSlots: 20 }));
  gameMap.addEntity(player, 10, 10);

  // Spawn Items on map tiles
  gameMap.setItemsOnTile(10, 11, [fireaxe]);
  gameMap.setItemsOnTile(10, 12, [cannedPeaches]);

  // Verify map tiles
  const fireaxeTile = gameMap.getTile(10, 11);
  const peachesTile = gameMap.getTile(10, 12);
  
  if (fireaxeTile.contents.includes(fireaxe) && peachesTile.contents.includes(cannedPeaches)) {
    console.log("✔ Items correctly placed on map tile contents.");
  } else {
    throw new Error("❌ Items failed to register in tile contents.");
  }

  if (fireaxeTile.inventoryItems.includes(fireaxe) && peachesTile.inventoryItems.includes(cannedPeaches)) {
    console.log("✔ Tile inventoryItems list correctly synchronized.");
  } else {
    throw new Error("❌ Tile inventoryItems synchronization failed.");
  }

  // ----------------------------------------------------
  // 4. Pickup Intent Processing & Weight Constraints
  // ----------------------------------------------------
  console.log("\n--- Step 4: Pickup Intent Resolution ---");
  const mockEngine = {
    gameMap,
    _uiDirty: false,
    notifyUpdate() {
      this._uiDirty = true;
    }
  };

  const intentQueue = new IntentQueue();

  // Test constraint: limit weight capacity
  const playerInv = player.getComponent('Inventory');
  playerInv.maxWeight = 2; // Axe is weight 3

  console.log("Testing pickup capacity constraint (Max Weight = 2, Axe Weight = 3)...");
  let pickupIntent = new PickupIntent({ itemId: fireaxe.id });
  player.addComponent(pickupIntent);
  intentQueue.enqueue(player.id, 'PickupIntent', pickupIntent);
  intentQueue.resolve(gameMap.getAllEntities(), null, mockEngine, []);

  if (playerInv.items.includes(fireaxe.id)) {
    throw new Error("❌ Weight constraint violated! Axe was picked up but maxWeight is 2.");
  } else {
    console.log("✔ Capacity constraint enforced. Axe pickup rejected.");
  }

  // Restore capacity and pickup
  playerInv.maxWeight = 50;
  console.log("Picking up Fireaxe (Weight = 3)...");
  pickupIntent = new PickupIntent({ itemId: fireaxe.id });
  player.addComponent(pickupIntent);
  intentQueue.enqueue(player.id, 'PickupIntent', pickupIntent);
  intentQueue.resolve(gameMap.getAllEntities(), null, mockEngine, []);

  if (playerInv.items.includes(fireaxe.id)) {
    console.log("✔ Pickup succeeded. Item ID added to Inventory component items array.");
  } else {
    throw new Error("❌ Pickup failed.");
  }

  // Verify item is removed from map coordinates (logical and visual) and tile
  if (fireaxe.hasComponent('Position')) {
    throw new Error("❌ Detached item entity still has Position component.");
  } else {
    console.log("✔ Detached item has Position component removed.");
  }

  if (fireaxeTile.contents.includes(fireaxe) || fireaxeTile.inventoryItems.includes(fireaxe)) {
    throw new Error("❌ Item remains on tile contents or inventoryItems.");
  } else {
    console.log("✔ Item removed from map tile contents and synchronized inventoryItems.");
  }

  if (mockEngine._uiDirty) {
    console.log("✔ UI Dirty flag set to true during PickupIntent resolution.");
  } else {
    throw new Error("❌ UI Dirty flag not set during Pickup.");
  }

  // ----------------------------------------------------
  // 5. Drop Intent Resolution
  // ----------------------------------------------------
  console.log("\n--- Step 5: Drop Intent Resolution ---");
  mockEngine._uiDirty = false;

  const dropIntent = new DropIntent({ itemId: fireaxe.id });
  player.addComponent(dropIntent);
  intentQueue.enqueue(player.id, 'DropIntent', dropIntent);
  intentQueue.resolve(gameMap.getAllEntities(), null, mockEngine, []);

  if (playerInv.items.includes(fireaxe.id)) {
    throw new Error("❌ Item ID still in inventory items after drop.");
  } else {
    console.log("✔ Drop succeeded. Item ID removed from Inventory component items.");
  }

  const dropTile = gameMap.getTile(10, 10); // Player coords
  if (dropTile.contents.includes(fireaxe) && dropTile.inventoryItems.includes(fireaxe)) {
    console.log("✔ Item successfully returned to map tile contents and synchronized inventoryItems.");
  } else {
    throw new Error("❌ Dropped item not found on tile contents or inventoryItems.");
  }

  if (fireaxe.hasComponent('Position')) {
    const pos = fireaxe.getComponent('Position');
    if (pos.x === 10 && pos.y === 10) {
      console.log(`✔ Item Position component restored to dropper position (${pos.x}, ${pos.y}).`);
    } else {
      throw new Error(`❌ Item Position coordinates incorrect: (${pos.x}, ${pos.y})`);
    }
  } else {
    throw new Error("❌ Dropped item lacks a Position component.");
  }

  if (mockEngine._uiDirty) {
    console.log("✔ UI Dirty flag set to true during DropIntent resolution.");
  } else {
    throw new Error("❌ UI Dirty flag not set during Drop.");
  }

  // ----------------------------------------------------
  // 6. Serialization (Detached Entities)
  // ----------------------------------------------------
  console.log("\n--- Step 6: Map Save/Load Serialization with Detached Entities ---");

  // Pick up fireaxe again so it is detached
  pickupIntent = new PickupIntent({ itemId: fireaxe.id });
  player.addComponent(pickupIntent);
  intentQueue.enqueue(player.id, 'PickupIntent', pickupIntent);
  intentQueue.resolve(gameMap.getAllEntities(), null, mockEngine, []);

  console.log("Serializing map to JSON...");
  const mapJSON = gameMap.toJSON();

  // Verify fireaxe is in detachedEntities and not in tiles contents
  const fireaxeInDetached = mapJSON.detachedEntities.find(e => e.id === fireaxe.id);
  if (fireaxeInDetached) {
    console.log("✔ Detached fireaxe serialized under `detachedEntities`.");
  } else {
    throw new Error("❌ Detached item missing from `detachedEntities` in map JSON.");
  }

  const fireaxeInTiles = mapJSON.tiles.flat().some(t => t.contents && t.contents.some(e => e.id === fireaxe.id));
  if (fireaxeInTiles) {
    throw new Error("❌ Detached item erroneously serialized inside tile contents.");
  } else {
    console.log("✔ Detached item correctly omitted from tile contents in JSON.");
  }

  console.log("Deserializing map from JSON...");
  const deserializedMap = await GameMap.fromJSON(mapJSON);

  const deserializedAxe = deserializedMap.getEntity(fireaxe.id);
  if (deserializedAxe) {
    console.log("✔ Detached entity restored to deserialized map's central registry.");
    if (deserializedAxe.hasComponent('Item') && deserializedAxe.hasComponent('MeleeWeapon')) {
      console.log("✔ Restored entity has its ECS components intact.");
    } else {
      throw new Error("❌ Restored detached entity components are missing.");
    }
  } else {
    throw new Error("❌ Failed to restore detached entity to central registry.");
  }

  // ----------------------------------------------------
  // 7. Aggressive Legacy Migration (No Fallbacks)
  // ----------------------------------------------------
  console.log("\n--- Step 7: Aggressive Legacy Migration (No Fallbacks) ---");
  
  const legacyMapData = {
    width: 20,
    height: 20,
    tiles: Array(20).fill(null).map((_, y) => 
      Array(20).fill(null).map((_, x) => ({
        x,
        y,
        terrain: 'grass',
        contents: [],
        inventoryItems: x === 10 && y === 12 ? [
          {
            id: 'weapon.fireaxe', // legacy uses id for defId
            name: 'Legacy Fire Axe',
            weight: 5,
            imageId: 'axe_icon',
            condition: 90
          }
        ] : []
      }))
    ),
    detachedEntities: [],
    scentSequenceCounter: 0
  };

  console.log("Deserializing legacy map data...");
  const migratedMap = await GameMap.fromJSON(legacyMapData);

  const migratedTile = migratedMap.getTile(10, 12);
  const migratedAxeEntity = migratedTile.contents.find(e => e.type === 'item');

  if (migratedAxeEntity) {
    console.log("✔ Legacy item encountered in tile.inventoryItems was aggressively migrated to an ECS entity.");
    if (migratedAxeEntity.id && migratedAxeEntity.id !== 'weapon.fireaxe') {
      console.log(`  - Fresh Entity ID generated: ${migratedAxeEntity.id}`);
    } else {
      throw new Error("❌ Migrated entity failed to generate a fresh unique ID.");
    }

    if (migratedAxeEntity.hasComponent('Item') && migratedAxeEntity.hasComponent('MeleeWeapon') && migratedAxeEntity.hasComponent('Renderable')) {
      console.log("✔ Migrated entity attached to correct ECS components.");
      const itemComp = migratedAxeEntity.getComponent('Item');
      const weaponComp = migratedAxeEntity.getComponent('MeleeWeapon');
      const renderComp = migratedAxeEntity.getComponent('Renderable');
      
      if (itemComp.name === 'Legacy Fire Axe' && itemComp.weight === 5) {
        console.log(`  - Item properties correctly mapped: name="${itemComp.name}", weight=${itemComp.weight}`);
      } else {
        throw new Error("❌ Item properties incorrect after migration.");
      }

      if (renderComp.spriteId === 'axe_icon') {
        console.log(`  - Renderable properties correctly mapped: spriteId="${renderComp.spriteId}"`);
      } else {
        throw new Error("❌ Renderable properties incorrect after migration.");
      }
    } else {
      throw new Error("❌ Migrated entity lacks components (Item/MeleeWeapon/Renderable).");
    }

    // Check custom fields / compatibility
    if (migratedAxeEntity.instanceId === migratedAxeEntity.id && migratedAxeEntity.defId === 'weapon.fireaxe') {
      console.log("✔ Backwards-compatibility metadata fields set correctly.");
    } else {
      throw new Error("❌ Compatibility metadata fields desynced.");
    }

    if (migratedTile.inventoryItems.includes(migratedAxeEntity) && migratedTile.inventoryItems.length === 1) {
      console.log("✔ tile.inventoryItems list correctly updated to contain only the new ECS entity.");
    } else {
      throw new Error("❌ tile.inventoryItems is empty or has duplicates/legacy objects.");
    }
  } else {
    throw new Error("❌ Legacy item was not converted or not placed on tile contents.");
  }

  console.log("\n=== ALL ECS INVENTORY PIPELINE TESTS PASSED SUCCESSFULY ===");
}

runTests().catch(err => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
