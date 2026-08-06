// Standing orders have to survive a save. A wagon halfway through a ten-turn
// errand that forgets where it was going on reload is worse than one that never
// set off — the player has already walked away.
//
// Orders live in an engine-level side table rather than on the wagon Item
// precisely BECAUSE of serialization: the on-map save path runs items through
// Entity.toJSON's ITEM_SERIALIZED_FIELDS whitelist, which would silently drop
// an ad-hoc field on the wagon (and parked-away-from-the-player is the normal
// state for this feature). These tests pin both halves.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import * as AutoWagonOrders from '../../client/src/game/remote/AutoWagonOrders.js';
import engine from '../../client/src/game/GameEngine.js';

function makeAutoWagon() {
  const wagon = new Item(createItemFromDef('vehicle.toy_wagon'));
  const battery = new Item(createItemFromDef('tool.large_battery'));
  battery.ammoCount = 500;
  wagon.attachments = {
    motor: new Item(createItemFromDef('electric_motor')),
    battery,
    rc_receiver: new Item(createItemFromDef('tool.autonomous_controller'))
  };
  return wagon;
}

describe('AutoWagonOrders persistence', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 5, width: 30, height: 30, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    engine.autoWagonOrders = new Map();
    engine.activeDeviceId = null;
  });

  it('round-trips an order for a wagon parked out on the map', () => {
    const wagon = makeAutoWagon();
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);
    engine.autoWagonOrders.set(wagon.instanceId, { x: 20, y: 9, failedTurns: 2, lastBlockReason: null });

    // A real save is JSON on disk, so anything that doesn't survive a
    // stringify/parse round trip doesn't survive a save either.
    const saved = JSON.parse(JSON.stringify(AutoWagonOrders.serializeOrders(engine)));
    engine.autoWagonOrders = new Map();
    AutoWagonOrders.restoreOrders(engine, saved);

    expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toMatchObject({ x: 20, y: 9, failedTurns: 2 });
  });

  it('round-trips an order for a wagon in the ground container, at the player\'s feet', () => {
    const p = harness.player;
    const wagon = makeAutoWagon();
    // The player's own tile routes into the ground container — the wagon's
    // other home, with no map entity of its own.
    engine.inventoryManager.dropItemAtLocation(wagon, Math.round(p.x), Math.round(p.y), harness.gameMap);
    expect(engine.inventoryManager.groundContainer.getAllItems()
      .some(it => it.instanceId === wagon.instanceId)).toBe(true);

    engine.autoWagonOrders.set(wagon.instanceId, { x: 3, y: 3, failedTurns: 0, lastBlockReason: null });

    const saved = JSON.parse(JSON.stringify(AutoWagonOrders.serializeOrders(engine)));
    engine.autoWagonOrders = new Map();
    AutoWagonOrders.restoreOrders(engine, saved);

    expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toMatchObject({ x: 3, y: 3 });
  });

  it('drops orders for wagons that exist in neither home', () => {
    // Same both-homes validation activeDeviceId gets: a marker for a wagon
    // scrapped three saves ago would otherwise sit on the map forever.
    AutoWagonOrders.restoreOrders(engine, [
      { instanceId: 'a-wagon-that-was-disassembled', x: 4, y: 4, failedTurns: 0 }
    ]);
    expect(engine.autoWagonOrders.size).toBe(0);
  });

  it('keeps the surviving orders when only some wagons are gone', () => {
    const kept = makeAutoWagon();
    engine.inventoryManager.dropItemAtLocation(kept, 6, 6, harness.gameMap);

    AutoWagonOrders.restoreOrders(engine, [
      { instanceId: kept.instanceId, x: 12, y: 6, failedTurns: 0 },
      { instanceId: 'long-gone', x: 4, y: 4, failedTurns: 0 }
    ]);

    expect(engine.autoWagonOrders.size).toBe(1);
    expect(AutoWagonOrders.getOrder(engine, kept.instanceId)).toMatchObject({ x: 12, y: 6 });
  });

  it('survives a missing or malformed orders blob without throwing', () => {
    // Every save written before this feature has no autoWagonOrders key at all.
    expect(() => AutoWagonOrders.restoreOrders(engine, undefined)).not.toThrow();
    expect(() => AutoWagonOrders.restoreOrders(engine, null)).not.toThrow();
    expect(() => AutoWagonOrders.restoreOrders(engine, [null, {}, { x: 1 }])).not.toThrow();
    expect(engine.autoWagonOrders.size).toBe(0);
  });

  it('serializes an empty book as an empty list, not undefined', () => {
    engine.autoWagonOrders = new Map();
    expect(AutoWagonOrders.serializeOrders(engine)).toEqual([]);
  });

  it('a cleared book leaves no marker behind for a new map to draw', () => {
    // GameMapContext clears activeDeviceId AND the order book on a map change.
    // MapCanvas draws markers straight from this map with no existence check,
    // so an order surviving the transition paints a phantom crosshair on
    // whatever the new map happens to have at those coordinates — WagonSystem
    // only prunes it a whole turn later.
    const wagon = makeAutoWagon();
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);
    engine.autoWagonOrders.set(wagon.instanceId, { x: 20, y: 9, failedTurns: 0, lastBlockReason: null });

    engine.autoWagonOrders.clear();

    expect(engine.autoWagonOrders.size).toBe(0);
    expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toBeNull();
  });
});
