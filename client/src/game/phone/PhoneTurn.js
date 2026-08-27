import { listDevices, focusPointOf } from '../remote/RemoteDeviceRegistry.js';
import { consumePhoneChargeOncePerTurn } from '../remote/DronePower.js';
import { setPhonePower } from './Phone.js';

/**
 * The phone's end-of-turn upkeep, in the engine rather than in a React context
 * so the headless harness runs the same code the game does.
 *
 * Returns what happened instead of logging it: the message is player-facing
 * text and the caller owns the log, matching AutoWagonOrders.setDestination.
 */

const IDLE = Object.freeze({ drained: false, died: false, linkDropped: false, message: null });

/**
 * Spend the turn's phone charge, if the phone is doing anything worth paying
 * for: a device airborne, or a live link to one. A phone switched on in the
 * player's pocket with nothing deployed costs nothing.
 *
 * The drain is capped at one charge per turn by consumePhoneChargeOncePerTurn's
 * turn stamp, which the same turn's commands (linking, ordering a wagon) share
 * — a turn where the player already paid to link is not billed twice.
 *
 * Running out is the same event as pressing the power button off: the screen
 * goes dark and every link with it. Anything already airborne stays airborne on
 * its own battery, and a wagon stays where it is; what is lost is control and
 * the vision that came with it, until the phone is recharged and switched on.
 *
 * @param {GameEngine} engine
 * @returns {{drained: boolean, died: boolean, linkDropped: boolean, message: string|null}}
 */
export function processPhoneTurn(engine) {
  if (!engine?.isPhoneOn || !engine.player || !engine.gameMap) return IDLE;

  const inUse = listDevices(engine.gameMap, engine.player.id).length > 0 || !!engine.activeDeviceId;
  if (!inUse) return IDLE;

  if (consumePhoneChargeOncePerTurn(engine)) {
    return { drained: true, died: false, linkDropped: false, message: null };
  }

  const { linkDropped } = setPhonePower(engine, false);
  if (linkDropped && engine.camera) {
    // focusPointOf(null) is the player's own tile — read the same way the
    // release-control path reads it, never off a device's container-grid x/y.
    const focus = focusPointOf(null, engine);
    engine.camera.centerOn(focus.x, focus.y);
  }

  return {
    drained: false,
    died: true,
    linkDropped,
    message: 'The phone has died. You lose contact with your remote devices.'
  };
}
