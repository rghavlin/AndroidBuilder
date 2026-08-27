import { listControllables, focusPointOf } from './RemoteDeviceRegistry.js';
import { hasAutonomy } from './RemoteDeviceKinds.js';
import { consumePhoneChargeOncePerTurn } from './DronePower.js';
import { phoneBlockedReason } from '../phone/Phone.js';

/**
 * Linking the phone to one remote device — the operation behind the phone's
 * device list and its hang-up button.
 *
 * In the engine rather than in a React context so the headless harness runs the
 * same rules the game does. It returns the line to show the player instead of
 * logging it, and never plays a sound: the log and the audio belong to the UI.
 */

/**
 * Point the phone at the device with this key, or pass null to hand control
 * back to the player.
 *
 * Linking only VIEWS a device. A grounded drone is simply snapped to (it stays
 * powered down and contributes no vision); putting it in the air is the
 * separate, explicit launch command. Camera target IS control target —
 * GameMapContext's click-to-move reads engine.activeDeviceId directly.
 *
 * Releasing (key === null) is always allowed and always free. A phone that has
 * gone dark must never strand the camera on a device the player can no longer
 * steer, so the charge and power checks deliberately sit on the linking side
 * only.
 *
 * @param {GameEngine} engine
 * @param {string|null} key - a controllable's key (see listControllables)
 * @returns {{success: boolean, message: string|null, tone: string}}
 */
export function linkDevice(engine, key) {
  if (!engine?.player || !engine.gameMap) {
    return { success: false, message: null, tone: 'error' };
  }

  if (key === null) {
    const wasLinked = engine.activeDeviceId !== null;
    engine.activeDeviceId = null;
    centerOn(engine, null);
    engine.notifyUpdate();
    return {
      success: true,
      message: wasLinked ? 'You take back control.' : null,
      tone: 'info'
    };
  }

  const blocked = phoneBlockedReason(engine);
  if (blocked) {
    return { success: false, message: blocked, tone: 'error' };
  }

  const target = listControllables(engine).find(d => d.key === key);
  if (!target) {
    return { success: false, message: 'That device no longer answers.', tone: 'error' };
  }

  consumePhoneChargeOncePerTurn(engine);
  engine.activeDeviceId = key;
  // Nothing to set here: how a device is driven belongs to the device, not to
  // the act of linking (see remote/DeviceControlMode.js).
  centerOn(engine, target);
  engine.notifyUpdate();

  return { success: true, message: linkMessage(target), tone: 'info' };
}

/**
 * focusPointOf, never the device's own x/y: a device at the player's feet is an
 * Item in the ground container whose x/y are cells inside that container, not
 * map tiles. Reading them directly sent the camera to (0, 0).
 */
function centerOn(engine, target) {
  if (!engine.camera) return;
  const focus = focusPointOf(target, engine);
  engine.camera.centerOn(focus.x, focus.y);
}

/** What the player needs to know about the thing they just linked to. */
function linkMessage(target) {
  if (target.kind === 'rc-vehicle') {
    return hasAutonomy(target.item)
      ? `Linked to the ${target.item.name}. Click a tile to drive it, or right-click the phone to send it on its own.`
      : `Linked to the ${target.item.name}. Click a tile to drive it.`;
  }
  if (target.kind === 'drone-ground') {
    return 'Linked to a grounded drone. Right-click the phone to launch it.';
  }
  return null;
}
