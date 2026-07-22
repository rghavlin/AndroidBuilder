import { Entity, EntityType } from './Entity.js';
import { AIState } from '../components/AIState.js';
import { Burnable } from '../components/Burnable.js';
import { SequencerAction } from '../managers/SequencerAction.js';
import engine from '../GameEngine.js';

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
    
    // Add components
    this.addComponent(new AIState({ behaviorState: 'idle' }));
    this.addComponent(new Burnable({ fireTurns: 0 }));
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
    this.movementPath = [{ x: this.logicalX, y: this.logicalY }];
  }

  /**
   * End rabbit's turn
   */
  endTurn() {
    this.currentAP = 0;
    this.isActive = false;
    this.renderX = this.gridX;
    this.renderY = this.gridY;
    this.x = this.gridX;
    this.y = this.gridY;
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

      //this.isAnimating = true;

      const duration = 100; // Rabbits are fast!
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

    return Promise.resolve();
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
    // Use ?? not ||: hp 0 (dead) and currentAP 0 (spent) are valid saved values
    // that || would silently reset to full.
    rabbit.hp = data.hp ?? 5;
    rabbit.maxHp = data.maxHp ?? 5;
    rabbit.maxAP = data.maxAP ?? 25;
    rabbit.currentAP = data.currentAP ?? 25;
    rabbit.isActive = data.isActive ?? false;
    rabbit.movementPath = data.movementPath ?? [];
    rabbit.isAnimating = data.isAnimating ?? false;
    rabbit.animationProgress = data.animationProgress ?? 0;
    rabbit.gridX = data.gridX !== undefined ? data.gridX : (data.logicalX !== undefined ? data.logicalX : data.x);
    rabbit.gridY = data.gridY !== undefined ? data.gridY : (data.logicalY !== undefined ? data.logicalY : data.y);
    rabbit.renderX = data.x;
    rabbit.renderY = data.y;
    rabbit.logicalX = rabbit.gridX;
    rabbit.logicalY = rabbit.gridY;

    return rabbit;
  }
}
