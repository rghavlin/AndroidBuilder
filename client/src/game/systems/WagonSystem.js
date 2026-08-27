import { RcVehicleConfig } from '../config/RcVehicleConfig.js';
import { getRcVehicle, driveBlockedReason } from '../remote/RcVehicle.js';
import { hasAutonomy } from '../remote/RemoteDeviceKinds.js';
import { findRcPath, sliceLegByAp } from '../remote/RcPathing.js';
import { relocateWagon } from '../remote/RcVehiclePlacement.js';
import { getOrders, clearOrder } from '../remote/AutoWagonOrders.js';
import { clearControlMode } from '../remote/DeviceControlMode.js';

/**
 * The wagons' turn. Every wagon carrying an autonomous controller and holding a
 * standing order advances as far toward it as its own AP budget allows, then
 * stops until next turn.
 *
 * Runs after DroneSystem and BEFORE TurretSystem in SimulationManager.runTurn,
 * which is the whole reason the move commits during simulation rather than
 * during playback: a turret riding in the wagon has to fire from the tile the
 * wagon actually reached this turn, not the one it left. Playback is cosmetic,
 * exactly like TURRET_SHOT — see RcVehiclePlacement for the full argument.
 *
 * The player pays nothing. The controller has its own AP pool (the auto
 * turret's, deliberately), so a wagon keeps its speed while the player is
 * exhausted, asleep, or ten screens away.
 */
export class WagonSystem {
  /**
   * @param {GameMap} gameMap
   * @param {GameEngine} engine
   * @param {Array} actionQueue - mutated in place with WAGON_MOVE actions
   * @param {Object} [context]
   * @param {boolean} [context.isSleeping] - no playback happens during sleep,
   *   so the render-coordinate rewind is skipped and nothing is queued
   */
  static process(gameMap, engine, actionQueue, { isSleeping = false } = {}) {
    if (!gameMap || !engine) return;

    const orders = getOrders(engine);
    if (orders.size === 0) return;

    // Sorted so two wagons contending for the same corridor resolve the same
    // way every run: the first relocates before the second paths, so the second
    // sees it and routes around.
    for (const key of [...orders.keys()].sort()) {
      try {
        WagonSystem.advanceWagon(key, gameMap, engine, actionQueue, isSleeping);
      } catch (err) {
        console.error(`[WagonSystem] Error advancing wagon ${key}:`, err);
      }
    }
  }

  /** One wagon's move. Extracted so a single bad wagon can't abort the phase. */
  static advanceWagon(key, gameMap, engine, actionQueue, isSleeping) {
    const orders = getOrders(engine);
    const order = orders.get(key);
    const device = getRcVehicle(engine, key);

    // Gone from both homes — picked up, destroyed, or scrapped for parts.
    // Also covers a controller swapped back out for a plain receiver.
    if (!device || !hasAutonomy(device.item)) {
      clearOrder(engine, key);
      clearControlMode(engine, key);
      return;
    }

    // Physically entangled: being dragged, ridden or towed. Keep the order —
    // the player will let go eventually and the wagon should resume.
    const blocked = driveBlockedReason(device.item, engine);
    if (blocked) {
      WagonSystem.noteBlocked(order, blocked, device, actionQueue, isSleeping);
      return;
    }

    if (device.x === order.x && device.y === order.y) {
      clearOrder(engine, key);
      return;
    }

    const path = findRcPath(device.x, device.y, order.x, order.y, engine, key);
    if (path.length <= 1) {
      // Transiently blocked (a zombie in the doorway) looks identical to
      // permanently walled off, so give it several turns before giving up
      // rather than cancelling on the first obstruction.
      order.failedTurns = (order.failedTurns || 0) + 1;
      if (order.failedTurns >= RcVehicleConfig.AUTO_MAX_FAILED_TURNS) {
        clearOrder(engine, key);
        WagonSystem.queueNotice(actionQueue, key,
          `The ${device.item.name} can't find a route and gives up.`, isSleeping);
      }
      return;
    }

    const { leg } = sliceLegByAp(path, device.item, gameMap, RcVehicleConfig.AUTONOMOUS_MAX_AP);

    // Priced out of even one step. driveBlockedReason catches a dead motor, but
    // a heavy wagon on a partial motor set can still cost more per tile than the
    // controller's whole budget. Hold position; a fresh cell fixes it.
    if (leg.length <= 1) {
      WagonSystem.noteBlocked(order, 'Not enough power to move', device, actionQueue, isSleeping);
      return;
    }

    order.failedTurns = 0;
    order.lastBlockReason = null;

    const from = { x: device.x, y: device.y };
    const dest = leg[leg.length - 1];

    device.item.consumeMotorPower(leg.length - 1);

    // Authoritative NOW, before TurretSystem runs.
    const entity = relocateWagon(device, dest.x, dest.y, engine);

    const arrived = dest.x === order.x && dest.y === order.y;
    if (arrived) clearOrder(engine, key);

    if (isSleeping) return; // nothing will ever play this back

    // setItemsOnTile snaps render coords to the destination unconditionally, so
    // rewind them to where the wagon started and let the tween carry it across.
    // logicalX/gridX stay at the destination — those are what the sim reads.
    if (entity) {
      entity.renderX = from.x;
      entity.renderY = from.y;
    }

    actionQueue.push({
      type: 'WAGON_MOVE',
      entityId: key,
      data: {
        path: leg,
        to: dest,
        log: arrived ? `The ${device.item.name} arrives at its destination.` : null
      }
    });
  }

  /**
   * Record why a wagon stayed put and, the first turn it happens, tell the
   * player. Repeating it every turn would bury the log while the player hauls
   * the thing around by hand.
   */
  static noteBlocked(order, reason, device, actionQueue, isSleeping) {
    if (order.lastBlockReason === reason) return;
    order.lastBlockReason = reason;
    WagonSystem.queueNotice(actionQueue, device.item.instanceId,
      `The ${device.item.name} can't move: ${reason.toLowerCase()}.`, isSleeping);
  }

  /** A WAGON_MOVE carrying only a log line — no path, nothing to animate. */
  static queueNotice(actionQueue, key, log, isSleeping) {
    if (isSleeping) return;
    actionQueue.push({ type: 'WAGON_MOVE', entityId: key, data: { path: [], log } });
  }
}
