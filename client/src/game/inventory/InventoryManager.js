import { Container } from './Container.js';
import { Item } from './Item.js';
import { GroundManager } from './GroundManager.js';
import { ItemTrait, EquipmentSlot } from './traits.js'; // Import necessary enums

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

    console.debug('[InventoryManager] Equipped item:', item.name, 'to slot:', slot);

    return {
      success: true,
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
   * Check if a container can be opened
   * Phase 5H: Backpacks open only when on ground, not nested, not equipped
   */
  canOpenContainer(item) {
    // Check if item exists
    if (!item) return false;

    // Check if item is a container OR has pockets (clothing)
    const isContainer = item.isContainer && item.isContainer();
    // Use optional chaining and check for pockets safely
    const hasPockets = item.getPocketContainers && item.getPocketContainers().length > 0;

    // DEBUG: Diagnose failure
    if (item.equippableSlot === 'upper_body' || item.equippableSlot === 'lower_body') {
      const isOnGround = item._container?.id === 'ground';
      console.debug('[InventoryManager] canOpenContainer check for:', item.name, {
        isContainer,
        hasPockets,
        equippableSlot: item.equippableSlot,
        isOnGround,
        containerId: item._container?.id,
        isEquipped: item.isEquipped
      });
    }

    const hasAttachments = !!(item.attachmentSlots && item.attachmentSlots.length > 0);

    if (!isContainer && !hasPockets && !hasAttachments) {
      return false;
    }

    // Backpack-specific rules (Phase 5H)
    if (item.equippableSlot === 'backpack') {
      // Only allow opening when on ground, not nested, not equipped
      const isOnGround = item._container?.id === 'ground';
      const isNested = item._container?.type === 'equipped-backpack';
      const isEquipped = item.isEquipped;

      return isOnGround && !isNested && !isEquipped;
    }

    // Clothing rules (Phase 6): Allow opening on ground
    if (item.equippableSlot === 'upper_body' || item.equippableSlot === 'lower_body') {
      const isOnGround = item._container?.id === 'ground';
      return isOnGround && !item.isEquipped;
    }

    // Specialty containers with openableWhenNested trait can always be opened
    if (item.isOpenableWhenNested()) {
      return true;
    }

    // Weapon mod interface: Allow opening if it's a weapon with attachment slots
    if (item.attachmentSlots && item.attachmentSlots.length > 0) {
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
          let containerGrid = item.containerGrid;

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
      return this.equipment.backpack.containerGrid;
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

    // 4. Try dynamic lookup for weapon attachments
    // Pattern: [instanceId]-attachment-[slotId]
    if (containerId && containerId.includes('-attachment-')) {
      const parts = containerId.split('-attachment-');
      if (parts.length === 2) {
        const instanceId = parts[0];
        const slotId = parts[1];

        const found = this.findItem(instanceId);
        if (found && found.item) {
          const item = found.item;
          const attachmentContainer = item.getAttachmentContainerById?.(slotId);
          if (attachmentContainer) return attachmentContainer;
        }
      }
    }

    return null;
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
  moveItem(itemId, fromContainerId, toContainerId, x = null, y = null) {
    const fromContainer = this.containers.get(fromContainerId);
    // Use getContainer to support dynamic pocket resolution for target
    const toContainer = this.getContainer(toContainerId);

    if (!fromContainer || !toContainer) {
      console.warn('[InventoryManager] Container not found:', { fromContainerId, toContainerId });
      return { success: false, reason: 'Container not found' };
    }

    const itemToMove = fromContainer.items.get(itemId); // Peek at item before determining logic
    if (!itemToMove) {
      console.warn('[InventoryManager] Item not found in source container for peek:', itemId);
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

    const item = fromContainer.removeItem(itemId);
    if (!item) {
      console.warn('[InventoryManager] Item not found in source container:', itemId);
      return { success: false, reason: 'Item not found' };
    }

    // Ensure container items have their grids initialized
    if (item.isContainer() && !item.containerGrid) {
      item.initializeContainerGrid();
    }

    console.log('[InventoryManager] Moving item:', {
      itemId,
      itemName: item.name,
      from: fromContainerId,
      to: toContainerId,
      position: x !== null && y !== null ? `(${x}, ${y})` : 'auto'
    });

    let success = false;
    if (x !== null && y !== null) {
      success = toContainer.placeItemAt(item, x, y);
    } else {
      success = toContainer.addItem(item);
    }

    if (!success) {
      console.warn('[InventoryManager] Failed to place item, restoring to original container');
      // Restore item to original container at its original position
      fromContainer.placeItemAt(item, item.x, item.y);
      return { success: false, reason: 'Cannot place item' };
    }

    console.log('[InventoryManager] Move successful');
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
      if (item && (item.id === itemId || item.instanceId === itemId)) {
        return { item, equipment: slot };
      }

      // Check attachments on equipped items
      if (item && item.hasAttachments()) {
        for (const [attachSlot, attachment] of item.attachments.entries()) {
          if (attachment.id === itemId || attachment.instanceId === itemId) {
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