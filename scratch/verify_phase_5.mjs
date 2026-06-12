import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Entity } from '../client/src/game/entities/Entity.js';
import { Position } from '../client/src/game/components/Position.js';
import { Health } from '../client/src/game/components/Health.js';
import { Renderable } from '../client/src/game/components/Renderable.js';
import { Movable } from '../client/src/game/components/Movable.js';
import { AIBehavior } from '../client/src/game/components/AIBehavior.js';
import { LightEmitter } from '../client/src/game/components/LightEmitter.js';

// Mock window and crypto for node environments
if (typeof global.window === 'undefined') {
  global.window = {};
}
if (typeof crypto === 'undefined') {
  global.crypto = {
    randomUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };
}

async function runVerification() {
  console.log("Starting Phase 5 ECS Serialization & Hydration Verification...");

  try {
    // 1. Create a Player entity and serialize/deserialize
    console.log("\nTesting Player Entity...");
    const player = EntityFactory.createPlayer(12, 34);
    player.hp = 18;
    player.ap = 15;
    
    const playerJSON = player.toJSON();
    console.log("Player JSON:", JSON.stringify(playerJSON, null, 2));

    const restoredPlayer = Entity.fromJSON(playerJSON);

    // Assertions on Player
    if (restoredPlayer.type !== 'player') throw new Error("Restored type mismatch");
    if (restoredPlayer.gridX !== 12 || restoredPlayer.gridY !== 34) throw new Error("Restored position mismatch");
    if (restoredPlayer.hp !== 18) throw new Error(`Restored HP mismatch: expected 18, got ${restoredPlayer.hp}`);
    if (restoredPlayer.ap !== 15) throw new Error(`Restored AP mismatch: expected 15, got ${restoredPlayer.ap}`);
    
    // Assert components are hydrated into class instances
    const pPos = restoredPlayer.getComponent('Position');
    const pHealth = restoredPlayer.getComponent('Health');
    
    if (!(pPos instanceof Position)) throw new Error("Restored Position component is not an instance of Position class");
    if (!(pHealth instanceof Health)) throw new Error("Restored Health component is not an instance of Health class");
    
    console.log("✅ Player serialization and hydration passed!");

    // 2. Create a Zombie entity (with subtype) and serialize/deserialize
    console.log("\nTesting Zombie Entity (crawler)...");
    const zombie = EntityFactory.createZombie(5, 5, 'crawler');
    zombie.hp = 5;
    
    const zombieJSON = zombie.toJSON();
    const restoredZombie = Entity.fromJSON(zombieJSON);

    // Assertions on Zombie
    if (restoredZombie.type !== 'zombie') throw new Error("Restored type mismatch");
    if (restoredZombie.subtype !== 'crawler') throw new Error("Restored subtype mismatch");
    if (restoredZombie.hp !== 5) throw new Error(`Restored HP mismatch: expected 5, got ${restoredZombie.hp}`);
    
    const zAI = restoredZombie.getComponent('AIBehavior');
    if (!(zAI instanceof AIBehavior)) throw new Error("Restored AIBehavior component is not an instance of AIBehavior class");
    
    console.log("✅ Zombie serialization and hydration passed!");

    // 3. Create a Flashlight entity and serialize/deserialize
    console.log("\nTesting Flashlight Entity...");
    const flashlight = EntityFactory.createFlashlight(8, 8);
    const light = flashlight.getComponent('LightEmitter');
    light.isOn = true;
    
    const flashlightJSON = flashlight.toJSON();
    const restoredFlashlight = Entity.fromJSON(flashlightJSON);

    const restoredLight = restoredFlashlight.getComponent('LightEmitter');
    if (!(restoredLight instanceof LightEmitter)) throw new Error("Restored LightEmitter component is not an instance of LightEmitter class");
    if (!restoredLight.isOn) throw new Error("Restored LightEmitter.isOn should be true");

    console.log("✅ Flashlight serialization and hydration passed!");

    // 4. Create NPC and verify inventory hydration (needs short sleep/delay due to dynamic import)
    console.log("\nTesting NPC Entity with inventory...");
    const npc = EntityFactory.createNPC(20, 20, true, 'survivor', 'Testy NPC');
    
    const npcJSON = npc.toJSON();
    const restoredNPC = Entity.fromJSON(npcJSON);

    // Wait for dynamic import of Container.js in Entity.fromJSON
    console.log("Waiting for dynamic inventory hydration...");
    await new Promise(resolve => setTimeout(resolve, 100));

    if (restoredNPC.type !== 'npc') throw new Error("Restored NPC type mismatch");
    if (restoredNPC.name !== 'Testy NPC') throw new Error("Restored NPC name mismatch");
    if (!restoredNPC.inventory) throw new Error("Restored NPC inventory is missing!");
    if (restoredNPC.inventory.name !== "Testy NPC's Inventory") throw new Error(`NPC inventory name mismatch: ${restoredNPC.inventory.name}`);

    console.log("✅ NPC inventory hydration passed!");

    console.log("\n🎉 Phase 5 ECS Serialization & Hydration Verification Complete! All assertions passed successfully.");
  } catch (error) {
    console.error("❌ Verification failed with error:", error);
    process.exit(1);
  }
}

runVerification();
