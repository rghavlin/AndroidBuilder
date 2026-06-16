import { GameMap } from '../client/src/game/map/GameMap.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../client/src/game/inventory/ItemDefs.js';
import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';
import engine from '../client/src/game/GameEngine.js';

// Setup basic environment
const gameMap = new GameMap(10, 10);
engine.gameMap = gameMap;
engine.inventoryManager = new InventoryManager();

console.log('--- Replicating Safe Bug ---');

// 1. Create a safe item
const safeData = createItemFromDef('furniture.safe');
const originalSafe = Item.fromJSON(safeData);
console.log('Original Safe instanceId:', originalSafe.instanceId);

// 2. Access its container grid to lazy-initialize it
const originalGrid = originalSafe.getContainerGrid();
console.log('Original Grid ID:', originalGrid.id);

// 3. Place safe on the map (converts to ECS Entity)
gameMap.setItemsOnTile(5, 5, [originalSafe]);

// 4. Retrieve from tile (simulate syncWithMap loading items)
const itemsOnTile = gameMap.getItemsOnTile(5, 5);
const tileItemData = itemsOnTile[0];
console.log('ECS Entity instanceId (tile item data):', tileItemData.instanceId);

// Convert back to Item instance
const loadedSafe = Item.fromJSON(tileItemData);
console.log('Loaded Safe instanceId:', loadedSafe.instanceId);

const loadedGrid = loadedSafe.getContainerGrid();
console.log('Loaded Grid ID:', loadedGrid ? loadedGrid.id : 'null');

console.log('Do IDs match?');
console.log('- Safe instanceId matches original:', loadedSafe.instanceId === originalSafe.instanceId);
console.log('- Grid ID matches Safe instanceId + "-container":', loadedGrid && loadedGrid.id === `${loadedSafe.instanceId}-container`);
