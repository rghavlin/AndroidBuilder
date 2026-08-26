import { ItemTrait } from './traits.js';

/**
 * Fill-meter display math for container items (water bottles, jugs, fuel cans,
 * rain collectors). Pure functions of an item's traits/capacity/ammoCount, with
 * no Item state of their own — extracted from Item.js, which is under managed
 * decomposition (AGENTS.md §6). Item keeps thin delegating methods so callers
 * (UniversalGrid's meter bar) are unchanged.
 */

/** Percent full for a water container (0 when it isn't one). */
export function getWaterPercent(item) {
  if (!item.hasTrait(ItemTrait.WATER_CONTAINER) || !item.capacity) return 0;
  return (item.ammoCount / item.capacity) * 100;
}

/**
 * Percent full for any item that shows a meter, or null for items that show
 * none. A water SOURCE (e.g. a well) has no meaningful fill level, so it is
 * excluded — except the rain collector, which really does fill and drain.
 */
export function getMeterPercent(item) {
  if (item.hasTrait(ItemTrait.WATER_CONTAINER)) {
    if (!item.hasTrait(ItemTrait.WATER_SOURCE) || item.defId === 'provision.rain_collector') {
      return getWaterPercent(item);
    }
  }
  if (item.hasTrait(ItemTrait.FUEL_CONTAINER) && item.capacity) {
    return (item.ammoCount / item.capacity) * 100;
  }
  return null;
}

/** Bar color for the meter above, or null when the item shows no meter. */
export function getMeterColor(item) {
  if (item.hasTrait(ItemTrait.WATER_CONTAINER)) {
    return item.waterQuality === 'dirty' ? '#8B4513' : '#60a5fa';
  }
  if (item.hasTrait(ItemTrait.FUEL_CONTAINER)) {
    return '#b8860b'; // Dark Gold
  }
  return null;
}
