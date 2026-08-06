// A turret carried inside a container has to fight from wherever that container
// is — including a wagon parked on the far side of the map.
//
// It didn't. TurretSystem recursed into `containerGrid` with `gridItems`, which
// returns the grid's entries as-is; for an ON-MAP entity those are plain
// serialized objects, so TurretAI's first Item method call
// (`attacker.isHostileTo`) threw straight into TurretSystem's catch. The turret
// was silently inert, and only when parked away from the player — standing on it
// moved it into the ground container, where the entries are real Items, and it
// worked again. `hydratedGridItems` inflates the entries and writes them back.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { FactionRegistry } from '../../client/src/game/ai/FactionRegistry.js';
import { TURRET_DEF_ID } from '../../client/src/game/ai/TurretCombat.js';
import { hydratedGridItems, gridItems } from '../../client/src/game/inventory/gridUtils.js';
import engine from '../../client/src/game/GameEngine.js';

function makeTurret(instanceId = 'nested-turret', ammo = 20) {
  const battery = new Item(createItemFromDef('tool.large_battery'));
  battery.ammoCount = 500;
  const magazine = new Item(createItemFromDef('attachment.556_magazine'));
  magazine.ammoCount = ammo;

  const turret = new Item(createItemFromDef(TURRET_DEF_ID, {
    instanceId, factionId: 'player', isOn: true
  }));
  turret.attachments = { battery, ammo: magazine };
  return turret;
}

function makeWagonCarrying(turret) {
  const wagon = new Item(createItemFromDef('vehicle.toy_wagon'));
  wagon.getContainerGrid().addItem(turret, 0, 0);
  return wagon;
}

/** The nested turret's remaining rounds, read from the authoritative store. */
function nestedAmmo(gameMap, wagonId) {
  const entity = gameMap.getEntity(wagonId);
  const grid = entity?.containerGrid;
  const nested = gridItems(grid).find(it => it?.defId === TURRET_DEF_ID);
  return nested?.attachments?.ammo?.ammoCount ?? null;
}

describe('turrets nested in an on-map container', () => {
  let harness;

  beforeEach(() => {
    FactionRegistry.reset();
    harness = new GameHarness({ seed: 7, width: 30, height: 30, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
  });

  it('fires on a zombie from inside a wagon parked away from the player', () => {
    const wagon = makeWagonCarrying(makeTurret());
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);

    const zombie = harness.spawnZombie(5, 10, 'standard', 'z-nested'); // 5 tiles, clear LOS
    const hpBefore = zombie.hp;

    const actionQueue = harness.endTurn();

    expect(actionQueue.filter(a => a.type === 'TURRET_SHOT').length).toBeGreaterThan(0);
    expect(zombie.hp).toBeLessThan(hpBefore);
  });

  it('spends real ammo, and the rounds stay spent next turn', () => {
    // The write-back half. Firing from a throwaway fromJSON copy would still
    // produce TURRET_SHOT actions and damage, but the magazine would reset every
    // turn — infinite ammo that no shot-count assertion would catch.
    const wagon = makeWagonCarrying(makeTurret());
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);
    harness.spawnZombie(5, 10, 'standard', 'z-ammo');

    expect(nestedAmmo(harness.gameMap, wagon.instanceId)).toBe(20);

    harness.endTurn();
    const afterFirstVolley = nestedAmmo(harness.gameMap, wagon.instanceId);
    expect(afterFirstVolley).toBeLessThan(20);

    harness.endTurn();
    expect(nestedAmmo(harness.gameMap, wagon.instanceId)).toBeLessThanOrEqual(afterFirstVolley);
  });

  it('runs dry instead of firing forever', () => {
    const wagon = makeWagonCarrying(makeTurret('dry-turret', 2));
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);
    harness.spawnZombie(5, 10, 'standard', 'z-dry');

    let totalShots = 0;
    for (let turn = 0; turn < 6; turn++) {
      totalShots += harness.endTurn().filter(a => a.type === 'TURRET_SHOT').length;
    }

    expect(totalShots).toBeGreaterThan(0);
    expect(totalShots).toBeLessThanOrEqual(2);
    expect(nestedAmmo(harness.gameMap, wagon.instanceId)).toBe(0);
  });

  it('a powered-down nested turret still never fires', () => {
    const turret = makeTurret();
    turret.isOn = false;
    const wagon = makeWagonCarrying(turret);
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);

    const zombie = harness.spawnZombie(5, 10, 'standard', 'z-off');
    const hpBefore = zombie.hp;

    const actionQueue = harness.endTurn();

    expect(actionQueue.filter(a => a.type === 'TURRET_SHOT').length).toBe(0);
    expect(zombie.hp).toBe(hpBefore);
  });

  it('an out-of-range zombie is still safe from a nested turret', () => {
    const wagon = makeWagonCarrying(makeTurret());
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);

    const zombie = harness.spawnZombie(5, 25, 'standard', 'z-far'); // beyond maxRange 15
    const hpBefore = zombie.hp;

    harness.endTurn();

    expect(zombie.hp).toBe(hpBefore);
    expect(nestedAmmo(harness.gameMap, wagon.instanceId)).toBe(20);
  });
});

describe('hydratedGridItems', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 8, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
  });

  it('inflates serialized entries and writes them back into the grid', () => {
    const wagon = makeWagonCarrying(makeTurret());
    engine.inventoryManager.dropItemAtLocation(wagon, 6, 6, harness.gameMap);

    const grid = harness.gameMap.getEntity(wagon.instanceId).containerGrid;
    expect(typeof gridItems(grid)[0].hasTrait).toBe('undefined'); // plain JSON to start

    const hydrated = hydratedGridItems(grid);
    expect(typeof hydrated[0].hasTrait).toBe('function');
    // Written back: a second read sees the Item, not another fresh copy.
    expect(gridItems(grid)[0]).toBe(hydrated[0]);
    expect(hydratedGridItems(grid)[0]).toBe(hydrated[0]);
  });

  it('rebuilds nested attachments as Items too', () => {
    const wagon = makeWagonCarrying(makeTurret());
    engine.inventoryManager.dropItemAtLocation(wagon, 6, 6, harness.gameMap);

    const grid = harness.gameMap.getEntity(wagon.instanceId).containerGrid;
    const turret = hydratedGridItems(grid)[0];

    // TurretAI reads the magazine and battery through Item accessors.
    expect(turret.attachments.ammo.ammoCount).toBe(20);
    expect(typeof turret.getBattery).toBe('function');
    expect(turret.getBattery().ammoCount).toBe(500);
  });

  it('passes real Items through untouched', () => {
    const turret = makeTurret();
    const wagon = makeWagonCarrying(turret);
    // Still an in-memory Item, never serialized to a tile.
    const hydrated = hydratedGridItems(wagon.getContainerGrid());
    expect(hydrated[0]).toBe(turret);
  });

  it('tolerates an empty or absent grid', () => {
    expect(hydratedGridItems(null)).toEqual([]);
    expect(hydratedGridItems({})).toEqual([]);
    expect(hydratedGridItems({ items: [] })).toEqual([]);
  });

  it('leaves the container serializable after hydration', async () => {
    // Entity.toJSON hands a plain grid straight through, relying on
    // JSON.stringify to call each Item's toJSON. If that broke, hydrating a
    // wagon would quietly destroy its cargo on the next save.
    const wagon = makeWagonCarrying(makeTurret());
    engine.inventoryManager.dropItemAtLocation(wagon, 6, 6, harness.gameMap);
    hydratedGridItems(harness.gameMap.getEntity(wagon.instanceId).containerGrid);

    const restoredMap = await GameMap.fromJSON(JSON.parse(JSON.stringify(harness.gameMap.toJSON())));
    const restoredWagon = restoredMap.getItemsOnTile(6, 6).find(e => e.instanceId === wagon.instanceId);

    expect(restoredWagon).toBeDefined();
    const nested = gridItems(restoredWagon.containerGrid).filter(it => it?.defId === TURRET_DEF_ID);
    expect(nested).toHaveLength(1);
    expect(nested[0].attachments.ammo.ammoCount).toBe(20);
  });
});
