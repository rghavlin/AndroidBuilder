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
    this.ap = 20;
    this.maxAp = 20;
    this.nutrition = 25;
    this.maxNutrition = 25;
    this.hydration = 25;
    this.maxHydration = 25;
    this.energy = 25;
    this.maxEnergy = 25;
    this.condition = 'Normal';
    this.sickness = 0; // Turns of sickness left
    this.isBleeding = false; // New bleeding status
    this.blocksMovement = true; // Players block other entities
    
    // Skill Progression
    this.meleeKills = 0;
    this.meleeLvl = 1;
    this.rangedKills = 0;
    this.rangedLvl = 1;
    this.itemsCrafted = 0;
    this.craftingLvl = 1;

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
    // Cannot heal if already dead (hp must be > 0)
    if (this.hp <= 0) {
      console.log(`[Player] ${this.name} is dead (HP: ${this.hp}), healing ignored.`);
      return;
    }

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
    const old = this[statName];
    if (old === undefined) return;

    if (typeof amount === 'number' && typeof old === 'number') {
      const maxStatName = `max${statName.charAt(0).toUpperCase() + statName.slice(1)}`;
      const maxVal = this[maxStatName] || 100;
      this[statName] = Math.min(maxVal, Math.max(0, old + amount));
    } else {
      // Non-numeric modification (append or replace if not numeric)
      this[statName] = amount;
    }

    if (this[statName] !== old) {
      const maxStatName = `max${statName.charAt(0).toUpperCase() + statName.slice(1)}`;
      const maxVal = this[maxStatName] || 100;
      this.emitEvent('statChanged', {
        stat: statName,
        amount: typeof amount === 'number' ? amount : 0,
        current: this[statName],
        max: maxVal
      });
    }
  }

  /**
   * Set a generic stat directly
   */
  setStat(statName, value) {
    const old = this[statName];
    if (old === undefined) return;

    if (typeof value === 'number') {
      const maxStatName = `max${statName.charAt(0).toUpperCase() + statName.slice(1)}`;
      const maxVal = this[maxStatName] || 100;
      this[statName] = Math.min(maxVal, Math.max(0, value));
    } else {
      this[statName] = value;
    }

    if (this[statName] !== old) {
      const maxStatName = `max${statName.charAt(0).toUpperCase() + statName.slice(1)}`;
      const maxVal = this[maxStatName] || 100;
      this.emitEvent('statChanged', {
        stat: statName,
        amount: typeof value === 'number' ? value - old : 0,
        current: this[statName],
        max: maxVal
      });
    }
  }

  /**
   * Inflict sickness for a number of turns
   * @param {number} turns - Number of turns (hours) the sickness lasts
   */
  inflictSickness(turns) {
    this.sickness = (this.sickness || 0) + turns;
    this.condition = 'Sick';
    console.log(`[Player] ${this.name} is now Sick for ${this.sickness} turns`);

    this.emitEvent('statChanged', {
      stat: 'condition',
      current: this.condition
    });
    this.emitEvent('statChanged', {
      stat: 'sickness',
      current: this.sickness
    });
  }

  /**
   * Check if player is currently sick
   * @returns {boolean}
   */
  get isSick() {
    return this.sickness > 0;
  }

  /**
   * Set bleeding status and emit event
   */
  setBleeding(value) {
    const old = this.isBleeding;
    this.isBleeding = !!value;
    
    if (this.isBleeding !== old) {
      this.emitEvent('statChanged', {
        stat: 'isBleeding',
        current: this.isBleeding
      });
    }
  }

  /**
   * Cure sickness and disease
   */
  cure() {
    this.sickness = 0;
    this.condition = 'Normal';
    console.log(`[Player] ${this.name} has been CURED of all ailments`);

    this.emitEvent('statChanged', {
      stat: 'condition',
      current: this.condition
    });
    this.emitEvent('statChanged', {
      stat: 'sickness',
      current: this.sickness
    });
  }

  /**
   * Called when an item is crafted to increment skill exp
   */
  onItemCrafted() {
    this.itemsCrafted++;
    
    // Level up calculation: 5, 10, 20, 40, 80...
    // Threshold for Level L -> L+1 is 5 * 2^(L-1)
    const nextTarget = 5 * Math.pow(2, this.craftingLvl - 1);
    
    if (this.itemsCrafted >= nextTarget) {
      this.craftingLvl++;
      console.log(`[Player] ✨ CRAFTING LEVEL UP! ${this.name} reached level ${this.craftingLvl}`);
      this.emitEvent('craftingLevelUp', { 
        level: this.craftingLvl,
        itemsCrafted: this.itemsCrafted
      });
      this.emitEvent('statChanged', { stat: 'craftingLvl', current: this.craftingLvl });
    }
    
    this.emitEvent('statChanged', { stat: 'itemsCrafted', current: this.itemsCrafted });
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
      maxEnergy: this.maxEnergy,
      condition: this.condition,
      sickness: this.sickness,
      isBleeding: this.isBleeding,
      meleeKills: this.meleeKills,
      meleeLvl: this.meleeLvl,
      rangedKills: this.rangedKills,
      rangedLvl: this.rangedLvl,
      itemsCrafted: this.itemsCrafted,
      craftingLvl: this.craftingLvl
    };
  }

  /**
   * Create player from JSON data
   */
  static fromJSON(data) {
    const player = new Player(data.id, data.name, data.x, data.y);
    player.hp = data.hp;
    player.maxHp = data.maxHp;
    player.ap = data.ap !== undefined ? data.ap : 20;
    player.maxAp = data.maxAp !== undefined ? data.maxAp : 20;
    player.nutrition = data.nutrition || 25;
    player.maxNutrition = data.maxNutrition || 25;
    player.hydration = data.hydration || 25;
    player.maxHydration = data.maxHydration || 25;
    player.energy = data.energy || 25;
    player.maxEnergy = data.maxEnergy || 25;
    player.condition = data.condition || 'Normal';
    player.sickness = data.sickness || 0;
    player.isBleeding = data.isBleeding || false;
    player.meleeKills = data.meleeKills || 0;
    player.meleeLvl = data.meleeLvl || 1;
    player.rangedKills = data.rangedKills || 0;
    player.rangedLvl = data.rangedLvl || 1;
    player.itemsCrafted = data.itemsCrafted || 0;
    player.craftingLvl = data.craftingLvl || 1;
    return player;
  }
}