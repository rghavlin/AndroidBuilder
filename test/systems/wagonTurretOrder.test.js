// Turn order: player -> wagons -> turrets -> everybody else.
//
// The guarantee under test is that an autonomous wagon's move is COMMITTED —
// not merely queued for playback — by the time TurretSystem runs, so a turret
// riding in the wagon would fire from the tile the wagon reached this turn.
// That is the whole reason WagonSystem.process sits where it does in
// SimulationManager.runTurn, and the reason the move is simulation-first
// (see remote/RcVehiclePlacement.js).
//
// Proved twice over: directly at the phase boundary (where the wagon is when
// TurretSystem is called), and through a riding turret's muzzle. The second only
// became possible once nested turrets fired at all — see
// test/systems/nestedTurretFiring.test.js.

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { FactionRegistry } from '../../client/src/game/ai/FactionRegistry.js';
import { TURRET_DEF_ID } from '../../client/src/game/ai/TurretCombat.js';
import { TurretSystem } from '../../client/src/game/systems/TurretSystem.js';
import * as AutoWagonOrders from '../../client/src/game/remote/AutoWagonOrders.js';
import { getRcVehicle } from '../../client/src/game/remote/RcVehicle.js';
import engine from '../../client/src/game/GameEngine.js';

function makeTurret(instanceId) {
  const battery = new Item(createItemFromDef('tool.large_battery'));
  battery.ammoCount = 500;
  const magazine = new Item(createItemFromDef('attachment.556_magazine'));
  magazine.ammoCount = 20;

  const turret = new Item(createItemFromDef(TURRET_DEF_ID, {
    instanceId, factionId: 'player', isOn: true
  }));
  turret.attachments = { battery, ammo: magazine };
  return turret;
}

/** A fully motorized autonomous toy wagon, optionally carrying a turret. */
function makeWagon({ withTurret = false } = {}) {
  const wagon = new Item(createItemFromDef('vehicle.toy_wagon'));
  const battery = new Item(createItemFromDef('tool.large_battery'));
  battery.ammoCount = 500;
  wagon.attachments = {
    motor: new Item(createItemFromDef('electric_motor')),
    battery,
    rc_receiver: new Item(createItemFromDef('tool.autonomous_controller'))
  };
  if (withTurret) wagon.getContainerGrid().addItem(makeTurret('turret-aboard'), 0, 0);
  return wagon;
}

function equipChargedPhone() {
  const phone = new Item(createItemFromDef('tool.smartphone'));
  const battery = new Item(createItemFromDef('tool.battery'));
  battery.ammoCount = 999;
  phone.attachments = { battery };
  engine.inventoryManager.equipment.phone = phone;
  engine._phoneChargeTurn = null;
  engine.isPhoneOn = true;
}

describe('wagon turn order vs turrets', () => {
  let harness;

  beforeEach(() => {
    FactionRegistry.reset();
    harness = new GameHarness({ seed: 11, width: 60, height: 20, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    engine.dragging = null;
    engine.riding = null;
    engine.autoWagonOrders = new Map();
    engine.activeDeviceId = null;
    engine.deviceControlMode = 'remote';
    equipChargedPhone();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Drop a wagon at (x, y) and order it somewhere far to the east. */
  function deploy(wagon, x, y, destX) {
    engine.inventoryManager.dropItemAtLocation(wagon, x, y, harness.gameMap);
    engine.activeDeviceId = wagon.instanceId;
    const result = AutoWagonOrders.setDestination(destX, y, engine);
    if (!result.success) throw new Error(`setDestination refused: ${result.message}`);
  }

  it('the wagon has already moved when the turret phase begins', () => {
    const wagon = makeWagon();
    deploy(wagon, 5, 10, 40);

    // Stand in for the turret phase and record where the wagon is at that exact
    // moment. Firing itself is TurretSystem's business; the ordering guarantee
    // is the wagon's position when it gets asked.
    let xAtTurretPhase = null;
    vi.spyOn(TurretSystem, 'process').mockImplementation(() => {
      xAtTurretPhase = getRcVehicle(engine, wagon.instanceId)?.x ?? null;
    });

    harness.endTurn();

    // The toy wagon covers 5 tiles a turn. Turrets see 10, not 5 — the move is
    // committed during simulation, not deferred to playback.
    expect(xAtTurretPhase).toBe(10);
    expect(getRcVehicle(engine, wagon.instanceId).x).toBe(10);
  });

  it('a wagon that could not move is still at its old tile for the turrets', () => {
    // The negative control: same phase boundary, no movement, so the position
    // the turret phase observes is genuinely tracking the wagon rather than
    // just happening to read the destination.
    const wagon = makeWagon();
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 10, harness.gameMap);

    let xAtTurretPhase = null;
    vi.spyOn(TurretSystem, 'process').mockImplementation(() => {
      xAtTurretPhase = getRcVehicle(engine, wagon.instanceId)?.x ?? null;
    });

    harness.endTurn();

    expect(xAtTurretPhase).toBe(5);
  });

  it('runs the wagon phase before the turret phase, every turn', () => {
    const wagon = makeWagon();
    deploy(wagon, 5, 10, 40);

    const order = [];
    vi.spyOn(TurretSystem, 'process').mockImplementation(() => { order.push('turrets'); });
    // The wagon phase announces itself by the side effect only it produces.
    const positions = [];

    harness.endTurn();
    positions.push(getRcVehicle(engine, wagon.instanceId).x);
    harness.endTurn();
    positions.push(getRcVehicle(engine, wagon.instanceId).x);

    expect(order).toEqual(['turrets', 'turrets']);
    expect(positions).toEqual([10, 15]);
  });

  it('a riding turret fires on a zombie only reachable from the POST-move tile', () => {
    // The payoff test, and the reason for the whole phase ordering: the turret's
    // maxRange is 15. The zombie sits 20 tiles east of the wagon's start, so it
    // is out of reach at x=5 and exactly in reach at x=10 — where the wagon ends
    // this turn. A shot lands only if the move was committed before turrets ran.
    const wagon = makeWagon({ withTurret: true });
    deploy(wagon, 5, 10, 40);

    const zombie = harness.spawnZombie(25, 10, 'standard', 'z-muzzle');
    const hpBefore = zombie.hp;

    const actionQueue = harness.endTurn();

    expect(getRcVehicle(engine, wagon.instanceId).x).toBe(10);
    expect(actionQueue.filter(a => a.type === 'TURRET_SHOT').length).toBeGreaterThan(0);
    expect(zombie.hp).toBeLessThan(hpBefore);
  });

  it('the same turret cannot reach that zombie while the wagon stays put', () => {
    // Negative control for the test above: identical geometry, no order, so the
    // wagon never leaves x=5 and the zombie stays out of range.
    const wagon = makeWagon({ withTurret: true });
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 10, harness.gameMap);

    const zombie = harness.spawnZombie(25, 10, 'standard', 'z-muzzle-control');
    const hpBefore = zombie.hp;

    const actionQueue = harness.endTurn();

    expect(getRcVehicle(engine, wagon.instanceId).x).toBe(5);
    expect(actionQueue.filter(a => a.type === 'TURRET_SHOT').length).toBe(0);
    expect(zombie.hp).toBe(hpBefore);
  });

  it('carries its cargo along — the wagon still holds the turret after moving', () => {
    const wagon = makeWagon({ withTurret: true });
    deploy(wagon, 5, 10, 30);

    harness.endTurn();
    harness.endTurn();

    const device = getRcVehicle(engine, wagon.instanceId);
    expect(device.x).toBeGreaterThan(5);
    // Exactly one turret survives the two relocations: the wagon's contents are
    // moved with it, not duplicated by the ghost/copy that a playback-first
    // design would have left behind.
    const turrets = device.item.getContainerGrid().getAllItems()
      .filter(it => it.defId === TURRET_DEF_ID);
    expect(turrets).toHaveLength(1);
  });
});
