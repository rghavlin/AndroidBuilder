// A wagon hitched to a golf cart must stay hitched until the player presses
// Unhitch. Parking the cart and walking away round-trips both items through the
// map tile (Item -> Entity -> Item), and the hitch link fields used to be missing
// from the on-map field whitelist — so the pair silently came apart.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import engine from '../../client/src/game/GameEngine.js';

describe('hitch link persistence', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 3, width: 40, height: 40, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    engine.dragging = null;
    engine.riding = null;
  });

  it('survives the parked pair being saved to the map tile and reloaded', () => {
    const manager = engine.inventoryManager;
    const px = Math.round(harness.player.x);
    const py = Math.round(harness.player.y);

    const cart = new Item(createItemFromDef('vehicle.golf_cart'));
    const wagon = new Item(createItemFromDef('vehicle.wagon'));
    manager.dropItemAtLocation(cart, px, py, harness.gameMap);
    manager.dropItemAtLocation(wagon, px, py, harness.gameMap);

    cart.hitchedItemInstanceId = wagon.instanceId;
    wagon.hitchedToInstanceId = cart.instanceId;

    // Walk off the tile (pair is written to the map) and back (pair is rebuilt).
    manager.syncWithMap(px, py, px + 1, py, harness.gameMap);
    manager.syncWithMap(px + 1, py, px, py, harness.gameMap);

    const ground = manager.groundContainer.getAllItems();
    const cartBack = ground.find(it => it.instanceId === cart.instanceId);
    const wagonBack = ground.find(it => it.instanceId === wagon.instanceId);

    expect(cartBack).toBeTruthy();
    expect(wagonBack).toBeTruthy();
    expect(cartBack.hitchedItemInstanceId).toBe(wagon.instanceId);
    expect(wagonBack.hitchedToInstanceId).toBe(cart.instanceId);
  });
});
