import eventRunner from '../client/src/game/quest/EventRunner.js';
import engine from '../client/src/game/GameEngine.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`FAIL: ${msg}`); }
  else console.log(`ok: ${msg}`);
}

// Mock structures
class MockEntity {
  constructor(id, type, name, x, y) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.logicalX = x;
    this.logicalY = y;
    this.registryTag = null;
    this.movementPath = [];
  }
  moveTo(x, y) {
    this.logicalX = x;
    this.logicalY = y;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 1. Setup Mock Engine / Map / Entities
// ══════════════════════════════════════════════════════════════════════════
const entityMap = new Map();
engine.gameMap = {
  metadata: {
    entityRegistry: {
      entries: [
        { tag: 'vault_door', type: 'door', x: 2, y: 3 },
        { tag: 'guard_zombie', type: 'zombie', x: 4, y: 4 }
      ]
    }
  },
  entityMap,
  getTile: (x, y) => ({ contents: [] }),
  moveEntity: (id, x, y, opts) => {
    const ent = entityMap.get(id);
    if (ent) {
      // Simulate path blockage or successful move
      ent.logicalX = x;
      ent.logicalY = y;
      return true;
    }
    return false;
  }
};

// Add mock player, NPC, zombie, and door
const player = new MockEntity('player_id', 'player', 'Player', 1, 1);
const officerBob = new MockEntity('bob_id', 'npc', 'Officer Bob', 5, 5);
const zombie = new MockEntity('zombie_id', 'zombie', 'Zombie', 4, 4);
zombie.registryTag = 'guard_zombie'; // stamped at load
const door = new MockEntity('door_id', 'door', 'Door', 2, 3);
door.registryTag = 'vault_door'; // stamped at load

entityMap.set(player.id, player);
entityMap.set(officerBob.id, officerBob);
entityMap.set(zombie.id, zombie);
entityMap.set(door.id, door);

engine.player = player;

// ══════════════════════════════════════════════════════════════════════════
// 2. Test Entity Tag Resolution (_resolveEntity)
// ══════════════════════════════════════════════════════════════════════════
eventRunner.reset();

const resPlayer = eventRunner._resolveEntity('player');
assert(resPlayer === player, 'player resolves to engine.player');

const resBob = eventRunner._resolveEntity('Officer Bob');
assert(resBob === officerBob, 'named NPC Bob resolves successfully by name');

const resZombie = eventRunner._resolveEntity('guard_zombie');
assert(resZombie === zombie, 'manually registered zombie resolves successfully by registryTag');

const resDoor = eventRunner._resolveEntity('vault_door');
assert(resDoor === door, 'manually registered door resolves successfully by registryTag');

// Test coordinates fallback for resolution
const doorNoTag = new MockEntity('door_no_tag', 'door', 'Door', 2, 3);
entityMap.set(doorNoTag.id, doorNoTag);
entityMap.delete(door.id); // temporarily remove door with different ID at same coord to prevent match priority
door.registryTag = null; // strip tag to test coordinate-based fallback

const resDoorFallback = eventRunner._resolveEntity('vault_door');
assert(resDoorFallback === doorNoTag, 'manually registered door resolves by coordinate fallback when tag is absent');

// Clean up mock state
door.registryTag = 'vault_door';
entityMap.set(door.id, door);
entityMap.delete(doorNoTag.id);

// ══════════════════════════════════════════════════════════════════════════
// 3. Test moveEntity step execution
// ══════════════════════════════════════════════════════════════════════════
eventRunner.reset();

// Setup dummy Pathfinding.findPath
const originalFindPath = Pathfinding.findPath;
Pathfinding.findPath = (map, sx, sy, tx, ty, opts) => {
  // Return a simple direct horizontal path from sx to tx
  const path = [{ x: sx, y: sy }];
  let cx = sx;
  while (cx !== tx) {
    cx += Math.sign(tx - sx);
    path.push({ x: cx, y: sy });
  }
  return path;
};

// Set up event metadata with a moveEntity step
engine.gameMap.metadata.events = [
  {
    id: 'move_test',
    placement: { kind: 'chainOnly' },
    trigger: 'auto',
    preconditions: [],
    repeat: 'once',
    steps: [
      { type: 'moveEntity', entityTag: 'Officer Bob', targetX: 8, targetY: 5 }
    ]
  }
];

eventRunner.checkAutoEvents();
assert(eventRunner.isRunning(), 'event with moveEntity step starts running');

// Since performStep runs asynchronously via setTimeout (50ms/150ms), we wait
setTimeout(() => {
  assert(!eventRunner.isRunning(), 'event completes after movement finish');
  assert(officerBob.logicalX === 8 && officerBob.logicalY === 5, 'Officer Bob successfully pathfinds/walks to (8, 5)');

  // Restore pathfinder
  Pathfinding.findPath = originalFindPath;

  if (failures > 0) {
    console.error(`\n--- Verification Failed with ${failures} error(s) ---`);
    process.exit(1);
  } else {
    console.log('\n--- Verification Succeeded! All checks passed. ---');
    process.exit(0);
  }
}, 500);
