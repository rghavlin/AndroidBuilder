import { NPC } from '../entities/NPC.js';
import { EntityType } from '../entities/Entity.js';
import { Item } from '../inventory/Item.js';
import { createItemFromDef, ItemDefs } from '../inventory/ItemDefs.js';
import { ItemCategory } from '../inventory/traits.js';
import { LootGenerator } from '../map/LootGenerator.js';
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
        
        // --- Structured Inventory Generation ---
        const { pools, minItems, maxItems } = typeDef;
        const targetCount = minItems + Math.floor(Math.random() * (maxItems - minItems + 1));
        const addedGuns = new Set();
        const itemsToAdd = [];

        // Helper to pick unique gun if possible
        const getUniqueId = (pool, category, addedSet, maxTries = 10) => {
          let pickedId = pool[Math.floor(Math.random() * pool.length)];
          if (category) {
            let tries = 0;
            while (addedSet.has(pickedId) && tries < maxTries) {
              pickedId = pool[Math.floor(Math.random() * pool.length)];
              tries++;
            }
            if (ItemDefs[pickedId]?.categories?.includes(category)) {
              addedSet.add(pickedId);
            }
          }
          return pickedId;
        };

        // 1. Ensure at least 1 Rare item
        itemsToAdd.push(getUniqueId(pools.rare, ItemCategory.GUN, addedGuns));

        // 2. Ensure at least 2 Weapons
        for (let i = 0; i < 2; i++) {
          itemsToAdd.push(getUniqueId(pools.weapons, ItemCategory.GUN, addedGuns));
        }

        // 3. Ensure at least 10% Food/Water
        const foodCount = Math.max(1, Math.ceil(targetCount * 0.1));
        for (let i = 0; i < foodCount; i++) {
          itemsToAdd.push(pools.foodWater[Math.floor(Math.random() * pools.foodWater.length)]);
        }

        // 4. Fill remaining slots with weighted selection
        while (itemsToAdd.length < targetCount) {
          const roll = Math.random();
          let selectedPool;

          if (roll < 0.75) {
            selectedPool = pools.general;
          } else if (roll < 0.90) {
            selectedPool = pools.foodWater;
          } else if (roll < 0.98) {
            selectedPool = pools.weapons;
          } else {
            selectedPool = pools.rare;
          }

          // Pick from pool, avoiding duplicate guns
          const defId = getUniqueId(selectedPool, ItemCategory.GUN, addedGuns);
          itemsToAdd.push(defId);
        }

        // Add items to NPC
        itemsToAdd.forEach(defId => {
          const itemData = createItemFromDef(defId);
          if (itemData) {
            const item = new Item(itemData);
            // Apply standardized spawn defaults (ammo, stacks, condition)
            LootGenerator.applySpawnDefaults(item, false);
            // Add with stacking enabled
            npc.inventory.addItem(item, null, null, true);
          }
        });

        // Final placement
        if (gameMap.addEntity(npc, x, y)) {
          spawned++;
          validTiles.splice(index, 1); // Remove tile from pool
          console.log(`[NPCSpawner] Spawned ${isHostile ? 'HOSTILE' : 'NEUTRAL'} NPC '${name}' at (${x}, ${y}) with ${itemsToAdd.length} items.`);
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

    // --- Structured Inventory Generation ---
    const { pools, minItems, maxItems } = typeDef;
    const targetCount = options.numItems !== undefined ? options.numItems : minItems + Math.floor(Math.random() * (maxItems - minItems + 1));
    const addedGuns = new Set();
    const itemsToAdd = [];

    // Helper to pick unique gun if possible
    const getUniqueId = (pool, category, addedSet, maxTries = 10) => {
      let pickedId = pool[Math.floor(Math.random() * pool.length)];
      if (category) {
        let tries = 0;
        while (addedSet.has(pickedId) && tries < maxTries) {
          pickedId = pool[Math.floor(Math.random() * pool.length)];
          tries++;
        }
        if (ItemDefs[pickedId]?.categories?.includes(category)) {
          addedSet.add(pickedId);
        }
      }
      return pickedId;
    };

    // 1. Ensure at least 1 Rare item
    itemsToAdd.push(getUniqueId(pools.rare, ItemCategory.GUN, addedGuns));

    // 2. Ensure at least 2 Weapons
    for (let i = 0; i < 2; i++) {
      itemsToAdd.push(getUniqueId(pools.weapons, ItemCategory.GUN, addedGuns));
    }

    // 3. Ensure at least 10% Food/Water
    const foodCount = Math.max(1, Math.ceil(targetCount * 0.1));
    for (let i = 0; i < foodCount; i++) {
      itemsToAdd.push(pools.foodWater[Math.floor(Math.random() * pools.foodWater.length)]);
    }

    // 4. Fill remaining slots with weighted selection
    while (itemsToAdd.length < targetCount) {
      const roll = Math.random();
      let selectedPool;

      if (roll < 0.75) {
        selectedPool = pools.general;
      } else if (roll < 0.90) {
        selectedPool = pools.foodWater;
      } else if (roll < 0.98) {
        selectedPool = pools.weapons;
      } else {
        selectedPool = pools.rare;
      }

      // Pick from pool, avoiding duplicate guns
      const defId = getUniqueId(selectedPool, ItemCategory.GUN, addedGuns);
      itemsToAdd.push(defId);
    }

    itemsToAdd.forEach(defId => {
      const itemData = createItemFromDef(defId);
      if (itemData) {
        const item = new Item(itemData);
        // Apply standardized spawn defaults (ammo, stacks, condition)
        LootGenerator.applySpawnDefaults(item, false);
        // Add with stacking enabled
        npc.inventory.addItem(item, null, null, true);
      }
    });

    if (gameMap.addEntity(npc, x, y)) {
      console.log(`[NPCSpawner] Manually spawned ${isHostile ? 'HOSTILE' : 'NEUTRAL'} NPC '${name}' at (${x}, ${y}) with ${itemsToAdd.length} items.`);
      return npc;
    }

    return null;
  }
}
