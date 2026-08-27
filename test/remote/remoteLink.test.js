// Pointing the phone at a device, and hanging up. This used to live inside
// GameContext where nothing headless could reach it; it is an engine module
// now, so these are the rules themselves rather than a copy of them.
import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { linkDevice } from '../../client/src/game/remote/RemoteLink.js';
import { ensurePhone, phoneCharges, PHONE_STARTING_CHARGE } from '../../client/src/game/phone/Phone.js';
import engine from '../../client/src/game/GameEngine.js';

function makeWagon(receiver = 'tool.rc_receiver') {
  const wagon = new Item(createItemFromDef('vehicle.toy_wagon'));
  const battery = new Item(createItemFromDef('tool.large_battery'));
  battery.ammoCount = 500;
  wagon.attachments = {
    motor: new Item(createItemFromDef('electric_motor')),
    battery,
    rc_receiver: new Item(createItemFromDef(receiver))
  };
  return wagon;
}

describe('remote/RemoteLink — linking', () => {
  let harness;
  let looked;

  /** Drop a wagon on a far tile so it is a reachable controllable. */
  function dropWagon(wagon, at = { x: 14, y: 14 }) {
    engine.inventoryManager.dropItemAtLocation(wagon, at.x, at.y, harness.gameMap);
    return wagon;
  }

  beforeEach(() => {
    harness = new GameHarness({ seed: 5, width: 40, height: 40, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    ensurePhone(engine.inventoryManager);
    engine.activeDeviceId = null;
    engine.turn = 1;
    engine._phoneChargeTurn = null;

    // The harness has no camera; a stub records where the link points it.
    looked = null;
    engine.camera = { centerOn: (x, y) => { looked = { x, y }; } };
  });

  it('links to a wagon, spends a charge, and looks at it', () => {
    const wagon = dropWagon(makeWagon(), { x: 14, y: 14 });
    engine.isPhoneOn = true;

    const result = linkDevice(engine, wagon.instanceId);

    expect(result.success).toBe(true);
    expect(engine.activeDeviceId).toBe(wagon.instanceId);
    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE - 1);
    expect(looked).toEqual({ x: 14, y: 14 });
  });

  it('tells the player a self-driving wagon can be sent on its own', () => {
    const plain = dropWagon(makeWagon(), { x: 14, y: 14 });
    const auto = dropWagon(makeWagon('tool.autonomous_controller'), { x: 16, y: 16 });
    engine.isPhoneOn = true;

    expect(linkDevice(engine, plain.instanceId).message).toContain('Click a tile to drive it.');
    expect(linkDevice(engine, auto.instanceId).message).toContain('send it on its own');
  });

  it('refuses while the phone is switched off, and links nothing', () => {
    const wagon = dropWagon(makeWagon());
    engine.isPhoneOn = false;

    const result = linkDevice(engine, wagon.instanceId);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Turn your phone on first.');
    expect(result.tone).toBe('error');
    expect(engine.activeDeviceId).toBeNull();
    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE);
  });

  it('refuses a key nothing answers to', () => {
    engine.isPhoneOn = true;

    const result = linkDevice(engine, 'wagon-that-was-scrapped');

    expect(result.success).toBe(false);
    expect(result.message).toBe('That device no longer answers.');
    expect(engine.activeDeviceId).toBeNull();
    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE);
  });

  it('bills one charge per turn however many devices are linked in it', () => {
    const first = dropWagon(makeWagon(), { x: 14, y: 14 });
    const second = dropWagon(makeWagon(), { x: 16, y: 16 });
    engine.isPhoneOn = true;

    linkDevice(engine, first.instanceId);
    linkDevice(engine, second.instanceId);

    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE - 1);
  });
});

describe('remote/RemoteLink — releasing', () => {
  let harness;
  let looked;
  let playerTile;

  beforeEach(() => {
    harness = new GameHarness({ seed: 5, width: 40, height: 40, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    playerTile = { x: Math.round(p.x), y: Math.round(p.y) };
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    ensurePhone(engine.inventoryManager);
    engine.turn = 1;
    engine._phoneChargeTurn = null;

    looked = null;
    engine.camera = { centerOn: (x, y) => { looked = { x, y }; } };
  });

  it('hands control back and looks at the player again', () => {
    engine.isPhoneOn = true;
    engine.activeDeviceId = 'some-device';

    const result = linkDevice(engine, null);

    expect(result.success).toBe(true);
    expect(result.message).toBe('You take back control.');
    expect(engine.activeDeviceId).toBeNull();
    expect(looked).toEqual(playerTile);
  });

  it('costs nothing — hanging up is free', () => {
    engine.isPhoneOn = true;
    engine.activeDeviceId = 'some-device';

    linkDevice(engine, null);

    expect(phoneCharges(engine)).toBe(PHONE_STARTING_CHARGE);
  });

  it('works with a dead phone, so a dark handset can never strand the camera', () => {
    engine.isPhoneOn = false;
    engine.activeDeviceId = 'some-device';
    engine.inventoryManager.equipment.phone.consumeCharge(PHONE_STARTING_CHARGE);

    const result = linkDevice(engine, null);

    expect(result.success).toBe(true);
    expect(engine.activeDeviceId).toBeNull();
    expect(looked).toEqual(playerTile);
  });

  it('says nothing when there was nothing to release', () => {
    engine.isPhoneOn = true;
    engine.activeDeviceId = null;

    const result = linkDevice(engine, null);

    expect(result.success).toBe(true);
    expect(result.message).toBeNull();
  });
});
