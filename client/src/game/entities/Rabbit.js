import { Entity, EntityType } from './Entity.js';

/**
 * Rabbit entity with fleeing AI behavior
 */
export class Rabbit extends Entity {
  constructor(id, x = 0, y = 0) {
    super(id, EntityType.RABBIT, x, y);
    this.blocksMovement = true; // Rabbits block movement (can be hit)
    this.blocksSight = false; // Rabbits don't block sight

    // Rabbit-specific stats
    this.hp = 5;
    this.maxHp = 5;
    this.maxAP = 25; // Extremely fast
    this.currentAP = 25;
    
    // Animation state for smooth movement (Phase 11)
    this.movementPath = []; // Array of {x, y} coordinates for the current turn
    this.isAnimating = false;
    this.animationProgress = 0; // 0.0 to 1.0
    
    this.isActive = false; // Whether it's this rabbit's turn
  }

  /**
   * Take damage from an attack
   * @param {number} amount - Amount of damage to take
   * @returns {Object} - Result of the attack
   */
  takeDamage(amount) {
    const oldHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);

    this.emitEvent('rabbitDamageTaken', {
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
   * Check if the rabbit is dead
   * @returns {boolean}
   */
  isDead() {
    return this.hp <= 0;
  }

  /**
   * Reset rabbit for new turn
   */
  startTurn() {
    this.currentAP = this.maxAP;
    this.isActive = true;
    // Initialize movementPath with current position for animation tracking
    this.movementPath = [{ x: this.x, y: this.y }];
  }

  /**
   * End rabbit's turn
   */
  endTurn() {
    this.currentAP = 0;
    this.isActive = false;
  }

  /**
   * Use AP for an action
   * @param {number} amount - Amount of AP to use
   * @returns {boolean} - Whether the AP was successfully used
   */
  useAP(amount) {
    if (this.currentAP >= amount) {
      this.currentAP = Math.round((this.currentAP - amount) * 10) / 10;
      this.emitEvent('rabbitAPUsed', {
        used: amount,
        remaining: this.currentAP
      });
      return true;
    }
    return false;
  }

  /**
   * Serialize rabbit to JSON
   */
  toJSON() {
    return {
      ...super.toJSON(),
      hp: this.hp,
      maxHp: this.maxHp,
      maxAP: this.maxAP,
      currentAP: this.currentAP,
      isActive: this.isActive,
      movementPath: this.movementPath,
      isAnimating: this.isAnimating,
      animationProgress: this.animationProgress
    };
  }

  /**
   * Create Rabbit from JSON data
   */
  static fromJSON(data) {
    const rabbit = new Rabbit(data.id, data.x, data.y);
    rabbit.hp = data.hp || 5;
    rabbit.maxHp = data.maxHp || 5;
    rabbit.maxAP = data.maxAP || 25;
    rabbit.currentAP = data.currentAP || 25;
    rabbit.isActive = data.isActive || false;
    rabbit.movementPath = data.movementPath || [];
    rabbit.isAnimating = data.isAnimating || false;
    rabbit.animationProgress = data.animationProgress || 0;
    return rabbit;
  }
}
