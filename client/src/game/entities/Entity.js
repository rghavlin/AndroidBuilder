import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';
import { LineOfSight } from '../utils/LineOfSight.js';
import { FactionRegistry } from '../ai/FactionRegistry.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';
import engine from '../GameEngine.js';
import { SequencerAction } from '../managers/SequencerAction.js';

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
import { PickupIntent } from '../components/PickupIntent.js';
import { DropIntent } from '../components/DropIntent.js';
import { ActionPoints } from '../components/ActionPoints.js';
import { SurvivalStats } from '../components/SurvivalStats.js';
import { PlayerSkills } from '../components/PlayerSkills.js';
import { Container } from '../inventory/Container.js';
import { AIState } from '../components/AIState.js';
import { Burnable } from '../components/Burnable.js';

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
  AIState,
  Burnable,

  // --- Intent / Action Tags (Temporary States) ---
  MoveIntent,
  DamageIntent,
  DestroyIntent,
  NoiseEvent,
  PickupIntent,
  DropIntent
};

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
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
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
    this.noiseBlacklist = [];
    this.recentThreats = [];
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


  // AIState Facades
  get behaviorState() { const ai = this.getComponent('AIState'); return ai ? ai.behaviorState : 'idle'; }
  set behaviorState(val) { const ai = this.getComponent('AIState'); if (ai) { ai.behaviorState = val; this.notifyChange(); } else { this.addComponent(new AIState({behaviorState: val})); } }

  get currentTarget() { const ai = this.getComponent('AIState'); return ai ? ai.currentTarget : null; }
  set currentTarget(val) { const ai = this.getComponent('AIState'); if (ai) { ai.currentTarget = val; this.notifyChange(); } }

  get heardNoise() { const ai = this.getComponent('AIState'); return ai ? ai.heardNoise : false; }
  set heardNoise(val) { const ai = this.getComponent('AIState'); if (ai) { ai.heardNoise = val; this.notifyChange(); } }

  get noiseCoords() { const ai = this.getComponent('AIState'); return ai ? ai.noiseCoords : { x: 0, y: 0 }; }
  set noiseCoords(val) { const ai = this.getComponent('AIState'); if (ai) { ai.noiseCoords = val; this.notifyChange(); } }

  get noiseBlacklist() { const ai = this.getComponent('AIState'); return ai ? ai.noiseBlacklist : []; }
  set noiseBlacklist(val) { const ai = this.getComponent('AIState'); if (ai) { ai.noiseBlacklist = val; this.notifyChange(); } }

  get recentThreats() { const ai = this.getComponent('AIState'); return ai ? ai.recentThreats : []; }
  set recentThreats(val) { const ai = this.getComponent('AIState'); if (ai) { ai.recentThreats = val; this.notifyChange(); } }

  get goalTarget() { const ai = this.getComponent('AIState'); return ai ? ai.goalTarget : null; }
  set goalTarget(val) { const ai = this.getComponent('AIState'); if (ai) { ai.goalTarget = val; this.notifyChange(); } }

  get lastSeen() { const ai = this.getComponent('AIState'); return ai ? ai.lastSeen : false; }
  set lastSeen(val) { const ai = this.getComponent('AIState'); if (ai) { ai.lastSeen = val; this.notifyChange(); } }

  get targetSightedCoords() { const ai = this.getComponent('AIState'); return ai ? ai.targetSightedCoords : { x: 0, y: 0 }; }
  set targetSightedCoords(val) { const ai = this.getComponent('AIState'); if (ai) { ai.targetSightedCoords = val; this.notifyChange(); } }

  get lastScentSequence() { const ai = this.getComponent('AIState'); return ai ? ai.lastScentSequence : 0; }
  set lastScentSequence(val) { const ai = this.getComponent('AIState'); if (ai) { ai.lastScentSequence = val; this.notifyChange(); } }

  get isAlerted() { const ai = this.getComponent('AIState'); return ai ? ai.isAlerted : false; }
  set isAlerted(val) { const ai = this.getComponent('AIState'); if (ai) { ai.isAlerted = val; this.notifyChange(); } }

  get currentPath() { const ai = this.getComponent('AIState'); return ai ? ai.currentPath : null; }
  set currentPath(val) { const ai = this.getComponent('AIState'); if (ai) { ai.currentPath = val; this.notifyChange(); } }

  get hasDemanded() { const ai = this.getComponent('AIState'); return ai ? ai.hasDemanded : false; }
  set hasDemanded(val) { const ai = this.getComponent('AIState'); if (ai) { ai.hasDemanded = val; this.notifyChange(); } }

  get hasExtorted() { const ai = this.getComponent('AIState'); return ai ? ai.hasExtorted : false; }
  set hasExtorted(val) { const ai = this.getComponent('AIState'); if (ai) { ai.hasExtorted = val; this.notifyChange(); } }

  get fleeRecoverChance() { const ai = this.getComponent('AIState'); return ai ? ai.fleeRecoverChance : 0; }
  set fleeRecoverChance(val) { const ai = this.getComponent('AIState'); if (ai) { ai.fleeRecoverChance = val; this.notifyChange(); } }

  get stunnedTurns() { const ai = this.getComponent('AIState'); return ai ? ai.stunnedTurns : 0; }
  set stunnedTurns(val) { const ai = this.getComponent('AIState'); if (ai) { ai.stunnedTurns = val; this.notifyChange(); } }

  // Burnable Facades
  get fireTurns() { const b = this.getComponent('Burnable'); return b ? b.fireTurns : 0; }
  set fireTurns(val) { 
    const b = this.getComponent('Burnable'); 
    if (b) { 
      b.fireTurns = val; 
      this.notifyChange(); 
    } else { 
      this.addComponent(new Burnable({fireTurns: val})); 
    }
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

  get maxNutrition() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.maxNutrition : 0;
  }
  set maxNutrition(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.maxNutrition = v;
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

  get maxHydration() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.maxHydration : 0;
  }
  set maxHydration(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.maxHydration = v;
    this.notifyChange();
  }

  get energy() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.energy : 0;
  }
  set energy(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.energy = v;
    this.notifyChange();
  }

  get maxEnergy() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.maxEnergy : 0;
  }
  set maxEnergy(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.maxEnergy = v;
    this.notifyChange();
  }

  get condition() {
    const stats = this.getComponent('SurvivalStats');
    if (stats) {
      if (stats.isBleeding) return 'Bleeding';
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

  get sickness() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.sickness : 0;
  }
  set sickness(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.sickness = v;
    this.notifyChange();
  }

  get isBleeding() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.isBleeding : false;
  }
  set isBleeding(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.isBleeding = v;
    this.notifyChange();
  }

  get drunkenness() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.drunkenness : 0;
  }
  set drunkenness(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.drunkenness = v;
    this.notifyChange();
  }

  get isStarving() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.isStarving : false;
  }
  set isStarving(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.isStarving = v;
    this.notifyChange();
  }

  get isDehydrated() {
    const stats = this.getComponent('SurvivalStats');
    return stats ? stats.isDehydrated : false;
  }
  set isDehydrated(v) {
    let stats = this.getComponent('SurvivalStats');
    if (!stats) {
      stats = new SurvivalStats();
      this.addComponent(stats);
    }
    stats.isDehydrated = v;
    this.notifyChange();
  }

  get meleeKills() {
    const skills = this.getComponent('PlayerSkills');
    return skills ? skills.meleeKills : 0;
  }
  set meleeKills(v) {
    let skills = this.getComponent('PlayerSkills');
    if (!skills) {
      skills = new PlayerSkills();
      this.addComponent(skills);
    }
    skills.meleeKills = v;
    this.notifyChange();
  }

  get meleeLvl() {
    const skills = this.getComponent('PlayerSkills');
    return skills ? skills.meleeLvl : 0;
  }
  set meleeLvl(v) {
    let skills = this.getComponent('PlayerSkills');
    if (!skills) {
      skills = new PlayerSkills();
      this.addComponent(skills);
    }
    skills.meleeLvl = v;
    this.notifyChange();
  }

  get rangedKills() {
    const skills = this.getComponent('PlayerSkills');
    return skills ? skills.rangedKills : 0;
  }
  set rangedKills(v) {
    let skills = this.getComponent('PlayerSkills');
    if (!skills) {
      skills = new PlayerSkills();
      this.addComponent(skills);
    }
    skills.rangedKills = v;
    this.notifyChange();
  }

  get rangedLvl() {
    const skills = this.getComponent('PlayerSkills');
    return skills ? skills.rangedLvl : 0;
  }
  set rangedLvl(v) {
    let skills = this.getComponent('PlayerSkills');
    if (!skills) {
      skills = new PlayerSkills();
      this.addComponent(skills);
    }
    skills.rangedLvl = v;
    this.notifyChange();
  }

  get craftingApUsed() {
    const skills = this.getComponent('PlayerSkills');
    return skills ? skills.craftingApUsed : 0;
  }
  set craftingApUsed(v) {
    let skills = this.getComponent('PlayerSkills');
    if (!skills) {
      skills = new PlayerSkills();
      this.addComponent(skills);
    }
    skills.craftingApUsed = v;
    this.notifyChange();
  }

  get craftingLvl() {
    const skills = this.getComponent('PlayerSkills');
    return skills ? skills.craftingLvl : 0;
  }
  set craftingLvl(v) {
    let skills = this.getComponent('PlayerSkills');
    if (!skills) {
      skills = new PlayerSkills();
      this.addComponent(skills);
    }
    skills.craftingLvl = v;
    this.notifyChange();
  }

  get earbucks() {
    const skills = this.getComponent('PlayerSkills');
    return skills ? skills.earbucks : 0;
  }
  set earbucks(v) {
    let skills = this.getComponent('PlayerSkills');
    if (!skills) {
      skills = new PlayerSkills();
      this.addComponent(skills);
    }
    skills.earbucks = Math.max(0, v);
    this.notifyChange();
  }

  // ECS operations
  addComponent(nameOrComponent, componentData = null) {
    if (typeof nameOrComponent === 'string') {
      this.components.set(nameOrComponent, componentData);
    } else if (nameOrComponent && typeof nameOrComponent === 'object') {
      const name = nameOrComponent.constructor.name;
      this.components.set(name, nameOrComponent);
    }
  }

  removeComponent(componentName) {
    this.components.delete(componentName);
  }

  getComponent(componentName) {
    return this.components.get(componentName);
  }

  hasComponent(componentName) {
    return this.components.has(componentName);
  }

  // Logic facades for Entity API compatibility
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
    if (this.type === 'player') {
      GameEvents.emit(GAME_EVENT.PLAYER_DAMAGE, { amount, currentHp: this.hp });
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
      if (this.type === 'player' && !silent) {
        GameEvents.emit(GAME_EVENT.PLAYER_HEAL, { amount: amountHealed, currentHp: this.hp });
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
    this.condition = 'Normal';
    this.notifyChange();
  }

  setBleeding(val) {
    this.isBleeding = !!val;
    if (this.isBleeding) {
      this.condition = 'Bleeding';
    } else if (this.condition === 'Bleeding') {
      this.condition = 'Normal';
    }
    this.notifyChange();
  }

  inflictSickness(amount) {
    this.sickness = Math.max(0, this.sickness + amount);
    if (this.sickness > 0) {
      this.condition = 'Diseased';
    } else if (this.condition === 'Diseased') {
      this.condition = 'Normal';
    }
    this.notifyChange();
  }

  onItemCrafted(apUsed = 1) {
    this.craftingApUsed += apUsed;
    const nextTarget = PlayerSkills.getNextCraftingTarget(this.craftingLvl);
    if (this.craftingApUsed >= nextTarget) {
      this.craftingLvl++;
    }
    this.notifyChange();
  }

  recordKill(type) {
    const isMelee = type === 'melee';
    const currentLevel = isMelee ? this.meleeLvl : this.rangedLvl;
    this.modifyStat(isMelee ? 'meleeKills' : 'rangedKills', 1);
    const nextMilestone = PlayerSkills.getNextKillMilestone(currentLevel);
    if (this[isMelee ? 'meleeKills' : 'rangedKills'] >= nextMilestone) {
      const newLevel = currentLevel + 1;
      this.setStat(isMelee ? 'meleeLvl' : 'rangedLvl', newLevel);
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
    if (this.behaviorState === 'fleeing' && this.fleeRecoverChance !== undefined && Math.random() < this.fleeRecoverChance) {
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
      subtype: this.subtype,
      blocksMovement: this.blocksMovement,
      name: this.name,
      isHostile: this.isHostile,
      equippedWeaponId: this.equippedWeaponId,
      typeId: this.typeId,
      isShopkeeper: this.isShopkeeper || false,
      factionId: this.factionId,
      hostileOverrides: this.hostileOverrides ? Array.from(this.hostileOverrides) : [],
      sightRange: this.sightRange,
      hasExited: this.hasExited,
      isActive: this.isActive,
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
      drunkenness: this.drunkenness || 0,
      isStarving: this.isStarving,
      isDehydrated: this.isDehydrated,
      meleeKills: this.meleeKills,
      meleeLvl: this.meleeLvl,
      rangedKills: this.rangedKills,
      rangedLvl: this.rangedLvl,
      craftingApUsed: this.craftingApUsed,
      craftingLvl: this.craftingLvl,
      earbucks: this.earbucks,
      inventory: this.inventory ? this.inventory.toJSON() : null,
      components: Object.fromEntries(
        [...this.components].map(([name, comp]) => [name, typeof comp?.toJSON === 'function' ? comp.toJSON() : comp])
      )
    };

    if (this.type === 'item') {
      const itemFields = [
        'instanceId', 'defId', 'width', 'height', 'rotation', 'traits', 'categories',
        'stackCount', 'stackMax', 'condition', 'capacity', 'ammoCount', 'isLit', 'isOn',
        'lifetimeTurns', 'imageId', 'subtype', 'equippableSlot', 'isEquipped', 'pocketLayoutId',
        'description', 'combat', 'rangedStats', 'rarity', 'backgroundColor', 'scooterMode',
        'rideApBonus', 'isLocked', 'renderFullTile', 'dragApPenalty', 'noDrag', 'consumptionEffects',
        'waterQuality', 'shelfLife', 'transformInto', 'produce', 'providesElectricity', 'fireMode',
        'availableFireModes'
      ];
      for (const field of itemFields) {
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
    entity.subtype = data.subtype || null;
    entity.blocksMovement = data.blocksMovement || false;

    // Restore stats/properties
    if (data.hp !== undefined) entity.hp = data.hp;
    if (data.maxHp !== undefined) entity.maxHp = data.maxHp;
    if (data.ap !== undefined) entity.ap = data.ap;
    if (data.maxAp !== undefined) entity.maxAp = data.maxAp;
    if (data.name !== undefined) entity.name = data.name;
    if (data.isHostile !== undefined) entity.isHostile = data.isHostile;
    if (data.typeId !== undefined) entity.typeId = data.typeId;
    if (data.isShopkeeper !== undefined) entity.isShopkeeper = data.isShopkeeper;
    if (data.factionId !== undefined) entity.factionId = data.factionId;
    if (Array.isArray(data.hostileOverrides)) entity.hostileOverrides = new Set(data.hostileOverrides);
    if (data.equippedWeaponId !== undefined) entity.equippedWeaponId = data.equippedWeaponId;
    if (data.sightRange !== undefined) entity.sightRange = data.sightRange;
    if (data.hasExited !== undefined) entity.hasExited = data.hasExited;
    if (data.isActive !== undefined) entity.isActive = data.isActive;
    if (data.nutrition !== undefined) entity.nutrition = data.nutrition;
    if (data.maxNutrition !== undefined) entity.maxNutrition = data.maxNutrition;
    if (data.hydration !== undefined) entity.hydration = data.hydration;
    if (data.maxHydration !== undefined) entity.maxHydration = data.maxHydration;
    if (data.energy !== undefined) entity.energy = data.energy;
    if (data.maxEnergy !== undefined) entity.maxEnergy = data.maxEnergy;
    if (data.condition !== undefined) entity.condition = data.condition;
    if (data.sickness !== undefined) entity.sickness = data.sickness;
    if (data.isBleeding !== undefined) entity.isBleeding = data.isBleeding;
    if (data.drunkenness !== undefined) entity.drunkenness = data.drunkenness;
    if (data.isStarving !== undefined) entity.isStarving = data.isStarving;
    if (data.isDehydrated !== undefined) entity.isDehydrated = data.isDehydrated;
    if (data.meleeKills !== undefined) entity.meleeKills = data.meleeKills;
    if (data.meleeLvl !== undefined) entity.meleeLvl = data.meleeLvl;
    if (data.rangedKills !== undefined) entity.rangedKills = data.rangedKills;
    if (data.rangedLvl !== undefined) entity.rangedLvl = data.rangedLvl;
    if (data.craftingApUsed !== undefined) entity.craftingApUsed = data.craftingApUsed;
    if (data.craftingLvl !== undefined) entity.craftingLvl = data.craftingLvl;
    if (data.earbucks !== undefined) entity.earbucks = data.earbucks;

    if (data.inventory) {
      entity.inventory = Container.fromJSON(data.inventory);
    }

    if (data.type === 'item') {
      const itemFields = [
        'instanceId', 'defId', 'width', 'height', 'rotation', 'traits', 'categories',
        'stackCount', 'stackMax', 'condition', 'capacity', 'ammoCount', 'isLit', 'isOn',
        'lifetimeTurns', 'imageId', 'subtype', 'equippableSlot', 'isEquipped', 'pocketLayoutId',
        'description', 'combat', 'rangedStats', 'rarity', 'backgroundColor', 'scooterMode',
        'rideApBonus', 'isLocked', 'renderFullTile', 'dragApPenalty', 'noDrag', 'consumptionEffects',
        'waterQuality', 'shelfLife', 'transformInto', 'produce', 'providesElectricity', 'fireMode',
        'availableFireModes'
      ];
      for (const field of itemFields) {
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