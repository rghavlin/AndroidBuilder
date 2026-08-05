import { ItemTrait } from '../inventory/traits.js';
import { ItemDefs } from '../inventory/ItemDefs.js';
import { asItemInstance } from './RemoteItem.js';
import { hasReceiver } from './RemoteDeviceKinds.js';

/**
 * Identity layer for remote-controlled ground vehicles — wagons carrying an RC
 * receiver. The wagon equivalent of the drone half of RemoteDeviceRegistry, and
 * kept separate for the same reason the two movement modules are: a drone flies
 * and is its own entity class, a wagon rolls and is an Item with two homes.
 * Folding them together would fork every function on `airborne`.
 *
 * The two homes are the whole complication. A wagon sitting on a far tile is an
 * on-map ECS *item entity* whose attachments are raw JSON; the moment the player
 * stands on that tile it is instead inflated into inventoryManager.groundContainer
 * as a real Item and the tile is emptied. Every lookup here therefore scans both
 * and normalizes to a real Item via asItemInstance(), so callers always get
 * something with getMotorizedBonus()/consumeMotorPower() on it.
 */

// Re-exported so callers of this layer don't need to know the predicate lives
// in the dependency-free module the renderer also pulls from.
export { hasReceiver };

/**
 * Whether this is a wagon at all. `traits` is not in Item.SERIALIZABLE_PROPERTIES,
 * so an on-map item entity may not carry one — fall back to the def, which is
 * authoritative either way.
 */
function isWagon(candidate) {
  if (!candidate) return false;
  if (typeof candidate.hasTrait === 'function') return candidate.hasTrait(ItemTrait.WAGON);
  const def = ItemDefs[candidate.defId || candidate.id];
  return !!def?.traits?.includes(ItemTrait.WAGON);
}

/**
 * Every receiver-fitted wagon the phone can reach — anywhere on the map, powered
 * or not. Same dual scan (and same dedupe) as listGroundedDevices: a wagon under
 * the player's feet lives in the ground container, not on the tile.
 * @returns {Array<Item|Entity>} raw candidates, stable order
 */
export function listRcVehicles(engine) {
  const gameMap = engine?.gameMap;
  const found = new Map(); // instanceId -> raw candidate

  if (gameMap && typeof gameMap.getEntitiesByType === 'function') {
    for (const e of gameMap.getEntitiesByType('item')) {
      if (isWagon(e) && hasReceiver(e)) found.set(e.instanceId || e.id, e);
    }
  }
  for (const it of engine?.inventoryManager?.groundContainer?.getAllItems?.() || []) {
    if (isWagon(it) && hasReceiver(it)) found.set(it.instanceId || it.id, it);
  }

  // Stable order so cycling doesn't reshuffle between presses.
  return [...found.values()].sort((a, b) =>
    String(a.instanceId || a.id).localeCompare(String(b.instanceId || b.id))
  );
}

/**
 * The RC wagon the phone is currently linked to, or null (including when the
 * active device is a drone). `item` is always a real Item; `entity` is the
 * on-map render form when there is one.
 *
 * @returns {{item: Item, entity: Object|null, x: number, y: number, source: 'map'|'ground'}|null}
 */
export function getActiveRcVehicle(engine) {
  const key = engine?.activeDeviceId;
  if (!key) return null;

  const onMap = engine.gameMap?.getEntity?.(key);
  if (onMap) {
    if (!isWagon(onMap) || !hasReceiver(onMap)) return null;
    return {
      item: asItemInstance(onMap),
      entity: onMap,
      x: Math.round(onMap.logicalX ?? onMap.x),
      y: Math.round(onMap.logicalY ?? onMap.y),
      source: 'map'
    };
  }

  const inv = engine.inventoryManager;
  const inGround = (inv?.groundContainer?.getAllItems?.() || []).find(it => it?.instanceId === key);
  if (!inGround || !isWagon(inGround) || !hasReceiver(inGround)) return null;

  // A ground-container item has no coordinates of its own — it is, by
  // definition, on whichever tile the container last synced to.
  return {
    item: inGround,
    entity: null,
    x: Math.round(inv.lastSyncedX ?? engine.player?.x ?? 0),
    y: Math.round(inv.lastSyncedY ?? engine.player?.y ?? 0),
    source: 'ground'
  };
}

/**
 * Why this wagon can't be driven right now, or null if it can. Returned as
 * player-facing text because every caller (click handler, hover preview) shows
 * it verbatim.
 *
 * Physical entanglements come first: a wagon you're holding onto isn't going
 * anywhere on its own, and saying "no motor power" about a wagon you're
 * currently dragging would be a confusing lie.
 *
 * @param {Item} item
 * @param {GameEngine} engine
 * @returns {string|null}
 */
export function driveBlockedReason(item, engine) {
  if (!item) return 'No active device';

  const id = item.instanceId;
  if (engine?.dragging?.item?.instanceId === id) return 'You are dragging it';
  if (engine?.riding?.item?.instanceId === id) return 'You are riding it';
  if (item.hitchedToInstanceId) return 'It is hitched to a cart';

  // The reverse link: something is towing this wagon even if the wagon's own
  // field was never set.
  const towedByCart = (engine?.inventoryManager?.groundContainer?.getAllItems?.() || [])
    .some(it => it?.hitchedItemInstanceId === id);
  if (towedByCart) return 'It is hitched to a cart';

  if (!(item.getMotorizedBonus?.() > 0)) return 'No motor power';

  return null;
}
