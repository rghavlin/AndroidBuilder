import { Entity } from './Entity.js';
import { LineOfSight } from '../utils/LineOfSight.js';

/**
 * Zombie entity with AI behavior for turn-based zombie survival game
 * Implements behavior patterns from ZombieInfo.md
 */
export class Zombie extends Entity {
  constructor(id, x = 0, y = 0, subtype = 'basic') {
    super(id, 'zombie', x, y);
    this.subtype = subtype;
    this.blocksMovement = true; // Zombies block movement
    this.blocksSight = false; // Zombies don't block sight

    // Zombie-specific properties from ZombieInfo.md
    this.lastSeen = false; // Has the zombie lost sight of player recently?
    this.heardNoise = false; // Has the zombie heard a noise?
    this.targetSightedCoords = { x: 0, y: 0 }; // Last known player position
    this.noiseCoords = { x: 0, y: 0 }; // Location of heard noise
    this.maxAP = 8; // Maximum action points
    this.currentAP = 8; // Current action points
    this.sightRange = 18; // Sight distance as specified

    // Current behavior state
    this.behaviorState = 'idle'; // 'idle', 'pursuing', 'investigating', 'wandering'
    this.isActive = false; // Whether it's this zombie's turn

    // Combat stats
    this.hp = 10;
    this.maxHp = 10;
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
  }

  /**
   * End zombie's turn
   */
  endTurn() {
    this.currentAP = 0;
    this.isActive = false;
    this.behaviorState = 'idle';
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

    let nextX = this.x;
    let nextY = this.y;

    // Calculate the differences
    const deltaX = targetX - this.x;
    const deltaY = targetY - this.y;

    // If we're adjacent to target, prioritize cardinal moves over diagonal
    if (Math.abs(deltaX) === 1 && Math.abs(deltaY) === 1) {
      // We're diagonally adjacent - try to move to a cardinal position
      // Prefer horizontal movement first, then vertical
      if (deltaX !== 0) {
        nextX = this.x + (deltaX > 0 ? 1 : -1);
      } else if (deltaY !== 0) {
        nextY = this.y + (deltaY > 0 ? 1 : -1);
      }
    } else {
      // Move one step closer on the axis with the greatest distance
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Move horizontally
        nextX = this.x + (deltaX > 0 ? 1 : -1);
      } else if (Math.abs(deltaY) > 0) {
        // Move vertically
        nextY = this.y + (deltaY > 0 ? 1 : -1);
      }
    }

    return { x: nextX, y: nextY };
  }

  /**
   * Serialize zombie to JSON
   */
  toJSON() {
    return {
      ...super.toJSON(),
      subtype: this.subtype,
      lastSeen: this.lastSeen,
      heardNoise: this.heardNoise,
      targetSightedCoords: this.targetSightedCoords,
      noiseCoords: this.noiseCoords,
      maxAP: this.maxAP,
      currentAP: this.currentAP,
      sightRange: this.sightRange,
      behaviorState: this.behaviorState,
      isActive: this.isActive
    };
  }

  /**
   * Create Zombie from JSON data
   */
  static fromJSON(data) {
    const zombie = new Zombie(data.id, data.x, data.y, data.subtype);
    zombie.lastSeen = data.lastSeen || false;
    zombie.heardNoise = data.heardNoise || false;
    zombie.targetSightedCoords = data.targetSightedCoords || { x: 0, y: 0 };
    zombie.noiseCoords = data.noiseCoords || { x: 0, y: 0 };
    zombie.maxAP = data.maxAP || 8;
    zombie.currentAP = data.currentAP || 8;
    zombie.sightRange = data.sightRange || 18;
    zombie.behaviorState = data.behaviorState || 'idle';
    zombie.isActive = data.isActive || false;
    return zombie;
  }
}