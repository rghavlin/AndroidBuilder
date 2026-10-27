import { describe, it, expect } from 'vitest';
import { isLockableContainer, packContainerContents } from '../../client/src/game/editor/containerContents.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';

const SAFE = 'furniture.safe';

describe('editor container contents', () => {
  it('treats the safe as a lockable container and plain items as not', () => {
    expect(isLockableContainer(SAFE)).toBe(true);
    expect(isLockableContainer('medical.bandage')).toBe(false);
    expect(isLockableContainer('container.toolbox')).toBe(false);
  });

  it('packs items into the safe grid with placed coordinates', () => {
    const ammo = { ...createItemFromDef('ammo.9mm'), stackCount: 20 };
    const { containerGrid, rejected } = packContainerContents(SAFE, [createItemFromDef('weapon.9mmPistol'), ammo], 'safe-1');
    expect(rejected).toEqual([]);
    expect(containerGrid.items).toHaveLength(2);
    for (const it of containerGrid.items) {
      expect(Number.isInteger(it.x)).toBe(true);
      expect(Number.isInteger(it.y)).toBe(true);
    }
    expect(containerGrid.items.find(it => it.defId === 'ammo.9mm').stackCount).toBe(20);
  });

  it('rejects a safe inside a safe and anything past capacity', () => {
    const safe = createItemFromDef(SAFE);
    expect(packContainerContents(SAFE, [safe], 'safe-1').rejected).toEqual([0]);

    const pistols = Array.from({ length: 40 }, () => createItemFromDef('weapon.9mmPistol'));
    const { rejected } = packContainerContents(SAFE, pistols, 'safe-1');
    expect(rejected.length).toBeGreaterThan(0);
    expect(rejected.length).toBeLessThan(pistols.length);
  });

  it('keeps lock state and contents through map load into a usable Item', () => {
    const full = createItemFromDef(SAFE);
    full.isLocked = false;
    full.containerGrid = packContainerContents(SAFE, [createItemFromDef('food.mre')], full.instanceId).containerGrid;

    const map = new GameMap(5, 5);
    map.setItemsOnTile(1, 1, [full]);
    const entity = map.getItemsOnTile(1, 1).find(e => e.defId === SAFE);
    expect(entity.isLocked).toBe(false);

    const item = Item.fromJSON(entity.toJSON());
    expect(item.isLocked).toBe(false);
    const grid = item.getContainerGrid();
    expect([...grid.items.values()].map(i => i.defId)).toEqual(['food.mre']);
  });

  it('defaults an authored safe to locked', () => {
    const map = new GameMap(5, 5);
    map.setItemsOnTile(0, 0, [createItemFromDef(SAFE)]);
    expect(map.getItemsOnTile(0, 0)[0].isLocked).toBe(true);
  });
});
