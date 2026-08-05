import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import * as RemoteDeviceRegistry from '../../client/src/game/remote/RemoteDeviceRegistry.js';
import * as RcVehicle from '../../client/src/game/remote/RcVehicle.js';
import engine from '../../client/src/game/GameEngine.js';

// A receiver-fitted wagon is a phone device with two homes: an on-map item
// entity, or the player's ground container when they're standing on its tile.
// Every lookup here has to see it in exactly one of them, exactly once.

const MOTOR_PAIRS = [
  ['motor', 'battery'],
  ['motor_front', 'battery_front'],
  ['motor_middle', 'battery_middle'],
  ['motor_rear', 'battery_rear'],
];

/**
 * A wagon with `motorCount` powered motor pairs and, optionally, a receiver.
 * Mirrors makeVehicle in test/balance/wagonDrag.test.js.
 */
function makeWagon(defId = 'vehicle.toy_wagon', { motors = 1, receiver = true, charge = 100 } = {}) {
  const wagon = new Item(createItemFromDef(defId));
  wagon.attachments = {};

  const slotIds = new Set((wagon.attachmentSlots || []).map(s => s.id));
  let installed = 0;
  for (const [motorSlot, batterySlot] of MOTOR_PAIRS) {
    if (installed >= motors) break;
    if (!slotIds.has(motorSlot) || !slotIds.has(batterySlot)) continue;
    wagon.attachments[motorSlot] = new Item(createItemFromDef('electric_motor'));
    const battery = new Item(createItemFromDef('tool.large_battery'));
    battery.ammoCount = charge;
    wagon.attachments[batterySlot] = battery;
    installed++;
  }
  if (receiver) {
    wagon.attachments.rc_receiver = new Item(createItemFromDef('tool.rc_receiver'));
  }
  return wagon;
}

/** Put a wagon on a far map tile as an item entity. */
function placeOnMap(harness, wagon, x, y) {
  engine.inventoryManager.dropItemAtLocation(wagon, x, y, harness.gameMap);
  return harness.gameMap.getItemsOnTile(x, y).find(e => e.instanceId === wagon.instanceId);
}

/** Put a wagon in the ground container, i.e. at the player's feet. */
function placeUnderfoot(harness, wagon) {
  const p = harness.player;
  engine.inventoryManager.dropItemAtLocation(wagon, Math.round(p.x), Math.round(p.y), harness.gameMap);
  return engine.inventoryManager.groundContainer.getAllItems()
    .find(it => it.instanceId === wagon.instanceId);
}

describe('RcVehicle device identity', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 3 }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
  });

  describe('hasReceiver', () => {
    it('is true for a fitted wagon and false for a bare one', () => {
      expect(RcVehicle.hasReceiver(makeWagon())).toBe(true);
      expect(RcVehicle.hasReceiver(makeWagon('vehicle.toy_wagon', { receiver: false }))).toBe(false);
      expect(RcVehicle.hasReceiver(null)).toBe(false);
    });

    it('reads through raw JSON attachments, as an on-map entity has', () => {
      const entity = placeOnMap(harness, makeWagon(), 5, 5);
      expect(entity).toBeDefined();
      // The entity's attachments are plain JSON, not Item instances.
      expect(typeof entity.attachments.rc_receiver.getBattery).not.toBe('function');
      expect(RcVehicle.hasReceiver(entity)).toBe(true);
    });
  });

  describe('listRcVehicles', () => {
    it('finds a receiver-fitted wagon anywhere on the map', () => {
      placeOnMap(harness, makeWagon(), 5, 5);
      const found = RcVehicle.listRcVehicles(engine);
      expect(found).toHaveLength(1);
      expect(found[0].defId).toBe('vehicle.toy_wagon');
    });

    it('ignores a wagon with no receiver', () => {
      placeOnMap(harness, makeWagon('vehicle.wagon', { receiver: false, motors: 2 }), 6, 6);
      expect(RcVehicle.listRcVehicles(engine)).toHaveLength(0);
    });

    it('ignores non-wagon items that happen to be on the map', () => {
      engine.inventoryManager.dropItemAtLocation(
        new Item(createItemFromDef('tool.rc_receiver')), 7, 7, harness.gameMap
      );
      expect(RcVehicle.listRcVehicles(engine)).toHaveLength(0);
    });

    it('lists a wagon underfoot exactly once — not once per home', () => {
      placeUnderfoot(harness, makeWagon());
      expect(RcVehicle.listRcVehicles(engine)).toHaveLength(1);
    });

    it('still lists a wagon whose batteries are flat', () => {
      // Losing the link the moment the batteries die would be worse UX than
      // showing it and refusing the move with a reason.
      placeOnMap(harness, makeWagon('vehicle.toy_wagon', { charge: 0 }), 5, 5);
      expect(RcVehicle.listRcVehicles(engine)).toHaveLength(1);
    });
  });

  describe('listControllables', () => {
    it('tags an RC wagon with kind: rc-vehicle', () => {
      const wagon = makeWagon();
      placeOnMap(harness, wagon, 8, 8);
      const devices = RemoteDeviceRegistry.listControllables(engine);
      expect(devices).toHaveLength(1);
      expect(devices[0].kind).toBe('rc-vehicle');
      expect(devices[0].key).toBe(wagon.instanceId);
      expect(devices[0].airborne).toBe(false);
    });

    it('cycles player -> wagon -> player', () => {
      const wagon = makeWagon();
      placeOnMap(harness, wagon, 8, 8);
      const devices = RemoteDeviceRegistry.listControllables(engine);
      const first = RemoteDeviceRegistry.cycleTarget(null, devices);
      expect(first).toBe(wagon.instanceId);
      expect(RemoteDeviceRegistry.cycleTarget(first, devices)).toBeNull();
    });
  });

  describe('getActiveRcVehicle', () => {
    it('resolves an on-map wagon to a real Item at its own tile', () => {
      const wagon = makeWagon();
      placeOnMap(harness, wagon, 9, 4);
      engine.activeDeviceId = wagon.instanceId;

      const active = RcVehicle.getActiveRcVehicle(engine);
      expect(active.source).toBe('map');
      expect(active.x).toBe(9);
      expect(active.y).toBe(4);
      // Coerced from raw JSON, so the motor/battery API is available.
      expect(typeof active.item.getMotorizedBonus).toBe('function');
      expect(active.item.getMotorizedBonus()).toBe(1);
    });

    it('resolves a wagon underfoot to the ground-container Item at the player tile', () => {
      const inContainer = placeUnderfoot(harness, makeWagon());
      engine.activeDeviceId = inContainer.instanceId;
      const p = harness.player;

      const active = RcVehicle.getActiveRcVehicle(engine);
      expect(active.source).toBe('ground');
      expect(active.x).toBe(Math.round(p.x));
      expect(active.y).toBe(Math.round(p.y));
      // The live container object, NOT a copy — charge spent on it must stick.
      expect(active.item).toBe(inContainer);
    });

    it('returns null when the player is in control, or the device is a drone', () => {
      placeOnMap(harness, makeWagon(), 9, 4);
      engine.activeDeviceId = null;
      expect(RcVehicle.getActiveRcVehicle(engine)).toBeNull();

      engine.activeDeviceId = 'some-drone-id';
      expect(RcVehicle.getActiveRcVehicle(engine)).toBeNull();
    });
  });

  describe('driveBlockedReason', () => {
    it('passes a motorized wagon', () => {
      expect(RcVehicle.driveBlockedReason(makeWagon(), engine)).toBeNull();
    });

    it('refuses a wagon with no motor, and one whose batteries are flat', () => {
      expect(RcVehicle.driveBlockedReason(makeWagon('vehicle.toy_wagon', { motors: 0 }), engine))
        .toBe('No motor power');
      expect(RcVehicle.driveBlockedReason(makeWagon('vehicle.toy_wagon', { charge: 0 }), engine))
        .toBe('No motor power');
    });

    it('refuses a wagon the player is physically holding onto', () => {
      const dragged = makeWagon();
      engine.dragging = { item: dragged };
      expect(RcVehicle.driveBlockedReason(dragged, engine)).toBe('You are dragging it');
      engine.dragging = null;

      const ridden = makeWagon();
      engine.riding = { item: ridden };
      expect(RcVehicle.driveBlockedReason(ridden, engine)).toBe('You are riding it');
      engine.riding = null;
    });

    it('names the entanglement before the power state, so the message is never a lie', () => {
      // A dead-battery wagon you're currently dragging is "you are dragging it",
      // not "no motor power".
      const dragged = makeWagon('vehicle.toy_wagon', { charge: 0 });
      engine.dragging = { item: dragged };
      expect(RcVehicle.driveBlockedReason(dragged, engine)).toBe('You are dragging it');
      engine.dragging = null;
    });

    it('refuses a hitched wagon from either side of the link', () => {
      const wagon = makeWagon();
      wagon.hitchedToInstanceId = 'cart-1';
      expect(RcVehicle.driveBlockedReason(wagon, engine)).toBe('It is hitched to a cart');

      const wagon2 = makeWagon();
      const cart = placeUnderfoot(harness, new Item(createItemFromDef('vehicle.golf_cart')));
      cart.hitchedItemInstanceId = wagon2.instanceId;
      expect(RcVehicle.driveBlockedReason(wagon2, engine)).toBe('It is hitched to a cart');
    });
  });
});
