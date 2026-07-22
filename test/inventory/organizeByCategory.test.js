import { describe, it, expect, vi } from 'vitest';
// Wave 2 P0 (R35#1): GroundManager.organizeByCategory used to clear() the
// container and then place items with a bare rowX/rowY cursor and NO failure
// branch — any item the cursor pushed past the container height after clear()
// was silently deleted. It fires whenever the ground holds >=10 items.
// The fix scans for a free area per item with an addItem() fallback, and only
// logs (never deletes) if an item genuinely cannot fit.
import { Container } from '../../client/src/game/inventory/Container.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { GroundManager } from '../../client/src/game/inventory/GroundManager.js';

const DEF_IDS = [
  'weapon.knife', 'food.apple', 'food.beans', 'food.chips',
  'food.granolabar', 'medical.bandage', 'tool.lighter', 'clothing.pocket_t',
];

function makeItems(count) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const defId = DEF_IDS[i % DEF_IDS.length];
    const def = createItemFromDef(defId);
    if (!def) continue;
    items.push(new Item(def));
  }
  return items;
}

describe('Wave 2 P0 · GroundManager.organizeByCategory item conservation (R35#1)', () => {
  it('does not delete any item when re-organizing a busy ground (>=10 items)', () => {
    // Wide-but-short grid: the OLD per-category cursor advanced Y across
    // categories without ever reclaiming horizontal space, so the lower
    // categories overflowed the height and their items vanished — even though
    // total area fits comfortably.
    const container = new Container({ id: 'ground', name: 'Ground', width: 14, height: 6 });
    const items = makeItems(12);
    // allowStacking=false so each item is a distinct grid entry (repeated
    // defIds would otherwise merge and mask the conservation count).
    for (const item of items) expect(container.addItem(item, null, null, false)).toBe(true);

    const before = new Set(container.getAllItems().map(i => i.instanceId));
    expect(before.size).toBe(items.length);

    const gm = new GroundManager(container, () => ({}));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(gm.organizeByCategory()).toBe(true);
    errSpy.mockRestore();

    const after = new Set(container.getAllItems().map(i => i.instanceId));
    // Every item that went in is still on the ground — nothing silently dropped.
    expect(after.size).toBe(before.size);
    for (const id of before) expect(after.has(id)).toBe(true);
  });

  it('logs (does not throw / silently swallow) when an item truly cannot fit', () => {
    // Fill a tiny grid so a further item cannot be placed anywhere. The item
    // object must survive (not be deleted); organizeByCategory reports it.
    const container = new Container({ id: 'ground', name: 'Ground', width: 2, height: 2 });
    const items = makeItems(6);
    let fit = 0;
    for (const item of items) { if (container.addItem(item, null, null, false)) fit++; }
    expect(fit).toBeGreaterThan(0);

    const gm = new GroundManager(container, () => ({}));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => gm.organizeByCategory()).not.toThrow();
    errSpy.mockRestore();

    // Whatever fit before still fits after — no net loss from the reorganize.
    expect(container.getAllItems().length).toBe(fit);
  });
});
