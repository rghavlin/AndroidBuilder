import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import engine from '../client/src/game/GameEngine.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { BlueprintRegistry } from '../client/src/game/BlueprintRegistry.js';
import { ItemDefs, createItemFromDef } from '../client/src/game/inventory/ItemDefs.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';
import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import turnManager from '../client/src/game/managers/TurnManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log("=== RUNNING AUTO TURRET FIRING TEST ===");

  // Load blueprints
  const blueprintsPath = path.join(__dirname, '../client/src/game/config/blueprints.json');
  const blueprints = JSON.parse(fs.readFileSync(blueprintsPath, 'utf8'));
  BlueprintRegistry.load(blueprints);

  // Setup game map & entities
  const map = new GameMap(30, 30);
  for (let y = 0; y < 30; y++) {
    for (let x = 0; x < 30; x++) {
      map.setTerrain(x, y, 'floor');
    }
  }

  // Player at (5, 5)
  const player = EntityFactory.createPlayer(5, 5);
  player.addComponent('InventoryContainer', {}); // Mark as player
  map.addEntity(player, 5, 5);

  // Zombie at (5, 8) - 3 tiles away from player/turret
  const zombie = EntityFactory.createZombie(5, 8, 'basic', 'zombie-1');
  zombie.hp = 20;
  zombie.maxAp = 0;
  zombie.ap = 0;
  map.addEntity(zombie, 5, 8);

  // Initialize engine
  engine.reset();
  engine.gameMap = map;
  engine.player = player;

  const inv = new InventoryManager();
  engine.inventoryManager = inv;

  // Sync ground container
  inv.syncWithMap(null, null, 5, 5, map);

  // Create Auto Turret
  console.log("Creating Auto Turret...");
  const turretData = createItemFromDef('placeable.auto_turret');
  const turret = new Item(turretData);
  inv.groundContainer.addItem(turret);

  // Create Battery
  console.log("Creating Large Battery...");
  const batteryData = createItemFromDef('tool.large_battery');
  const battery = new Item(batteryData);
  battery.ammoCount = 100;
  inv.groundContainer.addItem(battery);

  // Create Ammo (5.56 magazine)
  console.log("Creating 5.56 Magazine...");
  const magData = createItemFromDef('attachment.556_magazine');
  const mag = new Item(magData);
  mag.ammoCount = 30;
  inv.groundContainer.addItem(mag);

  // Attach components to turret
  console.log("Attaching battery...");
  inv.attachItemToWeapon(turret, 'battery', battery, 'ground');
  console.log("Attaching ammo...");
  inv.attachItemToWeapon(turret, 'ammo', mag, 'ground');

  // Turn turret ON
  console.log("Powering turret ON...");
  turret.isOn = true;

  console.log("Turret battery charge:", turret.attachments?.['battery']?.ammoCount);
  console.log("Turret magazine ammo:", turret.attachments?.['ammo']?.ammoCount);
  console.log("Zombie HP before movement:", zombie.hp);

  // Player moves away to (6, 6)
  console.log("\nPlayer moving from (5,5) to (6,6)...");
  player.x = 6;
  player.y = 6;
  player.logicalX = 6;
  player.logicalY = 6;
  inv.syncWithMap(5, 5, 6, 6, map);

  const tile55 = map.getTile(5, 5);
  console.log("Items on map tile (5, 5):", tile55?.inventoryItems?.map(i => `${i.name} (isOn: ${i.isOn})`));

  console.log("\n--- Processing Turn (Player away) ---");
  const actions = SimulationManager.runTurn(map, { player, isSleeping: false });

  console.log("\n--- Playback Turn via TurnManager ---");
  await turnManager.processQueue(actions, { gameMap: map, player });

  console.log("\n--- Turn Results ---");
  console.log("Zombie HP after turn:", zombie.hp);
  
  // Reload items on tile (5, 5) to see their updated state
  const updatedTurretData = map.getTile(5, 5)?.inventoryItems?.find(i => i.defId === 'placeable.auto_turret');
  console.log("Turret battery charge after turn:", updatedTurretData?.attachments?.['battery']?.ammoCount);
  console.log("Turret magazine ammo after turn:", updatedTurretData?.attachments?.['ammo']?.ammoCount);
  console.log("Turret isOn after turn:", updatedTurretData?.isOn);
}

runTest().catch(console.error);
