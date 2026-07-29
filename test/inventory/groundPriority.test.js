import { describe, it, expect } from 'vitest';
// Ground-slot priority for interactive world markers.
//
// The help "?" used to be pinned to slot (0,0) by a hard-coded defId check, and
// the exit to the (0,0)-(2,2) block by another. Adding event-appearance switches
// (which are markers too) made that a list that would keep growing, and two 1x1
// markers on one tile would have fought over the single hard-coded cell. The
// check is now the `groundPriority` def flag, and placement takes the first
// usable cell in reading order instead of always (0,0).
import { Container } from '../../client/src/game/inventory/Container.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef, ItemDefs } from '../../client/src/game/inventory/ItemDefs.js';
import { getDominantItemInTile } from '../../client/src/game/renderer/EntityRenderer.js';

const make = (defId) => new Item(createItemFromDef(defId));
const ground = () => new Container({ id: 'ground', type: 'ground', width: 6, height: 10 });
const at = (c, x, y) => {
  const id = c.grid[y]?.[x];
  return id ? c.items.get(id) : null;
};

describe('groundPriority — the def flag', () => {
  it('is set on every interactive marker def', () => {
    for (const defId of ['placeable.help', 'placeable.switch_off', 'placeable.switch_on']) {
      expect(ItemDefs[defId].groundPriority).toBe(true);
    }
  });

  it('reaches the Item instance from the definition', () => {
    expect(make('placeable.switch_off').groundPriority).toBe(true);
    expect(make('tool.lighter').groundPriority).toBeFalsy();
  });

  it('survives a toJSON round trip', () => {
    const marker = new Item({ ...createItemFromDef('placeable.switch_on'), eventId: 'powerOff', isEventMarker: true });
    const revived = new Item(marker.toJSON());
    expect(revived.groundPriority).toBe(true);
    expect(revived.isEventMarker).toBe(true);
    expect(revived.eventId).toBe('powerOff');
  });
});

describe('groundPriority — container placement', () => {
  it('still pins the help item to the front slot', () => {
    const c = ground();
    c.addItem(make('tool.lighter'));
    c.addItem(make('placeable.help'));
    expect(at(c, 0, 0).defId).toBe('placeable.help');
  });

  it('pins a switch to the front slot too', () => {
    const c = ground();
    c.addItem(make('tool.lighter'));
    c.addItem(make('placeable.switch_off'));
    expect(at(c, 0, 0).defId).toBe('placeable.switch_off');
  });

  it('lets two markers share a tile instead of evicting each other', () => {
    const c = ground();
    c.addItem(make('placeable.help'));
    c.addItem(make('placeable.switch_on'));

    const front = [at(c, 0, 0), at(c, 1, 0)].filter(Boolean).map(i => i.defId);
    expect(front).toContain('placeable.help');
    expect(front).toContain('placeable.switch_on');
    // Both still present — neither displaced the other out of the container.
    expect(c.getAllItems().filter(i => i.groundPriority)).toHaveLength(2);
  });

  it('displaces an ordinary item rather than stacking on top of it', () => {
    const c = ground();
    const lighter = make('tool.lighter');
    c.addItem(lighter);
    expect(at(c, 0, 0)).toBe(lighter);

    c.addItem(make('placeable.switch_off'));
    expect(at(c, 0, 0).defId).toBe('placeable.switch_off');
    // The evicted lighter is re-homed, not deleted.
    expect(c.getAllItems().some(i => i.instanceId === lighter.instanceId)).toBe(true);
  });

  it('does not knock the 3x3 exit off its pinned block', () => {
    const c = ground();
    c.addItem(make('placeable.exit'));
    c.addItem(make('placeable.help'));

    // Exit keeps (0,0); the marker settles just past its 3-wide footprint.
    expect(at(c, 0, 0).defId).toBe('placeable.exit');
    expect(c.getAllItems().some(i => i.defId === 'placeable.help')).toBe(true);
  });
});

describe('groundPriority — map icon priority', () => {
  it('lets a 1x1 marker win the tile icon over bigger, higher-tier loot', () => {
    // One icon renders per tile. Without an INTERACTIVE tier a switch loses to
    // any food/backpack/vehicle dropped on it and vanishes from the map.
    const sw = make('placeable.switch_off');
    expect(getDominantItemInTile([make('backpack.school'), sw]).defId).toBe('placeable.switch_off');
    expect(getDominantItemInTile([sw, make('backpack.school')]).defId).toBe('placeable.switch_off');
  });

  it('applies to the help item as well', () => {
    expect(getDominantItemInTile([make('backpack.school'), make('placeable.help')]).defId)
      .toBe('placeable.help');
  });

  it('resolves the flag from the definition for plain-data tile entries', () => {
    // Ground-pile entries are often POJOs, not Item instances.
    const plain = { defId: 'placeable.switch_on', width: 1, height: 1 };
    expect(getDominantItemInTile([make('backpack.school'), plain]).defId).toBe('placeable.switch_on');
  });

  it('leaves the existing ordering intact below the marker tier', () => {
    expect(getDominantItemInTile([make('tool.lighter'), make('backpack.school')]).defId)
      .toBe('backpack.school');
  });
});
