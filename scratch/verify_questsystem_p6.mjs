import eventRunner from '../client/src/game/quest/EventRunner.js';
import engine from '../client/src/game/GameEngine.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`FAIL: ${msg}`); }
  else console.log(`ok: ${msg}`);
}

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

const fakeInv = new FakeInventoryManager();
engine.inventoryManager = fakeInv;
engine.questState.reset();
eventRunner.reset(); // re-subscribes to fakeInv

// Setup mock quest definitions in gameMap metadata
engine.gameMap = {
  metadata: {
    questRegistry: {
      quests: [
        {
          id: 'test_quest',
          title: 'Test Quest Title',
          description: 'A mock quest description',
          tasks: [
            { id: 'task1', text: 'Equip the key', complete: [{ kind: 'itemEquipped', defId: 'key' }] },
            { id: 'task2', text: 'Set the flag', complete: [{ kind: 'flag', flag: 'my_flag', value: true }] }
          ]
        }
      ]
    }
  },
  addItemsToTile: () => {}
};

// 1. Manually start quest and verify active state
engine.questState.reset();
assert(Object.keys(engine.questState.activeQuests).length === 0, 'No quests active initially');
engine.questState.startQuest('test_quest');
assert(engine.questState.activeQuests['test_quest'] !== undefined, 'test_quest is active');
assert(engine.questState.activeQuests['test_quest'].currentTaskIndex === 0, 'starts at task index 0');

// 2. Check task 1 progression by fulfilling condition (equip key)
eventRunner._onExternalChange(); // should not advance yet since key is not equipped
assert(engine.questState.activeQuests['test_quest'].currentTaskIndex === 0, 'still at task index 0');

fakeInv.equip('key'); // emits inventoryChanged -> EventRunner._onExternalChange -> checkQuestProgression
assert(engine.questState.activeQuests['test_quest'].currentTaskIndex === 1, 'advanced to task index 1 after equipping key');

// 3. Check task 2 progression (set flag)
engine.questState.setFlag('my_flag', true); // emits questStateChanged -> EventRunner._onExternalChange -> checkQuestProgression
assert(engine.questState.activeQuests['test_quest'] === undefined, 'test_quest is complete and deleted from activeQuests');
assert(engine.questState.completedQuests.includes('test_quest'), 'test_quest is in completedQuests');

// 4. Verify startQuest Event Step type
fakeInv.unequip('key');
engine.questState.reset();
eventRunner.reset();
engine.gameMap.metadata.events = [
  {
    id: 'trigger_quest',
    placement: { kind: 'chainOnly' },
    trigger: 'auto',
    repeat: 'once',
    preconditions: [],
    steps: [
      { type: 'startQuest', questId: 'test_quest' }
    ]
  }
];

eventRunner.checkAutoEvents();
assert(eventRunner.isRunning() === false, 'auto event runs step and completes immediately');
assert(engine.questState.activeQuests['test_quest'] !== undefined, 'test_quest was successfully started by the event step');
assert(engine.questState.activeQuests['test_quest'].currentTaskIndex === 0, 'starts at task index 0');

// 4b. Verify setQuestTask Event Step type
engine.gameMap.metadata.events = [
  {
    id: 'advance_quest',
    placement: { kind: 'chainOnly' },
    trigger: 'auto',
    repeat: 'once',
    preconditions: [],
    steps: [
      { type: 'setQuestTask', questId: 'test_quest', taskIndex: 1 }
    ]
  }
];
eventRunner.reset();
eventRunner.checkAutoEvents();
assert(engine.questState.activeQuests['test_quest'].currentTaskIndex === 1, 'setQuestTask step successfully set current task index to 1');

// 5. Verify JSON Serialization / Deserialization
const savedData = engine.questState.toJSON();
assert(savedData.activeQuests['test_quest'] !== undefined, 'activeQuests serialized');
assert(savedData.completedQuests.length === 0, 'completedQuests serialized');

const newQuestState = new (engine.questState.constructor)();
newQuestState.fromJSON(savedData);
assert(newQuestState.activeQuests['test_quest'] !== undefined, 'activeQuests deserialized');
assert(newQuestState.activeQuests['test_quest'].currentTaskIndex === 1, 'task index restored');

console.log(`\n--- Verification completed with ${failures} failures ---`);
if (failures > 0) {
  process.exit(1);
} else {
  console.log('--- ALL CHECKS PASSED SUCCESSFULLY ---');
  process.exit(0);
}
