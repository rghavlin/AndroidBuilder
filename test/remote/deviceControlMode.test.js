// How each remote device is driven is the device's own setting, not a session
// flag. It used to be one global mode that snapped back to 'remote' on every
// link, every issued order and every reload, so a wagon put on autonomous
// control never stayed there — and two wagons could never be driven differently.
import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import {
  getControlMode,
  setControlMode,
  clearControlMode,
  serializeControlModes,
  restoreControlModes
} from '../../client/src/game/remote/DeviceControlMode.js';
import { linkDevice } from '../../client/src/game/remote/RemoteLink.js';
import * as AutoWagonOrders from '../../client/src/game/remote/AutoWagonOrders.js';
import { ensurePhone } from '../../client/src/game/phone/Phone.js';
import engine from '../../client/src/game/GameEngine.js';

function makeWagon(receiver = 'tool.autonomous_controller') {
  const wagon = new Item(createItemFromDef('vehicle.toy_wagon'));
  const battery = new Item(createItemFromDef('tool.large_battery'));
  battery.ammoCount = 500;
  wagon.attachments = {
    motor: new Item(createItemFromDef('electric_motor')),
    battery,
    rc_receiver: new Item(createItemFromDef(receiver))
  };
  return wagon;
}

describe('remote/DeviceControlMode', () => {
  let harness;

  function dropWagon(at, receiver) {
    const wagon = makeWagon(receiver);
    engine.inventoryManager.dropItemAtLocation(wagon, at.x, at.y, harness.gameMap);
    return wagon;
  }

  beforeEach(() => {
    harness = new GameHarness({ seed: 5, width: 40, height: 40, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    ensurePhone(engine.inventoryManager);
    engine.isPhoneOn = true;
    engine.activeDeviceId = null;
    engine.turn = 1;
    engine._phoneChargeTurn = null;
    engine.camera = { centerOn: () => {} };
  });

  it('defaults to driving it yourself', () => {
    const wagon = dropWagon({ x: 14, y: 14 });

    expect(getControlMode(engine, wagon.instanceId)).toBe('remote');
  });

  it('defaults to remote when nothing is linked', () => {
    expect(getControlMode(engine, null)).toBe('remote');
    expect(getControlMode(engine)).toBe('remote');
  });

  it('remembers each wagon separately', () => {
    const hauler = dropWagon({ x: 14, y: 14 });
    const scout = dropWagon({ x: 18, y: 18 });

    setControlMode(engine, 'auto', hauler.instanceId);

    expect(getControlMode(engine, hauler.instanceId)).toBe('auto');
    expect(getControlMode(engine, scout.instanceId)).toBe('remote');
  });

  it('applies to whichever device is linked, without being passed a key', () => {
    const hauler = dropWagon({ x: 14, y: 14 });
    const scout = dropWagon({ x: 18, y: 18 });

    linkDevice(engine, hauler.instanceId);
    setControlMode(engine, 'auto');
    expect(getControlMode(engine)).toBe('auto');

    linkDevice(engine, scout.instanceId);
    expect(getControlMode(engine)).toBe('remote');

    // ...and coming back to the hauler finds it as it was left.
    linkDevice(engine, hauler.instanceId);
    expect(getControlMode(engine)).toBe('auto');
  });

  it('switching back to remote forgets the setting rather than storing it', () => {
    const wagon = dropWagon({ x: 14, y: 14 });

    setControlMode(engine, 'auto', wagon.instanceId);
    setControlMode(engine, 'remote', wagon.instanceId);

    expect(getControlMode(engine, wagon.instanceId)).toBe('remote');
    expect(serializeControlModes(engine)).toEqual([]);
  });

  it('survives issuing a destination', () => {
    const wagon = dropWagon({ x: 14, y: 14 });
    linkDevice(engine, wagon.instanceId);
    setControlMode(engine, 'auto');

    const result = AutoWagonOrders.setDestination(20, 14, engine);

    expect(result.success).toBe(true);
    expect(getControlMode(engine)).toBe('auto');
  });

  it('is forgotten when the device is', () => {
    const wagon = dropWagon({ x: 14, y: 14 });
    setControlMode(engine, 'auto', wagon.instanceId);

    clearControlMode(engine, wagon.instanceId);

    expect(getControlMode(engine, wagon.instanceId)).toBe('remote');
  });
});

describe('remote/DeviceControlMode — across a save', () => {
  let harness;
  let wagon;

  beforeEach(() => {
    harness = new GameHarness({ seed: 5, width: 40, height: 40, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    wagon = makeWagon();
    engine.inventoryManager.dropItemAtLocation(wagon, 14, 14, harness.gameMap);
  });

  it('writes down only the wagons set to autonomous control', () => {
    const other = makeWagon();
    engine.inventoryManager.dropItemAtLocation(other, 18, 18, harness.gameMap);
    setControlMode(engine, 'auto', wagon.instanceId);

    expect(serializeControlModes(engine)).toEqual([wagon.instanceId]);
  });

  it('restores the wagon to the mode it was left in', () => {
    engine.sync({
      gameMap: harness.gameMap,
      interactionState: { deviceControlModes: [wagon.instanceId], isPlayerTurn: true }
    });

    expect(getControlMode(engine, wagon.instanceId)).toBe('auto');
  });

  it('drops a mode whose wagon no longer exists', () => {
    engine.sync({
      gameMap: harness.gameMap,
      interactionState: {
        deviceControlModes: [wagon.instanceId, 'wagon-scrapped-three-saves-ago'],
        isPlayerTurn: true
      }
    });

    expect(serializeControlModes(engine)).toEqual([wagon.instanceId]);
  });

  it('restores nothing for a save written before modes were per-device', () => {
    setControlMode(engine, 'auto', wagon.instanceId);

    engine.sync({
      gameMap: harness.gameMap,
      interactionState: { isPlayerTurn: true }
    });

    expect(getControlMode(engine, wagon.instanceId)).toBe('remote');
  });

  it('ignores junk in the saved list', () => {
    engine.sync({
      gameMap: harness.gameMap,
      interactionState: { deviceControlModes: [null, 42, '', wagon.instanceId], isPlayerTurn: true }
    });

    expect(serializeControlModes(engine)).toEqual([wagon.instanceId]);
  });
});
