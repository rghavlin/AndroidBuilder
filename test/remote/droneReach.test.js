import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import * as RemoteDeviceRegistry from '../../client/src/game/remote/RemoteDeviceRegistry.js';
import { isDroneInReach } from '../../client/src/game/remote/RemoteDeviceKinds.js';
import engine from '../../client/src/game/GameEngine.js';

// A drone's battery can only be swapped while the drone sits on the player's
// own tile. Airborne, its item lives on the Drone entity; landed elsewhere, it
// is an on-map entity. Either way a panel left open must not reach it.

function freshBattery(charge = 20) {
  const battery = new Item(createItemFromDef('tool.battery'));
  battery.ammoCount = charge;
  return battery;
}

function deployDrone() {
  const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
  stowed.attachItem('battery', freshBattery(20));
  RemoteDeviceRegistry.deploy(stowed, engine);
  return engine.inventoryManager.groundContainer.getAllItems()
    .find(it => it.defId === 'tool.recon_drone');
}

describe('drone battery access is limited to the player tile', () => {
  let harness;
  let inv;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1 }).bootstrap();
    const p = harness.player;
    inv = engine.inventoryManager;
    inv.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    const phone = harness.equipItemDef('tool.smartphone', 'phone');
    phone.attachItem('battery', freshBattery(20));
    engine.isPhoneOn = true;
  });

  it('allows swapping the battery of a drone deployed underfoot', () => {
    const deployed = deployDrone();
    expect(isDroneInReach(deployed, inv.groundContainer)).toBe(true);

    const detached = inv.detachItemFromWeapon(deployed, 'battery');
    expect(detached).toBeTruthy();
    expect(deployed.getBattery()).toBeFalsy();

    const result = inv.attachItemToWeapon(deployed, 'battery', detached);
    expect(result.success).toBe(true);
    expect(deployed.getBattery()).toBeTruthy();
  });

  it('refuses to detach or attach a battery while the drone is airborne', () => {
    const deployed = deployDrone();
    const drone = RemoteDeviceRegistry.launch(deployed, engine).drone;
    const item = drone.sourceItem;
    const battery = item.getBattery();

    expect(isDroneInReach(item, inv.groundContainer)).toBe(false);
    expect(inv.detachItemFromWeapon(item, 'battery')).toBeNull();
    expect(item.getBattery()).toBe(battery);

    const result = inv.attachItemToWeapon(item, 'battery', freshBattery(20));
    expect(result.success).toBe(false);
    expect(item.getBattery()).toBe(battery);
  });

  it('refuses once the drone has landed on a different tile', () => {
    const deployed = deployDrone();
    const drone = RemoteDeviceRegistry.launch(deployed, engine).drone;
    drone.logicalX = Math.round(harness.player.x) + 4;
    drone.logicalY = Math.round(harness.player.y);

    const landed = RemoteDeviceRegistry.land(drone, engine, { chargeAp: false });
    expect(landed.success).toBe(true);
    expect(landed.x === Math.round(harness.player.x) && landed.y === Math.round(harness.player.y)).toBe(false);

    const item = drone.sourceItem;
    const battery = item.getBattery();
    expect(isDroneInReach(item, inv.groundContainer)).toBe(false);
    expect(inv.detachItemFromWeapon(item, 'battery')).toBeNull();
    expect(item.getBattery()).toBe(battery);
  });

  it('never blocks ordinary items', () => {
    const plain = new Item(createItemFromDef('tool.battery'));
    expect(isDroneInReach(plain, inv.groundContainer)).toBe(true);
  });
});
