
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
    autoSort = false,
    ownerId = null, // ID of the item that owns this container
    allowedCategories = null
  }) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.width = width;
    this.height = height;
    this.autoExpand = autoExpand;
    this.autoSort = autoSort;
    this.ownerId = ownerId;
    this.allowedCategories = Array.isArray(allowedCategories) ? allowedCategories : null;

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
    const width = typeof item.getActualWidth === 'function' ? item.getActualWidth() : (item.rotation === 90 || item.rotation === 270 ? item.height : item.width);
    const height = typeof item.getActualHeight === 'function' ? item.getActualHeight() : (item.rotation === 90 || item.rotation === 270 ? item.width : item.height);

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
          console.debug('[Container] Found available position:', { x, y }, 'for item size:', { width, height });
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
   * Validate if an item can be nested within this container
   * Blocked if the item is a container with items inside (unless specialty container)
   */
  validateNesting(item) {
    if (this.type === 'ground') return { valid: true };

    // specialty containers with OPENABLE_WHEN_NESTED trait can always be nested
    if (item.isOpenableWhenNested && item.isOpenableWhenNested()) {
      return { valid: true };
    }

    // Check if backpack has items - can't place in another container if it does
    const mainGrid = item.getContainerGrid?.();
    if (mainGrid) {
      const itemCount = mainGrid.getItemCount();
      if (itemCount > 0) {
        return { valid: false, reason: 'Empty container before storing' };
      }
    }

    // Check if clothing has items in pockets
    if (item.getPocketContainers) {
      const pockets = item.getPocketContainers();
      const hasItems = pockets.some(p => p.getItemCount() > 0);
      if (hasItems) {
        return { valid: false, reason: 'Empty pockets before storing' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate if an item can be placed at a specific position (for drag-and-drop)
   */
  validatePlacement(item, x, y, rotationOverride = null) {
    // Calculate dimensions, accounting for rotation
    // Use rotationOverride if provided (for previews/drags), otherwise fall back to item's current rotation
    const rotation = rotationOverride !== null ? rotationOverride : (item.rotation || 0);
    const isRotated = rotation === 90 || rotation === 270;

    let width, height;
    if (typeof item.getActualWidth === 'function' && rotationOverride === null) {
      // If no override, use the item's own calculation methods
      width = item.getActualWidth();
      height = item.getActualHeight();
    } else {
      // If rotated via override OR item lacks methods, calculate from base dimensions
      width = isRotated ? item.height : item.width;
      height = isRotated ? item.width : item.height;
    }

    // Consistently enforce nesting rules
    const nestingResult = this.validateNesting(item);
    if (!nestingResult.valid) {
      return nestingResult;
    }

    // Phase 7: Category-based restrictions
    if (this.allowedCategories && this.allowedCategories.length > 0) {
      const itemCategories = item.categories || [];
      const isAllowed = this.allowedCategories.some(cat => itemCategories.includes(cat));

      if (!isAllowed) {
        const allowedList = this.allowedCategories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' or ');
        return {
          valid: false,
          reason: `Only ${allowedList} allowed in this container`
        };
      }
    }

    // Check bounds
    if (!this.isValidPosition(x, y, width, height)) {
      return { valid: false, reason: 'Out of bounds' };
    }

    // Check for collisions (use instanceId for proper identification)
    const itemId = item.instanceId || item.id;

    // Phase Stacking: Check if we are dropping onto a stackable item
    const occupants = new Set();
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const cellItem = this.grid[y + dy][x + dx];
        if (cellItem && cellItem !== itemId) {
          occupants.add(cellItem);
        }
      }
    }

    // If exactly one unique occupant, check if it's stackable with the incoming item
    if (occupants.size === 1) {
      const targetInstanceId = Array.from(occupants)[0];
      const targetItem = this.items.get(targetInstanceId);
      if (targetItem && targetItem.canStackWith(item)) {
        return { valid: true, stackTarget: targetItem };
      }
      if (targetItem && targetItem.canCombineWith(item)) {
        return { valid: true, combineTarget: targetItem };
      }
    }

    // Normal collision check
    if (occupants.size > 0) {
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
    const width = typeof item.getActualWidth === 'function' ? item.getActualWidth() : (item.rotation === 90 || item.rotation === 270 ? item.height : item.width);
    const height = typeof item.getActualHeight === 'function' ? item.getActualHeight() : (item.rotation === 90 || item.rotation === 270 ? item.width : item.height);
    // ALWAYS use instanceId for grid tracking
    const itemId = item.instanceId;

    if (!itemId) {
      console.error('[Container] REJECT: No instanceId', item);
      return false;
    }

    // Phase 7: Category-based restrictions (Safety check)
    if (this.allowedCategories && this.allowedCategories.length > 0) {
      const itemCategories = item.categories || [];
      const isAllowed = this.allowedCategories.some(cat => itemCategories.includes(cat));
      if (!isAllowed) {
        console.warn(`[Container] REJECT: Category mismatch for ${item.name} in ${this.id}`);
        return false;
      }
    }

    console.debug('[Container] ===== PLACEMENT ATTEMPT =====');
    console.debug('[Container] Item:', item.name, 'instanceId:', itemId);
    console.debug('[Container] Target position:', `(${x}, ${y})`, 'Size:', `${width}x${height}`);
    console.debug('[Container] Current items in container:', this.items.size);

    // Consistently enforce nesting rules (even for programmatic placement)
    const nestingResult = this.validateNesting(item);
    if (!nestingResult.valid) {
      console.warn('[Container] REJECT: Nesting rule violation for:', item.name, '-', nestingResult.reason);
      return false;
    }

    // Prevent container from being placed inside itself
    if (item.isContainer && item.isContainer()) {
      const itemContainer = item.getContainerGrid();
      if (itemContainer && itemContainer.id === this.id) {
        console.warn('[Container] REJECT: Cannot place container inside itself:', item.name);
        return false;
      }
    }

    // Validate bounds first
    if (!this.isValidPosition(x, y, width, height)) {
      console.warn('[Container] REJECT: Invalid position for item:', item.name, 'at', x, y, 'size:', width, 'x', height);
      return false;
    }

    // Check what's currently occupying the area
    const occupants = [];
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const cellContent = this.grid[y + dy]?.[x + dx];
        if (cellContent && cellContent !== itemId) {
          occupants.push({ pos: `(${x + dx}, ${y + dy})`, itemId: cellContent });
        }
      }
    }

    if (occupants.length > 0) {
      console.warn('[Container] REJECT: Area not free for item:', item.name, 'at', x, y);
      console.warn('[Container] Occupied cells:', occupants);
      return false;
    }

    // Remove from old position if already placed
    // CRITICAL: Must do this BEFORE updating item.x/item.y coordinates
    if (this.items.has(itemId)) {
      console.debug('[Container] Item already in container, removing from old position:', `(${item.x}, ${item.y})`);
      this.removeItemFromGrid(item);
    }

    // Update item position AFTER clearing old cells
    item.x = x;
    item.y = y;
    item._container = this;

    // Mark grid cells as occupied using instanceId
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        this.grid[y + dy][x + dx] = itemId;
      }
    }

    // Only add to items Map after successful grid placement
    this.items.set(itemId, item);

    console.debug('[Container] ✅ SUCCESS: Placed item:', item.name, 'at', `(${x}, ${y})`, 'size:', `${width}x${height}`, 'instanceId:', itemId);
    console.debug('[Container] Total items now:', this.items.size);
    console.debug('[Container] Grid occupancy:', this.grid.slice(0, 10).map((row, y) =>
      `Row ${y}: [` + row.map((cell, x) => cell ? `${x}:${cell.substring(0, 8)}` : '.').join(' ') + ']'
    ).join('\n'));
    return true;
  }

  /**
   * Add item to container (auto-position)
   */
  addItem(item, preferredX = null, preferredY = null) {
    console.debug('[Container] addItem called:', item.name, 'preferred:', preferredX, preferredY);

    // Try stacking first if item is stackable
    const isStackable = typeof item.isStackable === 'function' ? item.isStackable() : item.stackable;
    if (isStackable) {
      const result = this.attemptStacking(item);
      if (result.success && !result.remainingItem) {
        console.debug('[Container] Item fully stacked:', item.name);
        return true; // Fully stacked
      }
      // If partial stacking occurred, continue with remaining item
      if (result.remainingItem) {
        item = result.remainingItem;
        console.debug('[Container] Partial stack, remaining:', item.stackCount);
      }
    }

    // Only try to place if we still have an item to place
    if (item && item.stackCount > 0) {
      // 1. Try with current rotation
      let position = this.findAvailablePosition(item, preferredX, preferredY);
      if (position) {
        return this.placeItemAt(item, position.x, position.y);
      }

      // 2. Try with alternative rotation if item is not square
      if (item.width !== item.height) {
        const originalRotation = item.rotation || 0;
        // Smart rotate: toggle orientation
        const currentWidth = item.getActualWidth();
        const currentHeight = item.getActualHeight();
        const isLandscape = currentWidth > currentHeight;

        const altRotation = isLandscape
          ? (originalRotation + 90) % 360
          : (originalRotation - 90 + 360) % 360;

        item.rotation = altRotation;
        position = this.findAvailablePosition(item, preferredX, preferredY);

        if (position) {
          console.debug('[Container] Auto-rotated item to fit:', altRotation);
          return this.placeItemAt(item, position.x, position.y);
        }

        // Restore original rotation if alt rotation also failed
        item.rotation = originalRotation;
      }

      console.warn('[Container] No available position for:', item.name, 'even with rotation');
    }

    return false;
  }

  /**
   * Attempt to stack item with existing items, supporting partial stacking
   */
  attemptStacking(item) {
    const isStackable = item.isStackable ? item.isStackable() : item.stackable;
    if (!isStackable) {
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
   * Remove item from container by its ID
   * Returns the removed item object, or null if not found
   */
  removeItem(itemId) {
    if (!itemId) {
      console.error('[Container] removeItem REJECT: Missing itemId');
      return null;
    }

    // Try to find the item in the Map first
    let item = this.items.get(itemId);

    if (!item) {
      // Emergency fallback: Search values if key lookup fails (handles ID mismatches)
      console.warn(`[Container] Item ${itemId} not found by key in Map. Searching values...`);
      for (const [key, val] of this.items.entries()) {
        if (val.instanceId === itemId || val.id === itemId) {
          console.warn(`[Container] Found item by searching values! Key was actually: ${key}`);
          item = val;
          itemId = key; // Use the actual key for deletion
          break;
        }
      }
    }

    if (!item) {
      console.warn('[Container] removeItem FAILED: Item not found in container:', itemId, 'Container:', this.id);
      return null;
    }

    console.debug('[Container] Removing item:', item.name, 'instanceId:', item.instanceId, 'at', `(${item.x}, ${item.y})`);

    // 1. Clear from grid FIRST while item still has its coordinates
    const gridCleared = this.removeItemFromGrid(item);
    if (!gridCleared) {
      console.error('[Container] removeItem CRITICAL: Failed to clear grid for item:', item.name, item.instanceId);
    }

    // 2. Remove from Map using the key that actually found it
    const deletedFromMap = this.items.delete(itemId);
    if (!deletedFromMap && item.instanceId !== itemId) {
      this.items.delete(item.instanceId);
    }

    // 3. Clear reference
    item._container = null;

    console.debug('[Container] ✅ REMOVAL SUCCESS:', item.name, 'Total remaining:', this.items.size);
    return item;
  }

  /**
   * Clear area occupied by item in the grid
   */
  removeItemFromGrid(item) {
    if (!item) return false;

    const width = typeof item.getActualWidth === 'function' ? item.getActualWidth() : (item.rotation === 90 || item.rotation === 270 ? item.height : item.width);
    const height = typeof item.getActualHeight === 'function' ? item.getActualHeight() : (item.rotation === 90 || item.rotation === 270 ? item.width : item.height);
    const itemId = item.instanceId;
    let clearedCount = 0;
    const expectedCount = width * height;

    console.debug('[Container] removeItemFromGrid:', item.name, `at (${item.x}, ${item.y})`, `size ${width}x${height}`);

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const gridX = item.x + dx;
        const gridY = item.y + dy;

        if (this.grid[gridY] && (this.grid[gridY][gridX] === itemId || this.grid[gridY][gridX] === item.id)) {
          this.grid[gridY][gridX] = null;
          clearedCount++;
        }
      }
    }

    if (clearedCount < expectedCount) {
      console.warn(`[Container] removeItemFromGrid PARTIAL: Cleared ${clearedCount}/${expectedCount} cells for ${item.name}.`);
      // If partial, do a full scan as fallback
      this.emergencyGridCleanup(itemId);
    }

    return clearedCount > 0;
  }

  /**
   * Scan entire grid to remove any trace of an itemId (emergency fallback)
   */
  emergencyGridCleanup(itemId) {
    console.debug('[Container] 🛠️ EMERGENCY GRID CLEANUP for:', itemId);
    let extraCleared = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === itemId) {
          this.grid[y][x] = null;
          extraCleared++;
        }
      }
    }
    if (extraCleared > 0) {
      console.debug(`[Container] 🛠️ Emergency cleanup removed ${extraCleared} additional cells.`);
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
      allowedCategories: this.allowedCategories,
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
