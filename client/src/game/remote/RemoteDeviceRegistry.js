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
 * Three item<->entity state transforms, modeled directly on the rabbit
 * snare's deploy/retrieve pair (contexts/InventoryContext.jsx):
 *   stowed item (2x1)  --deploy-->  airborne Drone entity
 *   airborne Drone      --land-->   landed item (2x2, ground)
 *   landed item (2x2)   --stow-->   stowed item (2x1)
 */

function makeDroneId() {
  return `drone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Every drone entity on the map belonging to `operatorId`, in deploy order. */
export function listDevices(gameMap, operatorId) {
  if (!gameMap || typeof gameMap.getEntitiesByType !== 'function') return [];
  return gameMap.getEntitiesByType(EntityType.DRONE)
    .filter(d => d && d.operatorId === operatorId)
    .sort((a, b) => (a._deployOrder ?? 0) - (b._deployOrder ?? 0));
}

let deployCounter = 0;

/**
 * Launch a stowed drone item from the player's current tile.
 * @param {Item} stowedItem - a tool.recon_drone_stowed instance
 * @param {GameEngine} engine
 * @returns {{success: boolean, reason?: string, drone?: Drone}}
 */
export function deploy(stowedItem, engine) {
  const player = engine?.player;
  const inv = engine?.inventoryManager;
  const gameMap = engine?.gameMap;
  if (!player || !inv || !gameMap || !stowedItem) {
    return { success: false, reason: 'Engine not ready' };
  }

  const phone = inv.equipment.phone;
  if (!phone || (phone.getCharges?.() ?? 0) <= 0) {
    return { success: false, reason: 'Equip a charged phone first' };
  }

  if (player.ap < DroneConfig.DEPLOY_AP) {
    return { success: false, reason: 'Not enough AP' };
  }

  const battery = stowedItem.getBattery ? stowedItem.getBattery() : null;
  if (!battery || (battery.ammoCount || 0) < DroneConfig.DEPLOY_CHARGE) {
    return { success: false, reason: 'Drone battery is empty' };
  }

  // Build the landed-form (2x2) item snapshot up front, carrying the battery
  // across, so land()/stow() always have a consistent shape to work from —
  // this is the entity's `sourceItem`, never itself placed in a container.
  const landedItem = new Item(createItemFromDef('tool.recon_drone'));
  const carriedBattery = stowedItem.detachItem ? stowedItem.detachItem('battery') : battery;
  if (carriedBattery) landedItem.attachItem('battery', carriedBattery);

  if (!consumeDeployCharge(landedItem)) {
    // Should be unreachable given the pre-check above, but never leave the
    // player's stowed item destroyed with nothing to show for it.
    return { success: false, reason: 'Drone battery is empty' };
  }

  const drone = new Drone(makeDroneId(), Math.round(player.x), Math.round(player.y), 'recon');
  drone.operatorId = player.id;
  drone.sourceItem = landedItem;
  drone._deployOrder = deployCounter++;

  gameMap.addEntity(drone, Math.round(player.x), Math.round(player.y));
  inv.destroyItem(stowedItem.instanceId);
  player.useAP(DroneConfig.DEPLOY_AP);

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
  const landedItem = drone.sourceItem || new Item(createItemFromDef('tool.recon_drone'));

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

  const stowedItem = new Item(createItemFromDef('tool.recon_drone_stowed'));
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
 * Advance the camera/control target to the next deployed device, or back to
 * the player once the list is exhausted. `currentId` is engine.activeDeviceId
 * (null when the player is in control).
 * @returns {string|null} the new activeDeviceId (null = player)
 */
export function cycleTarget(currentId, devices) {
  if (!devices.length) return null;
  if (currentId === null) return devices[0].id;
  const idx = devices.findIndex(d => d.id === currentId);
  if (idx === -1 || idx === devices.length - 1) return null;
  return devices[idx + 1].id;
}
