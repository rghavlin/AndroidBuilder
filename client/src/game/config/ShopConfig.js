// Default shop catalog per map. Prices are NOT set here — they are read from the
// central price list (see ItemPricing.getItemPrice). Each entry only declares
// what is for sale and how much stock exists (stock: null = unlimited).
export const DEFAULT_SHOP_CATALOG = [
  { defId: 'food.corn', stock: null },
  { defId: 'food.waterbottle', stock: null },
  { defId: 'tool.lighter', stock: 1 }
];
