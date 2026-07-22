import { describe, it, expect } from 'vitest';
// T5 regression tests:
//  - Item self-destruct paths must not touch bare `window` (ReferenceError in
//    Node, R32#1) and must remove the item via the local container fallback.
//  - GroundManager reads riding/dragging/map context from its injected
//    provider, never from the engine singleton (and survives having none).
import { Item } from '../../client/src/game/inventory/Item.js';
import { Container } from '../../client/src/game/inventory/Container.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { GroundManager } from '../../client/src/game/inventory/GroundManager.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';

function groundContainer() {
  return new Container({ id: 'ground', name: 'Ground', width: 6, height: 10 });
}

describe('T5 Item self-destruct without window.gameEngine (R32#1)', () => {
  it('consumeCharge destroys a spent lighter via the local container, no throw', () => {
    // In Node, bare `window` is undeclared — the old path threw ReferenceError here.
    expect(typeof window).toBe('undefined');

    const lighter = new Item(createItemFromDef('tool.lighter'));
    lighter.ammoCount = 1;
    const container = groundContainer();
    expect(container.addItem(lighter)).toBe(true);

    expect(() => lighter.consumeCharge(1)).not.toThrow();
    expect(lighter.ammoCount).toBe(0);
    expect(lighter.stackCount).toBe(0);
    expect(container.getAllItems()).not.toContain(lighter);
  });

  it('degrade destroys a broken item via the local container, no throw', () => {
    const knife = new Item(createItemFromDef('weapon.knife'));
    const container = groundContainer();
    expect(container.addItem(knife)).toBe(true);

    expect(() => knife.degrade(500)).not.toThrow();
    expect(knife.condition).toBe(0);
    expect(container.getAllItems()).not.toContain(knife);
  });
});

describe('T5 GroundManager injected context', () => {
  it('sortGroundItems puts the ridden item first using the injected provider', () => {
    const container = groundContainer();
    const a = new Item(createItemFromDef('weapon.knife'));
    const b = new Item(createItemFromDef('weapon.knife'));
    container.addItem(a);
    container.addItem(b);

    const gm = new GroundManager(container, () => ({ ridingItemId: b.instanceId }));
    gm.sortGroundItems();

    const pos = (item) => item.y * container.width + item.x;
    expect(pos(b)).toBeLessThan(pos(a));
  });

  it('sortGroundItems works with no provider (headless/test contexts)', () => {
    const container = groundContainer();
    container.addItem(new Item(createItemFromDef('weapon.knife')));
    const gm = new GroundManager(container);
    expect(() => gm.sortGroundItems()).not.toThrow();
  });

  it('map-tile injection fallback uses the injected gameMap and sync position', () => {
    const container = groundContainer();
    const map = new GameMap(10, 10);
    const gm = new GroundManager(container, () => ({
      gameMap: map,
      lastSyncedX: 3,
      lastSyncedY: 4
    }));
    const item = new Item(createItemFromDef('weapon.knife'));
    gm._injectItemToMapTile(item);

    const items = map.getItemsOnTile(3, 4);
    expect(items.some(i => i.defId === 'weapon.knife' || (i.id || '').includes('weapon.knife'))).toBe(true);
  });

  it('map-tile injection is a safe no-op without a provider', () => {
    const gm = new GroundManager(groundContainer());
    const item = new Item(createItemFromDef('weapon.knife'));
    expect(() => gm._injectItemToMapTile(item)).not.toThrow();
  });
});
