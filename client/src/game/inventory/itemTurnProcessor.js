/**
 * itemTurnProcessor - per-turn effects for every item the inventory owns.
 *
 * Walks equipment (and everything nested inside it) plus every registered
 * container, ticking each item exactly once per turn: shelf life / lifetime and
 * the expire-or-transform decision, then power generation (solar, wired
 * charger, power source) via the TurnProcessingUtils rules shared with the
 * map-side engine.
 *
 * Extracted from InventoryManager (AGENTS.md §6). The manager passes itself in
 * as the host; only `destroyItem` and `isContainerPowered` are used from it.
 */
import { ItemDefs } from './ItemDefs.js';
import { TurnProcessingUtils } from '../utils/TurnProcessingUtils.js';
import { getHourFromTurn } from '../utils/TimeUtils.js';

/**
 * @param {object} host InventoryManager-shaped: { equipment, containers,
 *   destroyItem(id), isContainerPowered(containerId) }
 */
export function processInventoryTurn(host, turn = 1, isOutdoors = false) {
  const currentHour = getHourFromTurn(turn);
  const ctx = {
    host,
    isOutdoors,
    isDaylight: currentHour >= 6 && currentHour < 20,
    processedItemIds: new Set()
  };

  // Equipment first — these items (and their nested contents) count as carried,
  // which changes how power generation is applied.
  Object.values(host.equipment).forEach(item => {
    if (item) processItem(item, ctx, true);
  });

  // Then everything else the manager tracks: ground, workspaces, dynamic grids
  host.containers.forEach(container => {
    container.getAllItems().forEach(item => processItem(item, ctx, false));
  });
}

function processItem(item, ctx, isInPlayerInventory) {
  if (!item) return;
  if (ctx.processedItemIds.has(item.instanceId)) return;
  ctx.processedItemIds.add(item.instanceId);

  applyExpiration(item, ctx);
  applyPower(item, ctx, isInPlayerInventory);

  if (item.attachments) {
    Object.values(item.attachments).forEach(att => {
      if (att) processItem(att, ctx, isInPlayerInventory);
    });
  }

  const grid = item.getContainerGrid?.();
  if (grid) {
    grid.getAllItems().forEach(nested => processItem(nested, ctx, isInPlayerInventory));
  }

  const pockets = item.getPocketContainers?.();
  if (pockets && Array.isArray(pockets)) {
    pockets.forEach(pocket => {
      pocket.getAllItems().forEach(nested => processItem(nested, ctx, isInPlayerInventory));
    });
  }
}

/** Tick shelf life / lifetime, then transform or destroy anything that ran out. */
function applyExpiration(item, ctx) {
  const oldShelfLife = item.shelfLife;
  const oldLifetime = item.lifetimeTurns;

  item.processTurn(); // Standard item-level tick

  if (item.shelfLife === oldShelfLife && item.lifetimeTurns === oldLifetime) return;

  const isExpired = (item.shelfLife !== null && item.shelfLife <= 0) ||
                    (item.lifetimeTurns !== null && item.lifetimeTurns <= 0);
  if (!isExpired) return;

  if (item.transformInto && ItemDefs[item.transformInto]) {
    console.log(`[itemTurnProcessor] Item ${item.name} (${item.instanceId}) transforming into ${item.transformInto}`);
    // updateFromDef keeps defId and every definition-controlled property
    // (lifetime, transformInto, ...) in sync with the new definition.
    item.updateFromDef(item.transformInto);
  } else if (!item.transformInto) {
    console.log(`[itemTurnProcessor] Item ${item.name} (${item.instanceId}) expired and vanished.`);
    ctx.host.destroyItem(item.instanceId);
  }
}

/**
 * Power generation (source / wired charger / solar), shared with GameMap's
 * map-side engine via TurnProcessingUtils. Powered-ness for a wired charger is
 * resolved here through the owner-chain walk; the solar and power-source gates
 * are location flags the unified helper applies.
 */
function applyPower(item, ctx, isInPlayerInventory) {
  const chargerGrid = item.getContainerGrid?.();
  const chargerPowered = (item.defId === 'tool.battery_charger' && chargerGrid)
    ? ctx.host.isContainerPowered(chargerGrid.id)
    : false;

  TurnProcessingUtils.applyPowerGeneration(item, {
    isPowered: chargerPowered,
    isOutdoors: ctx.isOutdoors,
    isDaylight: ctx.isDaylight,
    isInPlayerInventory
  });
}
