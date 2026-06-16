import { IntentQueue } from '../client/src/game/managers/IntentQueue.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';
import { CombatSystem } from '../client/src/game/systems/CombatSystem.js';
import { DestructionSystem } from '../client/src/game/systems/DestructionSystem.js';
import { AudioSystem } from '../client/src/game/systems/AudioSystem.js';
import { MoveIntent } from '../client/src/game/components/MoveIntent.js';
import { DamageIntent } from '../client/src/game/components/DamageIntent.js';
import { DestroyIntent } from '../client/src/game/components/DestroyIntent.js';
import { NoiseEvent } from '../client/src/game/components/NoiseEvent.js';
import { AIBehavior } from '../client/src/game/components/AIBehavior.js';
import { Movable } from '../client/src/game/components/Movable.js';
import { Position } from '../client/src/game/components/Position.js';

// --- MOCK SYSTEM SETUPS ---

class MockEntity {
  constructor(id, type, x, y, hp = 10, ap = 5) {
    this.id = id;
    this.type = type;
    this.subtype = null;
    this.x = x;
    this.y = y;
    this.logicalX = x;
    this.logicalY = y;
    this.gridX = x;
    this.gridY = y;
    this.hp = hp;
    this.maxHp = hp;
    this.ap = ap;
    this.currentAP = ap;
    this.components = new Map();
    this.isBroken = false;
    this.isOpen = false;
    this.isDamaged = false;
    this.heardNoise = false;
    this.noiseCoords = { x: 0, y: 0 };
    this.behaviorState = 'idle';

    // Add default Position & Movable components
    this.addComponent('Position', new Position({ x, y }));
    this.addComponent('Movable', new Movable({ apCost: 1 }));
  }

  addComponent(nameOrComponent, componentData = null) {
    if (typeof nameOrComponent === 'string') {
      this.components.set(nameOrComponent, componentData);
    } else {
      const name = nameOrComponent.constructor.name;
      this.components.set(name, nameOrComponent);
    }
  }

  removeComponent(name) {
    this.components.delete(name);
  }

  getComponent(name) {
    return this.components.get(name);
  }

  hasComponent(name) {
    return this.components.has(name);
  }

  takeDamage(amount, isSilent = false) {
    const oldHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.isBroken = true;
    }
    return { damageDealt: amount, isBroken: this.isBroken };
  }

  setNoiseHeard(x, y) {
    this.heardNoise = true;
    this.noiseCoords = { x, y };
  }
}

class MockTile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.contents = [];
    this.edgeWalls = {};
  }
  isWalkable(entity, options) {
    return true;
  }
  addEntity(entity) {}
  removeEntity(entityId) {
    this.contents = this.contents.filter(e => e.id !== entityId);
  }
}

class MockGameMap {
  constructor() {
    this.entityMap = new Map();
    this.tiles = Array.from({ length: 20 }, (_, y) =>
      Array.from({ length: 20 }, (_, x) => new MockTile(x, y))
    );
  }
  getTile(x, y) {
    if (x >= 0 && x < 20 && y >= 0 && y < 20) {
      return this.tiles[y][x];
    }
    return null;
  }
  getEntity(id) {
    return this.entityMap.get(id);
  }
  addEntity(entity, x, y) {
    this.entityMap.set(entity.id, entity);
    const tile = this.getTile(x, y);
    if (tile) tile.contents.push(entity);
  }
  removeEntity(id) {
    const entity = this.entityMap.get(id);
    if (entity) {
      const tile = this.getTile(entity.logicalX, entity.logicalY);
      if (tile) tile.removeEntity(id);
      this.entityMap.delete(id);
    }
  }
  getEntitiesByType(type) {
    return Array.from(this.entityMap.values()).filter(e => e.type === type);
  }
  moveEntity(entityId, newX, newY, options) {
    const entity = this.entityMap.get(entityId);
    if (entity) {
      const tileOld = this.getTile(entity.logicalX, entity.logicalY);
      if (tileOld) tileOld.removeEntity(entityId);
      
      entity.logicalX = newX;
      entity.logicalY = newY;
      entity.gridX = newX;
      entity.gridY = newY;
      
      const pos = entity.getComponent('Position');
      if (pos) {
        pos.x = newX;
        pos.y = newY;
      }
      
      const tileNew = this.getTile(newX, newY);
      if (tileNew) tileNew.contents.push(entity);
      return true;
    }
    return false;
  }
}

// Mock engine
const mockEngine = {
  gameMap: new MockGameMap(),
  _uiDirty: false
};

// --- RUN TESTS ---

async function runTests() {
  console.log('🧪 Starting IntentQueue and Cascade System Verification Tests...\n');

  // ==========================================
  // TEST 1: FIFO Execution Order
  // ==========================================
  {
    console.log('--- Test 1: FIFO Execution Order ---');
    const map = new MockGameMap();
    const engine = { gameMap: map, _uiDirty: false };
    const queue = new IntentQueue();
    const actionQueue = [];

    const zombie = new MockEntity('zombie_1', 'zombie', 10, 10);
    map.addEntity(zombie, 10, 10);

    // Enqueue 3 MoveIntents sequentially
    queue.enqueue(zombie.id, 'MoveIntent', new MoveIntent({ dx: 1, dy: 0 })); // (11, 10)
    queue.enqueue(zombie.id, 'MoveIntent', new MoveIntent({ dx: 0, dy: 1 })); // (11, 11)
    queue.enqueue(zombie.id, 'MoveIntent', new MoveIntent({ dx: -1, dy: 0 })); // (10, 11)

    queue.resolve([zombie], null, engine, actionQueue);

    const pos = zombie.getComponent('Position');
    console.log(`Final Position: (${pos.x}, ${pos.y}) [Expected: (10, 11)]`);
    console.log('Visual actions captured:', actionQueue.map(a => `${a.type} to (${a.data.to.x}, ${a.data.to.y})`));
    
    if (pos.x === 10 && pos.y === 11 && actionQueue.length === 3) {
      console.log('✅ TEST 1 PASSED: FIFO execution is strictly sequential.\n');
    } else {
      console.error('❌ TEST 1 FAILED!\n');
    }
  }

  // ==========================================
  // TEST 2: Explosion Cascade and AI Alerting
  // ==========================================
  {
    console.log('--- Test 2: Explosion Cascade & AI Alerting ---');
    const map = new MockGameMap();
    const engine = { gameMap: map, _uiDirty: false, turnPhase: 'SIMULATING' };
    const queue = new IntentQueue();
    const actionQueue = [];

    // Create entities: player, zombie (hears sound), and structure (barricade)
    const player = new MockEntity('player_1', 'player', 2, 2);
    const zombie = new MockEntity('zombie_1', 'zombie', 6, 5);
    zombie.addComponent('AIBehavior', new AIBehavior());
    
    // Barricade is a structure with 5 HP
    const barricade = new MockEntity('barricade_1', 'structure', 5, 6, 5);
    barricade.isStructure = true; // custom flag for mocking

    map.addEntity(player, 2, 2);
    map.addEntity(zombie, 6, 5);
    map.addEntity(barricade, 5, 6);

    const entities = [player, zombie];

    // Enqueue a custom ExplosionIntent that we'll simulate.
    // In our ECS, resolving the explosion directly enqueues the secondary intents.
    // Let's create a custom type in processIntent or handle it here by enqueuing the explosion's immediate secondary intents:
    // Explosion at (5, 6) with radius 2 enqueues:
    // - DamageIntent(barricade, amount 5) [depth 0]
    // - DamageIntent(zombie, amount 5) [depth 0]
    // - NoiseEvent(5, 6, volume 10) [depth 0]
    queue.enqueue(player.id, 'DamageIntent', new DamageIntent({
      amount: 5,
      targetId: barricade.id,
      isStructure: true,
      targetX: 5,
      targetY: 6
    }));

    console.log('Resolving queue with explosion cascade...');
    queue.resolve(entities, null, engine, actionQueue);

    // Verify cascade outcomes:
    // 1. DamageIntent on barricade (HP 5) should drop barricade HP to 0 and trigger structure break (broken = true).
    // 2. This should enqueue DestroyIntent on barricade.
    // 3. DestroyIntent should resolve:
    //    - Remove barricade from map
    //    - Enqueue NoiseEvent(5, 6, volume 10)
    // 4. NoiseEvent should resolve:
    //    - zombie_1 (at 6, 5; distance to (5,6) is sqrt(1^2 + 1^2) = 1.414 <= 10) hears it.
    //    - Alerts zombie_1 (heardNoise = true, noiseCoords = {x: 5, y: 6}).
    //    - Enqueues MoveIntent for zombie_1 towards (5, 6) in the same tick!
    // 5. MoveIntent resolves:
    //    - zombie_1 moves to adjacent coordinate towards noise. (zombie was at (6, 5), target (5, 6); dy = 1, dx = -1. Step is (-1, 1) or (-1, 0) / (0, 1). Let's see final position.)
    
    console.log(`Barricade HP: ${barricade.hp} [Expected: 0]`);
    console.log(`Barricade isBroken: ${barricade.isBroken} [Expected: true]`);
    console.log(`Barricade removed from map: ${!map.getEntity(barricade.id)} [Expected: true]`);
    console.log(`Zombie heard noise: ${zombie.heardNoise} [Expected: true]`);
    console.log(`Zombie noise coordinates: (${zombie.noiseCoords.x}, ${zombie.noiseCoords.y}) [Expected: (5, 6)]`);
    
    const zombiePos = zombie.getComponent('Position');
    console.log(`Zombie final position: (${zombiePos.x}, ${zombiePos.y}) [Expected: shifted from (6, 5)]`);
    console.log('Action Queue logs during cascade:');
    actionQueue.forEach(a => console.log(`  - Visual Action: ${a.type} for ${a.entityId}`, a.data));

    if (barricade.hp === 0 && !map.getEntity(barricade.id) && zombie.heardNoise && (zombiePos.x !== 6 || zombiePos.y !== 5)) {
      console.log('✅ TEST 2 PASSED: Explosion cascade, destruction, noise propagation, and alert-investigate resolved successfully.\n');
    } else {
      console.error('❌ TEST 2 FAILED!\n');
    }
  }

  // ==========================================
  // TEST 3: Infinite Loop & Cycle Safeguards
  // ==========================================
  {
    console.log('--- Test 3: Infinite Loop & Cycle Safeguards ---');
    const map = new MockGameMap();
    const engine = { gameMap: map, _uiDirty: false };
    const queue = new IntentQueue();
    const actionQueue = [];

    const entityA = new MockEntity('entity_A', 'npc', 1, 1);
    const entityB = new MockEntity('entity_B', 'npc', 2, 2);
    map.addEntity(entityA, 1, 1);
    map.addEntity(entityB, 2, 2);

    const entities = [entityA, entityB];

    // Create a cyclic resolution:
    // We override CombatSystem.resolve or simulate it by enqueuing a recurring damage intent in the queue.
    // Let's monkeypatch CombatSystem.resolve to enqueue another damage intent in a loop!
    const originalResolve = CombatSystem.resolve;
    CombatSystem.resolve = (attacker, damageIntent, entitiesList, gameMap, intentQueue, actQueue, eng, envelope) => {
      // Cyclic cascade: A damages B which damages A...
      const nextTargetId = attacker.id === 'entity_A' ? 'entity_B' : 'entity_A';
      const nextAttacker = entitiesList.find(e => e.id === nextTargetId);
      intentQueue.enqueue(nextAttacker.id, 'DamageIntent', new DamageIntent({
        amount: 1,
        targetId: attacker.id
      }), envelope);
    };

    queue.enqueue('entity_A', 'DamageIntent', new DamageIntent({
      amount: 1,
      targetId: 'entity_B'
    }));

    console.log('Starting cyclic resolution (should trigger depth limit)...');
    queue.resolve(entities, null, engine, actionQueue);

    // Restore CombatSystem.resolve
    CombatSystem.resolve = originalResolve;

    console.log(`Queue is empty: ${queue.isEmpty()} [Expected: true]`);
    console.log(`Total intents processed: ${queue.processedCount} [Expected: <= 51 due to depth limit of 50]`);

    if (queue.isEmpty() && queue.processedCount <= 52) {
      console.log('✅ TEST 3 PASSED: Infinite loop protection halted cascade recursion cleanly.\n');
    } else {
      console.error('❌ TEST 3 FAILED!\n');
    }
  }
}

runTests().catch(console.error);
