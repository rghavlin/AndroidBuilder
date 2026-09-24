import { describe, it, expect } from 'vitest';
import { ItemDefs } from '../../client/src/game/inventory/ItemDefs.js';
import { SPECIAL_BUILDING_LOOT } from '../../client/src/game/map/LootTables.js';
import { LootGenerator } from '../../client/src/game/map/LootGenerator.js';
import { CorridorLootGenerator } from '../../client/src/game/map/generators/CorridorLootGenerator.js';

describe('Loot / screwdriver', () => {
  it('has noLoot set on weapon.screwdriver definition', () => {
    expect(ItemDefs['weapon.screwdriver']).toBeDefined();
    expect(ItemDefs['weapon.screwdriver'].noLoot).toBe(true);
  });

  it('does not include weapon.screwdriver in hardware_store tools loot table', () => {
    const tools = SPECIAL_BUILDING_LOOT.hardware_store.tools;
    expect(tools).not.toContain('weapon.screwdriver');
  });

  it('excludes weapon.screwdriver from LootGenerator and CorridorLootGenerator item keys', () => {
    const lootGen = new LootGenerator();
    lootGen.generateRandomItems('any');
    expect(lootGen.itemKeys).not.toContain('weapon.screwdriver');

    const corridorGen = new CorridorLootGenerator();
    corridorGen.generateRandomItems('any');
    expect(corridorGen.itemKeys).not.toContain('weapon.screwdriver');
  });

  it('never drops weapon.screwdriver across random item generation samples', () => {
    const lootGen = new LootGenerator();
    for (let i = 0; i < 500; i++) {
      const items = lootGen.generateRandomItems('any');
      const screwdriver = items.find((it) => it.defId === 'weapon.screwdriver');
      expect(screwdriver).toBeUndefined();
    }
  });
});
