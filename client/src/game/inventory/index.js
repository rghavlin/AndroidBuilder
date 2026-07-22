/**
 * Inventory System - Phase 3
 * Equipment slots and dynamic container system
 *
 * Barrel re-exports only. The legacy half of this file (ITEM_TEMPLATES, the
 * createItem/createWeapon/... factories, createContainer, and the dev-only
 * window.* globals incl. the dynamic import of __tests__/Container.test.js) was
 * removed in the Wave 3 dead-code sweep (R35#6): every entry was unreferenced,
 * and the template table shadowed the real ItemDefs catalog with stale shapes.
 * The live container assertion suite (runContainerTests) still runs via
 * test/inventory/container.test.js, which imports it directly.
 */

export { Item } from './Item.js';
export { Container } from './Container.js';
export { InventoryManager } from './InventoryManager.js';
export { GroundManager } from './GroundManager.js';
export { ItemDefs, createItemFromDef } from './ItemDefs.js';
export * from './traits.js';
