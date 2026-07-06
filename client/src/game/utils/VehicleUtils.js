
import { ItemTrait } from '../inventory/traits.js';
import engine from '../GameEngine.js';

/**
 * VehicleUtils - Shared logic for vehicle movement and drag mechanics
 */
export const VehicleUtils = {
  /**
   * Calculate the total AP cost for dragging an item across a path.
   * Extracts logic from GameMapContext to centralize motorized bonuses and terrain discounts.
   * 
   * @param {Item|Array} items - The item(s) being dragged/ridden
   * @param {Array} path - Array of {x, y} coordinates
   * @param {GameMap} gameMap - The map instance for terrain lookup
   * @param {number} baseMovementCost - The player's base walking cost for this path
   * @returns {number} - Final AP cost
   */
  calculateDragCost(items, path, gameMap, baseMovementCost) {
    if (!items || !path || path.length <= 1) return baseMovementCost;

    const itemArray = Array.isArray(items) ? items : [items].filter(Boolean);
    if (itemArray.length === 0) return baseMovementCost;

    let totalDragPenalty = 0;

    // Iterate through each step in the path
    for (let i = 1; i < path.length; i++) {
      const tile = gameMap.getTile(path[i].x, path[i].y);
      let stepCombinedPenalty = 0;
      let appliedGeneralRoadDiscount = false;

      // Calculate the raw penalty/bonus for each active item at this step
      for (const item of itemArray) {
        const basePenalty = item.dragApPenalty ?? 2;
        let motorBonusValue = 0;
        
        if (item.hasTrait?.(ItemTrait.WAGON) && typeof item.getMotorizedBonus === 'function') {
          motorBonusValue = item.getMotorizedBonus();
        }

        const playerStrength = engine?.player?.currentStrength ?? 20;
        const strengthBonus = Math.floor(playerStrength / 20); // +1 AP drag bonus for every 20 points of Strength
        let itemStepPenalty = Math.max(0, basePenalty - motorBonusValue - strengthBonus);
        const originalPenalty = itemStepPenalty;
        
        // Scooter ride mode: REDUCES AP cost instead of increasing it
        if (item.hasTrait?.(ItemTrait.SCOOTER) && typeof item.getScooterRideBonus === 'function') {
          const rideBonus = item.getScooterRideBonus();
          if (rideBonus > 0) {
            itemStepPenalty = -(rideBonus);
          }
        }
        
        let terrainMod = 0;
        // Item-specific terrain modifiers (e.g. specialized tires)
        if (tile && item.terrainModifiers && item.terrainModifiers[tile.terrain] !== undefined) {
          terrainMod = item.terrainModifiers[tile.terrain];
        } else if (tile && (tile.terrain === 'road' || tile.terrain === 'sidewalk')) {
          // General road discount: Apply ONLY ONCE per step for the whole group 
          // to prevent stacking 'free movement' when using multiple vehicles.
          if (!appliedGeneralRoadDiscount) {
            terrainMod = -0.5;
            appliedGeneralRoadDiscount = true;
          }
        }
        
        let finalItemStepPenalty = itemStepPenalty + terrainMod;
        if (item.hasTrait && !item.hasTrait(ItemTrait.SCOOTER)) {
          finalItemStepPenalty = Math.max(0, finalItemStepPenalty);
        }
        stepCombinedPenalty += finalItemStepPenalty;
        
        if (itemArray.length > 1 && i === 1) {
           console.debug(`[VehicleUtils] Step 1 Analysis for ${item.name}: Base=${originalPenalty}, RideBonus=${itemStepPenalty < 0 ? -itemStepPenalty : 0}, Terrain=${terrainMod} -> Total=${finalItemStepPenalty}`);
        }
      }
      
      totalDragPenalty += stepCombinedPenalty;
    }

    const totalCost = baseMovementCost + totalDragPenalty;
    const finalCost = Math.max(0.5 * (path.length - 1), totalCost);
    
    if (itemArray.length > 1) {
      console.log(`[VehicleUtils] 🧮 Multi-item AP Calc: Base ${baseMovementCost.toFixed(1)} + Combined Penalty ${totalDragPenalty.toFixed(2)} = ${finalCost.toFixed(2)} AP`);
      console.log(`[VehicleUtils] Items: ${itemArray.map(it => it.name).join(', ')}`);
    }
    
    return finalCost;
  }
};
