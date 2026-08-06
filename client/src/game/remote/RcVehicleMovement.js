import { VehicleUtils } from '../utils/VehicleUtils.js';
import { RcVehicleConfig } from '../config/RcVehicleConfig.js';
import { getActiveRcVehicle, driveBlockedReason } from './RcVehicle.js';
import { findRcPath } from './RcPathing.js';
import { materializeGhost, finishDrive } from './RcVehiclePlacement.js';
import { tweenAlongPath } from './RemoteTween.js';

/**
 * Click-to-drive for the active RC wagon. A player-turn action outside the
 * simulation loop — same as the player's own movement — so this is called
 * directly from GameMapContext, not through TurnManager.
 *
 * The wagon ROLLS, which is the opposite of the drone's "high ceilings
 * everywhere" rule: terrain, walls, closed doors and blocking entities all stop
 * it. Those rules live in RcPathing, shared with the autonomous controller.
 *
 * The Item, not the map entity, is canonical for the duration of a drive. An
 * on-map wagon entity holds raw JSON attachments, so the battery it spends has
 * to be spent on the real Item and that Item re-placed at the destination — the
 * same remove-and-place dance launch()/land() do for the drone.
 *
 * This drive animates and THEN commits; the autonomous one commits first. See
 * RcVehiclePlacement for why that asymmetry is deliberate.
 */

function pathForDevice(device, x, y, engine) {
  return findRcPath(device.x, device.y, x, y, engine, device.item.instanceId);
}

/**
 * Cost preview for the hover tooltip — must return the exact same numbers
 * driveActiveVehicle will charge, or the preview and the real cost drift.
 * @returns {{possible: boolean, tiles?: number, apCost?: number, canAfford?: boolean, reason?: string}|null}
 */
export function previewDriveCost(x, y, engine) {
  const device = getActiveRcVehicle(engine);
  if (!device) return null;

  const reason = driveBlockedReason(device.item, engine);
  if (reason) return { possible: false, reason };

  const path = pathForDevice(device, x, y, engine);
  if (path.length === 0) return { possible: false, reason: 'No path' };

  // findPath's return includes the start tile (path[0]) — the number of actual
  // steps is one less than the node count.
  const tiles = path.length - 1;
  const apCost = VehicleUtils.calculateRemoteDriveCost(device.item, path, engine.gameMap);
  const canAfford = engine.player ? engine.player.ap >= apCost : false;

  return { possible: true, tiles, apCost, canAfford };
}

/**
 * Drive the active RC wagon to (x, y): spend player AP + the wagon's motor
 * batteries, then tween it along the path.
 *
 * `engine.activeDeviceId` is left alone throughout — it's the item's
 * instanceId, which is stable across both homes and the ghost.
 */
export function driveActiveVehicle(x, y, engine) {
  const device = getActiveRcVehicle(engine);
  const player = engine?.player;
  if (!device || !player || !engine.gameMap) {
    return Promise.resolve({ success: false, reason: 'No active device' });
  }

  const blocked = driveBlockedReason(device.item, engine);
  if (blocked) return Promise.resolve({ success: false, reason: blocked });

  const path = pathForDevice(device, x, y, engine);
  if (path.length <= 1) return Promise.resolve({ success: false, reason: 'No path' });

  const tiles = path.length - 1;
  const apCost = VehicleUtils.calculateRemoteDriveCost(device.item, path, engine.gameMap);

  if (apCost > player.ap) return Promise.resolve({ success: false, reason: 'Not enough AP' });
  if (!player.useAP(apCost)) return Promise.resolve({ success: false, reason: 'Not enough AP' });

  // No battery pre-check: consumeMotorPower clamps at zero, exactly as it does
  // when the wagon is hand-dragged. Driving until the batteries die at the far
  // end of the map is the intended consequence, not an error state.
  device.item.consumeMotorPower(tiles);

  const ghost = materializeGhost(device, engine);
  const target = path[path.length - 1];
  const result = { success: true, tiles, apCost };

  // No ghost means nothing to animate (the tile write failed); the wagon still
  // has to arrive, or the AP and charge were spent for nothing.
  if (!ghost) {
    finishDrive(device, null, target.x, target.y, engine);
    return Promise.resolve(result);
  }

  return tweenAlongPath(ghost, path, engine, { msPerTile: RcVehicleConfig.MS_PER_TILE },
    () => finishDrive(device, ghost, target.x, target.y, engine)
  ).then(() => result);
}
