import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';
import { LineOfSight } from '../utils/LineOfSight.js';
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

const COMPONENT_CLASSES = {
  Position,
  Health,
  Renderable,
  Movable,
  InventoryContainer,
  AIBehavior,
  LightEmitter,
  MoveIntent,
  DamageIntent
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
    this._hp = 20;
    this.maxHp = 20;
    this._ap = 20;
    this.maxAp = 20;
    this.currentAP = 20;
    this.maxAP = 20;
    this.name = 'Entity';
    this.isHostile = false;
    this.typeId = 'survivor';
    this.equippedWeaponId = null;
    this.behaviorState = 'idle';
    this.currentTarget = null;
    this.hasDemanded = false;
    this.hasExtorted = false;
    this.sightRange = 18;
    this.heardNoise = false;
    this.noiseCoords = { x: 0, y: 0 };
    this.noiseBlacklist = [];
    this.recentThreats = [];
    this.goalTarget = null;
    this.hasExited = false;
    this.currentPath = null;
    this.stunnedTurns = 0;
    this._nutrition = 25;
    this.maxNutrition = 25;
    this._hydration = 25;
    this.maxHydration = 25;
    this._energy = 25;
    this.maxEnergy = 25;
    this._condition = 'Normal';
    this.sickness = 0;
    this.isBleeding = false;
    this.isStarving = false;
    this.isDehydrated = false;
    this.pendingAPRefill = null;
    this._meleeKills = 0;
    this.meleeLvl = 0;
    this._rangedKills = 0;
    this.rangedLvl = 0;
    this._craftingApUsed = 0;
    this.craftingLvl = 0;
    this.movementPath = [];
    this.isAnimating = false;
    this.animationProgress = 0;
    this.inventory = null;

    // ECS AI & Alertness States
    this.lastSeen = false;
    this.targetSightedCoords = { x: 0, y: 0 };
    this.lastScentSequence = 0;
    this.isAlerted = false;
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
    return health ? health.current : this._hp;
  }
  set hp(val) {
    const health = this.getComponent('Health');
    if (health) {
      health.current = Math.max(0, Math.min(health.max, val));
      health.isDead = health.current <= 0;
    } else {
      this._hp = val;
    }
    this.notifyChange();
  }

  get maxHp() {
    const health = this.getComponent('Health');
    return health ? health.max : this._maxHp || 20;
  }
  set maxHp(val) {
    const health = this.getComponent('Health');
    if (health) {
      health.max = val;
    } else {
      this._maxHp = val;
    }
    this.notifyChange();
  }

  get ap() { return this._ap; }
  set ap(val) { this._ap = val; this.notifyChange(); }

  get currentAP() { return this._ap; }
  set currentAP(val) { this._ap = val; this.notifyChange(); }

  get maxAP() { return this.maxAp; }
  set maxAP(val) { this.maxAp = val; this.notifyChange(); }

  get nutrition() { return this._nutrition; }
  set nutrition(v) {
    this._nutrition = v;
    if (this._nutrition <= 0 && !this.isStarving) {
      this.isStarving = true;
    } else if (this._nutrition > 0 && this.isStarving) {
      this.isStarving = false;
    }
    this.notifyChange();
  }

  get hydration() { return this._hydration; }
  set hydration(v) {
    this._hydration = v;
    if (this._hydration <= 0 && !this.isDehydrated) {
      this.isDehydrated = true;
    } else if (this._hydration > 0 && this.isDehydrated) {
      this.isDehydrated = false;
    }
    this.notifyChange();
  }

  get energy() { return this._energy; }
  set energy(v) { this._energy = v; this.notifyChange(); }

  get condition() { return this._condition; }
  set condition(v) { this._condition = v; this.notifyChange(); }

  get meleeKills() { return this._meleeKills; }
  set meleeKills(v) { this._meleeKills = v; this.notifyChange(); }

  get rangedKills() { return this._rangedKills; }
  set rangedKills(v) { this._rangedKills = v; this.notifyChange(); }

  get craftingApUsed() { return this._craftingApUsed; }
  set craftingApUsed(v) { this._craftingApUsed = v; this.notifyChange(); }

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
    const currentVal = this.ap !== undefined ? this.ap : this.currentAP;
    if (currentVal >= amount) {
      const nextVal = Math.round((currentVal - amount) * 10) / 10;
      if (this.ap !== undefined) this.ap = nextVal;
      if (this.currentAP !== undefined) this.currentAP = nextVal;
      this.emitEvent('apUsed', { used: amount, remaining: nextVal });
      this.notifyChange();
      return true;
    }
    return false;
  }

  restoreAP(amount) {
    const currentVal = this.ap !== undefined ? this.ap : this.currentAP;
    const maxVal = this.maxAp !== undefined ? this.maxAp : this.maxAP;
    const oldVal = currentVal;
    const nextVal = Math.round(Math.min(currentVal + amount, maxVal) * 10) / 10;
    if (this.ap !== undefined) this.ap = nextVal;
    if (this.currentAP !== undefined) this.currentAP = nextVal;
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

  onItemCrafted(apUsed = 1) {
    this.craftingApUsed += apUsed;
    const nextTarget = 10 * Math.pow(2, this.craftingLvl);
    if (this.craftingApUsed >= nextTarget) {
      this.craftingLvl++;
    }
    this.notifyChange();
  }

  recordKill(type) {
    const isMelee = type === 'melee';
    const currentLevel = isMelee ? this.meleeLvl : this.rangedLvl;
    this.modifyStat(isMelee ? 'meleeKills' : 'rangedKills', 1);
    const nextMilestone = 5 * Math.pow(2, currentLevel);
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
    const maxVal = this.maxAp !== undefined ? this.maxAp : this.maxAP;
    if (this.ap !== undefined) this.ap = this.stunnedTurns > 0 ? 0 : maxVal;
    if (this.currentAP !== undefined) this.currentAP = this.stunnedTurns > 0 ? 0 : maxVal;
    this.isActive = true;
    this.wasAttackedThisTurn = false;
    this.movementPath = [{ x: this.logicalX, y: this.logicalY }];
    if (this.behaviorState === 'fleeing' && this.fleeRecoverChance !== undefined && Math.random() < this.fleeRecoverChance) {
      this.behaviorState = 'idle';
    }
  }

  endTurn() {
    if (this.stunnedTurns > 0) this.stunnedTurns--;
    if (this.ap !== undefined) this.ap = 0;
    if (this.currentAP !== undefined) this.currentAP = 0;
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
    if (this.type === 'npc') {
      this.emitEvent('npcNoiseHeard', { npcId: this.id, noiseCoords: { x, y } });
    }
  }

  clearNoiseHeard() {
    this.heardNoise = false;
    this.noiseCoords = { x: 0, y: 0 };
  }

  setTargetSighted(x, y) {
    if (x === 0 && y === 0 && (Math.abs(this.logicalX) > 2 || Math.abs(this.logicalY) > 2)) {
      console.warn(`[Entity] ${this.id} rejected invalid LKP at (0,0) from (${this.logicalX}, ${this.logicalY})`);
      return;
    }
    this.lastSeen = true;
    this.targetSightedCoords = { x, y };
    this.emitEvent('zombieTargetSighted', {
      zombieId: this.id,
      targetCoords: { x, y }
    });
  }

  clearLastSeen() {
    this.lastSeen = false;
    this.targetSightedCoords = { x: 0, y: 0 };
    this.lastScentSequence = 0;
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
    return {
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
      behaviorState: this.behaviorState,
      currentTarget: this.currentTarget,
      typeId: this.typeId,
      hasDemanded: this.hasDemanded,
      hasExtorted: this.hasExtorted,
      sightRange: this.sightRange,
      heardNoise: this.heardNoise,
      noiseCoords: this.noiseCoords,
      noiseBlacklist: this.noiseBlacklist,
      recentThreats: this.recentThreats,
      goalTarget: this.goalTarget,
      hasExited: this.hasExited,
      currentPath: this.currentPath,
      stunnedTurns: this.stunnedTurns,
      lastSeen: this.lastSeen,
      targetSightedCoords: this.targetSightedCoords,
      lastScentSequence: this.lastScentSequence,
      isAlerted: this.isAlerted,
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
      isStarving: this.isStarving,
      isDehydrated: this.isDehydrated,
      meleeKills: this.meleeKills,
      meleeLvl: this.meleeLvl,
      rangedKills: this.rangedKills,
      rangedLvl: this.rangedLvl,
      craftingApUsed: this.craftingApUsed,
      craftingLvl: this.craftingLvl,
      inventory: this.inventory ? this.inventory.toJSON() : null,
      components: Object.fromEntries(this.components)
    };
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
    if (data.hp !== undefined) entity._hp = data.hp;
    if (data.maxHp !== undefined) entity.maxHp = data.maxHp;
    if (data.ap !== undefined) {
      entity._ap = data.ap;
      entity.currentAP = data.ap;
    }
    if (data.maxAp !== undefined) {
      entity.maxAp = data.maxAp;
      entity.maxAP = data.maxAp;
    }
    if (data.name !== undefined) entity.name = data.name;
    if (data.isHostile !== undefined) entity.isHostile = data.isHostile;
    if (data.typeId !== undefined) entity.typeId = data.typeId;
    if (data.equippedWeaponId !== undefined) entity.equippedWeaponId = data.equippedWeaponId;
    if (data.behaviorState !== undefined) entity.behaviorState = data.behaviorState;
    if (data.currentTarget !== undefined) entity.currentTarget = data.currentTarget;
    if (data.hasDemanded !== undefined) entity.hasDemanded = data.hasDemanded;
    if (data.hasExtorted !== undefined) entity.hasExtorted = data.hasExtorted;
    if (data.sightRange !== undefined) entity.sightRange = data.sightRange;
    if (data.heardNoise !== undefined) entity.heardNoise = data.heardNoise;
    if (data.noiseCoords !== undefined) entity.noiseCoords = data.noiseCoords;
    if (data.noiseBlacklist !== undefined) entity.noiseBlacklist = data.noiseBlacklist;
    if (data.recentThreats !== undefined) entity.recentThreats = data.recentThreats;
    if (data.goalTarget !== undefined) entity.goalTarget = data.goalTarget;
    if (data.hasExited !== undefined) entity.hasExited = data.hasExited;
    if (data.currentPath !== undefined) entity.currentPath = data.currentPath;
    if (data.stunnedTurns !== undefined) entity.stunnedTurns = data.stunnedTurns;
    if (data.lastSeen !== undefined) entity.lastSeen = data.lastSeen;
    if (data.targetSightedCoords !== undefined) entity.targetSightedCoords = data.targetSightedCoords;
    if (data.lastScentSequence !== undefined) entity.lastScentSequence = data.lastScentSequence;
    if (data.isAlerted !== undefined) entity.isAlerted = data.isAlerted;
    if (data.isActive !== undefined) entity.isActive = data.isActive;
    if (data.nutrition !== undefined) entity._nutrition = data.nutrition;
    if (data.maxNutrition !== undefined) entity.maxNutrition = data.maxNutrition;
    if (data.hydration !== undefined) entity._hydration = data.hydration;
    if (data.maxHydration !== undefined) entity.maxHydration = data.maxHydration;
    if (data.energy !== undefined) entity._energy = data.energy;
    if (data.maxEnergy !== undefined) entity.maxEnergy = data.maxEnergy;
    if (data.condition !== undefined) entity._condition = data.condition;
    if (data.sickness !== undefined) entity.sickness = data.sickness;
    if (data.isBleeding !== undefined) entity.isBleeding = data.isBleeding;
    if (data.isStarving !== undefined) entity.isStarving = data.isStarving;
    if (data.isDehydrated !== undefined) entity.isDehydrated = data.isDehydrated;
    if (data.meleeKills !== undefined) entity._meleeKills = data.meleeKills;
    if (data.meleeLvl !== undefined) entity.meleeLvl = data.meleeLvl;
    if (data.rangedKills !== undefined) entity._rangedKills = data.rangedKills;
    if (data.rangedLvl !== undefined) entity.rangedLvl = data.rangedLvl;
    if (data.craftingApUsed !== undefined) entity._craftingApUsed = data.craftingApUsed;
    if (data.craftingLvl !== undefined) entity.craftingLvl = data.craftingLvl;

    if (data.inventory) {
      import('../inventory/Container.js').then(({ Container }) => {
        entity.inventory = Container.fromJSON(data.inventory);
      });
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