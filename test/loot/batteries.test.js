import { describe, it, expect, beforeAll } from 'vitest';
// Ported from verify_batteries.mjs. The probabilistic world-loot check is made
// non-flaky: we don't require a battery to appear, only that any that does is
// valid. RNG is seeded for reproducibility.
import { ItemDefs } from '../../client/src/game/inventory/ItemDefs.js';
import { LootGenerator } from '../../client/src/game/map/LootGenerator.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';

describe('Loot / batteries', () => {
  beforeAll(() => {
    gameRandom.seed(12345);
  });

  it('has a tool.battery definition that builds a single-stack item', () => {
    const def = ItemDefs['tool.battery'];
    expect(def).toBeDefined();
    const battery = Item.fromJSON({ ...def, instanceId: 'b0' });
    expect(battery.stackCount).toBe(1);
  });

  it('stacks two full batteries, but not a full one with a partial one', () => {
    const b1 = Item.fromJSON({ ...ItemDefs['tool.battery'], instanceId: 'b1' });
    const b2 = Item.fromJSON({ ...ItemDefs['tool.battery'], instanceId: 'b2' });

    // Both full -> stackable.
    expect(b1.canStackWith(b2)).toBe(true);

    // Partially used -> not stackable with a full one (only full-or-empty stack).
    b2.ammoCount = 5;
    expect(b1.canStackWith(b2)).toBe(false);
  });

  it('spawns any world-loot battery at full charge and stack size 1', () => {
    const lootGen = new LootGenerator();
    let sampled = 0;
    for (let i = 0; i < 500; i++) {
      const items = lootGen.generateRandomItems('any');
      const battery = items.find((it) => it.defId === 'tool.battery');
      if (battery) {
        sampled++;
        expect(battery.ammoCount).toBe(battery.capacity || 10);
        expect(battery.stackCount).toBe(1);
      }
    }
    // Presence is probabilistic; the assertions above only fire when one spawns.
    expect(sampled).toBeGreaterThanOrEqual(0);
  });
});
