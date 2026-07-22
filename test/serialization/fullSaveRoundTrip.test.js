import { describe, it, expect } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { GameSaveSystem } from '../../client/src/game/GameSaveSystem.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';
import engine from '../../client/src/game/GameEngine.js';

describe('Full Save/Load Round-Trip Serialization', () => {
  it('serializes and deserializes a complete game state with exact fidelity', async () => {
    // 1. Setup game state via harness
    const harness = new GameHarness({ seed: 42, width: 15, height: 15 });
    harness.bootstrap();
    engine.gameSeed = 42;

    const player = harness.player;
    player.maxHp = 100;
    player.hp = 85;
    player.maxAp = 12;
    player.ap = 10;

    // Equip backpack & weapon
    harness.equipItemDef('backpack.standard', 'backpack');
    harness.equipItemDef('weapon.knife', 'melee');

    // Spawn a zombie and set specific HP within maxHp bounds
    const zombie = harness.spawnZombie(5, 5, 'runner');
    zombie.hp = 8;

    // Advance RNG state by rolling a few times
    gameRandom.next();
    gameRandom.next();
    const preSaveRngState = gameRandom.getState();

    // 2. Construct state object for saveGameState
    const stateToSave = {
      turn: harness.turn,
      gameMap: harness.gameMap,
      worldManager: engine.worldManager,
      player: harness.player,
      camera: { x: 5, y: 5, zoomLevel: 1.2 },
      inventoryManager: engine.inventoryManager,
      isPlayerTurn: true,
      metadata: { mapTemplate: 'road', gameMode: 'survival' }
    };

    // 3. Serialize
    const saveData = GameSaveSystem.saveGameState(stateToSave);
    expect(saveData.version).toBe(GameSaveSystem.CURRENT_VERSION);
    expect(saveData.gameRandomState).toBe(preSaveRngState);

    // 4. Reset engine singleton to ensure clean load environment
    engine.reset();
    gameRandom.seed(999); // pollute RNG seed to verify restoration

    // 5. Deserialize
    const restoredComponents = await GameSaveSystem.loadGameState(saveData);

    // 6. Assertions
    expect(restoredComponents.turn).toBe(harness.turn);

    // Verify Player stats
    expect(restoredComponents.playerStats.hp).toBe(85);
    expect(restoredComponents.playerStats.maxHp).toBe(100);
    expect(restoredComponents.playerStats.ap).toBe(10);
    expect(restoredComponents.playerStats.maxAp).toBe(12);

    // Verify Player Entity
    const restoredPlayer = restoredComponents.player;
    expect(restoredPlayer).toBeDefined();
    expect(restoredPlayer.hp).toBe(85);
    expect(restoredPlayer.x ?? restoredPlayer.logicalX).toBe(player.x ?? player.logicalX);
    expect(restoredPlayer.y ?? restoredPlayer.logicalY).toBe(player.y ?? player.logicalY);

    // Verify GameMap & Entities
    const restoredMap = restoredComponents.gameMap;
    expect(restoredMap.width).toBe(15);
    expect(restoredMap.height).toBe(15);
    const restoredZombie = restoredMap.getEntity(zombie.id);
    expect(restoredZombie).toBeDefined();
    expect(restoredZombie.subtype).toBe('runner');
    expect(restoredZombie.hp).toBe(8);

    // Verify InventoryManager & Equipment
    const restoredInv = restoredComponents.inventoryManager;
    expect(restoredInv).toBeDefined();
    expect(restoredInv.equipment.backpack?.defId).toBe('backpack.standard');
    expect(restoredInv.equipment.melee?.defId).toBe('weapon.knife');

    // Verify PRNG State Continuity (uint32 normalized)
    expect(engine.gameSeed).toBe(42);
    expect(gameRandom.getState()).toBe(preSaveRngState >>> 0);
  });

  it('rejects save data with incompatible version floor', async () => {
    const invalidSaveData = {
      version: '0.9.0', // below MIN_SUPPORTED_VERSION
      gameMap: { width: 10, height: 10, tiles: [] },
      turn: 1
    };

    await expect(GameSaveSystem.loadGameState(invalidSaveData)).rejects.toThrow(/incompatible/i);
  });

  it('rejects save data missing essential fields', async () => {
    const corruptedData = {
      version: GameSaveSystem.CURRENT_VERSION
      // missing gameMap
    };

    await expect(GameSaveSystem.loadGameState(corruptedData)).rejects.toThrow(/Invalid save data format/i);
  });
});
