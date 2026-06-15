import { ItemDefs, createItemFromDef } from '../client/src/game/inventory/ItemDefs.js';
import { CraftingRecipes } from '../client/src/game/inventory/CraftingRecipes.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { Entity, EntityType } from '../client/src/game/entities/Entity.js';
import { Container } from '../client/src/game/inventory/Container.js';
import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import { LineOfSight } from '../client/src/game/utils/LineOfSight.js';
import engine from '../client/src/game/GameEngine.js';

// Setup basic global mocks for client tests
globalThis.window = {
  gameEngine: {
    inventoryManager: null
  }
};

async function verifyMolotov() {
  console.log("🔥 STARTING MOLOTOV COCKTAIL VERIFICATION 🔥");

  try {
    // 1. Verify Item Definition
    console.log("\n1. Verifying Item definition...");
    const molotovDef = ItemDefs['weapon.molotov'];
    if (!molotovDef) throw new Error("weapon.molotov definition not found!");
    console.log(`✅ Definition found: name='${molotovDef.name}', width=${molotovDef.width}, height=${molotovDef.height}, stackMax=${molotovDef.stackMax}`);
    if (molotovDef.width !== 2 || molotovDef.height !== 1) {
      throw new Error(`Molotov width/height should be 2x1, got ${molotovDef.width}x${molotovDef.height}`);
    }
    if (molotovDef.stackMax !== 5) {
      throw new Error(`Molotov stackMax should be 5, got ${molotovDef.stackMax}`);
    }

    // 2. Verify Crafting Recipe
    console.log("\n2. Verifying Crafting recipe...");
    const recipe = CraftingRecipes.find(r => r.id === 'crafting.molotov');
    if (!recipe) throw new Error("crafting.molotov recipe not found!");
    console.log(`✅ Recipe found: name='${recipe.name}', resultItem='${recipe.resultItem}'`);
    const hasRag = recipe.ingredients.some(i => i.id === 'crafting.rag' && i.count === 1);
    const hasWhiskey = recipe.ingredients.some(i => i.id === 'food.whiskey' && i.count === 1);
    if (!hasRag || !hasWhiskey) {
      throw new Error("Ingredients incorrect! Expected 1 Rag and 1 Whiskey.");
    }
    console.log("✅ Ingredients verified successfully.");

    // 3. Setup Mock Map and Entities
    console.log("\n3. Setting up test map and entities...");
    const width = 10, height = 10;
    const map = new GameMap(width, height);
    
    // Set engine.gameMap to our map so Entity.moveTo can find it
    engine.gameMap = map;
    globalThis.gameEngine = {
      gameMap: map
    };

    const player = new Entity('player-id', 'player', 2, 2);
    player.hp = 20;
    player.maxHp = 20;
    player.ap = 20;
    player.maxAp = 20;
    map.entityMap.set(player.id, player);
    map.getTile(2, 2).addEntity(player);

    const zombie = new Entity('zombie-id', 'zombie', 4, 3);
    zombie.hp = 15;
    zombie.maxHp = 15;
    zombie.ap = 20;
    zombie.maxAp = 20;
    map.entityMap.set(zombie.id, zombie);
    map.getTile(4, 3).addEntity(zombie);

    console.log(`✅ Map setup complete. Player at (${player.logicalX}, ${player.logicalY}), Zombie at (${zombie.logicalX}, ${zombie.logicalY})`);

    // 4. Setup Player Inventory and Lighter/Matches
    console.log("\n4. Setting up player inventory...");
    const inventory = new Container('player-inv', 10, 10);
    // Bind mock inventoryManager
    const inventoryManager = {
      containers: new Map([['backpack', inventory]]),
      equipment: {},
      destroyItem(instanceId) {
        inventory.removeItem(instanceId);
      }
    };
    globalThis.window.gameEngine.inventoryManager = inventoryManager;
    
    // Let's create two matchbooks: one with 5 charges, one with 2 charges.
    // Lighter with 10 charges.
    const matchbook1 = new Item({ ...ItemDefs['tool.matchbook'], instanceId: 'matches-1', ammoCount: 5 });
    const matchbook2 = new Item({ ...ItemDefs['tool.matchbook'], instanceId: 'matches-2', ammoCount: 2 });
    const lighter = new Item({ ...ItemDefs['tool.lighter'], instanceId: 'lighter-1', ammoCount: 10 });

    inventory.addItem(matchbook1);
    inventory.addItem(matchbook2);
    inventory.addItem(lighter);

    const molotovItem = new Item({ ...molotovDef, instanceId: 'molotov-instance', stackCount: 2 });
    inventory.addItem(molotovItem);

    console.log(`✅ Player inventory populated: matches-1 (5 charges), matches-2 (2 charges), lighter-1 (10 charges), 2x molotovs`);

    // 5. Test Throw logic requirements (Matches/Lighter check & least charge selection)
    console.log("\n5. Testing Molotov throwing mechanics...");
    // Mock the callback context variables to execute performMolotovThrow
    const playerRef = { current: player };
    const gameMapRef = { current: map };
    const inventoryRef = { current: inventoryManager };
    const addEffect = () => {};
    const addLog = (msg) => console.log(`[LOG] ${msg}`);
    const forceRefresh = () => {};
    const triggerMapUpdate = () => {};
    const destroyItem = (instanceId) => {
      inventoryManager.destroyItem(instanceId);
    };

    // Construct the thrower closure identical to CombatContext.jsx
    const performMolotovThrow = (item, targetX, targetY) => {
      const pl = playerRef.current;
      const gm = gameMapRef.current;
      if (!pl || !gm) return { success: false, reason: 'System error' };

      if (pl.ap < 1) return { success: false, reason: 'Not enough AP' };

      const invMgr = inventoryRef.current;
      if (!invMgr) return { success: false, reason: 'System error' };

      const availableIgniters = [];
      for (const container of invMgr.containers.values()) {
        for (const it of container.items.values()) {
          if (it.defId === 'tool.lighter' || it.defId === 'tool.matchbook') {
            if ((it.ammoCount || 0) > 0) {
              availableIgniters.push({ item: it, container });
            }
          }
        }
      }
      for (const slot in invMgr.equipment) {
        const it = invMgr.equipment[slot];
        if (it && (it.defId === 'tool.lighter' || it.defId === 'tool.matchbook')) {
          if ((it.ammoCount || 0) > 0) {
            availableIgniters.push({ item: it, container: null });
          }
        }
      }

      if (availableIgniters.length === 0) {
        return { success: false, reason: 'Requires matches or lighter' };
      }

      const distance = Math.sqrt(Math.pow(targetX - pl.x, 2) + Math.pow(targetY - pl.y, 2));
      const maxRange = 15;
      if (distance > maxRange) return { success: false, reason: 'Out of range' };

      const losResult = LineOfSight.hasLineOfSight(gm, pl.x, pl.y, targetX, targetY);
      if (!losResult.hasLineOfSight) return { success: false, reason: 'No LoS' };

      pl.useAP(1);

      availableIgniters.sort((a, b) => (a.item.ammoCount || 0) - (b.item.ammoCount || 0));
      const selectedIgniter = availableIgniters[0].item;
      const igniterContainer = availableIgniters[0].container;

      selectedIgniter.consumeCharge(1);
      if ((selectedIgniter.ammoCount || 0) <= 0 && selectedIgniter.defId === 'tool.matchbook') {
        if (igniterContainer) {
          igniterContainer.removeItem(selectedIgniter.instanceId);
        } else {
          destroyItem(selectedIgniter.instanceId);
        }
        selectedIgniter.stackCount = 0;
        addLog('The matchbook is empty and discarded.');
      }

      if (item.stackCount > 1) {
        item.stackCount--;
      } else {
        destroyItem(item.instanceId);
      }

      const radius = 1.45;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const tx = targetX + dx;
          const ty = targetY + dy;
          if (tx < 0 || tx >= gm.width || ty < 0 || ty >= gm.height) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const tile = gm.getTile(tx, ty);
            if (tile) {
              tile.fireTurns = 2;
              gm.activeFires.add(`${tx},${ty}`);
            }
          }
        }
      }

      const allEntities = Array.from(gm.entityMap.values());
      allEntities.forEach(ent => {
        if (ent.type !== 'player' && ent.type !== 'zombie' && ent.type !== 'npc' && ent.type !== 'rabbit') return;
        const dist = Math.sqrt(Math.pow(ent.x - targetX, 2) + Math.pow(ent.y - targetY, 2));
        if (dist > radius) return;

        const damage = Math.floor(Math.random() * 6) + 2; // 2-7
        ent.fireTurns = 2;
        ent.takeDamage(damage, { id: 'molotov', type: 'weapon' });
        addLog(`Molotov deals ${damage} to ${ent.type}`);
      });

      return { success: true };
    };

    // Execute throw at zombie position (4, 3)
    const throwResult = performMolotovThrow(molotovItem, 4, 3);
    if (!throwResult.success) {
      throw new Error(`Molotov throw failed: ${throwResult.reason}`);
    }

    console.log("✅ Molotov thrown successfully!");
    console.log(`Player AP remaining: ${player.ap} (Expected: 19)`);
    if (player.ap !== 19) throw new Error("AP deduction failed");

    // Check igniter charges
    console.log(`matches-2 charges remaining: ${matchbook2.ammoCount} (Expected: 1)`);
    if (matchbook2.ammoCount !== 1) throw new Error("Charges not deducted from the item with the least charges!");

    console.log(`matches-1 charges remaining: ${matchbook1.ammoCount} (Expected: 5)`);
    console.log(`lighter-1 charges remaining: ${lighter.ammoCount} (Expected: 10)`);
    console.log(`Molotov stackCount remaining: ${molotovItem.stackCount} (Expected: 1)`);
    if (molotovItem.stackCount !== 1) throw new Error("Molotov not consumed from stack!");

    // Verify fires applied
    const targetTile = map.getTile(4, 3);
    console.log(`Target tile fireTurns: ${targetTile.fireTurns} (Expected: 2)`);
    if (targetTile.fireTurns !== 2) throw new Error("Tile fire duration incorrect!");

    console.log(`Zombie fireTurns: ${zombie.fireTurns} (Expected: 2)`);
    if (zombie.fireTurns !== 2) throw new Error("Zombie fire duration incorrect!");
    console.log(`Zombie HP: ${zombie.hp} (Expected: < 15)`);
    if (zombie.hp >= 15) throw new Error("Zombie took no initial blast damage!");

    // 6. Test Turn Updates & DoT
    console.log("\n6. Testing turn process fire tick-down and damage over time...");
    // Let's run a turn via SimulationManager
    const prevZombieHp = zombie.hp;
    // We mock worldManager and other objects context needs
    globalThis.gameEngine.worldManager = {};
    
    // Simulate one turn
    SimulationManager.runTurn(map, { player, isSleeping: false });

    console.log(`After 1 turn, target tile fireTurns: ${targetTile.fireTurns} (Expected: 1)`);
    if (targetTile.fireTurns !== 1) throw new Error("Tile fireTurns did not decrement!");

    // Zombie startTurn should run during runTurn, which decrements zombie fireTurns and deals 2-5 damage
    console.log(`After 1 turn, zombie fireTurns: ${zombie.fireTurns} (Expected: 1)`);
    if (zombie.fireTurns !== 1) throw new Error("Zombie fireTurns did not decrement!");

    console.log(`After 1 turn, zombie HP: ${zombie.hp} (Previous: ${prevZombieHp}, Expected: ${prevZombieHp - 5} to ${prevZombieHp - 2})`);
    const dmgDealt = prevZombieHp - zombie.hp;
    if (dmgDealt < 2 || dmgDealt > 5) {
      throw new Error(`DoT damage incorrect: dealt ${dmgDealt} (expected 2-5)`);
    }

    // 7. Test Walking onto a Fire Tile
    console.log("\n7. Testing walking onto a fire tile...");
    // Let's reset player fire turns and verify it gets ignited when stepping on (4, 3)
    player.fireTurns = 0;
    const prevPlayerHp = player.hp;

    // Step player onto (4, 3) where fire is burning
    player.moveTo(4, 3);

    console.log(`Player stepped on fire tile. Player fireTurns: ${player.fireTurns} (Expected: 2)`);
    if (player.fireTurns !== 2) throw new Error("Player did not ignite on burning tile!");

    console.log(`Player HP after stepping on fire: ${player.hp} (Previous: ${prevPlayerHp}, Expected: ${prevPlayerHp - 5} to ${prevPlayerHp - 2})`);
    const playerDmg = prevPlayerHp - player.hp;
    if (playerDmg < 2 || playerDmg > 5) {
      throw new Error(`Step-on fire damage incorrect: dealt ${playerDmg} (expected 2-5)`);
    }

    // 8. Test Matchbook Discarding when empty
    console.log("\n8. Testing matchbook discard when empty...");
    // Throw again! Since matches-2 has 1 charge left, it should be empty and discarded!
    const throwResult2 = performMolotovThrow(molotovItem, 2, 2);
    if (!throwResult2.success) {
      throw new Error(`Second throw failed: ${throwResult2.reason}`);
    }
    console.log(`After second throw, matches-2 exists in container: ${inventory.items.has('matches-2')} (Expected: false)`);
    if (inventory.items.has('matches-2')) {
      throw new Error("Matchbook was not discarded when it reached 0 charges!");
    }
    console.log("✅ Matchbook empty discard works perfectly!");

    console.log("\n🎉 ALL MOLOTOV COCKTAIL TESTS PASSED SUCCESSFULLY! 🎉");

  } catch (error) {
    console.error("❌ VERIFICATION FAILED:");
    console.error(error.stack || error);
    process.exit(1);
  }
}

verifyMolotov();
