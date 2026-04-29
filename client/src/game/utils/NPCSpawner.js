import { NPC } from '../entities/NPC.js';
import { EntityType } from '../entities/Entity.js';
import { Item } from '../inventory/Item.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { getNPCType } from '../entities/NPCTypes.js';

/**
 * NPCSpawner - Handles procedural placement of NPCs on maps
 */
export class NPCSpawner {
  /**
   * Spawn NPCs on a given game map
   * @param {GameMap} gameMap - The map instance to spawn on
   * @param {Object} options - { count: number, mapNumber: number }
   * @returns {number} - Number of NPCs successfully spawned
   */
  static spawnNPCs(gameMap, options = {}) {
    const count = options.count || 1;
    const mapNumber = options.mapNumber || 1;
    
    let spawned = 0;
    let attempts = 0;
    const maxAttempts = 150; // High count to ensure we find a valid room
    
    // 1. Identify all valid building floor tiles that are empty
    const validTiles = [];
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        const tile = gameMap.getTile(x, y);
        // Requirement: Indoor floor, walkable, no existing entities
        if (tile && tile.terrain === 'floor' && tile.isWalkable()) {
          if (tile.contents.length === 0) {
            validTiles.push({ x, y });
          }
        }
      }
    }
    
    if (validTiles.length === 0) {
      console.warn(`[NPCSpawner] Map ${mapNumber}: No valid indoor floor tiles found for NPC spawn`);
      return 0;
    }
    
    // 2. Spawn cycle
    while (spawned < count && attempts < maxAttempts) {
      attempts++;
      
      const index = Math.floor(Math.random() * validTiles.length);
      const { x, y } = validTiles[index];
      
      const tile = gameMap.getTile(x, y);
      
      // Double check occupancy in case multiple entities are spawned in one turn
      if (!tile.contents.some(e => e.blocksMovement)) {
        const typeId = 'survivor'; // Default to survivor class
        const typeDef = getNPCType(typeId);

        // Chance to be hostile from type definition
        const isHostile = Math.random() < typeDef.hostilityChance;
        const id = `npc-${mapNumber}-${spawned}-${Date.now()}`;
        const name = typeDef.name; // Tooltip requirement
        
        const npc = new NPC(id, name, x, y, isHostile, typeId);
        
        // Add random starting items
        const itemPool = typeDef.itemPool;
        const numItems = typeDef.minItems + Math.floor(Math.random() * (typeDef.maxItems - typeDef.minItems + 1));
        for (let i = 0; i < numItems; i++) {
          const defId = itemPool[Math.floor(Math.random() * itemPool.length)];
          const itemData = createItemFromDef(defId);
          if (itemData) {
            npc.inventory.addItem(new Item(itemData));
          }
        }

        // Final placement
        if (gameMap.addEntity(npc, x, y)) {
          spawned++;
          validTiles.splice(index, 1); // Remove tile from pool
          console.log(`[NPCSpawner] Spawned ${isHostile ? 'HOSTILE' : 'NEUTRAL'} NPC '${name}' at (${x}, ${y})`);
        }
      }
    }
    
    return spawned;
  }

  /**
   * Spawn a single NPC at a specific location
   */
  static spawnNPCAt(gameMap, x, y, options = {}) {
    const tile = gameMap.getTile(x, y);
    if (!tile) return null;

    const typeId = options.typeId || 'survivor';
    const typeDef = getNPCType(typeId);

    const id = options.id || `npc-fixed-${Date.now()}`;
    const name = options.name || typeDef.name;
    const isHostile = options.isHostile !== undefined ? options.isHostile : Math.random() < typeDef.hostilityChance;

    const npc = new NPC(id, name, x, y, isHostile, typeId);

    // Add random starting items
    const itemPool = typeDef.itemPool;
    const numItems = options.numItems !== undefined ? options.numItems : typeDef.minItems + Math.floor(Math.random() * (typeDef.maxItems - typeDef.minItems + 1));
    for (let i = 0; i < numItems; i++) {
      const defId = itemPool[Math.floor(Math.random() * itemPool.length)];
      const itemData = createItemFromDef(defId);
      if (itemData) {
        npc.inventory.addItem(new Item(itemData));
      }
    }

    if (gameMap.addEntity(npc, x, y)) {
      console.log(`[NPCSpawner] Manually spawned ${isHostile ? 'HOSTILE' : 'NEUTRAL'} NPC '${name}' at (${x}, ${y})`);
      return npc;
    }

    return null;
  }
}
