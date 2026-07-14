import eventRunner from '../client/src/game/quest/EventRunner.js';
import engine from '../client/src/game/GameEngine.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`FAIL: ${msg}`); }
  else console.log(`ok: ${msg}`);
}

// --- Fake inventoryManager the tests can flip equipped/count on demand. ---
class FakeInventoryManager {
  constructor() {
    this.equipped = new Set();
    this.counts = {};
    this._listeners = new Set();
  }
  isItemEquipped(defId) { return this.equipped.has(defId); }
  hasItemByDefId(defId, count) { return (this.counts[defId] || 0) >= count; }
  on(ev, fn) { this._listeners.add(fn); }
  off(ev, fn) { this._listeners.delete(fn); }
  emitChange() { for (const fn of this._listeners) fn(); }
  equip(defId) { this.equipped.add(defId); this.emitChange(); }
  unequip(defId) { this.equipped.delete(defId); this.emitChange(); }
}

engine.gameMap = { metadata: {}, addItemsToTile: () => {} };
const fakeInv = new FakeInventoryManager();
engine.inventoryManager = fakeInv;
engine.questState.reset();
eventRunner.reset(); // re-subscribes to the fake inventoryManager + questState above

function setEvents(events) { engine.gameMap.metadata.events = events; }

// ══════════════════════════════════════════════════════════════════════════
// Preconditions gate onEnter firing
// ══════════════════════════════════════════════════════════════════════════
eventRunner.reset();
setEvents([
  { id: 'gated_onenter', placement: { kind: 'tile', x: 5, y: 5 }, trigger: 'onEnter', repeat: 'once',
    preconditions: [{ kind: 'itemEquipped', defId: 'key' }],
    steps: [{ type: 'dialog', speaker: '', text: 'door creaks open' }] },
]);
eventRunner.checkAndFireAt(5, 5);
assert(!eventRunner.isRunning(), 'onEnter event does NOT fire while its precondition is unmet');

fakeInv.equip('key');
eventRunner.checkAndFireAt(5, 5);
assert(eventRunner.isRunning(), 'onEnter event fires once its precondition is met');
eventRunner.advance();
assert(!eventRunner.isRunning(), 'run completes normally');

// ══════════════════════════════════════════════════════════════════════════
// auto trigger: fires purely from preconditions, no player position
// ══════════════════════════════════════════════════════════════════════════
eventRunner.reset();
fakeInv.equipped.clear();
setEvents([
  { id: 'auto_ev', placement: { kind: 'chainOnly' }, trigger: 'auto', repeat: 'once',
    preconditions: [{ kind: 'itemEquipped', defId: 'radio' }],
    steps: [{ type: 'dialog', speaker: '', text: 'radio crackles to life' }] },
]);
eventRunner.checkAutoEvents();
assert(!eventRunner.isRunning(), 'auto event does not fire before its precondition is met');

fakeInv.equip('radio'); // emits inventoryChanged -> EventRunner._onExternalChange -> checkAutoEvents()
assert(eventRunner.isRunning(), 'auto event fires reactively the moment its precondition becomes true (no player move needed)');
eventRunner.advance();
assert(!eventRunner.isRunning(), 'auto event run completes');

// repeat:'once' — re-emitting the same change must not re-fire it.
fakeInv.emitChange();
assert(!eventRunner.isRunning(), 'auto event with repeat:"once" does not re-fire after already firing');

// ══════════════════════════════════════════════════════════════════════════
// endWhen permanently resolves an event, independent of repeat mode
// ══════════════════════════════════════════════════════════════════════════
eventRunner.reset();
fakeInv.equipped.clear();
setEvents([
  { id: 'endwhen_ev', placement: { kind: 'chainOnly' }, trigger: 'auto', repeat: 'everyTime',
    preconditions: [],
    endWhen: [{ kind: 'flag', flag: 'quest_done', value: true }],
    steps: [{ type: 'dialog', speaker: '', text: 'still waiting...' }] },
]);
eventRunner.checkAutoEvents();
assert(eventRunner.isRunning(), 'everyTime auto event fires while endWhen has not passed');
eventRunner.advance();
assert(!eventRunner.isRunning(), 'run completes');

engine.questState.setFlag('quest_done', true); // emits questStateChanged -> checkAutoEvents()
assert(!eventRunner.isRunning(), 'event is now permanently resolved by endWhen and does not fire again, despite repeat:"everyTime"');
engine.questState.setFlag('quest_done', true); // re-emit, still should not fire
assert(!eventRunner.isRunning(), 'endWhen resolution persists across further quest-state changes');

// ══════════════════════════════════════════════════════════════════════════
// lockMovement.until auto-clears engine.movementLocked reactively
// ══════════════════════════════════════════════════════════════════════════
eventRunner.reset();
fakeInv.equipped.clear();
setEvents([
  { id: 'lock_ev', placement: { kind: 'tile', x: 9, y: 9 }, trigger: 'onEnter', repeat: 'once',
    preconditions: [],
    steps: [{ type: 'lockMovement', until: [{ kind: 'itemEquipped', defId: 'gate_key' }] }] },
]);
eventRunner.checkAndFireAt(9, 9);
assert(engine.movementLocked === true, 'lockMovement step locks movement');
assert(!eventRunner.isRunning(), 'the lockMovement-only event completes its run immediately (locking is non-blocking)');

fakeInv.emitChange(); // gate_key still not equipped
assert(engine.movementLocked === true, 'movement stays locked while the until condition is still unmet');

fakeInv.equip('gate_key'); // emits inventoryChanged -> recheckLocks()
assert(engine.movementLocked === false, 'movement auto-unlocks the moment the until condition is satisfied');

// unlockMovement step forcibly clears the lock regardless of until conditions.
eventRunner.reset();
fakeInv.equipped.clear();
setEvents([
  { id: 'lock_ev2', placement: { kind: 'tile', x: 2, y: 2 }, trigger: 'onEnter', repeat: 'once', preconditions: [],
    steps: [{ type: 'lockMovement', until: [{ kind: 'itemEquipped', defId: 'never_equipped' }] }] },
  { id: 'unlock_ev2', placement: { kind: 'tile', x: 3, y: 3 }, trigger: 'onEnter', repeat: 'once', preconditions: [],
    steps: [{ type: 'unlockMovement' }] },
]);
eventRunner.checkAndFireAt(2, 2);
assert(engine.movementLocked === true, 'lock_ev2 locks movement with an unmet until condition');
eventRunner.checkAndFireAt(3, 3);
assert(engine.movementLocked === false, 'unlockMovement step force-clears the lock even though until never passed');

// ══════════════════════════════════════════════════════════════════════════
// A run's last step making an auto event newly eligible fires it immediately
// (not just on the next external reactive trigger)
// ══════════════════════════════════════════════════════════════════════════
eventRunner.reset();
fakeInv.equipped.clear();
engine.questState.reset();
setEvents([
  { id: 'setter_ev', placement: { kind: 'tile', x: 6, y: 6 }, trigger: 'onEnter', repeat: 'once', preconditions: [],
    steps: [{ type: 'setFlag', flag: 'unlocked_next', value: true }] },
  { id: 'chained_auto', placement: { kind: 'chainOnly' }, trigger: 'auto', repeat: 'once',
    preconditions: [{ kind: 'flag', flag: 'unlocked_next', value: true }],
    steps: [{ type: 'dialog', speaker: '', text: 'immediately available now' }] },
]);
eventRunner.checkAndFireAt(6, 6); // setter_ev is all non-blocking steps, resolves synchronously, then _endRun() fires
assert(eventRunner.getActiveEventId() === 'chained_auto', 'auto event newly eligible after the prior run ends fires immediately, same tick');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
