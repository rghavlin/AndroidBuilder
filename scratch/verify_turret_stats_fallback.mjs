import { TurretAI } from '../client/src/game/ai/TurretAI.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Item } from '../client/src/game/inventory/Item.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${label}`);
    failed++;
  }
}

async function verify() {
  console.log('=== P3-05: Verify Turret Stats Fallback Removal ===\n');

  const gameMap = new GameMap(10, 10);
  
  // 1. Create a hostile target
  const zombie = EntityFactory.createZombie(5, 5, 'basic');
  zombie.id = 'zombie-1';
  gameMap.addEntity(zombie, 5, 5);

  // 2. Create a standard player-faction turret item
  const turretItem = new Item({
    id: 'placeable.auto_turret',
    defId: 'placeable.auto_turret',
    factionId: 'player',
    isOn: true,
    attachments: {
      battery: { defId: 'tool.large_battery', ammoCount: 10 },
      ammo: { defId: 'ammo.9mm', ammoCount: 50 }
    }
  });

  // Mock isHostileTo to return true for zombie
  turretItem.isHostileTo = (entity) => entity.type === 'zombie';

  // Test 1: Standard turret with valid turretStats executes correctly
  console.log('Testing standard turret turn execution...');
  const result1 = TurretAI.executeTurretTurn(turretItem, 2, 2, gameMap, [zombie]);
  assert(result1.actions.length > 0, `Turret successfully fired and generated ${result1.actions.length} actions`);
  assert(result1.actions[0].type === 'TURRET_SHOT', 'First action is a TURRET_SHOT');

  // Test 2: Turret with no defId / invalid defId logs warning and returns gracefully
  console.log('\nTesting turret with invalid defId...');
  const invalidTurret = new Item({
    id: 'placeable.non_existent_turret',
    defId: 'placeable.non_existent_turret',
    factionId: 'player',
    isOn: true,
    attachments: {
      battery: { defId: 'tool.large_battery', ammoCount: 10 },
      ammo: { defId: 'ammo.9mm', ammoCount: 50 }
    }
  });
  invalidTurret.isHostileTo = () => true;

  // Intercept console.warn to verify warning is printed
  let warnLogged = false;
  const originalWarn = console.warn;
  console.warn = (msg) => {
    warnLogged = true;
    originalWarn(msg);
  };

  const result2 = TurretAI.executeTurretTurn(invalidTurret, 2, 2, gameMap, [zombie]);

  console.warn = originalWarn; // restore

  assert(result2.actions.length === 0, 'Turret with invalid defId returned zero actions');
  assert(warnLogged === true, 'Warning was logged for missing turretStats');

  // Test 3: Turret with valid defId but missing turretStats in definition
  console.log('\nTesting turret with defId lacking turretStats...');
  // Temporary define a mock item def without turretStats
  ItemDefs['placeable.no_stats_turret'] = {
    id: 'placeable.no_stats_turret',
    name: 'No Stats Turret'
  };

  const noStatsTurret = new Item({
    id: 'placeable.no_stats_turret',
    defId: 'placeable.no_stats_turret',
    factionId: 'player',
    isOn: true,
    attachments: {
      battery: { defId: 'tool.large_battery', ammoCount: 10 },
      ammo: { defId: 'ammo.9mm', ammoCount: 50 }
    }
  });
  noStatsTurret.isHostileTo = () => true;

  warnLogged = false;
  console.warn = (msg) => {
    warnLogged = true;
    originalWarn(msg);
  };

  const result3 = TurretAI.executeTurretTurn(noStatsTurret, 2, 2, gameMap, [zombie]);
  console.warn = originalWarn; // restore

  // Clean up ItemDefs
  delete ItemDefs['placeable.no_stats_turret'];

  assert(result3.actions.length === 0, 'Turret lacking turretStats returned zero actions');
  assert(warnLogged === true, 'Warning was logged for lack of turretStats in definition');

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    console.error('\n❌ SOME TESTS FAILED');
    process.exit(1);
  } else {
    console.log('\n🎉 All P3-05 turret fallback removal tests passed!');
  }
}

verify().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
