import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { ZombieReplenishmentSystem } from '../../client/src/game/systems/ZombieReplenishmentSystem.js';
import engine from '../../client/src/game/GameEngine.js';

describe('ZombieReplenishmentSystem', () => {
  let originalFieldOfView;

  beforeEach(() => {
    // Preserve engine field of view in case it's set
    originalFieldOfView = engine.playerFieldOfView;
    engine.playerFieldOfView = [];
  });

  afterEach(() => {
    engine.playerFieldOfView = originalFieldOfView;
  });

  it('does not spawn zombies inside the towncenter compound during replenishment', () => {
    // Create a 40x40 map
    const width = 40;
    const height = 40;
    const gameMap = new GameMap(width, height);

    // Initialize all tiles as explored and walkable (grass)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = gameMap.getTile(x, y);
        tile.terrain = 'grass';
        tile.flags.explored = true;
      }
    }

    // Set up player at (0, 0)
    const player = EntityFactory.createPlayer(0, 0);
    gameMap.addEntity(player, 0, 0);

    // Define townSquareCompound metadata
    // Area from (20, 20) to (30, 30) is inside the compound
    gameMap.metadata = {
      townSquareCompound: {
        fenceBounds: { x1: 20, x2: 30, y1: 20, y2: 30 }
      }
    };

    // We make all tiles OUTSIDE the compound (where dist > 15) unexplored,
    // so the ONLY possible spawn candidates with dist > 15 are inside the compound.
    // Since replenishment should avoid the compound, it will find 0 candidates and not spawn anything.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // If it's outside the compound, make it unexplored so it won't be a candidate
        const isInside = x >= 20 && x <= 30 && y >= 20 && y <= 30;
        if (!isInside) {
          gameMap.getTile(x, y).flags.explored = false;
        }
      }
    }

    // Mock world manager
    const mockWorldManager = {
      currentMapId: 'map_1',
      firstEntryTurn: { 'map_1': 1 },
      zombiesInitialCount: { 'map_1': 10 },
      zombiesSpawned: { 'map_1': 0 },
      lastReplenishSector: {},
      recordZombieSpawn(mapId) {
        this.zombiesSpawned[mapId] = (this.zombiesSpawned[mapId] || 0) + 1;
      }
    };

    // Run replenishment on turn 25 (turnsOnMap = 24, which meets the 24 turns minimum gate)
    ZombieReplenishmentSystem.processTurn(gameMap, player, mockWorldManager, 25);

    // Verify no zombies were spawned because the only candidate tiles were inside the compound
    const spawnedZombies = gameMap.getEntitiesByType('zombie') || [];
    expect(spawnedZombies.length).toBe(0);
    expect(mockWorldManager.zombiesSpawned['map_1']).toBe(0);
  });

  it('successfully spawns a zombie when candidate tiles outside the compound exist', () => {
    // Create a 40x40 map
    const width = 40;
    const height = 40;
    const gameMap = new GameMap(width, height);

    // Initialize all tiles as explored and walkable
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = gameMap.getTile(x, y);
        tile.terrain = 'grass';
        tile.flags.explored = true;
      }
    }

    // Set up player at (0, 0)
    const player = EntityFactory.createPlayer(0, 0);
    gameMap.addEntity(player, 0, 0);

    // Define townSquareCompound metadata
    gameMap.metadata = {
      townSquareCompound: {
        fenceBounds: { x1: 20, x2: 30, y1: 20, y2: 30 }
      }
    };

    // We keep tiles outside compound (at x >= 35) explored & walkable,
    // and make all other tiles unexplored.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isOutsideCandidate = x >= 35;
        if (!isOutsideCandidate) {
          gameMap.getTile(x, y).flags.explored = false;
        }
      }
    }

    // Mock world manager
    const mockWorldManager = {
      currentMapId: 'map_1',
      firstEntryTurn: { 'map_1': 1 },
      zombiesInitialCount: { 'map_1': 10 },
      zombiesSpawned: { 'map_1': 0 },
      lastReplenishSector: {},
      recordZombieSpawn(mapId) {
        this.zombiesSpawned[mapId] = (this.zombiesSpawned[mapId] || 0) + 1;
      }
    };

    // Run replenishment on turn 25
    ZombieReplenishmentSystem.processTurn(gameMap, player, mockWorldManager, 25);

    // Verify a zombie was spawned
    const spawnedZombies = gameMap.getEntitiesByType('zombie') || [];
    expect(spawnedZombies.length).toBe(1);
    expect(mockWorldManager.zombiesSpawned['map_1']).toBe(1);

    // Verify that the spawned zombie is at x >= 35 (not inside the compound x: 20..30)
    const spawnedZombie = spawnedZombies[0];
    expect(spawnedZombie.x).toBeGreaterThanOrEqual(35);
  });
});
