import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
// The Zombie Virus Cure is the only thing in the game that ends a zombie-virus
// infection permanently. Brain pulp and brainstem stew merely pause the clock
// (treat_infection); this clears it and sets virusImmune so no later bite can
// take hold. It must never come out of a loot table — it has to be placed
// deliberately (map editor, quest reward, authored event).
import { ItemDefs, createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { ItemTrait, ItemCategory } from '../../client/src/game/inventory/traits.js';
import { Entity } from '../../client/src/game/entities/Entity.js';
import { applyVirusCure, infectPlayer, cureInfection } from '../../client/src/game/utils/SurvivalCascade.js';
import { LootGenerator } from '../../client/src/game/map/LootGenerator.js';

const CURE_DEF_ID = 'medical.zombie_virus_cure';

describe('Zombie Virus Cure item definition', () => {
  it('is a 1x1 medical consumable with its own art', () => {
    const def = ItemDefs[CURE_DEF_ID];
    expect(def).toBeDefined();
    expect(def.name).toBe('Zombie Virus Cure');
    expect(def.imageId).toBe('zombieVirusCure');
    expect(def.width).toBe(1);
    expect(def.height).toBe(1);
    expect(def.categories).toContain(ItemCategory.MEDICAL);
    // CONSUMABLE + medical is what gives it the same right-click "Use" entry
    // antibiotics get (see ItemContextMenu).
    expect(def.traits).toContain(ItemTrait.CONSUMABLE);
    expect(def.consumptionEffects).toEqual({ cure_virus: true });
    expect(fs.existsSync(path.resolve('client/public/images/items/zombieVirusCure.png'))).toBe(true);
  });

  it('instantiates as a 1x1 Item', () => {
    const cure = new Item(createItemFromDef(CURE_DEF_ID));
    expect(cure.name).toBe('Zombie Virus Cure');
    expect(cure.width).toBe(1);
    expect(cure.height).toBe(1);
    expect(cure.hasTrait(ItemTrait.CONSUMABLE)).toBe(true);
  });

  it('never enters the loot catalog', () => {
    expect(ItemDefs[CURE_DEF_ID].noLoot).toBe(true);
    // The catalog every loot pass filters down from — including the bathroom
    // pass, which otherwise sweeps up every `medical.*` def.
    const gen = new LootGenerator();
    gen.initItemKeys();
    expect(gen.itemKeys).not.toContain(CURE_DEF_ID);
  });
});

describe('Zombie Virus Cure effect', () => {
  const infectedPlayer = () => {
    const p = new Entity('cure-test', 'player');
    p.inflictInfection();
    return p;
  };

  it('clears an active infection', () => {
    const p = infectedPlayer();
    expect(p.isInfected).toBe(true);

    const { cured, newlyImmune } = applyVirusCure(p);
    expect(cured).toBe(true);
    expect(newlyImmune).toBe(true);
    expect(p.isInfected).toBe(false);
    expect(p.virusImmune).toBe(true);
  });

  it('drops any in-progress treatment along with the infection', () => {
    const p = infectedPlayer();
    p.treatmentTicksRemaining = 6;
    p.treatmentSubtype = 'basic';
    p.treatmentName = 'Zombie brain pulp';

    applyVirusCure(p);
    expect(p.treatmentTicksRemaining).toBe(0);
    expect(p.treatmentSubtype).toBeNull();
    expect(p.treatmentName).toBeNull();
  });

  it('immunises a player who was never infected', () => {
    const p = new Entity('clean', 'player');
    const { cured, newlyImmune } = applyVirusCure(p);
    expect(cured).toBe(false); // nothing to cure
    expect(newlyImmune).toBe(true);
    expect(p.virusImmune).toBe(true);
  });

  it('reports a second dose as wasted', () => {
    const p = infectedPlayer();
    applyVirusCure(p);
    const second = applyVirusCure(p);
    expect(second).toEqual({ cured: false, newlyImmune: false });
  });
});

describe('Zombie virus immunity', () => {
  const immunePlayer = () => {
    const p = new Entity('immune', 'player');
    applyVirusCure(p);
    return p;
  };

  it('refuses a bite — the single choke point every path routes through', () => {
    const p = immunePlayer();
    p.inflictInfection();
    expect(p.isInfected).toBe(false);
  });

  it('refuses an authored infection, clock and all', () => {
    const p = immunePlayer();
    const before = p.infectionTicksRemaining;

    expect(infectPlayer(p)).toBe(false);
    expect(p.isInfected).toBe(false);

    // With explicit hours: infectPlayer sets the lethal clock itself, so the
    // guard inside inflictInfection alone would not be enough.
    expect(infectPlayer(p, 3)).toBe(false);
    expect(p.isInfected).toBe(false);
    expect(p.infectionTicksRemaining).toBe(before);
  });

  it('survives a save/load round trip', () => {
    const p = immunePlayer();
    const restored = Entity.fromJSON(JSON.parse(JSON.stringify(p.toJSON())));
    expect(restored.virusImmune).toBe(true);
    restored.inflictInfection();
    expect(restored.isInfected).toBe(false);
  });

  it('is off by default, and an ordinary cure does not grant it', () => {
    const p = new Entity('ordinary', 'player');
    expect(p.virusImmune).toBe(false);
    p.inflictInfection();
    // cureInfection is the authored-event path (a doctor NPC, a story beat):
    // it ends this infection but leaves the player catchable.
    expect(cureInfection(p)).toBe(true);
    expect(p.virusImmune).toBe(false);
    p.inflictInfection();
    expect(p.isInfected).toBe(true);
  });
});
