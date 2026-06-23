import { createItemFromDef } from '../inventory/ItemDefs.js';
import { Item } from '../inventory/Item.js';
import engine from '../GameEngine.js';

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
      // stock === null means an infinite supply; a finite number caps how many
      // can be purchased on this map (tracked via the `purchased` counter).
      mapEntry.metadata.shopCatalog = [
        { defId: 'food.corn', name: 'Corn', price: 5, stock: null, purchased: 0 },
        { defId: 'food.waterbottle', name: 'Water Bottle', price: 20, stock: null, purchased: 0 },
        { defId: 'tool.lighter', name: 'Lighter', price: 30, stock: 1, purchased: 0 }
      ];
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

  addItem(mapId, { defId, name, price, stock = null }) {
    this.initCatalog(mapId);
    const mapEntry = engine.worldManager?.maps.get(mapId);
    if (!mapEntry || !mapEntry.metadata) return;

    // Normalize stock: null = infinite, otherwise a non-negative integer.
    const normalizedStock = (stock === null || stock === undefined)
      ? null
      : Math.max(0, Math.floor(stock));

    const catalog = mapEntry.metadata.shopCatalog || EMPTY_CATALOG;
    const existingIndex = catalog.findIndex(i => i.defId === defId);
    let newCatalog;
    if (existingIndex !== -1) {
      newCatalog = [...catalog];
      newCatalog[existingIndex] = {
        ...newCatalog[existingIndex],
        price,
        name,
        stock: normalizedStock
      };
    } else {
      newCatalog = [
        ...catalog,
        { defId, name, price, stock: normalizedStock, purchased: 0 }
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
