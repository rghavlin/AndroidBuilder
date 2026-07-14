import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';

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
    this.emit('questStateChanged', { kind: 'reset' });
  }

  toJSON() {
    return { flags: { ...this.flags }, vars: { ...this.vars } };
  }

  fromJSON(data) {
    this.flags = { ...(data?.flags || {}) };
    this.vars = { ...(data?.vars || {}) };
  }
}

export default QuestState;
