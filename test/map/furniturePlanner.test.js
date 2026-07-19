import { describe, it, expect, beforeEach } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { planFurniture, FURNITURE_FOOTPRINTS } from '../../client/src/game/map/FurniturePlanner.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';

/**
 * Builds a 20x20 map with one hand-made residential house at (2,2), 12x12:
 *
 * - Interior floor tiles: x 3..12, y 3..12.
 * - Vertical partition between x=7 and x=8 (full height) -> left room (living,
 *   entrance on the west wall at (2,5)) and right side.
 * - Horizontal partition on the right between y=8 and y=9 -> a bedroom-sized
 *   room (5x6 = 30 tiles) and a small room (5x4 = 20)... adjusted below so the
 *   small room is <= 9 tiles for bathroom classification.
 */
function buildTestMap() {
  const map = new GameMap(20, 20);

  // Interior floor
  for (let y = 3; y <= 12; y++) {
    for (let x = 3; x <= 12; x++) {
      map.getTile(x, y).terrain = 'floor';
    }
  }

  // Perimeter edge walls on the interior boundary tiles
  for (let x = 3; x <= 12; x++) {
    map.getTile(x, 3).edgeWalls.n = true;
    map.getTile(x, 12).edgeWalls.s = true;
  }
  for (let y = 3; y <= 12; y++) {
    map.getTile(3, y).edgeWalls.w = true;
    map.getTile(12, y).edgeWalls.e = true;
  }

  // Vertical partition between x=7 and x=8, full height -> two components
  for (let y = 3; y <= 12; y++) {
    map.getTile(7, y).edgeWalls.e = true;
  }

  // Horizontal partition on the right between y=9 and y=10, and a second
  // vertical one between x=9 and x=10 below it, carving a small 2x3 = 6-tile
  // room in the bottom-right corner (x 10..12 would be 3x3=9; use x 10..12,
  // y 10..12 = 9 tiles, <= 9 -> bathroom).
  for (let x = 10; x <= 12; x++) {
    map.getTile(x, 9).edgeWalls.s = true;
  }
  for (let y = 10; y <= 12; y++) {
    map.getTile(9, y).edgeWalls.e = true;
  }

  map.buildings = [{
    type: 'residential',
    x: 2, y: 2, width: 12, height: 12,
    entranceX: 2, entranceY: 5, frontage: 'west',
  }];

  return map;
}

const insideInterior = (x, y) => x >= 3 && x <= 12 && y >= 3 && y <= 12;

function footprintTiles(piece) {
  const tiles = [];
  for (let y = piece.y; y < piece.y + piece.h; y++) {
    for (let x = piece.x; x < piece.x + piece.w; x++) {
      tiles.push({ x, y });
    }
  }
  return tiles;
}

describe('FurniturePlanner', () => {
  beforeEach(() => {
    gameRandom.seed(4242);
  });

  it('places furniture only on interior floor tiles, without overlaps or wall-straddling', () => {
    const map = buildTestMap();
    planFurniture(map);

    expect(map.furniture.length).toBeGreaterThan(0);

    const seen = new Set();
    for (const piece of map.furniture) {
      const base = FURNITURE_FOOTPRINTS[piece.type];
      expect(base).toBeDefined();
      // Rotated footprint matches the base footprint (possibly swapped)
      const dims = [piece.w, piece.h].sort().join('x');
      expect(dims).toBe([base.w, base.h].sort().join('x'));
      expect([0, 1, 2, 3]).toContain(piece.rot);

      for (const { x, y } of footprintTiles(piece)) {
        expect(insideInterior(x, y), `${piece.type} tile (${x},${y}) inside interior`).toBe(true);
        expect(map.getTile(x, y).terrain).toBe('floor');
        // No overlap between pieces
        expect(seen.has(`${x},${y}`), `${piece.type} overlaps at (${x},${y})`).toBe(false);
        seen.add(`${x},${y}`);
        // No items under furniture
        expect(map.getItemsOnTile(x, y).length).toBe(0);
      }

      // Footprint never straddles an edge wall
      for (const { x, y } of footprintTiles(piece)) {
        if (x + 1 < piece.x + piece.w) {
          const a = map.getTile(x, y), b = map.getTile(x + 1, y);
          expect(a.edgeWalls.e || b.edgeWalls.w).toBe(false);
        }
        if (y + 1 < piece.y + piece.h) {
          const a = map.getTile(x, y), b = map.getTile(x, y + 1);
          expect(a.edgeWalls.s || b.edgeWalls.n).toBe(false);
        }
      }
    }
  });

  it('assigns room roles: couch/table in entrance room, toilet/bathtub in the small room, bed elsewhere', () => {
    const map = buildTestMap();
    planFurniture(map);

    const byType = Object.fromEntries(map.furniture.map(p => [p.type, p]));

    // Living area = left room (x 3..7): couch anchors there
    expect(byType.couch).toBeDefined();
    expect(byType.couch.x + byType.couch.w - 1).toBeLessThanOrEqual(7);

    // Bathroom = 3x3 bottom-right corner room (x 10..12, y 10..12)
    expect(byType.toilet).toBeDefined();
    expect(byType.toilet.x).toBeGreaterThanOrEqual(10);
    expect(byType.toilet.y).toBeGreaterThanOrEqual(10);
    expect(byType.bathtub).toBeDefined();
    expect(byType.bathtub.x).toBeGreaterThanOrEqual(10);
    expect(byType.bathtub.y).toBeGreaterThanOrEqual(10);

    // Bedroom = right-top room (x 8..12, y 3..9): bed anchors there
    expect(byType.bed).toBeDefined();
    expect(byType.bed.x).toBeGreaterThanOrEqual(8);
    expect(byType.bed.y + byType.bed.h - 1).toBeLessThanOrEqual(9);
  });

  it('avoids tiles that already hold items', () => {
    gameRandom.seed(4242);
    const clean = buildTestMap();
    planFurniture(clean);
    expect(clean.furniture.length).toBeGreaterThan(0);

    // Blanket the living room (left room) with items; couch/table can no longer fit
    gameRandom.seed(4242);
    const blocked = buildTestMap();
    for (let y = 3; y <= 12; y++) {
      for (let x = 3; x <= 7; x++) {
        const plank = createItemFromDef('weapon.plank');
        blocked.setItemsOnTile(x, y, [plank]);
      }
    }
    planFurniture(blocked);

    for (const piece of blocked.furniture) {
      for (const { x, y } of footprintTiles(piece)) {
        expect(blocked.getItemsOnTile(x, y).length).toBe(0);
      }
    }
    expect(blocked.furniture.some(p => p.type === 'couch' || p.type === 'table')).toBe(false);
  });

  it('is deterministic for the same seed', () => {
    gameRandom.seed(777);
    const a = buildTestMap();
    planFurniture(a);

    gameRandom.seed(777);
    const b = buildTestMap();
    planFurniture(b);

    expect(a.furniture).toEqual(b.furniture);
  });

  it('round-trips gameMap.furniture through toJSON -> fromJSON', async () => {
    const map = buildTestMap();
    planFurniture(map);
    expect(map.furniture.length).toBeGreaterThan(0);

    const restored = await GameMap.fromJSON(map.toJSON());
    expect(restored.furniture).toEqual(map.furniture);
  });

  it('ignores non-residential buildings', () => {
    const map = buildTestMap();
    map.buildings[0].type = 'lab';
    planFurniture(map);
    expect(map.furniture).toEqual([]);
  });
});
