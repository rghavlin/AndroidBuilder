import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';

describe('Snare Catching Mechanics (GameMap.processTurn)', () => {
  let map;
  let spyNext;

  beforeEach(() => {
    map = new GameMap(50, 50);
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        map.getTile(x, y).terrain = 'grass';
      }
    }
    spyNext = vi.spyOn(gameRandom, 'next');
  });

  afterEach(() => {
    spyNext.mockRestore();
  });

  it('does not catch rabbit on non-grass terrain even when sleeping', () => {
    const tile = map.getTile(10, 10);
    tile.terrain = 'road';
    const deployedSnare = createItemFromDef('tool.snare_deployed');
    map.setItemsOnTile(10, 10, [deployedSnare]);

    spyNext.mockReturnValue(0.001);

    map.processTurn(null, true);

    const items = tile.inventoryItems;
    expect(items.some(i => i.defId === 'food.rabbit_carcass')).toBe(false);
    expect(items.some(i => i.defId === 'tool.snare_deployed')).toBe(true);
  });

  it('catches rabbit with 20% chance when player is sleeping', () => {
    const deployedSnare = createItemFromDef('tool.snare_deployed');
    deployedSnare.condition = 100;
    map.setItemsOnTile(10, 10, [deployedSnare]);

    spyNext.mockReturnValue(0.19);

    map.processTurn(null, true);

    const tile = map.getTile(10, 10);
    const carcass = tile.inventoryItems.find(i => i.defId === 'food.rabbit_carcass');
    const undeployedSnare = tile.inventoryItems.find(i => i.defId === 'tool.snare_undeployed');

    expect(carcass).toBeDefined();
    expect(undeployedSnare).toBeDefined();
    expect(undeployedSnare.condition).toBe(75);
  });

  it('does not catch rabbit when awake and player is too close (< 15 tiles)', () => {
    const deployedSnare = createItemFromDef('tool.snare_deployed');
    map.setItemsOnTile(10, 10, [deployedSnare]);

    const player = EntityFactory.createPlayer(12, 10);
    spyNext.mockReturnValue(0.01);

    map.processTurn(player, false);

    const tile = map.getTile(10, 10);
    expect(tile.inventoryItems.some(i => i.defId === 'food.rabbit_carcass')).toBe(false);
    expect(tile.inventoryItems.some(i => i.defId === 'tool.snare_deployed')).toBe(true);
  });

  it('catches rabbit with 10% chance when player is 15-30 tiles away', () => {
    const deployedSnare = createItemFromDef('tool.snare_deployed');
    map.setItemsOnTile(10, 10, [deployedSnare]);

    const player = EntityFactory.createPlayer(30, 10);
    spyNext.mockReturnValue(0.09);

    map.processTurn(player, false);

    const tile = map.getTile(10, 10);
    expect(tile.inventoryItems.some(i => i.defId === 'food.rabbit_carcass')).toBe(true);
    expect(tile.inventoryItems.some(i => i.defId === 'tool.snare_undeployed')).toBe(true);
  });

  it('catches rabbit with 15% chance when player is > 30 tiles away', () => {
    const deployedSnare = createItemFromDef('tool.snare_deployed');
    map.setItemsOnTile(10, 10, [deployedSnare]);

    const player = EntityFactory.createPlayer(45, 10);
    spyNext.mockReturnValue(0.14);

    map.processTurn(player, false);

    const tile = map.getTile(10, 10);
    expect(tile.inventoryItems.some(i => i.defId === 'food.rabbit_carcass')).toBe(true);
    expect(tile.inventoryItems.some(i => i.defId === 'tool.snare_undeployed')).toBe(true);
  });

  it('destroys snare when its condition drops to 0 or below after catch', () => {
    const deployedSnare = createItemFromDef('tool.snare_deployed');
    deployedSnare.condition = 20;
    map.setItemsOnTile(10, 10, [deployedSnare]);

    spyNext.mockReturnValue(0.05);

    map.processTurn(null, true);

    const tile = map.getTile(10, 10);
    expect(tile.inventoryItems.some(i => i.defId === 'food.rabbit_carcass')).toBe(true);
    expect(tile.inventoryItems.some(i => i.defId === 'tool.snare_undeployed')).toBe(false);
    expect(tile.inventoryItems.some(i => i.defId === 'tool.snare_deployed')).toBe(false);
  });
});
