// Drones over low terrain.
//
// A recon drone is meant to clear a fence. Pathfinding already let it, because
// findPath admits ANY target tile walkable or not — but Tile.isWalkable then
// refused the placement, so moveEntity failed and the drone's logical position
// stayed one tile behind the render coords the tween had already moved. In
// game that read as the drone teleporting back to its pre-fence tile at the
// start of its next flight, and as landing on a tile it was never shown on.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { isTerrainFlyable, isTerrainWalkable } from '../../client/src/game/map/TerrainTypes.js';
import * as RemoteDeviceRegistry from '../../client/src/game/remote/RemoteDeviceRegistry.js';
import * as DroneMovement from '../../client/src/game/remote/DroneMovement.js';
import engine from '../../client/src/game/GameEngine.js';

function freshBattery(charge = 20) {
  const battery = new Item(createItemFromDef('tool.battery'));
  battery.ammoCount = charge;
  return battery;
}

function deployDrone(harness, charge = 20) {
  const phone = harness.equipItemDef('tool.smartphone', 'phone');
  phone.attachItem('battery', freshBattery(charge));
  engine.isPhoneOn = true;

  const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
  stowed.attachItem('battery', freshBattery(charge));
  RemoteDeviceRegistry.deploy(stowed, engine);
  const deployed = engine.inventoryManager.groundContainer.getAllItems()
    .find(it => it.defId === 'tool.recon_drone');
  const result = RemoteDeviceRegistry.launch(deployed, engine);
  engine.activeDeviceId = result.drone.id;
  return result.drone;
}

describe('terrain flight properties', () => {
  it('lets a drone over a fence but not through a wall', () => {
    expect(isTerrainFlyable('fence')).toBe(true);
    expect(isTerrainWalkable('fence')).toBe(false);

    for (const solid of ['wall', 'building', 'tree', 'brick', 'metal_wall', 'tent_wall']) {
      expect(isTerrainFlyable(solid)).toBe(false);
    }
  });

  it('leaves ordinary ground flyable and unknown terrain open', () => {
    expect(isTerrainFlyable('grass')).toBe(true);
    expect(isTerrainFlyable('floor')).toBe(true);
    expect(isTerrainFlyable('not_a_real_terrain')).toBe(true);
  });
});

describe('remote/DroneMovement over a fence', () => {
  let harness;
  let fenceY;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1, width: 20, height: 20, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);

    // A fence line two tiles south of the player, running the map's full width.
    fenceY = Math.round(p.gridY) + 2;
    for (let x = 0; x < harness.gameMap.width; x++) {
      harness.gameMap.setTerrain(x, fenceY, 'fence');
    }
  });

  it('moves the drone LOGICAL position onto the fence tile, not just its render coords', async () => {
    const drone = deployDrone(harness);
    const startX = Math.round(drone.logicalX);

    const result = await DroneMovement.moveActiveDevice(startX, fenceY, engine);

    expect(result.success).toBe(true);
    expect(Math.round(drone.logicalX)).toBe(startX);
    expect(Math.round(drone.logicalY)).toBe(fenceY);
    // The desync that caused the teleport: render coords ahead of logical ones.
    expect(Math.round(drone.renderX)).toBe(Math.round(drone.logicalX));
    expect(Math.round(drone.renderY)).toBe(Math.round(drone.logicalY));
  });

  it('flies on from the fence tile without snapping back first', async () => {
    const drone = deployDrone(harness);
    const startX = Math.round(drone.logicalX);

    await DroneMovement.moveActiveDevice(startX, fenceY, engine);
    // The second hop is pathed from wherever the drone logically is. If the
    // first move never landed, this path starts a tile away and the drone
    // visibly jumps there first.
    const second = await DroneMovement.moveActiveDevice(startX + 1, fenceY, engine);

    expect(second.success).toBe(true);
    expect(second.tiles).toBe(1);
    expect(Math.round(drone.logicalX)).toBe(startX + 1);
    expect(Math.round(drone.logicalY)).toBe(fenceY);
  });

  it('crosses a solid fence line to the far side in one flight', async () => {
    const drone = deployDrone(harness);
    const startX = Math.round(drone.logicalX);

    const result = await DroneMovement.moveActiveDevice(startX, fenceY + 2, engine);

    expect(result.success).toBe(true);
    expect(Math.round(drone.logicalY)).toBe(fenceY + 2);
  });

  it('is still stopped by a wall', async () => {
    const drone = deployDrone(harness);
    const startX = Math.round(drone.logicalX);
    const wallY = Math.round(drone.logicalY) - 2;
    for (let x = 0; x < harness.gameMap.width; x++) {
      harness.gameMap.setTerrain(x, wallY, 'wall');
    }

    const blocked = await DroneMovement.moveActiveDevice(startX, wallY - 1, engine);
    expect(blocked.success).toBe(false);
  });

  it('lands off the fence, onto a tile the player can actually reach', async () => {
    const drone = deployDrone(harness);
    const startX = Math.round(drone.logicalX);
    await DroneMovement.moveActiveDevice(startX, fenceY, engine);

    const landed = RemoteDeviceRegistry.land(drone, engine, { chargeAp: false });

    expect(landed.success).toBe(true);
    expect(harness.gameMap.getTile(landed.x, landed.y).isWalkable()).toBe(true);
    // It comes down beside the fence, not back at the tile it launched from.
    expect(Math.abs(landed.y - fenceY)).toBe(1);
    expect(landed.x).toBe(startX);
  });
});
