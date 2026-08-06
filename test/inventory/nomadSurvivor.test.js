import { describe, it, expect } from 'vitest';
import { ItemDefs } from '../../client/src/game/inventory/ItemDefs.js';
import engine from '../../client/src/game/GameEngine.js';
import { LootGenerator } from '../../client/src/game/map/LootGenerator.js';
import { GameSaveSystem } from '../../client/src/game/GameSaveSystem.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';

describe('Nomad Survivor Books & Recipes', () => {
  it('has noLoot: true set on all nomad survivor volumes in ItemDefs', () => {
    for (let i = 1; i <= 9; i++) {
      const defId = `book.nomad_survivor_${i}`;
      expect(ItemDefs[defId]).toBeDefined();
      expect(ItemDefs[defId].noLoot).toBe(true);
    }
  });

  it('excludes nomad survivor books from LootGenerator item catalog', () => {
    const lg = new LootGenerator();
    lg.initItemKeys();
    expect(lg.itemKeys).toBeDefined();
    for (let i = 1; i <= 9; i++) {
      const defId = `book.nomad_survivor_${i}`;
      expect(lg.itemKeys).not.toContain(defId);
    }
  });

  it('grants nomad survivor recipe access by default (pagesLeft: 0) on fresh GameEngine setup', () => {
    engine.reset();
    expect(engine.bookStats).toBeDefined();
    for (let i = 1; i <= 9; i++) {
      const defId = `book.nomad_survivor_${i}`;
      expect(engine.bookStats[defId]).toBeDefined();
      expect(engine.bookStats[defId].pagesLeft).toBe(0);
    }
  });

  it('guarantees nomad survivor books have pagesLeft: 0 even after loading an older save file', async () => {
    engine.reset();
    globalThis.gameEngine = engine;

    const player = EntityFactory.createPlayer(0, 0);
    const map = new GameMap(10, 10);
    map.addEntity(player, 0, 0);
    const mapJSON = map.toJSON();

    const mockSaveData = {
      version: '1.1.0',
      gameMap: mapJSON,
      turn: 5,
      bookStats: {
        'book.life_in_motion': { pagesLeft: 400, milestonesReached: 1 },
        'book.nomad_survivor_1': { pagesLeft: 15, milestonesReached: 0 }
      }
    };

    // Simulate GameSaveSystem loadGameState
    await GameSaveSystem.loadGameState(mockSaveData);

    expect(engine.bookStats['book.life_in_motion'].pagesLeft).toBe(400);
    
    // All nomad survivor volumes must be corrected to 0 pagesLeft
    for (let i = 1; i <= 9; i++) {
      const defId = `book.nomad_survivor_${i}`;
      expect(engine.bookStats[defId]).toBeDefined();
      expect(engine.bookStats[defId].pagesLeft).toBe(0);
    }

    delete globalThis.gameEngine;
  });
});
