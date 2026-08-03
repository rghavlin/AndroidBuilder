import { describe, it, expect } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import * as RemoteDeviceRegistry from '../../client/src/game/remote/RemoteDeviceRegistry.js';
import { consumeFlightCharge } from '../../client/src/game/remote/DronePower.js';
import engine from '../../client/src/game/GameEngine.js';

function freshBattery(charge = 20) {
  const battery = new Item(createItemFromDef('tool.battery'));
  battery.ammoCount = charge;
  return battery;
}

function equipPhone(harness, charge = 20) {
  const phone = harness.equipItemDef('tool.smartphone', 'phone');
  phone.attachItem('battery', freshBattery(charge));
  return phone;
}

describe('Serialization / drone round trip', () => {
  it('preserves an airborne drone, its battery charge, and the banked fraction through GameMap toJSON -> fromJSON', async () => {
    const harness = new GameHarness({ seed: 1 }).bootstrap();
    equipPhone(harness);
    const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
    stowed.attachItem('battery', freshBattery(20));

    const { drone } = RemoteDeviceRegistry.deploy(stowed, engine);
    // 1 tile at 0.5/tile banks a 0.5 fraction without touching the battery —
    // this is exactly the state that must NOT be lost on save/load.
    consumeFlightCharge(drone, 1);
    expect(drone._powerAccumulator).toBeCloseTo(0.5, 5);
    const chargeBeforeSave = drone.sourceItem.getBattery().ammoCount;

    const mapJSON = harness.gameMap.toJSON();
    const restoredMap = await GameMap.fromJSON(mapJSON);

    const restoredDrone = restoredMap.getEntitiesByType('drone')[0];
    expect(restoredDrone).toBeDefined();
    expect(restoredDrone.id).toBe(drone.id);
    expect(Math.round(restoredDrone.logicalX)).toBe(Math.round(drone.logicalX));
    expect(Math.round(restoredDrone.logicalY)).toBe(Math.round(drone.logicalY));
    expect(restoredDrone._powerAccumulator).toBeCloseTo(0.5, 5);
    expect(restoredDrone.sourceItem).toBeDefined();
    expect(restoredDrone.sourceItem.getBattery().ammoCount).toBe(chargeBeforeSave);
    expect(restoredDrone.operatorId).toBe(drone.operatorId);
    expect(restoredDrone.altitude).toBe('high');
    expect(restoredDrone.sightBonus).toBe(drone.sightBonus);
  });

  it('restores engine.activeDeviceId only when the referenced drone survived map restoration', async () => {
    const harness = new GameHarness({ seed: 1 }).bootstrap();
    equipPhone(harness);
    const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
    stowed.attachItem('battery', freshBattery(20));
    const { drone } = RemoteDeviceRegistry.deploy(stowed, engine);
    engine.activeDeviceId = drone.id;

    const mapJSON = harness.gameMap.toJSON();
    const restoredMap = await GameMap.fromJSON(mapJSON);

    engine.sync({
      gameMap: restoredMap,
      interactionState: { activeDeviceId: drone.id, isPlayerTurn: true }
    });

    expect(engine.activeDeviceId).toBe(drone.id);
  });

  it('falls back to null when the saved activeDeviceId no longer exists on the restored map', async () => {
    const harness = new GameHarness({ seed: 1 }).bootstrap();
    const mapJSON = harness.gameMap.toJSON();
    const restoredMap = await GameMap.fromJSON(mapJSON);

    engine.sync({
      gameMap: restoredMap,
      interactionState: { activeDeviceId: 'drone-that-no-longer-exists', isPlayerTurn: true }
    });

    expect(engine.activeDeviceId).toBeNull();
  });
});
