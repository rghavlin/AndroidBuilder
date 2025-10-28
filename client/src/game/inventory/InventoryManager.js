
import { Container } from './Container.js';
import { Item } from './Item.js';
import { GroundManager } from './GroundManager.js';

/**
 * InventoryManager coordinates all containers in the game
 * Maintains the firewall between inventory and map systems
 */
export class InventoryManager {
  constructor() {
    // Core containers
    this.containers = new Map(); // containerId -> Container
    
    // Equipment slots (exactly as specified)
    this.equipment = {
      backpack: null,
      upper_body: null,
      lower_body: null,
      melee: null,
      handgun: null,
      long_gun: null,
      flashlight: null
    };

    // Ground container (special auto-expanding container)
    this.groundContainer = new Container({
      id: 'ground',
      type: 'ground',
      name: 'Ground Items',
      width: 6,
      height: 50,
      autoExpand: true,
      autoSort: true
    });
    
    this.containers.set('ground', this.groundContainer);
    
    // Ground management system
    this.groundManager = new GroundManager(this.groundContainer);
    
    // Initialize with basic backpack container
    this.initializeDefaultContainers();
  }

  /**
   * Initialize default containers
   */
  initializeDefaultContainers() {
    // No default containers needed - backpack only shows when equipped (Phase 5C)
  }

  /**
   * Equip an item to a specific slot
   */
  equipItem(item, slot = null) {
    // Auto-determine slot if not specified
    if (!slot && item.equippableSlot) {
      slot = item.equippableSlot;
    }

    if (!slot || !this.equipment.hasOwnProperty(slot)) {
      return { success: false, reason: 'Invalid equipment slot' };
    }

    // Check if item can be equipped in this slot
    if (item.equippableSlot !== slot) {
      return { success: false, reason: 'Item cannot be equipped in this slot' };
    }

    // Unequip current item in slot if present
    let unequippedItem = null;
    if (this.equipment[slot]) {
      unequippedItem = this.unequipItem(slot);
      if (!unequippedItem.success) {
        return unequippedItem;
      }
      unequippedItem = unequippedItem.item;
    }

    // Remove item from its current container
    let sourceContainer = null;
    if (item._container) {
      sourceContainer = item._container;
      sourceContainer.removeItem(item.id);
    }

    // Equip the item
    this.equipment[slot] = item;
    item.isEquipped = true;
    item._container = null;

    // Handle dynamic container addition
    this.updateDynamicContainers();

    return { 
      success: true, 
      unequippedItem,
      sourceContainer: sourceContainer?.id 
    };
  }

  /**
   * Unequip an item from a slot
   */
  unequipItem(slot) {
    if (!this.equipment.hasOwnProperty(slot) || !this.equipment[slot]) {
      return { success: false, reason: 'No item equipped in slot' };
    }

    const item = this.equipment[slot];
    this.equipment[slot] = null;
    item.isEquipped = false;

    // Try to add item back to inventory
    const addResult = this.addItem(item);
    if (!addResult.success) {
      // If can't add to inventory, drop to ground
      if (this.groundContainer.addItem(item)) {
        addResult.success = true;
        addResult.container = 'ground';
      } else {
        // Emergency: force back to equipment slot
        this.equipment[slot] = item;
        item.isEquipped = true;
        return { success: false, reason: 'No space available for unequipped item' };
      }
    }

    // Handle dynamic container removal
    this.updateDynamicContainers();

    return { success: true, item, placedIn: addResult.container };
  }

  /**
   * Calculate encumbrance modifiers from equipped clothing
   */
  getEncumbranceModifiers() {
    const { EncumbranceModifiers } = require('./traits.js');
    let totalEvade = 0;
    let totalAP = 0;

    // Check upper body
    if (this.equipment.upper_body && this.equipment.upper_body.encumbranceTier) {
      const mods = EncumbranceModifiers[this.equipment.upper_body.encumbranceTier];
      totalEvade += mods.evade;
      totalAP += mods.ap;
    }

    // Check lower body
    if (this.equipment.lower_body && this.equipment.lower_body.encumbranceTier) {
      const mods = EncumbranceModifiers[this.equipment.lower_body.encumbranceTier];
      totalEvade += mods.evade;
      totalAP += mods.ap;
    }

    return { evade: totalEvade, ap: totalAP };
  }

  /**
   * Check if a container can be opened (backpack only if equipped, specialty containers always)
   */
  canOpenContainer(item) {
    if (!item || !item.isContainer()) {
      return false;
    }

    // Backpacks can only be opened when equipped
    if (item.equippableSlot === 'backpack') {
      return item.isEquipped;
    }

    // Specialty containers with openableWhenNested trait can always be opened
    if (item.isOpenableWhenNested()) {
      return true;
    }

    // Other containers can be opened if not nested
    return !item._container;
  }

  /**
   * Update dynamic containers based on equipped items
   */
  updateDynamicContainers() {
    // Remove old dynamic containers (except ground and default backpack)
    const toRemove = [];
    for (const [id, container] of this.containers.entries()) {
      if (container.type === 'dynamic-pocket' || container.type === 'equipped-backpack') {
        toRemove.push(id);
      }
    }
    toRemove.forEach(id => this.containers.delete(id));

    // Add containers from equipped items
    Object.entries(this.equipment).forEach(([slot, item]) => {
      if (item && item.isContainer && item.isContainer()) {
        // Ensure a real container exists (constructor may have failed due to circular import)
        let containerGrid = item.getContainerGrid();
        
        // Fallback: Create container if missing but data exists
        if (!containerGrid && item._containerGridData) {
          try {
            const data = item._containerGridData;
            const ownerId = item.instanceId || item.id || `item-${Date.now()}`;
            
            containerGrid = new Container({
              id: `${ownerId}-container`,
              type: 'item-container',
              name: `${item.name} Storage`,
              width: data.width,
              height: data.height,
              autoExpand: data.autoExpand,
              autoSort: data.autoSort
            });
            
            // Assign it back to the item so future calls work
            item.containerGrid = containerGrid;
            
            console.debug('[InventoryManager] Created fallback container for', item.name);
          } catch (err) {
            console.warn('[InventoryManager] Failed to create fallback container for', item.name, err);
          }
        }
        
        if (containerGrid) {
          const containerId = `${slot}-container`;
          containerGrid.id = containerId;
          containerGrid.type = slot === 'backpack' ? 'equipped-backpack' : 'dynamic-pocket';
          containerGrid.name = `${item.name} Storage`;
          this.containers.set(containerId, containerGrid);
        }
      }
    });
  }

  /**
   * Get the main backpack container
   */
  getBackpackContainer() {
    // Check managed container map first (most authoritative)
    const managedContainer = this.containers.get('backpack-container');
    if (managedContainer) {
      return managedContainer;
    }
    
    // Fallback: check equipped backpack item directly
    if (this.equipment.backpack && this.equipment.backpack.isContainer && this.equipment.backpack.isContainer()) {
      return this.equipment.backpack.getContainerGrid();
    }
    
    // Return null if no backpack equipped (Phase 5C requirement)
    return null;
  }

  /**
   * Get available pocket containers from equipped clothing
   */
  getPocketContainers() {
    const pockets = [];
    
    // Check upper body equipment for pockets
    if (this.equipment.upper_body && this.equipment.upper_body.isContainer && this.equipment.upper_body.isContainer()) {
      const upperContainer = this.equipment.upper_body.getContainerGrid();
      if (upperContainer) pockets.push(upperContainer);
    }
    
    // Check lower body equipment for pockets
    if (this.equipment.lower_body && this.equipment.lower_body.isContainer && this.equipment.lower_body.isContainer()) {
      const lowerContainer = this.equipment.lower_body.getContainerGrid();
      if (lowerContainer) pockets.push(lowerContainer);
    }
    
    return pockets;
  }

  /**
   * Get all equipment items
   */
  getEquippedItems() {
    return Object.entries(this.equipment)
      .filter(([slot, item]) => item !== null)
      .reduce((acc, [slot, item]) => {
        acc[slot] = item;
        return acc;
      }, {});
  }

  /**
   * Check if an item is currently equipped
   */
  isItemEquipped(itemId) {
    return Object.values(this.equipment).some(item => item && item.id === itemId);
  }

  /**
   * Get equipment slot for an item
   */
  getEquipmentSlot(itemId) {
    for (const [slot, item] of Object.entries(this.equipment)) {
      if (item && item.id === itemId) {
        return slot;
      }
    }
    return null;
  }

  /**
   * Add a container to the system
   */
  addContainer(container) {
    this.containers.set(container.id, container);
    return container;
  }

  /**
   * Remove a container from the system
   */
  removeContainer(containerId) {
    const container = this.containers.get(containerId);
    if (container) {
      this.containers.delete(containerId);
      return container;
    }
    return null;
  }

  /**
   * Get container by ID
   */
  getContainer(containerId) {
    return this.containers.get(containerId);
  }

  /**
   * Get all containers
   */
  getAllContainers() {
    return Array.from(this.containers.values());
  }

  /**
   * Set ground items (called when entering a tile)
   */
  setGroundItems(items) {
    this.groundContainer.clear();
    
    if (items && items.length > 0) {
      for (const itemData of items) {
        const item = Item.fromJSON(itemData);
        this.groundManager.addItemSmart(item);
      }
      
      // Optimize layout for better organization
      this.groundManager.optimizeIfNeeded();
    }
  }

  /**
   * Get ground items (called when exiting a tile)
   */
  getGroundItems() {
    return this.groundContainer.getAllItems().map(item => item.toJSON());
  }

  /**
   * Drop item to ground with intelligent placement
   */
  dropItemToGround(item, preferredX = null, preferredY = null) {
    // Remove from current container if it has one
    if (item._container) {
      item._container.removeItem(item.id);
    }
    
    const result = this.groundManager.addItemSmart(item, preferredX, preferredY);
    if (result) {
      this.groundManager.optimizeIfNeeded();
    }
    
    return result;
  }

  /**
   * Organize ground items by category
   */
  organizeGroundItems() {
    return this.groundManager.organizeByCategory();
  }

  /**
   * Quick pickup items by category
   */
  quickPickupByCategory(category) {
    const backpack = this.getBackpackContainer();
    if (!backpack) {
      return { success: false, reason: 'No backpack available' };
    }

    const result = this.groundManager.collectItemsByCategory(category, backpack);
    
    // Try pockets if backpack is full
    if (result.failed > 0) {
      const pockets = this.getPocketContainers();
      for (const pocket of pockets) {
        const remainingItems = this.groundContainer.getAllItems()
          .filter(item => item.getCategory() === category);
        
        if (remainingItems.length === 0) break;
        
        const pocketResult = this.groundManager.collectItemsByCategory(category, pocket);
        result.collected += pocketResult.collected;
        result.failed = Math.max(0, result.failed - pocketResult.collected);
        result.items.push(...pocketResult.items);
      }
    }

    return {
      success: true,
      collected: result.collected,
      failed: result.failed,
      items: result.items
    };
  }

  /**
   * Quick pickup valuable items (weapons, ammo, medical)
   */
  quickPickupValuables() {
    const backpack = this.getBackpackContainer();
    if (!backpack) {
      return { success: false, reason: 'No backpack available' };
    }

    const result = this.groundManager.quickPickup({ type: 'valuable' }, backpack);
    
    return {
      success: true,
      collected: result.collected,
      failed: result.failed,
      items: result.items
    };
  }

  /**
   * Search ground items
   */
  searchGroundItems(query) {
    return this.groundManager.searchItems(query);
  }

  /**
   * Get ground item statistics
   */
  getGroundStatistics() {
    return this.groundManager.getStatistics();
  }

  /**
   * Get ground items organized by category for UI
   */
  getGroundItemsByCategory() {
    return this.groundManager.getItemsByCategory();
  }

  /**
   * Compact ground items for better space utilization
   */
  compactGroundItems() {
    return this.groundManager.optimizeLayout();
  }

  /**
   * Try to add item to any suitable container
   */
  addItem(item, preferredContainerId = null) {
    // Try preferred container first
    if (preferredContainerId) {
      const container = this.containers.get(preferredContainerId);
      if (container && container.addItem(item)) {
        return { success: true, container: container.id };
      }
    }

    // Try backpack
    const backpack = this.getBackpackContainer();
    if (backpack && backpack.addItem(item)) {
      return { success: true, container: backpack.id };
    }

    // Try pockets
    const pockets = this.getPocketContainers();
    for (const pocket of pockets) {
      if (pocket.addItem(item)) {
        return { success: true, container: pocket.id };
      }
    }

    // Try ground as last resort
    if (this.groundContainer.addItem(item)) {
      return { success: true, container: 'ground' };
    }

    return { success: false, reason: 'No space available' };
  }

  /**
   * Move item between containers
   */
  moveItem(itemId, fromContainerId, toContainerId, x = null, y = null) {
    const fromContainer = this.containers.get(fromContainerId);
    const toContainer = this.containers.get(toContainerId);
    
    if (!fromContainer || !toContainer) {
      return { success: false, reason: 'Container not found' };
    }

    const item = fromContainer.removeItem(itemId);
    if (!item) {
      return { success: false, reason: 'Item not found' };
    }

    let success = false;
    if (x !== null && y !== null) {
      success = toContainer.placeItemAt(item, x, y);
    } else {
      success = toContainer.addItem(item);
    }

    if (!success) {
      // Restore item to original container
      fromContainer.addItem(item);
      return { success: false, reason: 'Cannot place item' };
    }

    return { success: true };
  }

  /**
   * Find item by ID across all containers and equipment
   */
  findItem(itemId) {
    // Check containers
    for (const container of this.containers.values()) {
      const item = container.items.get(itemId);
      if (item) {
        return { item, container };
      }
    }

    // Check equipped items
    for (const [slot, item] of Object.entries(this.equipment)) {
      if (item && item.id === itemId) {
        return { item, equipment: slot };
      }
      
      // Check attachments on equipped items
      if (item && item.hasAttachments()) {
        for (const [attachSlot, attachment] of item.attachments.entries()) {
          if (attachment.id === itemId) {
            return { item: attachment, parent: item, attachmentSlot: attachSlot };
          }
        }
      }
    }

    return null;
  }

  /**
   * Get total item count across all containers
   */
  getTotalItemCount() {
    let total = 0;
    
    // Count container items
    for (const container of this.containers.values()) {
      total += container.getItemCount();
    }
    
    // Count equipped items
    for (const item of Object.values(this.equipment)) {
      if (item) {
        total += item.stackCount;
        
        // Count attachments
        if (item.hasAttachments()) {
          for (const attachment of item.attachments.values()) {
            total += attachment.stackCount;
          }
        }
      }
    }
    
    return total;
  }

  /**
   * Serialize entire inventory system to JSON
   */
  toJSON() {
    return {
      containers: Array.from(this.containers.entries()).map(([id, container]) => [id, container.toJSON()]),
      equipment: {
        backpack: this.equipment.backpack?.toJSON() || null,
        upper_body: this.equipment.upper_body?.toJSON() || null,
        lower_body: this.equipment.lower_body?.toJSON() || null,
        melee: this.equipment.melee?.toJSON() || null,
        handgun: this.equipment.handgun?.toJSON() || null,
        long_gun: this.equipment.long_gun?.toJSON() || null,
        flashlight: this.equipment.flashlight?.toJSON() || null
      }
    };
  }

  /**
   * Create InventoryManager from JSON data
   */
  static fromJSON(data) {
    const manager = new InventoryManager();
    
    // Clear default containers
    manager.containers.clear();
    
    // Restore containers
    if (data.containers) {
      for (const [id, containerData] of data.containers) {
        const container = Container.fromJSON(containerData);
        manager.containers.set(id, container);
        
        // Update ground container reference
        if (id === 'ground') {
          manager.groundContainer = container;
        }
      }
    }
    
    // Restore equipment
    if (data.equipment) {
      for (const [slot, itemData] of Object.entries(data.equipment)) {
        if (itemData) {
          const item = Item.fromJSON(itemData);
          manager.equipment[slot] = item;
        } else {
          manager.equipment[slot] = null;
        }
      }
    }

    // Update dynamic containers based on restored equipment
    manager.updateDynamicContainers();
    
    return manager;
  }
}
