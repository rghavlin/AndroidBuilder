import { Item } from '../inventory/Item.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { consumePhoneChargeOncePerTurn } from '../remote/DronePower.js';

/**
 * The player's smartphone: a permanent fixture, not a slot the player fills.
 *
 * The phone still lives in `inventoryManager.equipment.phone` — that key is the
 * single home every consumer already reads (DronePower, RemoteDeviceRegistry,
 * the save format). What changed is who may touch it: the equipment grid no
 * longer renders a phone slot, so nothing in the UI can equip or unequip one.
 * The player starts with it and keeps it; spare smartphones found as loot are
 * crafting material and battery donors only.
 *
 * Power is a separate axis from "is a phone present". A phone with a dead
 * battery is still equipped, it just can't be switched on — see phoneOnline.
 */

export const PHONE_DEF_ID = 'tool.smartphone';

/** Charges in the battery the player's starting phone ships with. */
export const PHONE_STARTING_CHARGE = 10;

/** The player's phone, or null before the inventory exists. */
export function getPhone(engineOrInv) {
  const inv = engineOrInv?.inventoryManager || engineOrInv;
  return inv?.equipment?.phone || null;
}

/** Charges left in the phone's battery (0 with no phone or no battery). */
export function phoneCharges(engineOrInv) {
  const phone = getPhone(engineOrInv);
  return phone?.getCharges ? phone.getCharges() : 0;
}

/**
 * Whether the phone can currently do anything at all: present, switched on,
 * and with charge left. Every phone-mediated command gates on this, so a
 * powered-down phone flies nothing and issues no orders.
 */
export function phoneOnline(engine) {
  return !!engine?.isPhoneOn && phoneCharges(engine) > 0;
}

/**
 * Why the phone can't act right now, or null when it can. Single-sourced so
 * every phone-mediated command refuses with the same words.
 */
export function phoneBlockedReason(engine) {
  if (!getPhone(engine)) return 'You have no phone.';
  if (phoneCharges(engine) <= 0) return 'The phone battery is dead.';
  if (!engine?.isPhoneOn) return 'Turn your phone on first.';
  return null;
}

/** Whether pressing the power button would currently do anything. */
export function canTogglePhonePower(engine) {
  if (engine?.isPhoneOn) return true;      // switching off always works
  return phoneCharges(engine) > 0;         // switching on needs charge
}

/**
 * Give the player a phone if they don't have one, with a fresh battery.
 * Idempotent: called both when a new game hands out starting clothes and after
 * a save is restored, so games saved before the phone became standard issue
 * don't leave the player permanently phoneless.
 * @returns {Item|null} the phone (existing or newly granted)
 */
export function ensurePhone(inventoryManager, { charge = PHONE_STARTING_CHARGE } = {}) {
  if (!inventoryManager) return null;

  const existing = inventoryManager.equipment?.phone;
  if (existing) return existing;

  const def = createItemFromDef(PHONE_DEF_ID);
  if (!def) return null;

  const phone = new Item(def);
  const battery = new Item(createItemFromDef('tool.battery', { ammoCount: charge }));
  phone.attachItem('battery', battery);

  const result = inventoryManager.equipItem(phone);
  if (!result?.success) {
    console.warn('[Phone] Failed to grant starting phone:', result?.reason);
    return null;
  }
  return phone;
}

/**
 * Press the power button.
 *
 * Switching ON costs a charge, spent through the same once-per-turn stamp as
 * every other phone action: powering on and then linking to a device in the
 * same turn is one charge total, and toggling off/on to dodge the per-turn
 * drain buys nothing.
 *
 * Switching OFF drops the link to whatever device was being steered. Anything
 * already airborne stays airborne on its own battery — losing the phone loses
 * control, not the hardware.
 *
 * @returns {{success: boolean, on: boolean, reason?: string, linkDropped?: boolean}}
 */
export function setPhonePower(engine, on) {
  if (!engine) return { success: false, on: false, reason: 'Engine not ready' };

  if (!getPhone(engine)) {
    return { success: false, on: false, reason: 'No phone' };
  }

  if (on) {
    if (engine.isPhoneOn) return { success: true, on: true };
    if (phoneCharges(engine) <= 0) {
      return { success: false, on: false, reason: 'The phone battery is dead.' };
    }
    if (!consumePhoneChargeOncePerTurn(engine)) {
      return { success: false, on: false, reason: 'The phone battery is dead.' };
    }
    engine.isPhoneOn = true;
    return { success: true, on: true };
  }

  const linkDropped = !!engine.activeDeviceId;
  engine.isPhoneOn = false;
  engine.activeDeviceId = null;
  return { success: true, on: false, linkDropped };
}
