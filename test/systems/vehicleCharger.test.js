// The vehicle charger is the one charger that doesn't hold its own batteries:
// it rides loose in a vehicle's cargo grid and tops up whatever is stowed
// beside it. That makes it unlike the wired/solar chargers, whose rule can be
// evaluated from the charger item alone — this one has to be evaluated on the
// host vehicle, in both turn engines (GameMap over on-map POJOs, and
// itemTurnProcessor over the Items on the player's own tile).

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { gridItems } from '../../client/src/game/inventory/gridUtils.js';
import engine from '../../client/src/game/GameEngine.js';

const CHARGER = 'tool.vehicle_charger';

function makeBattery(instanceId, ammoCount = 0) {
  const battery = new Item(createItemFromDef('tool.battery', { instanceId }));
  battery.ammoCount = ammoCount;
  return battery;
}

/** A wagon holding the given cargo, laid out so the 3x3 charger fits. */
function makeWagon({ withCharger = true, batteryCharge = 0 } = {}) {
  const wagon = new Item(createItemFromDef('vehicle.toy_wagon'));
  const grid = wagon.getContainerGrid();
  if (withCharger) {
    grid.addItem(new Item(createItemFromDef(CHARGER, { instanceId: 'vc-1' })), 0, 0);
  }
  grid.addItem(makeBattery('bat-1', batteryCharge), 3, 0);
  return wagon;
}

/** The stowed battery's charge, read from the authoritative on-map store. */
function stowedCharge(gameMap, wagonId) {
  const entity = gameMap.getEntity(wagonId);
  const battery = gridItems(entity?.containerGrid).find(it => it?.defId === 'tool.battery');
  return battery?.ammoCount ?? null;
}

/** A power cell's charge in one of the vehicle's attachment slots, read on-map. */
function powerCellCharge(gameMap, wagonId, slotId) {
  return gameMap.getEntity(wagonId)?.attachments?.[slotId]?.ammoCount ?? null;
}

/** A big wagon with a vehicle charger in the cargo grid and two Power Cells bolted in. */
function makeWagonWithPowerCells(charge = 100) {
  const wagon = new Item(createItemFromDef('vehicle.wagon'));
  wagon.getContainerGrid().addItem(new Item(createItemFromDef(CHARGER, { instanceId: 'vc-pc' })), 0, 0);
  for (const slotId of ['battery_front', 'battery_rear']) {
    const cell = new Item(createItemFromDef('tool.large_battery', { instanceId: `cell-${slotId}` }));
    cell.ammoCount = charge;
    wagon.attachItem(slotId, cell);
  }
  return wagon;
}

describe('vehicle charger', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 11, width: 30, height: 30, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
  });

  it('is a craft-only, ground-or-vehicle item that never drops as loot', async () => {
    const { ItemDefs } = await import('../../client/src/game/inventory/ItemDefs.js');
    const { CraftingRecipes } = await import('../../client/src/game/inventory/CraftingRecipes.js');
    const { ItemTrait } = await import('../../client/src/game/inventory/traits.js');

    const def = ItemDefs[CHARGER];
    expect(def).toBeDefined();
    expect(def.width).toBe(3);
    expect(def.height).toBe(3);
    expect(def.noLoot).toBe(true);
    expect(def.traits).toContain(ItemTrait.GROUND_ONLY);

    const recipe = CraftingRecipes.find(r => r.resultItem === CHARGER);
    expect(recipe).toBeDefined();
    expect(recipe.apCost).toBe(20);
    expect(recipe.tools.map(t => t.id)).toContain('tool.pliers');
    expect(recipe.ingredients).toEqual([
      { id: 'crafting.solar_panel', count: 1 },
      { id: 'tool.battery_charger', count: 1 },
      { id: 'crafting.electronic_parts', count: 1 },
      { id: 'crafting.wire', count: 2 }
    ]);
  });

  it('charges a battery stowed in the same parked wagon, 1 per turn', () => {
    const wagon = makeWagon();
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);

    expect(stowedCharge(harness.gameMap, wagon.instanceId)).toBe(0);

    harness.endTurn();
    expect(stowedCharge(harness.gameMap, wagon.instanceId)).toBe(1);

    harness.endTurn();
    expect(stowedCharge(harness.gameMap, wagon.instanceId)).toBe(2);
  });

  // The reported bug: the batteries a player actually watches on a wagon are the
  // Power Cells in its attachment slots (the % chips in the container overlay
  // come from Item.getBatteryStatuses, which reads `attachments`). A rule that
  // only walked the cargo grid left those pinned at 96% forever.
  it('charges the Power Cells bolted into the wagon, not just loose cargo', () => {
    const wagon = makeWagonWithPowerCells(100);
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);

    harness.endTurn();
    expect(powerCellCharge(harness.gameMap, wagon.instanceId, 'battery_front')).toBe(101);
    expect(powerCellCharge(harness.gameMap, wagon.instanceId, 'battery_rear')).toBe(101);

    harness.endTurn();
    expect(powerCellCharge(harness.gameMap, wagon.instanceId, 'battery_front')).toBe(102);
    expect(powerCellCharge(harness.gameMap, wagon.instanceId, 'battery_rear')).toBe(102);
  });

  it('leaves the Power Cells alone when the wagon has no charger', () => {
    const wagon = new Item(createItemFromDef('vehicle.wagon'));
    const cell = new Item(createItemFromDef('tool.large_battery', { instanceId: 'lonely-cell' }));
    cell.ammoCount = 100;
    wagon.attachItem('battery_front', cell);
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);

    harness.endTurn();
    harness.endTurn();

    expect(powerCellCharge(harness.gameMap, wagon.instanceId, 'battery_front')).toBe(100);
  });

  it('reaches a battery attached to an item stowed in the wagon', () => {
    const wagon = new Item(createItemFromDef('vehicle.wagon'));
    wagon.getContainerGrid().addItem(new Item(createItemFromDef(CHARGER, { instanceId: 'vc-nested' })), 0, 0);

    const hotplate = new Item(createItemFromDef('tool.battery_powered_hotplate', { instanceId: 'hp-1' }));
    const cell = new Item(createItemFromDef('tool.large_battery', { instanceId: 'hp-cell' }));
    cell.ammoCount = 50;
    hotplate.attachItem('battery', cell);
    wagon.getContainerGrid().addItem(hotplate, 3, 0);

    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);

    harness.endTurn();

    const entity = harness.gameMap.getEntity(wagon.instanceId);
    const stowedHotplate = gridItems(entity?.containerGrid).find(it => it?.defId === 'tool.battery_powered_hotplate');
    // The hotplate is off, so nothing drains it — the +1 is the vehicle charger.
    expect(stowedHotplate?.attachments?.battery?.ammoCount).toBe(51);
  });

  it('leaves the battery flat when the wagon has no charger', () => {
    const wagon = makeWagon({ withCharger: false });
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);

    harness.endTurn();
    harness.endTurn();

    expect(stowedCharge(harness.gameMap, wagon.instanceId)).toBe(0);
  });

  it('never charges past the battery capacity', () => {
    const wagon = makeWagon({ batteryCharge: 19 }); // tool.battery capacity is 20
    engine.inventoryManager.dropItemAtLocation(wagon, 5, 5, harness.gameMap);

    harness.endTurn();
    expect(stowedCharge(harness.gameMap, wagon.instanceId)).toBe(20);

    harness.endTurn();
    expect(stowedCharge(harness.gameMap, wagon.instanceId)).toBe(20);
  });

  it('does nothing in a container that is not a vehicle', () => {
    // Same cargo, but a backpack — the charger only works on a vehicle grid.
    const pack = new Item(createItemFromDef('backpack.hiking'));
    const grid = pack.getContainerGrid();
    grid.addItem(new Item(createItemFromDef(CHARGER, { instanceId: 'vc-pack' })), 0, 0);
    const battery = makeBattery('bat-pack');
    grid.addItem(battery, 0, 3);
    engine.inventoryManager.dropItemAtLocation(pack, 5, 5, harness.gameMap);

    harness.endTurn();

    const entity = harness.gameMap.getEntity(pack.instanceId);
    const stowed = gridItems(entity?.containerGrid).find(it => it?.defId === 'tool.battery');
    expect(stowed?.ammoCount).toBe(0);
  });

  it('also charges through the player-tile engine, over real Items', () => {
    // A wagon on the player's own tile is owned by the ground container and is
    // walked by itemTurnProcessor instead of GameMap — the second call site.
    const wagon = makeWagon();
    engine.inventoryManager.groundContainer.addItem(wagon, 0, 0, false);

    const battery = gridItems(wagon.getContainerGrid()).find(it => it.defId === 'tool.battery');
    expect(battery.ammoCount).toBe(0);

    engine.inventoryManager.processTurn(1, true);
    expect(battery.ammoCount).toBe(1);

    engine.inventoryManager.processTurn(2, true);
    expect(battery.ammoCount).toBe(2);
  });
});
