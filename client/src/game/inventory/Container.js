
import { Item } from './Item.js';

/**
 * Container class for grid-based item storage
 * Manages items in a 2D grid with collision detection
 */
export class Container {
  constructor({
    id,
    type = 'generic',
    name = '',
    width = 6,
    height = 6,
    autoExpand = false,
    autoSort = false
  }) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.width = width;
    this.height = height;
    this.autoExpand = autoExpand;
    this.autoSort = autoSort;

    // Grid storage - sparse array of items
    this.items = new Map(); // itemId -> Item
    this.grid = []; // 2D array for collision detection
    this.initializeGrid();
  }

  /**
   * Initialize empty grid
   */
  initializeGrid() {
    this.grid = Array(this.height).fill(null).map(() => Array(this.width).fill(null));
  }

  /**
   * Check if a position is valid within the grid
   */
  isValidPosition(x, y, width = 1, height = 1) {
    return x >= 0 && y >= 0 && 
           x + width <= this.width && 
           y + height <= this.height;
  }

  /**
   * Check if a rectangular area is free
   */
  isAreaFree(x, y, width, height, excludeItemId = null) {
    if (!this.isValidPosition(x, y, width, height)) {
      return false;
    }

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const cellItem = this.grid[y + dy][x + dx];
        if (cellItem && cellItem !== excludeItemId) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Find first available position for an item
   */
  findAvailablePosition(item, preferredX = null, preferredY = null) {
    const width = item.getActualWidth();
    const height = item.getActualHeight();

    // If preferred position is specified and valid, try it first
    if (preferredX !== null && preferredY !== null) {
      if (this.isAreaFree(preferredX, preferredY, width, height)) {
        return { x: preferredX, y: preferredY };
      }
    }

    // Try to find space near preferred position first
    if (preferredX !== null && preferredY !== null) {
      const searchRadius = 3;
      for (let radius = 1; radius <= searchRadius; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const x = preferredX + dx;
            const y = preferredY + dy;
            if (this.isAreaFree(x, y, width, height)) {
              return { x, y };
            }
          }
        }
      }
    }

    // Try to find space in the current grid (scan top-left to bottom-right)
    for (let y = 0; y <= this.height - height; y++) {
      for (let x = 0; x <= this.width - width; x++) {
        if (this.isAreaFree(x, y, width, height)) {
          return { x, y };
        }
      }
    }

    // If auto-expand is enabled, expand the grid
    if (this.autoExpand) {
      return this.expandAndFindPosition(item);
    }

    return null;
  }

  /**
   * Validate if an item can be placed at a specific position (for drag-and-drop)
   */
  validatePlacement(item, x, y) {
    const width = item.getActualWidth();
    const height = item.getActualHeight();
    
    // Check bounds
    if (!this.isValidPosition(x, y, width, height)) {
      return { valid: false, reason: 'Out of bounds' };
    }
    
    // Check for collisions
    if (!this.isAreaFree(x, y, width, height, item.id)) {
      return { valid: false, reason: 'Position occupied' };
    }
    
    return { valid: true };
  }

  /**
   * Expand grid to accommodate item
   */
  expandAndFindPosition(item) {
    const width = item.getActualWidth();
    const height = item.getActualHeight();

    // Expand height if needed
    if (height > this.height) {
      this.expandGrid(this.width, height);
    }

    // Try to place at the bottom
    const y = this.height;
    this.expandGrid(this.width, this.height + height);
    
    return { x: 0, y };
  }

  /**
   * Expand the grid to new dimensions
   */
  expandGrid(newWidth, newHeight) {
    const oldHeight = this.height;
    this.width = Math.max(this.width, newWidth);
    this.height = Math.max(this.height, newHeight);

    // Add new rows
    while (this.grid.length < this.height) {
      this.grid.push(Array(this.width).fill(null));
    }

    // Expand existing rows
    for (let i = 0; i < oldHeight; i++) {
      while (this.grid[i].length < this.width) {
        this.grid[i].push(null);
      }
    }
  }

  /**
   * Place item in grid at specific position
   */
  placeItemAt(item, x, y) {
    const width = item.getActualWidth();
    const height = item.getActualHeight();
    // ALWAYS use instanceId for grid tracking
    const itemId = item.instanceId;

    if (!itemId) {
      console.error('[Container] Cannot place item without instanceId:', item);
      return false;
    }

    if (!this.isAreaFree(x, y, width, height, itemId)) {
      return false;
    }

    // Remove from old position if already placed
    if (this.items.has(itemId)) {
      this.removeItemFromGrid(item);
    }

    // Update item position
    item.x = x;
    item.y = y;
    item._container = this;

    // Mark grid cells as occupied using instanceId
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        this.grid[y + dy][x + dx] = itemId;
      }
    }

    this.items.set(itemId, item);
    return true;
  }

  /**
   * Add item to container (auto-position)
   */
  addItem(item, preferredX = null, preferredY = null) {
    // Try stacking first if item is stackable
    if (item.stackable) {
      const result = this.attemptStacking(item);
      if (result.success && !result.remainingItem) {
        return true; // Fully stacked
      }
      // If partial stacking occurred, continue with remaining item
      if (result.remainingItem) {
        item = result.remainingItem;
      }
    }

    // Only try to place if we still have an item to place
    if (item && item.stackCount > 0) {
      const position = this.findAvailablePosition(item, preferredX, preferredY);
      if (position) {
        return this.placeItemAt(item, position.x, position.y);
      }
    }

    return false;
  }

  /**
   * Attempt to stack item with existing items, supporting partial stacking
   */
  attemptStacking(item) {
    if (!item.stackable) {
      return { success: false, remainingItem: item };
    }

    const originalCount = item.stackCount;
    let remainingItem = item;
    
    // Find all compatible stacks and fill them
    for (const existingItem of this.items.values()) {
      if (remainingItem.stackCount === 0) break;
      
      if (existingItem.canStackWith(remainingItem)) {
        const stackableAmount = existingItem.getStackableAmount(remainingItem);
        
        if (stackableAmount > 0) {
          // Directly transfer the stackable amount
          existingItem.stackCount += stackableAmount;
          remainingItem.stackCount -= stackableAmount;
          
          // If we've stacked everything, return success
          if (remainingItem.stackCount === 0) {
            return { success: true, remainingItem: null };
          }
        }
      }
    }
    
    // Return partial success if some stacking occurred
    return { 
      success: remainingItem.stackCount < originalCount, 
      remainingItem: remainingItem.stackCount > 0 ? remainingItem : null 
    };
  }

  /**
   * Find existing item that can be stacked with
   */
  findStackableItem(item) {
    for (const existingItem of this.items.values()) {
      if (existingItem.canStackWith(item)) {
        return existingItem;
      }
    }
    return null;
  }

  /**
   * Remove item from container
   */
  removeItem(itemId) {
    // Try to find by the provided ID (should be instanceId)
    let item = this.items.get(itemId);
    
    if (!item) {
      console.warn('[Container] Item not found for removal:', itemId, 'Available items:', Array.from(this.items.keys()));
      return null;
    }

    this.removeItemFromGrid(item);
    this.items.delete(item.instanceId); // Use instanceId for deletion
    item._container = null;

    return item;
  }

  /**
   * Remove item from grid cells
   */
  removeItemFromGrid(item) {
    const width = item.getActualWidth();
    const height = item.getActualHeight();
    // ALWAYS use instanceId for grid tracking
    const itemId = item.instanceId;

    if (!itemId) {
      console.error('[Container] Cannot remove item without instanceId:', item);
      return;
    }

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (this.grid[item.y + dy] && this.grid[item.y + dy][item.x + dx] === itemId) {
          this.grid[item.y + dy][item.x + dx] = null;
        }
      }
    }
  }

  /**
   * Get item at specific grid position
   */
  getItemAt(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return null;
    }

    const itemId = this.grid[y][x];
    return itemId ? this.items.get(itemId) : null;
  }

  /**
   * Get all items in container
   */
  getAllItems() {
    return Array.from(this.items.values());
  }

  /**
   * Get total item count (considering stacks)
   */
  getItemCount() {
    return Array.from(this.items.values())
      .reduce((total, item) => total + item.stackCount, 0);
  }

  /**
   * Check if container is empty
   */
  isEmpty() {
    return this.items.size === 0;
  }

  /**
   * Clear all items from container
   */
  clear() {
    this.items.clear();
    this.initializeGrid();
  }

  /**
   * Auto-sort items in container by category and size
   */
  autoSort() {
    if (!this.autoSort) return false;
    
    const items = this.getAllItems();
    if (items.length === 0) return true;
    
    // Clear current positions
    this.clear();
    
    // Sort items by category, then by size (largest first)
    items.sort((a, b) => {
      const categoryA = a.getCategory();
      const categoryB = b.getCategory();
      
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }
      
      // Within same category, sort by size (area)
      const areaA = a.getActualWidth() * a.getActualHeight();
      const areaB = b.getActualWidth() * b.getActualHeight();
      return areaB - areaA;
    });
    
    // Re-add items in sorted order
    for (const item of items) {
      if (!this.addItem(item)) {
        console.warn(`Failed to re-add item ${item.id} during auto-sort`);
      }
    }
    
    return true;
  }

  /**
   * Compact items to minimize empty space
   */
  compact() {
    const items = this.getAllItems();
    if (items.length === 0) return true;
    
    // Store items and clear grid
    this.clear();
    
    // Re-add items starting from top-left
    for (const item of items) {
      if (!this.addItem(item)) {
        console.warn(`Failed to re-add item ${item.id} during compacting`);
      }
    }
    
    return true;
  }

  /**
   * Serialize Container to JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      width: this.width,
      height: this.height,
      autoExpand: this.autoExpand,
      autoSort: this.autoSort,
      items: Array.from(this.items.values()).map(item => item.toJSON())
    };
  }

  /**
   * Create Container from JSON data
   */
  static fromJSON(data) {
    const container = new Container(data);
    
    // Restore items
    if (data.items) {
      for (const itemData of data.items) {
        const item = Item.fromJSON(itemData);
        container.placeItemAt(item, item.x, item.y);
      }
    }

    return container;
  }
}
