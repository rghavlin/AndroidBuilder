import { Entity } from './Entity.js';

/**
 * Player entity with health, action points, and player-specific behavior
 */
export class Player extends Entity {
  constructor(id, name, x = 0, y = 0) {
    super(id, 'player', x, y);
    this.name = name;
    this.hp = 20;
    this.maxHp = 20;
    this.ap = 100;
    this.maxAp = 100;
    this.nutrition = 20;
    this.maxNutrition = 20;
    this.hydration = 20;
    this.maxHydration = 20;
    this.energy = 20;
    this.maxEnergy = 20;
    this.blocksMovement = true; // Players block other entities

    // Add instance tracking to detect duplicates
    this.instanceCreatedAt = Date.now();
    this.creationStack = new Error().stack;
    console.log(`[Player] 🎮 NEW PLAYER INSTANCE CREATED: ${id} at (${x}, ${y})`);
    console.log(`[Player] - Creation timestamp: ${this.instanceCreatedAt}`);

    // Track all player instances globally
    if (!window.playerInstances) {
      window.playerInstances = new Map();
    }
    window.playerInstances.set(this.instanceCreatedAt, { id, x, y, createdAt: this.instanceCreatedAt });
    console.log(`[Player] 📊 TOTAL PLAYER INSTANCES CREATED: ${window.playerInstances.size}`);
    if (window.playerInstances.size > 1) {
      console.error(`[Player] 🚨🚨🚨 MULTIPLE PLAYER INSTANCES DETECTED!`);
      console.error(`[Player] All instances:`, Array.from(window.playerInstances.values()));
    }

    // Ensure event emitter methods are available
    if (!this.on || !this.emit) {
      console.error('[Player] Event emitter methods not available from Entity parent class');
    }
  }

  /**
   * Use AP for an action
   * @param {number} amount - Amount of AP to use
   * @returns {boolean} - Whether the AP was successfully used
   */
  useAP(amount) {
    if (this.ap >= amount) {
      this.ap = Math.round((this.ap - amount) * 10) / 10;
      this.emitEvent('apUsed', {
        used: amount,
        remaining: this.ap
      });
      return true;
    }
    return false;
  }

  /**
   * Restore AP by a specified amount
   * @param {number} amount - Amount of AP to restore
   */
  restoreAP(amount) {
    const oldAp = this.ap;
    this.ap = Math.round(Math.min(this.ap + amount, this.maxAp) * 10) / 10;
    const restored = this.ap - oldAp;

    if (restored > 0) {
      this.emitEvent('apRestored', {
        amount: restored,
        current: this.ap,
        maxAp: this.maxAp
      });
    }
  }

  /**
   * Remove event listener (inherited from Entity's EventEmitter)
   */
  removeEventListener(eventName, listener) {
    return super.removeEventListener(eventName, listener);
  }

  /**
   * Move to new position (used by GameContext)
   */
  moveTo(x, y) {
    const oldX = this.x;
    const oldY = this.y;

    this.x = x;
    this.y = y;

    this.emitEvent('playerMoved', {
      oldPosition: { x: oldX, y: oldY },
      newPosition: { x, y }
    });
  }



  /**
   * Take damage
   */
  takeDamage(amount, source = null) {
    const oldHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);

    this.emitEvent('damageTaken', {
      amount,
      oldHp,
      currentHp: this.hp,
      maxHp: this.maxHp,
      source: source ? { id: source.id, type: source.type, x: source.x, y: source.y } : null
    });

    if (this.hp === 0) {
      this.emitEvent('playerDied', {});
    }
  }

  /**
   * Heal player
   */
  heal(amount) {
    const oldHp = this.hp;
    this.hp = Math.min(this.hp + amount, this.maxHp);

    if (this.hp !== oldHp) {
      this.emitEvent('healed', {
        amount: this.hp - oldHp,
        currentHp: this.hp,
        maxHp: this.maxHp
      });
    }
  }

  /**
   * Modify a generic stat
   */
  modifyStat(statName, amount) {
    const maxStatName = `max${statName.charAt(0).toUpperCase() + statName.slice(1)}`;
    const old = this[statName];
    if (old === undefined) return;

    const maxVal = this[maxStatName] || 100;
    this[statName] = Math.min(maxVal, Math.max(0, this[statName] + amount));

    if (this[statName] !== old) {
      this.emitEvent('statChanged', {
        stat: statName,
        amount,
        current: this[statName],
        max: maxVal
      });
    }
  }

  /**
   * Set a generic stat directly
   */
  setStat(statName, value) {
    const maxStatName = `max${statName.charAt(0).toUpperCase() + statName.slice(1)}`;
    const old = this[statName];
    if (old === undefined) return;

    const maxVal = this[maxStatName] || 100;
    this[statName] = Math.min(maxVal, Math.max(0, value));

    if (this[statName] !== old) {
      this.emitEvent('statChanged', {
        stat: statName,
        amount: this[statName] - old,
        current: this[statName],
        max: maxVal
      });
    }
  }

  /**
   * Serialize player to JSON
   */
  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      ap: this.ap,
      maxAp: this.maxAp,
      nutrition: this.nutrition,
      maxNutrition: this.maxNutrition,
      hydration: this.hydration,
      maxHydration: this.maxHydration,
      energy: this.energy,
      maxEnergy: this.maxEnergy
    };
  }

  /**
   * Create player from JSON data
   */
  static fromJSON(data) {
    const player = new Player(data.id, data.name, data.x, data.y);
    player.hp = data.hp;
    player.maxHp = data.maxHp;
    player.ap = data.ap !== undefined ? data.ap : 100;
    player.maxAp = data.maxAp !== undefined ? data.maxAp : 100;
    player.nutrition = data.nutrition || 20;
    player.maxNutrition = data.maxNutrition || 20;
    player.hydration = data.hydration || 20;
    player.maxHydration = data.maxHydration || 20;
    player.energy = data.energy || 20;
    player.maxEnergy = data.maxEnergy || 20;
    return player;
  }
}