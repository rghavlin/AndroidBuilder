import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import * as RemoteDeviceRegistry from '../../client/src/game/remote/RemoteDeviceRegistry.js';
import * as DroneMovement from '../../client/src/game/remote/DroneMovement.js';
import engine from '../../client/src/game/GameEngine.js';

function freshBattery(charge = 20) {
  const battery = new Item(createItemFromDef('tool.battery'));
  battery.ammoCount = charge;
  return battery;
}

function equipPhone(harness, charge = 20) {
  const phone = harness.equipItemDef('tool.smartphone', 'phone');
  phone.attachItem('battery', freshBattery(charge));
  return phone;
}

function deployDrone(harness, charge = 20) {
  equipPhone(harness);
  const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
  stowed.attachItem('battery', freshBattery(charge));
  const result = RemoteDeviceRegistry.deploy(stowed, engine);
  engine.activeDeviceId = result.drone.id;
  return result.drone;
}

describe('remote/DroneMovement', () => {
  let harness;
  let originalRegisterAction;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    // Headless test environment has no requestAnimationFrame heartbeat, so a
    // SequencerAction's promise (Drone.playAction) never resolves on its own.
    // Drive registered actions to completion synchronously for these tests.
    originalRegisterAction = engine.registerAction;
    engine.registerAction = (action) => {
      if (action && typeof action.update === 'function') action.update(action.duration ?? 99999);
    };
  });

  afterEach(() => {
    engine.registerAction = originalRegisterAction;
  });

  it('flying 6 tiles costs exactly 3.0 player AP', async () => {
    const drone = deployDrone(harness);
    const startX = Math.round(drone.logicalX);
    const startY = Math.round(drone.logicalY);
    const apBefore = harness.player.ap;

    const result = await DroneMovement.moveActiveDevice(startX + 6, startY, engine);

    expect(result.success).toBe(true);
    expect(result.tiles).toBe(6);
    expect(result.apCost).toBeCloseTo(3.0, 5);
    expect(harness.player.ap).toBeCloseTo(apBefore - 3.0, 5);
    expect(Math.round(drone.logicalX)).toBe(startX + 6);
  });

  it('previewMoveCost and moveActiveDevice agree on tiles and AP cost', async () => {
    const drone = deployDrone(harness);
    const startX = Math.round(drone.logicalX);
    const startY = Math.round(drone.logicalY);

    const preview = DroneMovement.previewMoveCost(startX + 4, startY, engine);
    const result = await DroneMovement.moveActiveDevice(startX + 4, startY, engine);

    expect(preview.possible).toBe(true);
    expect(result.success).toBe(true);
    expect(preview.tiles).toBe(result.tiles);
    expect(preview.apCost).toBeCloseTo(result.apCost, 5);
  });

  it('refuses a move that would exceed the player\'s remaining AP, spending nothing', async () => {
    const drone = deployDrone(harness);
    const startX = Math.round(drone.logicalX);
    const startY = Math.round(drone.logicalY);
    harness.player.ap = 1; // 1 AP only affords 2 tiles at 0.5/tile

    const apBefore = harness.player.ap;
    const result = await DroneMovement.moveActiveDevice(startX + 6, startY, engine);

    expect(result.success).toBe(false);
    expect(harness.player.ap).toBe(apBefore);
    expect(Math.round(drone.logicalX)).toBe(startX); // never moved
  });

  it('refuses a move that would exceed the drone\'s remaining battery charge', async () => {
    const drone = deployDrone(harness, 1); // 1 charge left after the 1-charge deploy cost? no — deploy already spent 1
    // deployDrone(harness, 1) gives the drone a battery with 1 charge total,
    // all of which is spent by the 1-charge deploy cost, leaving 0.
    const startX = Math.round(drone.logicalX);
    const startY = Math.round(drone.logicalY);
    const apBefore = harness.player.ap;

    const result = await DroneMovement.moveActiveDevice(startX + 2, startY, engine);

    expect(result.success).toBe(false);
    expect(harness.player.ap).toBe(apBefore); // AP refunded/never spent
    expect(Math.round(drone.logicalX)).toBe(startX);
  });

  it('flies over a zombie\'s tile without being blocked', async () => {
    const drone = deployDrone(harness);
    const startX = Math.round(drone.logicalX);
    const startY = Math.round(drone.logicalY);
    harness.spawnZombie(startX + 2, startY);

    const result = await DroneMovement.moveActiveDevice(startX + 4, startY, engine);

    expect(result.success).toBe(true);
    expect(Math.round(drone.logicalX)).toBe(startX + 4);
    expect(Math.round(drone.logicalY)).toBe(startY);
  });

  it('does nothing when no device is active', async () => {
    engine.activeDeviceId = null;
    const result = await DroneMovement.moveActiveDevice(5, 5, engine);
    expect(result.success).toBe(false);
  });
});
