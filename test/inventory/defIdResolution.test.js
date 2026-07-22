import { describe, it, expect } from 'vitest';
// Wave 2 P1:
//  - R14#5: NPCTypes item pools referenced dead defIds (tool.flashlight,
//    tool.matches) — ~22% of the survivor 'general' pool silently produced
//    nothing when rolled. Every pooled defId must resolve in ItemDefs.
//  - R31#1: three vehicle defs carried rarity: Rarity.EPIC, which doesn't
//    exist in the Rarity enum, so `rarity` serialized as undefined. Every def
//    must carry a valid rarity value.
import { NPCTypes } from '../../client/src/game/entities/NPCTypes.js';
import { ItemDefs, createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { Rarity } from '../../client/src/game/inventory/traits.js';

describe('Wave 2 P1 · NPC pool defIds resolve (R14#5)', () => {
  it('every defId in every NPC type pool exists in ItemDefs', () => {
    const missing = [];
    for (const [subtype, def] of Object.entries(NPCTypes)) {
      const pools = def.pools || {};
      for (const [poolName, ids] of Object.entries(pools)) {
        for (const defId of ids) {
          if (!createItemFromDef(defId)) missing.push(`${subtype}.${poolName}: ${defId}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('Wave 2 P1 · ItemDefs carry valid rarity (R31#1)', () => {
  it('no def references a nonexistent rarity (e.g. the removed Rarity.EPIC)', () => {
    const validRarities = new Set(Object.values(Rarity));
    const bad = [];
    for (const [key, def] of Object.entries(ItemDefs)) {
      // rarity is optional, but if present it must be a known enum value.
      if (def.rarity !== undefined && !validRarities.has(def.rarity)) {
        bad.push(`${key}: ${String(def.rarity)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('Rarity.EPIC is not a real rarity (guards against reintroduction)', () => {
    expect(Rarity.EPIC).toBeUndefined();
  });
});
