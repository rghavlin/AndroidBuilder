import { Entity, EntityType } from './Entity.js';
import { Container } from '../inventory/Container.js';
import { Item } from '../inventory/Item.js';
import engine from '../GameEngine.js';
import { getNPCType } from './NPCTypes.js';

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
    this.behaviorState = 'idle'; // 'idle', 'attacking', 'trading', 'fleeing'
    this.currentTarget = null; // { x, y, id, type }
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
   * Take damage from an attack
   */
  takeDamage(amount) {
    const oldHp = this._hp;
    this.hp -= amount;

    this.emitEvent('npcDamageTaken', {
      amount,
      oldHp,
      currentHp: this._hp,
      maxHp: this.maxHp
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
   * Reset stats for the beginning of a turn
   */
  startTurn() {
    this.ap = this.maxAp;
    // Basic AI state reset if needed
    if (this.behaviorState === 'fleeing' && Math.random() < this.fleeRecoverChance) {
        this.behaviorState = 'idle';
    }
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
      fleeRecoverChance: this.fleeRecoverChance
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

    if (data.inventory) {
      npc.inventory = Container.fromJSON(data.inventory);
    }

    return npc;
  }
}
