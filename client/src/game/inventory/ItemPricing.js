/**
 * Item Pricing — single source of truth for what an item is worth in Earbucks.
 *
 * Earbucks shops read prices from here (they no longer hard-code a price per
 * catalog entry) and the map exit-toll calculation uses the same numbers, so a
 * price set here is the price everywhere.
 *
 * To change or add a price, edit the tables / rate constants below — nothing
 * else needs to change. Most items will never appear in a shop; we still price
 * them so the toll can be computed from whatever the player is carrying.
 *
 * Resolution order (see getItemPrice):
 *   1. FREE_ITEMS              -> 0   (planks, stones, sticks)
 *   2. FLAT_PRICES[defId]      -> fixed price for that specific item
 *   3. Per-unit category rules -> ammo, medical, food/water, lighters,
 *                                 batteries, seeds (computed from the item)
 *   4. CATEGORY_PRICES         -> gun / belt attachments priced by category
 *   5. DEFAULT_PRICE           -> 1
 */

import { ItemDefs } from './ItemDefs.js';
import { ItemCategory, ItemTrait } from './traits.js';

// Fallback price for anything not otherwise priced.
export const DEFAULT_PRICE = 1;

// Items that are intentionally worthless (abundant crafting scrap).
export const FREE_ITEMS = new Set([
  'weapon.plank',
  'weapon.stick',
  'crafting.stone'
]);

// Fixed, flat prices keyed by item definition id. Easy to edit / extend.
export const FLAT_PRICES = {
  // Firearms
  'weapon.9mmPistol': 40,
  'weapon.357Pistol': 40,
  'weapon.deserteagle': 100,
  'weapon.hunting_rifle': 50,
  'weapon.battle_rifle': 75,
  'weapon.shotgun': 45,

  // Melee weapons & tools
  'weapon.fire_axe': 30,
  'weapon.hammer': 25,
  'weapon.makeshift_hammer': 25,
  'weapon.crowbar': 25,
  'weapon.shovel': 25,
  'weapon.makeshift_shovel': 25,
  'weapon.machete': 25,
  'weapon.makeshift_machete': 25,
  'weapon.wrench': 15,
  'weapon.knife': 15,
  'weapon.makeshift_knife': 15,
  'tool.pliers': 10,
  'tool.smallflashlight': 15,

  // Appliances
  'tool.crank_charger': 50,            // Hand-cranked battery charger
  'tool.battery_powered_hotplate': 50,

  // Crafting / misc
  'crafting.tape': 5,
  'crafting.wire': 5,
  'crafting.rope': 5,
  'tool.cooking_pot': 5,
  'weapon.frying_pan': 5,
  'crafting.leather_belt': 5,

  // Belt attachments with specific prices (others fall through to CATEGORY_PRICES)
  'belt.pouch': 20,
  'belt.ammo_pouch': 1,

  // Backpacks
  'backpack.school': 30,    // School backpack
  'backpack.standard': 60,
  'backpack.hiking': 150,

  // Containers
  'container.guncase': 40,
  'container.lunchbox': 30,
  'container.toolbox': 30
};

// Flat prices keyed by item category. Used for groups of interchangeable items
// (gun attachments, the remaining belt attachments). Checked after FLAT_PRICES,
// so a specific defId price always wins.
export const CATEGORY_PRICES = {
  // Any gun attachment: scope, laser sight, suppressor
  [ItemCategory.SUPPRESSOR]: 10,
  [ItemCategory.LASER_SIGHT]: 10,
  [ItemCategory.RIFLE_SCOPE]: 10,
  [ItemCategory.CHOKE]: 10,
  // All other belt attachments
  [ItemCategory.HOLSTER]: 10,
  [ItemCategory.TOOL_RING]: 10
};

// Per-unit rates for computed prices.
export const RATE_PER_AMMO_ROUND = 1;     // Ammo: 1 per round
export const RATE_PER_HP_HEALED = 1;      // Medical: 1 per max HP healed
export const RATE_PER_NUTRITION = 1;      // Food: 1 per nutrition restored
export const RATE_PER_HYDRATION = 1;      // Water/drinks: 1 per hydration restored
export const RATE_PER_LIGHTER_CHARGE = 2; // Lighter/matches: 2 per charge
export const RATE_PER_BATTERY_CHARGE = 1; // Batteries: 1 per charge
export const RATE_PER_SEED = 1;           // Seeds: 1 per seed

// Default player max HP, used to value "heal to full" items (e.g. first aid kit)
// when no live player is available. Mirrors DEFAULT_PLAYER_STATS.maxHp.
const DEFAULT_MAX_HP = 100;

/**
 * Normalize the argument (a defId string, an item definition, or an Item
 * instance) into { defId, def, inst } so the rules below can read from either
 * live instance state (charges, stack count, loaded rounds) or the definition.
 */
function resolve(item) {
  if (!item) return { defId: null, def: null, inst: null };
  if (typeof item === 'string') {
    return { defId: item, def: ItemDefs[item] || null, inst: null };
  }
  const defId = item.defId || item.id || null;
  const isInstance = typeof item.hasTrait === 'function' || item.instanceId !== undefined;
  const def = (defId && ItemDefs[defId]) || (isInstance ? null : item);
  return { defId, def, inst: isInstance ? item : null };
}

// Read a numeric/value field preferring live instance state over the definition.
function field(inst, def, key) {
  if (inst && inst[key] !== undefined && inst[key] !== null) return inst[key];
  if (def && def[key] !== undefined && def[key] !== null) return def[key];
  return undefined;
}

function hasCategory(def, inst, category) {
  if (inst && typeof inst.hasCategory === 'function') return inst.hasCategory(category);
  const cats = (inst && inst.categories) || (def && def.categories) || [];
  return Array.isArray(cats) && cats.includes(category);
}

function hasTrait(def, inst, trait) {
  if (inst && typeof inst.hasTrait === 'function') return inst.hasTrait(trait);
  const traits = (inst && inst.traits) || (def && def.traits) || [];
  return Array.isArray(traits) && traits.includes(trait);
}

// How many copies this price applies to (stacked rounds/seeds/food, etc.).
function stackCount(inst) {
  return Math.max(1, (inst && inst.stackCount) || 1);
}

function isSeed(defId, def, inst) {
  if (defId && defId.endsWith('seeds')) return true;
  return !!field(inst, def, 'plantsAs');
}

// HP restored by a medical item: a flat number, a {min,max} range (use max),
// or "Max HP" (heal to full -> the player's max HP).
function healValue(def, inst, context = {}) {
  const ce = field(inst, def, 'consumptionEffects');
  const heal = ce && ce.heal;
  if (heal === undefined || heal === null) return 0;
  if (typeof heal === 'number') return heal;
  if (typeof heal === 'object') {
    if (typeof heal.max === 'number') return heal.max;
    if (typeof heal.min === 'number') return heal.min;
    return 0;
  }
  // String such as "Max HP": value equals the player's maximum HP.
  if (context.playerMaxHp !== undefined) return context.playerMaxHp;
  const livePlayer = (typeof globalThis !== 'undefined') && globalThis.gameEngine?.player;
  return (livePlayer && livePlayer.maxHp) || DEFAULT_MAX_HP;
}

/**
 * Standard Earbucks price for an item.
 * @param {string|object} item - a defId, an item definition, or an Item instance.
 * @param {object} [context] - optional evaluation context (e.g. { playerMaxHp })
 * @returns {number} price in Earbucks (>= 0).
 */
export function getItemPrice(item, context = {}) {
  const { defId, def, inst } = resolve(item);
  if (!defId) return DEFAULT_PRICE;

  // 1. Free items.
  if (FREE_ITEMS.has(defId)) return 0;

  // 2. Flat price for this specific item.
  if (FLAT_PRICES[defId] !== undefined) return FLAT_PRICES[defId];

  const qty = stackCount(inst);

  // 3. Per-unit category rules.

  // Ammo: 1 per round. Magazines hold their rounds in ammoCount; loose ammo
  // counts by stack size.
  if (hasCategory(def, inst, ItemCategory.AMMO)) {
    if (hasTrait(def, inst, ItemTrait.MAGAZINE)) {
      const rounds = field(inst, def, 'ammoCount') || 0;
      const price = rounds * RATE_PER_AMMO_ROUND;
      return price > 0 ? price : DEFAULT_PRICE;
    }
    return qty * RATE_PER_AMMO_ROUND;
  }

  // Medical: 1 per max HP healed. Items that don't restore HP fall back to default.
  if (hasCategory(def, inst, ItemCategory.MEDICAL)) {
    const price = healValue(def, inst, context) * RATE_PER_HP_HEALED * qty;
    return price > 0 ? price : DEFAULT_PRICE;
  }

  // Food & water: 1 per nutrition restored + 1 per hydration restored.
  if (hasCategory(def, inst, ItemCategory.FOOD)) {
    const ce = field(inst, def, 'consumptionEffects') || {};
    let units = 0;
    if (hasTrait(def, inst, ItemTrait.WATER_CONTAINER)) {
      // Water container value is the water it holds (1 hydration per unit).
      units += (field(inst, def, 'ammoCount') || 0) * RATE_PER_HYDRATION;
    } else if (typeof ce.hydration === 'number' && ce.hydration > 0) {
      units += ce.hydration * RATE_PER_HYDRATION;
    }
    if (typeof ce.nutrition === 'number' && ce.nutrition > 0) {
      units += ce.nutrition * RATE_PER_NUTRITION;
    }
    const price = units * qty;
    return price > 0 ? price : DEFAULT_PRICE;
  }

  // Lighter / matches: 2 per charge.
  if (hasTrait(def, inst, ItemTrait.CHARGE_BASED)) {
    const price = (field(inst, def, 'ammoCount') || 0) * RATE_PER_LIGHTER_CHARGE * qty;
    return price > 0 ? price : DEFAULT_PRICE;
  }

  // Batteries: 1 per charge.
  if (hasTrait(def, inst, ItemTrait.BATTERY)) {
    const price = (field(inst, def, 'ammoCount') || 0) * RATE_PER_BATTERY_CHARGE * qty;
    return price > 0 ? price : DEFAULT_PRICE;
  }

  // Seeds: 1 per seed.
  if (isSeed(defId, def, inst)) {
    return qty * RATE_PER_SEED;
  }

  // 4. Category-based flat prices (gun & remaining belt attachments).
  for (const category of Object.keys(CATEGORY_PRICES)) {
    if (hasCategory(def, inst, category)) return CATEGORY_PRICES[category];
  }

  // 5. Default.
  return DEFAULT_PRICE;
}
