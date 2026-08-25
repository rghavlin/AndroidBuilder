import { describe, it, expect } from 'vitest';
import {
  planDecorations,
  getDecorationCategory,
  OUTDOOR_DECORATIONS,
  INDOOR_DECORATIONS,
  ROAD_DECORATIONS,
} from '../../client/src/game/map/DecorationPlanner.js';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';

describe('DecorationPlanner', () => {
  function createGrid(w, h, defaultTerrain = 'grass') {
    const grid = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        row.push({ x, y, terrain: defaultTerrain });
      }
      grid.push(row);
    }
    return grid;
  }

  it('categorizes decoration image types accurately', () => {
    for (const d of OUTDOOR_DECORATIONS) {
      expect(getDecorationCategory(d)).toBe('outdoor');
    }
    for (const d of INDOOR_DECORATIONS) {
      expect(getDecorationCategory(d)).toBe('indoor');
    }
    for (const d of ROAD_DECORATIONS) {
      expect(getDecorationCategory(d)).toBe('roadandsidewalk');
    }
  });

  it('places outdoor grass decorations on grass tiles', () => {
    const grid = createGrid(20, 20, 'grass');
    const res = planDecorations(grid, {
      outdoor: true,
      indoor: false,
      road: false,
      density: 'dense',
      seedOrRandom: 12345,
    });

    expect(res.outdoor).toBeGreaterThan(0);
    expect(res.indoor).toBe(0);
    expect(res.road).toBe(0);
    expect(res.total).toBe(res.outdoor);

    // Verify all placed decorations belong to outdoor list
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        if (grid[y][x].decoration) {
          expect(OUTDOOR_DECORATIONS).toContain(grid[y][x].decoration);
          expect(grid[y][x].terrain).toBe('grass');
        }
      }
    }
  });

  it('places indoor decorations on floor tiles only', () => {
    const grid = createGrid(20, 20, 'floor');
    const res = planDecorations(grid, {
      outdoor: false,
      indoor: true,
      road: false,
      density: 'dense',
      seedOrRandom: 54321,
    });

    expect(res.indoor).toBeGreaterThan(0);
    expect(res.outdoor).toBe(0);
    expect(res.road).toBe(0);

    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        if (grid[y][x].decoration) {
          expect(INDOOR_DECORATIONS).toContain(grid[y][x].decoration);
        }
      }
    }
  });

  it('places road decorations on road & sidewalk tiles only', () => {
    const grid = createGrid(20, 20, 'road');
    for (let y = 0; y < 20; y++) {
      grid[y][0].terrain = 'sidewalk';
    }

    const res = planDecorations(grid, {
      outdoor: false,
      indoor: false,
      road: true,
      density: 0.20,
      seedOrRandom: 9999,
    });

    expect(res.road).toBeGreaterThan(0);
    expect(res.indoor).toBe(0);
    expect(res.outdoor).toBe(0);

    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        if (grid[y][x].decoration) {
          expect(ROAD_DECORATIONS).toContain(grid[y][x].decoration);
          expect(['road', 'sidewalk']).toContain(grid[y][x].terrain);
        }
      }
    }
  });

  it('respects density levels (sparse < normal < dense)', () => {
    const makeAndCount = (density) => {
      const g = createGrid(40, 40, 'grass');
      return planDecorations(g, { density, seedOrRandom: 777 }).total;
    };

    const sparseCount = makeAndCount('sparse');
    const normalCount = makeAndCount('normal');
    const denseCount = makeAndCount('dense');

    expect(sparseCount).toBeLessThan(normalCount);
    expect(normalCount).toBeLessThan(denseCount);
  });

  it('clears existing decorations when clearExisting is true', () => {
    const grid = createGrid(10, 10, 'grass');
    grid[0][0].decoration = 'outdoordecor1';
    grid[1][1].decoration = 'outdoordecor2';

    planDecorations(grid, {
      outdoor: false,
      indoor: false,
      road: false,
      clearExisting: true,
    });

    expect(grid[0][0].decoration).toBeUndefined();
    expect(grid[1][1].decoration).toBeUndefined();
  });

  it('is deterministic when given the same seed', () => {
    const run = (seed) => {
      const g = createGrid(15, 15, 'grass');
      planDecorations(g, { density: 'normal', seedOrRandom: seed });
      return g.map(row => row.map(t => t.decoration || null));
    };

    const run1 = run(88888);
    const run2 = run(88888);
    const run3 = run(99999);

    expect(run1).toEqual(run2);
    expect(run1).not.toEqual(run3);
  });

  it('avoids compound areas when provided', () => {
    const grid = createGrid(30, 30, 'grass');
    const compound = { minX: 10, maxX: 20, minY: 10, maxY: 20 };

    planDecorations(grid, {
      outdoor: true,
      density: 'dense',
      compound,
      seedOrRandom: 4321,
    });

    for (let y = 10; y <= 20; y++) {
      for (let x = 10; x <= 20; x++) {
        expect(grid[y][x].decoration).toBeUndefined();
      }
    }
  });

  it('integrates cleanly with TemplateMapGenerator decoration passes', () => {
    const tmg = new TemplateMapGenerator();
    const mapData = tmg.generateFromTemplate('road', { mapNumber: 1 });

    let decorCount = 0;
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        if (mapData.tiles[y][x].decoration) {
          decorCount++;
        }
      }
    }

    expect(decorCount).toBeGreaterThan(0);
  });

  it('preserves tile decorations when loading custom scenario maps into GameMap', async () => {
    const { GameMap } = await import('../../client/src/game/map/GameMap.js');
    const scenarioData = {
      name: 'corridorTest',
      width: 10,
      height: 10,
      tiles: [
        [
          { x: 0, y: 0, terrain: 'grass', decoration: 'outdoordecor1' },
          { x: 1, y: 0, terrain: 'road', decoration: 'road1' },
          { x: 2, y: 0, terrain: 'floor', decoration: 'brokenchair' },
        ]
      ]
    };
    for (let y = 1; y < 10; y++) {
      const row = [];
      for (let x = 0; x < 10; x++) {
        row.push({ x, y, terrain: 'grass' });
      }
      scenarioData.tiles.push(row);
    }
    for (let x = 3; x < 10; x++) {
      scenarioData.tiles[0].push({ x, y: 0, terrain: 'grass' });
    }

    const tmg = new TemplateMapGenerator();
    const mapData = await tmg.generateFromScenario(scenarioData);

    expect(mapData.tiles[0][0].decoration).toBe('outdoordecor1');
    expect(mapData.tiles[0][1].decoration).toBe('road1');
    expect(mapData.tiles[0][2].decoration).toBe('brokenchair');

    const gameMap = new GameMap(mapData.width, mapData.height);
    await tmg.applyToGameMap(gameMap, mapData);

    expect(gameMap.getTile(0, 0).decoration).toBe('outdoordecor1');
    expect(gameMap.getTile(1, 0).decoration).toBe('road1');
    expect(gameMap.getTile(2, 0).decoration).toBe('brokenchair');

    // Test serialization round-trip
    const serialized = gameMap.toJSON();
    const restored = await GameMap.fromJSON(serialized);

    expect(restored.getTile(0, 0).decoration).toBe('outdoordecor1');
    expect(restored.getTile(1, 0).decoration).toBe('road1');
    expect(restored.getTile(2, 0).decoration).toBe('brokenchair');
  });
});
