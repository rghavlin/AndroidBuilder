import { removeDestroyedTurret } from '../client/src/game/ai/TurretCombat.js';
import assert from 'assert';

// Keep track of console warnings
let warnCalls = [];
const originalWarn = console.warn;
console.warn = (...args) => {
  warnCalls.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
};

function runTest() {
  console.log("Starting removeDestroyedTurret verification tests...");

  // Mock gameMap with no entities/tiles
  const emptyMap = {
    getEntity() { return null; },
    getTile() { return null; }
  };

  // --- Test Case 1: Standalone deployed turret entity ---
  warnCalls = [];
  let removedEntityId = null;
  const gameMapWithEntity = {
    getEntity(id) {
      return id === 'turret-entity-1';
    },
    removeEntity(id) {
      removedEntityId = id;
    }
  };
  const standaloneTurret = { id: 'turret-entity-1', instanceId: 'inst-1' };
  removeDestroyedTurret(standaloneTurret, gameMapWithEntity, 0, 0);
  assert.strictEqual(removedEntityId, 'turret-entity-1', "Should call removeEntity");
  assert.strictEqual(warnCalls.length, 0, "Should not warn on successful standalone removal");

  // --- Test Case 2: Direct container reference ---
  warnCalls = [];
  let removedDirectId = null;
  const turretWithContainer = {
    id: 'turret-item-2',
    instanceId: 'inst-2',
    _container: {
      removeItem(id) {
        removedDirectId = id;
      }
    }
  };
  removeDestroyedTurret(turretWithContainer, emptyMap, 0, 0);
  assert.strictEqual(removedDirectId, 'inst-2', "Should call removeItem on container with instanceId");
  assert.strictEqual(warnCalls.length, 0, "Should not warn on successful container direct removal");

  // --- Test Case 3: Nested inside a wagon/container on a tile ---
  warnCalls = [];
  let removedNestedId = null;
  const nestedTurret = { id: 'turret-item-3', instanceId: 'inst-3' };
  
  const nestedGrid = {
    items: new Map([
      ['inst-3', nestedTurret]
    ]),
    removeItem(id) {
      removedNestedId = id;
    }
  };

  const wagon = {
    containerGrid: nestedGrid
  };

  const gameMapWithNested = {
    getEntity() { return null; },
    getTile(x, y) {
      if (x === 5 && y === 5) {
        return {
          contents: [wagon]
        };
      }
      return null;
    }
  };

  removeDestroyedTurret(nestedTurret, gameMapWithNested, 5, 5);
  assert.strictEqual(removedNestedId, 'inst-3', "Should call removeItem on nested grid with instanceId");
  assert.strictEqual(warnCalls.length, 0, "Should not warn on successful nested removal");

  // --- Test Case 4: Failure/silent failure logging (P5-09) ---
  warnCalls = [];
  const unreachableTurret = { id: 'turret-item-4', instanceId: 'inst-4' };
  removeDestroyedTurret(unreachableTurret, emptyMap, 10, 10);
  assert.strictEqual(warnCalls.length, 1, "Expected exactly 1 warning warning");
  assert.ok(warnCalls[0].includes("removeDestroyedTurret failed to find/remove turret"), "Warning should describe failure");
  assert.ok(warnCalls[0].includes("inst-4"), "Warning should contain the instance ID");

  console.log("✅ All removeDestroyedTurret verification tests passed successfully!");
}

try {
  runTest();
} finally {
  console.warn = originalWarn;
}
