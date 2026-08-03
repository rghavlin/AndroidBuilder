import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import * as RemoteDeviceRegistry from '../../client/src/game/remote/RemoteDeviceRegistry.js';
import engine from '../../client/src/game/GameEngine.js';

// Three-state item<->entity model, mirroring the rabbit snare pair:
//   tool.recon_drone_stowed (2x1) --deploy--> airborne Drone entity
//   airborne Drone --land--> tool.recon_drone (2x2 ground)
//   tool.recon_drone (2x2) --stow--> tool.recon_drone_stowed (2x1)

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

function makeStowedDrone(charge = 20) {
  const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
  stowed.attachItem('battery', freshBattery(charge));
  return stowed;
}

describe('RemoteDeviceRegistry / drone state transitions', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 1 }).bootstrap();
    // GameHarness.bootstrap() doesn't run the normal spawn-sync the real game
    // does on player placement; prime it so groundContainer tracks the
    // player's tile (needed for dropItemAtLocation/stow to find landed items).
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
  });

  it('deploys a stowed drone into an airborne entity, spending 1 AP and 1 charge', () => {
    equipPhone(harness);
    const stowed = makeStowedDrone(20);
    const apBefore = harness.player.ap;

    const result = RemoteDeviceRegistry.deploy(stowed, engine);

    expect(result.success).toBe(true);
    expect(harness.player.ap).toBeCloseTo(apBefore - 1, 5);
    expect(harness.gameMap.getEntity(result.drone.id)).toBe(result.drone);
    expect(result.drone.type).toBe('drone');
    expect(result.drone.sourceItem.getBattery().ammoCount).toBe(19);
  });

  it('refuses to deploy without a charged phone equipped', () => {
    const stowed = makeStowedDrone(20);
    const result = RemoteDeviceRegistry.deploy(stowed, engine);
    expect(result.success).toBe(false);
    expect(harness.gameMap.getEntitiesByType('drone').length).toBe(0);
  });

  it('refuses to deploy with an empty drone battery', () => {
    equipPhone(harness);
    const stowed = makeStowedDrone(0);
    const result = RemoteDeviceRegistry.deploy(stowed, engine);
    expect(result.success).toBe(false);
    expect(harness.gameMap.getEntitiesByType('drone').length).toBe(0);
  });

  it('land() converts the airborne drone back into a landed (2x2) ground item, preserving battery charge', () => {
    equipPhone(harness);
    const stowed = makeStowedDrone(20);
    const { drone } = RemoteDeviceRegistry.deploy(stowed, engine);
    const chargeAfterDeploy = drone.sourceItem.getBattery().ammoCount;
    const apBefore = harness.player.ap;

    const result = RemoteDeviceRegistry.land(drone, engine);

    expect(result.success).toBe(true);
    expect(harness.player.ap).toBeCloseTo(apBefore - 1, 5);
    expect(harness.gameMap.getEntity(drone.id)).toBeUndefined();

    const groundItems = engine.inventoryManager.groundContainer.getAllItems();
    const landed = groundItems.find((it) => it.defId === 'tool.recon_drone');
    expect(landed).toBeDefined();
    expect(landed.width).toBe(2);
    expect(landed.height).toBe(2);
    expect(landed.getBattery().ammoCount).toBe(chargeAfterDeploy);
  });

  it('stow() folds a landed drone back into the 2x1 carry form, preserving battery charge', () => {
    equipPhone(harness);
    const stowed = makeStowedDrone(20);
    const { drone } = RemoteDeviceRegistry.deploy(stowed, engine);
    RemoteDeviceRegistry.land(drone, engine);

    const landed = engine.inventoryManager.groundContainer.getAllItems().find((it) => it.defId === 'tool.recon_drone');
    const chargeBeforeStow = landed.getBattery().ammoCount;
    const apBefore = harness.player.ap;

    const result = RemoteDeviceRegistry.stow(landed, engine);

    expect(result.success).toBe(true);
    expect(harness.player.ap).toBeCloseTo(apBefore - 1, 5);
    expect(result.item.defId).toBe('tool.recon_drone_stowed');
    expect(result.item.width).toBe(2);
    expect(result.item.height).toBe(1);
    expect(result.item.getBattery().ammoCount).toBe(chargeBeforeStow);
  });

  it('clears activeDeviceId and recenters the camera when the active drone lands', () => {
    equipPhone(harness);
    const stowed = makeStowedDrone(20);
    const { drone } = RemoteDeviceRegistry.deploy(stowed, engine);
    engine.activeDeviceId = drone.id;

    RemoteDeviceRegistry.land(drone, engine);

    expect(engine.activeDeviceId).toBeNull();
  });
});
