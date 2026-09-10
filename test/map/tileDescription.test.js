// Tile description — the payload MapInterface gates tooltips on.
//
// The gate is a pre-filter: it checks these fields and bails before
// TileTooltipOverlay (which re-reads everything off the map itself) ever runs.
// So a hover mode that leaves them out doesn't get a thinner tooltip, it gets
// none — which is why flying the recon drone showed nothing at all.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { describeTile, describeIfExplored } from '../../client/src/game/map/TileDescription.js';
import { EntityType } from '../../client/src/game/entities/Entity.js';
import engine from '../../client/src/game/GameEngine.js';

// The fields MapInterface's gate actually tests. Every one has to be reachable
// from a describeTile payload or that tooltip can never appear.
const GATED_FIELDS = ['zombie', 'cropInfo', 'lootItems', 'specialBuilding', 'door', 'window', 'npc', 'rabbit', 'drone'];

describe('describeTile', () => {
  let harness;
  let map;

  beforeEach(() => {
    harness = new GameHarness({ seed: 3, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    map = harness.gameMap;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const t = map.getTile(x, y);
        if (t) t.flags = { ...t.flags, explored: true };
      }
    }
  });

  const at = (x, y) => describeTile(map, map.getTile(x, y), x, y);

  it('offers every field the tooltip gate tests', () => {
    const payload = at(2, 2);
    for (const field of GATED_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(payload, field), field).toBe(true);
    }
  });

  it('reports a zombie standing on the tile', () => {
    const zombie = harness.spawnZombie(4, 4);
    const payload = at(4, 4);
    expect(payload.zombie).toMatchObject({ hp: zombie.hp, maxHp: zombie.maxHp });
  });

  it('reports loot lying on the tile', () => {
    engine.inventoryManager.dropItemAtLocation(new Item(createItemFromDef('weapon.shovel')), 6, 6, map);
    expect(at(6, 6).lootItems?.length).toBeGreaterThan(0);
  });

  it('falls back to the hover payload for an entity mid-animation', () => {
    // A zombie's logical tile is already the next one over while it slides, so
    // MapCanvas passes what is visually here.
    const moving = { subtype: 'walker', hp: 5, maxHp: 10 };
    const payload = describeTile(map, map.getTile(8, 8), 8, 8, { zombie: moving });
    expect(payload.zombie).toBe(moving);
  });

  it('describes nothing for a tile that does not exist', () => {
    expect(describeTile(map, null, 3, 3)).toEqual({});
    expect(describeTile(null, map.getTile(3, 3), 3, 3)).toEqual({});
  });
});

describe('describeIfExplored', () => {
  let harness;
  let map;

  beforeEach(() => {
    harness = new GameHarness({ seed: 3, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    map = harness.gameMap;
  });

  it('stays silent on unexplored ground, so a remote camera is no x-ray', () => {
    const tile = map.getTile(9, 9);
    tile.flags = { ...tile.flags, explored: false };
    engine.inventoryManager.dropItemAtLocation(new Item(createItemFromDef('weapon.shovel')), 9, 9, map);

    expect(describeIfExplored(map, tile, 9, 9)).toEqual({});
  });

  it('describes explored ground in full', () => {
    const tile = map.getTile(9, 9);
    tile.flags = { ...tile.flags, explored: true };
    engine.inventoryManager.dropItemAtLocation(new Item(createItemFromDef('weapon.shovel')), 9, 9, map);

    const payload = describeIfExplored(map, tile, 9, 9);
    expect(payload.lootItems?.length).toBeGreaterThan(0);
    for (const field of GATED_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(payload, field), field).toBe(true);
    }
  });
});
