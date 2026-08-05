// Pins the wagon AP ladder. The whole point of the drag rework is that the
// numbers form a legible progression the player can reason about:
//
//   on foot   1.0 AP/tile      riding   0.5 AP/tile (the game's speed cap)
//   wagon     1.0 + max(0, base - motors - assist)
//
// Because the per-item penalty is clamped at zero, a wagon can only ever COST
// AP — the sole exception being a powered tow-cart, which keeps its ride bonus
// while hauling. These tests exist to catch a future tuning pass quietly
// breaking that invariant.

import { describe, it, expect } from 'vitest';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { VehicleUtils, MAX_STRENGTH_DRAG_BONUS } from '../../client/src/game/utils/VehicleUtils.js';

const MOTOR_PAIRS = [
  ['motor', 'battery'],
  ['motor_front', 'battery_front'],
  ['motor_middle', 'battery_middle'],
  ['motor_rear', 'battery_rear'],
];

/** A vehicle with exactly `motorCount` powered motor pairs installed. */
function makeVehicle(defId, motorCount = 0, { charge = 100 } = {}) {
  const v = new Item(createItemFromDef(defId));
  v.attachments = {}; // golf cart ships with defaultAttachments; start from bare metal

  const slotIds = new Set((v.attachmentSlots || []).map((s) => s.id));
  let installed = 0;
  for (const [motorSlot, batterySlot] of MOTOR_PAIRS) {
    if (installed >= motorCount) break;
    if (!slotIds.has(motorSlot) || !slotIds.has(batterySlot)) continue;
    v.attachments[motorSlot] = new Item(createItemFromDef('electric_motor'));
    const battery = new Item(createItemFromDef('tool.large_battery'));
    battery.ammoCount = charge;
    v.attachments[batterySlot] = battery;
    installed++;
  }
  expect(installed, `${defId} could not fit ${motorCount} motor pairs`).toBe(motorCount);
  return v;
}

const penalty = (item, strength, extra = {}) =>
  VehicleUtils.getStepDragPenalty(item, { playerStrength: strength, ...extra });

/** Straight cardinal path of `tiles` steps, so base cost == tiles. */
const straightPath = (tiles) =>
  Array.from({ length: tiles + 1 }, (_, i) => ({ x: i, y: 0 }));

const mapOf = (terrain) => ({ getTile: () => ({ terrain }) });

describe('Strength drag bonus', () => {
  it('grants +0.5 AP per 10 points, capped at +5', () => {
    const table = [
      [0, 0], [9, 0], [10, 0.5], [20, 1], [30, 1.5], [40, 2],
      [50, 2.5], [60, 3], [80, 4], [100, 5], [140, 5],
    ];
    for (const [strength, expected] of table) {
      expect(VehicleUtils.strengthDragBonus(strength), `Str ${strength}`).toBe(expected);
    }
    expect(MAX_STRENGTH_DRAG_BONUS).toBe(5);
  });

  it('never returns a negative bonus for missing or degraded Strength', () => {
    for (const bad of [undefined, null, 0, -30, NaN]) {
      expect(VehicleUtils.strengthDragBonus(bad)).toBe(0);
    }
  });
});

describe('Wagon drag penalty ladder', () => {
  // [defId, motorCount] -> penalty at Str 10 / 20 / 40 / 60 / 80 / 100
  const LADDER = [
    ['vehicle.toy_wagon',   0, [1.5, 1.0, 0.0, 0.0, 0.0, 0.0]],
    ['vehicle.toy_wagon',   1, [0.5, 0.0, 0.0, 0.0, 0.0, 0.0]],
    ['vehicle.wagon',       0, [4.5, 4.0, 3.0, 2.0, 1.0, 0.0]],
    ['vehicle.wagon',       1, [3.5, 3.0, 2.0, 1.0, 0.0, 0.0]],
    ['vehicle.wagon',       2, [2.5, 2.0, 1.0, 0.0, 0.0, 0.0]],
    ['vehicle.cargo_wagon', 0, [7.5, 7.0, 6.0, 5.0, 4.0, 3.0]],
    ['vehicle.cargo_wagon', 1, [6.5, 6.0, 5.0, 4.0, 3.0, 2.0]],
    ['vehicle.cargo_wagon', 2, [5.5, 5.0, 4.0, 3.0, 2.0, 1.0]],
    ['vehicle.cargo_wagon', 3, [4.5, 4.0, 3.0, 2.0, 1.0, 0.0]],
  ];
  const STRENGTHS = [10, 20, 40, 60, 80, 100];

  it.each(LADDER)('%s with %i motor(s) matches the tuning table', (defId, motors, expected) => {
    const wagon = makeVehicle(defId, motors);
    const actual = STRENGTHS.map((s) => penalty(wagon, s));
    expect(actual).toEqual(expected);
  });

  it('zeroes out at the intended Strength milestone when fully motorized', () => {
    expect(penalty(makeVehicle('vehicle.toy_wagon', 1), 20)).toBe(0);
    expect(penalty(makeVehicle('vehicle.wagon', 2), 60)).toBe(0);
    expect(penalty(makeVehicle('vehicle.cargo_wagon', 3), 100)).toBe(0);
  });

  it('never lets muscle alone zero the Cargo Wagon — its motors stay mandatory', () => {
    expect(penalty(makeVehicle('vehicle.cargo_wagon', 0), 100)).toBeGreaterThan(0);
    expect(penalty(makeVehicle('vehicle.cargo_wagon', 2), 100)).toBeGreaterThan(0);
  });

  it('costs at most +2 AP/tile for the Toy Wagon at ANY Strength', () => {
    const toy = makeVehicle('vehicle.toy_wagon', 0);
    for (let s = 0; s <= 100; s += 1) {
      expect(penalty(toy, s), `Str ${s}`).toBeLessThanOrEqual(2);
    }
  });

  it('never produces a negative penalty, for any wagon / motor / Strength combo', () => {
    for (const [defId, maxMotors] of [['vehicle.toy_wagon', 1], ['vehicle.wagon', 2], ['vehicle.cargo_wagon', 3]]) {
      for (let m = 0; m <= maxMotors; m++) {
        const wagon = makeVehicle(defId, m);
        for (let s = 0; s <= 140; s += 5) {
          expect(penalty(wagon, s), `${defId} m=${m} Str=${s}`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('ignores motors whose batteries are flat', () => {
    const dead = makeVehicle('vehicle.cargo_wagon', 3, { charge: 0 });
    const live = makeVehicle('vehicle.cargo_wagon', 3, { charge: 100 });
    expect(penalty(dead, 50)).toBe(penalty(makeVehicle('vehicle.cargo_wagon', 0), 50));
    expect(penalty(live, 50)).toBeLessThan(penalty(dead, 50));
  });
});

describe('Total move cost with a wagon', () => {
  const strength = 20;

  it('adds the flat penalty on top of the 1 AP/tile baseline', () => {
    const wagon = makeVehicle('vehicle.wagon', 0); // penalty 4.0 at Str 20
    const path = straightPath(5);
    const cost = VehicleUtils.calculateDragCost(wagon, path, mapOf('grass'), 5, {
      playerStrength: strength,
    });
    expect(cost).toBe(5 + 5 * 4); // 5.0 AP/tile
  });

  it('never drops below the 1 AP/tile walk baseline, however over-assisted', () => {
    const toy = makeVehicle('vehicle.toy_wagon', 1);
    const path = straightPath(5);
    const cost = VehicleUtils.calculateDragCost(toy, path, mapOf('grass'), 5, {
      playerStrength: 100,
    });
    expect(cost).toBe(5);
  });

  it('discounts roads once for the whole group, and never below zero drag', () => {
    const wagon = makeVehicle('vehicle.wagon', 0);
    const path = straightPath(4);
    const onRoad = VehicleUtils.calculateDragCost(wagon, path, mapOf('road'), 4, {
      playerStrength: strength,
    });
    expect(onRoad).toBe(4 + 4 * 3.5); // 4.0 penalty - 0.5 road

    // A wagon already at zero penalty gains nothing further from pavement.
    const light = makeVehicle('vehicle.toy_wagon', 1);
    expect(VehicleUtils.calculateDragCost(light, path, mapOf('road'), 4, { playerStrength: 100 })).toBe(4);
  });
});

describe('Remote drive cost (RC receiver)', () => {
  const remote = (item) => VehicleUtils.getRemoteStepPenalty(item);

  it('matches the headline table when fully motorized', () => {
    expect(remote(makeVehicle('vehicle.toy_wagon', 1))).toBe(2);
    expect(remote(makeVehicle('vehicle.wagon', 2))).toBe(4);
    expect(remote(makeVehicle('vehicle.cargo_wagon', 3))).toBe(6);
  });

  it('drops one AP per powered motor pair', () => {
    expect(remote(makeVehicle('vehicle.wagon', 0))).toBe(6);
    expect(remote(makeVehicle('vehicle.wagon', 1))).toBe(5);
    expect(remote(makeVehicle('vehicle.cargo_wagon', 1))).toBe(8);
    expect(remote(makeVehicle('vehicle.cargo_wagon', 2))).toBe(7);
  });

  it('is completely independent of Strength — no muscle is involved', () => {
    // getRemoteStepPenalty takes no player context at all; this pins that it
    // stays that way, since every other cost function on this object does.
    expect(VehicleUtils.getRemoteStepPenalty.length).toBe(1);
    const toy = makeVehicle('vehicle.toy_wagon', 1);
    expect(remote(toy)).toBe(2);
  });

  it('reverts to base + 1 when the batteries are flat', () => {
    expect(remote(makeVehicle('vehicle.toy_wagon', 1, { charge: 0 }))).toBe(3);
    expect(remote(makeVehicle('vehicle.cargo_wagon', 3, { charge: 0 }))).toBe(9);
  });

  it('never costs less than hand-pulling, and strictly more for any character with muscle', () => {
    for (const [defId, maxMotors] of [['vehicle.toy_wagon', 1], ['vehicle.wagon', 2], ['vehicle.cargo_wagon', 3]]) {
      for (let m = 0; m <= maxMotors; m++) {
        const wagon = makeVehicle(defId, m);
        for (const s of [0, 20, 60, 100]) {
          // Hand-pulling one tile costs the 1.0 walk baseline plus the penalty.
          const byHand = 1 + penalty(wagon, s);
          const label = `${defId} m=${m} Str=${s}`;
          expect(remote(wagon), label).toBeGreaterThanOrEqual(byHand);
          // The two tie only below Strength 10, where the surcharge exactly
          // replaces a muscle contribution that is itself zero. Characters
          // start at 20, so in practice remote driving always costs more.
          if (VehicleUtils.strengthDragBonus(s) > 0) {
            expect(remote(wagon), label).toBeGreaterThan(byHand);
          }
        }
      }
    }
  });

  it('takes the road discount per step and floors each step at 0.5', () => {
    const toy = makeVehicle('vehicle.toy_wagon', 1); // 2.0/tile
    const path = straightPath(4);
    expect(VehicleUtils.calculateRemoteDriveCost(toy, path, mapOf('grass'))).toBe(8);
    expect(VehicleUtils.calculateRemoteDriveCost(toy, path, mapOf('road'))).toBe(6);   // 1.5/tile
    expect(VehicleUtils.calculateRemoteDriveCost(toy, path, mapOf('sidewalk'))).toBe(6);

    expect(VehicleUtils.calculateRemoteDriveCost(makeVehicle('vehicle.wagon', 2), path, mapOf('road'))).toBe(14);
    expect(VehicleUtils.calculateRemoteDriveCost(makeVehicle('vehicle.cargo_wagon', 3), path, mapOf('road'))).toBe(22);
  });

  it('costs nothing for a zero-step path', () => {
    const toy = makeVehicle('vehicle.toy_wagon', 1);
    expect(VehicleUtils.calculateRemoteDriveCost(toy, straightPath(0), mapOf('grass'))).toBe(0);
    expect(VehicleUtils.calculateRemoteDriveCost(null, straightPath(4), mapOf('grass'))).toBe(0);
  });
});

describe('Riding', () => {
  const ride = (defId, motors, opts) => {
    const v = makeVehicle(defId, motors, opts);
    v.scooterMode = 'ride';
    return v;
  };

  it('halves the cost to 0.5 AP/tile', () => {
    const scooter = ride('vehicle.electric_scooter', 0);
    scooter.attachments.battery = Object.assign(new Item(createItemFromDef('tool.large_battery')), { ammoCount: 100 });
    const path = straightPath(6);
    const cost = VehicleUtils.calculateDragCost(scooter, path, mapOf('grass'), 6, {
      playerStrength: 20,
      riddenItemId: scooter.instanceId,
    });
    expect(cost).toBe(3);
  });

  it('withholds the ride bonus while hand-pulling an unhitched wagon', () => {
    const cart = ride('vehicle.golf_cart', 2);
    const wagon = makeVehicle('vehicle.wagon', 0); // NOT hitched
    const path = straightPath(4);
    const cost = VehicleUtils.calculateDragCost([cart, wagon], path, mapOf('grass'), 4, {
      playerStrength: 20,
      riddenItemId: cart.instanceId,
    });
    // No ride discount: both vehicles drag. Cart 3-2(motors)-1(Str)=0, wagon 5-1=4.
    expect(cost).toBe(4 + 4 * 4);
  });

  it('charges full drag for a "ridden" vehicle whose batteries are dead', () => {
    const cart = ride('vehicle.golf_cart', 2, { charge: 0 });
    const path = straightPath(3);
    const cost = VehicleUtils.calculateDragCost(cart, path, mapOf('grass'), 3, {
      playerStrength: 20,
      riddenItemId: cart.instanceId,
    });
    expect(cost).toBe(3 + 3 * 2); // base 3 - 0 motors - 1 Strength = 2/tile
  });
});

describe('Golf-cart towing', () => {
  function hitch(cart, wagon) {
    cart.hitchedItemInstanceId = wagon.instanceId;
    wagon.hitchedToInstanceId = cart.instanceId;
    cart.scooterMode = 'ride';
    return { items: [cart, wagon], ctx: { riddenItemId: cart.instanceId } };
  }

  it('hauls a fully-motorized Cargo Wagon at ride speed', () => {
    const cart = makeVehicle('vehicle.golf_cart', 2);
    const wagon = makeVehicle('vehicle.cargo_wagon', 3);
    const { items, ctx } = hitch(cart, wagon);
    const path = straightPath(8);
    const cost = VehicleUtils.calculateDragCost(items, path, mapOf('grass'), 8, {
      playerStrength: 20, ...ctx,
    });
    expect(cost).toBe(4); // 0.5 AP/tile
  });

  it('still charges for a bare Cargo Wagon behind the cart', () => {
    const cart = makeVehicle('vehicle.golf_cart', 2);
    const wagon = makeVehicle('vehicle.cargo_wagon', 0);
    const { items, ctx } = hitch(cart, wagon);
    const path = straightPath(4);
    const cost = VehicleUtils.calculateDragCost(items, path, mapOf('grass'), 4, {
      playerStrength: 20, ...ctx,
    });
    // wagon 8 - 6 (tow) = 2/tile, minus the 0.5 ride bonus => 2.5 AP/tile
    expect(cost).toBe(10);
  });

  it('makes Strength irrelevant to a towed wagon', () => {
    const build = (strength) => {
      const cart = makeVehicle('vehicle.golf_cart', 2);
      const wagon = makeVehicle('vehicle.cargo_wagon', 0);
      const { items, ctx } = hitch(cart, wagon);
      return VehicleUtils.calculateDragCost(items, straightPath(4), mapOf('grass'), 4, {
        playerStrength: strength, ...ctx,
      });
    };
    expect(build(10)).toBe(build(100));
  });

  it('falls back to muscle when the cart\'s batteries are dead, never doing worse than hand-pulling', () => {
    const cart = makeVehicle('vehicle.golf_cart', 2, { charge: 0 });
    const wagon = makeVehicle('vehicle.cargo_wagon', 0);
    const { items, ctx } = hitch(cart, wagon);
    const towed = VehicleUtils.calculateDragCost(items, straightPath(4), mapOf('grass'), 4, {
      playerStrength: 100, ...ctx,
    });
    const handPulled = VehicleUtils.calculateDragCost(wagon, straightPath(4), mapOf('grass'), 4, {
      playerStrength: 100,
    });
    // Dead cart adds its own drag, but the wagon itself is no harder than by hand.
    expect(penalty(wagon, 100, { riddenItemId: cart.instanceId, itemArray: items })).toBe(3);
    expect(towed).toBeGreaterThanOrEqual(handPulled);
  });
});
