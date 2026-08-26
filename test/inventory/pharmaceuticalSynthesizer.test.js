import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ItemDefs, createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { Container } from '../../client/src/game/inventory/Container.js';
import { ItemTrait } from '../../client/src/game/inventory/traits.js';

describe('Pharmaceutical Synthesizer Item Definition', () => {
  const defId = 'furniture.pharmaceutical_synthesizer';

  it('exists in ItemDefs with required attributes', () => {
    const def = ItemDefs[defId];
    expect(def).toBeDefined();
    expect(def.name).toBe('Pharmaceutical Synthesizer');
    expect(def.imageId).toBe('pharmaceuticalSynthesizer');
    expect(def.width).toBe(4);
    expect(def.height).toBe(4);
    expect(def.noLoot).toBe(true);
    expect(def.noPickup).toBe(true);
    expect(def.backgroundColor).toBe('#8a0303');
    expect(def.traits).toContain(ItemTrait.GROUND_ONLY);
  });

  it('references a valid image file on disk', () => {
    const imagePath = path.resolve('client/public/images/items/pharmaceuticalSynthesizer.png');
    expect(fs.existsSync(imagePath)).toBe(true);
  });

  it('instantiates an Item instance correctly', () => {
    const itemData = createItemFromDef(defId);
    expect(itemData).not.toBeNull();
    const item = new Item(itemData);

    expect(item.name).toBe('Pharmaceutical Synthesizer');
    expect(item.width).toBe(4);
    expect(item.height).toBe(4);
    expect(item.noPickup).toBe(true);
    expect(item.hasTrait(ItemTrait.GROUND_ONLY)).toBe(true);
  });

  it('cannot be placed inside a non-ground container', () => {
    const itemData = createItemFromDef(defId);
    const item = new Item(itemData);
    const backpack = new Container({ id: 'test_backpack', type: 'backpack', width: 10, height: 10 });

    const nesting = backpack.validateNesting(item);
    expect(nesting.valid).toBe(false);
    expect(nesting.reason).toBe('Can only be placed on the ground or in vehicles');

    const added = backpack.addItem(item);
    expect(added).toBe(false);
  });
});
