import { describe, it, expect } from 'vitest';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';

// Scenario load paths (initial load + scenario transitions) skip spawnLoot and
// therefore never run planFurniture. applyToGameMap must instead stamp each
// building's furniturePlan (authored via floorplans / the map editor) verbatim
// into gameMap.furniture so editor maps keep their furniture outlines in-game.

// Minimal scenario-format tiles: ScenarioMapGenerator reads t.terrain plus
// optional t.edgeWalls / t.inventoryItems per cell of a 2D grid.
function emptyTiles(width, height) {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ terrain: 'grass' }))
  );
}

async function loadScenario(scenarioData) {
  const tmg = new TemplateMapGenerator();
  const mapData = await tmg.generateFromScenario(scenarioData);
  const gameMap = new GameMap(mapData.width, mapData.height);
  await tmg.applyToGameMap(gameMap, mapData);
  return gameMap;
}

describe('Scenario furniture outlines', () => {
  it('stamps building furniturePlan into gameMap.furniture on scenario load', async () => {
    const tmg = new TemplateMapGenerator();
    const gen = tmg.generateFromTemplate('starting_road', { mapNumber: 1 });
    const buildings = gen.metadata.buildings;
    expect(buildings.some(b => Array.isArray(b.furniturePlan) && b.furniturePlan.length > 0)).toBe(true);

    const gameMap = await loadScenario({
      name: 'furniture_roundtrip',
      width: gen.width,
      height: gen.height,
      tiles: emptyTiles(gen.width, gen.height),
      metadata: { buildings },
    });

    const expected = buildings.flatMap(b => (b.furniturePlan || []).map(p => ({ ...p })));
    expect(expected.length).toBeGreaterThan(0);
    expect(gameMap.furniture).toEqual(expected);
  });

  it('leaves gameMap.furniture empty when no building carries a furniturePlan', async () => {
    const gameMap = await loadScenario({
      name: 'no_furniture_plan',
      width: 10,
      height: 10,
      tiles: emptyTiles(10, 10),
      metadata: { buildings: [{ type: 'residential', x: 1, y: 1, width: 8, height: 8 }] },
    });

    expect(gameMap.furniture).toEqual([]);
  });

  it('preserves furniture through savegame toJSON -> fromJSON', async () => {
    const tmg = new TemplateMapGenerator();
    const gen = tmg.generateFromTemplate('starting_road', { mapNumber: 1 });
    const gameMap = await loadScenario({
      name: 'furniture_saveload',
      width: gen.width,
      height: gen.height,
      tiles: emptyTiles(gen.width, gen.height),
      metadata: { buildings: gen.metadata.buildings },
    });
    expect(gameMap.furniture.length).toBeGreaterThan(0);

    const loaded = await GameMap.fromJSON(JSON.parse(JSON.stringify(gameMap.toJSON())));
    expect(loaded.furniture).toEqual(gameMap.furniture);
  });

  // Loose stamps: the editor's furniture tool writes metadata.furniture, which
  // is independent of any building so it must survive a scenario with no
  // buildings at all.
  it('stamps loose metadata.furniture with no buildings present', async () => {
    const loose = [
      { type: 'bed', x: 2, y: 2, w: 2, h: 3, rot: 0 },
      { type: 'couch', x: 5, y: 1, w: 1, h: 3, rot: 1 },
    ];
    const gameMap = await loadScenario({
      name: 'loose_furniture_only',
      width: 12,
      height: 12,
      tiles: emptyTiles(12, 12),
      metadata: { furniture: loose },
    });

    expect(gameMap.furniture).toEqual(loose);
  });

  it('combines building furniturePlan and loose stamps, and round-trips both', async () => {
    const tmg = new TemplateMapGenerator();
    const gen = tmg.generateFromTemplate('starting_road', { mapNumber: 1 });
    const buildings = gen.metadata.buildings;
    const loose = [{ type: 'toilet', x: 0, y: 0, w: 1, h: 1, rot: 0 }];

    const gameMap = await loadScenario({
      name: 'furniture_mixed',
      width: gen.width,
      height: gen.height,
      tiles: emptyTiles(gen.width, gen.height),
      metadata: { buildings, furniture: loose },
    });

    const planned = buildings.flatMap(b => (b.furniturePlan || []).map(p => ({ ...p })));
    expect(planned.length).toBeGreaterThan(0);
    expect(gameMap.furniture).toEqual([...planned, ...loose]);

    const loaded = await GameMap.fromJSON(JSON.parse(JSON.stringify(gameMap.toJSON())));
    expect(loaded.furniture).toEqual(gameMap.furniture);
  });
});
