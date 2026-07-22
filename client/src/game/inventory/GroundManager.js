
import { Container } from './Container.js';
import { Item } from './Item.js';
import { CategoryPriority, ItemTrait } from './traits.js';

/**
 * GroundManager handles intelligent ground item organization and optimization
 * Implements smart grouping, auto-sort, and efficient pickup operations
 *
 * T5: engine access is INJECTED via a context provider (see constructor) —
 * this class no longer imports the engine singleton (it previously used a lazy
 * dynamic import whose error paths could run before the import resolved,
 * crashing on `engine.gameMap`).
 */
export class GroundManager {
  /**
   * @param {Container} groundContainer
   * @param {Function|null} contextProvider - () => ({
   *   gameMap, ridingItemId, draggingItemId, lastSyncedX, lastSyncedY, playerX, playerY
   * }) — all fields optional; missing context degrades gracefully.
   */
  constructor(groundContainer, contextProvider = null) {
    this.groundContainer = groundContainer;
    this._contextProvider = contextProvider;
    this.categoryAreas = new Map(); // category -> { x, y, width, height }
    this.itemsByCategory = new Map(); // category -> Items[]
    this.lastOptimizationTime = 0;
    this.optimizationInterval = 5000; // 5 seconds
  }

  /** Current engine context (empty object when no provider was injected). */
  _context() {
    return this._contextProvider ? (this._contextProvider() || {}) : {};
  }

  /**
   * Last-resort fallback when an item can't fit back into the ground grid:
   * drop it onto the map tile the ground view is synced to.
   */
  _injectItemToMapTile(item) {
    const ctx = this._context();
    const map = ctx.gameMap;
    if (!map) return;
    const x = ctx.lastSyncedX ?? ctx.playerX ?? 0;
    const y = ctx.lastSyncedY ?? ctx.playerY ?? 0;
    if (typeof map.addItemsToTile === 'function') {
      map.addItemsToTile(x, y, [item]);
    } else {
      const existing = map.getItemsOnTile(x, y) || [];
      map.setItemsOnTile(x, y, [...existing, item]);
    }
  }

  /**
   * Add item to ground with intelligent placement
   */
  addItemSmart(item, preferredX = null, preferredY = null, allowStacking = false) {
    const category = item.getCategory();

    // Try to place near similar items
    const categoryArea = this.categoryAreas.get(category);
    if (categoryArea) {
      // Try to place within the category area first
      const position = this.findPositionInArea(item, categoryArea);
      if (position) {
        return this.groundContainer.placeItemAt(item, position.x, position.y, allowStacking);
      }

      // Try to expand the category area
      const expandedPosition = this.expandCategoryArea(item, category);
      if (expandedPosition) {
        return this.groundContainer.placeItemAt(item, expandedPosition.x, expandedPosition.y, allowStacking);
      }
    }

    // Create new category area or use preferred position
    const result = this.groundContainer.addItem(item, preferredX, preferredY, allowStacking);
    if (result) {
      this.updateCategoryAreas();
    }

    return result;
  }

  /**
   * Group items by type/category with compact placement
   */
  organizeByCategory() {
    const allItems = this.groundContainer.getAllItems();
    if (allItems.length === 0) return true;

    // Group items by category
    const itemsByCategory = new Map();
    for (const item of allItems) {
      const category = item.getCategory();
      if (!itemsByCategory.has(category)) {
        itemsByCategory.set(category, []);
      }
      itemsByCategory.get(category).push(item);
    }

    // Clear ground and reorganize
    this.groundContainer.clear();

    let currentX = 0;
    let currentY = 0;
    const categorySpacing = 2; // Space between categories

    // Sort categories by priority (vehicles first, then environment, etc.)
    const sortedCategories = Array.from(itemsByCategory.keys()).sort((a, b) => {
      return (CategoryPriority[a] || 999) - (CategoryPriority[b] || 999);
    });

    for (const category of sortedCategories) {
      const items = itemsByCategory.get(category);
      const areaStart = { x: currentX, y: currentY };

      // Sort items within category by size (largest first)
      items.sort((a, b) => {
        const areaA = a.getActualWidth() * a.getActualHeight();
        const areaB = b.getActualWidth() * b.getActualHeight();
        return areaB - areaA;
      });

      let maxHeight = 0;
      let rowX = currentX;
      let rowY = currentY;
      const maxRowWidth = this.groundContainer.width; // Use actual container width instead of hardcoded value

      for (const item of items) {
        // Check if item fits in current row
        if (rowX + item.getActualWidth() > maxRowWidth) {
          // Move to next row
          currentY += maxHeight + 1;
          rowX = currentX;
          rowY = currentY;
          maxHeight = 0;
        }

        // Place item
        if (this.groundContainer.placeItemAt(item, rowX, rowY)) {
          rowX += item.getActualWidth();
          maxHeight = Math.max(maxHeight, item.getActualHeight());
        }
      }

      // Record category area
      const areaEnd = { x: currentX + maxRowWidth, y: currentY + maxHeight };
      this.categoryAreas.set(category, {
        x: areaStart.x,
        y: areaStart.y,
        width: areaEnd.x - areaStart.x,
        height: areaEnd.y - areaStart.y + 1
      });

      // Move to next category area
      currentY += maxHeight + categorySpacing;
    }

    return true;
  }

  /**
   * Sort ground items by priority, preserving exit items in place
   */
  sortGroundItems() {
    const allItems = this.groundContainer.getAllItems();
    if (allItems.length === 0) return true;

    // 1. Identify priority items (exit, help) and keep them in place
    const isPriorityItem = (item) => item.defId === 'placeable.exit' || item.defId === 'placeable.help';
    const exitItems = allItems.filter(isPriorityItem);
    const otherItems = allItems.filter(item => !isPriorityItem(item));

    // 2. Remove non-exit items from container
    for (const item of otherItems) {
      this.groundContainer.removeItem(item.instanceId);
    }

    // 3. Combine / stack like items
    const stackedItems = [];
    for (const item of otherItems) {
      const isStackable = item.hasTrait ? item.hasTrait(ItemTrait.STACKABLE) : item.stackable;
      if (isStackable) {
        let remaining = item.stackCount;
        for (const existing of stackedItems) {
          if (existing.defId === item.defId && existing.canStackWith(item)) {
            const space = (existing.stackMax || 100) - existing.stackCount;
            if (space > 0) {
              const toAdd = Math.min(remaining, space);
              existing.stackCount += toAdd;
              remaining -= toAdd;
              if (remaining <= 0) break;
            }
          }
        }
        if (remaining > 0) {
          item.stackCount = remaining;
          stackedItems.push(item);
        }
      } else {
        stackedItems.push(item);
      }
    }

    // 4. Sort the items by priority
    const { ridingItemId, draggingItemId } = this._context();
    stackedItems.sort((a, b) => {
      // Rule 1: Electric scooter ridden by player takes top priority after exit item
      const isRiddenA = ridingItemId === a.instanceId;
      const isRiddenB = ridingItemId === b.instanceId;
      if (isRiddenA && !isRiddenB) return -1;
      if (!isRiddenA && isRiddenB) return 1;

      // Rule 2: Vehicles/Scooters priority
      const isVehicleA = a.hasTrait?.(ItemTrait.VEHICLE) || a.hasTrait?.(ItemTrait.WAGON) || a.hasTrait?.(ItemTrait.SCOOTER);
      const isVehicleB = b.hasTrait?.(ItemTrait.VEHICLE) || b.hasTrait?.(ItemTrait.WAGON) || b.hasTrait?.(ItemTrait.SCOOTER);
      
      if (isVehicleA && !isVehicleB) return -1;
      if (!isVehicleA && isVehicleB) return 1;
      
      if (isVehicleA && isVehicleB) {
        // Whichever vehicle the player is pulling takes first slot
        const isPulledA = draggingItemId === a.instanceId;
        const isPulledB = draggingItemId === b.instanceId;
        if (isPulledA && !isPulledB) return -1;
        if (!isPulledA && isPulledB) return 1;

        // Golf carts (tow platforms) take priority among vehicles
        const isGolfCartA = !!a.canTow;
        const isGolfCartB = !!b.canTow;
        if (isGolfCartA && !isGolfCartB) return -1;
        if (!isGolfCartA && isGolfCartB) return 1;

        // Sort by size (largest first)
        const sizeA = a.getActualWidth() * a.getActualHeight();
        const sizeB = b.getActualWidth() * b.getActualHeight();
        if (sizeA !== sizeB) return sizeB - sizeA;
        
        // Stable fallback
        return a.name.localeCompare(b.name) || a.instanceId.localeCompare(b.instanceId);
      }

      // Rule 3: Other items by CategoryPriority
      const catA = a.getCategory();
      const catB = b.getCategory();
      const priorityA = CategoryPriority[catA] || 999;
      const priorityB = CategoryPriority[catB] || 999;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Sort by size (largest first)
      const sizeA = a.getActualWidth() * a.getActualHeight();
      const sizeB = b.getActualWidth() * b.getActualHeight();
      if (sizeA !== sizeB) return sizeB - sizeA;
      
      // Stable fallback
      return a.name.localeCompare(b.name) || a.instanceId.localeCompare(b.instanceId);
    });

    // 4b. Force hitched wagons directly beneath their golf cart, regardless of
    // where the general comparator above placed them.
    for (const cart of stackedItems) {
      if (!cart.hitchedItemInstanceId) continue;
      const wagonIdx = stackedItems.findIndex(it => it.instanceId === cart.hitchedItemInstanceId);
      const cartIdx = stackedItems.indexOf(cart);
      if (wagonIdx === -1 || wagonIdx === cartIdx + 1) continue;
      const [wagon] = stackedItems.splice(wagonIdx, 1);
      stackedItems.splice(stackedItems.indexOf(cart) + 1, 0, wagon);
    }

    // 5. Place items back into container grid (respecting remaining space)
    for (const item of stackedItems) {
      const width = item.getActualWidth();
      const height = item.getActualHeight();
      let placed = false;
      
      for (let y = 0; y <= this.groundContainer.height - height; y++) {
        for (let x = 0; x <= this.groundContainer.width - width; x++) {
          if (this.groundContainer.isAreaFree(x, y, width, height)) {
            if (this.groundContainer.placeItemAt(item, x, y)) {
              placed = true;
              break;
            }
          }
        }
        if (placed) break;
      }
      
      if (!placed) {
        // Fallback: force placement or add anyway
        this.groundContainer.addItem(item, null, null, false);
      }
    }

    this.updateCategoryAreas();
    return true;
  }

  /**
   * Find position within a specific category area
   */
  findPositionInArea(item, area) {
    const width = item.getActualWidth();
    const height = item.getActualHeight();

    for (let y = area.y; y < area.y + area.height - height + 1; y++) {
      for (let x = area.x; x < area.x + area.width - width + 1; x++) {
        if (this.groundContainer.isAreaFree(x, y, width, height)) {
          return { x, y };
        }
      }
    }
    return null;
  }

  /**
   * Expand category area to fit new item
   */
  expandCategoryArea(item, category) {
    const area = this.categoryAreas.get(category);
    if (!area) return null;

    const width = item.getActualWidth();
    const height = item.getActualHeight();

    // Try expanding to the right
    const rightX = area.x + area.width;
    for (let y = area.y; y < area.y + area.height - height + 1; y++) {
      if (this.groundContainer.isAreaFree(rightX, y, width, height)) {
        // Update area bounds
        area.width += width;
        return { x: rightX, y };
      }
    }

    // Try expanding downward
    const bottomY = area.y + area.height;
    for (let x = area.x; x < area.x + area.width - width + 1; x++) {
      if (this.groundContainer.isAreaFree(x, bottomY, width, height)) {
        // Update area bounds
        area.height += height;
        return { x, y: bottomY };
      }
    }

    return null;
  }

  /**
   * Update category area mappings based on current item positions
   */
  updateCategoryAreas() {
    this.categoryAreas.clear();
    const allItems = this.groundContainer.getAllItems();

    // Group items by category and find their bounds
    const categoryItems = new Map();
    for (const item of allItems) {
      const category = item.getCategory();
      if (!categoryItems.has(category)) {
        categoryItems.set(category, []);
      }
      categoryItems.get(category).push(item);
    }

    // Calculate bounds for each category
    for (const [category, items] of categoryItems.entries()) {
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      for (const item of items) {
        minX = Math.min(minX, item.x);
        minY = Math.min(minY, item.y);
        maxX = Math.max(maxX, item.x + item.getActualWidth());
        maxY = Math.max(maxY, item.y + item.getActualHeight());
      }

      if (items.length > 0) {
        this.categoryAreas.set(category, {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        });
      }
    }
  }

  /**
   * Collect all items of a specific category
   */
  collectItemsByCategory(category, targetContainer) {
    const items = this.groundContainer.getAllItems()
      .filter(item => item.getCategory() === category);

    const collected = [];
    const failed = [];

    for (const item of items) {
      this.groundContainer.removeItem(item.instanceId);

      if (targetContainer.addItem(item)) {
        collected.push(item);
      } else {
        // Return to ground if can't fit in target
        if (!this.groundContainer.addItem(item)) {
          console.error(`[GroundManager] Failed to return item ${item.name} to ground! Forcefully injecting to map tile.`);
          this._injectItemToMapTile(item);
        }
        failed.push(item);
      }
    }

    // Update category areas after collection
    this.updateCategoryAreas();

    return {
      collected: collected.length,
      failed: failed.length,
      items: collected
    };
  }

  /**
   * Get items by category for UI display
   */
  getItemsByCategory() {
    const result = new Map();
    const allItems = this.groundContainer.getAllItems();

    for (const item of allItems) {
      const category = item.getCategory();
      if (!result.has(category)) {
        result.set(category, []);
      }
      result.get(category).push(item);
    }

    return result;
  }

  /**
   * Optimize ground layout periodically
   */
  optimizeIfNeeded() {
    const now = Date.now();
    if (now - this.lastOptimizationTime > this.optimizationInterval) {
      this.optimizeLayout();
      this.lastOptimizationTime = now;
    }
  }

  /**
   * Optimize ground layout for better organization
   */
  optimizeLayout() {
    const itemCount = this.groundContainer.getItemCount();

    // Only optimize if we have enough items to benefit
    if (itemCount < 10) {
      return this.groundContainer.compact();
    }

    // For larger collections, use category organization
    return this.organizeByCategory();
  }

  /**
   * Quick pickup - collect items efficiently based on criteria
   */
  quickPickup(criteria, targetContainer) {
    const allItems = this.groundContainer.getAllItems();
    let collected = [];

    // Filter items based on criteria
    let itemsToPickup = [];

    switch (criteria.type) {
      case 'category':
        itemsToPickup = allItems.filter(item => item.getCategory() === criteria.category);
        break;
      case 'type':
        itemsToPickup = allItems.filter(item => item.type === criteria.itemType);
        break;
      case 'valuable':
        // Pick up weapons, ammo, medical items first
        const valuableCategories = ['weapons', 'ammunition', 'consumables', 'tools'];
        itemsToPickup = allItems.filter(item => valuableCategories.includes(item.getCategory()));
        break;
      case 'all':
        itemsToPickup = allItems;
        break;
      default:
        return { collected: 0, failed: 0, items: [] };
    }

    // Sort by priority (stackable items first for efficiency)
    itemsToPickup.sort((a, b) => {
      if (a.stackable && !b.stackable) return -1;
      if (!a.stackable && b.stackable) return 1;

      // Then by category priority
      const categoryPriority = {
        'vehicles': 1, 'farming': 2, 'furniture': 3, 'weapons': 4,
        'ammunition': 5, 'consumables': 6, 'tools': 7, 'armor': 8,
        'materials': 9, 'containers': 10, 'misc': 11
      };

      return (categoryPriority[a.getCategory()] || 999) - (categoryPriority[b.getCategory()] || 999);
    });

    // Attempt to pickup items
    for (const item of itemsToPickup) {
      this.groundContainer.removeItem(item.instanceId);

      if (targetContainer.addItem(item)) {
        collected.push(item);
      } else {
        // Return to ground if can't fit
        if (!this.groundContainer.addItem(item)) {
          console.error(`[GroundManager] Failed to return item ${item.name} to ground during quick pickup! Forcefully injecting to map tile.`);
          this._injectItemToMapTile(item);
        }
        break; // Stop trying once container is full
      }
    }

    // Update organization after pickup
    this.updateCategoryAreas();

    return {
      collected: collected.length,
      failed: itemsToPickup.length - collected.length,
      items: collected
    };
  }

  /**
   * Search for items matching criteria
   */
  searchItems(query) {
    const allItems = this.groundContainer.getAllItems();
    const searchTerm = query.toLowerCase();

    return allItems.filter(item => {
      return item.name.toLowerCase().includes(searchTerm) ||
        item.type.toLowerCase().includes(searchTerm) ||
        (item.subtype?.toLowerCase().includes(searchTerm) || false) ||
        item.getCategory().toLowerCase().includes(searchTerm);
    });
  }

  /**
   * Get ground statistics
   */
  getStatistics() {
    const allItems = this.groundContainer.getAllItems();
    const byCategory = this.getItemsByCategory();

    return {
      totalItems: allItems.length,
      totalStacks: allItems.reduce((sum, item) => sum + item.stackCount, 0),
      categories: Array.from(byCategory.keys()),
      categoryBreakdown: Array.from(byCategory.entries()).map(([category, items]) => ({
        category,
        items: items.length,
        stacks: items.reduce((sum, item) => sum + item.stackCount, 0)
      })),
      gridUtilization: {
        used: allItems.reduce((sum, item) => sum + (item.getActualWidth() * item.getActualHeight()), 0),
        total: this.groundContainer.width * this.groundContainer.height
      }
    };
  }
}
