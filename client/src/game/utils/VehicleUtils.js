
import { ItemTrait } from '../inventory/traits.js';

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
