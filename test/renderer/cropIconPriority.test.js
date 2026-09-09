// Icon priority for crops sharing a tile with loot.
//
// A carrot patch with a shovel dropped on it used to render as a shovel on a
// crop-green circle: harvestable crop defs carry no FOOD category (that belongs
// to the produce they yield), so the crop fell to the OTHER tier and lost the
// footprint tiebreak to a 5x2 shovel — while the green came from a separate
// .some() scan over every item on the tile. Crops now have their own tier, and
// the token's colour is derived from the item that actually won the icon.

import { describe, it, expect } from 'vitest';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { getDominantItemInTile } from '../../client/src/game/renderer/EntityRenderer.js';

const make = (defId) => new Item(createItemFromDef(defId));
const dominant = (...items) => getDominantItemInTile(items).defId;

describe('crop icon priority', () => {
  it('keeps a harvestable crop visible under a bigger tool', () => {
    // The reported bug: shovel is 5x2, the crop 2x2, and both used to tie at OTHER.
    expect(dominant(make('provision.harvestable_carrot'), make('weapon.shovel')))
      .toBe('provision.harvestable_carrot');
    expect(dominant(make('weapon.shovel'), make('provision.harvestable_carrot')))
      .toBe('provision.harvestable_carrot');
  });

  it('covers growing plants, not just harvestable ones', () => {
    expect(dominant(make('weapon.shovel'), make('provision.carrot_plant')))
      .toBe('provision.carrot_plant');
  });

  it('resolves crop-ness for plain-data pile entries with no isCrop flag', () => {
    const plain = { defId: 'provision.harvestable_tomato', width: 2, height: 2 };
    expect(getDominantItemInTile([make('weapon.shovel'), plain]).defId)
      .toBe('provision.harvestable_tomato');
  });

  it('still yields the tile to loose food', () => {
    // A can you can eat now outranks one you have to harvest first.
    expect(dominant(make('provision.harvestable_carrot'), make('food.carrot')))
      .toBe('food.carrot');
  });

  it('still yields the tile to an interactive marker', () => {
    expect(dominant(make('provision.harvestable_carrot'), make('placeable.help')))
      .toBe('placeable.help');
  });

  it('outranks guns, medical and containers', () => {
    const crop = () => make('provision.harvestable_carrot');
    expect(dominant(crop(), make('weapon.9mmPistol'))).toBe('provision.harvestable_carrot');
  });
});
