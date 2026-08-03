import { Drone } from '../entities/Drone.js';
import { Item } from '../inventory/Item.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { EntityType } from '../entities/Entity.js';
import { DroneConfig } from '../config/DroneConfig.js';
import { consumeDeployCharge, droneChargesRemaining } from './DronePower.js';

/**
 * Umbrella layer for player-operated remote devices (recon drone today,
 * bombers/RC wagons later). Devices are never tracked in a separate registry
 * — listDevices derives the live list from the map each call, so there is
 * nothing to drift on save/load.
 *
 * Four item<->entity state transforms. The two item forms mirror the rabbit
 * snare's deploy/retrieve pair (contexts/InventoryContext.jsx); "airborne" is
 * a third state on top of them:
 *   stowed item (2x1)  --deploy-->  deployed item (2x2, ground container)
 *   deployed item (2x2) --launch-->  airborne Drone entity
 *   airborne Drone      --land-->   deployed item (2x2, on its tile)
 *   deployed item (2x2) --stow-->   stowed item (2x1)
 *
 * Deploying only UNFOLDS the drone at the player's feet — it stays an item in
 * the ground container, where its battery is visible and swappable. It only
 * becomes a map entity when the player takes control of it via the phone
 * (launch), which is what spends the flight charge.
 */

export const DEPLOYED_DEF_ID = 'tool.recon_drone';
export const STOWED_DEF_ID = 'tool.recon_drone_stowed';

function makeDroneId() {
  return `drone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Every airborne drone entity on the map belonging to `operatorId`. */
export function listDevices(gameMap, operatorId) {
  if (!gameMap || typeof gameMap.getEntitiesByType !== 'function') return [];
  return gameMap.getEntitiesByType(EntityType.DRONE)
    .filter(d => d && d.operatorId === operatorId)
    .sort((a, b) => (a._deployOrder ?? 0) - (b._deployOrder ?? 0));
}

/**
 * Coerce a deployed-drone candidate into a real Item. A deployed drone on a
 * far tile is an on-map ECS *entity* whose attachments are raw JSON, not Item
 * instances — so getBattery()/consumeCharge() don't exist on it. Item.fromJSON
 * accepts either shape and rebuilds the battery as a proper Item.
 */
export function asDeployedItem(candidate) {
  if (!candidate) return null;
  if (typeof candidate.getBattery === 'function') return candidate;
  return Item.fromJSON(candidate);
}

/** Where a deployed drone physically sits, on-map or at the player's feet. */
function deployedPosition(candidate, engine) {
  const x = candidate?.logicalX ?? candidate?.x;
  const y = candidate?.logicalY ?? candidate?.y;
  if (Number.isFinite(x) && Number.isFinite(y)) return { x: Math.round(x), y: Math.round(y) };
  const player = engine?.player;
  return { x: Math.round(player?.x ?? 0), y: Math.round(player?.y ?? 0) };
}

/**
 * Every deployed-but-grounded drone the phone can reach — ANYWHERE on the map,
 * powered down or not. The phone is a radio: it doesn't care where the drone
 * is, only that it exists. Scans both locations a deployed drone can live in:
 * on-map item entities, and the player's ground container (a tile's items are
 * detached from entityMap while the player stands on it — the same dual-scan
 * TurretSystem has to do).
 */
export function listGroundedDevices(engine) {
  const gameMap = engine?.gameMap;
  const found = new Map(); // instanceId -> raw candidate (dedupe across both scans)

  if (gameMap && typeof gameMap.getEntitiesByType === 'function') {
    for (const e of gameMap.getEntitiesByType('item')) {
      if (e && e.defId === DEPLOYED_DEF_ID) found.set(e.instanceId || e.id, e);
    }
  }
  for (const it of engine?.inventoryManager?.groundContainer?.getAllItems?.() || []) {
    if (it && it.defId === DEPLOYED_DEF_ID) found.set(it.instanceId || it.id, it);
  }

  // Stable order so cycling doesn't reshuffle between presses.
  return [...found.values()].sort((a, b) =>
    String(a.instanceId || a.id).localeCompare(String(b.instanceId || b.id))
  );
}

/**
 * The grounded drone the phone is currently focused on, or null. Targeted
 * lookup (not a scan) because this runs on every context-menu render: an
 * on-map deployed drone is an entity keyed by the same id as its instanceId.
 */
export function getActiveGroundedDevice(engine) {
  const key = engine?.activeDeviceId;
  if (!key) return null;

  const onMap = engine.gameMap?.getEntity?.(key);
  if (onMap) return onMap.defId === DEPLOYED_DEF_ID ? onMap : null;

  const inGround = (engine.inventoryManager?.groundContainer?.getAllItems?.() || [])
    .find(it => it && it.instanceId === key);
  return (inGround && inGround.defId === DEPLOYED_DEF_ID) ? inGround : null;
}

/**
 * The airborne drone the phone currently has control of, or null when the
 * player is in control (or the id points at nothing — e.g. it just landed).
 * Single source for "is the phone flying something right now".
 * @returns {Drone|null}
 */
export function getActiveDevice(engine) {
  if (!engine?.activeDeviceId || !engine.gameMap) return null;
  const entity = engine.gameMap.getEntity(engine.activeDeviceId);
  return (entity && entity.type === EntityType.DRONE) ? entity : null;
}

/**
 * Every device the phone can currently cycle to, airborne first then grounded.
 * Returns descriptors rather than raw objects so callers get one stable `key`
 * regardless of whether the device is an entity (id) or an item (instanceId).
 * @returns {Array<{key: string, airborne: boolean, drone?: Drone, item?: Item}>}
 */
export function listControllables(engine) {
  const gameMap = engine?.gameMap;
  const player = engine?.player;
  if (!gameMap || !player) return [];
  return [
    ...listDevices(gameMap, player.id).map(d => ({ key: d.id, airborne: true, drone: d })),
    ...listGroundedDevices(engine).map(it => ({ key: it.instanceId, airborne: false, item: it }))
  ];
}

let deployCounter = 0;

/**
 * Unfold a stowed drone at the player's feet: the 2x1 carry item becomes the
 * 2x2 deployed item on the player's tile, which loads straight into the ground
 * container. No entity and no charge yet — that's launch().
 * @param {Item} stowedItem - a tool.recon_drone_stowed instance
 * @param {GameEngine} engine
 * @returns {{success: boolean, reason?: string, item?: Item}}
 */
export function deploy(stowedItem, engine) {
  const player = engine?.player;
  const inv = engine?.inventoryManager;
  const gameMap = engine?.gameMap;
  if (!player || !inv || !gameMap || !stowedItem) {
    return { success: false, reason: 'Engine not ready' };
  }

  if (player.ap < DroneConfig.DEPLOY_AP) {
    return { success: false, reason: 'Not enough AP' };
  }

  const deployedItem = new Item(createItemFromDef(DEPLOYED_DEF_ID));
  const carriedBattery = stowedItem.detachItem ? stowedItem.detachItem('battery') : null;
  if (carriedBattery) deployedItem.attachItem('battery', carriedBattery);

  inv.destroyItem(stowedItem.instanceId);
  inv.dropItemAtLocation(deployedItem, Math.round(player.x), Math.round(player.y), gameMap);
  player.useAP(DroneConfig.DEPLOY_AP);

  return { success: true, item: deployedItem };
}

/**
 * Take a deployed (grounded) drone into the air as a map entity, at ITS OWN
 * tile — the phone is a radio, so this works at any range, not just underfoot.
 * This is what spends the launch charge.
 * @param {Item|Entity} candidate - a tool.recon_drone, on-map or in the ground container
 * @param {GameEngine} engine
 * @returns {{success: boolean, reason?: string, drone?: Drone}}
 */
export function launch(candidate, engine) {
  const player = engine?.player;
  const inv = engine?.inventoryManager;
  const gameMap = engine?.gameMap;
  if (!player || !inv || !gameMap || !candidate) {
    return { success: false, reason: 'Engine not ready' };
  }

  const phone = inv.equipment.phone;
  if (!phone || (phone.getCharges?.() ?? 0) <= 0) {
    return { success: false, reason: 'Equip a charged phone first' };
  }

  // Capture the tile BEFORE removing it from the map — it launches from where
  // it sits, which for a remote drone is nowhere near the player.
  const { x, y } = deployedPosition(candidate, engine);
  const deployedItem = asDeployedItem(candidate);

  const battery = deployedItem?.getBattery ? deployedItem.getBattery() : null;
  if (!battery || (battery.ammoCount || 0) < DroneConfig.DEPLOY_CHARGE) {
    return { success: false, reason: 'Drone battery is empty' };
  }

  if (!consumeDeployCharge(deployedItem)) {
    return { success: false, reason: 'Drone battery is empty' };
  }

  // Remove the grounded form from whichever of its two homes it occupies: an
  // on-map item entity, or the player's ground container.
  const key = candidate.instanceId || candidate.id;
  if (gameMap.getEntity?.(key)) {
    gameMap.removeEntity(key);
  } else {
    inv.destroyItem(key);
  }

  const drone = new Drone(makeDroneId(), x, y, 'recon');
  drone.operatorId = player.id;
  drone.sourceItem = deployedItem;
  drone._deployOrder = deployCounter++;

  gameMap.addEntity(drone, x, y);

  engine.invalidateFOV?.();
  engine.recalculateFOV?.();

  return { success: true, drone };
}

/**
 * Bring an airborne drone down at its current tile as a landed (2x2) ground
 * item. Used both for a manual "land" command and DroneSystem's auto-land
 * when the battery runs dry.
 */
export function land(drone, engine, { chargeAp = true } = {}) {
  const gameMap = engine?.gameMap;
  const inv = engine?.inventoryManager;
  if (!drone || !gameMap || !inv) return { success: false, reason: 'Engine not ready' };

  // Manual land (phone panel) costs AP like the snare's retrieve; DroneSystem's
  // automatic force-land on battery depletion runs during simulation and is
  // not a player action, so it passes chargeAp: false.
  if (chargeAp) {
    if (!engine.player || engine.player.ap < DroneConfig.LAND_AP) {
      return { success: false, reason: 'Not enough AP' };
    }
    engine.player.useAP(DroneConfig.LAND_AP);
  }

  const x = Math.round(drone.logicalX ?? drone.x);
  const y = Math.round(drone.logicalY ?? drone.y);
  const landedItem = drone.sourceItem || new Item(createItemFromDef(DEPLOYED_DEF_ID));

  gameMap.removeEntity(drone.id);
  inv.dropItemAtLocation(landedItem, x, y, gameMap);

  if (engine.activeDeviceId === drone.id) {
    engine.activeDeviceId = null;
    engine.camera?.centerOn?.(engine.player.x, engine.player.y);
  }

  engine.invalidateFOV?.();
  engine.recalculateFOV?.();

  return { success: true, x, y };
}

/**
 * Fold a landed (2x2) ground item back into the carryable (2x1) stowed form.
 * The player must be standing on the drone's tile — same constraint as
 * picking anything else off the ground.
 */
export function stow(landedItem, engine) {
  const player = engine?.player;
  const inv = engine?.inventoryManager;
  if (!player || !inv || !landedItem) return { success: false, reason: 'Engine not ready' };

  if (player.ap < DroneConfig.STOW_AP) {
    return { success: false, reason: 'Not enough AP' };
  }

  const stowedItem = new Item(createItemFromDef(STOWED_DEF_ID));
  const battery = landedItem.detachItem ? landedItem.detachItem('battery') : null;
  if (battery) stowedItem.attachItem('battery', battery);

  inv.destroyItem(landedItem.instanceId);
  const result = inv.addItem(stowedItem);
  player.useAP(DroneConfig.STOW_AP);

  return { success: true, item: stowedItem, placed: !!result?.success };
}

/** Whether `drone` currently has any charge left to fly or hover on. */
export function canOperate(drone) {
  return droneChargesRemaining(drone) > 0;
}

/**
 * Advance the control target to the next device, or back to the player once
 * the list is exhausted. `currentKey` is engine.activeDeviceId (null when the
 * player is in control); `devices` are listControllables() descriptors.
 * @returns {string|null} the newly focused device key (null = player)
 */
export function cycleTarget(currentKey, devices) {
  if (!devices.length) return null;
  if (currentKey === null) return devices[0].key;
  const idx = devices.findIndex(d => d.key === currentKey);
  if (idx === -1 || idx === devices.length - 1) return null;
  return devices[idx + 1].key;
}
