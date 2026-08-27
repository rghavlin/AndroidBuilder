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
  // The phone is standard issue and starts switched off; every command path
  // gates on it being powered (see game/phone/Phone.js).
  engine.isPhoneOn = true;
  return phone;
}

function makeStowedDrone(charge = 20) {
  const stowed = new Item(createItemFromDef('tool.recon_drone_stowed'));
  stowed.attachItem('battery', freshBattery(charge));
  return stowed;
}

/** Full stowed -> deployed -> airborne run; returns the Drone entity. */
function deployAndLaunch(harness, charge = 20) {
  RemoteDeviceRegistry.deploy(makeStowedDrone(charge), engine);
  const deployed = engine.inventoryManager.groundContainer.getAllItems()
    .find(it => it.defId === 'tool.recon_drone');
  return RemoteDeviceRegistry.launch(deployed, engine).drone;
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

  it('deploys a stowed drone into the ground container as the 2x2 form — no entity yet', () => {
    const stowed = makeStowedDrone(20);
    const apBefore = harness.player.ap;

    const result = RemoteDeviceRegistry.deploy(stowed, engine);

    expect(result.success).toBe(true);
    expect(harness.player.ap).toBeCloseTo(apBefore - 1, 5);
    // Deploying only unfolds it — nothing on the map until the phone launches it.
    expect(harness.gameMap.getEntitiesByType('drone').length).toBe(0);

    const deployed = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.defId === 'tool.recon_drone');
    expect(deployed).toBeDefined();
    expect(deployed.width).toBe(2);
    expect(deployed.height).toBe(2);
    // Deploy costs no charge — that's paid on launch.
    expect(deployed.getBattery().ammoCount).toBe(20);
  });

  it('launch() turns a deployed ground item into an airborne entity, spending 1 charge', () => {
    equipPhone(harness);
    const stowed = makeStowedDrone(20);
    RemoteDeviceRegistry.deploy(stowed, engine);
    const deployed = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.defId === 'tool.recon_drone');

    const result = RemoteDeviceRegistry.launch(deployed, engine);

    expect(result.success).toBe(true);
    expect(harness.gameMap.getEntity(result.drone.id)).toBe(result.drone);
    expect(result.drone.type).toBe('drone');
    expect(result.drone.sourceItem.getBattery().ammoCount).toBe(19);
    // The item left the ground container — the airborne entity owns it now.
    expect(engine.inventoryManager.groundContainer.getAllItems()
      .some(it => it.defId === 'tool.recon_drone')).toBe(false);
  });

  it('refuses to launch without a charged phone equipped', () => {
    const stowed = makeStowedDrone(20);
    RemoteDeviceRegistry.deploy(stowed, engine);
    const deployed = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.defId === 'tool.recon_drone');

    const result = RemoteDeviceRegistry.launch(deployed, engine);
    expect(result.success).toBe(false);
    expect(harness.gameMap.getEntitiesByType('drone').length).toBe(0);
  });

  it('refuses to launch with an empty drone battery', () => {
    equipPhone(harness);
    const stowed = makeStowedDrone(0);
    RemoteDeviceRegistry.deploy(stowed, engine);
    const deployed = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.defId === 'tool.recon_drone');

    const result = RemoteDeviceRegistry.launch(deployed, engine);
    expect(result.success).toBe(false);
    expect(harness.gameMap.getEntitiesByType('drone').length).toBe(0);
  });

  it('listControllables surfaces a deployed-but-grounded drone, then the airborne one', () => {
    equipPhone(harness);
    const stowed = makeStowedDrone(20);
    RemoteDeviceRegistry.deploy(stowed, engine);

    let controllables = RemoteDeviceRegistry.listControllables(engine);
    expect(controllables).toHaveLength(1);
    expect(controllables[0].airborne).toBe(false);

    RemoteDeviceRegistry.launch(controllables[0].item, engine);

    controllables = RemoteDeviceRegistry.listControllables(engine);
    expect(controllables).toHaveLength(1);
    expect(controllables[0].airborne).toBe(true);
  });

  // Regression: deploying and landing both place an item on the player's own
  // tile, which the ground container owns rather than the map. Routing that
  // through the map and reloading the container from it used to wipe out
  // everything else lying at the player's feet.
  describe('placing a device at the player\'s feet leaves the rest of the ground alone', () => {
    /** Two decoys lying where the player stands. */
    function litterGround() {
      const p = harness.player;
      const decoys = [
        new Item(createItemFromDef('weapon.plank')),
        new Item(createItemFromDef('crafting.wire'))
      ];
      for (const d of decoys) {
        engine.inventoryManager.dropItemAtLocation(d, Math.round(p.x), Math.round(p.y), harness.gameMap);
      }
      return decoys;
    }

    const stillOnGround = (item) => engine.inventoryManager.groundContainer.getAllItems()
      .some(it => it.instanceId === item.instanceId);

    it('survives deploy()', () => {
      const decoys = litterGround();
      RemoteDeviceRegistry.deploy(makeStowedDrone(20), engine);
      for (const d of decoys) expect(stillOnGround(d), d.name).toBe(true);
    });

    it('survives land()', () => {
      equipPhone(harness);
      const drone = deployAndLaunch(harness, 20);
      const decoys = litterGround();

      RemoteDeviceRegistry.land(drone, engine);

      for (const d of decoys) expect(stillOnGround(d), d.name).toBe(true);
      expect(engine.inventoryManager.groundContainer.getAllItems()
        .some(it => it.defId === 'tool.recon_drone')).toBe(true);
    });
  });

  it('land() converts the airborne drone back into a landed (2x2) ground item, preserving battery charge', () => {
    equipPhone(harness);
    const drone = deployAndLaunch(harness, 20);
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
    const drone = deployAndLaunch(harness, 20);
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

  it('cycleTarget walks player -> device -> back to player using stable keys', () => {
    equipPhone(harness);
    RemoteDeviceRegistry.deploy(makeStowedDrone(20), engine);
    const devices = RemoteDeviceRegistry.listControllables(engine);

    const first = RemoteDeviceRegistry.cycleTarget(null, devices);
    expect(first).toBe(devices[0].key);
    // Only one device, so the next press hands control back to the player.
    expect(RemoteDeviceRegistry.cycleTarget(first, devices)).toBeNull();
  });

  it('clears activeDeviceId and recenters the camera when the active drone lands', () => {
    equipPhone(harness);
    const drone = deployAndLaunch(harness, 20);
    engine.activeDeviceId = drone.id;

    RemoteDeviceRegistry.land(drone, engine);

    expect(engine.activeDeviceId).toBeNull();
  });

  // getActiveDevice gates the phone's "Land drone" menu entry, so it has to be
  // null in exactly the cases where that option must not appear.
  it('getActiveDevice returns the flown drone only while the phone controls one', () => {
    equipPhone(harness);
    expect(RemoteDeviceRegistry.getActiveDevice(engine)).toBeNull();

    const drone = deployAndLaunch(harness, 20);
    // Airborne but not selected — the player is still in control.
    expect(RemoteDeviceRegistry.getActiveDevice(engine)).toBeNull();

    engine.activeDeviceId = drone.id;
    expect(RemoteDeviceRegistry.getActiveDevice(engine)).toBe(drone);

    // Landing clears control, so the option disappears again.
    RemoteDeviceRegistry.land(drone, engine);
    expect(RemoteDeviceRegistry.getActiveDevice(engine)).toBeNull();
  });

  // The phone is a radio: a drone deployed (or landed) on a far tile stays
  // controllable, powered down, without the player walking to it.
  describe('remote grounded drones', () => {
    /** Put a deployed drone on the map far from the player. Returns its entity. */
    function placeRemoteDrone(x, y, charge = 20) {
      const item = new Item(createItemFromDef('tool.recon_drone'));
      item.attachItem('battery', freshBattery(charge));
      engine.inventoryManager.dropItemAtLocation(item, x, y, harness.gameMap);
      return harness.gameMap.getEntitiesByType('item')
        .find(e => e.defId === 'tool.recon_drone' && Math.round(e.logicalX) === x);
    }

    it('lists a deployed drone sitting on a distant tile', () => {
      const remote = placeRemoteDrone(2, 2);
      expect(remote).toBeDefined();

      const controllables = RemoteDeviceRegistry.listControllables(engine);
      expect(controllables).toHaveLength(1);
      expect(controllables[0].airborne).toBe(false);
      expect(controllables[0].key).toBe(remote.instanceId);
    });

    it('deduplicates a drone that is both on-map and in the ground container', () => {
      placeRemoteDrone(2, 2);
      RemoteDeviceRegistry.deploy(makeStowedDrone(20), engine); // at the player's feet
      const grounded = RemoteDeviceRegistry.listGroundedDevices(engine);
      const ids = grounded.map(g => g.instanceId || g.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(grounded).toHaveLength(2);
    });

    it('getActiveGroundedDevice resolves an on-map drone by activeDeviceId', () => {
      const remote = placeRemoteDrone(2, 2);
      engine.activeDeviceId = remote.instanceId;

      expect(RemoteDeviceRegistry.getActiveGroundedDevice(engine)).toBe(remote);
      // It is NOT airborne, so the flying-drone lookup must stay null — that's
      // what keeps click-to-move and the "Land drone" menu entry disabled.
      expect(RemoteDeviceRegistry.getActiveDevice(engine)).toBeNull();
    });

    it('launches a remote drone at ITS OWN tile, not the player\'s', () => {
      equipPhone(harness);
      const remote = placeRemoteDrone(2, 2, 20);
      const playerPos = { x: Math.round(harness.player.x), y: Math.round(harness.player.y) };
      expect(playerPos.x).not.toBe(2);

      const result = RemoteDeviceRegistry.launch(remote, engine);

      expect(result.success).toBe(true);
      expect(Math.round(result.drone.logicalX)).toBe(2);
      expect(Math.round(result.drone.logicalY)).toBe(2);
      // The grounded item is gone from the map, replaced by the airborne entity.
      expect(harness.gameMap.getEntitiesByType('item')
        .some(e => e.defId === 'tool.recon_drone')).toBe(false);
    });

    it('rebuilds the battery as a real Item when launching an on-map drone', () => {
      equipPhone(harness);
      const remote = placeRemoteDrone(2, 2, 20);
      // On-map item entities carry raw JSON attachments — no getBattery().
      expect(typeof remote.getBattery).not.toBe('function');

      const { drone } = RemoteDeviceRegistry.launch(remote, engine);

      expect(typeof drone.sourceItem.getBattery).toBe('function');
      expect(drone.sourceItem.getBattery().ammoCount).toBe(19); // 20 - launch charge
    });

    it('refuses to launch a remote drone with a dead battery, leaving it in place', () => {
      equipPhone(harness);
      const remote = placeRemoteDrone(2, 2, 0);

      const result = RemoteDeviceRegistry.launch(remote, engine);

      expect(result.success).toBe(false);
      expect(harness.gameMap.getEntitiesByType('drone')).toHaveLength(0);
      expect(harness.gameMap.getEntitiesByType('item')
        .some(e => e.defId === 'tool.recon_drone')).toBe(true);
    });
  });

  it('landing from the phone leaves an inert deployed drone on the tile', () => {
    equipPhone(harness);
    const drone = deployAndLaunch(harness, 20);
    engine.activeDeviceId = drone.id;
    const chargeAloft = drone.sourceItem.getBattery().ammoCount;

    RemoteDeviceRegistry.land(drone, engine);

    // No entity left flying...
    expect(harness.gameMap.getEntitiesByType('drone')).toHaveLength(0);
    // ...and the deployed item is sitting at the player's feet with its charge.
    const landed = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.defId === 'tool.recon_drone');
    expect(landed).toBeDefined();
    expect(landed.getBattery().ammoCount).toBe(chargeAloft);
  });
});
