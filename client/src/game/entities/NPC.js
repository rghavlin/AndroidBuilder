import { Entity, EntityType } from './Entity.js';
import { Container } from '../inventory/Container.js';
import { Item } from '../inventory/Item.js';
import engine from '../GameEngine.js';
import { getNPCType } from './NPCTypes.js';
import { SequencerAction } from '../managers/SequencerAction.js';

/**
 * NPC entity with vitals, inventory, and baseline AI state
 */
export class NPC extends Entity {
  constructor(id, name, x = 0, y = 0, isHostile = false, typeId = 'survivor') {
    super(id, EntityType.NPC, x, y);
    this.typeId = typeId;
    const typeDef = getNPCType(typeId);

    this.name = name || typeDef.name;
    this.isHostile = isHostile;

    // Vitals matching type definition
    this._hp = typeDef.hp;
    this.maxHp = typeDef.hp;
    this._ap = typeDef.maxAP;
    this.maxAp = typeDef.maxAP;
    this.fleeRecoverChance = typeDef.fleeRecoverChance;

    this.blocksMovement = true;

    // NPC Inventory using standard Container logic
    this.inventory = new Container({
      id: `${id}_inventory`,
      type: 'npc_inventory',
      name: `${name}'s Inventory`,
      width: 6,
      height: 15,
      autoSort: true
    });

    this.equippedWeaponId = null; // Instance ID of weapon in inventory
    this.behaviorState = 'idle'; // 'idle', 'attacking', 'trading', 'fleeing', 'escaping', 'demanding'
    this.currentTarget = null; // { x, y, id, type }

    this.hasDemanded = false; // Whether the demand dialog has been shown
    this.hasExtorted = false; // Whether the player complied with the demand
    this.wasAttackedThisTurn = false; // Track if hit this turn for counter-attacks

    // Rendering/Animation State (Mirroring Zombie.js for GameContext orchestration)
    this.movementPath = []; // Array of {x, y} coordinates for the current turn
    this.isAnimating = false;
    this.animationProgress = 0; // 0.0 to 1.0
  }

  /**
   * Play an action visually using the Master Heartbeat Sequencer.
   * @param {Object} action - The action to perform
   * @param {Object} callbacks - Optional callbacks (e.g., { onImpact })
   */
  async playAction(action, callbacks = {}) {
    const { type, data } = action;
    const { onImpact } = callbacks;

    // Optimization: Skip full animation for off-screen entities to speed up turn playback
    const camera = engine.camera;
    const fromPos = data.from || { x: this.x, y: this.y };
    const toPos = data.to || fromPos;
    
    // Check visibility for both start and end points
    const isFromVisible = camera ? camera.isTileVisible(Math.round(fromPos.x), Math.round(fromPos.y)) : true;
    const isToVisible = camera ? camera.isTileVisible(Math.round(toPos.x), Math.round(toPos.y)) : true;
    const isVisible = isFromVisible || isToVisible;

    if (type === 'MOVE') {
      const from = fromPos;
      const to = toPos;

      if (from.x === to.x && from.y === to.y) return Promise.resolve();

      this.movementPath = [from, to];
      
      if (!isVisible) {
          // Off-screen move: Snap immediately
          this.renderX = to.x;
          this.renderY = to.y;
          this.x = to.x;
          this.y = to.y;
          this.movementPath = [];
          return Promise.resolve();
      }

      this.isAnimating = true;

      const duration = 150;
      const seq = new SequencerAction(this, duration, duration, onImpact);
      
      engine.registerAction(seq);
      
      return seq.promise.then(() => {
        this.renderX = to.x;
        this.renderY = to.y;
        this.x = to.x;
        this.y = to.y;
        this.movementPath = [];
      });
    }

    if (type === 'ATTACK') {
      // Phase 28 Fix: Visual-Logical Sync
      if (data.from) {
        this.x = data.from.x;
        this.y = data.from.y;
      }
      
      if (!isVisible) {
          // Off-screen attack: Trigger impact and resolve with tiny delay
          if (onImpact) onImpact();
          return new Promise(resolve => setTimeout(resolve, 20));
      }

      this.isAnimating = true;
      const duration = 200;
      const impactPoint = 100; // Visual contact at 50%
      const seq = new SequencerAction(this, duration, impactPoint, onImpact);
      
      engine.registerAction(seq);
      
      return seq.promise.then(() => {
        // Flag remains true to prevent micro-gap ghosting
      });
    }

    return Promise.resolve();
  }

  /**
   * End NPC's turn - Flush logical state to visual state.
   */
  endTurn() {
    this.ap = 0;
    this.behaviorState = 'idle';
    
    // Safety sync: Ensure visual position matches logical position at end of turn
    this.renderX = this.gridX;
    this.renderY = this.gridY;
    this.x = this.gridX;
    this.y = this.gridY;
    
    this.isAnimating = false;
    this.animationProgress = 0;
    this.movementPath = [];
  }



  /**
   * Reset NPC for new turn
   */
  startTurn() {
    this.ap = this.maxAp;
    this.wasAttackedThisTurn = false;
    this.gridX = this.renderX;
    this.gridY = this.renderY;
    this.logicalX = this.renderX;
    this.logicalY = this.renderY;
    this.movementPath = [{ x: this.renderX, y: this.renderY }];
    
    if (this.behaviorState === 'fleeing' && Math.random() < this.fleeRecoverChance) {
        this.behaviorState = 'idle';
    }
  }

  // --- Getters/Setters for vitals ---
  get hp() { return this._hp; }
  set hp(val) {
    this._hp = Math.max(0, Math.min(this.maxHp, val));
  }

  get ap() { return this._ap; }
  set ap(val) {
    this._ap = Math.max(0, Math.min(this.maxAp, val));
  }

  /**
   * Use AP for an action
   */
  useAP(amount) {
    if (this.ap >= amount) {
      this.ap -= amount;
      return true;
    }
    return false;
  }

  /**
   * Take damage from an attack
   */
  takeDamage(amount, source = null) {
    const oldHp = this._hp;
    this.hp -= amount;
    this.wasAttackedThisTurn = true;

    this.emitEvent('npcDamageTaken', {
      amount,
      oldHp,
      currentHp: this._hp,
      maxHp: this.maxHp,
      sourceType: source?.type
    });

    return {
      damageDealt: amount,
      isDead: this.hp <= 0
    };
  }

  /**
   * Check if the NPC is dead
   */
  isDead() {
    return this.hp <= 0;
  }


  /**
   * Helper to find the best weapon in inventory (prioritizing equipped)
   * @returns {Item|null}
   */
  getEquippedWeapon() {
    // If we have an explicit ID, find it
    if (this.equippedWeaponId) {
      const item = this.inventory.getItem(this.equippedWeaponId);
      if (item) return item;
    }

    // Fallback: search for any weapon
    const items = this.inventory.getAllItems();
    return items.find(it => it.type === 'weapon' || it.category === 'weapon' || it.category === 'gun') || null;
  }

  /**
   * Drop all inventory items onto the ground at current position
   * by emitting an event globally.
   */
  die() {
    const npcItems = this.inventory.getAllItems();

    engine.emit('npcDied', {
      items: npcItems,
      x: this.x,
      y: this.y,
      npcId: this.id
    });

    // Also emit locally just in case
    this.emitEvent('npcDied', {
      items: npcItems,
      x: this.x,
      y: this.y
    });

    this.inventory.clear();
  }

  /**
   * Serialize NPC to JSON for saving
   */
  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      isHostile: this.isHostile,
      hp: this.hp,
      maxHp: this.maxHp,
      ap: this.ap,
      maxAp: this.maxAp,
      inventory: this.inventory.toJSON(),
      equippedWeaponId: this.equippedWeaponId,
      behaviorState: this.behaviorState,
      currentTarget: this.currentTarget,
      typeId: this.typeId,
      fleeRecoverChance: this.fleeRecoverChance,
      hasDemanded: this.hasDemanded,
      hasExtorted: this.hasExtorted
    };
  }

  /**
   * Create NPC from JSON data
   */
  static fromJSON(data) {
    const npc = new NPC(data.id, data.name, data.x, data.y, data.isHostile, data.typeId || 'survivor');
    npc.hp = data.hp !== undefined ? data.hp : npc.maxHp;
    npc.maxHp = data.maxHp !== undefined ? data.maxHp : npc.maxHp;
    npc.ap = data.ap !== undefined ? data.ap : npc.maxAp;
    npc.maxAp = data.maxAp !== undefined ? data.maxAp : npc.maxAp;
    npc.fleeRecoverChance = data.fleeRecoverChance !== undefined ? data.fleeRecoverChance : getNPCType(npc.typeId).fleeRecoverChance;
    npc.equippedWeaponId = data.equippedWeaponId;
    npc.behaviorState = data.behaviorState || 'idle';
    npc.currentTarget = data.currentTarget;
    npc.hasDemanded = data.hasDemanded || false;
    npc.hasExtorted = data.hasExtorted || false;

    if (data.inventory) {
      npc.inventory = Container.fromJSON(data.inventory);
    }

    npc.gridX = data.gridX !== undefined ? data.gridX : (data.logicalX !== undefined ? data.logicalX : data.x);
    npc.gridY = data.gridY !== undefined ? data.gridY : (data.logicalY !== undefined ? data.logicalY : data.y);
    npc.renderX = data.x;
    npc.renderY = data.y;
    npc.logicalX = npc.gridX;
    npc.logicalY = npc.gridY;
    
    return npc;
  }
}
