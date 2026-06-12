import { IntentQueue } from '../client/src/game/managers/IntentQueue.js';
import { CombatSystem } from '../client/src/game/systems/CombatSystem.js';
import { DamageIntent } from '../client/src/game/components/DamageIntent.js';
import { Position } from '../client/src/game/components/Position.js';

class MockEntity {
  constructor(id, type, hp, ap, damageAmount = 2) {
    this.id = id;
    this.type = type;
    this.hp = hp;
    this.ap = ap;
    this.damageAmount = damageAmount;
    this.components = new Map();
    this.isBroken = false;
    this.isOpen = false;
    this.isDamaged = false;
    this.logicalX = 0;
    this.logicalY = 0;
    this.addComponent('Position', new Position({ x: 0, y: 0 }));
  }

  addComponent(name, comp) {
    this.components.set(name, comp);
  }

  getComponent(name) {
    return this.components.get(name);
  }

  removeComponent(name) {
    this.components.delete(name);
  }

  hasComponent(name) {
    return this.components.has(name);
  }

  takeDamage(amount, silent = false) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.isBroken = true;
      this.isOpen = true;
      this.isDamaged = true;
    }
    return { isBroken: this.isBroken };
  }
}

class MockTile {
  constructor() {
    this.contents = [];
  }
}

class MockGameMap {
  constructor() {
    this.tiles = {};
  }
  getTile(x, y) {
    const key = `${x},${y}`;
    if (!this.tiles[key]) {
      this.tiles[key] = new MockTile();
    }
    return this.tiles[key];
  }
  getEntity(id) {
    return null;
  }
  removeEntity(id) {}
}

function runTest(testName, setupFn, verifyFn) {
  console.log(`--- Running: ${testName} ---`);
  const { attacker, target, damageIntent, gameMap } = setupFn();
  const entities = [attacker]; // Only active entities (e.g. attacker)
  const intentQueue = new IntentQueue();
  const actionQueue = [];

  CombatSystem.resolve(
    attacker,
    damageIntent,
    entities,
    gameMap,
    intentQueue,
    actionQueue,
    null,
    null
  );

  verifyFn(attacker, target, intentQueue, actionQueue);
  console.log('-----------------------------\n');
}

// Case 1: Structure with 20 HP, Attacker has 20 AP, damage = 2
runTest(
  'Case 1: Full structure destruction with ample AP',
  () => {
    const attacker = new MockEntity('zombie_1', 'zombie', 10, 20, 2);
    const target = new MockEntity('door_1', 'door', 20, 0, 0); // door target
    const gameMap = new MockGameMap();
    gameMap.getTile(1, 1).contents.push(target);

    const damageIntent = new DamageIntent({
      amount: 2,
      targetId: 'door_1',
      isStructure: true,
      targetX: 1,
      targetY: 1
    });
    return { attacker, target, damageIntent, gameMap };
  },
  (attacker, target, intentQueue, actionQueue) => {
    console.log(`Attacker final AP: ${attacker.ap} (Expected: 10)`);
    console.log(`Target final HP: ${target.hp} (Expected: 0)`);
    console.log(`Target isBroken: ${target.isBroken} (Expected: true)`);
    console.log(`Action Queue length: ${actionQueue.length} (Expected: 1)`);
    if (actionQueue[0]) {
      console.log(`Action damage: ${actionQueue[0].data.damage} (Expected: 20)`);
      console.log(`Action type: ${actionQueue[0].type} (Expected: STRUCTURE_INTERACT)`);
    }
    console.log(`Intent Queue contents:`, intentQueue.queue.map(i => i.type));
  }
);

// Case 2: Structure with 1 HP remaining, Attacker has 20 AP, damage = 2
runTest(
  'Case 2: 1 HP structure remaining, excess AP',
  () => {
    const attacker = new MockEntity('zombie_1', 'zombie', 10, 20, 2);
    const target = new MockEntity('door_1', 'door', 1, 0, 0);
    const gameMap = new MockGameMap();
    gameMap.getTile(1, 1).contents.push(target);

    const damageIntent = new DamageIntent({
      amount: 2,
      targetId: 'door_1',
      isStructure: true,
      targetX: 1,
      targetY: 1
    });
    return { attacker, target, damageIntent, gameMap };
  },
  (attacker, target, intentQueue, actionQueue) => {
    console.log(`Attacker final AP: ${attacker.ap} (Expected: 19)`);
    console.log(`Target final HP: ${target.hp} (Expected: 0)`);
    console.log(`Target isBroken: ${target.isBroken} (Expected: true)`);
    console.log(`Action Queue length: ${actionQueue.length} (Expected: 1)`);
    if (actionQueue[0]) {
      console.log(`Action damage: ${actionQueue[0].data.damage} (Expected: 2)`);
    }
  }
);

// Case 3: Structure with 20 HP, Attacker has 5 AP, damage = 2
runTest(
  'Case 3: Ample structure health, limited AP',
  () => {
    const attacker = new MockEntity('zombie_1', 'zombie', 10, 5, 2);
    const target = new MockEntity('door_1', 'door', 20, 0, 0);
    const gameMap = new MockGameMap();
    gameMap.getTile(1, 1).contents.push(target);

    const damageIntent = new DamageIntent({
      amount: 2,
      targetId: 'door_1',
      isStructure: true,
      targetX: 1,
      targetY: 1
    });
    return { attacker, target, damageIntent, gameMap };
  },
  (attacker, target, intentQueue, actionQueue) => {
    console.log(`Attacker final AP: ${attacker.ap} (Expected: 0)`);
    console.log(`Target final HP: ${target.hp} (Expected: 10)`);
    console.log(`Target isBroken: ${target.isBroken} (Expected: false)`);
    console.log(`Action Queue length: ${actionQueue.length} (Expected: 1)`);
    if (actionQueue[0]) {
      console.log(`Action damage: ${actionQueue[0].data.damage} (Expected: 10)`);
    }
  }
);

// Case 4: Structure with 20 HP, Attacker has 0 AP, damage = 2 (ensure at least 1 hit)
runTest(
  'Case 4: Structure with 20 HP, Attacker has 0 AP (ensure 1 hit minimum)',
  () => {
    const attacker = new MockEntity('zombie_1', 'zombie', 10, 0, 2);
    const target = new MockEntity('door_1', 'door', 20, 0, 0);
    const gameMap = new MockGameMap();
    gameMap.getTile(1, 1).contents.push(target);

    const damageIntent = new DamageIntent({
      amount: 2,
      targetId: 'door_1',
      isStructure: true,
      targetX: 1,
      targetY: 1
    });
    return { attacker, target, damageIntent, gameMap };
  },
  (attacker, target, intentQueue, actionQueue) => {
    console.log(`Attacker final AP: ${attacker.ap} (Expected: 0)`);
    console.log(`Target final HP: ${target.hp} (Expected: 18)`);
    console.log(`Target isBroken: ${target.isBroken} (Expected: false)`);
    console.log(`Action Queue length: ${actionQueue.length} (Expected: 1)`);
    if (actionQueue[0]) {
      console.log(`Action damage: ${actionQueue[0].data.damage} (Expected: 2)`);
    }
  }
);

// Case 5: DestroyIntent enqueued for non-door/non-window structure
runTest(
  'Case 5: DestroyIntent enqueued for generic structure',
  () => {
    const attacker = new MockEntity('zombie_1', 'zombie', 10, 20, 5);
    const target = new MockEntity('barricade_1', 'structure', 5, 0, 0);
    const gameMap = new MockGameMap();
    gameMap.getTile(1, 1).contents.push(target);

    const damageIntent = new DamageIntent({
      amount: 5,
      targetId: 'barricade_1',
      isStructure: true,
      targetX: 1,
      targetY: 1
    });
    return { attacker, target, damageIntent, gameMap };
  },
  (attacker, target, intentQueue, actionQueue) => {
    console.log(`Target isBroken: ${target.isBroken} (Expected: true)`);
    console.log(`Intent Queue contents:`, intentQueue.queue.map(i => i.type));
  }
);
