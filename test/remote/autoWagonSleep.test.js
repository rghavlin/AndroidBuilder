// Autonomous wagons while the player sleeps.
//
// The world doesn't stop for a nap — SleepContext runs SimulationManager.runTurn
// once per sleep-hour, and turrets and drones already tick through it. Wagons
// keep their errands for the same reason.
//
// What is different is that sleep has NO playback phase: SleepContext never
// calls TurnManager.processQueue, and Entity.endTurn() (which would otherwise
// resync render coords to the logical tile) doesn't run either. So the wagon
// phase must skip its render-coordinate rewind while sleeping, or a wagon that
// travelled overnight would be drawn at the tile it left and stay there.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { SimulationManager } from '../../client/src/game/managers/SimulationManager.js';
import * as AutoWagonOrders from '../../client/src/game/remote/AutoWagonOrders.js';
import { getRcVehicle } from '../../client/src/game/remote/RcVehicle.js';
import engine from '../../client/src/game/GameEngine.js';

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

describe('autonomous wagons during sleep', () => {
  let harness;
  let wagon;

  const sleepAnHour = () => SimulationManager.runTurn(harness.gameMap, {
    player: harness.player, isSleeping: true, turn: harness.turn
  });

  beforeEach(() => {
    harness = new GameHarness({ seed: 9, width: 40, height: 20, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
    engine.dragging = null;
    engine.riding = null;
    engine.autoWagonOrders = new Map();
    engine.activeDeviceId = null;

    wagon = makeAutoWagon();
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 10, harness.gameMap);
    engine.autoWagonOrders.set(wagon.instanceId, {
      x: 30, y: 10, failedTurns: 0, lastBlockReason: null
    });
  });

  it('keeps travelling, an hour at a time', () => {
    sleepAnHour();
    expect(getRcVehicle(engine, wagon.instanceId).x).toBe(10);

    sleepAnHour();
    expect(getRcVehicle(engine, wagon.instanceId).x).toBe(15);
  });

  it('leaves render coords AT the destination — nothing will ever animate them', () => {
    sleepAnHour();

    const entity = harness.gameMap.getEntity(wagon.instanceId);
    expect(entity).toBeDefined();
    // No rewind: with no playback and no Entity.endTurn() during sleep, a
    // rewound render coordinate would be a permanent visual desync.
    expect(entity.renderX).toBe(10);
    expect(entity.renderY).toBe(10);
    expect(entity.logicalX).toBe(10);
  });

  it('queues nothing for playback, since sleep never plays a queue back', () => {
    const actions = sleepAnHour();
    expect(actions.filter(a => a.type === 'WAGON_MOVE')).toHaveLength(0);
  });

  it('arrives and clears its order overnight', () => {
    for (let hour = 0; hour < 8; hour++) sleepAnHour();

    expect(getRcVehicle(engine, wagon.instanceId)).toMatchObject({ x: 30, y: 10 });
    expect(AutoWagonOrders.getOrder(engine, wagon.instanceId)).toBeNull();
  });

  it('still queues a WAGON_MOVE when awake — the rewind is sleep-only', () => {
    const actions = SimulationManager.runTurn(harness.gameMap, {
      player: harness.player, isSleeping: false, turn: harness.turn
    });

    const moves = actions.filter(a => a.type === 'WAGON_MOVE');
    expect(moves).toHaveLength(1);
    expect(moves[0].data.path.length).toBe(6); // start tile + 5 steps

    const entity = harness.gameMap.getEntity(wagon.instanceId);
    // Rewound to the start so the tween has somewhere to travel from, while the
    // logical position is already the destination.
    expect(entity.renderX).toBe(5);
    expect(entity.logicalX).toBe(10);
  });
});
