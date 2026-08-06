
import { ItemTrait } from '../inventory/traits.js';
import { RcVehicleConfig } from '../config/RcVehicleConfig.js';

const { REMOTE_AP_SURCHARGE, MIN_AP_PER_TILE: MIN_REMOTE_AP_PER_TILE } = RcVehicleConfig;

/**
 * Largest drag reduction Strength alone can provide (reached at Strength 100).
 * The Cargo Wagon's base penalty deliberately exceeds this, so muscle alone can
 * never zero it out — its motors stay relevant for the whole game.
 */
export const MAX_STRENGTH_DRAG_BONUS = 5;

/**
 * VehicleUtils - Shared logic for vehicle movement and drag mechanics
 *
 * The AP model this implements:
 *   - On foot:            1.0 AP per cardinal tile (1.4 diagonal), the baseline.
 *   - Riding:             0.5 AP per tile. The fastest the game ever gets.
 *   - Dragging a wagon:   baseline + max(0, base - motors - assist). Clamped at
 *                         zero, so a wagon can only ever cost AP, never grant
 *                         speed. The one exception is a powered tow-cart, whose
 *                         ride bonus still applies to the hitched pair.
 *   - Driving one by RC:  max(0, base - motors) + 1, Strength-free. Always the
 *                         most expensive way to move a wagon a tile — you're
 *                         buying the round trip you didn't walk.
 */
export const VehicleUtils = {
  /**
   * Drag reduction from raw muscle, in AP per tile.
   * +0.5 AP for every 10 points of Strength, capped at +5 (Strength 100).
   * Callers pass `currentStrength`, so the survival cascade (starving,
   * exhausted) weakens hauling along with everything else.
   *
   * @param {number} strength
   * @returns {number} 0 .. MAX_STRENGTH_DRAG_BONUS, always a multiple of 0.5
   */
  strengthDragBonus(strength) {
    const raw = Math.floor(Math.max(0, strength || 0) / 10) * 0.5;
    return Math.min(MAX_STRENGTH_DRAG_BONUS, raw);
  },

  /**
   * AP this single item adds to one step, before any terrain discount.
   *
   * This is the single source of truth for drag cost — the movement math and
   * every tooltip that quotes a penalty must go through here, or they drift
   * apart (which is exactly what used to happen).
   *
   * @param {Item} item
   * @param {Object} [context] - { playerStrength = 20, riddenItemId = null, itemArray = [] }
   * @returns {number} >= 0
   */
  getStepDragPenalty(item, context = {}) {
    if (!item) return 0;

    const playerStrength = context.playerStrength ?? 20;
    const riddenItemId = context.riddenItemId ?? null;
    const itemArray = context.itemArray ?? [];

    const basePenalty = item.dragApPenalty ?? 2;

    let motorAssist = 0;
    if (item.hasTrait?.(ItemTrait.WAGON) && typeof item.getMotorizedBonus === 'function') {
      motorAssist = item.getMotorizedBonus();
    }

    // Tow assist: a hitched wagon behind a cart that's currently being ridden is
    // pulled by the cart's motors, not by the player's back.
    let towAssist = 0;
    if (item.hitchedToInstanceId) {
      const cart = itemArray.find(it => it.instanceId === item.hitchedToInstanceId);
      if (cart && riddenItemId === cart.instanceId && typeof cart.getTowBonus === 'function') {
        towAssist = cart.getTowBonus();
      }
    }

    // max(), not sum: muscle and tow assist never stack. A powered cart always
    // out-pulls Strength, so Strength effectively stops mattering while towing —
    // but if the cart's batteries die, this falls back to muscle instead of
    // leaving the wagon harder to move than if it were hand-pulled.
    const assist = Math.max(this.strengthDragBonus(playerStrength), towAssist);

    return Math.max(0, basePenalty - motorAssist - assist);
  },

  /**
   * AP one REMOTE-driven step costs, before terrain — the RC-receiver path.
   *
   * Deliberately Strength-free: nobody is pulling this, the motors are, so the
   * muscle discount and the 1.0 walk baseline both drop out. The +1 surcharge
   * is what's left of the player's own contribution when they aren't there,
   * and it keeps remote driving strictly worse than walking the wagon over
   * yourself. Fully motorized: Toy 2, Wagon 4, Cargo 6 AP/tile.
   *
   * @param {Item} item
   * @returns {number} >= REMOTE_AP_SURCHARGE
   */
  getRemoteStepPenalty(item) {
    if (!item) return 0;

    const basePenalty = item.dragApPenalty ?? 2;

    let motorAssist = 0;
    if (item.hasTrait?.(ItemTrait.WAGON) && typeof item.getMotorizedBonus === 'function') {
      motorAssist = item.getMotorizedBonus();
    }

    return Math.max(0, basePenalty - motorAssist) + REMOTE_AP_SURCHARGE;
  },

  /**
   * AP for ONE remote step onto `tile`, terrain included.
   *
   * The per-tile atom every remote cost is built from: the player-driven total
   * below, and the autonomous controller's per-turn budget walker
   * (remote/RcPathing.js). Both must price a tile identically or a wagon would
   * quote one distance and drive another, so the rule lives here alone.
   *
   * @param {Item} item
   * @param {Tile|null} tile
   * @param {number} [perStep] - precomputed getRemoteStepPenalty(item). It is
   *   loop-invariant, and resolving it allocates (getMotorizedBonus builds its
   *   slot-pair table on every call), so callers walking a path hoist it out.
   * @returns {number} >= MIN_AP_PER_TILE
   */
  remoteStepCost(item, tile, perStep = this.getRemoteStepPenalty(item)) {
    return Math.max(
      MIN_REMOTE_AP_PER_TILE,
      perStep + this.getTerrainDiscount([item], tile)
    );
  },

  /**
   * Total AP for a whole remote drive. Single source of truth for both the
   * hover preview and the actual charge — the drone's two costs drifted apart
   * exactly once, and a lockstep test is why they no longer can.
   *
   * The 0.5 floor is applied PER STEP rather than to the whole path (which is
   * what calculateDragCost does): the two differ over mixed terrain, and
   * per-step is what "never cheaper than 0.5 a tile" means for a vehicle that
   * crosses road and grass in one drive.
   *
   * @param {Item} item
   * @param {Array<{x:number,y:number}>} path - includes the start tile
   * @param {GameMap} gameMap
   * @returns {number} AP, rounded to one decimal
   */
  calculateRemoteDriveCost(item, path, gameMap) {
    if (!item || !path || path.length <= 1) return 0;

    const perStep = this.getRemoteStepPenalty(item);

    let total = 0;
    for (let i = 1; i < path.length; i++) {
      const tile = gameMap ? gameMap.getTile(path[i].x, path[i].y) : null;
      total += this.remoteStepCost(item, tile, perStep);
    }

    return Math.round(total * 10) / 10;
  },

  /**
   * Per-step AP discount from riding, or 0 if the player isn't getting one.
   *
   * The ride bonus is withheld unless every other active item is hitched to the
   * ridden cart: you can't ride a scooter while hand-pulling a wagon and still
   * collect the discount. Without this, drag penalties clamped to zero could be
   * undercut by the ride bonus and a wagon would end up making you faster.
   */
  getRideBonus(itemArray, riddenItemId) {
    if (!riddenItemId) return 0;

    const ridden = itemArray.find(it => it.instanceId === riddenItemId);
    if (!ridden || typeof ridden.getScooterRideBonus !== 'function') return 0;

    const towedOnly = itemArray.every(it => it === ridden || it.hitchedToInstanceId === riddenItemId);
    if (!towedOnly) return 0;

    return ridden.getScooterRideBonus();
  },

  /**
   * Terrain discount for one step, applied once to the whole group rather than
   * once per vehicle — a cart plus its towed wagon used to claim -0.5 each.
   * An item's own `terrainModifiers` (specialised tires) wins over the general
   * road/sidewalk discount.
   */
  getTerrainDiscount(items, tile) {
    if (!tile) return 0;

    for (const item of items) {
      const mod = item?.terrainModifiers?.[tile.terrain];
      if (mod !== undefined) return mod;
    }

    if (tile.terrain === 'road' || tile.terrain === 'sidewalk') return -0.5;
    return 0;
  },

  /**
   * Calculate the total AP cost for moving along a path while dragging/riding.
   *
   * T5: caller supplies the player/riding context — this module must not
   * import the engine singleton.
   *
   * `baseMovementCost` should be computed with the sprint discount suppressed
   * (see Pathfinding.calculateMovementCost's `sprintBonus` option); you don't
   * build up a run while hauling a wagon.
   *
   * @param {Item|Array} items - The item(s) being dragged/ridden
   * @param {Array} path - Array of {x, y} coordinates
   * @param {GameMap} gameMap - The map instance for terrain lookup
   * @param {number} baseMovementCost - The player's base walking cost for this path
   * @param {Object} [context] - { playerStrength = 20, riddenItemId = null }
   * @returns {number} - Final AP cost
   */
  calculateDragCost(items, path, gameMap, baseMovementCost, context = {}) {
    const playerStrength = context.playerStrength ?? 20;
    const riddenItemId = context.riddenItemId ?? null;

    if (!items || !path || path.length <= 1) return baseMovementCost;

    const itemArray = Array.isArray(items) ? items : [items].filter(Boolean);
    if (itemArray.length === 0) return baseMovementCost;

    const steps = path.length - 1;
    const rideBonus = this.getRideBonus(itemArray, riddenItemId);

    // A vehicle you're actively riding doesn't resist you. A vehicle you're
    // "riding" with dead batteries is just a heavy thing you're pushing, so it
    // keeps its drag penalty.
    const draggedItems = rideBonus > 0
      ? itemArray.filter(it => it.instanceId !== riddenItemId)
      : itemArray;

    const penaltyContext = { playerStrength, riddenItemId, itemArray };

    let totalDragPenalty = 0;
    if (draggedItems.length > 0) {
      for (let i = 1; i < path.length; i++) {
        const tile = gameMap ? gameMap.getTile(path[i].x, path[i].y) : null;

        let stepPenalty = 0;
        for (const item of draggedItems) {
          stepPenalty += this.getStepDragPenalty(item, penaltyContext);
        }

        // Roads make hauling easier; they never make you faster than walking.
        stepPenalty = Math.max(0, stepPenalty + this.getTerrainDiscount(draggedItems, tile));
        totalDragPenalty += stepPenalty;
      }
    }

    const totalCost = baseMovementCost + totalDragPenalty - (rideBonus * steps);

    // Hard speed cap: nothing in the game moves faster than 0.5 AP per tile.
    return Math.max(0.5 * steps, totalCost);
  }
};
