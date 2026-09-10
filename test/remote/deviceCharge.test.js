// Charge readout for the phone's device list.
//
// The number has to come out right for every form a device can be in, which is
// the whole difficulty: an airborne drone keeps its battery on a stashed
// sourceItem, a device parked on a far tile is an item ENTITY whose attachments
// are raw JSON with no methods, the same device at the player's feet is a live
// Item, and a big wagon carries several cells.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { deviceCharge, itemCharge } from '../../client/src/game/remote/DeviceCharge.js';
import * as RemoteDeviceRegistry from '../../client/src/game/remote/RemoteDeviceRegistry.js';
import engine from '../../client/src/game/GameEngine.js';

const battery = (defId, charge) => {
  const b = new Item(createItemFromDef(defId));
  b.ammoCount = charge;
  return b;
};

function makeDrone(charge) {
  const drone = new Item(createItemFromDef('tool.recon_drone'));
  drone.attachItem('battery', battery('tool.battery', charge));
  return drone;
}

function makeWagon(defId, cells) {
  const wagon = new Item(createItemFromDef(defId));
  for (const [slot, charge] of Object.entries(cells)) {
    wagon.attachItem(slot, battery('tool.large_battery', charge));
  }
  wagon.attachItem('rc_receiver', new Item(createItemFromDef('tool.rc_receiver')));
  return wagon;
}

describe('itemCharge', () => {
  it('reads a single-cell device', () => {
    const charge = itemCharge(makeDrone(12));
    expect(charge).toMatchObject({ present: true, charges: 12, max: 20, cells: 1 });
    expect(charge.percent).toBeCloseTo(60, 5);
  });

  it('sums a multi-cell wagon into one fuel tank', () => {
    const charge = itemCharge(makeWagon('vehicle.wagon', { battery_front: 150, battery_rear: 75 }));
    expect(charge).toMatchObject({ present: true, charges: 225, max: 300, cells: 2 });
    expect(charge.percent).toBeCloseTo(75, 5);
  });

  it('ignores an empty socket rather than counting it as depleted', () => {
    // One full cell, one socket with nothing in it: that is a full tank of the
    // capacity actually fitted, not a half-empty one.
    const charge = itemCharge(makeWagon('vehicle.wagon', { battery_front: 150 }));
    expect(charge).toMatchObject({ charges: 150, max: 150, cells: 1 });
    expect(charge.percent).toBeCloseTo(100, 5);
  });

  it('reports a flat battery as fitted but empty', () => {
    expect(itemCharge(makeDrone(0))).toMatchObject({ present: true, charges: 0, percent: 0 });
  });

  it('reports no cell at all, and survives junk', () => {
    const bare = new Item(createItemFromDef('tool.recon_drone'));
    expect(itemCharge(bare).present).toBe(false);
    expect(itemCharge(null).present).toBe(false);
    expect(itemCharge({}).present).toBe(false);
  });
});

describe('deviceCharge across a device’s homes', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 4, width: 30, height: 20, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    engine.dragging = null;
    engine.riding = null;
    engine.autoWagonOrders = new Map();
    engine.activeDeviceId = null;
  });

  const find = (key) => RemoteDeviceRegistry.listControllables(engine).find(t => t.key === key);

  it('reads a wagon parked on a far tile, whose attachments are raw JSON', () => {
    const wagon = makeWagon('vehicle.toy_wagon', { battery: 90 });
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);

    const target = find(wagon.instanceId);
    expect(target).toBeDefined();
    // The listed candidate is an on-map entity, not an Item — no getBattery on it.
    expect(typeof target.item.getBatteryStatuses).not.toBe('function');
    expect(deviceCharge(target)).toMatchObject({ present: true, charges: 90, max: 150 });
  });

  it('reads a grounded drone at the player’s feet, where it is a live Item', () => {
    const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
    stowed.attachItem('battery', battery('tool.battery', 17));
    RemoteDeviceRegistry.deploy(stowed, engine);

    const deployed = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.defId === 'tool.recon_drone');
    expect(deviceCharge(find(deployed.instanceId))).toMatchObject({ present: true, charges: 17 });
  });

  it('follows an airborne drone to the battery on its stashed sourceItem', () => {
    const phone = harness.equipItemDef('tool.smartphone', 'phone');
    phone.attachItem('battery', battery('tool.battery', 20));
    engine.isPhoneOn = true;

    const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
    stowed.attachItem('battery', battery('tool.battery', 20));
    RemoteDeviceRegistry.deploy(stowed, engine);
    const deployed = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.defId === 'tool.recon_drone');
    const { drone } = RemoteDeviceRegistry.launch(deployed, engine);

    const target = find(drone.id);
    expect(target.kind).toBe('drone-air');
    const aloft = deviceCharge(target);
    expect(aloft.present).toBe(true);
    // Launching spends the deploy charge, so it is down from 20 but not empty.
    expect(aloft.charges).toBeGreaterThan(0);
    expect(aloft.charges).toBeLessThan(20);
    expect(aloft.charges).toBe(drone.sourceItem.getCharges());
  });

  it('drains as the drone flies, so the gauge tracks the battery', async () => {
    const phone = harness.equipItemDef('tool.smartphone', 'phone');
    phone.attachItem('battery', battery('tool.battery', 20));
    engine.isPhoneOn = true;

    const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
    stowed.attachItem('battery', battery('tool.battery', 20));
    RemoteDeviceRegistry.deploy(stowed, engine);
    const deployed = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.defId === 'tool.recon_drone');
    const { drone } = RemoteDeviceRegistry.launch(deployed, engine);
    engine.activeDeviceId = drone.id;

    const before = deviceCharge(find(drone.id)).charges;
    const DroneMovement = await import('../../client/src/game/remote/DroneMovement.js');
    await DroneMovement.moveActiveDevice(Math.round(drone.logicalX) + 6, Math.round(drone.logicalY), engine);

    expect(deviceCharge(find(drone.id)).charges).toBeLessThan(before);
  });
});
