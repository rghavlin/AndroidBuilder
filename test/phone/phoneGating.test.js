// Every phone-mediated command goes through phoneBlockedReason, so a handset
// that is switched off — or switched on with a flat battery — commands nothing.
// The success paths are covered by the drone/wagon suites; what is pinned here
// is the refusal, which is the half that regresses silently.
import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import * as RemoteDeviceRegistry from '../../client/src/game/remote/RemoteDeviceRegistry.js';
import * as AutoWagonOrders from '../../client/src/game/remote/AutoWagonOrders.js';
import { ensurePhone, getPhone, PHONE_STARTING_CHARGE } from '../../client/src/game/phone/Phone.js';
import engine from '../../client/src/game/GameEngine.js';

function freshBattery(charge = 20) {
  const battery = new Item(createItemFromDef('tool.battery'));
  battery.ammoCount = charge;
  return battery;
}

/** A deployed (grounded) drone at the player's feet, ready to launch. */
function deployDrone(charge = 20) {
  const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
  stowed.attachItem('battery', freshBattery(charge));
  RemoteDeviceRegistry.deploy(stowed, engine);
  return engine.inventoryManager.groundContainer.getAllItems()
    .find(it => it.defId === 'tool.recon_drone');
}

/** A self-driving wagon on a far tile, linked to the phone. */
function linkAutonomousWagon(harness, at = { x: 12, y: 12 }) {
  const wagon = new Item(createItemFromDef('vehicle.toy_wagon'));
  wagon.attachments = {
    motor: new Item(createItemFromDef('electric_motor')),
    battery: (() => {
      const cell = new Item(createItemFromDef('tool.large_battery'));
      cell.ammoCount = 500;
      return cell;
    })(),
    rc_receiver: new Item(createItemFromDef('tool.autonomous_controller'))
  };
  engine.inventoryManager.dropItemAtLocation(wagon, at.x, at.y, harness.gameMap);
  engine.activeDeviceId = wagon.instanceId;
  return wagon;
}

describe('phone gating — launching a drone', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1, width: 40, height: 40, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    ensurePhone(engine.inventoryManager);
  });

  it('refuses while the phone is switched off', () => {
    const deployed = deployDrone();
    expect(engine.isPhoneOn).toBe(false);

    const result = RemoteDeviceRegistry.launch(deployed, engine);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('Turn your phone on first.');
    expect(harness.gameMap.getEntitiesByType('drone').length).toBe(0);
  });

  it('refuses when the phone is on but its battery is flat', () => {
    const deployed = deployDrone();
    engine.isPhoneOn = true;
    getPhone(engine).consumeCharge(PHONE_STARTING_CHARGE);

    const result = RemoteDeviceRegistry.launch(deployed, engine);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('The phone battery is dead.');
    expect(harness.gameMap.getEntitiesByType('drone').length).toBe(0);
  });

  it('launches once the phone is switched on with charge left', () => {
    const deployed = deployDrone();
    engine.isPhoneOn = true;

    const result = RemoteDeviceRegistry.launch(deployed, engine);

    expect(result.success).toBe(true);
    expect(harness.gameMap.getEntitiesByType('drone').length).toBe(1);
  });
});

describe('phone gating — ordering an autonomous wagon', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 3, width: 40, height: 40, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    ensurePhone(engine.inventoryManager);
  });

  it('refuses a destination while the phone is switched off, and stores no order', () => {
    const wagon = linkAutonomousWagon(harness);
    expect(engine.isPhoneOn).toBe(false);

    const result = AutoWagonOrders.setDestination(20, 12, engine);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Turn your phone on first.');
    expect(engine.autoWagonOrders.get(wagon.instanceId)).toBeUndefined();
  });

  it('refuses when the phone is on but its battery is flat', () => {
    linkAutonomousWagon(harness);
    engine.isPhoneOn = true;
    getPhone(engine).consumeCharge(PHONE_STARTING_CHARGE);

    const result = AutoWagonOrders.setDestination(20, 12, engine);

    expect(result.success).toBe(false);
    expect(result.message).toBe('The phone battery is dead.');
  });

  it('accepts the destination once the phone is switched on', () => {
    const wagon = linkAutonomousWagon(harness);
    engine.isPhoneOn = true;

    const result = AutoWagonOrders.setDestination(20, 12, engine);

    expect(result.success).toBe(true);
    expect(engine.autoWagonOrders.get(wagon.instanceId)).toMatchObject({ x: 20, y: 12 });
  });
});
