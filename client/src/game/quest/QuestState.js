import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';
import { evalAll } from './conditions.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { Item } from '../inventory/Item.js';
import { FactionRegistry } from '../ai/FactionRegistry.js';

/**
 * Apply a loaded map's authored registries in one place so quest-state seeding
 * and faction loading can never drift apart. Called at every map-ready / map-
 * transition point. `questRegistry` carries BOTH the flag/var/quest definitions
 * and the authored faction definitions/stances (see editor eventTypes.ts).
 */
export function applyMapRegistries(questState, gameMap) {
  const registry = gameMap?.metadata?.questRegistry;
  questState?.seedFromRegistry(registry);
  if (registry) {
    FactionRegistry.loadDefinitions({
      factions: registry.factions,
      factionStances: registry.factionStances
    });
  }
}

/**
 * Global flags/variables store — the backbone of event preconditions and quest
 * progress. Lives on the engine (engine.questState), same lifetime as
 * inventoryManager: constructed fresh in GameEngine.reset(), persisted via
 * GameSaveSystem, reset on every new game.
 */
export class QuestState extends SafeEventEmitter {
  constructor() {
    super();
    this.flags = {};
    this.vars = {};
    this.activeQuests = {}; // questId -> { questId, currentTaskIndex }
    this.completedQuests = []; // Array of questId strings
    // defId -> running count of how many the player has consumed (eaten/drunk)
    // over the whole game. Backs the 'itemConsumed' condition — a monotonic
    // tally, not inventory count, so "consumed my last pulp" stays true even
    // once none remain. Recorded by InventoryContext.consumeItem/drinkWater.
    this.consumed = {};
  }

  getFlag(name) {
    return !!this.flags[name];
  }

  setFlag(name, value) {
    this.flags[name] = !!value;
    this.emit('questStateChanged', { kind: 'flag', name });
  }

  getVar(name) {
    return this.vars[name] ?? 0;
  }

  setVar(name, value) {
    this.vars[name] = Number(value) || 0;
    this.emit('questStateChanged', { kind: 'var', name });
  }

  addVar(name, delta) {
    this.setVar(name, this.getVar(name) + (Number(delta) || 0));
  }

  getConsumed(defId) {
    return this.consumed[defId] ?? 0;
  }

  /** Bump the lifetime consumption tally for `defId`. Emits so events/quests re-check. */
  recordConsumed(defId, count = 1) {
    if (!defId) return;
    this.consumed[defId] = (this.consumed[defId] ?? 0) + (Number(count) || 0);
    this.emit('questStateChanged', { kind: 'consumed', defId });
  }

  startQuest(questId) {
    if (!questId) return;
    // If it's already active or completed, do nothing
    if (this.activeQuests[questId] || this.completedQuests.includes(questId)) {
      return;
    }
    this.activeQuests[questId] = {
      questId,
      currentTaskIndex: 0,
    };
    this.emit('questStateChanged', { kind: 'questStarted', questId });
  }

  setQuestTask(questId, taskIndex) {
    if (this.activeQuests[questId]) {
      this.activeQuests[questId].currentTaskIndex = taskIndex;
      this.emit('questStateChanged', { kind: 'questProgress', questId });
    }
  }

  checkQuestProgression(quests, ctx) {
    if (!quests || quests.length === 0) return;

    let updated = false;

    for (const active of Object.values(this.activeQuests)) {
      const def = quests.find(q => q.id === active.questId);
      if (!def) continue;

      // Loop to advance task(s) if conditions are met
      while (active.currentTaskIndex < def.tasks.length) {
        const currentTask = def.tasks[active.currentTaskIndex];
        // A task with no completion conditions is manual-only (advanced via an
        // explicit setQuestTask step) — evalAll([]) is vacuously true, which
        // would otherwise auto-complete it (and cascade through the rest of
        // the quest) the instant it becomes current.
        if (currentTask.complete?.length > 0 && evalAll(currentTask.complete, ctx)) {
          console.log(`[QuestState] Task completed: Quest ${def.title}, Task: ${currentTask.text}`);
          active.currentTaskIndex++;
          updated = true;
        } else {
          break;
        }
      }

      // If all tasks completed, finish the quest
      if (active.currentTaskIndex >= def.tasks.length) {
        console.log(`[QuestState] Quest completed: ${def.title}`);
        delete this.activeQuests[active.questId];
        if (!this.completedQuests.includes(active.questId)) {
          this.completedQuests.push(active.questId);
          this._applyRewards(def, ctx);
        }
        updated = true;
      }
    }

    if (updated) {
      this.emit('questStateChanged', { kind: 'questProgress' });
    }
  }

  /**
   * Run a completed quest's onComplete rewards (see eventTypes.ts QuestReward).
   * Fired exactly once, right after the quest is added to completedQuests.
   * 'give' places items into the player's inventory (falling back to the
   * ground container the same way any other over-capacity addItem() does —
   * there's no map tile to target here, unlike an event's 'give' step).
   */
  _applyRewards(def, ctx) {
    for (const reward of def.onComplete || []) {
      if (!reward) continue;
      switch (reward.type) {
        case 'give':
          if (reward.defId && ctx?.inventoryManager) {
            const count = Math.max(1, Math.floor(reward.count || 1));
            for (let i = 0; i < count; i++) {
              const itemDef = createItemFromDef(reward.defId);
              if (itemDef) ctx.inventoryManager.addItem(new Item(itemDef));
              else console.warn(`[QuestState] Unknown item def "${reward.defId}" in onComplete reward — skipped`);
            }
          }
          break;
        case 'setFlag':
          if (reward.flag) this.setFlag(reward.flag, !!reward.value);
          break;
        case 'setVar':
          if (reward.var) {
            if (reward.op === 'add') this.addVar(reward.var, reward.varValue || 0);
            else this.setVar(reward.var, reward.varValue || 0);
          }
          break;
        default:
          break;
      }
    }
  }

  /**
   * Apply a map's Switches & Variables registry (see eventTypes.ts
   * QuestRegistry) initial values — but ONLY for a name never before touched
   * (checked via `in`, not the boolean/number value, so an explicit `false`/`0`
   * still counts as "already set"). Safe to call repeatedly (game start, every
   * map transition): already-seeded or already-played names are untouched, so
   * a flag the player has since changed is never clobbered back to its
   * registry default just by revisiting the map that defines it.
   */
  seedFromRegistry(registry) {
    if (!registry) return;
    for (const f of registry.flags || []) {
      if (!f || !f.name) continue;
      if (!(f.name in this.flags)) this.setFlag(f.name, !!f.initialValue);
    }
    for (const v of registry.vars || []) {
      if (!v || !v.name) continue;
      if (!(v.name in this.vars)) this.setVar(v.name, Number(v.initialValue) || 0);
    }
  }

  reset() {
    this.flags = {};
    this.vars = {};
    this.activeQuests = {};
    this.completedQuests = [];
    this.consumed = {};
    this.emit('questStateChanged', { kind: 'reset' });
  }

  toJSON() {
    return {
      flags: { ...this.flags },
      vars: { ...this.vars },
      activeQuests: { ...this.activeQuests },
      completedQuests: [...this.completedQuests],
      consumed: { ...this.consumed },
    };
  }

  fromJSON(data) {
    this.flags = { ...(data?.flags || {}) };
    this.vars = { ...(data?.vars || {}) };
    this.activeQuests = { ...(data?.activeQuests || {}) };
    this.completedQuests = [...(data?.completedQuests || [])];
    this.consumed = { ...(data?.consumed || {}) };
  }
}

export default QuestState;
