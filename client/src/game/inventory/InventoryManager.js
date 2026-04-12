import { Container } from './Container.js';
import { Item } from './Item.js';
import { ItemDefs, createItemFromDef } from './ItemDefs.js';
import { GroundManager } from './GroundManager.js';
import { ItemTrait, EquipmentSlot, ItemCategory, EncumbranceModifiers } from './traits.js';
import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';
import { CraftingManager } from './CraftingManager.js';
import audioManager from '../utils/AudioManager.js';

/**
 * InventoryManager coordinates all containers in the game
 * Maintains the firewall between inventory and map systems
 */
export class InventoryManager extends SafeEventEmitter {
  constructor() {
    super();
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

    // Crafting System (Workspace containers)
    this.containers.set('crafting-tools', new Container({
      id: 'crafting-tools',
      type: 'crafting-workspace',
      name: 'Tool Slot',
      width: 1,
      height: 1,
      allowedCategories: [ItemCategory.TOOL],
      ignoreSize: true
    }));

    this.containers.set('crafting-ingredients', new Container({
      id: 'crafting-ingredients',
      type: 'crafting-workspace',
      name: 'Ingredient Grid',
      width: 5,
      height: 4
    }));

    // Cooking Workspace
    this.containers.set('cooking-tools', new Container({
      id: 'cooking-tools',
      type: 'crafting-workspace',
      name: 'Cooking Pot Slot',
      width: 1,
      height: 1,
      allowedCategories: [ItemCategory.TOOL, ItemCategory.COOKING_POT],
      ignoreSize: true
    }));

    this.containers.set('cooking-ingredients', new Container({
      id: 'cooking-ingredients',
      type: 'crafting-workspace',
      name: 'Cooking Ingredients',
      width: 5,
      height: 4
    }));

    this.craftingManager = new CraftingManager(this);

    // Coordinate Ownership Tracking (Phase 12 Persistence Fix)
    this.lastSyncedX = null;
    this.lastSyncedY = null;
  }

  /**
   * Synchronize ground container items with map tiles
   * @param {number} oldX - Previous player X
   * @param {number} oldY - Previous player Y
   * @param {number} newX - New player X
   * @param {number} newY - New player Y
   * @param {GameMap} gameMap - Current game map
   */
  syncWithMap(oldX, oldY, newX, newY, gameMap) {
    if (!gameMap) return false;

    // Phase 22 Guard: Prevent identity sync loops. 
    // If we've already synced the container for this specific tile, do NOTHING. 
    // This stops 'save->clear->reload' cycles that trigger infinite change events when player is stationary.
    if (this.lastSyncedX === newX && this.lastSyncedY === newY && this.groundContainer.getItemCount() > 0) {
        // Special case: if container is empty but map has items, we might need a refresh, 
        // but for moving/stationary guards this is exactly what we need.
        return false;
    }

    console.log(`[InventoryManager] 🔄 syncWithMap START: (${oldX}, ${oldY}) -> (${newX}, ${newY})`);
    let changed = false;

    // 1. Save items from ground container to the map square we are leaving
    const itemsToSave = this.groundContainer.getAllItems();
    
    // Phase 12 Fix: Robust Ownership Verification
    // Only save items back to the map if we are CERTAIN they belong to that tile.
    const isOwnerOfOldTile = this.lastSyncedX === oldX && this.lastSyncedY === oldY;
    const isOwnerOfNewTile = this.lastSyncedX === newX && this.lastSyncedY === newY;

    if (itemsToSave.length > 0) {
      if (isOwnerOfOldTile) {
        console.log(`[InventoryManager] ✅ VALID SAVE: Moving ${itemsToSave.length} items back to map tile (${oldX}, ${oldY})`);
        gameMap.setItemsOnTile(oldX, oldY, itemsToSave.map(item => item.toJSON()));
        this.groundContainer.clear();
        this.groundManager.updateCategoryAreas();
        changed = true;
      } else if (isOwnerOfNewTile) {
        console.warn(`[InventoryManager] ⚠️ ABORT SAVE: Items in container already belong to destination (${newX}, ${newY}). Skipping save to ORIGIN (${oldX}, ${oldY}) to prevent teleportation!`);
        // We DON'T clear the container here because we want to KEEP the items for the new tile
      } else {
        console.warn(`[InventoryManager] ⚠️ ABORT SAVE: Ground items ownership mismatch. Expected (${this.lastSyncedX}, ${this.lastSyncedY}), but sync requested save to (${oldX}, ${oldY}). Clearing container for safety.`);
        this.groundContainer.clear();
        this.groundManager.updateCategoryAreas();
        changed = true;
      }
    } else if (oldX !== null && oldY !== null && isOwnerOfOldTile) {
      console.log(`[InventoryManager]   -> Tile at (${oldX}, ${oldY}) is now empty. Clearing map tile...`);
      if (oldX !== newX || oldY !== newY) {
          gameMap.setItemsOnTile(oldX, oldY, []);
      }
    }

    // 2. Load items from the new map square into ground container
    // If we already loaded them (isOwnerOfNewTile), we might skip this step or re-verify.
    const itemsToLoad = gameMap.getItemsFromTile(newX, newY);
    if (itemsToLoad && itemsToLoad.length > 0) {
      // If the container is ALREADY holding these items (isOwnerOfNewTile was true),
      // we don't want to load them AGAIN (which would double them up).
      if (isOwnerOfNewTile && this.groundContainer.getItemCount() > 0) {
        console.log(`[InventoryManager]   -> Tile (${newX}, ${newY}) already synced. Skipping reload.`);
      } else {
        console.log(`[InventoryManager]   -> Loading ${itemsToLoad.length} items from tile (${newX}, ${newY})`);
        this.groundContainer.clear(); // Safety clear

        itemsToLoad.forEach((itemData, index) => {
          try {
            let item;
            if (itemData && itemData.type === 'item' && typeof itemData.isStackable === 'function') {
               item = itemData;
            } else {
               item = Item.fromJSON(itemData);
            }
            console.log(`[InventoryManager]     [${index}] Restored item: ${item.name} (${item.instanceId})`);

            const success = this.groundManager.addItemSmart(item);
            if (success) {
              console.log(`[InventoryManager]     [${index}] ✅ Successfully added to ground container`);
              changed = true;
            } else {
              console.error(`[InventoryManager]     [${index}] ❌ FAILED to add via addItemSmart!`);
              // Last resort: force add
              const result = this.groundContainer.addItem(item);
              if (result) {
                console.log(`[InventoryManager]     [${index}] ⚠️ Forced add to ground as fallback`);
                changed = true;
              } else {
                console.error(`[InventoryManager]     [${index}] 🚨 CRITICAL: Force add also failed!`);
              }
            }
          } catch (err) {
            console.error(`[InventoryManager]     [${index}] 🚨 Error restoring item from JSON:`, err);
          }
        });

        // Phase 12 Fix: Once items are loaded into the ground container, 
        // we MUST clear them from the map tile to prevent duplication.
        console.log(`[InventoryManager]   -> Items "Moved" from map to local container at (${newX}, ${newY}). Clearing map tile source.`);
        gameMap.setItemsOnTile(newX, newY, []);
        this.groundManager.updateCategoryAreas();
      }
    } else {
      console.log(`[InventoryManager]   -> No items found on map at (${newX}, ${newY})`);
    }

    // Update ownership tracking
    this.lastSyncedX = newX;
    this.lastSyncedY = newY;

    if (changed) {
      console.log(`[InventoryManager] 🔄 syncWithMap END: Ground container now has ${this.groundContainer.getItemCount()} items. Emitting change...`);
      this.emit('inventoryChanged');
    } else {
      console.log(`[InventoryManager] 🔄 syncWithMap END: No changes occurred.`);
    }

    return changed;
  }
  
  /**
   * Force refresh the ground container using items from a specific map tile
   * Useful for initial load or when items are added to map tiles without movement
   */
  refreshGroundItems(x, y, gameMap) {
    if (!gameMap) return;
    
    console.log(`[InventoryManager] 🔄 refreshGroundItems for tile (${x}, ${y})`);
    
    // 1. Clear current ground items
    this.groundContainer.clear();
    
    // 2. Pull from map
    const itemsToLoad = gameMap.getItemsFromTile(x, y);
    if (!itemsToLoad || itemsToLoad.length === 0) {
      console.log('[InventoryManager]   -> Tile is empty');
      this.groundManager.updateCategoryAreas();
      this.emit('inventoryChanged');
      return;
    }

    console.log(`[InventoryManager]   -> Found ${itemsToLoad.length} items on tile to load`);
    itemsToLoad.forEach(itemData => {
      try {
        const item = Item.fromJSON(itemData);
        this.groundManager.addItemSmart(item);
      } catch (err) {
        console.error('[InventoryManager] Error refreshing item:', err);
      }
    });

    // Phase 12 Fix: Once items are refreshed into the container, clear them from the map tile
    console.log(`[InventoryManager]   -> Successfully refreshed items from tile (${x}, ${y}). Clearing map tile...`);
    gameMap.setItemsOnTile(x, y, []);

    // Update ownership tracking
    this.lastSyncedX = x;
    this.lastSyncedY = y;

    this.groundManager.updateCategoryAreas();
    this.emit('inventoryChanged');
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
      slot = Array.isArray(item.equippableSlot) ? item.equippableSlot[0] : item.equippableSlot;
    }

    if (!slot || !this.equipment.hasOwnProperty(slot)) {
      return { success: false, reason: 'Invalid equipment slot' };
    }

    // Check if item can be equipped in this slot
    const allowedSlots = Array.isArray(item.equippableSlot) ? item.equippableSlot : [item.equippableSlot];
    if (!allowedSlots.includes(slot)) {
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

    // Remove item from its current container using instanceId
    let sourceContainer = null;
    if (item._container) {
      sourceContainer = item._container;
      sourceContainer.removeItem(item.instanceId); // Use instanceId instead of id
    }

    // Equip the item
    this.equipment[slot] = item;
    item.isEquipped = true;
    item._container = null;

    // Handle dynamic container addition
    // Cleanup any existing container entries for this item (e.g. from being on the ground)
    if (item.containerGrid) {
      if (this.containers.has(item.containerGrid.id)) {
        this.containers.delete(item.containerGrid.id);
      }
      // Also check for instance-based ID if different
      const instanceId = `${item.instanceId}-container`;
      if (this.containers.has(instanceId)) {
        this.containers.delete(instanceId);
      }
    }

    this.updateDynamicContainers();
    
    // Emit equip event for audio/UI feedback
    this.emit('itemEquipped', { item, slot });

    console.debug('[InventoryManager] Equipped item:', item.name, 'to slot:', slot);

    return {
      success: true,
      slot,
      unequippedItem,
      sourceContainer: sourceContainer?.id
    };
  }

  /**
   * Unequip an item from a slot
   */
  unequipItem(slot, targetContainerId = null, targetX = null, targetY = null) {
    if (!this.equipment.hasOwnProperty(slot) || !this.equipment[slot]) {
      return { success: false, reason: 'No item equipped in slot' };
    }

    const item = this.equipment[slot];
    this.equipment[slot] = null;
    item.isEquipped = false;

    // CRITICAL: Reset container ID for backpacks to prevent conflicts
    // When unequipped, the backpack's container should have a unique ID based on the item's instanceId
    if (slot === 'backpack' && item.containerGrid) {
      // Remove the slot-based container registration
      const slotContainerId = `${slot}-container`;
      if (this.containers.has(slotContainerId)) {
        this.containers.delete(slotContainerId);
        console.debug('[InventoryManager] Removed slot container registration:', slotContainerId);
      }

      const newContainerId = `${item.instanceId}-container`;
      console.debug('[InventoryManager] Resetting backpack container ID from', item.containerGrid.id, 'to', newContainerId);
      item.containerGrid.id = newContainerId;
      item.containerGrid.type = 'item-container'; // FIX: Prevent cleanup from removing this container

      // Re-register under new ID immediately so it's available if dropped
      this.containers.set(newContainerId, item.containerGrid);
    }

    // Reset pocket containers (for clothing) so they aren't cleaned up
    if (item.getPocketContainers) {
      const pockets = item.getPocketContainers();
      if (pockets && Array.isArray(pockets)) {
        pockets.forEach(pocket => {
          // Remove dynamic pocket registration
          if (this.containers.has(pocket.id)) {
            this.containers.delete(pocket.id);
          }

          // Reset to persistent ID logic
          pocket.type = 'item-container';

          // Re-register under persistent ID (if available) so it can be opened on ground
          if (pocket.id) {
            this.containers.set(pocket.id, pocket);
            // Ensure it's not removed by subsequent dynamic updates
            console.debug('[InventoryManager] Re-registered persistent pocket:', pocket.id);
          }
        });
      }
    }

    // Phase 5H: Try specific target container if provided (e.g., dropped on ground or specific bag)
    if (targetContainerId) {
      const targetContainer = this.getContainer(targetContainerId); // Use intelligent lookup

      // RECURSION CHECK for unequip target
      if (targetContainer && this.checkRecursion(item, targetContainer)) {
        console.warn('[InventoryManager] Cannot unequip item into itself:', item.name);
        // Fall through to default behavior (inventory/ground) instead of vanishing
      } else if (targetContainer) {
        let placed = false;
        if (targetX !== null && targetY !== null) {
          placed = targetContainer.placeItemAt(item, targetX, targetY);
        } else {
          placed = targetContainer.addItem(item);
        }

        if (placed) {
          this.updateDynamicContainers();
          return { success: true, item, placedIn: targetContainer.id };
        }
      }
    }

    // Try to add item back to inventory (Default behavior)
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

    // Emit unequip event for audio/UI feedback
    this.emit('itemUnequipped', { item, slot });

    return { success: true, item, slot, placedIn: addResult.container };
  }

  destroyItem(instanceId) {
    if (!instanceId) {
      console.warn('[InventoryManager] destroyItem REJECT: No instanceId provided');
      return false;
    }

    let destroyed = false;
    console.log(`[InventoryManager] 🗑️ destroyItem attempt for: ${instanceId}`);

    // 1. Search equipment slots
    for (const [slot, item] of Object.entries(this.equipment)) {
      if (item) {
        console.debug(`[InventoryManager]   Checking slot ${slot}: ${item.name} (${item.instanceId})`);
        if (item.instanceId === instanceId) {
          console.log(`[InventoryManager] ✅ Destroying ${item.name} from equipment slot: ${slot}`);
          this.equipment[slot] = null;
          item.isEquipped = false;
          destroyed = true;
          break;
        }
      }
    }

    if (!destroyed) {
      // 2. Search all registered containers
      for (const [id, container] of this.containers.entries()) {
        if (container.items.has(instanceId)) {
          const item = container.items.get(instanceId);
          console.log(`[InventoryManager] ✅ Destroying ${item?.name || instanceId} from container: ${id}`);
          container.removeItem(instanceId);
          destroyed = true;
          break;
        }
      }
    }

    if (destroyed) {
      this.updateDynamicContainers();
      this.emit('inventoryChanged');
      console.log(`[InventoryManager] 🗑️ Item ${instanceId} successfully destroyed and inventoryChanged emitted`);
    } else {
      console.warn(`[InventoryManager] ❌ destroyItem FAILED: Item ${instanceId} not found in any slot or container`);
      console.debug('[InventoryManager] Current equipment slots:', Object.keys(this.equipment));
    }

    return destroyed;
  }


  /**
   * Calculate encumbrance modifiers from equipped clothing
   */
  getEncumbranceModifiers() {
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
   * Check if a container can be opened
   * Phase 16 Fix: Harmonize Backpack and Clothing ground logic
   */
  canOpenContainer(item) {
    if (!item) return false;

    // Phase 19/20: Robust property checks (support plain objects)
    const isContainer = (item.isContainer && item.isContainer()) || (item.traits && item.traits.includes(ItemTrait.CONTAINER));
    const hasPockets = (item.getPocketContainers && item.getPocketContainers().length > 0) || !!item.pocketLayoutId;
    const hasAttachments = (item.attachmentSlots && item.attachmentSlots.length > 0);
    const equippableSlot = item.equippableSlot;

    // Phase 17/18/20: Restore Weapon Mod support
    // Guns must be openable even when empty to allow attaching mods
    if (hasAttachments) {
      return true;
    }

    // Phase 16 Fix: Harmonize Backpack and Clothing ground logic
    const isBackpack = equippableSlot === EquipmentSlot.BACKPACK;
    const isClothing = equippableSlot === EquipmentSlot.UPPER_BODY || equippableSlot === EquipmentSlot.LOWER_BODY || (item.categories && item.categories.includes(ItemCategory.CLOTHING));

    if (isBackpack || isClothing) {
      // Clothing and Backpacks can only be opened when on the ground
      const isOnGround = (this.groundContainer?.items.has(item.instanceId)) || (item._container?.id === 'ground');
      const isEquipped = item.isEquipped;
      
      // Prevent opening nested backpacks in your own inventory if not explicitly allowed
      const isNested = item._container?.type === 'equipped-backpack';

      return isOnGround && !isEquipped && !isNested;
    }

    // Specialty containers with openableWhenNested trait can always be opened
    const isOpenableWhenNested = (item.isOpenableWhenNested && item.isOpenableWhenNested()) || (item.traits && item.traits.includes(ItemTrait.OPENABLE_WHEN_NESTED));
    if (isOpenableWhenNested) {
      return true;
    }

    // Default catch-all for other containers (Toolboxes, etc.)
    return isContainer && !item.isEquipped;
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
        // Check if item has pocket grids (clothing with pockets)
        const pocketContainers = item.getPocketContainers?.();

        if (pocketContainers && pocketContainers.length > 0) {
          // Register each pocket container
          pocketContainers.forEach((pocketContainer, index) => {
            this.containers.set(pocketContainer.id, pocketContainer);
            console.debug('[InventoryManager] Registered pocket container:', pocketContainer.id, 'for', item.name);
          });
        } else {
          // Single container grid (backpack, tactical vest, etc.)
          const containerGrid = item.getContainerGrid?.();

          if (containerGrid) {
            // CRITICAL: Set the container ID to slot-based name for equipped items
            const containerId = `${slot}-container`;
            containerGrid.id = containerId;
            containerGrid.type = slot === 'backpack' ? 'equipped-backpack' : 'dynamic-pocket';
            // Ensure container has a name (fallback to default if item name is missing)
            containerGrid.name = item.name ? `${item.name} Storage` : 'Backpack Storage';
            this.containers.set(containerId, containerGrid);
            console.debug('[InventoryManager] Registered dynamic container:', containerId, 'for item:', item.instanceId);
          }
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
    if (this.equipment.upper_body && this.equipment.upper_body.hasTrait && this.equipment.upper_body.hasTrait('container')) {
      const pocketContainers = this.equipment.upper_body.getPocketContainers();
      if (pocketContainers) pockets.push(...pocketContainers);
    }

    // Check lower body equipment for pockets
    if (this.equipment.lower_body && this.equipment.lower_body.hasTrait && this.equipment.lower_body.hasTrait('container')) {
      const pocketContainers = this.equipment.lower_body.getPocketContainers();
      if (pocketContainers) pockets.push(...pocketContainers);
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
  /**
   * Get container by ID
   */
  getContainer(containerId) {
    // 1. Try standard lookup
    const container = this.containers.get(containerId);
    if (container) return container;

    // 2. Try dynamic lookup for pockets of non-equipped items
    // Pattern: [instanceId]-pocket-[index]
    if (containerId && containerId.includes('-pocket-')) {
      // Extract instance ID (everything before -pocket-)
      const parts = containerId.split('-pocket-');
      if (parts.length === 2) {
        const instanceId = parts[0];
        const pocketIndex = parseInt(parts[1], 10) - 1;

        // Find the item owning this pocket
        const found = this.findItem(instanceId);
        if (found && found.item) {
          const item = found.item;

          // Ensure pockets are initialized
          const pockets = item.getPocketContainers();
          if (pockets && pockets[pocketIndex]) {
            // Found it! This allows interaction with pockets of items on ground
            // or inside other containers
            return pockets[pocketIndex];
          }
        }
      }
    }

    // 3. Try dynamic lookup for item-level containers (backpacks, etc.)
    // Pattern: [instanceId]-container
    if (containerId && containerId.endsWith('-container')) {
      const instanceId = containerId.replace('-container', '');
      const found = this.findItem(instanceId);
      if (found && found.item) {
        const item = found.item;
        const mainGrid = item.getContainerGrid?.();
        if (mainGrid) return mainGrid;
      }
    }

    // 4. Try dynamic lookup for virtual containers (clothing/weapon UI panels)
    if (containerId && (containerId.startsWith('clothing:') || containerId.startsWith('weapon:') || containerId.startsWith('weapon-mod-'))) {
      let instanceId;
      let slotId = null;
      if (containerId.startsWith('weapon-mod-')) {
        // Format: weapon-mod-instanceId:slotId
        const parts = containerId.replace('weapon-mod-', '').split(':');
        instanceId = parts[0];
        slotId = parts[1];
      } else {
        instanceId = containerId.split(':')[1];
      }

      const found = this.findItem(instanceId);
      if (found && found.item) {
        const weaponOrClothing = found.item;
        // Return a "virtual" container object to satisfy UI checks
        return {
          id: containerId,
          isVirtual: true,
          item: weaponOrClothing,
          // NEW: Support removal for weapon attachments
          removeItem: (itemId) => {
            if (slotId && weaponOrClothing.detachItem) {
              return weaponOrClothing.detachItem(slotId);
            }
            return null;
          },
          items: new Map() // Empty map to satisfy iteration checks
        };
      }
    }

    return null;
  }

  /**
   * Weapon Modification Methods
   */
  /**
   * Fuel a campfire with a fuel item
   */
  fuelCampfire(fuelItem, targetCampfire) {
    if (!fuelItem || !targetCampfire) return { success: false, reason: 'Invalid items' };

    // 1. Determine fuel value
    let turnExtension = 0;
    if (fuelItem.defId === 'crafting.rag') turnExtension = 0.5;
    else if (fuelItem.defId === 'weapon.stick') turnExtension = 1.0;
    else if (fuelItem.defId === 'weapon.2x4') turnExtension = 1.0;
    else if (fuelItem.hasCategory?.(ItemCategory.CLOTHING)) turnExtension = 0.5;
    else if (fuelItem.hasCategory?.(ItemCategory.FUEL)) turnExtension = 0.5; // Fallback

    if (turnExtension <= 0) {
      return { success: false, reason: 'Item is not valid fuel' };
    }

    // 2. Consume fuel (1 unit)
    if (fuelItem.stackCount > 1) {
      fuelItem.stackCount -= 1;
      console.log(`[InventoryManager] Consumed 1 from stack of ${fuelItem.name}. Remaining: ${fuelItem.stackCount}`);
    } else {
      // Consume entire item
      console.log(`[InventoryManager] Consumed entire ${fuelItem.name}`);
      this.destroyItem(fuelItem.instanceId);
      fuelItem.stackCount = 0; // Ensure stack count is 0 for isDestroyed check
    }

    // 3. Update campfire
    targetCampfire.lifetimeTurns = (targetCampfire.lifetimeTurns || 0) + turnExtension;
    console.log(`[InventoryManager] Campfire refueled with ${fuelItem.name}. Extended by ${turnExtension} turns. New lifetime: ${targetCampfire.lifetimeTurns}`);

    const isDestroyed = fuelItem.stackCount <= 0;
    this.emit('inventoryChanged');
    return { success: true, turnsAdded: turnExtension, itemDestroyed: isDestroyed };
  }

  /**
   * Weapon Modification Methods
   */
  attachItemToWeapon(weapon, slotId, item, sourceContainerId = null) {
    if (!weapon || !item) return { success: false, reason: 'Invalid weapon or item' };

    const itemId = item.instanceId;

    console.debug('[InventoryManager] attachItemToWeapon:', {
      weapon: weapon.name,
      slotId,
      item: item.name,
      itemId,
      source: sourceContainerId || 'anywhere'
    });

    // 1. Remove item from specific source container if provided, otherwise general search
    const sourceContainer = sourceContainerId ? this.getContainer(sourceContainerId) : null;
    const sizeBefore = sourceContainer?.items?.size;

    const removed = sourceContainerId
      ? this.removeItemFromSource(itemId, sourceContainerId)
      : this.removeItem(itemId);

    if (!removed) {
      console.error('[InventoryManager] REJECT: Cannot remove item for attachment:', itemId, 'from:', sourceContainerId || 'anywhere');
      return { success: false, reason: 'Could not remove item from container' };
    }

    const sizeAfter = sourceContainer?.items?.size;
    if (sourceContainer && sizeBefore === sizeAfter && !sourceContainerId?.startsWith('weapon-mod-')) {
      console.error('[InventoryManager] CRITICAL: Map size did not decrease after removeItemFromSource!', {
        source: sourceContainerId,
        itemId,
        sizeBefore,
        sizeAfter
      });
    }

    // 2. EXTRA DEFENSIVE CHECK: Verify item is actually gone from its source
    // This is the primary defense against duplication.
    if (removed.container) {
      const stillInSource = removed.container.items.get(itemId);
      if (stillInSource) {
        console.error('[InventoryManager] CRITICAL: Item still found in container Map after removal!', itemId);
        return { success: false, reason: 'Internal error: Item removal verification failed' };
      }

      // Check grid as well
      const stillInGrid = removed.container.isAreaFree ? !removed.container.isAreaFree(removed.x, removed.y, 1, 1) : false;
      // We don't block on grid alone if Map is clear, but we log it
    }

    // 3. SPECIAL CASE: Campfire Refueling
    if (weapon.defId === 'placeable.campfire' && slotId === 'fuel') {
      console.debug('[InventoryManager] Specialized Campfire Fueling triggered!', {
        item: item.name,
        defId: item.defId,
        categories: item.categories
      });

      let turnExtension = 0;
      if (item.defId === 'crafting.rag') turnExtension = 0.5;
      else if (item.defId === 'weapon.stick') turnExtension = 1.0;
      else if (item.defId === 'weapon.2x4') turnExtension = 1.0;
      else if (item.hasCategory?.(ItemCategory.FUEL)) turnExtension = 0.5; // Fallback for other fuel items

      if (turnExtension > 0) {
        const totalExtension = turnExtension * (item.stackCount || 1);
        weapon.lifetimeTurns = (weapon.lifetimeTurns || 0) + totalExtension;
        console.log(`[InventoryManager] Campfire refueled with ${item.name} x${item.stackCount || 1}. Extended lifetime by ${totalExtension} turns. New lifetime: ${weapon.lifetimeTurns}`);

        // Item is already removed from source, so we just return success
        // without attaching it to any slot.
        return { success: true, refueled: true };
      } else {
        console.warn('[InventoryManager] Item rejected as fuel despite being in fuel slot:', item.name, item.defId);
      }
    }

    // 4. SPECIAL CASE: Direct Loading Weapons (Shotgun, .357 Drum, Hunting Rifle)
    const isDirectLoadWeapon = (weapon.defId === 'weapon.357Pistol' && item.defId === 'ammo.357') ||
      (weapon.defId === 'weapon.hunting_rifle' && item.defId === 'ammo.308') ||
      (weapon.defId === 'weapon.shotgun' && item.defId === 'ammo.shotgun_shells');

    if (isDirectLoadWeapon && slotId === 'ammo' && item.isAmmo()) {
      const existingAmmo = weapon.attachments[slotId];
      let maxCapacity = 5; // Default
      if (weapon.defId === 'weapon.357Pistol') maxCapacity = 6;
      else if (weapon.defId === 'weapon.shotgun') maxCapacity = 7;
      else if (weapon.defId === 'weapon.hunting_rifle') maxCapacity = 5;

      if (existingAmmo) {
        const spaceLeft = maxCapacity - existingAmmo.stackCount;
        if (spaceLeft <= 0) {
          // Full, return item to source
          if (removed.container) removed.container.addItem(item, removed.x, removed.y, item.rotation);
          else if (removed.equipment) { this.equipment[removed.equipment] = item; item.isEquipped = true; }
          return { success: false, reason: 'Full' };
        }

        const toAdd = Math.min(spaceLeft, item.stackCount);
        existingAmmo.stackCount += toAdd;
        item.stackCount -= toAdd;

        if (item.stackCount > 0) {
          // Return surplus to source
          if (removed.container) removed.container.addItem(item, removed.x, removed.y, item.rotation);
          else if (removed.equipment) { this.equipment[removed.equipment] = item; item.isEquipped = true; }
        }

        if (toAdd > 0) {
          audioManager.playSound('ReloadShot');
        }

        return { success: true, merged: true };
      } else {
        // Empty
        if (item.stackCount > maxCapacity) {
          const surplusCount = item.stackCount - maxCapacity;
          const surplus = item.splitStack(surplusCount);
          if (surplus) {
            if (removed.container) removed.container.addItem(surplus, removed.x, removed.y, item.rotation);
            else if (removed.equipment) { this.equipment[removed.equipment] = surplus; surplus.isEquipped = true; }
          }
        }
        
        // Load the full stack (or split portion) into the weapon
        const success = weapon.attachItem(slotId, item);
        if (success) {
          audioManager.playSound('ReloadShot');
          this.emit('inventoryChanged');
          return { success: true };
        } else {
          // Restore if somehow failed
          if (removed.container) removed.container.addItem(item, removed.x, removed.y, item.rotation);
          else if (removed.equipment) { this.equipment[removed.equipment] = item; item.isEquipped = true; }
          return { success: false, reason: 'Failed to attach ammo' };
        }
      }
    }

    // 5. ATTACHMENT SWAP / DISPLACEMENT
    const existingAttachment = weapon.getAttachment ? weapon.getAttachment(slotId) : weapon.attachments[slotId];
    if (existingAttachment) {
      console.log(`[InventoryManager] Displacement triggered: removing existing ${existingAttachment.name} from ${slotId}`);
      weapon.detachItem(slotId);
      
      // Try to put back into the EXACT vacated slot if possible (Magazine Exchange Logic)
      let displacedResult = { success: false };
      if (removed.container && removed.container.placeItemAt) {
          const placed = removed.container.placeItemAt(existingAttachment, removed.x, removed.y);
          if (placed) {
            displacedResult = { success: true, container: removed.container.id };
          }
      }
      
      // Try equipment slot if it came from there
      if (!displacedResult.success && removed.equipment) {
        if (!this.equipment[removed.equipment]) {
          this.equipment[removed.equipment] = existingAttachment;
          existingAttachment.isEquipped = true;
          displacedResult = { success: true, container: 'equipment-' + removed.equipment };
        }
      }

      // Fallback: Try to put back into anywhere (inventory, then pockets, then ground)
      if (!displacedResult.success) {
        displacedResult = this.addItem(existingAttachment);
      }
      
      console.log(`[InventoryManager] Displaced ${existingAttachment.name} to ${displacedResult.container || 'FAILED'}`);
    }

    // 6. STACK SPLITTING (e.g. taking 1 battery from a stack)
    let itemToAttach = item;
    if (item.stackCount > 1) {
      console.log(`[InventoryManager] Splitting stack for attachment: taking 1 from ${item.stackCount}`);
      const remainder = item.splitStack(item.stackCount - 1);
      // item now has 1 unit, remainder has the rest
      itemToAttach = item;
      
      // Put remainder back into original source if possible
      if (remainder) {
        if (removed.container) {
          removed.container.addItem(remainder, removed.x, removed.y);
        } else {
          this.addItem(remainder);
        }
      }
    }

    // 7. Attach to weapon
    const success = weapon.attachItem(slotId, itemToAttach);
    if (!success) {
      console.warn('[InventoryManager] Attachment failed, restoring item to original source');
      // Re-add to original container if fails
      if (removed.container) {
        removed.container.addItem(item, removed.x, removed.y, item.rotation);
      } else if (removed.equipment) {
        this.equipment[removed.equipment] = item;
        item.isEquipped = true;
      }
      return { success: false, reason: 'Incompatible attachment slot' };
    }

    // Play reload sound for all weapon attachments as requested
    audioManager.playSound('ReloadShot');

    return { success: true };
  }

  /**
   * Remove item from anywhere in the system (containers, equipment, attachments)
   * Returns metadata about where it was removed from
   */
  removeItem(itemId) {
    const found = this.findItem(itemId);
    if (!found) {
      console.warn('[InventoryManager] Cannot remove item: not found', itemId);
      return null;
    }

    const { item, container, equipment, parent, attachmentSlot } = found;

    if (container) {
      const x = item.x;
      const y = item.y;
      const removedItem = container.removeItem(itemId);
      if (!removedItem) {
        console.error('[InventoryManager] Failed to remove item from container despite being found:', itemId, container.id);
        return null; // Return null if removal failed to prevent duplication
      }
      return { item: removedItem, container, x, y };
    }

    if (equipment) {
      this.equipment[equipment] = null;
      item.isEquipped = false;
      return { item, equipment };
    }

    if (parent && attachmentSlot) {
      parent.detachItem(attachmentSlot);
      return { item, parent, attachmentSlot };
    }

    return { item };
  }

  /**
   * Remove item from a SPECIFIC source container/slot
   */
  removeItemFromSource(itemId, sourceId) {
    if (!sourceId) return this.removeItem(itemId);

    // 1. Try standard container
    const container = this.getContainer(sourceId);
    if (container && container.removeItem) {
      const removedItem = container.removeItem(itemId);
      if (removedItem) {
        return {
          item: removedItem,
          container,
          x: removedItem.x,
          y: removedItem.y
        };
      }
    }

    // 2. Try equipment slot
    const slotId = sourceId.startsWith('equipment-') ? sourceId.replace('equipment-', '') : sourceId;
    if (this.equipment.hasOwnProperty(slotId)) {
      const item = this.equipment[slotId];
      if (item && item.instanceId === itemId) {
        this.equipment[slotId] = null;
        item.isEquipped = false;
        return { item, equipment: slotId };
      }
    }

    if (sourceId && sourceId.startsWith('weapon-mod-')) {
      const parts = sourceId.replace('weapon-mod-', '').split(':');
      const weaponInstanceId = parts[0];
      const slotId = parts[1];

      const found = this.findItem(itemId);
      if (found && found.item) {
        // ACTUAL DETACHMENT: Remove it from its parent weapon
        const parentWeapon = found.parent || (this.findItem(weaponInstanceId)?.item);
        if (parentWeapon && parentWeapon.detachItem) {
          parentWeapon.detachItem(slotId);
          console.debug('[InventoryManager] Successfully detached item from weapon during removal:', itemId, 'from', slotId);
        }
        return { item: found.item, virtualSource: sourceId, weaponInstanceId, slotId };
      }

      // If we are attaching an item and it's not found anywhere,
      // but sourceId starts with weapon-mod-, it might be held in a state 
      // that general removal can't see (e.g. only in selectedItem).
      console.debug('[InventoryManager] Item not found during removal but source is weapon-mod, returning virtual success');
      return { item: null, virtualSource: sourceId, weaponInstanceId, slotId };
    }

    // 4. Fallback to general removal if specific source fails
    console.debug('[InventoryManager] removeItemFromSource failed for:', sourceId, 'falling back to general removal for:', itemId);
    return this.removeItem(itemId);
  }

  detachItemFromWeapon(weapon, slotId) {
    if (!weapon) return null;
    return weapon.detachItem(slotId);
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
        // Ensure container items have their grids initialized
        if (item.isContainer() && !item.containerGrid) {
          item.initializeContainerGrid();
        }
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
    // If already on ground and we're not forcing a new position, just return success
    if (item._container && item._container.id === 'ground' && preferredX === null && preferredY === null) {
      console.log(`[InventoryManager] Item ${item.name} already on ground, skipping redundant drop.`);
      return true;
    }

    // Remove from current container if it has one
    if (item._container) {
      item._container.removeItem(item.instanceId);
    }

    const result = this.groundManager.addItemSmart(item, preferredX, preferredY);
    if (result) {
      this.groundManager.optimizeIfNeeded();
      this.emit('inventoryChanged');
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
   * Add item to the system, automatically finding a suitable container
   * Priority: Preferred -> Stacking -> Backpack -> Pockets -> Ground
   */
  addItem(item, preferredContainerId = null, preferredX = null, preferredY = null, allowStacking = false) {
    if (!item) return { success: false, reason: 'No item provided' };

    // 1. Stack Merging Logic (Phase 17 Restoration)
    // Only attempt auto-merging if allowStacking is TRUE
    if (allowStacking && item.isStackable && item.isStackable()) {
      console.debug(`[InventoryManager] Attempting to find stack for: ${item.name} (${item.defId})`);
      
      // List of containers to search for stacking, in priority order
      const potentialContainers = [];
      
      // A. Preferred container
      if (preferredContainerId) {
        const pref = this.getContainer(preferredContainerId);
        if (pref) potentialContainers.push(pref);
      }
      
      // B. Equipped Backpack (high priority for stacking)
      const backpack = this.getBackpackContainer();
      if (backpack && backpack.id !== preferredContainerId) potentialContainers.push(backpack);
      
      // C. Pockets
      const pockets = this.getPocketContainers();
      pockets.forEach(p => {
        if (p.id !== preferredContainerId) potentialContainers.push(p);
      });
      
      // D. Ground (lowest priority for automatic stacking)
      if (this.groundContainer.id !== preferredContainerId) potentialContainers.push(this.groundContainer);

      // Search and merge
      for (const container of potentialContainers) {
        // Find existing items with same defId
        for (const existingItem of container.items.values()) {
          if (existingItem.defId === item.defId && existingItem.stackCount < existingItem.stackMax) {
            const spaceInStack = existingItem.stackMax - existingItem.stackCount;
            const amountToTake = Math.min(item.stackCount, spaceInStack);
            
            existingItem.stackCount += amountToTake;
            item.stackCount -= amountToTake;
            
            console.debug(`[InventoryManager] Merged ${amountToTake} into existing stack in ${container.id}. Item remaining: ${item.stackCount}`);
            
            if (item.stackCount <= 0) {
              this.emit('inventoryChanged');
              return { success: true, container: container.id, merged: true };
            }
          }
        }
      }
    }

    // 2. Regular Grid Placement Logic
    // Try preferred container first
    if (preferredContainerId) {
      const container = this.getContainer(preferredContainerId);
      if (container && container.addItem(item, preferredX, preferredY, allowStacking)) {
        this.emit('inventoryChanged');
        return { success: true, container: container.id };
      }
    }

    // Try backpack
    const backpack = this.getBackpackContainer();
    if (backpack && backpack.addItem(item, null, null, allowStacking)) {
      this.emit('inventoryChanged');
      return { success: true, container: backpack.id };
    }

    // Try pockets
    for (const pocket of this.getPocketContainers()) {
      if (pocket.addItem(item, null, null, allowStacking)) {
        this.emit('inventoryChanged');
        return { success: true, container: pocket.id };
      }
    }

    // Try ground as last resort
    if (this.groundContainer.addItem(item, preferredX, preferredY, allowStacking)) {
      this.emit('inventoryChanged');
      return { success: true, container: 'ground' };
    }

    return { success: false, reason: 'No space available' };
  }

  /**
   * Clear space in a container at (x, y) with (width, height)
   * Moves existing items to other available spaces in the SAME container
   */
  clearSpaceInContainer(container, x, y, width, height) {
    if (!container) return [];

    console.debug(`[InventoryManager] Clearing space in ${container.id} at (${x},${y}) size ${width}x${height}`);

    const itemsToMove = [];
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const item = container.getItemAt(x + dx, y + dy);
        if (item && !itemsToMove.includes(item)) {
          itemsToMove.push(item);
        }
      }
    }

    if (itemsToMove.length === 0) return [];

    // Remove all items that need to be moved and return them
    itemsToMove.forEach(item => {
      container.removeItem(item.instanceId);
    });

    return itemsToMove;
  }

  /**
   * Return all items from crafting containers to the inventory or ground
   */
  clearCraftingArea() {
    console.debug('[InventoryManager] Clearing crafting area...');
    const toolContainer = this.getContainer('crafting-tools');
    const ingredientContainer = this.getContainer('crafting-ingredients');

    if (!toolContainer || !ingredientContainer) return;

    const items = [
      ...toolContainer.getAllItems(),
      ...ingredientContainer.getAllItems()
    ];

    // Also clear cooking workspace if it exists
    const cookingToolContainer = this.getContainer('cooking-tools');
    const cookingIngredientContainer = this.getContainer('cooking-ingredients');
    if (cookingToolContainer) items.push(...cookingToolContainer.getAllItems());
    if (cookingIngredientContainer) items.push(...cookingIngredientContainer.getAllItems());

    if (items.length === 0) return;

    items.forEach(item => {
      // Remove from current container
      if (item._container) {
        item._container.removeItem(item.instanceId);
      }

      // Add back to inventory/ground
      const result = this.addItem(item);
      console.log(`[InventoryManager] Returned crafting item ${item.name} to ${result.container || 'FAILED'}`);
    });
  }

  /**
   * RECURSIVE CHECK: Check if an item is an ancestor of the target container
   * Returns true if placing item into targetContainer would cause recursion/self-nesting
   */
  checkRecursion(item, targetContainer) {
    if (!item || !targetContainer) return false;

    const itemId = String(item.instanceId);
    const targetId = String(targetContainer.id);

    // DEBUG: Trace recursion check
    console.debug('[InventoryManager] checking recursion (v2):', {
      itemInstanceId: itemId,
      targetContainerId: targetId
    });

    // 1. Broad inclusion check
    if (targetId.includes(itemId)) {
      console.warn('[InventoryManager] Recursion detected (includes):', itemId, 'in', targetId);
      return true;
    }

    // 2. Specific Pocket check
    if (targetId.includes('-pocket-')) {
      const parts = targetId.split('-pocket-');
      if (parts[0] === itemId) {
        console.warn('[InventoryManager] Recursion detected (pocket match):', itemId, targetId);
        return true;
      }
    }

    // 3. Container check
    // if (targetId === `${itemId}-container`) {
    //   console.warn('[InventoryManager] Recursion detected (container match)');
    //   return true;
    // }

    // 3. Owner ID Check (Robust Structural Check)
    // If the container explicitly says "I belong to Item X", and we are moving Item X, block it.
    if (targetContainer.ownerId && String(targetContainer.ownerId) === itemId) {
      console.warn('[InventoryManager] Recursion detected (ownerId match):', itemId, 'owns', targetContainer.id);
      return true;
    }

    return false;
  }

  /**
   * Move item between containers
   */
  moveItem(itemId, fromContainerId, toContainerId, x = null, y = null, rotation = null) {
    // Support dynamic resolving for source containers (like pockets or equipment slots)
    const fromContainer = this.getContainer(fromContainerId);
    const toContainer = this.getContainer(toContainerId);

    // Virtual source handling
    const isEquipmentSource = fromContainerId.startsWith('equipment-');
    const isVirtualSource = fromContainerId.startsWith('weapon-mod-');

    if ((!fromContainer && !isVirtualSource && !isEquipmentSource) || !toContainer) {
      return { success: false, reason: 'Container not found' };
    }

    // Get the item using generic find or specific map/poxel lookup
    let itemToMove;
    if (isEquipmentSource) {
        const slotId = fromContainerId.replace('equipment-', '');
        itemToMove = this.equipment[slotId];
    } else if (isVirtualSource) {
      const found = this.findItem(itemId);
      itemToMove = found?.item;
    } else {
      itemToMove = fromContainer.items.get(itemId);
    }

    if (!itemToMove) {
      console.warn('[InventoryManager] Item not found in source for move:', itemId, 'from:', fromContainerId);
      return { success: false, reason: 'Item not found' };
    }

    // CRITICAL: Prevent self-nesting (placing item into itself or its own pockets)
    // 1. Check if target container IS the item's internal container (e.g. backpack)
    if (itemToMove.containerGrid && itemToMove.containerGrid.id === toContainer.id) {
      console.warn('[InventoryManager] Cannot place item into its own container:', itemToMove.name);
      return { success: false, reason: 'Cannot place item into itself' };
    }

    // 2. Check if target container is one of the item's pockets (using robust string check)
    // Pockets are named "[instanceId]-pocket-[index]"
    // Main container might be named "[instanceId]-container"
    const isSelfRefPocket = toContainer.id.startsWith(`${itemToMove.instanceId}-pocket-`);
    const isSelfRefContainer = toContainer.id === `${itemToMove.instanceId}-container`;

    console.warn('[InventoryManager] DEBUG RECURSION:', {
      itemName: itemToMove.name,
      itemId: itemToMove.instanceId,
      targetId: toContainer.id,
      targetOwnerId: toContainer.ownerId,
      isOwnerMatch: toContainer.ownerId && String(toContainer.ownerId) === String(itemToMove.instanceId),
      isStringMatch: isSelfRefPocket || isSelfRefContainer
    });

    if (isSelfRefPocket || isSelfRefContainer) {
      console.warn('[InventoryManager] Cannot place item into itself (ID match):', itemToMove.name);
      return { success: false, reason: 'Cannot place item into itself' };
    }

    // 3. RECURSIVE CHECK: Ensure target container is not a descendant of the item
    // This catches deeply nested cases and ensures robust prevention
    if (this.checkRecursion(itemToMove, toContainer)) {
      console.warn('[InventoryManager] Recursion detected: Cannot place item into its own descendant:', itemToMove.name);
      return { success: false, reason: 'Cannot place item into itself' };
    }

    // Perform removal from source (handles containers, equipment, and virtual attachments)
    const removedResult = this.removeItemFromSource(itemId, fromContainerId);
    const item = removedResult?.item;

    if (!item) {
      console.warn('[InventoryManager] Failed to remove item from source container:', itemId, 'from:', fromContainerId);
      return { success: false, reason: 'Item not found' };
    }

    // Ensure container items have their grids initialized
    if (item.isContainer() && !item.containerGrid) {
      item.initializeContainerGrid();
    }

    // Apply rotation if provided
    if (rotation !== null) {
      item.rotation = rotation;
    }

    console.log('[InventoryManager] Moving item:', {
      itemId,
      itemName: item.name,
      from: fromContainerId,
      to: toContainerId,
      position: x !== null && y !== null ? `(${x}, ${y})` : 'auto',
      rotation: item.rotation
    });

    let success = false;
    if (x !== null && y !== null) {
      success = toContainer.placeItemAt(item, x, y);
      
      // Phase Stacking/Combining Collision Check:
      // If placement failed due to collision, we scan the footprint to find if we're dropping on a valid target.
      if (!success) {
        const width = item.getActualWidth();
        const height = item.getActualHeight();
        const blockingItemIds = new Set();

        for (let dy = 0; dy < height; dy++) {
          for (let dx = 0; dx < width; dx++) {
            const gridX = x + dx;
            const gridY = y + dy;
            const cellId = toContainer.grid[gridY]?.[gridX];
            if (cellId && cellId !== item.instanceId) {
              blockingItemIds.add(cellId);
            }
          }
        }

        // We only trigger special logic if there is exactly ONE unique item blocking the entire footprint
        if (blockingItemIds.size === 1) {
          const targetId = Array.from(blockingItemIds)[0];
          const occupant = toContainer.items.get(targetId);

          if (occupant) {
            // 1. ATTEMPT STACKING (Standard)
            const isStackable = typeof item.isStackable === 'function' ? item.isStackable() : item.stackable;
            if (isStackable && occupant.canStackWith(item)) {
              const spaceInStack = occupant.stackMax - occupant.stackCount;
              const amountToTake = Math.min(item.stackCount, spaceInStack);
              
              if (amountToTake > 0) {
                occupant.stackCount += amountToTake;
                item.stackCount -= amountToTake;
                console.debug(`[InventoryManager] moveItem: Merged ${amountToTake} into existing stack at (${x},${y})`);
                
                if (item.stackCount <= 0) {
                  this.emit('inventoryChanged');
                  return { success: true, container: toContainer.id, merged: true };
                }
              }
            }

            // 2. ATTEMPT WATER TRANSFER (Bidirectional)
            // occupant.combineWith handles the bidirectional logic correctly
            if (occupant.canCombineWith && occupant.canCombineWith(item)) {
              console.debug(`[InventoryManager] moveItem: Attempting water transferFootprint drop: ${item.name} <-> ${occupant.name}`);
              const transferred = occupant.combineWith(item);
              if (transferred) {
                this.emit('inventoryChanged');
                
                // AUTO-STACK: Check if they are now stackable (e.g. both became empty or full)
                if (occupant.canStackWith(item)) {
                  const stackableAmt = occupant.getStackableAmount ? occupant.getStackableAmount(item) : (occupant.stackMax - occupant.stackCount);
                  if (stackableAmt >= item.stackCount) {
                    occupant.stackCount += item.stackCount;
                    item.stackCount = 0;
                    this.emit('inventoryChanged');
                    return { success: true, container: toContainer.id, combined: true, merged: true };
                  }
                }
                
                console.debug('[InventoryManager] moveItem: Water transfer complete, but items did not merge into a stack.');
                // Fix: Return success so the UI clears the selection, but actually restore the item to its original slot
                fromContainer.placeItemAt(item, item.x, item.y);
                this.emit('inventoryChanged');
                return { success: true, container: fromContainerId, combined: true };
              }
            }
          }
        }
      }
    } else {
      // Logic for auto-placement without coordinates
      const addResult = this.addItem(item, toContainerId);
      success = addResult.success;
    }

    if (!success) {
      // Restore item to original container at its original position
      fromContainer.placeItemAt(item, item.x, item.y);
      return { success: false, reason: 'Cannot place item' };
    }

    return { success: true };
  }

  findItem(itemId) {
    if (!itemId) return null;

    // 1. Search all REGISTERED containers first (fastest)
    for (const container of this.containers.values()) {
      let item = container.items.get(itemId);
      if (!item) {
        for (const val of container.items.values()) {
          if (val.instanceId === itemId || val.id === itemId) {
            item = val;
            break;
          }
        }
      }
      if (item) return { item, container };
    }

    // 2. Search EQUIPPED items and their attachments
    for (const [slot, item] of Object.entries(this.equipment)) {
      if (item) {
        if (item.instanceId === itemId) return { item, equipment: slot };
        
        // Search attachments
        if (item.hasAttachments()) {
          for (const [attachSlot, attachment] of Object.entries(item.attachments)) {
            if (attachment.instanceId === itemId) {
              return { item: attachment, parent: item, attachmentSlot: attachSlot };
            }
          }
        }

        // RECURSIVE SEARCH: Search inside equipped containers (that might not be registered yet)
        const backpackGrid = item.getContainerGrid?.();
        if (backpackGrid) {
          const found = this._findItemRecursive(backpackGrid, itemId);
          if (found) return found;
        }
        
        const pockets = item.getPocketContainers?.();
        if (pockets) {
          for (const pocket of pockets) {
            const found = this._findItemRecursive(pocket, itemId);
            if (found) return found;
          }
        }
      }
    }

    // 3. BROAD SEARCH: Some containers might be nested but not explicitly registered in this.containers
    // We already searched this.containers, but let's do a recursive pass if needed.
    // Actually, searching ground and equipment should cover 99% of cases.
    const ground = this.getContainer('ground');
    if (ground) {
       const found = this._findItemRecursive(ground, itemId);
       if (found) return found;
    }

    return null;
  }

  /**
   * Check if total count of items with specific defId exists across all containers (including ground)
   */
  hasItemByDefId(defId, requiredCount = 1) {
    let foundCount = 0;

    // 1. Search equipment (mostly for items in containers)
    for (const item of Object.values(this.equipment)) {
      if (item) {
        if (item.defId === defId) foundCount += (item.stackCount || 1);
        
        const backpackGrid = item.getContainerGrid?.();
        if (backpackGrid) foundCount += this._countItemRecursive(backpackGrid, defId);
        
        const pockets = item.getPocketContainers?.();
        if (pockets) {
          pockets.forEach(pocket => {
            foundCount += this._countItemRecursive(pocket, defId);
          });
        }
      }
    }

    // 2. Search ground
    const ground = this.getContainer('ground');
    if (ground) {
      foundCount += this._countItemRecursive(ground, defId);
    }

    return foundCount >= requiredCount;
  }

  /**
   * Internal recursive search for an item by instanceId/id
   * Returns { item, container } or null
   */
  _findItemRecursive(container, itemId) {
    if (!container || !container.items) return null;

    // 1. Search direct items in this container
    for (const item of container.items.values()) {
      if (item.instanceId === itemId || item.id === itemId) {
        return { item, container };
      }
      
      // 2. Recurse into nested grids
      const grid = item.getContainerGrid?.();
      if (grid) {
        const found = this._findItemRecursive(grid, itemId);
        if (found) return found;
      }
      
      // 3. Recurse into pocket containers
      const pockets = item.getPocketContainers?.();
      if (pockets) {
        for (const pocket of pockets) {
          const found = this._findItemRecursive(pocket, itemId);
          if (found) return found;
        }
      }
    }

    return null;
  }

  /**
   * Internal recursive counter for items by defId
   */
  _countItemRecursive(container, defId) {
    let count = 0;
    if (!container || !container.items) return 0;

    for (const item of container.items.values()) {
      if (item.defId === defId) {
        count += (item.stackCount || 1);
      }
      
      const grid = item.getContainerGrid?.();
      if (grid) count += this._countItemRecursive(grid, defId);
      
      const pockets = item.getPocketContainers?.();
      if (pockets) {
        pockets.forEach(p => {
          count += this._countItemRecursive(p, defId);
        });
      }
    }
    return count;
  }

  /**
   * Consume a specific number of items by defId across all containers
   * Prioritizes ground, then backpack, then pockets
   */
  consumeItemByDefId(defId, countToConsume = 1) {
    let remaining = countToConsume;

    // 1. Try ground first (user preference usually)
    const ground = this.getContainer('ground');
    if (ground) {
        remaining = this._consumeItemRecursive(ground, defId, remaining);
    }

    if (remaining <= 0) return true;

    // 2. Try equipment/inventory
    for (const [slot, item] of Object.entries(this.equipment)) {
        if (!item) continue;
        
        // If the equipped item itself matches (rare for ammo, but possible)
        if (item.defId === defId) {
            const consume = Math.min(item.stackCount || 1, remaining);
            if (item.stackCount) item.stackCount -= consume;
            remaining -= consume;
            if (item.stackCount <= 0 || !item.stackCount) {
                this.equipment[slot] = null;
                item.isEquipped = false;
            }
        }
        
        if (remaining <= 0) break;

        const backpackGrid = item.getContainerGrid?.();
        if (backpackGrid) remaining = this._consumeItemRecursive(backpackGrid, defId, remaining);
        if (remaining <= 0) break;

        const pockets = item.getPocketContainers?.();
        if (pockets) {
            for (const pocket of pockets) {
                remaining = this._consumeItemRecursive(pocket, defId, remaining);
                if (remaining <= 0) break;
            }
        }
        if (remaining <= 0) break;
    }

    if (remaining > 0) {
        console.warn(`[InventoryManager] consumeItemByDefId: Could only find ${countToConsume - remaining}/${countToConsume} of ${defId}`);
    }

    this.emit('inventoryChanged');
    return remaining <= 0;
  }

  /**
   * Internal recursive consumer
   */
  _consumeItemRecursive(container, defId, remaining) {
    if (!container || !container.items || remaining <= 0) return remaining;

    const items = Array.from(container.items.values());
    for (const item of items) {
        if (item.defId === defId) {
            const stackMode = item.stackCount !== undefined && item.stackCount !== null;
            const available = stackMode ? item.stackCount : 1;
            const consume = Math.min(available, remaining);
            
            if (stackMode) {
                item.stackCount -= consume;
                if (item.stackCount <= 0) {
                    container.removeItem(item.instanceId);
                }
            } else {
                container.removeItem(item.instanceId);
            }
            
            remaining -= consume;
            if (remaining <= 0) return 0;
        }

        // Recurse into nested
        const grid = item.getContainerGrid?.();
        if (grid) remaining = this._consumeItemRecursive(grid, defId, remaining);
        if (remaining <= 0) return 0;

        const pockets = item.getPocketContainers?.();
        if (pockets) {
            for (const pocket of pockets) {
                remaining = this._consumeItemRecursive(pocket, defId, remaining);
                if (remaining <= 0) return 0;
            }
        }
    }
    return remaining;
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
        total += item.stackCount || 1;

        // Count attachments
        if (item.hasAttachments()) {
          for (const attachment of Object.values(item.attachments)) {
            total += attachment.stackCount || 1;
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
      },
      lastSyncedX: this.lastSyncedX,
      lastSyncedY: this.lastSyncedY
    };
  }

  /**
   * Create InventoryManager from JSON data
   */
  /**
   * Process turn-based effects on items in managed containers (e.g. ground pile when player is on tile).
   * This ensures campfires and other time-sensitive items expire even when "checked out" from the map.
   */
  processTurn() {
    console.debug('[InventoryManager] Processing turn-based effects for all items...');
    let itemsChanged = false;

    // Helper to process an item and handle expiration (removal)
    const processItemAndCheckExpiration = (item, container = null) => {
      const wasSpoiled = item.isSpoiled;

      // Call item's own turn processing (decrements shelfLife, recurses into attachments/nested)
      item.processTurn();

      // If it just spoiled, we need to refresh UI
      if (!wasSpoiled && item.isSpoiled) {
        itemsChanged = true;
      }

      // Handle Expiration (Vanishing)
      // Only items that ARE NOT spoilable should vanish when shelfLife reaches 0
      const isShelfLifeExpired = item.shelfLife !== null && item.shelfLife <= 0 && !item.isSpoilable();
      const isLifetimeTurnsExpired = item.lifetimeTurns !== null && item.lifetimeTurns <= 0;

      if (isShelfLifeExpired || isLifetimeTurnsExpired) {
        if (item.transformInto) {
          const newDefId = item.transformInto;
          const newItemData = createItemFromDef(newDefId);
          console.log(`[InventoryManager] Item ${item.name} (${item.instanceId}) transforming into ${newDefId} at (${item.x}, ${item.y}).`);
          
          if (container) {
            const x = item.x;
            const y = item.y;
            const rotation = item.rotation;
            container.removeItem(item.instanceId);
            
            const newItem = Item.fromJSON(newItemData);
            newItem.rotation = rotation;
            container.addItem(newItem, x, y);
          } else {
            // Transform in equipment slot
            for (const slot in this.equipment) {
              if (this.equipment[slot] === item) {
                const newItem = Item.fromJSON(newItemData);
                this.equipment[slot] = newItem;
                newItem.isEquipped = true;
                item.isEquipped = false;
                break;
              }
            }
          }
          itemsChanged = true;
          return true;
        }

        console.log(`[InventoryManager] Item ${item.name} (${item.instanceId}) expired and vanished (ShelfLife: ${item.shelfLife}, Lifetime: ${item.lifetimeTurns}).`);
        if (container) {
          container.removeItem(item.instanceId);
        } else {
          // It's in an equipment slot
          for (const slot in this.equipment) {
            if (this.equipment[slot] === item) {
              this.equipment[slot] = null;
              item.isEquipped = false;
              break;
            }
          }
        }
        itemsChanged = true;
        return true; // Item was removed
      }
      return false; // Item remains
    };

    // 1. Process only ROOT containers (ground, player inventory).
    // Skip any container that has an ownerId, because those items will call processTurn
    // recursively on their own contents.
    for (const container of this.containers.values()) {
      if (container.isVirtual) continue; // Skip virtual UI containers
      if (container.ownerId) {
        console.debug(`[InventoryManager] Skipping item-owned container ${container.id} to avoid double-processing`);
        continue;
      }

      const items = container.getAllItems();
      items.forEach(item => {
        if (processItemAndCheckExpiration(item, container)) {
          // Item removed, handled in helper
        }
      });
    }

    // 2. Process equipment (only root level items that aren't in containers)
    Object.values(this.equipment).forEach(item => {
      if (item) {
        processItemAndCheckExpiration(item);
      }
    });

    if (itemsChanged) {
      this.updateDynamicContainers(); // Refresh if equipment changed
      this.emit('inventoryChanged');
    }
  }

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
          // CRITICAL: Re-initialize groundManager with the RESTORED container
          // Otherwise it holds a stale reference to the empty container from constructor
          manager.groundManager = new GroundManager(container);
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
    
    // Restore ownership tracking (Phase 12 Persistence Fix)
    manager.lastSyncedX = data.lastSyncedX !== undefined ? data.lastSyncedX : null;
    manager.lastSyncedY = data.lastSyncedY !== undefined ? data.lastSyncedY : null;

    // Update dynamic containers based on restored equipment
    manager.updateDynamicContainers();

    return manager;
  }
}