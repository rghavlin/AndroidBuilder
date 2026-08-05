import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import * as RcVehicleMovement from '../../client/src/game/remote/RcVehicleMovement.js';
import engine from '../../client/src/game/GameEngine.js';

// Headless has no requestAnimationFrame, so driveActiveVehicle skips the tween
// and runs finishDrive immediately — these tests exercise the cost, pathing,
// battery and item-relocation logic, not the animation.

const MOTOR_PAIRS = [
  ['motor', 'battery'],
  ['motor_front', 'battery_front'],
  ['motor_middle', 'battery_middle'],
  ['motor_rear', 'battery_rear'],
];

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
  if (receiver) wagon.attachments.rc_receiver = new Item(createItemFromDef('tool.rc_receiver'));
  return wagon;
}

/** Drop a wagon on a far tile and link the phone to it. Returns its instanceId. */
function linkOnMap(harness, wagon, x, y) {
  engine.inventoryManager.dropItemAtLocation(wagon, x, y, harness.gameMap);
  engine.activeDeviceId = wagon.instanceId;
  return wagon.instanceId;
}

const wagonEntityAt = (harness, x, y, id) =>
  harness.gameMap.getItemsOnTile(x, y).find(e => e.instanceId === id);

const inGroundContainer = (id) =>
  engine.inventoryManager.groundContainer.getAllItems().find(it => it.instanceId === id);

/** Total charge left across every battery slot on a wagon (Item or entity). */
function totalCharge(wagon) {
  return Object.entries(wagon.attachments || {})
    .filter(([slotId]) => slotId.includes('battery'))
    .reduce((sum, [, b]) => sum + (b?.ammoCount || 0), 0);
}

describe('remote/RcVehicleMovement', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 2, width: 30, height: 30, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    engine.dragging = null;
    engine.riding = null;
    // Remote driving is expensive by design; give the tests room to pay for it.
    harness.player.ap = 100;
  });

  describe('AP cost', () => {
    it('charges 2 / 4 / 6 AP per tile for a fully motorized toy / wagon / cargo wagon', async () => {
      const CASES = [
        ['vehicle.toy_wagon', 1, 12],
        ['vehicle.wagon', 2, 24],
        ['vehicle.cargo_wagon', 3, 36],
      ];

      for (const [defId, motors, expectedAp] of CASES) {
        harness.player.ap = 100;
        linkOnMap(harness, makeWagon(defId, { motors }), 5, 5);

        const result = await RcVehicleMovement.driveActiveVehicle(11, 5, engine);

        expect(result.success, defId).toBe(true);
        expect(result.tiles, defId).toBe(6);
        expect(result.apCost, defId).toBeCloseTo(expectedAp, 5);
        expect(harness.player.ap, defId).toBeCloseTo(100 - expectedAp, 5);
      }
    });

    it('quotes exactly what it charges', async () => {
      linkOnMap(harness, makeWagon('vehicle.wagon', { motors: 2 }), 4, 4);

      const preview = RcVehicleMovement.previewDriveCost(9, 7, engine);
      const result = await RcVehicleMovement.driveActiveVehicle(9, 7, engine);

      expect(preview.possible).toBe(true);
      expect(preview.tiles).toBe(result.tiles);
      expect(preview.apCost).toBeCloseTo(result.apCost, 5);
    });

    it('refuses when the player cannot pay, spending nothing', async () => {
      const id = linkOnMap(harness, makeWagon('vehicle.cargo_wagon', { motors: 3 }), 5, 5);
      harness.player.ap = 5; // a single tile costs 6

      const result = await RcVehicleMovement.driveActiveVehicle(6, 5, engine);

      expect(result).toEqual({ success: false, reason: 'Not enough AP' });
      expect(harness.player.ap).toBe(5);
      expect(wagonEntityAt(harness, 5, 5, id)).toBeDefined();
    });
  });

  describe('refusals', () => {
    it('refuses a wagon with no powered motor, spending nothing', async () => {
      const id = linkOnMap(harness, makeWagon('vehicle.toy_wagon', { motors: 0 }), 5, 5);
      const apBefore = harness.player.ap;

      const result = await RcVehicleMovement.driveActiveVehicle(8, 5, engine);

      expect(result).toEqual({ success: false, reason: 'No motor power' });
      expect(harness.player.ap).toBe(apBefore);
      expect(wagonEntityAt(harness, 5, 5, id)).toBeDefined();
    });

    it('refuses a wagon with flat batteries', async () => {
      linkOnMap(harness, makeWagon('vehicle.toy_wagon', { charge: 0 }), 5, 5);
      const result = await RcVehicleMovement.driveActiveVehicle(8, 5, engine);
      expect(result.reason).toBe('No motor power');
    });

    it('refuses while the player is dragging it', async () => {
      const wagon = makeWagon();
      linkOnMap(harness, wagon, 5, 5);
      engine.dragging = { item: wagon };

      const result = await RcVehicleMovement.driveActiveVehicle(8, 5, engine);

      expect(result).toEqual({ success: false, reason: 'You are dragging it' });
    });

    it('refuses when the player is in control of nothing', async () => {
      engine.activeDeviceId = null;
      const result = await RcVehicleMovement.driveActiveVehicle(8, 5, engine);
      expect(result).toEqual({ success: false, reason: 'No active device' });
      expect(RcVehicleMovement.previewDriveCost(8, 5, engine)).toBeNull();
    });
  });

  describe('battery drain', () => {
    it('spends one charge per tile per powered motor pair', async () => {
      const id = linkOnMap(harness, makeWagon('vehicle.wagon', { motors: 2, charge: 100 }), 5, 5);

      await RcVehicleMovement.driveActiveVehicle(9, 5, engine); // 4 tiles

      const arrived = wagonEntityAt(harness, 9, 5, id);
      // Both pairs drain in parallel: 4 tiles => 4 from each, 8 total.
      expect(totalCharge(arrived)).toBe(200 - 8);
    });

    it('runs the batteries flat rather than refusing a long drive', async () => {
      const id = linkOnMap(harness, makeWagon('vehicle.toy_wagon', { charge: 3 }), 5, 5);

      const result = await RcVehicleMovement.driveActiveVehicle(11, 5, engine); // 6 tiles

      expect(result.success).toBe(true);
      const stranded = wagonEntityAt(harness, 11, 5, id);
      expect(totalCharge(stranded)).toBe(0);
      // And now it's stuck out there until the player walks a battery to it.
      expect(RcVehicleMovement.previewDriveCost(12, 5, engine).reason).toBe('No motor power');
    });
  });

  describe('pathing', () => {
    it('rolls around a zombie instead of through it', async () => {
      const id = linkOnMap(harness, makeWagon(), 5, 5);
      harness.spawnZombie(6, 5);
      harness.spawnZombie(7, 5);

      const result = await RcVehicleMovement.driveActiveVehicle(8, 5, engine);

      expect(result.success).toBe(true);
      expect(result.tiles).toBeGreaterThan(3); // a straight line would be 3
      expect(wagonEntityAt(harness, 8, 5, id)).toBeDefined();
    });

    it('can be recalled onto the player\'s own tile', async () => {
      const p = harness.player;
      const px = Math.round(p.x);
      const py = Math.round(p.y);
      const id = linkOnMap(harness, makeWagon(), px + 4, py);

      const result = await RcVehicleMovement.driveActiveVehicle(px, py, engine);

      expect(result.success).toBe(true);
      expect(inGroundContainer(id)).toBeDefined();
    });
  });

  describe('relocation between the wagon\'s two homes', () => {
    it('moves out of the ground container onto a far tile, cargo intact', async () => {
      const p = harness.player;
      const px = Math.round(p.x);
      const py = Math.round(p.y);

      const wagon = makeWagon();
      engine.inventoryManager.dropItemAtLocation(wagon, px, py, harness.gameMap);
      const carried = inGroundContainer(wagon.instanceId);
      expect(carried).toBeDefined();

      // Something in the wagon's own cargo grid, to prove the contents survive.
      const cargo = new Item(createItemFromDef('crafting.wire'));
      expect(carried.getContainerGrid().addItem(cargo)).toBeTruthy();
      engine.activeDeviceId = carried.instanceId;

      const result = await RcVehicleMovement.driveActiveVehicle(px + 5, py, engine);

      expect(result.success).toBe(true);
      expect(inGroundContainer(carried.instanceId)).toBeUndefined();

      const arrived = wagonEntityAt(harness, px + 5, py, carried.instanceId);
      expect(arrived).toBeDefined();
      const contents = arrived.containerGrid?.items || arrived.containerGrid?.gridItems || [];
      expect(JSON.stringify(contents)).toContain('crafting.wire');
    });

    it('arrives in the ground container without eating what is already at the player\'s feet', async () => {
      const p = harness.player;
      const px = Math.round(p.x);
      const py = Math.round(p.y);

      // A decoy already lying at the player's feet. dropItemAtLocation's
      // refreshGroundItems path would silently destroy this one.
      const decoy = new Item(createItemFromDef('weapon.plank'));
      engine.inventoryManager.dropItemAtLocation(decoy, px, py, harness.gameMap);
      expect(inGroundContainer(decoy.instanceId)).toBeDefined();

      const id = linkOnMap(harness, makeWagon(), px + 3, py);
      const result = await RcVehicleMovement.driveActiveVehicle(px, py, engine);

      expect(result.success).toBe(true);
      expect(inGroundContainer(id)).toBeDefined();
      expect(inGroundContainer(decoy.instanceId)).toBeDefined();
    });

    it('leaves exactly one copy of the wagon behind, in one home', async () => {
      const id = linkOnMap(harness, makeWagon(), 5, 5);

      await RcVehicleMovement.driveActiveVehicle(10, 5, engine);

      expect(wagonEntityAt(harness, 5, 5, id)).toBeUndefined();
      expect(wagonEntityAt(harness, 10, 5, id)).toBeDefined();
      expect(inGroundContainer(id)).toBeUndefined();
      // And the phone is still linked to it under the same key.
      expect(engine.activeDeviceId).toBe(id);
    });
  });
});
