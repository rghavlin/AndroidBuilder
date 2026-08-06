// Where the camera looks when the phone cycles to a device.
//
// The bug this pins: cycling to a device standing on the player's own tile sent
// the camera to the top-left corner of the map. That tile is owned by the ground
// container, so the device is a plain Item there — and an Item's x/y are the
// cell it occupies inside the container's grid, not map coordinates. Reading
// them as tiles resolves to (0, 0), which is off in the fog with nothing in it.
//
// The rule: only an entity with logicalX/logicalY has a world position. Anything
// in the ground container is, by definition, at the player's feet.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Drone } from '../../client/src/game/entities/Drone.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import * as RemoteDeviceRegistry from '../../client/src/game/remote/RemoteDeviceRegistry.js';
import engine from '../../client/src/game/GameEngine.js';

const { focusPointOf, listControllables } = RemoteDeviceRegistry;

function makeAutoWagon() {
  const wagon = new Item(createItemFromDef('vehicle.toy_wagon'));
  const battery = new Item(createItemFromDef('tool.large_battery'));
  battery.ammoCount = 500;
  wagon.attachments = {
    motor: new Item(createItemFromDef('electric_motor')),
    battery,
    rc_receiver: new Item(createItemFromDef('tool.autonomous_controller'))
  };
  return wagon;
}

describe('remote/focusPointOf', () => {
  let harness;
  let playerTile;

  beforeEach(() => {
    harness = new GameHarness({ seed: 6, width: 40, height: 40, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    playerTile = { x: Math.round(p.x), y: Math.round(p.y) };
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    engine.activeDeviceId = null;
  });

  /** Drop at the player's feet — routes into the ground container. */
  const dropAtFeet = (item) => {
    engine.inventoryManager.dropItemAtLocation(item, playerTile.x, playerTile.y, harness.gameMap);
    return engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.instanceId === item.instanceId);
  };

  it('never returns the map corner for a device underfoot', () => {
    // The exact reported symptom, stated as an invariant.
    const wagon = makeAutoWagon();
    dropAtFeet(wagon);

    const target = listControllables(engine).find(d => d.key === wagon.instanceId);
    expect(target, 'the wagon should be cyclable').toBeDefined();

    const focus = focusPointOf(target, engine);
    expect(focus).toEqual(playerTile);
    expect(focus).not.toEqual({ x: 0, y: 0 });
  });

  it('ignores an Item\'s container-grid x/y, which are not map tiles', () => {
    const wagon = makeAutoWagon();
    const inContainer = dropAtFeet(wagon);

    // Demonstrate the trap: the Item really does carry small x/y that look like
    // plausible tile coordinates but address the container's grid.
    expect(inContainer.logicalX).toBeUndefined();
    expect(inContainer.x).not.toBe(playerTile.x);

    expect(focusPointOf({ kind: 'rc-vehicle', item: inContainer }, engine)).toEqual(playerTile);
  });

  it('uses the real tile for a wagon parked out on the map', () => {
    const wagon = makeAutoWagon();
    engine.inventoryManager.dropItemAtLocation(wagon, 7, 9, harness.gameMap);

    const target = listControllables(engine).find(d => d.key === wagon.instanceId);
    expect(focusPointOf(target, engine)).toEqual({ x: 7, y: 9 });
  });

  it('follows an airborne drone to its own position', () => {
    const drone = new Drone('focus-drone', 12, 15, 'recon');
    harness.gameMap.addEntity(drone, 12, 15);

    const target = { kind: 'drone-air', drone };
    expect(focusPointOf(target, engine)).toEqual({ x: 12, y: 15 });
  });

  it('returns the player\'s tile when cycling back past the last device', () => {
    // A null target means "you are in control of yourself again".
    expect(focusPointOf(null, engine)).toEqual(playerTile);
  });

  it('stays on the player rather than throwing on a malformed target', () => {
    expect(focusPointOf({ kind: 'drone-air', drone: null }, engine)).toEqual(playerTile);
    expect(focusPointOf({ kind: 'rc-vehicle', item: null }, engine)).toEqual(playerTile);
    expect(focusPointOf({ kind: 'drone-ground' }, engine)).toEqual(playerTile);
  });

  it('tracks the player after they walk away from where the container synced', () => {
    const wagon = makeAutoWagon();
    const inContainer = dropAtFeet(wagon);

    harness.player.x = playerTile.x + 4;
    harness.player.y = playerTile.y + 3;
    const moved = { x: playerTile.x + 4, y: playerTile.y + 3 };
    engine.inventoryManager.syncWithMap(moved.x, moved.y, moved.x, moved.y, harness.gameMap);

    // Whatever is still in the ground container came along with the player.
    const focus = focusPointOf({ kind: 'rc-vehicle', item: inContainer }, engine);
    expect(focus).toEqual(moved);
  });
});
