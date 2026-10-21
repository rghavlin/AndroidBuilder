import { describe, it, expect } from 'vitest';
// The editor's Stamp Building tool draws through the generator's MapBuilder, so
// a stamped house/special must come out with the same building record the
// generator produces (room roles, floorplanId, furniturePlan) and land exactly
// where its measured footprint says — the ghost preview and the overlap checks
// trust that footprint.
import {
  STAMP_GROUPS, getStampItem, measureStamp, buildStampMap, stampedCells,
  stampBlockedReason, mergeStampTiles,
} from '../../client/src/game/editor/buildingStamp.js';
import { FLOORPLANS } from '../../client/src/game/map/FloorplanRegistry.js';

const allItems = STAMP_GROUPS.flatMap(g => g.items);
const MAP = 60;

describe('building stamp catalog', () => {
  it('lists every floorplan once plus the special buildings and tent', () => {
    const houses = allItems.filter(i => i.key.startsWith('house:'));
    expect(houses.map(i => i.key.slice(6)).sort()).toEqual(FLOORPLANS.map(p => p.id).sort());
    expect(allItems.map(i => i.key)).toEqual(expect.arrayContaining([
      'special:gas_station', 'special:police', 'special:hardware_store', 'special:firestation', 'special:grocer', 'tent:army_tent',
    ]));
    expect(new Set(allItems.map(i => i.key)).size).toBe(allItems.length);
  });
});

describe('stamping', () => {
  for (const item of allItems) {
    for (const frontage of item.frontages) {
      it(`${item.key} facing ${frontage} lands inside its measured footprint`, () => {
        const sel = { key: item.key, frontage, mirror: item.mirrorable };
        const fp = measureStamp(sel);
        const x = 20, y = 20;
        const mapData = buildStampMap(sel, x, y, MAP, MAP);

        const [b] = mapData.metadata.buildings;
        expect(mapData.metadata.buildings).toHaveLength(1);
        expect({ x: b.x, y: b.y, w: b.width, h: b.height })
          .toEqual({ x: x + fp.building.x, y: y + fp.building.y, w: fp.building.w, h: fp.building.h });

        const inBounds = p => p.x >= x + fp.bounds.x && p.x < x + fp.bounds.x + fp.bounds.w
          && p.y >= y + fp.bounds.y && p.y < y + fp.bounds.y + fp.bounds.h;
        expect(stampedCells(mapData).every(inBounds)).toBe(true);
        expect(mapData.metadata.placeIcons.every(inBounds)).toBe(true);
        expect(mapData.metadata.doors.length).toBeGreaterThan(0);

        if (item.key.startsWith('house:')) {
          expect(b.type).toBe('residential');
          expect(b.floorplanId).toBe(item.key.slice(6));
          expect(b.rooms.length).toBeGreaterThan(2);
          expect(b.furniturePlan.length).toBeGreaterThan(0);
        } else {
          expect(b.type).toBe(item.key.split(':')[1]);
        }
      });
    }
  }
});

describe('stampBlockedReason', () => {
  const fp = measureStamp({ key: 'house:cottage_1bed', frontage: 'south' });
  it('accepts a clear spot and rejects off-map, building and furniture overlaps', () => {
    expect(stampBlockedReason(fp, 5, 5, MAP, MAP, [], [])).toBeNull();
    expect(stampBlockedReason(fp, MAP - 3, 5, MAP, MAP, [], [])).toMatch(/fit/);
    expect(stampBlockedReason(fp, 5, 5, MAP, MAP, [{ x: 10, y: 10, width: 4, height: 4 }], [])).toMatch(/building/);
    expect(stampBlockedReason(fp, 5, 5, MAP, MAP, [], [{ x: 8, y: 8, w: 1, h: 1 }])).toMatch(/furniture/);
  });
});

describe('mergeStampTiles', () => {
  it('replaces only touched cells, keeps entities, and leaves the sign gap alone', () => {
    const sel = { key: 'special:police', frontage: 'south' };
    const mapData = buildStampMap(sel, 10, 10, 40, 40);
    // Editor-format stand-ins: a road-painted map with a player standing in the lot.
    const editor = Array.from({ length: 40 }, () => Array.from({ length: 40 }, () => (
      { terrain: 'road', edgeWalls: {}, entities: [], items: [], decoration: 'bush' })));
    editor[12][12].entities = [{ type: 'player' }];
    const scratch = mapData.tiles.map(row => row.map(t => ({ terrain: t.terrain, edgeWalls: { marker: true } })));

    const out = mergeStampTiles(editor, scratch, mapData);
    const [b] = mapData.metadata.buildings;
    const [sign] = mapData.metadata.placeIcons;

    expect(out[b.y][b.x].terrain).toBe('floor');
    expect(out[b.y][b.x].edgeWalls).toEqual({ marker: true });
    expect(out[b.y][b.x].decoration).toBeUndefined();
    expect(out[12][12].entities).toEqual([{ type: 'player' }]);
    expect(out[sign.y][sign.x].placeIcon).toBe('police');
    expect(out[sign.y][sign.x].terrain).toBe('road'); // between building and sign: untouched
    expect(out[sign.y - 1][sign.x].decoration).toBe('bush');
    expect(editor[b.y][b.x].terrain).toBe('road'); // input not mutated
  });
});
