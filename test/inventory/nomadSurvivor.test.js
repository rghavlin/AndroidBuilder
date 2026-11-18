import { describe, it, expect } from 'vitest';
import { ItemDefs } from '../../client/src/game/inventory/ItemDefs.js';
import engine from '../../client/src/game/GameEngine.js';
import { LootGenerator } from '../../client/src/game/map/LootGenerator.js';
import { GameSaveSystem } from '../../client/src/game/GameSaveSystem.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { NOMAD_SURVIVOR_CHAPTERS } from '../../client/src/game/phone/NomadSurvivorChapters.js';

describe('Nomad Survivor Books & Recipes', () => {
  it('has noLoot: true set on all nomad survivor volumes in ItemDefs', () => {
    for (let i = 2; i <= 9; i++) {
      const defId = `book.nomad_survivor_${i}`;
      expect(ItemDefs[defId]).toBeDefined();
      expect(ItemDefs[defId].noLoot).toBe(true);
    }
  });

  it('excludes nomad survivor books from LootGenerator item catalog', () => {
    const lg = new LootGenerator();
    lg.initItemKeys();
    expect(lg.itemKeys).toBeDefined();
    for (let i = 2; i <= 9; i++) {
      const defId = `book.nomad_survivor_${i}`;
      expect(lg.itemKeys).not.toContain(defId);
    }
  });

  it('starts a fresh game with every e-book chapter unread (recipes locked)', () => {
    engine.reset();
    expect(engine.bookStats).toBeDefined();
    for (const chapter of NOMAD_SURVIVOR_CHAPTERS) {
      expect(engine.bookStats[chapter.id]).toBeDefined();
      expect(engine.bookStats[chapter.id].pagesLeft).toBe(chapter.pages);
    }
  });
  it('keeps chapter progress exactly as saved, and adds missing chapters as unread', async () => {
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
        // Saved while every recipe was free: stays learned.
        'book.nomad_survivor_2': { pagesLeft: 0, milestonesReached: 0 },
        // Part-read: stays part-read.
        'book.nomad_survivor_3': { pagesLeft: 7, milestonesReached: 0 }
      }
    };

    await GameSaveSystem.loadGameState(mockSaveData);

    expect(engine.bookStats['book.life_in_motion'].pagesLeft).toBe(400);
    expect(engine.bookStats['book.nomad_survivor_2'].pagesLeft).toBe(0);
    expect(engine.bookStats['book.nomad_survivor_3'].pagesLeft).toBe(7);

    // Chapters the save never mentioned come in unread.
    for (const chapter of NOMAD_SURVIVOR_CHAPTERS.slice(2)) {
      expect(engine.bookStats[chapter.id]).toBeDefined();
      expect(engine.bookStats[chapter.id].pagesLeft).toBe(chapter.pages);
    }

    delete globalThis.gameEngine;
  });
});
