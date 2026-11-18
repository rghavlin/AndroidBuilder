// The Nomad Survivor e-book on the phone: reading a chapter to 0 pages left is
// what unlocks its recipe, so these tests pin the cost of reading (AP, the
// turn's phone charge), the refusals, and the hand-off to the crafting gate.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import engine from '../../client/src/game/GameEngine.js';
import { ensurePhone, setPhonePower, phoneCharges } from '../../client/src/game/phone/Phone.js';
import { NOMAD_SURVIVOR_CHAPTERS, getNomadChapter } from '../../client/src/game/phone/NomadSurvivorChapters.js';
import {
  readChapter,
  chapterProgress,
  chapterRecipes,
  chapterBuildSheets,
  pagesReadable
} from '../../client/src/game/phone/NomadSurvivorEbook.js';
import { CraftingRecipes } from '../../client/src/game/inventory/CraftingRecipes.js';
import { CraftingManager } from '../../client/src/game/inventory/CraftingManager.js';

const RENDERABLE_TYPES = new Set(['text', 'heading', 'steps', 'bullets', 'note']);
const PLANTER = 'book.nomad_survivor_2';    // 15 pages
const REMOTE = 'book.nomad_survivor_9';     // teaches two recipes

describe('Nomad Survivor chapters (data)', () => {
  it('gives every book-gated recipe a chapter, and every chapter a recipe', () => {
    const chapterIds = new Set(NOMAD_SURVIVOR_CHAPTERS.map(c => c.id));
    for (const recipe of CraftingRecipes.filter(r => r.requiredBook)) {
      expect(chapterIds.has(recipe.requiredBook), `${recipe.id} → ${recipe.requiredBook}`).toBe(true);
    }
    for (const chapter of NOMAD_SURVIVOR_CHAPTERS) {
      expect(chapterRecipes(chapter.id).length, chapter.id).toBeGreaterThan(0);
    }
  });

  it('numbers chapters 1..n with positive page counts and renderable bodies', () => {
    NOMAD_SURVIVOR_CHAPTERS.forEach((chapter, i) => {
      expect(chapter.number).toBe(i + 1);
      expect(chapter.title).toBeTruthy();
      expect(chapter.pages).toBeGreaterThan(0);
      expect(chapter.body.length).toBeGreaterThan(0);
      for (const block of chapter.body) {
        expect(RENDERABLE_TYPES.has(block.type), `${chapter.id} block ${block.type}`).toBe(true);
        if (block.type === 'steps' || block.type === 'bullets') {
          expect(block.items.length).toBeGreaterThan(0);
        } else {
          expect(block.text).toBeTruthy();
        }
      }
    });
  });

  it('builds a sheet per taught recipe, naming real items', () => {
    const sheets = chapterBuildSheets(REMOTE);
    expect(sheets.map(s => s.name)).toEqual(['RC Receiver', 'Autonomous Controller']);
    for (const sheet of sheets) {
      expect(sheet.materials.length).toBeGreaterThan(0);
      for (const m of sheet.materials) expect(m).not.toMatch(/\./); // a defId leaked through
    }
  });
});

describe('Nomad Survivor reading on the phone', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    globalThis.gameEngine = engine;
    ensurePhone(engine.inventoryManager);
    engine.turnPhase = 'PLAYER_TURN';
    engine.player.ap = 30;
  });

  afterEach(() => {
    delete globalThis.gameEngine;
  });

  it('starts every chapter unread', () => {
    for (const chapter of NOMAD_SURVIVOR_CHAPTERS) {
      expect(chapterProgress(engine, chapter.id).pagesRead).toBe(0);
    }
  });

  it('refuses while the phone is off, spending nothing', () => {
    const result = readChapter(engine, PLANTER, 5);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/turn your phone on/i);
    expect(engine.player.ap).toBe(30);
    expect(chapterProgress(engine, PLANTER).pagesRead).toBe(0);
  });

  it('refuses outside the player turn', () => {
    setPhonePower(engine, true);
    engine.turnPhase = 'SIMULATING';
    expect(readChapter(engine, PLANTER, 1).success).toBe(false);
  });

  it('costs 1 AP per page and one phone charge per turn, however much is read', () => {
    setPhonePower(engine, true);           // switching on pays this turn's charge
    const afterPowerOn = phoneCharges(engine);

    expect(readChapter(engine, PLANTER, 5)).toMatchObject({ success: true, pagesRead: 5, finished: false });
    expect(readChapter(engine, PLANTER, 3)).toMatchObject({ success: true, pagesRead: 3 });
    expect(engine.player.ap).toBe(22);
    expect(chapterProgress(engine, PLANTER).pagesLeft).toBe(7);
    expect(phoneCharges(engine)).toBe(afterPowerOn); // same turn: already paid

    harness.turn += 1;
    readChapter(engine, PLANTER, 1);
    expect(phoneCharges(engine)).toBe(afterPowerOn - 1); // new turn: one more
  });

  it("'max' reads as far as AP allows, never past the chapter's end", () => {
    setPhonePower(engine, true);
    engine.player.ap = 4;
    expect(readChapter(engine, PLANTER, 'max').pagesRead).toBe(4);

    engine.player.ap = 100;
    expect(pagesReadable(engine, PLANTER, 'max')).toBe(11);
    expect(readChapter(engine, PLANTER, 'max')).toMatchObject({ pagesRead: 11, finished: true, learned: ['Planter box'] });
  });

  it('refuses with no AP, and once the chapter is finished', () => {
    setPhonePower(engine, true);
    engine.player.ap = 0;
    expect(readChapter(engine, PLANTER, 1).reason).toMatch(/AP/);

    engine.player.ap = 100;
    readChapter(engine, PLANTER, 'max');
    const again = readChapter(engine, PLANTER, 1);
    expect(again.success).toBe(false);
    expect(again.reason).toMatch(/already finished/i);
  });

  it('unlocks the recipe in the crafting gate when the chapter is finished', () => {
    const cm = new CraftingManager(engine.inventoryManager);
    expect(cm.checkRequirements('crafting.planter_box').missing).toContain('Recipe Locked');

    setPhonePower(engine, true);
    engine.player.ap = 100;
    readChapter(engine, PLANTER, 'max');

    expect(cm.checkRequirements('crafting.planter_box').missing).not.toContain('Recipe Locked');
  });

  it('chapter 9 teaches both remote-control recipes at once', () => {
    setPhonePower(engine, true);
    engine.player.ap = getNomadChapter(REMOTE).pages;
    const result = readChapter(engine, REMOTE, 'max');
    expect(result.finished).toBe(true);
    expect(result.learned).toEqual(['RC Receiver', 'Autonomous Controller']);
  });
});
