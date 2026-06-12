import { EntityFactory } from '../client/src/game/EntityFactory.js';

console.log("Starting Phase 2 Verification...");

try {
  // Create a zombie entity
  const zombie = EntityFactory.createZombie(5, 10);
  console.log("Created zombie entity:", zombie);

  // Assert zombie has AIBehavior component
  const hasAI = zombie.hasComponent('AIBehavior');
  const aiComp = zombie.getComponent('AIBehavior');
  console.log("Has AIBehavior:", hasAI);
  if (!hasAI || !aiComp) {
    throw new Error("Assertion failed: Zombie should have AIBehavior component.");
  }
  if (aiComp.state !== 'idle') {
    throw new Error(`Assertion failed: Zombie AIBehavior state should be 'idle', got: ${aiComp.state}`);
  }

  // Assert zombie has Renderable component
  const hasRenderable = zombie.hasComponent('Renderable');
  const renderComp = zombie.getComponent('Renderable');
  console.log("Has Renderable:", hasRenderable);
  if (!hasRenderable || !renderComp) {
    throw new Error("Assertion failed: Zombie should have Renderable component.");
  }
  if (renderComp.spriteId !== 'zombie') {
    throw new Error(`Assertion failed: Zombie spriteId should be 'zombie', got: ${renderComp.spriteId}`);
  }
  if (renderComp.color !== '#ffffff') {
    throw new Error(`Assertion failed: Zombie color should be '#ffffff', got: ${renderComp.color}`);
  }

  // Assert zombie does not have InventoryContainer component
  const hasInventory = zombie.hasComponent('InventoryContainer');
  console.log("Has InventoryContainer:", hasInventory);
  if (hasInventory) {
    throw new Error("Assertion failed: Zombie should NOT have InventoryContainer component.");
  }

  // Create player entity to verify as well
  const player = EntityFactory.createPlayer(2, 3);
  console.log("Created player entity:", player);
  if (!player.hasComponent('InventoryContainer')) {
    throw new Error("Assertion failed: Player should have InventoryContainer component.");
  }
  if (!player.hasComponent('Position')) {
    throw new Error("Assertion failed: Player should have Position component.");
  }

  // Create flashlight entity to verify
  const flashlight = EntityFactory.createFlashlight(1, 1);
  console.log("Created flashlight entity:", flashlight);
  if (!flashlight.hasComponent('LightEmitter')) {
    throw new Error("Assertion failed: Flashlight should have LightEmitter component.");
  }
  if (!flashlight.hasComponent('ItemData')) {
    throw new Error("Assertion failed: Flashlight should have ItemData component.");
  }

  console.log("Phase 2 Verification Complete! All assertions passed successfully.");
} catch (error) {
  console.error("Verification failed with error:", error);
  process.exit(1);
}
