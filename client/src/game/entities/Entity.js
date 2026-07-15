import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';
import { LineOfSight } from '../utils/LineOfSight.js';
import { FactionRegistry } from '../ai/FactionRegistry.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';
import engine from '../GameEngine.js';
import { SequencerAction } from '../managers/SequencerAction.js';
import { ItemDefs } from '../inventory/ItemDefs.js';
import { ItemCategory } from '../inventory/traits.js';
import { CombatResolver } from '../systems/CombatResolver.js';
import { MAX_SICKNESS_DURATION } from '../utils/SurvivalCascade.js';
import { AttributeProgressionManager } from '../systems/AttributeProgressionManager.js';


import { Position } from '../components/Position.js';
import { Health } from '../components/Health.js';
import { Renderable } from '../components/Renderable.js';
import { Movable } from '../components/Movable.js';
import { InventoryContainer } from '../components/InventoryContainer.js';
import { AIBehavior } from '../components/AIBehavior.js';
import { LightEmitter } from '../components/LightEmitter.js';
import { MoveIntent } from '../components/MoveIntent.js';
import { DamageIntent } from '../components/DamageIntent.js';
import { DestroyIntent } from '../components/DestroyIntent.js';
import { NoiseEvent } from '../components/NoiseEvent.js';
import { Vision } from '../components/Vision.js';
import { Inventory } from '../components/Inventory.js';
import { Item } from '../components/Item.js';
import { MeleeWeapon } from '../components/MeleeWeapon.js';
import { Consumable } from '../components/Consumable.js';
import { ActionPoints } from '../components/ActionPoints.js';
import { SurvivalStats } from '../components/SurvivalStats.js';
import { PlayerSkills } from '../components/PlayerSkills.js';
import { PlayerWallet } from '../components/PlayerWallet.js';
import { Container } from '../inventory/Container.js';
import { AIState } from '../components/AIState.js';
import { Burnable } from '../components/Burnable.js';
import { RpgStats } from '../components/RpgStats.js';
import { EquippedArmor } from '../components/EquippedArmor.js';

import { gameRandom } from '../utils/SeededRandom.js';
function defineAccessors(TargetClass, componentName, ComponentClass, props) {
  for (const [prop, defaultVal] of Object.entries(props)) {
    Object.defineProperty(TargetClass.prototype, prop, {
      get() {
        const comp = this.getComponent(componentName);
        return comp ? comp[prop] : defaultVal;
      },
      set(val) {
        let comp = this.getComponent(componentName);
        if (!comp) {
          comp = new ComponentClass();
          this.addComponent(comp);
        }
        comp[prop] = val;
        this.notifyChange();
      }
    });
  }
}

// COMPONENT_CLASSES: Registry of components that can be attached to entities.
// Divided into Permanent Data Components and Intent/Action Tags.
export const COMPONENT_CLASSES = {
  // --- Permanent Data Components ---
  Position,
  Health,
  Renderable,
  Movable,
  InventoryContainer,
  AIBehavior,
  LightEmitter,
  Vision,
  Inventory,
  Item,
  MeleeWeapon,
  Consumable,
  ActionPoints,
  SurvivalStats,
  PlayerSkills,
  PlayerWallet,
  AIState,
  Burnable,
  RpgStats,
  EquippedArmor,

  // --- Intent / Action Tags (Temporary States) ---
  MoveIntent,
  DamageIntent,
  DestroyIntent,
  NoiseEvent
};

// Reverse lookup: component constructor -> stable registry name. Built once so
// addComponent can key components by constructor IDENTITY rather than
// constructor.name. Production minification mangles class names (Health -> "e"),
// which would store components under garbage keys and make getComponent('Health')
// return undefined — the hp getter would then read 0 and kill the player the
// instant a new game starts (a build-only bug invisible in unminified dev).
const COMPONENT_NAME_BY_CTOR = new Map(
  Object.entries(COMPONENT_CLASSES).map(([name, ctor]) => [ctor, name])
);

export const SERIALIZED_FIELDS = [
  'subtype', 'blocksMovement', 'name', 'isHostile', 'equippedWeaponId', 'iconId',
  'typeId', 'isShopkeeper', 'isTollGuard', 'tollPaid', 'tollSidestep', 'tollTarget',
  'factionId', 'sightRange', 'hearingRangeMultiplier', 'hasExited', 'isActive', 'noLoot', 'deaf',
  'hp', 'maxHp', 'ap', 'maxAp', 'nutrition', 'maxNutrition', 'hydration',
  'maxHydration', 'energy', 'maxEnergy', 'condition', 'sickness', 'isBleeding', 'woundInfection',
  'drunkenness', 'isStarving', 'isDehydrated', 'meleeHits', 'meleeLvl',
  'rangedHits', 'rangedLvl', 'defenseHits', 'defenseLvl', 'craftingApUsed', 'craftingLvl', 'earbucks',
  'lastAttacker'
];

export const ITEM_SERIALIZED_FIELDS = [
  'instanceId', 'defId', 'width', 'height', 'rotation', 'traits', 'categories',
  'stackCount', 'stackMax', 'capacity', 'ammoCount', 'isLit', 'isOn',
  'lifetimeTurns', 'imageId', 'equippableSlot', 'isEquipped', 'pocketLayoutId',
  'description', 'combat', 'rangedStats', 'armor', 'armorAbsorption', 'rarity', 'backgroundColor', 'scooterMode',
  'rideApBonus', 'isLocked', 'renderFullTile', 'dragApPenalty', 'noDrag', 'consumptionEffects',
  'waterQuality', 'shelfLife', 'transformInto', 'produce', 'providesElectricity', 'fireMode',
  'availableFireModes', 'isCrop', 'isFurnitureOrVehicle', 'isFood', 'isMedical', 'zombieSubtype',
  'earbucksValue', 'transitionTargetId', 'transitionTargetX', 'transitionTargetY', 'eventId'
];

export const EntityType = {
  PLAYER: 'player',
  ZOMBIE: 'zombie',
  DOOR: 'door',
  WINDOW: 'window',
  RABBIT: 'rabbit',
  ANIMAL: 'animal',
  ITEM: 'item',
  NPC: 'npc',
  PLACE_ICON: 'place_icon',
  STRUCTURE: 'structure'
};

export class Entity extends SafeEventEmitter {
  constructor(id, type, x = 0, y = 0, subtype = null) {
    super();
    this.id = id || (typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = gameRandom.next() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        }));
    this.type = type;
    this.components = new Map();

    // Backing coordinates
    this._gridX = x;
    this._gridY = y;
    this._renderX = x;
    this._renderY = y;
    this._logicalX = x;
    this._logicalY = y;
    this.subtype = subtype || null;
    this.blocksMovement = false;

    // Backing stats/properties for facade backward compatibility
    this.name = 'Entity';
    this.isHostile = false;
    // Faction membership for AI hostility resolution. When null, getFaction()
    // derives a sensible default from the entity type (so old saves and entities
    // created outside EntityFactory still get a correct faction).
    this.factionId = null;
    // Per-entity runtime hostility escalation (faction ids or specific entity ids).
    // e.g. the town adds 'player' here after the player attacks the shopkeeper.
    this.hostileOverrides = new Set();
    this.typeId = 'survivor';
    this.equippedWeaponId = null;
    this.sightRange = 18;
    // NOTE: noiseBlacklist/recentThreats are AIState-backed accessors (see
    // defineAccessors below). Do NOT eagerly initialize them here — writing them
    // would create an AIState component on every entity (items, doors, place
    // icons), bloating saves. Real AI actors get their AIState from EntityFactory
    // (or the Rabbit constructor), so their in-place .push() targets a
    // per-instance array; the accessor default is only ever read, never mutated,
    // on non-AI entities.
    this.hasExited = false;
    this._condition = type === 'item' ? null : 'Normal';
    this.pendingAPRefill = null;
    this.movementPath = [];
    this.isAnimating = false;
    this.animationProgress = 0;
    this.inventory = null;

    // ECS AI & Alertness States
    this.isActive = false;
    this.activeAction = null;
  }




  // Getters/setters for dual-coordinate rendering system
  get x() { return this._renderX; }
  set x(val) { this._renderX = val; }

  get y() { return this._renderY; }
  set y(val) { this._renderY = val; }

  get renderX() { return this._renderX; }
  set renderX(val) { this._renderX = val; }

  get renderY() { return this._renderY; }
  set renderY(val) { this._renderY = val; }

  get gridX() {
    const pos = this.getComponent('Position');
    return pos ? pos.x : this._gridX;
  }
  set gridX(val) {
    const pos = this.getComponent('Position');
    if (pos) pos.x = val;
    this._gridX = val;
  }

  get gridY() {
    const pos = this.getComponent('Position');
    return pos ? pos.y : this._gridY;
  }
  set gridY(val) {
    const pos = this.getComponent('Position');
    if (pos) pos.y = val;
    this._gridY = val;
  }

  get logicalX() {
    const pos = this.getComponent('Position');
    return pos ? pos.x : this._logicalX;
  }
  set logicalX(val) {
    const pos = this.getComponent('Position');
    if (pos) pos.x = val;
    this._logicalX = val;
  }

  get logicalY() {
    const pos = this.getComponent('Position');
    return pos ? pos.y : this._logicalY;
  }
  set logicalY(val) {
    const pos = this.getComponent('Position');
    if (pos) pos.y = val;
    this._logicalY = val;
  }

  // Getters/setters mapping to components if they exist
  get hp() {
    const health = this.getComponent('Health');
    return health ? health.current : 0;
  }
  set hp(val) {
    let health = this.getComponent('Health');
    if (!health) {
      health = new Health();
      this.addComponent(health);
    }
    health.current = Math.max(0, Math.min(health.max, val));
    health.isDead = health.current <= 0;
    this.notifyChange();
  }

  get maxHp() {
    const health = this.getComponent('Health');
    return health ? health.max : 0;
  }
  set maxHp(val) {
    let health = this.getComponent('Health');
    if (!health) {
      health = new Health();
      this.addComponent(health);
    }
    health.max = val;
    this.notifyChange();
  }

  getMovementMultiplier() {
    const movable = this.getComponent('Movable');
    return movable ? movable.apCost : 1.0;
  }

  get ap() {
    const apComp = this.getComponent('ActionPoints');
    return apComp ? apComp.current : 0;
  }
  set ap(val) {
    let apComp = this.getComponent('ActionPoints');
    if (!apComp) {
      apComp = new ActionPoints();
      this.addComponent(apComp);
    }
    apComp.current = val;
    this.notifyChange();
  }

  get currentAP() {
    return this.ap;
  }
  set currentAP(val) {
    this.ap = val;
  }

  get maxAp() {
    const apComp = this.getComponent('ActionPoints');
    return apComp ? apComp.max : 0;
  }
  set maxAp(val) {
    let apComp = this.getComponent('ActionPoints');
    if (!apComp) {
      apComp = new ActionPoints();
      this.addComponent(apComp);
    }
    apComp.max = val;
    this.notifyChange();
  }

  get maxAP() {
    return this.maxAp;
  }
  set maxAP(val) {
    this.maxAp = val;
  }

  get nutrition() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.nutrition : 0;
  }
  set nutrition(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.nutrition = v;
    if (stats.nutrition <= 0 && !stats.isStarving) {
      stats.isStarving = true;
    } else if (stats.nutrition > 0 && stats.isStarving) {
      stats.isStarving = false;
    }
    this.notifyChange();
  }

  get hydration() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.hydration : 0;
  }
  set hydration(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.hydration = v;
    if (stats.hydration <= 0 && !stats.isDehydrated) {
      stats.isDehydrated = true;
    } else if (stats.hydration > 0 && stats.isDehydrated) {
      stats.isDehydrated = false;
    }
    this.notifyChange();
  }

  get condition() {
    const stats = this.getComponent('SurvivalStats');
    if (stats) {
      if (stats.isBleeding) return 'Bleeding';
      if (stats.woundInfection) return 'Wound Infection';
      if (stats.sickness > 0) return 'Diseased';
      if (stats.drunkenness > 0) return 'Drunk';
      return stats.condition || 'Normal';
    }
    return this._condition || (this.type === 'item' ? null : 'Normal');
  }
  set condition(v) {
    let stats = this.getComponent('SurvivalStats');
    if (stats) {
      stats.condition = v;
    } else {
      this._condition = v;
    }
    this.notifyChange();
  }

  get earbucks() {
    const wallet = this.getComponent('PlayerWallet');
    return wallet ? wallet.earbucks : 0;
  }
  set earbucks(v) {
    let wallet = this.getComponent('PlayerWallet');
    if (!wallet) {
      wallet = new PlayerWallet();
      this.addComponent(wallet);
    }
    wallet.earbucks = Math.max(0, v);
    this.notifyChange();
  }

  // ECS operations
  addComponent(nameOrComponent, componentData = null) {
    if (!this.components) this.components = new Map(); // self-heal a malformed entity
    if (typeof nameOrComponent === 'string') {
      this.components.set(nameOrComponent, componentData);
    } else if (nameOrComponent && typeof nameOrComponent === 'object') {
      // Resolve by constructor identity (minification-safe); fall back to
      // constructor.name only for components not in the registry.
      const name = COMPONENT_NAME_BY_CTOR.get(nameOrComponent.constructor) || nameOrComponent.constructor.name;
      this.components.set(name, nameOrComponent);
    }
  }

  removeComponent(componentName) {
    if (this.components) this.components.delete(componentName);
  }

  getComponent(componentName) {
    // Defensive: a malformed/partially-restored entity may be missing its
    // components map. Return undefined rather than throwing — the coordinate
    // getters (logicalX/gridX/…) fall back to their backing fields, and a single
    // bad entity must never crash the whole render frame or simulation tick.
    return this.components ? this.components.get(componentName) : undefined;
  }

  hasComponent(componentName) {
    return this.components ? this.components.has(componentName) : false;
  }

  // Logic facades for Entity API compatibility
  takeDamage(amount, source = null) {
    const oldHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);
    if (source) {
      this.lastAttacker = { id: source.id, type: source.type };
    }
    this.emitEvent('damageTaken', {
      amount,
      oldHp,
      currentHp: this.hp,
      maxHp: this.maxHp,
      source: source ? { id: source.id, type: source.type, x: source.x, y: source.y } : null
    });
    if (this.type === 'player') {
      GameEvents.emit(GAME_EVENT.PLAYER_DAMAGE, { amount, currentHp: this.hp });
      // Enduring injury builds Constitution — its main steady XP source.
      if (amount > 0) {
        AttributeProgressionManager.recordAction(this, 'TAKE_DAMAGE', { amount });
      }
    }
    this.notifyChange();
    return { damageDealt: amount, isDead: this.hp <= 0 };
  }

  heal(amount, silent = false) {
    if (this.hp <= 0) return;
    const oldHp = this.hp;
    this.hp = Math.min(this.hp + amount, this.maxHp);
    if (this.hp !== oldHp) {
      const amountHealed = this.hp - oldHp;
      this.emitEvent('healed', {
        amount: amountHealed,
        currentHp: this.hp,
        maxHp: this.maxHp
      });
      if (this.type === 'player') {
        AttributeProgressionManager.recordAction(this, 'HEAL_DAMAGE', { amount: amountHealed });
        if (!silent) {
          GameEvents.emit(GAME_EVENT.PLAYER_HEAL, { amount: amountHealed, currentHp: this.hp });
        }
      }
      this.notifyChange();
    }
  }

  useAP(amount) {
    const currentVal = this.ap;
    if (currentVal >= amount) {
      const nextVal = Math.round((currentVal - amount) * 10) / 10;
      this.ap = nextVal;
      this.emitEvent('apUsed', { used: amount, remaining: nextVal });
      this.notifyChange();
      return true;
    }
    return false;
  }

  restoreAP(amount) {
    const currentVal = this.ap;
    const maxVal = this.maxAp;
    const oldVal = currentVal;
    const nextVal = Math.round(Math.min(currentVal + amount, maxVal) * 10) / 10;
    this.ap = nextVal;
    const restored = nextVal - oldVal;
    if (restored > 0) {
      this.emitEvent('apRestored', { amount: restored, current: nextVal, maxAp: maxVal });
      this.notifyChange();
    }
  }

  modifyStat(statName, amount) {
    const old = this[statName];
    if (old === undefined) return;
    if (typeof amount === 'number' && typeof old === 'number') {
      const maxStatName = `max${statName.charAt(0).toUpperCase() + statName.slice(1)}`;
      const maxVal = this[maxStatName] !== undefined ? this[maxStatName] : Infinity;
      this[statName] = Math.min(maxVal, Math.max(0, old + amount));
    } else {
      this[statName] = amount;
    }
    if (this[statName] !== old) {
      this.notifyChange();
    }
  }

  setStat(statName, value) {
    const old = this[statName];
    if (old === undefined) return;
    if (typeof value === 'number') {
      const maxStatName = `max${statName.charAt(0).toUpperCase() + statName.slice(1)}`;
      const maxVal = this[maxStatName] !== undefined ? this[maxStatName] : Infinity;
      this[statName] = Math.min(maxVal, Math.max(0, value));
    } else {
      this[statName] = value;
    }
    if (this[statName] !== old) {
      this.notifyChange();
    }
  }

  cure() {
    this.sickness = 0;
    this.woundInfection = false;
    this.condition = 'Normal';
    this.notifyChange();
  }

  setBleeding(val) {
    // The `condition` getter derives 'Bleeding' straight from isBleeding, so there's
    // no separate condition field to sync here.
    this.isBleeding = !!val;
    this.notifyChange();
  }

  inflictSickness(amount) {
    // Constitution shortens the sickness (and thus the disease burden it triggers).
    // Single choke point for every source: Spitter's toxic spit, spoiled food, dirty water.
    // Capped so a chain of contractions (raw meat + dirty water, etc.) can't leave the
    // player Diseased for an absurd number of turns — severity is already capped via
    // sicknessPenalties, but duration wasn't.
    const resisted = CombatResolver.applySicknessResistance(amount, this.currentConstitution);
    this.sickness = Math.min(MAX_SICKNESS_DURATION, Math.max(0, this.sickness + resisted));
    // The `condition` getter derives 'Diseased' straight from sickness > 0, so there's
    // no separate condition field to sync here.
    this.notifyChange();
  }

  /**
   * Sets the zombie-virus infection flag — the permanent, lethal-if-untreated
   * clock (see tickInfection/SurvivalCascade.js), entirely separate from the
   * recoverable Disease/sickness mechanic above. Re-infecting an already-
   * infected entity is a no-op; infection doesn't stack or reset progress.
   */
  inflictInfection() {
    if (this.isInfected) return;
    this.isInfected = true;
    this.notifyChange();
  }

  onItemCrafted(apUsed = 1) {
    this.craftingApUsed += apUsed;
    const nextTarget = PlayerSkills.getNextCraftingTarget(this.craftingLvl);
    if (this.craftingApUsed >= nextTarget) {
      this.craftingLvl++;
      if (this.type === 'player') {
        AttributeProgressionManager.recordAction(this, 'CRAFTING_SKILL_UP');
      }
    }
    this.notifyChange();
  }

  /**
   * Fires on every landed hit (not just kills) — skill progress and its paired
   * attribute-XP trickle are both hit-driven, decoupled from whether the hit
   * happened to be lethal. Melee grants Strength+Agility XP per hit, Ranged
   * grants Agility+Perception, mirroring their skill-seed pairs. Returns the
   * new level on a milestone crossing, or null otherwise.
   */
  recordHit(type) {
    const isMelee = type === 'melee';
    const hitField = isMelee ? 'meleeHits' : 'rangedHits';
    const lvlField = isMelee ? 'meleeLvl' : 'rangedLvl';
    const currentLevel = this[lvlField];

    this.modifyStat(hitField, 1);
    if (this.type === 'player') {
      AttributeProgressionManager.recordAction(this, isMelee ? 'MELEE_HIT' : 'RANGED_HIT');
    }

    const nextMilestone = PlayerSkills.getNextHitMilestone(currentLevel);
    if (this[hitField] >= nextMilestone) {
      const newLevel = currentLevel + 1;
      this.setStat(lvlField, newLevel);
      return newLevel;
    }
    return null;
  }

  /**
   * Fires on every successfully contested defense (the attacker's own hit
   * roll succeeded, and this entity then evaded it) — an attack that would
   * have missed anyway never calls this, since resolveDefense is only
   * invoked from inside a roll function's `if (hit)` branch. Mirrors
   * recordHit's per-action growth model exactly; grants Agility+Perception
   * XP, matching Defense's seed pair. Player and NPC both progress; only the
   * player also gets the attribute-XP trickle (same gating as recordHit).
   */
  recordDefense() {
    const currentLevel = this.defenseLvl;
    this.modifyStat('defenseHits', 1);
    if (this.type === 'player') {
      AttributeProgressionManager.recordAction(this, 'DEFENSE_SUCCESS');
    }

    const nextMilestone = PlayerSkills.getNextHitMilestone(currentLevel);
    if (this.defenseHits >= nextMilestone) {
      const newLevel = currentLevel + 1;
      this.setStat('defenseLvl', newLevel);
      return newLevel;
    }
    return null;
  }

  notifyChange() {
    this.emit('stateChanged', this);
  }

  isDead() {
    return this.hp <= 0;
  }

  startTurn() {
    this.ap = this.stunnedTurns > 0 ? 0 : this.maxAp;
    this.isActive = true;
    this.wasAttackedThisTurn = false;
    this.movementPath = [{ x: this.logicalX, y: this.logicalY }];
    if (this.behaviorState === 'fleeing' && this.fleeRecoverChance !== undefined && gameRandom.next() < this.fleeRecoverChance) {
      this.behaviorState = 'idle';
    }


  }

  endTurn() {
    if (this.stunnedTurns > 0) this.stunnedTurns--;
    this.ap = 0;
    this.isActive = false;
    this.renderX = this.gridX;
    this.renderY = this.gridY;
    this.x = this.gridX;
    this.y = this.gridY;
    this.isAnimating = false;
    this.animationProgress = 0;
    this.movementPath = [];
    this.activeAction = null;
  }

  die() {
    if (this.inventory && typeof this.inventory.getAllItems === 'function') {
      const items = this.inventory.getAllItems();
      engine.emit('npcDied', {
        items,
        x: this.x,
        y: this.y,
        npcId: this.id
      });
      this.inventory.clear();
    }
  }

  getEquippedWeapon() {
    if (!this.equippedWeaponId || !this.inventory) return null;
    if (typeof this.inventory.items?.get === 'function') {
      return this.inventory.items.get(this.equippedWeaponId);
    }
    return null;
  }

  moveTo(x, y, options = {}) {
    const oldX = this.logicalX;
    const oldY = this.logicalY;
    this.gridX = x;
    this.gridY = y;
    this.logicalX = x;
    this.logicalY = y;
    if (options.snap !== false) {
      this.renderX = x;
      this.renderY = y;
    }
    if (this.hasComponent('Vision')) {
      this.getComponent('Vision')._visionDirty = true;
    }
    if (this.type === 'player') {
      this.emitEvent('playerMoved', { oldPosition: { x: oldX, y: oldY }, newPosition: { x, y } });
    } else {
      this.emit('entityMoved', { oldPosition: { x: oldX, y: oldY }, newPosition: { x, y } });
    }


  }

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
      this.animationProgress = 0;

      const duration = 150; // ms per tile
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

    if (type === 'ATTACK' || type === 'STRUCTURE_INTERACT') {
      // Phase 28 Fix: Visual-Logical Sync
      if (data.from) {
        this.x = data.from.x;
        this.y = data.from.y;
      }

      if (!isVisible) {
          // Off-screen interaction: Trigger impact and resolve with tiny delay
          if (onImpact) onImpact();
          return new Promise(resolve => setTimeout(resolve, 20));
      }

      this.isAnimating = true;
      this.animationProgress = 0;
      this.activeAction = { type, data };

      const isAttack = type === 'ATTACK';
      const duration = isAttack ? 200 : 300;
      const impactPoint = isAttack ? 100 : 150;
      const seq = new SequencerAction(this, duration, impactPoint, onImpact);

      engine.registerAction(seq);

      return seq.promise.then(() => {
        this.isAnimating = false;
        this.animationProgress = 0;
        this.activeAction = null;
      });
    }

    // Default fallback
    if (action.type === 'MOVE' && action.data.to) {
      this.x = action.data.to.x;
      this.y = action.data.to.y;
    }
    return Promise.resolve();
  }

  addEventListener(eventType, callback) {
    this.on(eventType, callback);
  }

  emitEvent(eventType, data = {}) {
    const eventData = {
      entity: {
        id: this.id,
        type: this.type,
        position: { x: this.x, y: this.y }
      },
      timestamp: Date.now(),
      ...data
    };
    this.emit(eventType, eventData);
  }

  setNoiseHeard(x, y) {
    if (this.deaf) return;
    this.heardNoise = true;
    this.noiseCoords = { x, y };
    const aiComp = this.getComponent('AIBehavior');
    if (aiComp) {
      aiComp.heardNoiseCoords = { x, y };
      aiComp.alertnessState = 'INVESTIGATING';
    }
    if (this.type === 'npc') {
      this.emitEvent('npcNoiseHeard', { npcId: this.id, noiseCoords: { x, y } });
    }
  }

  clearNoiseHeard() {
    const aiComp = this.getComponent('AIBehavior');
    if (aiComp) {
      aiComp.heardNoiseCoords = null;
    }
  }

  setTargetSighted(x, y) {
    if (x === 0 && y === 0 && (Math.abs(this.logicalX) > 2 || Math.abs(this.logicalY) > 2)) {
      console.warn(`[Entity] ${this.id} rejected invalid LKP at (0,0) from (${this.logicalX}, ${this.logicalY})`);
      return;
    }
    this.lastSeen = true;
    this.targetSightedCoords = { x, y };
    const aiComp = this.getComponent('AIBehavior');
    if (aiComp) {
      aiComp.lastSeenPlayerCoords = { x, y };
      aiComp.alertnessState = 'HUNTING';
    }
    this.emitEvent('zombieTargetSighted', {
      zombieId: this.id,
      targetCoords: { x, y }
    });
  }

  clearLastSeen() {
    const aiComp = this.getComponent('AIBehavior');
    if (aiComp) {
      aiComp.lastSeenPlayerCoords = null;
    }
  }

  canSeePosition(gameMap, targetX, targetY) {
    const losResult = LineOfSight.hasLineOfSight(
      gameMap,
      this.logicalX,
      this.logicalY,
      targetX,
      targetY,
      {
        maxRange: this.sightRange || 18,
        ignoreTerrain: [],
        ignoreEntities: []
      }
    );
    return losResult.hasLineOfSight;
  }

  canSeeEntity(gameMap, entity) {
    const targetX = entity.logicalX !== undefined ? entity.logicalX : entity.x;
    const targetY = entity.logicalY !== undefined ? entity.logicalY : entity.y;
    return this.canSeePosition(gameMap, targetX, targetY);
  }

  /**
   * Resolve this entity's faction. Falls back to a type-based default when
   * factionId was never explicitly assigned (old saves, ad-hoc creation).
   */
  getFaction() {
    if (this.factionId) return this.factionId;
    switch (this.type) {
      case EntityType.PLAYER: return 'player';
      case EntityType.ZOMBIE: return 'zombies';
      case EntityType.NPC: return 'survivors';
      case EntityType.RABBIT:
      case EntityType.ANIMAL: return 'wildlife';
      default: return 'neutral';
    }
  }

  /**
   * Whether this entity is hostile toward `target`. Resolution order:
   *  1. Per-entity overrides (runtime escalation) — by entity id or faction id.
   *  2. Legacy per-NPC hostility toward the player (preserves current behavior).
   *  3. Static directional faction stance table.
   */
  isHostileTo(target) {
    if (!target || target === this) return false;
    const targetFaction = target.getFaction ? target.getFaction() : null;

    if (this.hostileOverrides && this.hostileOverrides.size > 0) {
      if (this.hostileOverrides.has(target.id) ||
          (targetFaction && this.hostileOverrides.has(targetFaction))) {
        return true;
      }
    }

    // Legacy: an NPC flagged isHostile attacks the player. Kept as a source of
    // truth so Phase 1 wiring is behavior-identical; folded into factions later.
    if (this.type === EntityType.NPC && target.type === EntityType.PLAYER && this.isHostile) {
      return true;
    }

    return FactionRegistry.isHostile(this.getFaction(), targetFaction);
  }

  getDistanceTo(x, y) {
    const dx = this.logicalX - x;
    const dy = this.logicalY - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  isAdjacentTo(x, y) {
    const dx = Math.abs(this.logicalX - x);
    const dy = Math.abs(this.logicalY - y);
    return (dx + dy) === 1;
  }

  isDiagonalTo(targetX, targetY) {
    return Math.abs(this.logicalX - targetX) === 1 && Math.abs(this.logicalY - targetY) === 1;
  }

  precomputeItemFlags() {
    if (this.type !== 'item') return;

    const defId = this.defId || this.id;
    const def = ItemDefs[defId];

    // 1. isCrop
    this.isCrop = !!((defId && (defId.endsWith('_plant') || defId.startsWith('provision.harvestable_'))) || this.isWild || this.isHarvestable);

    // 2. isFurnitureOrVehicle
    let isFav = false;
    if (defId) {
      if (defId.startsWith('furniture.') || defId.startsWith('vehicle.')) {
        isFav = true;
      } else {
        const itemTraits = this.traits || [];
        const itemCats = this.categories || [];
        if (itemTraits.includes('furniture') || itemTraits.includes('vehicle') ||
            itemCats.includes('furniture') || itemCats.includes('vehicle')) {
          isFav = true;
        } else if (def) {
          const defTraits = def.traits || [];
          const defCategories = def.categories || [];
          isFav = defTraits.includes('furniture') || defTraits.includes('vehicle') ||
              defCategories.includes('furniture') || defCategories.includes('vehicle');
        }
      }
    }
    this.isFurnitureOrVehicle = isFav;

    // 3. isFood & isMedical
    const cats = this.categories || [];
    let isFood = cats.includes(ItemCategory.FOOD);
    let isMedical = cats.includes(ItemCategory.MEDICAL);

    if (!isFood && def && def.categories) {
      isFood = def.categories.includes(ItemCategory.FOOD);
    }
    if (!isMedical && def && def.categories) {
      isMedical = def.categories.includes(ItemCategory.MEDICAL);
    }

    this.isFood = isFood;
    this.isMedical = isMedical;
  }

  /**
   * Serialize the component map defensively. A small number of malformed
   * entities have been observed with a non-Map `components` field (see the
   * self-heal in addComponent), which would otherwise throw
   * "this.components is not iterable" and abort the entire save.
   */
  _serializeComponents() {
    let entries;
    if (this.components instanceof Map) {
      entries = [...this.components];
    } else if (this.components && typeof this.components === 'object') {
      entries = Object.entries(this.components);
      console.warn(`[Entity.toJSON] Entity id=${this.id} type=${this.type} had components as a plain object; serializing defensively.`);
    } else {
      entries = [];
      if (this.components !== undefined) {
        console.warn(`[Entity.toJSON] Entity id=${this.id} type=${this.type} had malformed components (${Object.prototype.toString.call(this.components)}); serializing as empty.`);
      }
    }
    return Object.fromEntries(
      entries.map(([name, comp]) => [name, typeof comp?.toJSON === 'function' ? comp.toJSON() : comp])
    );
  }

  toJSON() {
    const data = {
      id: this.id,
      type: this.type,
      x: this.renderX,
      y: this.renderY,
      gridX: this.gridX,
      gridY: this.gridY,
      logicalX: this.logicalX,
      logicalY: this.logicalY,
      hostileOverrides: this.hostileOverrides ? Array.from(this.hostileOverrides) : [],
      inventory: this.inventory ? this.inventory.toJSON() : null,
      components: this._serializeComponents()
    };

    for (const field of SERIALIZED_FIELDS) {
      if (this[field] !== undefined) {
        data[field] = this[field];
      }
    }

    if (this.type === 'item') {
      for (const field of ITEM_SERIALIZED_FIELDS) {
        if (this[field] !== undefined) {
          data[field] = this[field];
        }
      }
      if (this.attachments) {
        const serializedAttachments = {};
        for (const [slotId, att] of Object.entries(this.attachments)) {
          if (att) {
            serializedAttachments[slotId] = typeof att.toJSON === 'function' ? att.toJSON() : att;
          }
        }
        data.attachments = serializedAttachments;
      }
      if (this.containerGrid) {
        data.containerGrid = typeof this.containerGrid.toJSON === 'function' ? this.containerGrid.toJSON() : this.containerGrid;
      }
      if (this.pocketGrids) {
        data.pocketGrids = Array.isArray(this.pocketGrids)
          ? this.pocketGrids.map(pg => typeof pg.toJSON === 'function' ? pg.toJSON() : pg)
          : this.pocketGrids;
      }
    }

    return data;
  }

  static fromJSON(data) {
    if (!data) return null;
    const entity = new Entity(data.id, data.type);
    
    // Restore legacy properties for structural entities if they were serialized
    entity.gridX = data.gridX !== undefined ? data.gridX : (data.logicalX !== undefined ? data.logicalX : data.x || 0);
    entity.gridY = data.gridY !== undefined ? data.gridY : (data.logicalY !== undefined ? data.logicalY : data.y || 0);
    entity.renderX = data.x !== undefined ? data.x : entity.gridX;
    entity.renderY = data.y !== undefined ? data.y : entity.gridY;
    entity.logicalX = entity.gridX;
    entity.logicalY = entity.gridY;

    if (Array.isArray(data.hostileOverrides)) entity.hostileOverrides = new Set(data.hostileOverrides);

    if (data.inventory) {
      entity.inventory = Container.fromJSON(data.inventory);
    }

    // NOTE: SERIALIZED_FIELDS lists hp before maxHp, and the hp setter clamps to
    // the current Health.max. That would cap hp here — but the Health component is
    // restored below (data.components loop) and REPLACES the component built by
    // these facade setters, so the final hp/maxHp come from the component, not from
    // this loop. Do not "fix" the ordering to rely on these setters instead.
    for (const field of SERIALIZED_FIELDS) {
      if (data[field] !== undefined) {
        entity[field] = data[field];
      }
    }

    if (data.type === 'item') {
      for (const field of ITEM_SERIALIZED_FIELDS) {
        if (data[field] !== undefined) {
          entity[field] = data[field];
        }
      }
      if (data.attachments) {
        entity.attachments = {};
        for (const [slotId, attData] of Object.entries(data.attachments)) {
          if (attData) {
            entity.attachments[slotId] = attData.components ? Entity.fromJSON(attData) : attData;
          }
        }
      }
      if (data.containerGrid) {
        entity.containerGrid = data.containerGrid;
      }
      if (data.pocketGrids) {
        entity.pocketGrids = data.pocketGrids;
      }
      entity.precomputeItemFlags();
    }

    if (data.components) {
      for (const [name, componentData] of Object.entries(data.components)) {
        const ComponentClass = COMPONENT_CLASSES[name];
        if (ComponentClass) {
          entity.addComponent(new ComponentClass(componentData));
        } else {
          entity.addComponent(name, componentData);
        }
      }
    }
    return entity;
  }
}
defineAccessors(Entity, 'AIState', AIState, {
  behaviorState: 'idle',
  currentTarget: null,
  heardNoise: false,
  noiseCoords: { x: 0, y: 0 },
  noiseBlacklist: [],
  recentThreats: [],
  goalTarget: null,
  lastSeen: false,
  targetSightedCoords: { x: 0, y: 0 },
  lastScentSequence: 0,
  isAlerted: false,
  currentPath: null,
  hasDemanded: false,
  hasExtorted: false,
  fleeRecoverChance: 0,
  stunnedTurns: 0,
  aiDisabled: false
});

defineAccessors(Entity, 'Burnable', Burnable, {
  fireTurns: 0
});

defineAccessors(Entity, 'SurvivalStats', SurvivalStats, {
  maxNutrition: 0,
  maxHydration: 0,
  energy: 0,
  maxEnergy: 0,
  sickness: 0,
  isBleeding: false,
  woundInfection: false,
  drunkenness: 0,
  isStarving: false,
  isDehydrated: false
});

defineAccessors(Entity, 'PlayerSkills', PlayerSkills, {
  meleeHits: 0,
  meleeLvl: 0,
  rangedHits: 0,
  rangedLvl: 0,
  defenseHits: 0,
  defenseLvl: 0,
  craftingApUsed: 0,
  craftingLvl: 0
});

defineAccessors(Entity, 'RpgStats', RpgStats, {
  baseStrength: 20,
  currentStrength: 20,
  baseAgility: 20,
  currentAgility: 20,
  basePerception: 20,
  currentPerception: 20,
  baseConstitution: 20,
  currentConstitution: 20,
  strengthXP: 0,
  agilityXP: 0,
  perceptionXP: 0,
  constitutionXP: 0,
  strengthXpSpent: 0,
  agilityXpSpent: 0,
  perceptionXpSpent: 0,
  constitutionXpSpent: 0,
  isInfected: false,
  infectionTicksRemaining: 24,
  treatmentTicksRemaining: 0,
  treatmentSubtype: null,
  treatmentEffects: null,
  treatmentColor: null,
  treatmentName: null
});

defineAccessors(Entity, 'EquippedArmor', EquippedArmor, {
  absorption: 0,
  maxAbsorption: 0,
  weightRequirement: 0
});
