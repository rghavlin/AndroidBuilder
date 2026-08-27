import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { Drone } from '../../client/src/game/entities/Drone.js';
import {
  consumeFlightCharge,
  canAffordFlight,
  droneChargesRemaining,
  consumeHoverCharge,
  consumePhoneChargeOncePerTurn
} from '../../client/src/game/remote/DronePower.js';
import engine from '../../client/src/game/GameEngine.js';

function freshBattery(charge) {
  const battery = new Item(createItemFromDef('tool.battery'));
  battery.ammoCount = charge;
  return battery;
}

function makeAirborneDrone(charge) {
  const landedItem = new Item(createItemFromDef('tool.recon_drone'));
  landedItem.attachItem('battery', freshBattery(charge));
  const drone = new Drone('d1', 5, 5, 'recon');
  drone.sourceItem = landedItem;
  return drone;
}

describe('remote/DronePower — fractional charge banking', () => {
  it('banks the fraction: 3 tiles at 0.5/tile drains 1 whole charge and keeps 0.5 banked', () => {
    const drone = makeAirborneDrone(20);
    const ok = consumeFlightCharge(drone, 3);
    expect(ok).toBe(true);
    expect(droneChargesRemaining(drone)).toBe(19);
    expect(drone._powerAccumulator).toBeCloseTo(0.5, 5);
  });

  it('a second 3-tile move drains 2 charges total (banked fraction carries over)', () => {
    const drone = makeAirborneDrone(20);
    consumeFlightCharge(drone, 3); // 1 charge, 0.5 banked
    consumeFlightCharge(drone, 3); // +1.5 -> 2.0 -> drains 2, 0 banked
    expect(droneChargesRemaining(drone)).toBe(20 - 1 - 2);
    expect(drone._powerAccumulator).toBeCloseTo(0, 5);
  });

  it('never touches the battery for a sub-whole-charge move', () => {
    const drone = makeAirborneDrone(20);
    consumeFlightCharge(drone, 1); // 0.5 banked, 0 whole
    expect(droneChargesRemaining(drone)).toBe(20);
    expect(drone._powerAccumulator).toBeCloseTo(0.5, 5);
  });

  it('canAffordFlight predicts consumeFlightCharge without mutating state', () => {
    const drone = makeAirborneDrone(1); // exactly 1 charge left
    // 3 tiles at 0.5/tile = 1.5 -> needs 1 whole charge (banked stays sub-whole
    // until a later move), affordable with exactly 1 charge.
    expect(canAffordFlight(drone, 3)).toBe(true);
    // 5 tiles = 2.5 -> needs 2 whole charges, NOT affordable with 1.
    expect(canAffordFlight(drone, 5)).toBe(false);
    // Prediction must not have mutated anything.
    expect(droneChargesRemaining(drone)).toBe(1);
    expect(drone._powerAccumulator).toBe(0);
  });

  it('refuses the move and leaves state untouched when the battery cannot cover it', () => {
    const drone = makeAirborneDrone(0);
    const ok = consumeFlightCharge(drone, 3);
    expect(ok).toBe(false);
    expect(droneChargesRemaining(drone)).toBe(0);
    expect(drone._powerAccumulator).toBe(0);
  });

  it('consumeHoverCharge drains exactly 1 whole charge per call', () => {
    const drone = makeAirborneDrone(2);
    expect(consumeHoverCharge(drone)).toBe(true);
    expect(droneChargesRemaining(drone)).toBe(1);
    expect(consumeHoverCharge(drone)).toBe(true);
    expect(droneChargesRemaining(drone)).toBe(0);
    expect(consumeHoverCharge(drone)).toBe(false);
    expect(droneChargesRemaining(drone)).toBe(0);
  });
});

describe('remote/DronePower — phone, once per turn', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1 }).bootstrap();
  });

  function equipPhone(charge) {
    const phone = harness.equipItemDef('tool.smartphone', 'phone');
    phone.attachItem('battery', freshBattery(charge));
    engine.isPhoneOn = true;
    return phone;
  }

  it('costs exactly 1 charge across activate -> cycle -> cycle -> deactivate -> reactivate within one turn', () => {
    const phone = equipPhone(20);

    // Simulate the button being pressed 5 times in the same turn (engine.turn
    // unchanged throughout) — activate, cycle, cycle, deactivate, reactivate.
    for (let i = 0; i < 5; i++) {
      consumePhoneChargeOncePerTurn(engine);
    }

    expect(phone.getBattery().ammoCount).toBe(19);
  });

  it('costs a second charge once the turn number advances', () => {
    const phone = equipPhone(20);
    consumePhoneChargeOncePerTurn(engine);
    expect(phone.getBattery().ammoCount).toBe(19);

    engine.turn += 1;
    consumePhoneChargeOncePerTurn(engine);
    expect(phone.getBattery().ammoCount).toBe(18);
  });

  it('returns false and does not throw when the phone battery is empty', () => {
    equipPhone(0);
    expect(consumePhoneChargeOncePerTurn(engine)).toBe(false);
  });

  it('returns false when no phone is equipped', () => {
    expect(consumePhoneChargeOncePerTurn(engine)).toBe(false);
  });
});
