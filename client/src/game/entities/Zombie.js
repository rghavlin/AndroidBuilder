import { Entity, EntityType } from './Entity.js';
import { ZombieTypes } from './ZombieTypes.js';
import { LineOfSight } from '../utils/LineOfSight.js';

/**
 * Zombie entity with AI behavior for turn-based zombie survival game
 */
export class Zombie extends Entity {
  constructor(id, x = 0, y = 0, subtype = 'basic') {
    super(id, EntityType.ZOMBIE, x, y, subtype);
    
    // 1. Load data from ZombieTypes config
    const stats = ZombieTypes[subtype] || ZombieTypes.basic;
    this.subtype = subtype;
    this.name = stats.name || 'Zombie';
    this.maxHp = stats.hp || 10;
    this.hp = this.maxHp;
    this.maxAP = stats.maxAP || 12;
    this.currentAP = this.maxAP;
    this.sightRange = stats.sightRange || 15;
    
    // Movement multipliers (used by ZombieAI)
    this.moveCostMultiplier = stats.moveCostMultiplier || 1.0;
    this.canPassWindows = stats.canPassWindows !== undefined ? stats.canPassWindows : true;

    // 2. Default entity behaviors
    this.blocksMovement = true; 
    this.blocksSight = false; 

    // 3. AI State properties
    this.lastSeen = false; 
    this.heardNoise = false; 
    this.targetSightedCoords = { x: 0, y: 0 }; 
    this.noiseCoords = { x: 0, y: 0 }; 
    this.interactionMemory = 0; 

    // Current behavior state
    this.behaviorState = 'idle'; // 'idle', 'pursuing', 'investigating', 'wandering'
    this.isActive = false; // Whether it's this zombie's turn
    this.isAlerted = false; // Persistent flag for "spotted player" sound trigger
    this.lastScentSequence = 0; // Last scent in the trail this zombie followed
    this.lastDirection = null; // Direction vector {x, y} when player was last seen
    this.momentumSteps = 0; // Remaining steps to move in lastDirection after losing sight
    
    // Myopic Targeting System
    this.currentTarget = null; // { type: 'entity'|'tile', id: string, x: number, y: number }

    this.movementPath = []; // Array of {x, y} coordinates for the current turn
    this.isAnimating = false;
    this.animationProgress = 0; // 0.0 to 1.0
  }

  /**
   * Get the movement cost multiplier for this zombie
   * @returns {number}
   */
  getMovementMultiplier() {
    return this.moveCostMultiplier || 1.0;
  }

  /**
   * Take damage from an attack
   * @param {number} amount - Amount of damage to take
   */
  takeDamage(amount) {
    const oldHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);

    this.emitEvent('zombieDamageTaken', {
      amount,
      oldHp,
      currentHp: this.hp,
      maxHp: this.maxHp
    });

    return {
      damageDealt: amount,
      isDead: this.hp <= 0
    };
  }

  /**
   * Check if the zombie is dead
   * @returns {boolean}
   */
  isDead() {
    return this.hp <= 0;
  }

  /**
   * Reset zombie for new turn
   */
  startTurn() {
    this.currentAP = this.maxAP;
    this.isActive = true;
    this.behaviorState = 'idle';
    // Initialize movementPath with current position for animation tracking
    this.movementPath = [{ x: this.x, y: this.y }];
  }

  /**
   * End zombie's turn
   */
  endTurn() {
    this.currentAP = 0;
    this.isActive = false;
    this.behaviorState = 'idle';
    // movementPath is preserved until explicitly cleared or start of next turn
  }

  /**
   * Use AP for an action
   * @param {number} amount - Amount of AP to use
   * @returns {boolean} - Whether the AP was successfully used
   */
  useAP(amount) {
    if (this.currentAP >= amount) {
      this.currentAP = Math.round((this.currentAP - amount) * 10) / 10;
      this.emitEvent('zombieAPUsed', {
        used: amount,
        remaining: this.currentAP
      });
      return true;
    }
    return false;
  }

  /**
   * Set target sighted coordinates when player exits line of sight
   * @param {number} x - X coordinate where player was last seen
   * @param {number} y - Y coordinate where player was last seen
   */
  setTargetSighted(x, y) {
    this.lastSeen = true;
    this.targetSightedCoords = { x, y };
    this.emitEvent('zombieTargetSighted', {
      zombieId: this.id,
      targetCoords: { x, y }
    });
  }

  /**
   * Clear the last seen flag (called when zombie reaches target)
   */
  clearLastSeen() {
    this.lastSeen = false;
    this.targetSightedCoords = { x: 0, y: 0 };
    this.lastScentSequence = 0;
  }

  /**
   * Set noise heard coordinates
   * @param {number} x - X coordinate of noise source
   * @param {number} y - Y coordinate of noise source
   */
  setNoiseHeard(x, y) {
    this.heardNoise = true;
    this.noiseCoords = { x, y };
    this.emitEvent('zombieNoiseHeard', {
      zombieId: this.id,
      noiseCoords: { x, y }
    });
  }

  /**
   * Clear the heard noise flag
   */
  clearNoiseHeard() {
    this.heardNoise = false;
    this.noiseCoords = { x: 0, y: 0 };
  }

  /**
   * Check if zombie can see a target position using LineOfSight
   * @param {GameMap} gameMap - The game map
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @returns {boolean} - Whether zombie can see the target
   */
  canSeePosition(gameMap, targetX, targetY) {
    const losResult = LineOfSight.hasLineOfSight(
      gameMap,
      this.x,
      this.y,
      targetX,
      targetY,
      {
        maxRange: this.sightRange,
        ignoreTerrain: [], // Empty array means don't ignore any terrain
        ignoreEntities: [] // Zombies don't ignore any entities for sight
      }
    );

    return losResult.hasLineOfSight;
  }

  /**
   * Check if zombie can see a specific entity
   * @param {GameMap} gameMap - The game map
   * @param {Entity} entity - The target entity
   * @returns {boolean} - Whether zombie can see the entity
   */
  canSeeEntity(gameMap, entity) {
    return this.canSeePosition(gameMap, entity.x, entity.y);
  }

  /**
   * Calculate Manhattan distance to a position
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   * @returns {number} - Manhattan distance
   */
  getDistanceTo(x, y) {
    return Math.abs(this.x - x) + Math.abs(this.y - y);
  }

  /**
   * Check if zombie is adjacent to a position (cardinal directions only)
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   * @returns {boolean} - Whether zombie is cardinally adjacent
   */
  isAdjacentTo(x, y) {
    const distance = this.getDistanceTo(x, y);
    return distance === 1 && (this.x === x || this.y === y);
  }

  /**
   * Get next move towards a target position
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @returns {Object} - Next move coordinates {x, y} or null if already at target
   */
  getNextMoveTowards(targetX, targetY) {
    if (this.x === targetX && this.y === targetY) {
      return null; // Already at target
    }

    // Calculate the differences
    const deltaX = targetX - this.x;
    const deltaY = targetY - this.y;

    // Move one step closer on both axes for diagonal, or just one for cardinal
    const nextX = this.x + (deltaX === 0 ? 0 : (deltaX > 0 ? 1 : -1));
    const nextY = this.y + (deltaY === 0 ? 0 : (deltaY > 0 ? 1 : -1));

    return { x: nextX, y: nextY };
  }

  /**
   * Serialize zombie to JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: 'zombie',
      subtype: this.subtype,
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      lastSeen: this.lastSeen,
      heardNoise: this.heardNoise,
      targetSightedCoords: this.targetSightedCoords,
      noiseCoords: this.noiseCoords,
      maxAP: this.maxAP,
      currentAP: this.currentAP,
      sightRange: this.sightRange,
      behaviorState: this.behaviorState,
      isActive: this.isActive,
      isAlerted: this.isAlerted,
      lastScentSequence: this.lastScentSequence,
      interactionMemory: this.interactionMemory,
      lastDirection: this.lastDirection,
      momentumSteps: this.momentumSteps
    };
  }

  /**
   * Create Zombie from JSON data
   */
  static fromJSON(data) {
    const zombie = new Zombie(data.id, data.x, data.y, data.subtype);
    zombie.lastSeen = !!data.lastSeen;
    zombie.heardNoise = !!data.heardNoise;
    zombie.targetSightedCoords = data.targetSightedCoords || { x: 0, y: 0 };
    zombie.noiseCoords = data.noiseCoords || { x: 0, y: 0 };
    zombie.sightRange = data.sightRange || 18;
    zombie.behaviorState = data.behaviorState || 'idle';
    zombie.isActive = data.isActive || false;
    zombie.isAlerted = data.isAlerted || false;
    zombie.lastScentSequence = data.lastScentSequence || 0;
    zombie.interactionMemory = data.interactionMemory || 0;
    zombie.lastDirection = data.lastDirection || null;
    zombie.hp = data.hp !== undefined ? data.hp : (data.maxHP || 10);
    zombie.x = data.x;
    zombie.y = data.y;
    
    // Reset ALL transient rendering state on load 
    zombie.isMoving = false;
    zombie.movementStartTime = null;
    zombie.movementPath = [];
    zombie.isAnimating = false;
    zombie.animationProgress = 0;
    zombie.prevX = data.x;
    zombie.prevY = data.y;
    
    return zombie;
  }
}