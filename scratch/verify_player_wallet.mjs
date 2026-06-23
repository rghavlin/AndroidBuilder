import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Entity } from '../client/src/game/entities/Entity.js';
import { PlayerWallet } from '../client/src/game/components/PlayerWallet.js';
import { PlayerSkills } from '../client/src/game/components/PlayerSkills.js';
import assert from 'assert';

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

function runTest() {
  console.log("Starting PlayerWallet component verification...");

  // 1. Creation and Component Initialization
  const player = EntityFactory.createPlayer(5, 5);
  
  const wallet = player.getComponent('PlayerWallet');
  const skills = player.getComponent('PlayerSkills');

  assert.ok(wallet instanceof PlayerWallet, "Player should have PlayerWallet component");
  assert.ok(skills instanceof PlayerSkills, "Player should have PlayerSkills component");
  assert.strictEqual(wallet.earbucks, 0, "Wallet earbucks should default to 0");
  assert.strictEqual(skills.earbucks, undefined, "PlayerSkills should no longer hold earbucks property");

  // 2. Getter and Setter Facades on Entity
  assert.strictEqual(player.earbucks, 0, "player.earbucks getter should return 0 initially");
  
  player.earbucks = 100;
  assert.strictEqual(wallet.earbucks, 100, "Setting player.earbucks should update wallet");
  assert.strictEqual(player.earbucks, 100, "player.earbucks getter should return updated wallet value");

  // Negative value clamping
  player.earbucks = -50;
  assert.strictEqual(wallet.earbucks, 0, "Wallet earbucks should be clamped to a minimum of 0");
  assert.strictEqual(player.earbucks, 0, "player.earbucks should return 0 after clamping");

  // 3. Serialization
  player.earbucks = 250;
  const serialized = player.toJSON();

  // Root level field checks
  assert.strictEqual(serialized.earbucks, 250, "Serialized data should hold earbucks at the root level");
  
  // Component level checks
  assert.ok(serialized.components.PlayerWallet, "Serialized components should contain PlayerWallet");
  assert.strictEqual(serialized.components.PlayerWallet.earbucks, 250, "Serialized PlayerWallet should contain correct earbucks");
  assert.ok(serialized.components.PlayerSkills, "Serialized components should contain PlayerSkills");
  assert.strictEqual(serialized.components.PlayerSkills.earbucks, undefined, "Serialized PlayerSkills should NOT contain earbucks");

  // 4. Backwards compatibility deserialization
  const oldJSON = {
    id: "player-test-123",
    type: "player",
    gridX: 10,
    gridY: 10,
    x: 10,
    y: 10,
    logicalX: 10,
    logicalY: 10,
    earbucks: 450,
    components: {
      PlayerSkills: {
        meleeKills: 12,
        meleeLvl: 3,
        rangedKills: 5,
        rangedLvl: 1,
        craftingApUsed: 10,
        craftingLvl: 2,
        earbucks: 450
      }
    }
  };

  const restored = Entity.fromJSON(oldJSON);
  
  const restoredWallet = restored.getComponent('PlayerWallet');
  const restoredSkills = restored.getComponent('PlayerSkills');

  assert.ok(restoredWallet instanceof PlayerWallet, "Restored entity from legacy JSON should automatically receive a PlayerWallet component");
  assert.strictEqual(restoredWallet.earbucks, 450, "Restored PlayerWallet component should be hydrated with the legacy earbucks value");
  assert.strictEqual(restored.earbucks, 450, "Restored entity should return 450 for player.earbucks facade");
  assert.strictEqual(restoredSkills.earbucks, undefined, "Restored PlayerSkills component should not hold earbucks");

  console.log("✅ All PlayerWallet verification tests passed successfully!");
}

runTest();
