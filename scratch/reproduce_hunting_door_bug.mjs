import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Door } from '../client/src/game/entities/Door.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';
import { CombatSystem } from '../client/src/game/systems/CombatSystem.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';
import { IntentQueue } from '../client/src/game/managers/IntentQueue.js';

async function testHuntingDoorBug() {
  console.log("--- Reproducing Zombie Hunting Door Bug ---");
  const gameMap = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      gameMap.setTerrain(x, y, 'floor');
    }
  }

  // Player at (5, 5)
  const player = EntityFactory.createPlayer(5, 5);
  gameMap.addEntity(player, 5, 5);

  // Basic Zombie at (4, 5) (adjacent to door and player)
  const zombie = EntityFactory.createZombie(4, 5, 'basic', 'zombie-1');
  zombie.currentAP = 10;
  zombie.addComponent('AIBehavior', { alertnessState: 'INVESTIGATING', lastSeenPlayerCoords: { x: 5, y: 5 } });
  zombie.addComponent('Vision', { visibleEntities: [] }); // No current visibility
  gameMap.addEntity(zombie, 4, 5);

  // Closed door at (4, 5) on the East edge
  const door = new Door('door-4-5', 4, 5, false, false, false, 'e');
  door.hp = 20;
  gameMap.addEntity(door, 4, 5);

  const entities = [player, zombie];
  
  const engine = {
    gameMap,
    worldManager: null,
    _uiDirty: false
  };

  const actionQueue = [];
  const intentQueue = new IntentQueue();

  console.log(`Initial Pos: Zombie(${zombie.getComponent('Position').x}, ${zombie.getComponent('Position').y}), Player(${player.getComponent('Position').x}, ${player.getComponent('Position').y})`);
  console.log(`Door Pos: (${door.logicalX}, ${door.logicalY}), isOpen: ${door.isOpen}, edge: ${door.edge}`);
  console.log(`Initial AP: ${zombie.currentAP}`);

  // Run AISystem
  const intentsCount = AISystem.process(entities, engine.worldManager, engine, actionQueue, intentQueue);
  console.log(`Intents generated: ${intentsCount}`);
  console.log(`AI Behavior path: ${JSON.stringify(zombie.getComponent('AIBehavior').currentPath)}`);
  
  if (intentQueue.queue.length > 0) {
    for (const item of intentQueue.queue) {
      console.log(`Intent generated: type=${item.type}, component=${JSON.stringify(item.component)}`);
    }
  } else {
    console.log("No intents queued!");
  }
}

testHuntingDoorBug().catch(console.error);
