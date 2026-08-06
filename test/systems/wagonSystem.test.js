// The wagons' turn. An autonomous wagon spends its OWN 10 AP each end-turn to
// close the gap to a standing order, re-pathing as the world changes, until it
// arrives — and never touches the player's AP.
//
// Headless has no requestAnimationFrame, so nothing tweens: WagonSystem's move
// is committed during simulation regardless, which is precisely the property
// these tests are here to pin.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { RcVehicleConfig } from '../../client/src/game/config/RcVehicleConfig.js';
import * as AutoWagonOrders from '../../client/src/game/remote/AutoWagonOrders.js';
import { getRcVehicle } from '../../client/src/game/remote/RcVehicle.js';
import { SimulationManager } from '../../client/src/game/managers/SimulationManager.js';
import engine from '../../client/src/game/GameEngine.js';

const { AUTONOMOUS_MAX_AP, AUTO_MAX_FAILED_TURNS } = RcVehicleConfig;

const MOTOR_PAIRS = [
  ['motor', 'battery'],
  ['motor_front', 'battery_front'],
  ['motor_middle', 'battery_middle'],
  ['motor_rear', 'battery_rear'],
];

function makeWagon(defId = 'vehicle.toy_wagon', { motors = 1, controller = true, charge = 500 } = {}) {
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
  if (controller) {
    wagon.attachments.rc_receiver = new Item(createItemFromDef(controller === 'plain'
      ? 'tool.rc_receiver'
      : 'tool.autonomous_controller'));
  }
  return wagon;
}

/**
 * Issuing an order is a phone command, so the tests need a charged handset —
 * setDestination refuses outright without one.
 */
function equipChargedPhone() {
  const phone = new Item(createItemFromDef('tool.smartphone'));
  const battery = new Item(createItemFromDef('tool.battery'));
  battery.ammoCount = 999;
  phone.attachments = { battery };
  engine.inventoryManager.equipment.phone = phone;
  engine._phoneChargeTurn = null;
  return phone;
}

describe('systems/WagonSystem', () => {
  let harness;

  /** Drop a wagon on a far tile, link the phone, and order it to (x, y). */
  function deployAndOrder(wagon, at, dest, { expectSuccess = true } = {}) {
    engine.inventoryManager.dropItemAtLocation(wagon, at.x, at.y, harness.gameMap);
    engine.activeDeviceId = wagon.instanceId;
    engine._phoneChargeTurn = null; // one command per turn; tests issue several
    const result = AutoWagonOrders.setDestination(dest.x, dest.y, engine);
    // Fail loudly here rather than three assertions later with "expected 0 to be 5".
    if (expectSuccess && !result.success) {
      throw new Error(`setDestination refused: ${result.message}`);
    }
    return result;
  }

  /** Where the wagon is right now, from whichever home holds it. */
  const positionOf = (id) => {
    const device = getRcVehicle(engine, id);
    return device ? { x: device.x, y: device.y } : null;
  };

  beforeEach(() => {
    harness = new GameHarness({ seed: 3, width: 40, height: 40, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    engine.dragging = null;
    engine.riding = null;
    engine.autoWagonOrders = new Map();
    engine.activeDeviceId = null;
    engine.deviceControlMode = 'remote';
    equipChargedPhone();
  });

  describe('per-turn budget', () => {
    it.each([
      ['vehicle.toy_wagon', 1, 2],
      ['vehicle.wagon', 2, 4],
      ['vehicle.cargo_wagon', 3, 6],
    ])('%s covers floor(%d AP budget / cost) tiles per turn', (defId, motors, apPerTile) => {
      const wagon = makeWagon(defId, { motors });
      const expectedTiles = Math.floor(AUTONOMOUS_MAX_AP / apPerTile);

      // Destination far enough that the budget, not the distance, is the limit.
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 30, y: 5 });
      harness.endTurn();

      const pos = positionOf(wagon.instanceId);
      expect(pos.x - 5, defId).toBe(expectedTiles);
      expect(pos.y, defId).toBe(5);
    });

    it('costs the player nothing — the headline invariant', () => {
      const wagon = makeWagon('vehicle.cargo_wagon', { motors: 3 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 25, y: 5 });

      // Driven by hand this trip would cost 6 AP a tile. Run the simulation
      // directly rather than through harness.endTurn(), whose AP refill at the
      // end of the turn would paper over any deduction.
      harness.player.ap = 1;
      SimulationManager.runTurn(harness.gameMap, {
        player: harness.player, isSleeping: false, turn: harness.turn
      });

      expect(positionOf(wagon.instanceId).x).toBeGreaterThan(5);
      expect(harness.player.ap).toBe(1);
    });

    it('moves even when the player has no AP at all', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 25, y: 5 });

      harness.player.ap = 0;
      SimulationManager.runTurn(harness.gameMap, {
        player: harness.player, isSleeping: false, turn: harness.turn
      });

      expect(positionOf(wagon.instanceId).x).toBe(10);
      expect(harness.player.ap).toBe(0);
    });

    it('drains the wagon\'s own batteries by one per tile travelled', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1, charge: 500 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 30, y: 5 });

      harness.endTurn();

      const moved = positionOf(wagon.instanceId).x - 5;
      const device = getRcVehicle(engine, wagon.instanceId);
      const charge = device.item.attachments.battery.ammoCount;
      expect(moved).toBeGreaterThan(0);
      expect(charge).toBe(500 - moved);
    });
  });

  describe('the wagon exists exactly once afterwards', () => {
    it('leaves nothing behind on the tile it started from', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 20, y: 5 });

      harness.endTurn();

      // The regression guard for the discarded "move logicalX and animate later"
      // design: GameMap.removeEntity resolves the tile from logicalX, so a wagon
      // whose logical position had already advanced would be detached from the
      // DESTINATION tile and leave an invisible permanent blocker behind here.
      const start = harness.gameMap.getTile(5, 5);
      expect(start.contents.filter(e => e.instanceId === wagon.instanceId)).toHaveLength(0);
      expect((start.inventoryItems || []).filter(e => e?.instanceId === wagon.instanceId)).toHaveLength(0);
      expect(harness.gameMap.getItemsOnTile(5, 5)).toHaveLength(0);
    });

    it('appears on exactly one tile across the whole map', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 20, y: 5 });

      harness.endTurn();
      harness.endTurn();

      let sightings = 0;
      for (let x = 0; x < 40; x++) {
        for (let y = 0; y < 40; y++) {
          sightings += (harness.gameMap.getItemsOnTile(x, y) || [])
            .filter(e => e.instanceId === wagon.instanceId).length;
        }
      }
      const inContainer = engine.inventoryManager.groundContainer.getAllItems()
        .filter(it => it.instanceId === wagon.instanceId).length;

      expect(sightings + inContainer).toBe(1);
    });
  });

  describe('multi-turn travel', () => {
    it('keeps the order and advances each turn until it arrives', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 17, y: 5 }); // 12 tiles, 5/turn

      harness.endTurn();
      expect(positionOf(wagon.instanceId).x).toBe(10);
      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).not.toBeNull();

      harness.endTurn();
      expect(positionOf(wagon.instanceId).x).toBe(15);
      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).not.toBeNull();

      harness.endTurn();
      expect(positionOf(wagon.instanceId)).toEqual({ x: 17, y: 5 });
      // Arrived: the order (and its map marker) is gone.
      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toBeNull();
    });

    it('stops dead on arrival rather than overshooting', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 7, y: 5 }); // 2 tiles, budget buys 5

      harness.endTurn();

      expect(positionOf(wagon.instanceId)).toEqual({ x: 7, y: 5 });
      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toBeNull();
    });
  });

  describe('obstacles', () => {
    it('routes around a zombie that appears mid-journey', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 20, y: 5 });

      harness.endTurn();
      const afterFirst = positionOf(wagon.instanceId);

      // Park a zombie directly in the wagon's lane.
      harness.spawnZombie(afterFirst.x + 1, afterFirst.y);
      harness.endTurn();

      const afterSecond = positionOf(wagon.instanceId);
      // It kept making progress without ever standing on the zombie.
      expect(afterSecond.x).toBeGreaterThan(afterFirst.x);
      const occupied = harness.gameMap.getTile(afterSecond.x, afterSecond.y);
      expect(occupied.contents.some(e => e.type === 'zombie')).toBe(false);
    });

    it('gives up on a walled-off destination, but only after several turns', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);
      engine.activeDeviceId = wagon.instanceId;

      // setDestination refuses an unreachable target outright, so seed the order
      // directly — this is the "the route closed AFTER I set off" case.
      engine.autoWagonOrders.set(wagon.instanceId, {
        x: 20, y: 5, failedTurns: 0, lastBlockReason: null
      });
      for (let x = 9; x <= 9; x++) {
        for (let y = 0; y < 40; y++) harness.gameMap.setTerrain(x, y, 'water');
      }

      for (let i = 0; i < AUTO_MAX_FAILED_TURNS - 1; i++) harness.endTurn();
      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId),
        'should still be trying — a blocked doorway is usually temporary').not.toBeNull();

      harness.endTurn();
      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toBeNull();
    });
  });

  describe('blocked reasons keep the order', () => {
    // driveBlockedReason is reused verbatim from the player-driven path, so
    // remote and autonomous always agree on what "can't move" means.
    //
    // The hitch case deliberately uses the REVERSE link (a tow-cart naming the
    // wagon) rather than the wagon's own hitchedToInstanceId: for an on-map
    // wagon `device.item` is rebuilt through Entity.toJSON's field whitelist,
    // which does not carry that flag. The reverse check scans the ground
    // container directly and is the path that actually fires in play, since
    // hitching happens at the player's feet.
    it.each([
      ['dragging', (d) => { engine.dragging = { item: d.item, tileX: 5, tileY: 5 }; }],
      ['riding', (d) => { engine.riding = { item: d.item, tileX: 5, tileY: 5 }; }],
      ['hitched', (d) => {
        const cart = new Item(createItemFromDef('vehicle.wagon'));
        cart.hitchedItemInstanceId = d.item.instanceId;
        const p = harness.player;
        // The player's own tile routes into the ground container, which is
        // where driveBlockedReason looks for the towing half of the pair.
        engine.inventoryManager.dropItemAtLocation(cart, Math.round(p.x), Math.round(p.y), harness.gameMap);
      }],
    ])('%s: the wagon stays put but the order survives', (_label, entangle) => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 20, y: 5 });

      entangle(getRcVehicle(engine, wagon.instanceId));

      harness.endTurn();

      expect(positionOf(wagon.instanceId)).toEqual({ x: 5, y: 5 });
      // The player will let go eventually; the errand should resume, not vanish.
      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).not.toBeNull();
    });

    it('a flat battery halts it without cancelling the order', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1, charge: 3 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 30, y: 5 });

      harness.endTurn(); // spends the last 3 charge covering 3 tiles
      const stranded = positionOf(wagon.instanceId);

      harness.endTurn();
      harness.endTurn();

      expect(positionOf(wagon.instanceId)).toEqual(stranded);
      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).not.toBeNull();
    });
  });

  describe('order lifecycle', () => {
    it('drops the order when the wagon leaves both of its homes', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 20, y: 5 });

      harness.gameMap.setItemsOnTile(5, 5, []);
      harness.endTurn();

      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toBeNull();
    });

    it('drops the order if the controller is swapped back for a plain receiver', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 20, y: 5 });

      const device = getRcVehicle(engine, wagon.instanceId);
      device.entity.attachments.rc_receiver = { defId: 'tool.rc_receiver' };

      harness.endTurn();

      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toBeNull();
      expect(positionOf(wagon.instanceId)).toEqual({ x: 5, y: 5 });
    });

    it('a new destination replaces the old one outright', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: 5, y: 5 }, { x: 20, y: 5 });
      AutoWagonOrders.setDestination(5, 20, engine);

      expect(engine.autoWagonOrders.size).toBe(1);
      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toMatchObject({ x: 5, y: 20 });
    });

    it('lands in the ground container when sent to the player\'s own tile', () => {
      const p = harness.player;
      const px = Math.round(p.x);
      const py = Math.round(p.y);

      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      deployAndOrder(wagon, { x: px + 3, y: py }, { x: px, y: py });

      harness.endTurn();

      // The player's tile is owned by the ground container, so the wagon has no
      // map entity at journey's end — recalling one has to still work.
      const inContainer = engine.inventoryManager.groundContainer.getAllItems()
        .find(it => it.instanceId === wagon.instanceId);
      expect(inContainer).toBeDefined();
      expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toBeNull();
    });
  });

  describe('several wagons at once', () => {
    it('advances every wagon in the same end-turn', () => {
      const a = makeWagon('vehicle.toy_wagon', { motors: 1 });
      const b = makeWagon('vehicle.toy_wagon', { motors: 1 });

      deployAndOrder(a, { x: 5, y: 5 }, { x: 25, y: 5 });
      deployAndOrder(b, { x: 5, y: 12 }, { x: 25, y: 12 });

      harness.endTurn();

      expect(positionOf(a.instanceId).x).toBe(10);
      expect(positionOf(b.instanceId).x).toBe(10);
    });
  });

  describe('setDestination', () => {
    it('refuses a wagon carrying only a plain receiver', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1, controller: 'plain' });
      const result = deployAndOrder(wagon, { x: 5, y: 5 }, { x: 20, y: 5 }, { expectSuccess: false });

      expect(result.success).toBe(false);
      expect(engine.autoWagonOrders.size).toBe(0);
    });

    it('refuses when the phone has no charge — it is still a phone command', () => {
      engine.inventoryManager.equipment.phone = null;
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      const result = deployAndOrder(wagon, { x: 5, y: 5 }, { x: 20, y: 5 }, { expectSuccess: false });

      expect(result.success).toBe(false);
      expect(engine.autoWagonOrders.size).toBe(0);
    });

    it('refuses an unreachable destination up front, while the player is looking', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);
      engine.activeDeviceId = wagon.instanceId;

      for (let y = 0; y < 40; y++) harness.gameMap.setTerrain(9, y, 'water');

      const result = AutoWagonOrders.setDestination(20, 5, engine);
      expect(result.success).toBe(false);
      expect(result.message).toBe('No route there');
      expect(engine.autoWagonOrders.size).toBe(0);
    });

    it('reports a trip length that matches how long the trip actually takes', () => {
      const wagon = makeWagon('vehicle.toy_wagon', { motors: 1 });
      engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);
      engine.activeDeviceId = wagon.instanceId;

      const path = [];
      for (let x = 5; x <= 17; x++) path.push({ x, y: 5 });
      const device = getRcVehicle(engine, wagon.instanceId);
      const predicted = AutoWagonOrders.estimateTurns(path, device.item, harness.gameMap);

      AutoWagonOrders.setDestination(17, 5, engine);
      let actual = 0;
      while (AutoWagonOrders.getOrder(engine, wagon.instanceId) && actual < 20) {
        harness.endTurn();
        actual++;
      }

      expect(actual).toBe(predicted);
    });
  });
});
