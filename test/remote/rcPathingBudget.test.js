// countTurnsForPath is the number the player is shown while aiming an
// autonomous destination ("3t"), so it has to agree exactly with the greedy
// slicing WagonSystem actually performs turn by turn. A quoted trip length the
// wagon then misses by a turn is a bug the player can see.
//
// It replaced a loop that called sliceLegByAp and re-sliced the remaining path
// each iteration — correct, but it copied a shrinking tail of the path on every
// turn while running on every mouse move. These tests pin the equivalence so the
// faster single pass can't drift from the rule it replaced.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { sliceLegByAp, countTurnsForPath } from '../../client/src/game/remote/RcPathing.js';
import { RcVehicleConfig } from '../../client/src/game/config/RcVehicleConfig.js';

const BUDGET = RcVehicleConfig.AUTONOMOUS_MAX_AP;

const MOTOR_PAIRS = [
  ['motor', 'battery'],
  ['motor_front', 'battery_front'],
  ['motor_middle', 'battery_middle'],
  ['motor_rear', 'battery_rear'],
];

function makeWagon(defId, motors) {
  const wagon = new Item(createItemFromDef(defId));
  wagon.attachments = {};
  const slotIds = new Set((wagon.attachmentSlots || []).map(s => s.id));
  let installed = 0;
  for (const [motorSlot, batterySlot] of MOTOR_PAIRS) {
    if (installed >= motors) break;
    if (!slotIds.has(motorSlot) || !slotIds.has(batterySlot)) continue;
    wagon.attachments[motorSlot] = new Item(createItemFromDef('electric_motor'));
    const battery = new Item(createItemFromDef('tool.large_battery'));
    battery.ammoCount = 500;
    wagon.attachments[batterySlot] = battery;
    installed++;
  }
  return wagon;
}

/** The original implementation, kept here as the reference oracle. */
function countTurnsBySlicing(path, item, gameMap) {
  if (!path || path.length <= 1) return 0;
  let remaining = path;
  let turns = 0;
  while (remaining.length > 1) {
    const { leg } = sliceLegByAp(remaining, item, gameMap, BUDGET);
    if (leg.length <= 1) return Infinity;
    remaining = remaining.slice(leg.length - 1);
    turns++;
  }
  return turns;
}

describe('RcPathing.countTurnsForPath', () => {
  let harness;

  const straightPath = (from, to, y) => {
    const out = [];
    for (let x = from; x <= to; x++) out.push({ x, y });
    return out;
  };

  beforeEach(() => {
    harness = new GameHarness({ seed: 12, width: 60, height: 20, terrain: 'grass' }).bootstrap();
  });

  it.each([
    ['vehicle.toy_wagon', 1],
    ['vehicle.wagon', 2],
    ['vehicle.cargo_wagon', 3],
  ])('agrees with the slicing implementation for %s over many lengths', (defId, motors) => {
    const wagon = makeWagon(defId, motors);
    for (let len = 1; len <= 25; len++) {
      const path = straightPath(2, 2 + len, 10);
      expect(
        countTurnsForPath(path, wagon, harness.gameMap, BUDGET),
        `${defId} over ${len} tiles`
      ).toBe(countTurnsBySlicing(path, wagon, harness.gameMap));
    }
  });

  it('agrees over mixed terrain, where per-tile cost varies', () => {
    // Roads discount a step, so the turn boundaries land differently — this is
    // the case a "divide total cost by budget" shortcut would get wrong.
    for (let x = 2; x < 30; x += 3) {
      harness.gameMap.setTerrain(x, 10, 'road');
      harness.gameMap.setTerrain(x + 1, 10, 'road');
    }
    const wagon = makeWagon('vehicle.toy_wagon', 1);

    for (let len = 1; len <= 25; len++) {
      const path = straightPath(2, 2 + len, 10);
      expect(
        countTurnsForPath(path, wagon, harness.gameMap, BUDGET),
        `mixed terrain over ${len} tiles`
      ).toBe(countTurnsBySlicing(path, wagon, harness.gameMap));
    }
  });

  it('matches the first leg sliceLegByAp actually takes', () => {
    // The tightest coupling: a one-turn trip must be exactly what one slice
    // covers, or the estimate and the first move disagree immediately.
    const wagon = makeWagon('vehicle.toy_wagon', 1);
    const path = straightPath(2, 40, 10);
    const { leg } = sliceLegByAp(path, wagon, harness.gameMap, BUDGET);

    expect(countTurnsForPath(leg, wagon, harness.gameMap, BUDGET)).toBe(1);
    // One tile further is one turn more.
    expect(countTurnsForPath(path.slice(0, leg.length + 1), wagon, harness.gameMap, BUDGET)).toBe(2);
  });

  it('returns 0 for a path with nowhere to go', () => {
    const wagon = makeWagon('vehicle.toy_wagon', 1);
    expect(countTurnsForPath([], wagon, harness.gameMap, BUDGET)).toBe(0);
    expect(countTurnsForPath([{ x: 2, y: 10 }], wagon, harness.gameMap, BUDGET)).toBe(0);
    expect(countTurnsForPath(null, wagon, harness.gameMap, BUDGET)).toBe(0);
  });

  it('returns Infinity when a single step costs more than a whole turn', () => {
    // An unmotorized cargo wagon prices a tile at 9 AP... still affordable.
    // Shrink the budget instead: same arithmetic, unambiguous outcome.
    const wagon = makeWagon('vehicle.cargo_wagon', 0);
    const path = straightPath(2, 12, 10);

    expect(countTurnsForPath(path, wagon, harness.gameMap, 1)).toBe(Infinity);
    expect(countTurnsBySlicing(path, wagon, harness.gameMap)).toBe(
      countTurnsForPath(path, wagon, harness.gameMap, BUDGET)
    );
  });

  it('does not mutate the path it is given', () => {
    const wagon = makeWagon('vehicle.toy_wagon', 1);
    const path = straightPath(2, 30, 10);
    const snapshot = JSON.stringify(path);

    countTurnsForPath(path, wagon, harness.gameMap, BUDGET);

    expect(JSON.stringify(path)).toBe(snapshot);
  });
});
