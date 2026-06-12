import { Position } from '../components/Position.js';
import engine from '../GameEngine.js';

export class InventorySystem {
  static resolvePickup(entity, pickupIntent, gameMap, actionQueue = [], engineInstance = null) {
    if (!entity || !pickupIntent || !gameMap) return;
    if (!entity.hasComponent('Inventory')) {
      console.warn(`[InventorySystem] Entity ${entity.id} does not have an Inventory component for PickupIntent.`);
      return;
    }

    const inventory = entity.getComponent('Inventory');
    const itemId = pickupIntent.itemId;

    // Find the item entity in the central entityMap
    const itemEntity = gameMap.getEntity(itemId);
    if (!itemEntity) {
      console.warn(`[InventorySystem] Item entity ${itemId} not found in central registry.`);
      return;
    }

    // Weight/Slot constraints
    if (itemEntity.hasComponent('Item')) {
      const itemComp = itemEntity.getComponent('Item');
      
      // Calculate current weight of inventory by looking up each item entity in gameMap
      let currentWeight = 0;
      for (const invItemId of inventory.items) {
        const invItem = gameMap.getEntity(invItemId);
        if (invItem && invItem.hasComponent('Item')) {
          currentWeight += invItem.getComponent('Item').weight;
        }
      }

      if (currentWeight + itemComp.weight > inventory.maxWeight) {
        console.warn(`[InventorySystem] Pickup failed: inventory weight limit reached.`);
        return;
      }
    }

    if (inventory.items.length >= inventory.maxSlots) {
      console.warn(`[InventorySystem] Pickup failed: inventory slot limit reached.`);
      return;
    }

    // Pure ECS: item remains in gameMap.entityMap (detached, has no map coordinates) but is removed from tile contents.
    const itemX = itemEntity.logicalX !== undefined ? itemEntity.logicalX : itemEntity.x;
    const itemY = itemEntity.logicalY !== undefined ? itemEntity.logicalY : itemEntity.y;
    const tile = gameMap.getTile(itemX, itemY);
    if (tile) {
      tile.removeEntity(itemId);
    }
    
    // Clear item position component or coordinates to mark as detached
    if (itemEntity.hasComponent('Position')) {
      itemEntity.removeComponent('Position');
    }

    // Add to inventory items list
    if (!inventory.items.includes(itemId)) {
      inventory.items.push(itemId);
    }

    // Flag UI as dirty
    const uiEngine = engineInstance || engine;
    if (uiEngine) {
      uiEngine._uiDirty = true;
      if (typeof uiEngine.notifyUpdate === 'function') {
        uiEngine.notifyUpdate();
      }
    }

    // Visual queue action
    actionQueue.push({
      type: 'PICKUP',
      entityId: entity.id,
      data: {
        itemId: itemId
      }
    });

    console.log(`[InventorySystem] Resolved PickupIntent: Entity ${entity.id} picked up item ${itemId}`);
    
    // Clean up intent
    entity.removeComponent('PickupIntent');
  }

  static resolveDrop(entity, dropIntent, gameMap, actionQueue = [], engineInstance = null) {
    if (!entity || !dropIntent || !gameMap) return;
    if (!entity.hasComponent('Inventory')) {
      console.warn(`[InventorySystem] Entity ${entity.id} does not have an Inventory component for DropIntent.`);
      return;
    }

    const inventory = entity.getComponent('Inventory');
    const itemId = dropIntent.itemId;

    const itemIndex = inventory.items.indexOf(itemId);
    if (itemIndex === -1) {
      console.warn(`[InventorySystem] Item ${itemId} not found in entity ${entity.id}'s inventory.`);
      return;
    }

    // Find the item entity in the central entityMap
    const itemEntity = gameMap.getEntity(itemId);
    if (!itemEntity) {
      console.warn(`[InventorySystem] Item entity ${itemId} not found in central registry for drop.`);
      return;
    }

    // Remove from inventory
    inventory.items.splice(itemIndex, 1);

    // Get dropper's position
    const dropX = entity.logicalX !== undefined ? entity.logicalX : entity.x;
    const dropY = entity.logicalY !== undefined ? entity.logicalY : entity.y;

    // Attach/Update Position component to dropper's coordinates
    let posComp = itemEntity.getComponent('Position');
    if (!posComp) {
      posComp = new Position({ x: dropX, y: dropY, level: 0 });
      itemEntity.addComponent(posComp);
    } else {
      posComp.x = dropX;
      posComp.y = dropY;
    }

    // Sync other coordinate fields
    itemEntity.logicalX = dropX;
    itemEntity.logicalY = dropY;
    itemEntity.gridX = dropX;
    itemEntity.gridY = dropY;
    itemEntity.renderX = dropX;
    itemEntity.renderY = dropY;
    itemEntity.x = dropX;
    itemEntity.y = dropY;

    // Put item back onto game map tile contents
    const tile = gameMap.getTile(dropX, dropY);
    if (tile) {
      tile.addEntity(itemEntity);
    }

    // Flag UI as dirty
    const uiEngine = engineInstance || engine;
    if (uiEngine) {
      uiEngine._uiDirty = true;
      if (typeof uiEngine.notifyUpdate === 'function') {
        uiEngine.notifyUpdate();
      }
    }

    // Visual queue action
    actionQueue.push({
      type: 'DROP',
      entityId: entity.id,
      data: {
        itemId: itemId,
        x: dropX,
        y: dropY
      }
    });

    console.log(`[InventorySystem] Resolved DropIntent: Entity ${entity.id} dropped item ${itemId} at (${dropX}, ${dropY})`);

    // Clean up intent
    entity.removeComponent('DropIntent');
  }

  static process(entities, worldManager, engineInstance, actionQueue = []) {
    const activeMap = engineInstance ? engineInstance.gameMap : (engine ? engine.gameMap : null);
    if (!activeMap) return;

    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    for (const entity of entityList) {
      if (entity.hasComponent('PickupIntent')) {
        this.resolvePickup(entity, entity.getComponent('PickupIntent'), activeMap, actionQueue, engineInstance);
      }
      if (entity.hasComponent('DropIntent')) {
        this.resolveDrop(entity, entity.getComponent('DropIntent'), activeMap, actionQueue, engineInstance);
      }
    }
  }
}
