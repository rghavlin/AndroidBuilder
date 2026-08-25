import { describe, it, expect } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { planRoadVehicles } from '../../client/src/game/map/RoadVehiclePlanner.js';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { LootGenerator } from '../../client/src/game/map/LootGenerator.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';

describe('RoadVehiclePlanner', () => {
  it('places vertical vehicles (rot 0 or 2, 2x4 footprint) on vertical roads', () => {
    gameRandom.seed(12345);
    const map = new GameMap(25, 60);
    // Draw a vertical road 5 tiles wide down the center (x = 10..14)
    for (let y = 0; y < 60; y++) {
      for (let x = 0; x < 25; x++) {
        const terrain = (x >= 10 && x <= 14) ? 'road' : 'grass';
        map.setTerrain(x, y, terrain);
      }
    }

    const placed = planRoadVehicles(map, { minVehicles: 2, maxVehicles: 4 });
    expect(placed.length).toBeGreaterThanOrEqual(1);

    for (const v of placed) {
      expect(['car', 'pickup', 'van']).toContain(v.type);
      expect(v.w).toBe(2);
      expect(v.h).toBe(4);
      expect([0, 2]).toContain(v.rot); // 0 (North) or 2 (South)

      // Ensure every tile in the footprint is road terrain
      for (let dy = 0; dy < v.h; dy++) {
        for (let dx = 0; dx < v.w; dx++) {
          const tile = map.getTile(v.x + dx, v.y + dy);
          expect(tile.terrain).toBe('road');
        }
      }
    }
  });

  it('places horizontal vehicles (rot 1 or 3, 4x2 footprint) on horizontal roads', () => {
    gameRandom.seed(54321);
    const map = new GameMap(60, 25);
    // Draw a horizontal road 5 tiles wide across the center (y = 10..14)
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 60; x++) {
        const terrain = (y >= 10 && y <= 14) ? 'road' : 'grass';
        map.setTerrain(x, y, terrain);
      }
    }

    const placed = planRoadVehicles(map, { minVehicles: 2, maxVehicles: 4 });
    expect(placed.length).toBeGreaterThanOrEqual(1);

    for (const v of placed) {
      expect(['car', 'pickup', 'van']).toContain(v.type);
      expect(v.w).toBe(4);
      expect(v.h).toBe(2);
      expect([1, 3]).toContain(v.rot); // 1 (East) or 3 (West)

      // Ensure every tile in the footprint is road terrain
      for (let dy = 0; dy < v.h; dy++) {
        for (let dx = 0; dx < v.w; dx++) {
          const tile = map.getTile(v.x + dx, v.y + dy);
          expect(tile.terrain).toBe('road');
        }
      }
    }
  });

  it('respects sparse placement and minimum distance between vehicles', () => {
    gameRandom.seed(999);
    const map = new GameMap(30, 100);
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 30; x++) {
        map.setTerrain(x, y, (x >= 12 && x <= 17) ? 'road' : 'grass');
      }
    }

    const minDistance = 15;
    const placed = planRoadVehicles(map, { minVehicles: 3, maxVehicles: 5, minDistance });

    // Check pairwise distance between all placed vehicles
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        const dist = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
        expect(dist).toBeGreaterThanOrEqual(minDistance);
      }
    }
  });

  it('avoids map transition edge buffer zones at the top and bottom of maps', () => {
    gameRandom.seed(777);
    const map = new GameMap(30, 80);
    for (let y = 0; y < 80; y++) {
      for (let x = 0; x < 30; x++) {
        map.setTerrain(x, y, (x >= 12 && x <= 16) ? 'road' : 'grass');
      }
    }

    const placed = planRoadVehicles(map, { minVehicles: 3, maxVehicles: 6 });
    for (const v of placed) {
      // Must not be placed right at top transition (y < 4) or bottom transition (y + h > 76)
      expect(v.y).toBeGreaterThanOrEqual(4);
      expect(v.y + v.h).toBeLessThanOrEqual(76);
    }
  });

  it('is seed-stable when generating maps', () => {
    function runWithSeed(seed) {
      gameRandom.seed(seed);
      const map = new GameMap(25, 80);
      for (let y = 0; y < 80; y++) {
        for (let x = 0; x < 25; x++) {
          map.setTerrain(x, y, (x >= 10 && x <= 14) ? 'road' : 'grass');
        }
      }
      return planRoadVehicles(map);
    }

    const run1 = runWithSeed(4242);
    const run2 = runWithSeed(4242);
    expect(run1).toEqual(run2);
  });

  it('generates vehicles on procedural template maps via LootGenerator.spawnLoot', async () => {
    gameRandom.seed(1111);
    const tmg = new TemplateMapGenerator();
    const templateData = tmg.generateFromTemplate('road', { mapNumber: 1 });
    const gameMap = new GameMap(templateData.width, templateData.height);
    await tmg.applyToGameMap(gameMap, templateData);

    const lootGen = new LootGenerator();
    lootGen.spawnLoot(gameMap, 1, 'road');

    const vehicleOutlines = gameMap.furniture.filter(f =>
      ['car', 'pickup', 'van'].includes(f.type)
    );

    expect(vehicleOutlines.length).toBeGreaterThanOrEqual(2);
    expect(vehicleOutlines.length).toBeLessThanOrEqual(8);

    for (const v of vehicleOutlines) {
      for (let dy = 0; dy < v.h; dy++) {
        for (let dx = 0; dx < v.w; dx++) {
          const tile = gameMap.getTile(v.x + dx, v.y + dy);
          expect(tile.terrain).toBe('road');
        }
      }
    }
  });

  it('scales vehicle count on large branching_road maps proportionally to road network', async () => {
    gameRandom.seed(2222);
    const tmg = new TemplateMapGenerator();
    const templateData = tmg.generateFromTemplate('branching_road', { mapNumber: 2 });
    const gameMap = new GameMap(templateData.width, templateData.height);
    await tmg.applyToGameMap(gameMap, templateData);

    const lootGen = new LootGenerator();
    lootGen.spawnLoot(gameMap, 2, 'branching_road');

    const vehicleOutlines = gameMap.furniture.filter(f =>
      ['car', 'pickup', 'van'].includes(f.type)
    );

    // Large city grid should have significantly more vehicles than a single road corridor
    expect(vehicleOutlines.length).toBeGreaterThanOrEqual(20);

    for (const v of vehicleOutlines) {
      for (let dy = 0; dy < v.h; dy++) {
        for (let dx = 0; dx < v.w; dx++) {
          const tile = gameMap.getTile(v.x + dx, v.y + dy);
          expect(tile.terrain).toBe('road');
        }
      }
    }
  });
});
