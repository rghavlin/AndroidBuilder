import engine from '../GameEngine.js';
import { EntityFactory } from '../EntityFactory.js';
import eventRunner from './EventRunner.js';
import Logger from '../utils/Logger.js';

const log = Logger.scope('IntroEncounter');

/**
 * New-game intro: an infected survivor appears on the tile directly above the
 * player, trades a few speech-bubble lines (the brainstem cure, the fort at the
 * centre of town, earbucks), then vanishes.
 *
 * Built in code rather than authored on a map because the first real map is
 * procedurally generated — there is no map file to put the event in. It runs
 * through the shared EventRunner like any authored event, so the bubbles, the
 * click-to-continue catcher and the turn pause all come for free; the last step
 * (despawnEntity) removes the NPC.
 *
 * Called by GameContext when a real new game becomes ready, and when the
 * student walks out of the start-menu tutorial into a real game.
 */

export const INTRO_EVENT_ID = 'intro_infected_survivor';
export const INTRO_NPC_TAG = 'intro_infected_survivor';
const NPC_SPEAKER = 'Infected Survivor';

// [who, line] — 'npc' or 'player'.
const SCRIPT = [
  ['npc', "Stay back! I'm infected!"],
  ['player', "I didn't know zombies could talk. Or that they gave warnings."],
  ['npc', 'Yeah. Well. I ate one of their brainstems. Cut it out with a knife then crushed it with a stone. Then ate it. Disgusting! But it keeps me from turning.'],
  ['player', "Oh. You're talking about that final CDC message. That actually works?"],
  ['npc', 'Lucky for me, yes!'],
  ['player', 'Is there anybody else alive in this town?'],
  ['npc', "There's a group holed up at the center of town. They won't let you into their little fort, but if you kill zombies they'll give you supplies. You just have to trade the ears of the zombies you kill."],
  ['player', 'Ears?'],
  ['npc', "It's easy to pull the ear off of a zombie. So long as you kill it first. Right ears only. They call them earbucks."],
  ['player', 'Earbucks?'],
  ['npc', "Earbucks. Now if you'll excuse me, I'm getting the hell out of here."],
];

// Directly above first; if that tile is blocked (wall, map edge, occupied),
// the nearest other neighbour so the conversation still happens.
const SPAWN_OFFSETS = [
  [0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1],
];

function findSpawnTile(gameMap, px, py, probe) {
  for (const [dx, dy] of SPAWN_OFFSETS) {
    const x = px + dx, y = py + dy;
    if (x < 0 || y < 0 || x >= gameMap.width || y >= gameMap.height) continue;
    const tile = gameMap.getTile(x, y);
    if (tile && tile.isWalkable(probe)) return { x, y };
  }
  return null;
}

/** The intro as a GameEvent, anchored to the two speakers' tiles. Exported for tests. */
export function buildIntroEvent(npcPos, playerPos, playerName) {
  const steps = SCRIPT.map(([who, text]) => {
    const pos = who === 'npc' ? npcPos : playerPos;
    return {
      type: 'speech',
      speaker: who === 'npc' ? NPC_SPEAKER : (playerName || 'You'),
      text,
      anchorX: pos.x,
      anchorY: pos.y,
    };
  });
  steps.push({ type: 'despawnEntity', entityTag: INTRO_NPC_TAG });
  return { id: INTRO_EVENT_ID, trigger: 'auto', repeat: 'everyTime', steps };
}

let cancelDeferred = null;

/**
 * Spawn the survivor and start the conversation. If another event is already
 * running (e.g. a map's onMapEnter setup), waits for it to finish first.
 * @returns {boolean} true if the encounter started (or was queued)
 */
export function startIntroEncounter() {
  if (cancelDeferred) { cancelDeferred(); cancelDeferred = null; }
  const gameMap = engine.gameMap;
  if (!gameMap || !engine.player) return false;

  if (eventRunner.isRunning()) {
    let timer = null;
    const off = engine.subscribe(() => {
      if (eventRunner.isRunning() || timer) return;
      // Defer out of the emit so we never start a run mid-notify.
      timer = setTimeout(() => {
        timer = null;
        if (eventRunner.isRunning()) return;
        cleanup();
        if (engine.gameMap === gameMap) spawnAndRun();
      }, 0);
    });
    const cleanup = () => { off(); if (timer) clearTimeout(timer); cancelDeferred = null; };
    cancelDeferred = cleanup;
    return true;
  }
  return spawnAndRun();
}

function spawnAndRun() {
  const gameMap = engine.gameMap;
  const player = engine.player;
  if (!gameMap || !player) return false;

  const px = player.logicalX ?? player.x;
  const py = player.logicalY ?? player.y;

  const spot = findSpawnTile(gameMap, px, py, { type: 'npc' });
  if (!spot) {
    log.warn('No free tile next to the player — skipping the intro encounter');
    return false;
  }

  const npc = EntityFactory.createNPC(spot.x, spot.y, 'independent', 'survivor', NPC_SPEAKER, `${INTRO_NPC_TAG}_${Date.now()}`);
  npc.registryTag = INTRO_NPC_TAG;
  npc.aiDisabled = true; // stands still and talks; never wanders, flees or extorts
  if (!gameMap.addEntity(npc, spot.x, spot.y)) {
    log.warn(`Could not place the intro NPC at (${spot.x}, ${spot.y})`);
    return false;
  }

  eventRunner.runEvent(buildIntroEvent(spot, { x: px, y: py }, player.name));
  return true;
}
