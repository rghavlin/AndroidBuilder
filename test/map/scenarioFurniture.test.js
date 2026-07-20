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
});
