import { describe, it, expect } from 'vitest';
// Ported from verify_loot_restoration.mjs (its stale Player.js import dropped).
// Exercises the full GameSaveSystem.loadGameState path, which dynamically wires
// up a LootGenerator, and confirms that generator actually works afterward.
import { GameSaveSystem } from '../../client/src/game/GameSaveSystem.js';

describe('Serialization / GameSaveSystem.loadGameState', () => {
  it('restores a working LootGenerator that can generate loot', async () => {
    const mapData = {
      width: 10,
      height: 10,
      tiles: Array(10)
        .fill(0)
        .map((_, y) =>
          Array(10)
            .fill(0)
            .map((_, x) => ({
              x,
              y,
              terrain: 'grass',
              contents: x === 5 && y === 5 ? [{ id: 'p1', type: 'player' }] : [],
            })),
        ),
    };

    const saveData = {
      version: '1.1.0',
      turn: 10,
      gameMap: mapData,
      worldManager: { currentMapId: 'map_001', maps: [], mapCounter: 1 },
      playerStats: { hp: 100, maxHp: 100, ap: 12, maxAp: 12, ammo: 0 },
      inventoryManager: {},
      cameraPosition: { x: 0, y: 0, zoomLevel: 1 },
    };

    const loadedState = await GameSaveSystem.loadGameState(saveData);

    expect(loadedState.lootGenerator, 'LootGenerator restored in loaded state').toBeTruthy();
    const items = loadedState.lootGenerator.generateZombieLoot('basic');
    expect(Array.isArray(items)).toBe(true);
  });
});
