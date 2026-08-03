import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { FactionRegistry } from '../../client/src/game/ai/FactionRegistry.js';
import { TURRET_DEF_ID } from '../../client/src/game/ai/TurretCombat.js';

// Regression for the Phase 0 extraction (SimulationManager's inline turret
// orchestration -> systems/TurretSystem.js, CODE_QUALITY_ACTION_PLAN.md
// Wave 4). Proves the extraction didn't change turret firing behavior: a
// powered, ammo'd, player-faction turret still engages a zombie within range
// and line of sight during SimulationManager.runTurn (driven here through
// GameHarness.endTurn(), the same call path).

function placeTurret(harness, x, y) {
  const battery = new Item(createItemFromDef('tool.large_battery'));
  const magazine = new Item(createItemFromDef('attachment.556_magazine'));
  magazine.ammoCount = 20;

  const turretData = createItemFromDef(TURRET_DEF_ID, {
    instanceId: `turret-${x}-${y}`,
    factionId: 'player',
    isOn: true
  });
  turretData.attachments = { battery, ammo: magazine };

  harness.gameMap.setItemsOnTile(x, y, [turretData]);
  return harness.gameMap.getEntitiesByType('item').find((it) => it.defId === TURRET_DEF_ID);
}

describe('systems/TurretSystem — parity with the pre-extraction inline behavior', () => {
  beforeEach(() => {
    FactionRegistry.reset();
  });

  it('a powered, ammo\'d, player-faction turret fires on a zombie in range and line of sight', () => {
    const harness = new GameHarness({ seed: 7, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    const turret = placeTurret(harness, 5, 5);
    expect(turret).toBeDefined();
    expect(turret.isOn).toBe(true);

    const zombie = harness.spawnZombie(5, 10, 'standard', 'zt-1'); // 5 tiles, clear LOS
    const hpBefore = zombie.hp;

    const actionQueue = harness.endTurn();

    const shots = actionQueue.filter((a) => a.type === 'TURRET_SHOT');
    expect(shots.length).toBeGreaterThan(0);
    expect(zombie.hp).toBeLessThan(hpBefore);
    // Ammo/battery actually drained — proves TurretAI.executeTurretTurn ran
    // through the extracted TurretSystem.process, not a no-op.
    expect(turret.attachments.ammo.ammoCount).toBeLessThan(20);
  });

  it('an out-of-range zombie is untouched and no shots fire', () => {
    const harness = new GameHarness({ seed: 7, width: 40, height: 40, terrain: 'grass' }).bootstrap();
    const turret = placeTurret(harness, 5, 5);
    const zombie = harness.spawnZombie(5, 30, 'standard', 'zt-2'); // beyond maxRange: 15
    const hpBefore = zombie.hp;

    const actionQueue = harness.endTurn();

    expect(actionQueue.filter((a) => a.type === 'TURRET_SHOT').length).toBe(0);
    expect(zombie.hp).toBe(hpBefore);
    expect(turret.attachments.ammo.ammoCount).toBe(20);
  });

  it('a powered-off turret never fires', () => {
    const harness = new GameHarness({ seed: 7, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    const turret = placeTurret(harness, 5, 5);
    turret.isOn = false;
    const zombie = harness.spawnZombie(5, 10, 'standard', 'zt-3');
    const hpBefore = zombie.hp;

    const actionQueue = harness.endTurn();

    expect(actionQueue.filter((a) => a.type === 'TURRET_SHOT').length).toBe(0);
    expect(zombie.hp).toBe(hpBefore);
  });

  it('turret death cleanup (checkAndProcessDeaths) still removes a destroyed turret from the map', () => {
    const harness = new GameHarness({ seed: 7, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    const turret = placeTurret(harness, 5, 5);
    turret.hp = 0;

    harness.endTurn();

    const stillThere = harness.gameMap.getEntitiesByType('item').some((it) => it.defId === TURRET_DEF_ID);
    expect(stillThere).toBe(false);
  });
});
