/**
 * Inventory System - Phase 3
 * Equipment slots and dynamic container system
 */

export { Item } from './Item.js';
export { Container } from './Container.js';
export { InventoryManager } from './InventoryManager.js';
export { GroundManager } from './GroundManager.js';
export { ItemDefs, createItemFromDef } from './ItemDefs.js';
export * from './traits.js';

// Make classes available globally in development for tests and demos
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  import('./Item.js').then(({ Item }) => {
    window.Item = Item;
  });
  import('./Container.js').then(({ Container }) => {
    window.Container = Container;
  });
  import('./InventoryManager.js').then(({ InventoryManager }) => {
    window.InventoryManager = InventoryManager;
  });
}

// Import and expose tests for development
if (process.env.NODE_ENV === 'development') {
  // Import tests and immediately make them available
  import('./__tests__/Container.test.js')
    .then((module) => {
      if (module.runContainerTests && typeof window !== 'undefined') {
        window.runContainerTests = module.runContainerTests;
        // Force the function to be available globally
        Object.defineProperty(window, 'runContainerTests', {
          value: module.runContainerTests,
          writable: false,
          enumerable: true,
          configurable: false
        });
        console.log('[Inventory] Container tests loaded and runContainerTests() is now available');
      }
    })
    .catch(err => {
      console.warn('[Inventory] Failed to load container tests:', err);
    });
}

// Enhanced item templates with equipment and container properties
const ITEM_TEMPLATES = {
  // Weapons (equippable)
  'weapon.9mmPistol': {
    width: 2, height: 2, condition: 100,
    equippableSlot: 'handgun',
    attachmentSlots: [
      { name: 'muzzle', compatibleTypes: ['suppressor', 'compensator'] },
      { name: 'rail', compatibleTypes: ['flashlight', 'laser'] }
    ]
  },
  'weapon.rifle': {
    width: 1, height: 4, condition: 100,
    equippableSlot: 'rifle',
    attachmentSlots: [
      { name: 'muzzle', compatibleTypes: ['suppressor', 'compensator', 'flash-hider'] },
      { name: 'optic', compatibleTypes: ['scope', 'red-dot', 'iron-sights'] },
      { name: 'rail', compatibleTypes: ['flashlight', 'laser', 'grip'] },
      { name: 'stock', compatibleTypes: ['adjustable-stock', 'fixed-stock'] }
    ]
  },
  'weapon.knife': {
    width: 1, height: 2, condition: 100,
    equippableSlot: 'meleeWeapon'
  },
  'weapon.axe': {
    width: 2, height: 3, condition: 100,
    equippableSlot: 'meleeWeapon'
  },

  // Armor & Clothing (equippable with potential containers)
  'armor.helmet': {
    width: 2, height: 2, condition: 100,
    equippableSlot: 'head'
  },
  'armor.vest': {
    width: 2, height: 3, condition: 100,
    equippableSlot: 'body',
    containerGrid: { width: 4, height: 2 } // Vest pockets
  },
  'clothing.pants': {
    width: 2, height: 3, condition: 100,
    equippableSlot: 'legs',
    containerGrid: { width: 2, height: 2 } // Pants pockets
  },

  // Backpacks (equippable containers)
  // Container grids limited to max 6 width per project constraints
  'container.backpack': {
    width: 3, height: 4, condition: 100,
    equippableSlot: 'backpack',
    containerGrid: { width: 6, height: 14 } // Was 8x10 (80 slots), now 6x14 (84 slots)
  },
  'container.tactical-backpack': {
    width: 3, height: 4, condition: 100,
    equippableSlot: 'backpack',
    containerGrid: { width: 6, height: 20 } // Was 10x12 (120 slots), now 6x20 (120 slots)
  },

  // Tools (some equippable)
  'tool.smallflashlight': {
    width: 2, height: 1, condition: 100,
    equippableSlot: 'flashlight'
  },
  'tool.hammer': { width: 2, height: 1, condition: 100 },
  'tool.screwdriver': { width: 1, height: 1, condition: 100 },

  // Ammunition (stackable)
  'ammo.9mm': { width: 1, height: 1, stackable: true, stackMax: 50 },
  'ammo.762mm': { width: 1, height: 1, stackable: true, stackMax: 30 },
  'ammo.shotgun': { width: 1, height: 1, stackable: true, stackMax: 25 },

  // Medical (stackable)
  'medical.bandage': { width: 1, height: 1, stackable: true, stackMax: 20 },
  'medical.pills': { width: 1, height: 1, stackable: true, stackMax: 20 },
  'medical.syringe': { width: 1, height: 1, stackable: true, stackMax: 5 },

  // Food (stackable)
  'food.cannedsoup': {
    width: 1, height: 1, stackable: true,
    stackMax: 10
  },
  'food.water': { width: 2, height: 1, stackable: true, stackMax: 4 },

  // Attachments (for firearms)
  'attachment.suppressor': { width: 1, height: 2, condition: 100 },
  'attachment.scope': { width: 2, height: 1, condition: 100 },
  'attachment.red-dot': { width: 1, height: 1, condition: 100 },
  'attachment.flashlight': { width: 1, height: 1, condition: 100 },

  // Containers (non-equippable)
  'container.toolbox': { width: 2, height: 2, containerGrid: { width: 4, height: 4 }, imageId: 'toolbox.png' },
  'container.ammobox': { width: 2, height: 1, containerGrid: { width: 6, height: 3 }, imageId: 'ammobox.png' },
  'container.medkit': { width: 2, height: 2, containerGrid: { width: 3, height: 3 }, imageId: 'medkit.png' }
};

// Convenience function to create common item types
// Now delegates to createItemFromDef to ensure imageId consistency
export function createItem(type, subtype, options = {}) {
  // Handle case where subtype might be an object (extract actual subtype)
  const actualSubtype = typeof subtype === 'string' ? subtype : subtype?.subtype || 'generic';
  const defId = `${type}.${actualSubtype}`;

  // Try to use ItemDefs factory first for consistent imageId
  const item = createItemFromDef(defId, options);
  if (item) {
    return item;
  }

  // Fallback to legacy template-based creation if no def exists
  const templateKey = `${type}.${actualSubtype}`;
  const template = ITEM_TEMPLATES[templateKey] || {};

  const defaults = {
    id: `${type}-${actualSubtype}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    subtype: actualSubtype,
    name: `${actualSubtype.charAt(0).toUpperCase() + actualSubtype.slice(1)} ${type}`,
    ...template,
    ...options
  };

  return new Item(defaults);
}

// Create specific item types with proper defaults
export function createWeapon(subtype, options = {}) {
  return createItem('weapon', subtype, options);
}

export function createArmor(subtype, options = {}) {
  return createItem('armor', subtype, options);
}

export function createClothing(subtype, options = {}) {
  return createItem('clothing', subtype, options);
}

export function createAmmo(subtype, count = 1, options = {}) {
  return createItem('ammo', subtype, { stackCount: count, ...options });
}

export function createMedical(subtype, count = 1, options = {}) {
  return createItem('medical', subtype, { stackCount: count, ...options });
}

export function createFood(subtype, count = 1, options = {}) {
  return createItem('food', subtype, { stackCount: count, ...options });
}

export function createTool(subtype, options = {}) {
  return createItem('tool', subtype, options);
}

export function createAttachment(subtype, options = {}) {
  return createItem('attachment', subtype, options);
}

// Convenience function to create containers
export function createContainer(type, options = {}) {
  const defaults = {
    id: `${type}-container-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    name: `${type} Container`,
    ...options
  };

  return new Container(defaults);
}