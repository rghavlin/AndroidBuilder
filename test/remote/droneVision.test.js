import { describe, it, expect } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Drone } from '../../client/src/game/entities/Drone.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { collectDeviceFov, deviceFovHashPart } from '../../client/src/game/remote/DroneVision.js';
import engine from '../../client/src/game/GameEngine.js';

// The drone sits far enough from the player (25 tiles) that its own tile is
// well outside the player's own vision at any plausible range (max ~15-20
// with perception/scope bonuses), while a probe tile 2 away from the drone
// is comfortably inside the drone's own ~18-tile range. This avoids any
// dependency on the exact day/night/perception math.
const WIDTH = 60;
const HEIGHT = 10;
// GameHarness spawns the player at the map's center (WIDTH/2, HEIGHT/2) —
// used as-is rather than repositioned, so the player stays correctly
// registered on its own tile.
const PLAYER_POS = { x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) };
const DRONE_POS = { x: PLAYER_POS.x - 25, y: PLAYER_POS.y };
const NEAR_DRONE = { x: DRONE_POS.x + 2, y: DRONE_POS.y }; // 2 from the drone, 23 from the player

function buildHarness() {
  return new GameHarness({ seed: 1, width: WIDTH, height: HEIGHT, terrain: 'grass' }).bootstrap();
}

function addDrone(harness, pos = DRONE_POS) {
  const drone = new Drone('vision-drone-1', pos.x, pos.y, 'recon');
  harness.gameMap.addEntity(drone, pos.x, pos.y);
  return drone;
}

describe('remote/DroneVision — collectDeviceFov', () => {
  it('returns nothing when no devices are deployed', () => {
    const harness = buildHarness();
    expect(collectDeviceFov(harness.gameMap, 15)).toEqual([]);
    expect(deviceFovHashPart(harness.gameMap)).toBe('');
  });

  it('centers each device\'s own FOV on its own tile, not the player\'s', () => {
    const harness = buildHarness();
    addDrone(harness);
    const tiles = collectDeviceFov(harness.gameMap, 15);
    const key = (t) => `${Math.round(t.x)},${Math.round(t.y)}`;
    const keys = new Set(tiles.map(key));
    expect(keys.has(`${NEAR_DRONE.x},${NEAR_DRONE.y}`)).toBe(true);
    expect(keys.has(`${DRONE_POS.x},${DRONE_POS.y}`)).toBe(true);
  });

  it('changes hash when the drone moves, and is stable when it does not', () => {
    const harness = buildHarness();
    const drone = addDrone(harness);
    const hash1 = deviceFovHashPart(harness.gameMap);
    expect(deviceFovHashPart(harness.gameMap)).toBe(hash1); // stable, no move

    harness.gameMap.moveEntity(drone.id, DRONE_POS.x + 1, DRONE_POS.y);
    const hash2 = deviceFovHashPart(harness.gameMap);
    expect(hash2).not.toBe(hash1);
  });
});

describe('GameEngine.recalculateFOV — device union', () => {
  it('lights a tile beyond the player\'s own sight but within the drone\'s radius', () => {
    const harness = buildHarness();
    addDrone(harness);

    engine.recalculateFOV();

    expect(engine.playerFovSet.has(`${NEAR_DRONE.x},${NEAR_DRONE.y}`)).toBe(true);
    const tile = harness.gameMap.getTile(NEAR_DRONE.x, NEAR_DRONE.y);
    expect(tile.flags.explored).toBe(true);
  });

  it('a tile explored by the drone stays explored after the drone leaves, but drops out of the live visibility set', () => {
    const harness = buildHarness();
    const drone = addDrone(harness);

    engine.recalculateFOV();
    expect(engine.playerFovSet.has(`${NEAR_DRONE.x},${NEAR_DRONE.y}`)).toBe(true);

    harness.gameMap.removeEntity(drone.id);
    engine._lastFovOptionsHash = ''; // force recompute (hash would already differ in real play)
    engine.recalculateFOV();

    expect(engine.playerFovSet.has(`${NEAR_DRONE.x},${NEAR_DRONE.y}`)).toBe(false);
    const tile = harness.gameMap.getTile(NEAR_DRONE.x, NEAR_DRONE.y);
    expect(tile.flags.explored).toBe(true); // one-way flag — never un-explored
  });

  it('does not see through a wall adjacent to the drone', () => {
    const harness = buildHarness();
    harness.gameMap.setTerrain(DRONE_POS.x + 1, DRONE_POS.y, 'wall');
    addDrone(harness);

    engine.recalculateFOV();

    // Directly behind the wall from the drone's own position.
    expect(engine.playerFovSet.has(`${DRONE_POS.x + 2},${DRONE_POS.y}`)).toBe(false);
  });
});

describe('remote/DroneVision — RC wagon camera', () => {
  // The wagon is parked where the drone sits in the tests above: 25 tiles from
  // the player, far outside their own sight at any plausible range.
  const WAGON_POS = DRONE_POS;
  const NEAR_WAGON = { x: WAGON_POS.x + 2, y: WAGON_POS.y };
  const FAR_FROM_WAGON = { x: WAGON_POS.x + 6, y: WAGON_POS.y }; // beyond SIGHT_RANGE 3

  function addWagon(harness, { receiver = 'tool.rc_receiver', pos = WAGON_POS } = {}) {
    const wagon = new Item(createItemFromDef('vehicle.toy_wagon'));
    wagon.attachments = {};
    if (receiver) wagon.attachments.rc_receiver = new Item(createItemFromDef(receiver));
    engine.inventoryManager.dropItemAtLocation(wagon, pos.x, pos.y, harness.gameMap);
    return wagon;
  }

  const key = (t) => `${Math.round(t.x)},${Math.round(t.y)}`;
  const keysOf = (tiles) => new Set(tiles.map(key));

  it('sees only while the phone is actually linked to it', () => {
    const harness = buildHarness();
    const wagon = addWagon(harness);

    engine.activeDeviceId = null;
    expect(collectDeviceFov(harness.gameMap, 15, engine)).toEqual([]);
    expect(deviceFovHashPart(harness.gameMap, engine)).toBe('');

    engine.activeDeviceId = wagon.instanceId;
    const tiles = collectDeviceFov(harness.gameMap, 15, engine);
    expect(keysOf(tiles).has(key(NEAR_WAGON))).toBe(true);
  });

  it('contributes nothing without a receiver fitted', () => {
    const harness = buildHarness();
    const wagon = addWagon(harness, { receiver: false });
    engine.activeDeviceId = wagon.instanceId;
    expect(collectDeviceFov(harness.gameMap, 15, engine)).toEqual([]);
  });

  it('sees just the same with an autonomous controller fitted', () => {
    // DroneVision gates on hasReceiver. The controller has to satisfy that
    // broad predicate or a wagon fitted with one goes blind — one of several
    // systems that would fail at once if hasReceiver narrowed back to equality.
    const harness = buildHarness();
    const wagon = addWagon(harness, { receiver: 'tool.autonomous_controller' });
    engine.activeDeviceId = wagon.instanceId;

    const tiles = collectDeviceFov(harness.gameMap, 15, engine);
    expect(keysOf(tiles).has(key(NEAR_WAGON))).toBe(true);
    expect(keysOf(tiles).has(key(FAR_FROM_WAGON))).toBe(false);
  });

  it('sees at its OWN fixed range, not the player\'s — a flashlight does not help a cart', () => {
    const harness = buildHarness();
    const wagon = addWagon(harness);
    engine.activeDeviceId = wagon.instanceId;

    const atShortRange = collectDeviceFov(harness.gameMap, 15, engine);
    const atLongRange = collectDeviceFov(harness.gameMap, 25, engine);
    expect(atLongRange.length).toBe(atShortRange.length);

    // And that fixed range is genuinely short.
    expect(keysOf(atShortRange).has(key(FAR_FROM_WAGON))).toBe(false);
  });

  it('changes hash when it moves, and is stable when it does not', () => {
    const harness = buildHarness();
    const wagon = addWagon(harness);
    engine.activeDeviceId = wagon.instanceId;

    const hash1 = deviceFovHashPart(harness.gameMap, engine);
    expect(deviceFovHashPart(harness.gameMap, engine)).toBe(hash1);

    harness.gameMap.moveEntity(wagon.instanceId, WAGON_POS.x + 1, WAGON_POS.y);
    expect(deviceFovHashPart(harness.gameMap, engine)).not.toBe(hash1);
  });

  it('lights its surroundings in the engine\'s real FOV union', () => {
    const harness = buildHarness();
    const wagon = addWagon(harness);
    engine.activeDeviceId = wagon.instanceId;

    engine._lastFovOptionsHash = '';
    engine.recalculateFOV();

    expect(engine.playerFovSet.has(key(NEAR_WAGON))).toBe(true);
    expect(harness.gameMap.getTile(NEAR_WAGON.x, NEAR_WAGON.y).flags.explored).toBe(true);
  });
});
