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
