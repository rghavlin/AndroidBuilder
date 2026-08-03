import { land } from '../remote/RemoteDeviceRegistry.js';
import { consumeHoverCharge } from '../remote/DronePower.js';

const DRONE_TYPE = 'drone';

/**
 * Per-turn upkeep for deployed remote devices: hover drain now, autonomous
 * pathing later (Phase 4 of the roadmap — same slot, same call site).
 *
 * Runs before TurretSystem in SimulationManager.runTurn so a future
 * autonomous drone can carry a turret into range before it fires, without
 * renegotiating turn order when that phase lands.
 */
export class DroneSystem {
  /**
   * @param {GameMap} gameMap
   * @param {GameEngine} engine
   * @param {Array} actionQueue - mutated in place with log/SOUND actions
   */
  static process(gameMap, engine, actionQueue) {
    if (!gameMap || typeof gameMap.getEntitiesByType !== 'function') return;
    const drones = gameMap.getEntitiesByType(DRONE_TYPE) || [];

    for (const drone of drones) {
      if (!drone) continue;
      if (!consumeHoverCharge(drone)) {
        // Synthetic entityId matching TurretAI's own power-down SOUND action
        // (ai/TurretAI.js) — kept for consistency even though TurnManager's
        // entity-not-found guard currently drops both silently.
        const droneId = drone.id;
        const result = land(drone, engine, { chargeAp: false });
        actionQueue.push({
          type: 'SOUND',
          entityId: `drone_${droneId}`,
          metadata: { sound: 'power_down' },
          data: { x: result.x, y: result.y }
        });
        console.log(`[DroneSystem] Drone ${droneId} ran out of charge and landed at (${result.x}, ${result.y}).`);
      }
    }
  }
}
