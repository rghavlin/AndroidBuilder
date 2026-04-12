import { Entity } from './Entity.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';

/**
 * Player entity with health, action points, and player-specific behavior
 */
export class Player extends Entity {
  constructor(id, name, x = 0, y = 0) {
    super(id, 'player', x, y);
    this.name = name;
    // Survival Stats with backing properties for reactivity
    this._hp = 20;
    this.maxHp = 20;
    this._ap = 20;
    this.maxAp = 20;
    this._nutrition = 25;
    this.maxNutrition = 25;
    this._hydration = 25;
    this.maxHydration = 25;
    this._energy = 25;
    this.maxEnergy = 25;
    this._condition = 'Normal';
    this.sickness = 0; // Turns of sickness left
    this.isBleeding = false; // New bleeding status
    this.blocksMovement = true; // Players block other entities
    
    // Skill Progression
    this._meleeKills = 0;
    this.meleeLvl = 0;
    this._rangedKills = 0;
    this.rangedLvl = 0;
    this._craftingApUsed = 0;
    this.craftingLvl = 0;

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

  // --- Reactive Getters/Setters ---
  get hp() { return this._hp; }
  set hp(v) { 
    if (this._hp === v) return;
    this._hp = v; 
    this.notifyChange(); 
  }

  get ap() { return this._ap; }
  set ap(v) { 
    if (this._ap === v) return;
    this._ap = v; 
    this.notifyChange(); 
  }

  get nutrition() { return this._nutrition; }
  set nutrition(v) { 
    if (this._nutrition === v) return;
    this._nutrition = v; 
    this.notifyChange(); 
  }

  get hydration() { return this._hydration; }
  set hydration(v) { 
    if (this._hydration === v) return;
    this._hydration = v; 
    this.notifyChange(); 
  }

  get energy() { return this._energy; }
  set energy(v) { 
    if (this._energy === v) return;
    this._energy = v; 
    this.notifyChange(); 
  }

  get condition() { return this._condition; }
  set condition(v) { 
    if (this._condition === v) return;
    this._condition = v; 
    this.notifyChange(); 
  }

  get meleeKills() { return this._meleeKills; }
  set meleeKills(v) { this._meleeKills = v; this.notifyChange(); }

  get rangedKills() { return this._rangedKills; }
  set rangedKills(v) { this._rangedKills = v; this.notifyChange(); }

  get craftingApUsed() { return this._craftingApUsed; }
  set craftingApUsed(v) { this._craftingApUsed = v; this.notifyChange(); }

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
      this.emit('stateChanged', this);
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
      this.emit('stateChanged', this);
    }
  }

  /**
   * Explicitly notify listeners that player state has changed.
   * Useful when properties are modified directly instead of via methods.
   */
  notifyChange() {
    this.emit('stateChanged', this);
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

    // Global event for UI and Audio
    GameEvents.emit(GAME_EVENT.PLAYER_DAMAGE, { amount, currentHp: this.hp });

    if (this.hp === 0) {
      this.emitEvent('playerDied', {});
    }

    this.emit('stateChanged', this);
  }

  /**
   * Heal player
   * @param {number} amount
   * @param {boolean} silent - If true, suppressed global sound events
   */
  heal(amount, silent = false) {
    // Cannot heal if already dead (hp must be > 0)
    if (this.hp <= 0) {
      console.log(`[Player] ${this.name} is dead (HP: ${this.hp}), healing ignored.`);
      return;
    }

    const oldHp = this.hp;
    this.hp = Math.min(this.hp + amount, this.maxHp);

    if (this.hp !== oldHp) {
      const amountHealed = this.hp - oldHp;
      this.emitEvent('healed', {
        amount: amountHealed,
        currentHp: this.hp,
        maxHp: this.maxHp
      });

      if (!silent) {
        // Global event
        GameEvents.emit(GAME_EVENT.PLAYER_HEAL, { amount: amountHealed, currentHp: this.hp });
      }
      
      this.emit('stateChanged', this);
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
      this.emit('stateChanged', this);
    }
  }

  /**
   * Record a kill for a specific weapon type and handle leveling
   * @param {'melee' | 'ranged'} type 
   * @returns {number | null} New level if leveled up, else null
   */
  recordKill(type) {
    const isMelee = type === 'melee';
    const currentKills = isMelee ? this.meleeKills : this.rangedKills;
    const currentLevel = isMelee ? this.meleeLvl : this.rangedLvl;
    
    this.modifyStat(isMelee ? 'meleeKills' : 'rangedKills', 1);
    
    const nextMilestone = 5 * Math.pow(2, currentLevel);
    
    if (this[isMelee ? 'meleeKills' : 'rangedKills'] >= nextMilestone) {
      const newLevel = currentLevel + 1;
      this.setStat(isMelee ? 'meleeLvl' : 'rangedLvl', newLevel);
      console.log(`[Player] ✨ ${isMelee ? 'MELEE' : 'RANGED'} LEVEL UP! ${this.name} reached level ${newLevel}`);
      return newLevel;
    }
    
    return null;
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
      // setter will handle notifyChange
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
    this.emit('stateChanged', this);
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

      // Global event
      GameEvents.emit(GAME_EVENT.PLAYER_BLEEDING, { isBleeding: this.isBleeding });
      this.emit('stateChanged', this);
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
    this.emit('stateChanged', this);
  }

  /**
   * Called when an item is crafted to increment skill exp based on AP used
   * @param {number} apUsed - Actual AP consumed for the craft
   */
  onItemCrafted(apUsed = 1) {
    this.craftingApUsed += apUsed;
    
    // Level up calculation: 10, 20, 40, 80...
    // Threshold for Level L -> L+1 is 10 * 2^L
    const nextTarget = 10 * Math.pow(2, this.craftingLvl);
    
    if (this.craftingApUsed >= nextTarget) {
      this.craftingLvl++;
      console.log(`[Player] ✨ CRAFTING LEVEL UP! ${this.name} reached level ${this.craftingLvl}`);
      this.emitEvent('craftingLevelUp', { 
        level: this.craftingLvl,
        craftingApUsed: this.craftingApUsed
      });
      this.emitEvent('statChanged', { stat: 'craftingLvl', current: this.craftingLvl });
    }
    
    this.emit('stateChanged', this);
    this.emitEvent('statChanged', { stat: 'craftingApUsed', current: this.craftingApUsed });
  }

  /**
   * Serialize player to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: 'player',
      x: this.x,
      y: this.y,
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
      craftingApUsed: this.craftingApUsed,
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
    player.meleeLvl = data.meleeLvl !== undefined ? data.meleeLvl : 0;
    player.rangedKills = data.rangedKills || 0;
    player.rangedLvl = data.rangedLvl !== undefined ? data.rangedLvl : 0;
    player.craftingApUsed = data.craftingApUsed || 0;
    player.craftingLvl = data.craftingLvl !== undefined ? data.craftingLvl : 0;
    
    // Reset transient movement state
    player.isMoving = false;
    player.movementStartTime = null;
    player.movementPath = [];
    player.prevX = data.x;
    player.prevY = data.y;
    
    return player;
  }
}