import { NPC } from '../entities/NPC.js';
import { Item } from '../inventory/Item.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { getNPCType } from '../entities/NPCTypes.js';

const SURVIVOR_NAMES = [
  'Bob', 'Alice', 'Charlie', 'Dana', 'Eli', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia',
  'Kevin', 'Luna', 'Marcus', 'Nora', 'Oscar', 'Penelope', 'Quinn', 'Rupert', 'Stella', 'Thomas',
  'Victor', 'Wendy', 'Xavier', 'Yvonne', 'Zachary'
];

/**
 * NPCSpawner - Handles placement of NPCs on maps.
 */
export class NPCSpawner {
  /**
   * Spawn NPCs on a given game map (for maps 2+)
   * @param {GameMap} gameMap - The map to spawn NPCs on
   * @param {Object} options - Spawning options ({ count, mapNumber })
   * @returns {number} - Number of successfully spawned NPCs
   */
  static spawnNPCs(gameMap, options = {}) {
    const { count = 1, mapNumber = 1 } = options;
    
    // Never spawn on map 1 (no south exit)
    if (mapNumber <= 1) return 0;
    
    const spawned = [];
    const southExitTile = this.findSouthTransitionTile(gameMap);
    if (!southExitTile) {
      console.warn('[NPCSpawner] NPC spawning aborted: no south transition or walkable tile found at south edge.');
      return 0; // No south exit = no NPCs
    }
    
    for (let i = 0; i < count; i++) {
      const spawnPos = this.findNorthSpawnPosition(gameMap);
      if (!spawnPos) continue;
      
      const npc = this.spawnNPCAt(gameMap, spawnPos.x, spawnPos.y, {
        goalTarget: { x: southExitTile.x, y: southExitTile.y }
      });
      if (npc) spawned.push(npc);
    }
    
    return spawned.length;
  }

  /**
   * Find a suitable spawn position in the northern portion of the map.
   * Prefer road or sidewalk tiles, falling back to grass.
   */
  static findNorthSpawnPosition(gameMap) {
    const northHeight = Math.max(1, Math.floor(gameMap.height * 0.2));
    const preferredPositions = [];
    const fallbackPositions = [];
    
    for (let y = 0; y < northHeight; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        const tile = gameMap.getTile(x, y);
        if (tile && tile.isWalkable() && tile.contents.length === 0) {
          if (tile.terrain === 'road' || tile.terrain === 'sidewalk') {
            preferredPositions.push({ x, y });
          } else if (tile.terrain === 'grass') {
            fallbackPositions.push({ x, y });
          }
        }
      }
    }
    
    const candidates = preferredPositions.length > 0 ? preferredPositions : fallbackPositions;
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return null;
  }

  /**
   * Find transition tile at the south edge (y = height - 1)
   */
  static findSouthTransitionTile(gameMap) {
    const y = gameMap.height - 1;
    // 1. Scan for 'transition' terrain tile
    for (let x = 0; x < gameMap.width; x++) {
      const tile = gameMap.getTile(x, y);
      if (tile && tile.terrain === 'transition') {
        return { x, y };
      }
    }
    // 2. Fallback: Any walkable tile at the south edge
    for (let x = 0; x < gameMap.width; x++) {
      const tile = gameMap.getTile(x, y);
      if (tile && tile.isWalkable()) {
        return { x, y };
      }
    }
    return null;
  }

  /**
   * Spawn a single NPC at a specific location
   */
  static spawnNPCAt(gameMap, x, y, options = {}) {
    const typeId = options.typeId || 'survivor';
    const typeDef = getNPCType(typeId);
    
    const id = `npc_${Math.random().toString(36).substr(2, 9)}`;
    const name = options.name || SURVIVOR_NAMES[Math.floor(Math.random() * SURVIVOR_NAMES.length)];
    
    const isHostile = options.isHostile !== undefined 
      ? options.isHostile 
      : (Math.random() < (typeDef.hostilityChance || 0));
      
    const npc = new NPC(id, name, x, y, isHostile, typeId);
    npc.goalTarget = options.goalTarget || null;
    
    // Generate items
    const minItems = typeDef.minItems || 5;
    const maxItems = typeDef.maxItems || 10;
    const numItems = minItems + Math.floor(Math.random() * (maxItems - minItems + 1));
    
    // 1. Equip random weapon
    if (typeDef.pools && typeDef.pools.weapons && typeDef.pools.weapons.length > 0) {
      const weaponDefId = typeDef.pools.weapons[Math.floor(Math.random() * typeDef.pools.weapons.length)];
      const weaponData = createItemFromDef(weaponDefId);
      if (weaponData) {
        const weaponItem = Item.fromJSON(weaponData);
        npc.inventory.addItem(weaponItem);
        npc.equippedWeaponId = weaponItem.instanceId;
      }
    }
    
    // 2. Generate general items
    let itemsAdded = npc.equippedWeaponId ? 1 : 0;
    let attempts = 0;
    const maxAttempts = numItems * 3;
    
    while (itemsAdded < numItems && attempts < maxAttempts) {
      attempts++;
      let pool = 'general';
      const rand = Math.random();
      if (rand < 0.10) {
        pool = 'rare';
      } else if (rand < 0.50) {
        pool = 'foodWater';
      }
      
      const itemPool = typeDef.pools?.[pool] || typeDef.pools?.general || [];
      if (itemPool.length > 0) {
        const itemDefId = itemPool[Math.floor(Math.random() * itemPool.length)];
        const itemData = createItemFromDef(itemDefId);
        if (itemData) {
          const item = Item.fromJSON(itemData);
          const success = npc.inventory.addItem(item);
          if (success) {
            itemsAdded++;
          }
        }
      }
    }
    
    // Add to game map
    const added = gameMap.addEntity(npc, x, y);
    if (added) {
      console.log(`[NPCSpawner] Spawned NPC ${name} (${isHostile ? 'hostile' : 'friendly'}) at (${x}, ${y}) heading to exit (${npc.goalTarget?.x}, ${npc.goalTarget?.y})`);
      return npc;
    }
    return null;
  }
}
