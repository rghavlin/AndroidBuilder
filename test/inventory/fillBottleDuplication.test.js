import { describe, it, expect, beforeEach } from 'vitest';
import { Item } from '../../client/src/game/inventory/Item.js';
import { Container } from '../../client/src/game/inventory/Container.js';
import { InventoryManager } from '../../client/src/game/inventory/InventoryManager.js';
import { ItemDefs } from '../../client/src/game/inventory/ItemDefs.js';

// Regression: filling a bottle from a puddle duplicated water when the selected
// bottle's live `_container` backref disagreed with the container it actually
// lived in (a prod-only condition). The single-bottle fill path removed the
// source via that stale backref (a no-op), then addItem's stack-merge folded
// the bottle's count into a sibling dirty-water stack while the original stayed
// in its slot as a filled zombie -> "2 empty bottles became 3 dirty water".
//
// The fix: remove the source authoritatively by instanceId via
// InventoryManager.removeItem() (recursive, backref-independent), and guard the
// stack-merge so an item is never folded into itself.

const bottleDef = ItemDefs['food.waterbottle'];
const CAP = bottleDef.capacity || 20;

function makeBottle(id, ammo) {
  return new Item({
    ...bottleDef, instanceId: id, ammoCount: ammo,
    waterQuality: ammo > 0 ? 'dirty' : undefined, stackCount: 1,
  });
}

// Replica of the InventoryContext.fillFromSource single-bottle branch (the only
// part relevant to the bug). Uses the real InventoryManager/Container/Item.
function fillSingleBottle(mgr, bottle, originContainerId, originX, originY) {
  // --- authoritative removal (the fix) ---
  let removed = mgr.removeItem(bottle.instanceId);
  if (!removed) {
    const originContainer = mgr.getContainer(originContainerId) || bottle._container;
    removed = originContainer?.removeItem?.(bottle.instanceId);
  }
  if (!removed) return { aborted: true };

  // --- fill + re-add/merge (unchanged) ---
  const transfer = Math.min(CAP - bottle.ammoCount, CAP);
  bottle.ammoCount += transfer;
  bottle.waterQuality = 'dirty';
  mgr.addItem(bottle, originContainerId, originX, originY, true);
  return { aborted: false };
}

function bottleStats(container) {
  const items = [...container.items.values()];
  const dirty = items.filter((it) => (it.ammoCount || 0) > 0);
  return {
    // one rendered icon per occupied bottle cell; badge shows stackCount
    visible: dirty.reduce((n, it) => n + Math.max(it.stackCount, 1), 0),
    zombies: items.filter((it) => it.stackCount <= 0).length,
    itemCount: items.length,
  };
}

describe('Fill-from-source does not duplicate water (regression)', () => {
  let mgr, lunchbox;

  beforeEach(() => {
    mgr = new InventoryManager();
    globalThis.gameEngine = { player: { ap: 5, useAP() {} }, inventoryManager: mgr, notifyUpdate() {} };
    lunchbox = new Container({ id: 'lunchbox', width: 6, height: 4 });
    mgr.containers.set('lunchbox', lunchbox);
  });

  it('filling the last empty bottle merges cleanly even with a stale _container backref', () => {
    // State after a first fill: one dirty + one empty, both in the lunchbox.
    const dirty = makeBottle('bottle-D', CAP);
    const empty = makeBottle('bottle-E', 0);
    expect(lunchbox.placeItemAt(dirty, 0, 0)).toBe(true);
    expect(lunchbox.placeItemAt(empty, 2, 0)).toBe(true);

    // Reproduce the prod fault: the selected object's backref is stale/null even
    // though instanceId 'bottle-E' still occupies the lunchbox grid.
    empty._container = null;

    const res = fillSingleBottle(mgr, empty, 'lunchbox', empty.x, empty.y);
    expect(res.aborted).toBe(false);

    const stats = bottleStats(lunchbox);
    expect(stats.zombies).toBe(0);           // no leftover 0-count bottle
    expect(stats.visible).toBe(2);           // two dirty bottles, not three
    expect(stats.itemCount).toBe(1);         // merged into a single x2 stack
    expect(dirty.stackCount).toBe(2);
  });

  it('an item is never folded into itself by the stack-merge search', () => {
    // A full dirty bottle left in the container (removal skipped) must not merge
    // into itself when addItem is called with it.
    const b = makeBottle('bottle-self', CAP);
    lunchbox.placeItemAt(b, 0, 0);
    const before = b.stackCount;
    mgr.addItem(b, 'lunchbox', 0, 0, true); // b is still present in lunchbox
    expect(b.stackCount).toBe(before);       // unchanged, not zeroed
    expect(bottleStats(lunchbox).zombies).toBe(0);
  });

  it('normal two-bottle fill still yields exactly one x2 stack', () => {
    // Healthy path (correct backrefs): two separate empties filled one after the
    // other must end as a single stack of two dirty bottles.
    const a = makeBottle('bottle-A', 0);
    const c = makeBottle('bottle-C', 0);
    lunchbox.placeItemAt(a, 0, 0);
    lunchbox.placeItemAt(c, 2, 0);

    fillSingleBottle(mgr, a, 'lunchbox', a.x, a.y);
    fillSingleBottle(mgr, c, 'lunchbox', c.x, c.y);

    const stats = bottleStats(lunchbox);
    expect(stats.visible).toBe(2);
    expect(stats.zombies).toBe(0);
    expect(stats.itemCount).toBe(1);
  });
});
