import { describe, it, expect } from 'vitest';
// Exits are exit-arrow items that carry their own destination, exactly like
// stairs — there is no 'transition' terrain any more. These cover the whole
// chain: generated maps place arrows, old scenarios/saves/editor maps that still
// have the terrain (or tile-level mapTransitions) are converted, and one
// resolver turns any arrow or stairs into the transition the dialog shows.
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { WorldManager } from '../../client/src/game/WorldManager.js';
import { TEMPLATE_METADATA } from '../../client/src/game/config/TemplateConfig.js';
import { ITEM_SERIALIZED_FIELDS } from '../../client/src/game/entities/Entity.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import {
  TRANSITION_FIELDS, copyTransitionFields, transitionTypeOf, fieldsFromLegacyMapTransition, edgeExitFields, describeTransition,
} from '../../client/src/game/inventory/transitionFields.js';
import { findExits, findExitTile, removeExits, migrateLegacyTransitionCells } from '../../client/src/game/map/mapExits.js';
import { findSouthTransitionTile } from '../../client/src/game/map/MapUtils.js';
import { migrateEditorTransitionTiles } from '../../client/src/game/editor/editorExits.js';

const noTransitionTerrain = (tiles) => tiles.flat().every(t => t.terrain !== 'transition');
const exitOn = (tile) => (tile.inventoryItems || []).find(i => i.defId === 'placeable.exit');

describe('transition fields', () => {
  it('are persisted by both the Item class and the ECS item whitelist', () => {
    for (const f of TRANSITION_FIELDS) expect(ITEM_SERIALIZED_FIELDS).toContain(f);
    const fields = { transitionTargetType: 'generator', transitionTargetId: 'RoadGenerator', transitionTargetX: 3, transitionTargetY: 4, transitionLevel: 5 };
    const item = new Item({ ...createItemFromDef('placeable.exit'), ...fields });
    expect(copyTransitionFields(item.toJSON(), {})).toEqual(fields);
  });

  it('give stairs without a type the old scenario meaning, and an untyped exit none', () => {
    expect(transitionTypeOf({ defId: 'placeable.stairs_down' })).toBe('scenario');
    expect(transitionTypeOf({ defId: 'placeable.exit' })).toBeNull();
    expect(transitionTypeOf({ defId: 'placeable.exit', transitionTargetType: 'next' })).toBe('next');
  });

  it('convert legacy tile transitions and edge tiles', () => {
    expect(fieldsFromLegacyMapTransition({ targetType: 'tutorial_end', targetId: 'tutorial_end' })).toEqual({ transitionTargetType: 'tutorial_end' });
    expect(fieldsFromLegacyMapTransition({ targetType: 'generator', targetId: 'RoadGenerator', level: 3 }))
      .toEqual({ transitionTargetType: 'generator', transitionTargetId: 'RoadGenerator', transitionLevel: 3 });
    expect(edgeExitFields(0, 10)).toEqual({ transitionTargetType: 'next' });
    expect(edgeExitFields(9, 10)).toEqual({ transitionTargetType: 'previous' });
    expect(edgeExitFields(5, 10)).toBeNull();
    expect(describeTransition({ defId: 'placeable.stairs_up', transitionTargetId: 'Attic', transitionTargetX: 1, transitionTargetY: 2 })).toBe('→ Attic (1,2)');
  });
});

describe('generated maps', () => {
  const gen = new TemplateMapGenerator();

  it('put a next-map arrow on the north road end and a previous-map arrow on the south end, on plain road', () => {
    const d = gen.generateFromTemplate('road', { mapNumber: 2 });
    const { north, south } = d.metadata.spawnZones.transitionPoints;
    expect(noTransitionTerrain(d.tiles)).toBe(true);
    expect(d.tiles[north.y][north.x].terrain).toBe('road');
    expect(exitOn(d.tiles[north.y][north.x]).transitionTargetType).toBe('next');
    expect(exitOn(d.tiles[south.y][south.x]).transitionTargetType).toBe('previous');
  });

  it('give starting_road no way back south', () => {
    const d = gen.generateFromTemplate('starting_road', { mapNumber: 1 });
    const types = d.tiles.flat().map(exitOn).filter(Boolean).map(e => e.transitionTargetType);
    expect(types).toEqual(['next']);
  });

  it('keep the arrows (with their destinations) once applied to a GameMap', async () => {
    const d = gen.generateFromTemplate('road', { mapNumber: 2 });
    const map = new GameMap(d.width, d.height);
    await gen.applyToGameMap(map, d);
    expect(findExits(map).map(e => transitionTypeOf(e.item)).sort()).toEqual(['next', 'previous']);
    expect(findSouthTransitionTile(map)).toEqual(findExitTile(map, 'previous'));
    expect(removeExits(map, 'previous')).toBe(1);
    expect(findExitTile(map, 'previous')).toBeNull();
  });
});

describe('legacy maps', () => {
  it('scenario cells: transition terrain and authored mapTransitions become arrows, once', () => {
    const cells = Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => ({ terrain: 'grass' })));
    cells[0][1].terrain = 'transition';
    cells[4][1].terrain = 'transition';
    cells[2][2].terrain = 'transition';
    const authored = [{ x: 2, y: 2, targetType: 'scenario', targetId: 'Tutorial01' }];

    expect(migrateLegacyTransitionCells(cells, authored)).toBe(3);
    expect(noTransitionTerrain(cells)).toBe(true);
    expect(exitOn(cells[0][1]).transitionTargetType).toBe('next');
    expect(exitOn(cells[4][1]).transitionTargetType).toBe('previous');
    expect(exitOn(cells[2][2])).toMatchObject({ transitionTargetType: 'scenario', transitionTargetId: 'Tutorial01' });
    expect(migrateLegacyTransitionCells(cells, authored)).toBe(0); // idempotent: scenarios are reloaded
  });

  it('old saves: a restored map loses the terrain and its untyped arrows get their destination', async () => {
    const map = new GameMap(5, 6);
    map.getTile(2, 0).terrain = 'transition';
    map.getTile(2, 5).terrain = 'transition';
    map.setItemsOnTile(2, 0, [createItemFromDef('placeable.exit')]);
    map.setItemsOnTile(2, 5, [createItemFromDef('placeable.exit')]);

    const restored = await GameMap.fromJSON(map.toJSON());
    expect(restored.getTile(2, 0).terrain).toBe('road');
    expect(restored.getTile(2, 5).terrain).toBe('road');
    expect(findExitTile(restored, 'next')).toEqual({ x: 2, y: 0 });
    expect(findExitTile(restored, 'previous')).toEqual({ x: 2, y: 5 });
  });

  it('editor tiles: the dark square becomes road with an arrow; tile mapTransitions become arrows', () => {
    const tile = (extra) => ({ terrain: 'grass', items: [], ...extra });
    const tiles = [
      [tile({ terrain: 'transition' }), tile({})],
      [tile({ mapTransition: { targetType: 'generator', targetId: 'RoadGenerator', level: 2 } }), tile({})],
      [tile({}), tile({ terrain: 'transition' })],
    ];
    migrateEditorTransitionTiles(tiles);
    expect(tiles.flat().every(t => t.terrain !== 'transition' && !('mapTransition' in t))).toBe(true);
    expect(tiles[0][0]).toMatchObject({ terrain: 'road', items: [{ defId: 'placeable.exit', transitionTargetType: 'next' }] });
    expect(tiles[1][0].items[0]).toMatchObject({ transitionTargetType: 'generator', transitionTargetId: 'RoadGenerator', transitionLevel: 2 });
    expect(tiles[2][1].items[0].transitionTargetType).toBe('previous');
  });
});

describe('WorldManager.resolveItemTransition (one path for arrows and stairs)', () => {
  const wm = (mapId) => { const w = new WorldManager(); w.currentMapId = mapId; return w; };
  const at = { x: 4, y: 0 };
  const exit = (fields) => ({ defId: 'placeable.exit', ...fields });

  it('next / previous follow the road chain and arrive ON the far exit arrow', () => {
    // Exits only fire when clicked, so the player lands on the arrow itself
    // rather than a step inside it (which put them on map 1's toll barrier).
    const w = wm('map_002');
    const next = w.resolveItemTransition(exit({ transitionTargetType: 'next' }), at);
    expect(next).toMatchObject({ direction: 'north', nextMapId: 'map_003', position: at });
    const predicted = TEMPLATE_METADATA[w.determineTemplateForMap('map_003')];
    expect(next.spawnPosition.y).toBe((predicted?.size?.height ?? 125) - 1); // its bottom row
    expect(wm('map_002').resolveItemTransition(exit({ transitionTargetType: 'previous' }), at))
      .toMatchObject({ direction: 'south', nextMapId: 'map_001', spawnPosition: { y: 0 } });
    expect(wm('map_001').resolveItemTransition(exit({ transitionTargetType: 'previous' }), at)).toBeNull();
  });

  it('stairs and arrows with an authored destination resolve the same way', () => {
    const fields = { transitionTargetType: 'scenario', transitionTargetId: 'Basement', transitionTargetX: 7, transitionTargetY: 8 };
    const viaStairs = wm('map_002').resolveItemTransition({ defId: 'placeable.stairs_down', ...fields }, at);
    const viaArrow = wm('map_002').resolveItemTransition(exit(fields), at);
    expect(viaStairs).toMatchObject({ direction: 'stairs_down', nextMapId: 'Basement', spawnPosition: { x: 7, y: 8 }, isCustom: true, targetType: 'scenario' });
    expect({ ...viaArrow, direction: 'stairs_down' }).toEqual(viaStairs);
  });

  it('legacy stairs (no type) are scenario links; generator and tutorial end carry their extras', () => {
    expect(wm('map_002').resolveItemTransition({ defId: 'placeable.stairs_up', transitionTargetId: 'Attic' }, at))
      .toMatchObject({ direction: 'stairs_up', nextMapId: 'Attic', spawnPosition: null, targetType: 'scenario' });
    expect(wm('map_002').resolveItemTransition(exit({ transitionTargetType: 'generator', transitionTargetId: 'RoadGenerator', transitionLevel: 4 }), at))
      .toMatchObject({ nextMapId: 'RoadGenerator', targetType: 'generator', level: 4, isCustom: true });
    expect(wm('map_002').resolveItemTransition(exit({ transitionTargetType: 'tutorial_end' }), at))
      .toMatchObject({ isTutorialEnd: true, targetType: 'generator', nextMapId: 'BranchingRoadGenerator' });
  });

  it('refuses items with no usable destination', () => {
    expect(wm('map_002').resolveItemTransition(exit({}), at)).toBeNull();
    expect(wm('map_002').resolveItemTransition(exit({ transitionTargetType: 'scenario' }), at)).toBeNull();
    expect(wm('map_002').resolveItemTransition({ defId: 'food.can' }, at)).toBeNull();
  });
});
