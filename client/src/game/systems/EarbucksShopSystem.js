import { createItemFromDef, ItemDefs } from '../inventory/ItemDefs.js';
import { Item } from '../inventory/Item.js';
import { getItemPrice } from '../inventory/ItemPricing.js';
import engine from '../GameEngine.js';
import { DEFAULT_SHOP_CATALOG, SHOP_CATALOG_BY_MAP } from '../config/ShopConfig.js';

const EMPTY_CATALOG = [];

class EarbucksShopSystem {
  initCatalog(mapId) {
    if (!engine.worldManager) return;
    const mapEntry = engine.worldManager.maps.get(mapId);
    if (!mapEntry) return;
    
    if (!mapEntry.metadata) {
      mapEntry.metadata = {};
    }
    
    if (!mapEntry.metadata.shopCatalog) {
      const mapNumber = parseInt(mapId?.replace('map_', ''), 10) || 1;
      const sourceCatalog = SHOP_CATALOG_BY_MAP[mapNumber] || DEFAULT_SHOP_CATALOG;
      
      // stock === null means an infinite supply; a finite number caps how many
      // can be purchased on this map (tracked via the `purchased` counter).
      // Prices are read from the central price list, never stored by the shop.
      mapEntry.metadata.shopCatalog = sourceCatalog.map(item => ({
        defId: item.defId,
        name: ItemDefs[item.defId]?.name || 'Unknown Item',
        price: getItemPrice(item.defId),
        stock: item.stock,
        purchased: 0
      }));
    } else {
      // Re-sync prices from the central list in case it changed (e.g. for an
      // existing save). Mutate in place so the catalog array keeps its identity
      // for useSyncExternalStore subscribers.
      for (const entry of mapEntry.metadata.shopCatalog) {
        entry.price = getItemPrice(entry.defId);
      }
    }
  }

  /**
   * Number of this item still available for purchase.
   * @returns {number} Infinity for unlimited stock, otherwise remaining count.
   */
  getAvailable(item) {
    if (!item || item.stock === null || item.stock === undefined) return Infinity;
    return Math.max(0, item.stock - (item.purchased || 0));
  }

  getCatalog(mapId) {
    this.initCatalog(mapId);
    const mapEntry = engine.worldManager?.maps.get(mapId);
    return mapEntry?.metadata?.shopCatalog || EMPTY_CATALOG;
  }

  addItem(mapId, { defId, name, stock = null }) {
    if (!defId || !ItemDefs[defId]) {
      console.warn(`[EarbucksShopSystem] Ignoring addItem: unknown defId "${defId}"`);
      return;
    }
    this.initCatalog(mapId);
    const mapEntry = engine.worldManager?.maps.get(mapId);
    if (!mapEntry || !mapEntry.metadata) return;

    // Price is always read from the central price list, never passed in.
    const price = getItemPrice(defId);

    // Normalize stock: null = infinite, otherwise a non-negative integer.
    const normalizedStock = (stock === null || stock === undefined)
      ? null
      : Math.max(0, Math.floor(stock));

    const catalog = mapEntry.metadata.shopCatalog || EMPTY_CATALOG;
    const existingIndex = catalog.findIndex(i => i.defId === defId);
    let newCatalog;
    const derivedName = name || ItemDefs[defId]?.name || 'Unknown Item';
    if (existingIndex !== -1) {
      newCatalog = [...catalog];
      newCatalog[existingIndex] = {
        ...newCatalog[existingIndex],
        price,
        name: derivedName,
        stock: normalizedStock
      };
    } else {
      newCatalog = [
        ...catalog,
        { defId, name: derivedName, price, stock: normalizedStock, purchased: 0 }
      ];
    }
    mapEntry.metadata.shopCatalog = newCatalog;
    engine.notifyUpdate();
  }
  
  removeItem(mapId, defId) {
    this.initCatalog(mapId);
    const mapEntry = engine.worldManager?.maps.get(mapId);
    if (!mapEntry || !mapEntry.metadata) return;
    
    const catalog = mapEntry.metadata.shopCatalog || EMPTY_CATALOG;
    mapEntry.metadata.shopCatalog = catalog.filter(i => i.defId !== defId);
    engine.notifyUpdate();
  }
  
  buyItem(defId, mapId, player, inventoryManager) {
    const catalog = this.getCatalog(mapId);
    const itemConfig = catalog.find(i => i.defId === defId);
    if (!itemConfig) {
      return { success: false, reason: 'Item not in catalog' };
    }

    if (this.getAvailable(itemConfig) <= 0) {
      return { success: false, reason: 'Out of stock' };
    }

    if (!player || player.earbucks < itemConfig.price) {
      return { success: false, reason: 'Insufficient funds' };
    }

    // Create the item
    const itemData = createItemFromDef(defId);
    if (!itemData) {
      return { success: false, reason: 'Invalid item definition' };
    }
    const item = Item.fromJSON(itemData);
    
    // Try adding to player inventory
    const addResult = inventoryManager.addItem(item);
    if (!addResult.success) {
      return { success: false, reason: 'Inventory full' };
    }
    
    // Deduct earbucks
    player.earbucks -= itemConfig.price;

    // Track purchase against finite stock
    if (itemConfig.stock !== null && itemConfig.stock !== undefined) {
      const existingIndex = catalog.findIndex(i => i.defId === defId);
      if (existingIndex !== -1) {
        const newCatalog = [...catalog];
        newCatalog[existingIndex] = {
          ...newCatalog[existingIndex],
          purchased: (newCatalog[existingIndex].purchased || 0) + 1
        };
        const mapEntry = engine.worldManager?.maps.get(mapId);
        if (mapEntry && mapEntry.metadata) {
          mapEntry.metadata.shopCatalog = newCatalog;
        }
      }
    }

    // Notify log/event
    if (engine.addLog) {
      engine.addLog(`Bought ${itemConfig.name} for ${itemConfig.price} Earbucks.`, 'info');
    }
    
    engine.notifyUpdate();
    return { success: true };
  }
}

export const earbucksShopSystem = new EarbucksShopSystem();
