import engine from '../GameEngine.js';
import { resolveMapEvents } from './migrateEvents.js';
import { isEventActive } from './conditions.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { Item } from '../inventory/Item.js';
import Logger from '../utils/Logger.js';

const log = Logger.scope('EventMarkers');

/**
 * Map appearances for authored events — our equivalent of an RPG Maker event
 * page's *graphic*.
 *
 * An event may declare `appearance: { defId }` (see eventTypes.ts). While that
 * event is active, an item of that def exists on its placement tile; when it
 * stops being active, the item goes away. Because presence is recomputed from
 * `isEventActive` rather than tracked incrementally, this is idempotent and
 * self-healing: a stale marker restored from an old save, or one left behind by
 * an event the author has since deleted, is cleaned up on the next sync.
 *
 * That's what makes an on/off switch fall out for free — two events on one tile
 * with opposite flag preconditions and opposite appearances. Exactly one is ever
 * active, so exactly one sprite ever exists, and clicking it runs that event.
 *
 * Markers are stamped `isEventMarker: true` (so reconciliation can tell them
 * apart from an author-placed item of the same def) and `eventId` (so clicking
 * one in the ground panel knows what to fire — see UniversalGrid).
 */

// Re-entrancy guard. Writing a marker into the ground container emits
// 'inventoryChanged', which EventRunner listens to and answers by calling right
// back into here. Without this it is an infinite loop. Mirrors the
// `_checkingProgress` guard EventRunner uses around quest progression.
let _syncing = false;

/** True for an item this system owns (as opposed to one the author placed). */
function isMarker(item) {
  return !!(item && item.isEventMarker);
}

/**
 * Which appearance, if any, each tile should be showing right now.
 * @returns {Map<string, {x, y, defId, eventId}>} keyed "x,y"
 */
function computeDesiredMarkers(events, ctx, latches) {
  const desired = new Map();
  for (const ev of events) {
    const defId = ev?.appearance?.defId;
    if (!defId) continue;
    const p = ev.placement;
    // Appearances are tile-anchored only: a proximity event's radius has no one
    // obvious cell to draw on, and chainOnly events have no location at all.
    if (!p || p.kind !== 'tile') continue;
    if (typeof p.x !== 'number' || typeof p.y !== 'number') continue;

    const key = `${p.x},${p.y}`;
    // First eligible event in author order wins a contested tile, matching how
    // EventRunner._findEventAt picks which event a click on that tile runs — so
    // the sprite always depicts the event you'd actually trigger.
    if (desired.has(key)) continue;
    if (!isEventActive(ev, ctx, latches)) continue;
    desired.set(key, { x: p.x, y: p.y, defId, eventId: ev.id });
  }
  return desired;
}

/** A fresh marker Item for `defId`, branded with the event that owns it. */
function buildMarker(defId, eventId) {
  const def = createItemFromDef(defId);
  if (!def) {
    log.warn(`Event "${eventId}" has an unknown appearance defId "${defId}" — no marker placed`);
    return null;
  }
  return new Item({ ...def, eventId, isEventMarker: true });
}

/**
 * Reconcile one tile against the single marker it should be showing (or none).
 * Handles the tile-vs-ground-container split: while the player stands on a tile,
 * that tile's items live in the inventory manager's ground container and the map
 * tile itself is empty (see InventoryManager.syncWithMap), so writing to
 * `tile.inventoryItems` there would be invisible and clobbered on the next move.
 *
 * @returns {{ground: boolean, tile: boolean}} which storage actually changed —
 *   the caller turns each into the right kind of "something moved" notification.
 */
function reconcileTile(gameMap, inventoryManager, x, y, want) {
  const onPlayerTile = !!inventoryManager &&
    inventoryManager.lastSyncedX === x &&
    inventoryManager.lastSyncedY === y &&
    !!inventoryManager.groundManager;

  if (onPlayerTile) {
    const container = inventoryManager.groundContainer;
    if (!container) return { ground: false, tile: false };
    let changed = false;
    let satisfied = false;
    for (const item of container.getAllItems()) {
      if (!isMarker(item)) continue;
      if (want && item.defId === want.defId && !satisfied) {
        // Already correct — keep it, and refresh the owning event id in case the
        // author repointed the appearance.
        item.eventId = want.eventId;
        satisfied = true;
        continue;
      }
      container.removeItem(item.instanceId);
      changed = true;
    }
    if (want && !satisfied) {
      const marker = buildMarker(want.defId, want.eventId);
      if (marker && inventoryManager.groundManager.addItemSmart(marker)) changed = true;
      else if (marker) log.warn(`Ground full — could not place marker ${want.defId} at player tile (${x}, ${y})`);
    }
    return { ground: changed, tile: false };
  }

  const existing = gameMap.getItemsOnTile(x, y) || [];
  const kept = [];
  let satisfied = false;
  let changed = false;
  for (const item of existing) {
    if (!isMarker(item)) { kept.push(item); continue; }
    if (want && item.defId === want.defId && !satisfied) {
      item.eventId = want.eventId;
      satisfied = true;
      kept.push(item);
      continue;
    }
    changed = true; // dropped
  }
  if (want && !satisfied) {
    const marker = buildMarker(want.defId, want.eventId);
    if (marker) { kept.push(marker); changed = true; }
  }
  if (changed) gameMap.setItemsOnTile(x, y, kept);
  return { ground: false, tile: changed };
}

/**
 * Bring every event appearance on the current map in line with event state.
 *
 * Cheap enough to call on each reactive pulse: it only visits tiles that some
 * event actually names an appearance for, never the whole map. (The one
 * full-map pass lives in purgeOrphanMarkers, called once per map load.)
 *
 * @param {{firedOnce: Set<string>, autoResolved: Set<string>}} latches - the EventRunner
 */
export function syncEventMarkers(latches) {
  if (_syncing) return;
  const gameMap = engine.gameMap;
  if (!gameMap || !latches) return;

  _syncing = true;
  try {
    const events = resolveMapEvents(gameMap.metadata) || [];
    const inventoryManager = engine.inventoryManager;
    const ctx = { inventoryManager, questState: engine.questState, player: engine.player };
    const desired = computeDesiredMarkers(events, ctx, latches);

    // Every tile any appearance-bearing event names, whether or not it currently
    // wants a marker — a tile that just *stopped* wanting one still needs its old
    // marker cleared.
    const tiles = new Map();
    for (const ev of events) {
      const p = ev?.placement;
      if (!ev?.appearance?.defId || !p || p.kind !== 'tile') continue;
      if (typeof p.x !== 'number' || typeof p.y !== 'number') continue;
      tiles.set(`${p.x},${p.y}`, { x: p.x, y: p.y });
    }

    // Logged unconditionally (debug level) so a silent no-op is diagnosable:
    // "no markers appeared" and "sync never ran" look identical otherwise, which
    // is exactly what made the first in-app report hard to chase down.
    log.debug(`sync: ${tiles.size} appearance tile(s), ${desired.size} active marker(s)`);

    let groundChanged = false;
    let tileChanged = false;
    for (const [key, { x, y }] of tiles) {
      const res = reconcileTile(gameMap, inventoryManager, x, y, desired.get(key) || null);
      if (res.ground) groundChanged = true;
      if (res.tile) tileChanged = true;
    }

    if (groundChanged) {
      inventoryManager.groundManager.sortGroundItems?.();
      inventoryManager.emit?.('inventoryChanged');
    }
    // The canvas only redraws when a render is requested (see MapCanvas's rAF
    // loop); without this a swapped sprite waits for the slow safety interval.
    if (tileChanged) engine.notifyUpdate();
  } catch (err) {
    console.error('[EventMarkers] Error syncing event markers:', err);
  } finally {
    _syncing = false;
  }
}

/**
 * Drop markers no live event claims any more, anywhere on the map.
 *
 * Markers persist in saves (they're ordinary tile items), so a save made while
 * one existed restores it even if the author has since deleted the event,
 * renamed it, or removed its appearance. syncEventMarkers only looks at tiles
 * events still name, so it cannot see those; this full-map pass can. Call once
 * per map load, before the first sync.
 */
export function purgeOrphanMarkers() {
  const gameMap = engine.gameMap;
  if (!gameMap) return 0;

  const claimed = new Map(); // eventId -> defId still authored
  for (const ev of resolveMapEvents(gameMap.metadata) || []) {
    if (ev?.appearance?.defId) claimed.set(ev.id, ev.appearance.defId);
  }

  let purged = 0;
  for (let y = 0; y < gameMap.height; y++) {
    for (let x = 0; x < gameMap.width; x++) {
      const items = gameMap.getItemsOnTile(x, y);
      if (!items || items.length === 0) continue;
      const kept = items.filter(it => !isMarker(it) || claimed.get(it.eventId) === it.defId);
      if (kept.length !== items.length) {
        purged += items.length - kept.length;
        gameMap.setItemsOnTile(x, y, kept);
      }
    }
  }
  if (purged > 0) log.debug(`Purged ${purged} orphaned event marker(s)`);
  return purged;
}
