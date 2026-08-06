import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import * as RemoteDeviceRegistry from '../../client/src/game/remote/RemoteDeviceRegistry.js';
import * as RcVehicle from '../../client/src/game/remote/RcVehicle.js';
import engine from '../../client/src/game/GameEngine.js';

/** A toy wagon with one powered motor pair and a receiver fitted. */
function makeRcWagon({ charge = 42, receiver = 'tool.rc_receiver' } = {}) {
  const wagon = new Item(createItemFromDef('vehicle.toy_wagon'));
  wagon.attachments = {};
  wagon.attachments.motor = new Item(createItemFromDef('electric_motor'));
  const battery = new Item(createItemFromDef('tool.large_battery'));
  battery.ammoCount = charge;
  wagon.attachments.battery = battery;
  if (receiver) wagon.attachments.rc_receiver = new Item(createItemFromDef(receiver));
  return wagon;
}

describe('Serialization / RC wagon round trip', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 4, width: 30, height: 30, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
  });

  it('preserves the receiver and exact battery charge for an on-map wagon', async () => {
    const wagon = makeRcWagon({ charge: 42 });
    engine.inventoryManager.dropItemAtLocation(wagon, 8, 8, harness.gameMap);

    const restoredMap = await GameMap.fromJSON(harness.gameMap.toJSON());
    const restored = restoredMap.getItemsOnTile(8, 8).find(e => e.instanceId === wagon.instanceId);

    expect(restored).toBeDefined();
    expect(RcVehicle.hasReceiver(restored)).toBe(true);

    // Coerced back to an Item, the motor math must be unchanged.
    const asItem = Item.fromJSON(restored);
    expect(asItem.getAttachment('rc_receiver').defId).toBe('tool.rc_receiver');
    expect(asItem.getMotorizedBonus()).toBe(1);
    expect(asItem.attachments.battery.ammoCount).toBe(42);
  });

  it('keeps the wagon on the phone\'s device list after a reload', async () => {
    const wagon = makeRcWagon();
    engine.inventoryManager.dropItemAtLocation(wagon, 8, 8, harness.gameMap);

    const restoredMap = await GameMap.fromJSON(harness.gameMap.toJSON());
    engine.sync({
      gameMap: restoredMap,
      interactionState: { activeDeviceId: wagon.instanceId, isPlayerTurn: true }
    });

    expect(engine.activeDeviceId).toBe(wagon.instanceId);
    const devices = RemoteDeviceRegistry.listControllables(engine);
    expect(devices.map(d => d.kind)).toContain('rc-vehicle');
    expect(RcVehicle.getActiveRcVehicle(engine)?.source).toBe('map');
  });

  it('restores the link to a wagon sitting in the ground container', async () => {
    // The container is the wagon's other home; a key that resolves to neither
    // home has to fall back to the player, or control points at nothing.
    const p = harness.player;
    const wagon = makeRcWagon();
    engine.inventoryManager.dropItemAtLocation(wagon, Math.round(p.x), Math.round(p.y), harness.gameMap);
    const carried = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.instanceId === wagon.instanceId);
    expect(carried).toBeDefined();

    const restoredMap = await GameMap.fromJSON(harness.gameMap.toJSON());
    // Self-proving: the map genuinely has no entity under this key, so only the
    // ground-container branch of the restore guard can accept it.
    expect(restoredMap.getEntity(carried.instanceId)).toBeFalsy();

    engine.sync({
      gameMap: restoredMap,
      interactionState: { activeDeviceId: carried.instanceId, isPlayerTurn: true }
    });

    expect(engine.activeDeviceId).toBe(carried.instanceId);
  });

  it('falls back to null when the saved device key resolves to neither home', async () => {
    const restoredMap = await GameMap.fromJSON(harness.gameMap.toJSON());
    engine.sync({
      gameMap: restoredMap,
      interactionState: { activeDeviceId: 'wagon-that-no-longer-exists', isPlayerTurn: true }
    });
    expect(engine.activeDeviceId).toBeNull();
  });

  it('migrates a wagon saved before the receiver slot existed', () => {
    // attachmentSlots is written into the item JSON, so an old save carries the
    // pre-feature 2-slot array. The Item constructor's unconditional def
    // override is what lets an existing wagon accept a receiver at all.
    const legacy = makeRcWagon({ receiver: false }).toJSON();
    legacy.attachmentSlots = [
      { id: 'motor', name: 'Electric Motor', allowedItems: ['electric_motor'] },
      { id: 'battery', name: 'Power Cell', allowedItems: ['tool.large_battery'] }
    ];

    const migrated = Item.fromJSON(legacy);

    expect(migrated.attachmentSlots.map(s => s.id)).toContain('rc_receiver');
    expect(migrated.attachItem('rc_receiver', new Item(createItemFromDef('tool.rc_receiver')))).toBeTruthy();
    expect(RcVehicle.hasReceiver(migrated)).toBe(true);
    // The motor it was already carrying is untouched by the migration.
    expect(migrated.getMotorizedBonus()).toBe(1);
  });

  it('migrates a legacy wagon far enough to accept an autonomous controller', () => {
    // The def override rewrites allowedItems too, not just the slot list — a
    // migrated wagon that gained the slot but kept the old single-entry
    // allow-list would reject the controller silently (attachItem returns null).
    const legacy = makeRcWagon({ receiver: false }).toJSON();
    legacy.attachmentSlots = [
      { id: 'motor', name: 'Electric Motor', allowedItems: ['electric_motor'] },
      { id: 'battery', name: 'Power Cell', allowedItems: ['tool.large_battery'] },
      { id: 'rc_receiver', name: 'RC Receiver', allowedItems: ['tool.rc_receiver'] }
    ];

    const migrated = Item.fromJSON(legacy);

    const controller = new Item(createItemFromDef('tool.autonomous_controller'));
    expect(migrated.attachItem('rc_receiver', controller)).toBeTruthy();
    expect(RcVehicle.hasReceiver(migrated)).toBe(true);
    expect(RcVehicle.hasAutonomy(migrated)).toBe(true);
  });
});

describe('Serialization / autonomous wagon round trip', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 4, width: 30, height: 30, terrain: 'grass' }).bootstrap();
    const p = harness.player;
    engine.inventoryManager.syncWithMap(p.x, p.y, p.x, p.y, harness.gameMap);
  });

  it('preserves autonomy for an on-map wagon', async () => {
    const wagon = makeRcWagon({ charge: 42, receiver: 'tool.autonomous_controller' });
    engine.inventoryManager.dropItemAtLocation(wagon, 8, 8, harness.gameMap);

    const restoredMap = await GameMap.fromJSON(harness.gameMap.toJSON());
    const restored = restoredMap.getItemsOnTile(8, 8).find(e => e.instanceId === wagon.instanceId);

    expect(restored).toBeDefined();
    // Both predicates: the controller has to keep passing the broad
    // "is this drivable" gate as well as the narrow autonomy one.
    expect(RcVehicle.hasReceiver(restored)).toBe(true);
    expect(RcVehicle.hasAutonomy(restored)).toBe(true);

    const asItem = Item.fromJSON(restored);
    expect(asItem.getAttachment('rc_receiver').defId).toBe('tool.autonomous_controller');
    expect(asItem.getMotorizedBonus()).toBe(1);
    expect(asItem.attachments.battery.ammoCount).toBe(42);
  });

  it('preserves autonomy for a wagon in the ground container', () => {
    const p = harness.player;
    const wagon = makeRcWagon({ receiver: 'tool.autonomous_controller' });
    engine.inventoryManager.dropItemAtLocation(wagon, Math.round(p.x), Math.round(p.y), harness.gameMap);

    const inContainer = engine.inventoryManager.groundContainer.getAllItems()
      .find(it => it.instanceId === wagon.instanceId);
    const revived = Item.fromJSON(JSON.parse(JSON.stringify(inContainer.toJSON())));

    expect(RcVehicle.hasReceiver(revived)).toBe(true);
    expect(RcVehicle.hasAutonomy(revived)).toBe(true);
  });

  it('keeps an autonomous wagon on the phone\'s device list after a reload', async () => {
    const wagon = makeRcWagon({ receiver: 'tool.autonomous_controller' });
    engine.inventoryManager.dropItemAtLocation(wagon, 8, 8, harness.gameMap);

    const restoredMap = await GameMap.fromJSON(harness.gameMap.toJSON());
    engine.sync({ gameMap: restoredMap, interactionState: { isPlayerTurn: true } });

    const devices = RemoteDeviceRegistry.listControllables(engine);
    expect(devices.some(d => d.key === wagon.instanceId)).toBe(true);
  });
});
