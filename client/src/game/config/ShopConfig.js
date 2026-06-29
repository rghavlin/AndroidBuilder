// Default shop catalog per map. Prices are NOT set here — they are read from the
// central price list (see ItemPricing.getItemPrice). Each entry only declares
// what is for sale and how much stock exists (stock: null = unlimited).

// Catalog for map 1
const MAP_1_CATALOG = [
  { defId: 'food.corn', stock: null },
  { defId: 'food.waterbottle', stock: null },
  { defId: 'tool.lighter', stock: 1 }
];

// Catalog for map 2 (same for now — configure independently later)
const MAP_2_CATALOG = [
  { defId: 'food.corn', stock: null },
  { defId: 'food.waterbottle', stock: null },
  { defId: 'tool.lighter', stock: 1 }
];

// Default fallback for all other branching road maps
export const DEFAULT_SHOP_CATALOG = MAP_1_CATALOG;

// Map-number keyed overrides. Add an entry here to give a specific map its own catalog.
export const SHOP_CATALOG_BY_MAP = {
  1: MAP_1_CATALOG,
  2: MAP_2_CATALOG,
};
