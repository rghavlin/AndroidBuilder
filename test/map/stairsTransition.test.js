import { describe, it, expect } from 'vitest';
import { WorldManager } from '../../client/src/game/WorldManager.js';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';

// Stairs authored without target coordinates hand executeTransition a null
// spawn position. The generating branches resolve one themselves, but a
// destination map that already exists (i.e. every trip back to a map you have
// already visited) has no generator metadata to fall back on — it used to
// dereference the null and abort the transition with success: false.

function emptyTiles(width, height) {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ terrain: 'grass' }))
  );
}

function stairs(defId, targetId) {
  return {
    instanceId: `${defId}-test`,
    defId,
    id: defId,
    name: defId,
    width: 3,
    height: 3,
    noDrag: true,
    traits: ['groundOnly'],
    noLoot: true,
    renderFullTile: true,
    transitionTargetId: targetId,
  };
}

async function loadScenario(scenarioData) {
  const tmg = new TemplateMapGenerator();
  const mapData = await tmg.generateFromScenario(scenarioData);
  const gameMap = new GameMap(mapData.width, mapData.height);
  await tmg.applyToGameMap(gameMap, mapData);
  return gameMap;
}

describe('Stairs transitions to an already-visited map', () => {
  it('resolves a spawn position from the reciprocal stairs when none is authored', async () => {
    const upstairs = emptyTiles(10, 10);
    upstairs[4][3].inventoryItems = [stairs('placeable.stairs_down', 'downstairs')];

    const downstairs = emptyTiles(10, 10);
    downstairs[7][6].inventoryItems = [stairs('placeable.stairs_up', 'upstairs')];

    const worldManager = new WorldManager();
    const upMap = await loadScenario({ name: 'upstairs', width: 10, height: 10, tiles: upstairs });
    worldManager.saveCurrentMap(upMap, 'upstairs', 1, 'scenario');

    // Stand in for a first visit: the downstairs map is already in the world
    // collection, so the transition takes the load-existing-map path.
    const downMap = await loadScenario({ name: 'downstairs', width: 10, height: 10, tiles: downstairs });
    worldManager.saveCurrentMap(downMap, 'downstairs', 1, 'scenario');
    worldManager.currentMapId = 'upstairs';

    const result = await worldManager.executeTransition('downstairs', null, 1, {
      targetType: 'scenario',
      targetId: 'downstairs',
      level: 1,
    });

    expect(result.success).toBe(true);
    expect(result.spawnPosition).toEqual({ x: 6, y: 7 });
  });
});
