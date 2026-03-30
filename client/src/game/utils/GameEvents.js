import { SafeEventEmitter } from './SafeEventEmitter.js';

/**
 * GAME_EVENT - Standard markers for all trackable game actions
 * Use these constants to avoid "magic string" bugs.
 */
export const GAME_EVENT = {
  // Zombie Actions
  ZOMBIE_ATTACK: 'zombie_attack',
  ZOMBIE_ATTACK_RESULT: 'zombie_attack_result',
  ZOMBIE_MOVE: 'zombie_move',
  ZOMBIE_WANDER: 'zombie_wander',
  ZOMBIE_ALERTED: 'zombie_alerted',
  ZOMBIE_WAIT: 'zombie_wait',
  
  // Structure Interactions
  DOOR_BANG: 'door_bang',
  DOOR_BROKEN: 'door_broken',
  WINDOW_SMASH: 'window_smash',
  
  // Player Actions
  PLAYER_MOVE: 'player_move',
  PLAYER_MOVE_ENDED: 'player_move_ended',
  PLAYER_ATTACK: 'player_attack',
  PLAYER_HEAL: 'player_heal',
  PLAYER_DAMAGE: 'player_damage',
  PLAYER_BLEEDING: 'player_bleeding',
  
  // Environmental
  NOISE_EMITTED: 'noise_emitted',
  TURN_STARTED: 'turn_started',
  TURN_ENDED: 'turn_ended'
};

/**
 * GameEvents - Global singleton event bus
 * Systems emit events here; Contexts/UI listen here.
 */
class GameEventBus extends SafeEventEmitter {
  constructor() {
    super();
    this.id = Math.random().toString(36).substr(2, 9);
    console.log(`[GameEvents] 🚌 Global Event Bus initialized: ${this.id}`);
  }
}

// Create singleton instance with global persistence (safe for HMR)
const GLOBAL_KEY = '___GAME_EVENT_BUS___';
if (typeof window !== 'undefined' && !window[GLOBAL_KEY]) {
  window[GLOBAL_KEY] = new GameEventBus();
}
const instance = (typeof window !== 'undefined') ? window[GLOBAL_KEY] : new GameEventBus();

export default instance;
