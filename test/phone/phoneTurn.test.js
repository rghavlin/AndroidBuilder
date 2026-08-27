// The phone's end-of-turn upkeep. This used to live inside GameContext, where
// nothing headless could reach it; it is an engine module now, so these are the
// rules themselves rather than a copy of them.
import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Drone } from '../../client/src/game/entities/Drone.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { processPhoneTurn } from '../../client/src/game/phone/PhoneTurn.js';
import { ensurePhone, phoneCharges, PHONE_STARTING_CHARGE } from '../../client/src/game/phone/Phone.js';
import engine from '../../client/src/game/GameEngine.js';

describe('phone/PhoneTurn — per-turn drain', () => {
  let harness;

  /** An airborne drone the player operates, without spending a launch charge. */
  function flyDrone() {
    const drone = new Drone('drone-upkeep', 5, 5, 'recon');
    drone.operatorId = harness.player.id;
    harness.gameMap.addEntity(drone, 5, 5);
    return drone;
  }

  beforeEach(() => {
    harness = new GameHarness({ seed: 1, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    ensurePhone(engine.inventoryManager);
    engine.turn = 1;
    engine._phoneChargeTurn = null;
  });

  it('costs nothing while the phone is switched off, even with a drone in the air', () => {
    flyDrone();
    engine.isPhoneOn = false;

    const result = processPhoneTurn(engine);

    expect(result.drained).toBe(false);
    expect(result.died).toBe(false);
    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE);
  });

  it('costs nothing while switched on with nothing deployed or linked', () => {
    engine.isPhoneOn = true;
    engine.activeDeviceId = null;

    const result = processPhoneTurn(engine);

    expect(result.drained).toBe(false);
    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE);
    expect(engine.isPhoneOn).toBe(true);
  });

  it('spends a charge while a drone is airborne', () => {
    flyDrone();
    engine.isPhoneOn = true;

    const result = processPhoneTurn(engine);

    expect(result.drained).toBe(true);
    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE - 1);
  });

  it('spends a charge while linked to a device with nothing in the air', () => {
    engine.isPhoneOn = true;
    engine.activeDeviceId = 'some-wagon';

    processPhoneTurn(engine);

    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE - 1);
  });

  it('bills at most one charge per turn, however many times it runs', () => {
    flyDrone();
    engine.isPhoneOn = true;

    processPhoneTurn(engine);
    processPhoneTurn(engine);
    processPhoneTurn(engine);

    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE - 1);
  });

  it('bills again once the turn advances', () => {
    flyDrone();
    engine.isPhoneOn = true;

    processPhoneTurn(engine);
    engine.turn += 1;
    processPhoneTurn(engine);

    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE - 2);
  });
});

describe('phone/PhoneTurn — running out mid-flight', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    ensurePhone(engine.inventoryManager);
    engine.turn = 1;
    engine._phoneChargeTurn = null;

    const drone = new Drone('drone-dying', 5, 5, 'recon');
    drone.operatorId = harness.player.id;
    harness.gameMap.addEntity(drone, 5, 5);

    engine.isPhoneOn = true;
    engine.activeDeviceId = drone.id;
    engine.inventoryManager.equipment.phone.consumeCharge(PHONE_STARTING_CHARGE);
  });

  it('switches the phone off and reports it', () => {
    const result = processPhoneTurn(engine);

    expect(result.died).toBe(true);
    expect(result.drained).toBe(false);
    expect(result.message).toBe('The phone has died. You lose contact with your remote devices.');
    expect(engine.isPhoneOn).toBe(false);
  });

  it('drops the link, but leaves the drone flying on its own battery', () => {
    const result = processPhoneTurn(engine);

    expect(result.linkDropped).toBe(true);
    expect(engine.activeDeviceId).toBeNull();
    expect(harness.gameMap.getEntitiesByType('drone').length).toBe(1);
  });

  it('is idle from then on — a dead phone bills nothing', () => {
    processPhoneTurn(engine);
    engine.turn += 1;

    const result = processPhoneTurn(engine);

    expect(result.died).toBe(false);
    expect(result.message).toBeNull();
  });
});

// The harness runs the real step now, on the same clock the engine keeps.
describe('phone/PhoneTurn — through GameHarness.endTurn', () => {
  let harness;

  /** An airborne drone with its own battery, so the drone systems leave it up. */
  function flyDrone() {
    const landed = new Item(createItemFromDef('tool.recon_drone'));
    const cell = new Item(createItemFromDef('tool.battery'));
    cell.ammoCount = 40;
    landed.attachItem('battery', cell);

    const drone = new Drone('drone-endturn', 5, 5, 'recon');
    drone.operatorId = harness.player.id;
    drone.sourceItem = landed;
    harness.gameMap.addEntity(drone, 5, 5);
    return drone;
  }

  beforeEach(() => {
    harness = new GameHarness({ seed: 1, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    ensurePhone(engine.inventoryManager);
  });

  it('keeps one clock — harness.turn IS engine.turn', () => {
    expect(harness.turn).toBe(engine.turn);

    harness.endTurn();
    expect(harness.turn).toBe(engine.turn);

    engine.turn = 17;
    expect(harness.turn).toBe(17);

    harness.turn = 3;
    expect(engine.turn).toBe(3);
  });

  it('spends the turn charge for an airborne drone', () => {
    flyDrone();
    engine.isPhoneOn = true;

    harness.endTurn();

    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE - 1);
  });

  it('spends one charge per turn ended, now that the clock actually advances', () => {
    flyDrone();
    engine.isPhoneOn = true;

    harness.endTurn();
    harness.endTurn();
    harness.endTurn();

    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE - 3);
  });

  it('spends nothing while the phone is switched off', () => {
    flyDrone();
    engine.isPhoneOn = false;

    harness.endTurn();
    harness.endTurn();

    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE);
  });
});
