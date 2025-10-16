
import { Container } from './Container.js';
import { Item } from './Item.js';

/**
 * GroundManager handles intelligent ground item organization and optimization
 * Implements smart grouping, auto-sort, and efficient pickup operations
 */
export class GroundManager {
  constructor(groundContainer) {
    this.groundContainer = groundContainer;
    this.categoryAreas = new Map(); // category -> { x, y, width, height }
    this.itemsByCategory = new Map(); // category -> Items[]
    this.lastOptimizationTime = 0;
    this.optimizationInterval = 5000; // 5 seconds
  }

  /**
   * Add item to ground with intelligent placement
   */
  addItemSmart(item, preferredX = null, preferredY = null) {
    const category = item.getCategory();
    
    // Try to place near similar items
    const categoryArea = this.categoryAreas.get(category);
    if (categoryArea) {
      // Try to place within the category area first
      const position = this.findPositionInArea(item, categoryArea);
      if (position) {
        return this.groundContainer.placeItemAt(item, position.x, position.y);
      }
      
      // Try to expand the category area
      const expandedPosition = this.expandCategoryArea(item, category);
      if (expandedPosition) {
        return this.groundContainer.placeItemAt(item, expandedPosition.x, expandedPosition.y);
      }
    }
    
    // Create new category area or use preferred position
    const result = this.groundContainer.addItem(item, preferredX, preferredY);
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
    
    // Sort categories by priority (weapons first, then tools, etc.)
    const categoryPriority = {
      'weapons': 1,
      'ammunition': 2,
      'armor': 3,
      'tools': 4,
      'consumables': 5,
      'materials': 6,
      'containers': 7,
      'misc': 8
    };

    const sortedCategories = Array.from(itemsByCategory.keys()).sort((a, b) => {
      return (categoryPriority[a] || 999) - (categoryPriority[b] || 999);
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
      const maxRowWidth = 8; // Maximum items per row

      for (const item of items) {
        // Check if item fits in current row
        if (rowX + item.getActualWidth() > currentX + maxRowWidth) {
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
      this.groundContainer.removeItem(item.id);
      
      if (targetContainer.addItem(item)) {
        collected.push(item);
      } else {
        // Return to ground if can't fit in target
        this.groundContainer.addItem(item);
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
        'weapons': 1, 'ammunition': 2, 'consumables': 3, 'tools': 4,
        'armor': 5, 'materials': 6, 'containers': 7, 'misc': 8
      };
      
      return (categoryPriority[a.getCategory()] || 999) - (categoryPriority[b.getCategory()] || 999);
    });

    // Attempt to pickup items
    for (const item of itemsToPickup) {
      this.groundContainer.removeItem(item.id);
      
      if (targetContainer.addItem(item)) {
        collected.push(item);
      } else {
        // Return to ground if can't fit
        this.groundContainer.addItem(item);
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
             item.subtype.toLowerCase().includes(searchTerm) ||
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
