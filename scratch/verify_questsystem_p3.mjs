import eventRunner from '../client/src/game/quest/EventRunner.js';
import engine from '../client/src/game/GameEngine.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`FAIL: ${msg}`); }
  else console.log(`ok: ${msg}`);
}

// --- Mock gameMap: record every addItemsToTile call so we can assert ORDER. ---
const placedLog = [];
engine.gameMap = {
  metadata: {},
  addItemsToTile: (x, y, items) => { placedLog.push({ x, y, items }); },
};
engine.inventoryManager = null; // applyItemGrants tolerates a null inventoryManager

function setEvents(events) { engine.gameMap.metadata.events = events; }

// ══════════════════════════════════════════════════════════════════════════
// The bug this phase fixes: a `give` step must fire at its OWN position in
// the step sequence, not all-at-once when the event starts.
// ══════════════════════════════════════════════════════════════════════════
eventRunner.reset();
setEvents([
  {
    id: 'eventTest1', placement: { kind: 'tile', x: 9, y: 10 }, trigger: 'onEnter',
    preconditions: [], repeat: 'once',
    steps: [
      { type: 'speech', anchorX: 9, anchorY: 10, speaker: 'doc', text: 'doc line 1' },
      { type: 'speech', anchorX: 9, anchorY: 11, speaker: 'player', text: 'player line 1' },
      { type: 'give', defId: 'weapon.knife', count: 1, x: 9, y: 11 },
    ],
  },
]);

eventRunner.checkAndFireAt(9, 10);
assert(eventRunner.isRunning(), 'event starts running on tile match');
assert(engine.turnPhase === 'PAUSED_FOR_EVENT', 'turnPhase pauses while running');
assert(placedLog.length === 0, 'give step has NOT fired yet — still on step 0 (speech)');
let step = eventRunner.getActiveSpeechStep();
assert(step && step.text === 'doc line 1', 'step 0 is the first speech line');

eventRunner.advance(); // -> step 1 (speech)
assert(placedLog.length === 0, 'give step still has not fired after advancing to step 1');
step = eventRunner.getActiveSpeechStep();
assert(step && step.text === 'player line 1', 'step 1 is the second speech line');

eventRunner.advance(); // -> step 2 (give): should fire immediately (non-blocking) and end the run
assert(placedLog.length === 1, 'give step fired exactly once, only after both speech steps');
assert(placedLog[0].x === 9 && placedLog[0].y === 11 && placedLog[0].items[0].defId === 'weapon.knife', 'knife dropped at its own tile (9,11)');
assert(!eventRunner.isRunning(), 'run ended after the final (give) step');
assert(engine.turnPhase === 'PLAYER_TURN', 'turnPhase resumes after run ends');

// --- oneShot (repeat:'once') prevents re-firing; re-checking the same tile is a no-op ---
placedLog.length = 0;
eventRunner.checkAndFireAt(9, 10);
assert(!eventRunner.isRunning(), 'a repeat:"once" event does not re-fire after it already ran');

// --- repeat:'everyTime' fires again ---
eventRunner.reset();
setEvents([
  { id: 'everytime_ev', placement: { kind: 'tile', x: 5, y: 5 }, trigger: 'onEnter', preconditions: [], repeat: 'everyTime',
    steps: [{ type: 'dialog', speaker: 'npc', text: 'hi again' }] },
]);
eventRunner.checkAndFireAt(5, 5);
assert(eventRunner.isRunning(), 'everyTime event fires the first time');
eventRunner.advance();
assert(!eventRunner.isRunning(), 'everyTime event run completes');
eventRunner.checkAndFireAt(5, 5);
assert(eventRunner.isRunning(), 'everyTime event fires again on a second visit');
eventRunner.advance();

// --- proximity placement ---
eventRunner.reset();
setEvents([
  { id: 'prox_ev', placement: { kind: 'proximity', x: 20, y: 20, radius: 3 }, trigger: 'onEnter', preconditions: [], repeat: 'once',
    steps: [{ type: 'dialog', speaker: '', text: 'static...' }] },
]);
eventRunner.checkAndFireAt(21, 21); // within radius 3 (dist^2 = 2)
assert(eventRunner.isRunning(), 'proximity event fires within radius');
eventRunner.cancel();

eventRunner.reset();
setEvents([
  { id: 'prox_ev2', placement: { kind: 'proximity', x: 20, y: 20, radius: 1 }, trigger: 'onEnter', preconditions: [], repeat: 'once',
    steps: [{ type: 'dialog', speaker: '', text: 'static...' }] },
]);
eventRunner.checkAndFireAt(25, 25); // far outside radius
assert(!eventRunner.isRunning(), 'proximity event does not fire outside radius');

// --- chain step transfers control to the target event ---
eventRunner.reset();
setEvents([
  { id: 'chain_a', placement: { kind: 'tile', x: 1, y: 1 }, trigger: 'onEnter', preconditions: [], repeat: 'once',
    steps: [{ type: 'dialog', speaker: '', text: 'part one' }, { type: 'chain', eventId: 'chain_b' }] },
  { id: 'chain_b', placement: { kind: 'chainOnly' }, trigger: 'onEnter', preconditions: [], repeat: 'once',
    steps: [{ type: 'dialog', speaker: '', text: 'part two' }] },
]);
eventRunner.checkAndFireAt(1, 1);
assert(eventRunner.getActiveEventId() === 'chain_a', 'chain_a is running first');
eventRunner.advance(); // past dialog -> chain step -> should transfer to chain_b
assert(eventRunner.getActiveEventId() === 'chain_b', 'chain step transferred control to chain_b');
assert(eventRunner.getActiveDialogStep()?.text === 'part two', 'chain_b\'s dialog step is now active');
eventRunner.advance();
assert(!eventRunner.isRunning(), 'run ends after the chained event completes');

// --- setFlag / setVar steps mutate questState ---
eventRunner.reset();
engine.questState.reset();
setEvents([
  { id: 'flag_ev', placement: { kind: 'tile', x: 7, y: 7 }, trigger: 'onEnter', preconditions: [], repeat: 'once',
    steps: [
      { type: 'setFlag', flag: 'met_doc', value: true },
      { type: 'setVar', var: 'reputation', op: 'add', varValue: 5 },
      { type: 'setVar', var: 'reputation', op: 'add', varValue: 3 },
    ] },
]);
eventRunner.checkAndFireAt(7, 7);
assert(!eventRunner.isRunning(), 'an all-non-blocking-steps event resolves synchronously');
assert(engine.questState.getFlag('met_doc') === true, 'setFlag step set the flag');
assert(engine.questState.getVar('reputation') === 8, 'two setVar(add) steps accumulate (5+3=8)');

// --- lockMovement / unlockMovement set the engine flag (enforcement is Phase 4) ---
eventRunner.reset();
setEvents([
  { id: 'lock_ev', placement: { kind: 'tile', x: 3, y: 3 }, trigger: 'onEnter', preconditions: [], repeat: 'once',
    steps: [{ type: 'lockMovement', until: [] }] },
]);
eventRunner.checkAndFireAt(3, 3);
assert(engine.movementLocked === true, 'lockMovement step sets engine.movementLocked');

eventRunner.reset();
setEvents([
  { id: 'unlock_ev', placement: { kind: 'tile', x: 4, y: 4 }, trigger: 'onEnter', preconditions: [], repeat: 'once',
    steps: [{ type: 'unlockMovement' }] },
]);
eventRunner.checkAndFireAt(4, 4);
assert(engine.movementLocked === false, 'unlockMovement step clears engine.movementLocked');

// --- wait step (async) ---
eventRunner.reset();
setEvents([
  { id: 'wait_ev', placement: { kind: 'tile', x: 8, y: 8 }, trigger: 'onEnter', preconditions: [], repeat: 'once',
    steps: [{ type: 'wait', ms: 30 }, { type: 'dialog', speaker: '', text: 'after wait' }] },
]);
eventRunner.checkAndFireAt(8, 8);
assert(eventRunner.isRunning() && !eventRunner.getActiveDialogStep(), 'wait step is pending, dialog not yet shown');
await new Promise(r => setTimeout(r, 60));
assert(eventRunner.getActiveDialogStep()?.text === 'after wait', 'dialog step is active after the wait elapses');
eventRunner.advance();
assert(!eventRunner.isRunning(), 'run ends after the post-wait dialog is dismissed');

// ══════════════════════════════════════════════════════════════════════════
// The placeable.help "rewatch video" item must replay ONLY the dialog steps
// of the event at the player's tile, not the whole event (GameContext.jsx's
// fireDialogAtPlayerTile filters event.steps to type==='dialog' before
// calling runEvent — simulate that exact filtering here).
// ══════════════════════════════════════════════════════════════════════════
eventRunner.reset();
placedLog.length = 0;
const mixedEvent = {
  id: 'help_replay_ev', placement: { kind: 'tile', x: 12, y: 12 }, trigger: 'onEnter',
  preconditions: [], repeat: 'once',
  steps: [
    { type: 'dialog', speaker: 'doc', text: 'watch this video', video: 'movement.webm' },
    { type: 'speech', anchorX: 12, anchorY: 12, speaker: 'doc', text: 'a line the player already saw' },
    { type: 'give', defId: 'weapon.knife', count: 1, x: 12, y: 13 },
  ],
};
setEvents([mixedEvent]);
eventRunner.checkAndFireAt(12, 12);
eventRunner.advance(); // past dialog -> speech (still blocking)
eventRunner.advance(); // past speech -> give (fires immediately) -> end
assert(!eventRunner.isRunning() && placedLog.length === 1, 'sanity: real playthrough runs all 3 steps once');

placedLog.length = 0;
const dialogOnlySteps = mixedEvent.steps.filter(s => s.type === 'dialog');
eventRunner.runEvent({ ...mixedEvent, steps: dialogOnlySteps }, { ignoreOnce: true });
assert(eventRunner.getActiveDialogStep()?.video === 'movement.webm', 'help-item replay shows the dialog/video step');
eventRunner.advance();
assert(!eventRunner.isRunning(), 'help-item replay run ends after the single dialog step');
assert(placedLog.length === 0, 'help-item replay does NOT re-fire the give step');
assert(eventRunner.getActiveSpeechStep() === null, 'help-item replay never shows the speech step');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
