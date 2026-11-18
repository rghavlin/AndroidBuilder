import { CraftingRecipes } from '../inventory/CraftingRecipes.js';
import { ItemDefs } from '../inventory/ItemDefs.js';
import { consumePhoneChargeOncePerTurn } from '../remote/DronePower.js';
import { phoneBlockedReason } from './Phone.js';
import { NOMAD_SURVIVOR_CHAPTERS, getNomadChapter, ensureChapterStats } from './NomadSurvivorChapters.js';

export { freshChapterStats, ensureChapterStats } from './NomadSurvivorChapters.js';

/**
 * Reading the Nomad Survivor e-book on the phone, in the engine rather than in
 * a React context so the headless harness runs the same code the game does.
 *
 * Progress lives in engine.bookStats[chapter.id].pagesLeft — the same record
 * the crafting gate (CraftingManager.checkRequirements / craft, CraftingUI)
 * already reads through each recipe's `requiredBook`. A chapter at 0 pages left
 * is learned; that is the whole unlock mechanism.
 *
 * Cost of reading: 1 AP per page, plus the phone being in use. Reading spends
 * the turn's phone charge through the same once-per-turn stamp as every other
 * phone action, so a turn spent reading costs one charge however many pages
 * are read, and reading on the turn the phone was switched on costs nothing
 * extra.
 *
 * Returns what happened instead of logging it: the caller owns the log and the
 * sounds, matching PhoneTurn and AutoWagonOrders.
 */

/** AP spent per page read. */
export const AP_PER_PAGE = 1;

/**
 * Where the player is in one chapter.
 * @returns {{pages:number, pagesLeft:number, pagesRead:number, finished:boolean}}
 */
export function chapterProgress(engine, chapterId) {
  const chapter = getNomadChapter(chapterId);
  const pages = chapter?.pages ?? 0;
  const raw = engine?.bookStats?.[chapterId]?.pagesLeft;
  // Missing progress reads as unread, which is also how the crafting gate
  // treats it (no stats → locked).
  const pagesLeft = Math.max(0, Math.min(pages, raw ?? pages));
  return { pages, pagesLeft, pagesRead: pages - pagesLeft, finished: pagesLeft === 0 };
}

/** The recipes a chapter teaches (chapter 9 teaches two). */
export function chapterRecipes(chapterId) {
  return CraftingRecipes.filter(r => r.requiredBook === chapterId);
}

/** How many chapters the player has finished. */
export function chaptersFinished(engine) {
  return NOMAD_SURVIVOR_CHAPTERS.filter(c => chapterProgress(engine, c.id).finished).length;
}

/** Display text for one recipe requirement entry (ingredient or tool). */
function requirementLabel(req) {
  if (req.label) return req.label;
  if (req.id) return ItemDefs[req.id]?.name || req.id;
  if (req.either) return req.either.map(id => ItemDefs[id]?.name || id).join(' or ');
  if (req.category) return `Any ${req.category}`;
  return 'Unknown';
}

/**
 * A finished chapter's build sheet, built from the recipe itself so the
 * e-book never disagrees with the crafting menu.
 * @returns {Array<{name:string, tools:string[], materials:string[]}>}
 */
export function chapterBuildSheets(chapterId) {
  return chapterRecipes(chapterId).map(recipe => ({
    name: recipe.name,
    tools: (recipe.tools || []).map(requirementLabel),
    materials: (recipe.ingredients || []).map(req => {
      const count = req.count ?? 1;
      return count > 1 ? `${count} × ${requirementLabel(req)}` : requirementLabel(req);
    })
  }));
}

/**
 * How many pages a request to read would actually cover right now: never more
 * than the chapter has left, nor more than the player has AP for.
 */
export function pagesReadable(engine, chapterId, amount) {
  const { pagesLeft } = chapterProgress(engine, chapterId);
  const affordable = Math.floor((engine?.player?.ap || 0) / AP_PER_PAGE);
  const wanted = amount === 'max' ? Infinity : Math.max(0, Math.floor(amount) || 0);
  return Math.max(0, Math.min(wanted, pagesLeft, affordable));
}

/**
 * Read up to `amount` pages ('max' = as many as AP allows) of one chapter.
 *
 * @param {GameEngine} engine
 * @param {string} chapterId
 * @param {number|'max'} amount
 * @returns {{success:boolean, reason?:string, pagesRead?:number, finished?:boolean, learned?:string[]}}
 */
export function readChapter(engine, chapterId, amount = 1) {
  const chapter = getNomadChapter(chapterId);
  if (!engine?.player || !chapter) return { success: false, reason: 'Nothing to read.' };

  if (engine.isAutosaving || engine.turnPhase !== 'PLAYER_TURN') {
    return { success: false, reason: 'Not your turn.' };
  }

  const blocked = phoneBlockedReason(engine);
  if (blocked) return { success: false, reason: blocked };

  const progress = chapterProgress(engine, chapterId);
  if (progress.finished) {
    return { success: false, reason: 'You have already finished this chapter.' };
  }

  const pages = pagesReadable(engine, chapterId, amount);
  if (pages <= 0) return { success: false, reason: 'Not enough AP to read.' };

  if (!consumePhoneChargeOncePerTurn(engine)) {
    return { success: false, reason: 'The phone battery is dead.' };
  }

  engine.player.useAP(pages * AP_PER_PAGE);
  ensureChapterStats(engine);
  const stats = engine.bookStats[chapterId];
  stats.pagesLeft = progress.pagesLeft - pages;

  const finished = stats.pagesLeft === 0;
  return {
    success: true,
    pagesRead: pages,
    finished,
    learned: finished ? chapterRecipes(chapterId).map(r => r.name) : []
  };
}
