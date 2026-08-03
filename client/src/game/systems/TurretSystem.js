import { TurretAI } from '../ai/TurretAI.js';
import { getExposedTurretTargets, TURRET_DEF_ID, removeDestroyedTurret } from '../ai/TurretCombat.js';
import { gridItems } from '../inventory/gridUtils.js';

/**
 * Turret turn orchestration + destruction cleanup, extracted from
 * SimulationManager (CODE_QUALITY_ACTION_PLAN.md Wave 4). Turrets are Items
 * with no Position component, so they can live in three places on a tile
 * (standalone map entity, nested in a wagon/container grid, or detached into
 * the player's ground container while standing on their tile) — every method
 * here has to account for all three.
 */
export class TurretSystem {
  /**
   * Fire every powered-on turret on the map (standalone or nested in a
   * vehicle/container), targeting the player, zombies, npcs, and any exposed
   * enemy turrets. Runs first in the turn — immediately after the player's
   * turn, before zombies/rabbits/NPCs act.
   * @param {GameMap} gameMap
   * @param {GameEngine} engine
   * @param {Array} actionQueue - mutated in place with fired TURRET_SHOT actions
   * @param {{player: Object, zombies?: Array, npcs?: Array}} context
   */
  static process(gameMap, engine, actionQueue, { player, zombies = [], npcs = [] }) {
    const playerX = player ? player.logicalX : null;
    const playerY = player ? player.logicalY : null;

    // Faction-based candidate targets for all turrets: living player + zombies +
    // npcs, plus exposed (non-shielded) enemy turret entities. TurretAI filters
    // these to the ones each turret is hostile toward.
    const livingTargets = [player, ...zombies, ...npcs].filter(
      e => e && (e.hp === undefined || e.hp > 0) && !e.hasExited
    );
    const exposedTurrets = getExposedTurretTargets(gameMap, [player, ...npcs]);
    const turretTargets = [...livingTargets, ...exposedTurrets];

    // Fire one item if it is an active turret, OR recurse into its container
    // (vehicles/wagons can carry a turret in their grid). Shared by the on-map
    // scan and the ground-container scan so both behave identically.
    const fireTurretFromItem = (item, atX, atY) => {
      if (!item) return;
      if (item.defId === TURRET_DEF_ID && item.isOn) {
        try {
          const result = TurretAI.executeTurretTurn(item, atX, atY, gameMap, turretTargets);
          if (result.actions?.length) actionQueue.push(...result.actions);
        } catch (err) {
          console.error(`[TurretSystem] Error processing turret ${item.instanceId || item.id}:`, err);
        }
        return;
      }
      // Lazy-resolve the container: after a load, containerGrid stays null
      // until getContainerGrid() initializes it from _containerGridData. Using
      // the raw property here would silently skip turrets inside unopened
      // vehicles/wagons until the player happens to open them in the UI.
      // (cleanupDestroyed below already resolves lazily — keep in sync.)
      let containerGrid = item.containerGrid;
      if (!containerGrid && typeof item.getContainerGrid === 'function') {
        containerGrid = item.getContainerGrid();
      }
      if (containerGrid) {
        const nestedItems = gridItems(containerGrid);
        for (const nestedItem of nestedItems) {
          fireTurretFromItem(nestedItem, atX, atY);
        }
      }
    };

    // On-map items (placed turrets, vehicles on the ground away from the player).
    // Items lacking coordinates are handled by the ground-container scan below
    // (they're detached from the map when the player stands on their tile), so
    // skip them here rather than guessing the player's position.
    for (const item of gameMap.getEntitiesByType('item')) {
      if (!item) continue;
      if (item.logicalX === undefined || item.logicalY === undefined) continue;
      fireTurretFromItem(item, item.logicalX, item.logicalY);
    }

    // Player's ground container. When the player stands ON a turret's tile (or a
    // wagon carrying one), that tile's items are loaded into the ground container
    // and detached from the map's entityMap, so the on-map scan above would miss
    // them. Fire those from the player's tile, recursing into wagons/containers.
    const groundItems = engine?.inventoryManager?.groundContainer?.getAllItems?.() || [];
    for (const item of groundItems) {
      fireTurretFromItem(item, playerX, playerY);
    }
  }

  /**
   * Scan for destroyed turrets (standalone or nested) and remove them.
   * @param {GameMap} gameMap
   * @param {GameEngine} engine
   * @param {Object} player
   * @returns {boolean} true if any turret was cleaned up
   */
  static cleanupDestroyed(gameMap, engine, player) {
    const playerX = player ? player.logicalX : null;
    const playerY = player ? player.logicalY : null;
    let diedAny = false;

    const checkAndCleanTurret = (item, atX, atY) => {
      if (!item) return false;

      if (item.defId === TURRET_DEF_ID) {
        const isDead = typeof item.isDead === 'function' ? item.isDead() : (item.hp !== undefined && item.hp <= 0);
        if (isDead) {
          console.log(`[TurretSystem] Destroyed turret ${item.id || item.instanceId} detected at (${atX}, ${atY}). Cleaning up...`);
          removeDestroyedTurret(item, gameMap, atX, atY);
          return true;
        }
        return false;
      }

      let containerGrid = item.containerGrid;
      if (!containerGrid && typeof item.getContainerGrid === 'function') {
        containerGrid = item.getContainerGrid();
      }
      if (containerGrid) {
        const nestedItems = gridItems(containerGrid);

        let cleanedAny = false;
        for (const nestedItem of nestedItems) {
          if (nestedItem) {
            if (checkAndCleanTurret(nestedItem, atX, atY)) {
              cleanedAny = true;
            }
          }
        }
        return cleanedAny;
      }
      return false;
    };

    // 1. Scan on-map items
    const mapItems = gameMap.getEntitiesByType('item') || [];
    for (const item of mapItems) {
      if (!item) continue;
      const itemX = item.logicalX !== undefined ? item.logicalX : playerX;
      const itemY = item.logicalY !== undefined ? item.logicalY : playerY;
      if (checkAndCleanTurret(item, itemX, itemY)) {
        diedAny = true;
      }
    }

    // 2. Scan player's ground container items
    const groundItems = engine?.inventoryManager?.groundContainer?.getAllItems?.() || [];
    for (const item of groundItems) {
      if (checkAndCleanTurret(item, playerX, playerY)) {
        diedAny = true;
      }
    }

    return diedAny;
  }
}
