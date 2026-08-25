import { describe, it, expect } from 'vitest';
import { FURNITURE_FOOTPRINTS } from '../../client/src/game/map/FurniturePlanner.js';
import { FLOORPLAN_FOOTPRINTS } from '../../client/src/game/map/FloorplanRegistry.js';
import { TileRenderer } from '../../client/src/game/renderer/TileRenderer.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';

describe('Vehicle Outlines', () => {
  it('defines car, pickup, and van footprints in FURNITURE_FOOTPRINTS', () => {
    expect(FURNITURE_FOOTPRINTS.car).toEqual({ w: 2, h: 4 });
    expect(FURNITURE_FOOTPRINTS.pickup).toEqual({ w: 2, h: 4 });
    expect(FURNITURE_FOOTPRINTS.van).toEqual({ w: 2, h: 4 });
  });

  it('synchronizes vehicle footprints with FLOORPLAN_FOOTPRINTS', () => {
    expect(FLOORPLAN_FOOTPRINTS.car).toEqual({ w: 2, h: 4 });
    expect(FLOORPLAN_FOOTPRINTS.pickup).toEqual({ w: 2, h: 4 });
    expect(FLOORPLAN_FOOTPRINTS.van).toEqual({ w: 2, h: 4 });
  });

  it('supports rotated footprint calculations for vehicles', () => {
    function rotatedFootprint(type, rot) {
      const base = FURNITURE_FOOTPRINTS[type];
      return (rot % 2) ? { w: base.h, h: base.w } : { w: base.w, h: base.h };
    }

    for (const type of ['car', 'pickup', 'van']) {
      // North / South (rot 0, 2): 2x4
      expect(rotatedFootprint(type, 0)).toEqual({ w: 2, h: 4 });
      expect(rotatedFootprint(type, 2)).toEqual({ w: 2, h: 4 });
      // East / West (rot 1, 3): 4x2
      expect(rotatedFootprint(type, 1)).toEqual({ w: 4, h: 2 });
      expect(rotatedFootprint(type, 3)).toEqual({ w: 4, h: 2 });
    }
  });

  it('executes TileRenderer.drawFurniture for vehicle outlines without throwing in all 4 rotations', () => {
    // Mock canvas 2D context
    const mockCtx = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      quadraticCurveTo: () => {},
      stroke: () => {},
      fill: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      roundRect: () => {},
      arc: () => {},
      ellipse: () => {},
    };

    const vehicleTypes = ['car', 'pickup', 'van'];
    for (const type of vehicleTypes) {
      for (let rot = 0; rot < 4; rot++) {
        const piece = {
          type,
          x: 10,
          y: 10,
          w: (rot % 2 === 0) ? 2 : 4,
          h: (rot % 2 === 0) ? 4 : 2,
          rot,
        };
        expect(() => {
          TileRenderer.drawFurniture(mockCtx, piece, 32);
        }).not.toThrow();
      }
    }
  });

  it('round-trips vehicle outlines placed on roads through GameMap toJSON and fromJSON', async () => {
    const map = new GameMap(20, 20);
    map.furniture = [
      { type: 'car', x: 5, y: 2, w: 2, h: 4, rot: 0 },
      { type: 'pickup', x: 10, y: 8, w: 4, h: 2, rot: 1 },
      { type: 'van', x: 12, y: 14, w: 2, h: 4, rot: 2 },
    ];

    const json = map.toJSON();
    const restored = await GameMap.fromJSON(json);

    expect(restored.furniture).toEqual(map.furniture);
  });

  it('stamps loose vehicle outlines from scenario metadata into gameMap.furniture', async () => {
    const tmg = new TemplateMapGenerator();
    const scenario = {
      name: 'road_vehicles',
      width: 20,
      height: 20,
      tiles: Array.from({ length: 20 }, () =>
        Array.from({ length: 20 }, () => ({ terrain: 'road' }))
      ),
      metadata: {
        furniture: [
          { type: 'car', x: 2, y: 4, w: 2, h: 4, rot: 0 },
          { type: 'van', x: 8, y: 10, w: 4, h: 2, rot: 3 },
        ],
      },
    };

    const mapData = await tmg.generateFromScenario(scenario);
    const gameMap = new GameMap(mapData.width, mapData.height);
    await tmg.applyToGameMap(gameMap, mapData);

    expect(gameMap.furniture).toEqual([
      { type: 'car', x: 2, y: 4, w: 2, h: 4, rot: 0 },
      { type: 'van', x: 8, y: 10, w: 4, h: 2, rot: 3 },
    ]);
  });
});
