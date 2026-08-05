// Display priority for remote devices. A device you can't see is a device you
// can't command, so a drone or RC wagon wins its tile against anything else on
// it — including a powered auto-turret, which normally takes icon priority.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { getDominantItemInTile } from '../../client/src/game/renderer/EntityRenderer.js';
import { isRemoteDevice, hasReceiver, getUnderfootDevice } from '../../client/src/game/remote/RemoteDeviceKinds.js';
import { TURRET_DEF_ID } from '../../client/src/game/ai/TurretCombat.js';
import engine from '../../client/src/game/GameEngine.js';

const make = (defId) => new Item(createItemFromDef(defId));

function makeRcWagon(defId = 'vehicle.toy_wagon') {
  const wagon = make(defId);
  wagon.attachments = { rc_receiver: make('tool.rc_receiver') };
  return wagon;
}

function makePoweredTurret() {
  const turret = make(TURRET_DEF_ID);
  turret.isOn = true;
  return turret;
}

describe('isRemoteDevice', () => {
  it('covers both of the drone\'s item forms and a receiver-fitted wagon', () => {
    expect(isRemoteDevice(make('tool.recon_drone'))).toBe(true);
    expect(isRemoteDevice(make('tool.recon_drone_stowed'))).toBe(true);
    expect(isRemoteDevice(makeRcWagon())).toBe(true);
    expect(isRemoteDevice(makeRcWagon('vehicle.cargo_wagon'))).toBe(true);
  });

  it('excludes a plain wagon, the loose receiver, and everything else', () => {
    expect(isRemoteDevice(make('vehicle.toy_wagon'))).toBe(false);
    expect(isRemoteDevice(make('tool.rc_receiver'))).toBe(false); // not fitted to anything
    expect(isRemoteDevice(make('tool.smartphone'))).toBe(false);
    expect(isRemoteDevice(makePoweredTurret())).toBe(false);
    expect(isRemoteDevice(null)).toBe(false);
  });

  it('reads raw JSON attachments, as an on-map item entity carries', () => {
    const asEntityData = JSON.parse(JSON.stringify(makeRcWagon().toJSON()));
    expect(hasReceiver(asEntityData)).toBe(true);
    expect(isRemoteDevice(asEntityData)).toBe(true);
  });
});

describe('Tile icon dominance', () => {
  it('shows the drone, not the powered turret, when they share a tile', () => {
    const drone = make('tool.recon_drone');
    const turret = makePoweredTurret();
    expect(getDominantItemInTile([turret, drone])).toBe(drone);
    expect(getDominantItemInTile([drone, turret])).toBe(drone);
  });

  it('shows an RC wagon over a turret, a plain wagon, and a pile of loot', () => {
    const rcWagon = makeRcWagon();
    const others = [makePoweredTurret(), make('vehicle.wagon'), make('backpack.school'), make('weapon.plank')];
    for (const other of others) {
      expect(getDominantItemInTile([other, rcWagon]), other.defId).toBe(rcWagon);
    }
  });

  it('beats a plain wagon even though the wagon is physically bigger', () => {
    // Within a tier the larger footprint wins, so this only holds because the
    // device gets a tier of its own: 2x2 drone vs 6x10 cargo wagon.
    const drone = make('tool.recon_drone');
    const cargo = make('vehicle.cargo_wagon');
    expect(cargo.width * cargo.height).toBeGreaterThan(drone.width * drone.height);
    expect(getDominantItemInTile([cargo, drone])).toBe(drone);
  });

  it('still yields to an interactive world marker, so a device can never hide a quest switch', () => {
    const marker = make('weapon.plank');
    marker.groundPriority = 1;
    expect(getDominantItemInTile([marker, makeRcWagon()])).toBe(marker);
    expect(getDominantItemInTile([marker, make('tool.recon_drone')])).toBe(marker);
  });

  it('picks the larger device when two devices share a tile', () => {
    const drone = make('tool.recon_drone');
    const wagon = makeRcWagon('vehicle.cargo_wagon');
    expect(getDominantItemInTile([drone, wagon])).toBe(wagon);
  });
});

describe('getUnderfootDevice', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 7 }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    engine.activeDeviceId = null;
  });

  const dropAtFeet = (item) => {
    const p = harness.player;
    engine.inventoryManager.dropItemAtLocation(item, Math.round(p.x), Math.round(p.y), harness.gameMap);
    return engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.instanceId === item.instanceId);
  };

  it('returns null when nothing remote is at the player\'s feet', () => {
    dropAtFeet(make('weapon.plank'));
    dropAtFeet(make('vehicle.toy_wagon')); // no receiver
    expect(getUnderfootDevice(engine)).toBeNull();
  });

  it('finds a device the map itself cannot see, because the tile was emptied', () => {
    const wagon = dropAtFeet(makeRcWagon());
    const p = harness.player;
    // The container owns it; the tile has nothing to render.
    expect(harness.gameMap.getItemsOnTile(Math.round(p.x), Math.round(p.y))).toHaveLength(0);
    expect(getUnderfootDevice(engine)?.instanceId).toBe(wagon.instanceId);
  });

  it('prefers the device the phone is linked to', () => {
    dropAtFeet(make('tool.recon_drone'));
    const wagon = dropAtFeet(makeRcWagon());

    engine.activeDeviceId = wagon.instanceId;
    expect(getUnderfootDevice(engine).instanceId).toBe(wagon.instanceId);

    const drone = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.defId === 'tool.recon_drone');
    engine.activeDeviceId = drone.instanceId;
    expect(getUnderfootDevice(engine).instanceId).toBe(drone.instanceId);
  });
});
