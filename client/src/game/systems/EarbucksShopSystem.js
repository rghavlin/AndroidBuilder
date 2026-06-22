import { createItemFromDef } from '../inventory/ItemDefs.js';
import { Item } from '../inventory/Item.js';
import engine from '../GameEngine.js';

class EarbucksShopSystem {
  initCatalog(mapId) {
    if (!engine.worldManager) return;
    const mapEntry = engine.worldManager.maps.get(mapId);
    if (!mapEntry) return;
    
    if (!mapEntry.metadata) {
      mapEntry.metadata = {};
    }
    
    if (!mapEntry.metadata.shopCatalog) {
      mapEntry.metadata.shopCatalog = [
        { defId: 'food.corn', name: 'Corn', price: 5 },
        { defId: 'food.waterbottle', name: 'Water Bottle', price: 20 },
        { defId: 'tool.lighter', name: 'Lighter', price: 30 }
      ];
    }
  }
  
  getCatalog(mapId) {
    this.initCatalog(mapId);
    const mapEntry = engine.worldManager?.maps.get(mapId);
    return mapEntry?.metadata?.shopCatalog || [];
  }
  
  addItem(mapId, { defId, name, price }) {
    this.initCatalog(mapId);
    const mapEntry = engine.worldManager?.maps.get(mapId);
    if (!mapEntry || !mapEntry.metadata) return;
    
    const catalog = mapEntry.metadata.shopCatalog || [];
    const existing = catalog.find(i => i.defId === defId);
    if (existing) {
      existing.price = price;
      existing.name = name;
    } else {
      catalog.push({ defId, name, price });
    }
    mapEntry.metadata.shopCatalog = catalog;
    engine.notifyUpdate();
  }
  
  removeItem(mapId, defId) {
    this.initCatalog(mapId);
    const mapEntry = engine.worldManager?.maps.get(mapId);
    if (!mapEntry || !mapEntry.metadata) return;
    
    const catalog = mapEntry.metadata.shopCatalog || [];
    mapEntry.metadata.shopCatalog = catalog.filter(i => i.defId !== defId);
    engine.notifyUpdate();
  }
  
  buyItem(defId, mapId, player, inventoryManager) {
    const catalog = this.getCatalog(mapId);
    const itemConfig = catalog.find(i => i.defId === defId);
    if (!itemConfig) {
      return { success: false, reason: 'Item not in catalog' };
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
    
    // Notify log/event
    if (engine.addLog) {
      engine.addLog(`Bought ${itemConfig.name} for ${itemConfig.price} Earbucks.`, 'info');
    }
    
    engine.notifyUpdate();
    return { success: true };
  }
}

export const earbucksShopSystem = new EarbucksShopSystem();
