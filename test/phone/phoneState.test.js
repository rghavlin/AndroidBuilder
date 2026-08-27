// The phone as a permanent fixture: always issued, powered explicitly, and
// only ever able to act while switched on with charge left.
import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import {
  ensurePhone,
  getPhone,
  phoneCharges,
  phoneOnline,
  phoneBlockedReason,
  canTogglePhonePower,
  setPhonePower,
  PHONE_STARTING_CHARGE
} from '../../client/src/game/phone/Phone.js';
import engine from '../../client/src/game/GameEngine.js';

describe('phone/Phone — standard issue', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1 }).bootstrap();
  });

  it('grants an equipped phone with a 10-charge battery', () => {
    const phone = ensurePhone(engine.inventoryManager);

    expect(phone).toBeTruthy();
    expect(phone.defId).toBe('tool.smartphone');
    expect(engine.inventoryManager.equipment.phone).toBe(phone);
    expect(PHONE_STARTING_CHARGE).toBe(10);
    expect(phoneCharges(engine)).toBe(10);
  });

  it('is idempotent — a second call keeps the phone the player already carries', () => {
    const first = ensurePhone(engine.inventoryManager);
    first.consumeCharge(3);

    const second = ensurePhone(engine.inventoryManager);

    expect(second).toBe(first);
    expect(phoneCharges(engine)).toBe(7);
  });
});

describe('phone/Phone — power button', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1 }).bootstrap();
    ensurePhone(engine.inventoryManager);
  });

  it('starts switched off, and off means offline', () => {
    expect(engine.isPhoneOn).toBe(false);
    expect(phoneOnline(engine)).toBe(false);
    expect(phoneBlockedReason(engine)).toBe('Turn your phone on first.');
  });

  it('switching on spends a charge', () => {
    const result = setPhonePower(engine, true);

    expect(result.success).toBe(true);
    expect(engine.isPhoneOn).toBe(true);
    expect(phoneOnline(engine)).toBe(true);
    expect(phoneBlockedReason(engine)).toBeNull();
    expect(phoneCharges(engine)).toBe(9);
  });

  it('toggling off and back on within the same turn spends nothing extra', () => {
    setPhonePower(engine, true);
    expect(phoneCharges(engine)).toBe(9);

    setPhonePower(engine, false);
    setPhonePower(engine, true);

    expect(engine.isPhoneOn).toBe(true);
    expect(phoneCharges(engine)).toBe(9);
  });

  it('costs another charge once the turn advances', () => {
    setPhonePower(engine, true);
    setPhonePower(engine, false);

    engine.turn += 1;
    setPhonePower(engine, true);

    expect(phoneCharges(engine)).toBe(8);
  });

  it('refuses to switch on with a dead battery', () => {
    getPhone(engine).consumeCharge(PHONE_STARTING_CHARGE);
    expect(phoneCharges(engine)).toBe(0);

    const result = setPhonePower(engine, true);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('The phone battery is dead.');
    expect(engine.isPhoneOn).toBe(false);
    expect(canTogglePhonePower(engine)).toBe(false);
  });

  it('switching off drops the link to whatever was being steered', () => {
    setPhonePower(engine, true);
    engine.activeDeviceId = 'some-drone';

    const result = setPhonePower(engine, false);

    expect(result.linkDropped).toBe(true);
    expect(engine.activeDeviceId).toBeNull();
    expect(engine.isPhoneOn).toBe(false);
  });

  it('a phone that can be switched off can always be switched off', () => {
    setPhonePower(engine, true);
    getPhone(engine).consumeCharge(PHONE_STARTING_CHARGE);

    expect(canTogglePhonePower(engine)).toBe(true);
    expect(setPhonePower(engine, false).success).toBe(true);
  });
});

describe('phone/Phone — save round trip', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1 }).bootstrap();
    ensurePhone(engine.inventoryManager);
  });

  it('restores a phone that was left switched on', () => {
    engine.sync({
      gameMap: harness.gameMap,
      interactionState: { isPhoneOn: true, isPlayerTurn: true }
    });

    expect(engine.isPhoneOn).toBe(true);
  });

  it('never restores a switched-on phone whose battery is flat', () => {
    getPhone(engine).consumeCharge(PHONE_STARTING_CHARGE);

    engine.sync({
      gameMap: harness.gameMap,
      interactionState: { isPhoneOn: true, activeDeviceId: null, isPlayerTurn: true }
    });

    expect(engine.isPhoneOn).toBe(false);
  });

  it('defaults to off for saves written before the phone had a power switch', () => {
    engine.sync({
      gameMap: harness.gameMap,
      interactionState: { isPlayerTurn: true }
    });

    expect(engine.isPhoneOn).toBe(false);
  });
});
