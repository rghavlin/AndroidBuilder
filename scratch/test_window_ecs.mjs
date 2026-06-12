import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';
import { CombatSystem } from '../client/src/game/systems/CombatSystem.js';
import { Window } from '../client/src/game/entities/Window.js';
import engine from '../client/src/game/GameEngine.js';

async function runFullTileTest() {
  console.log("\n=======================================");
  console.log("--- Running Full-Tile Window Test ---");
  console.log("=======================================");

  const gameMap = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      gameMap.setTerrain(x, y, 'floor');
    }
  }

  engine.gameMap = gameMap;
  engine.worldManager = {};

  const player = EntityFactory.createPlayer(5, 5);
  gameMap.addEntity(player, 5, 5);

  const zombie = EntityFactory.createZombie(5, 3, 'basic', 'zombie-full');
  gameMap.addEntity(zombie, 5, 3);

  const windowEntity = new Window('window-full', 5, 4, false, false, false, undefined);
  gameMap.addEntity(windowEntity, 5, 4);

  const ecsEntities = [player, zombie];

  for (let turn = 1; turn <= 3; turn++) {
    console.log(`\n--- Turn ${turn} ---`);
    zombie.startTurn();

    const actionQueue = [];
    let tick = 0;
    while ((zombie.currentAP > 0 || zombie.ap > 0) && tick < 5) {
      tick++;
      AISystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
      const hasIntents = ecsEntities.some(e => e.hasComponent('MoveIntent') || e.hasComponent('DamageIntent'));
      if (!hasIntents) break;
      MovementSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
      CombatSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
    }

    console.log(`Zombie Pos: (${zombie.logicalX}, ${zombie.logicalY}), AP: ${zombie.currentAP}`);
    console.log(`Window isBroken: ${windowEntity.isBroken}, isOpen: ${windowEntity.isOpen}`);
    console.log(`Actions:`, JSON.stringify(actionQueue));
  }
}

async function runEdgeTest() {
  console.log("\n=======================================");
  console.log("--- Running Edge-Based Window Test ---");
  console.log("=======================================");

  const gameMap = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      gameMap.setTerrain(x, y, 'floor');
    }
  }

  engine.gameMap = gameMap;
  engine.worldManager = {};

  const player = EntityFactory.createPlayer(5, 4);
  gameMap.addEntity(player, 5, 4);

  const zombie = EntityFactory.createZombie(5, 3, 'basic', 'zombie-edge');
  gameMap.addEntity(zombie, 5, 3);

  // Window on the south edge of tile (5, 3)
  const windowEntity = new Window('window-edge', 5, 3, false, false, false, 's');
  gameMap.addEntity(windowEntity, 5, 3);

  // Set the edge walls
  gameMap.getTile(5, 3).edgeWalls.s = true;
  gameMap.getTile(5, 4).edgeWalls.n = true;

  const ecsEntities = [player, zombie];

  for (let turn = 1; turn <= 3; turn++) {
    console.log(`\n--- Turn ${turn} ---`);
    zombie.startTurn();

    const actionQueue = [];
    let tick = 0;
    while ((zombie.currentAP > 0 || zombie.ap > 0) && tick < 5) {
      tick++;
      AISystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
      const hasIntents = ecsEntities.some(e => e.hasComponent('MoveIntent') || e.hasComponent('DamageIntent'));
      if (!hasIntents) break;
      MovementSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
      CombatSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
    }

    console.log(`Zombie Pos: (${zombie.logicalX}, ${zombie.logicalY}), AP: ${zombie.currentAP}`);
    console.log(`Window isBroken: ${windowEntity.isBroken}, isOpen: ${windowEntity.isOpen}`);
    console.log(`Actions:`, JSON.stringify(actionQueue));
  }
}

async function runMultipleZombiesTest() {
  console.log("\n============================================");
  console.log("--- Running Multiple Zombies Window Test ---");
  console.log("============================================");

  const gameMap = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      gameMap.setTerrain(x, y, 'floor');
    }
  }

  engine.gameMap = gameMap;
  engine.worldManager = {};

  const player = EntityFactory.createPlayer(5, 5);
  gameMap.addEntity(player, 5, 5);

  const zombie1 = EntityFactory.createZombie(5, 3, 'basic', 'zombie-1');
  const zombie2 = EntityFactory.createZombie(4, 3, 'basic', 'zombie-2');
  gameMap.addEntity(zombie1, 5, 3);
  gameMap.addEntity(zombie2, 4, 3);

  const windowEntity = new Window('window-shared', 5, 4, false, false, false, undefined);
  gameMap.addEntity(windowEntity, 5, 4);

  const ecsEntities = [player, zombie1, zombie2];

  console.log(`\n--- Turn 1 ---`);
  zombie1.startTurn();
  zombie2.startTurn();

  const actionQueue = [];
  let tick = 0;
  while (tick < 3) {
    tick++;
    AISystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
    MovementSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
    CombatSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
  }

  console.log(`Window isBroken: ${windowEntity.isBroken}`);
  console.log(`Actions queued:`, JSON.stringify(actionQueue, null, 2));
}

async function runWanderTest() {
  console.log("\n=======================================");
  console.log("--- Running Wander / Sight Block Test ---");
  console.log("=======================================");

  const gameMap = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      gameMap.setTerrain(x, y, 'floor');
    }
  }

  engine.gameMap = gameMap;
  engine.worldManager = {};

  // Player at (8, 8)
  const player = EntityFactory.createPlayer(8, 8);
  gameMap.addEntity(player, 8, 8);

  // Zombie at (2, 2)
  const zombie = EntityFactory.createZombie(2, 2, 'basic', 'zombie-wander');
  gameMap.addEntity(zombie, 2, 2);

  // Put solid walls at row y=5 to block sight/pathfinding completely
  for (let x = 0; x < 10; x++) {
    gameMap.setTerrain(x, 5, 'wall');
  }

  const ecsEntities = [player, zombie];

  console.log(`Initial Zombie Pos: (${zombie.logicalX}, ${zombie.logicalY})`);
  console.log(`Player Pos: (${player.logicalX}, ${player.logicalY})`);

  zombie.startTurn();

  const actionQueue = [];
  // Run 1 tick
  AISystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
  MovementSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);

  console.log(`Zombie Behavior State: ${zombie.behaviorState}`);
  console.log(`Zombie New Pos: (${zombie.logicalX}, ${zombie.logicalY})`);
  console.log(`Actions queued:`, JSON.stringify(actionQueue));
}

async function main() {
  await runFullTileTest();
  await runEdgeTest();
  await runMultipleZombiesTest();
  await runWanderTest();
}

main().catch(console.error);
