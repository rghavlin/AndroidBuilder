import { EntityFactory } from '../EntityFactory.js';
import { Item } from '../inventory/Item.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { findSouthTransitionTile } from '../map/MapUtils.js';
import { getNPCType } from '../entities/NPCTypes.js';
import { TURRET_DEF_ID } from '../ai/TurretCombat.js';
import { PlaceIcon } from '../entities/PlaceIcon.js';
import { computeTollGateLayout } from '../map/TollGate.js';


import { gameRandom } from './SeededRandom.js';
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
    const southExitTile = findSouthTransitionTile(gameMap);
    if (!southExitTile) {
      console.warn('[NPCSpawner] NPC spawning aborted: no south transition or walkable tile found at south edge.');
      return 0; // No south exit = no NPCs
    }
    
    for (let i = 0; i < count; i++) {
      const spawnPos = this.findMiddleIndoorSpawnPosition(gameMap);
      if (!spawnPos) continue;
      
      const npc = this.spawnNPCAt(gameMap, spawnPos.x, spawnPos.y, {
        goalTarget: { x: southExitTile.x, y: southExitTile.y }
      });
      if (npc) spawned.push(npc);
    }
    
    return spawned.length;
  }

  /**
   * Find a suitable spawn position inside a building close to the middle of the map (y-wise),
   * ensuring there are no zombies nearby (within 6 tiles).
   */
  static findMiddleIndoorSpawnPosition(gameMap) {
    const minY = Math.floor(gameMap.height * 0.35);
    const maxY = Math.floor(gameMap.height * 0.65);
    const candidates = [];

    // First pass: Find walkable floor tiles in the middle vertical region
    for (let y = minY; y <= maxY; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        const tile = gameMap.getTile(x, y);
        if (tile && tile.terrain === 'floor' && tile.isWalkable() && tile.contents.length === 0) {
          // Check if there are any zombies nearby (within Manhattan distance of 6 tiles)
          let zombieNearby = false;
          const checkRadius = 6;
          
          for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
              const tx = x + dx;
              const ty = y + dy;
              if (tx < 0 || tx >= gameMap.width || ty < 0 || ty >= gameMap.height) continue;
              const neighborTile = gameMap.getTile(tx, ty);
              if (neighborTile && neighborTile.contents.some(e => e.type === 'zombie')) {
                zombieNearby = true;
                break;
              }
            }
            if (zombieNearby) break;
          }

          if (!zombieNearby) {
            candidates.push({ x, y });
          }
        }
      }
    }

    // If we found candidates, pick the one closest to the middle of the map
    if (candidates.length > 0) {
      const midY = Math.floor(gameMap.height / 2);
      const midX = Math.floor(gameMap.width / 2);
      
      candidates.sort((a, b) => {
        const distA = Math.abs(a.x - midX) + Math.abs(a.y - midY);
        const distB = Math.abs(b.x - midX) + Math.abs(b.y - midY);
        return distA - distB;
      });
      
      return candidates[0]; // Return the one closest to absolute center
    }

    // Fallback: If no safe indoor tiles found, relax criteria and try any floor tile in the middle region
    for (let y = minY; y <= maxY; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        const tile = gameMap.getTile(x, y);
        if (tile && tile.terrain === 'floor' && tile.isWalkable() && tile.contents.length === 0) {
          candidates.push({ x, y });
        }
      }
    }

    if (candidates.length > 0) {
      const midY = Math.floor(gameMap.height / 2);
      const midX = Math.floor(gameMap.width / 2);
      candidates.sort((a, b) => {
        const distA = Math.abs(a.x - midX) + Math.abs(a.y - midY);
        const distB = Math.abs(b.x - midX) + Math.abs(b.y - midY);
        return distA - distB;
      });
      return candidates[0];
    }

    // Secondary fallback: Use standard findNorthSpawnPosition
    return this.findNorthSpawnPosition(gameMap);
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
      return candidates[gameRandom.nextInt(0, candidates.length - 1)];
    }
    return null;
  }

  /**
   * Spawn a single NPC at a specific location
   */
  static spawnNPCAt(gameMap, x, y, options = {}) {
    const typeId = options.typeId || 'survivor';
    const typeDef = getNPCType(typeId);
    
    const id = `npc_${gameRandom.next().toString(36).substring(2, 11)}`;
    const name = options.name || null;
    
    // Procedural NPCs roll a faction: bandits (hostile, extort-first) vs
    // independents (peaceful). An explicit options.factionId (or legacy
    // options.isHostile) overrides the roll. typeDef.factionId (e.g. town) wins
    // inside createNPC when no faction is passed here.
    let factionId = options.factionId || null;
    if (!factionId && options.isHostile !== undefined) {
      factionId = options.isHostile ? 'bandits' : 'independent';
    }
    if (!factionId && !typeDef.factionId) {
      factionId = gameRandom.next() < (typeDef.hostilityChance || 0) ? 'bandits' : 'independent';
    }

    const npc = EntityFactory.createNPC(x, y, factionId, typeId, name, id);
    npc.goalTarget = options.goalTarget || null;
    
    // Generate items
    const minItems = typeDef.minItems || 5;
    const maxItems = typeDef.maxItems || 10;
    const numItems = minItems + Math.floor(gameRandom.next() * (maxItems - minItems + 1));
    
    // 1. Equip random weapon
    if (typeDef.pools && typeDef.pools.weapons && typeDef.pools.weapons.length > 0) {
      const weaponDefId = typeDef.pools.weapons[gameRandom.nextInt(0, typeDef.pools.weapons.length - 1)];
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
      const rand = gameRandom.next();
      if (rand < 0.10) {
        pool = 'rare';
      } else if (rand < 0.50) {
        pool = 'foodWater';
      }
      
      const itemPool = typeDef.pools?.[pool] || typeDef.pools?.general || [];
      if (itemPool.length > 0) {
        const itemDefId = itemPool[gameRandom.nextInt(0, itemPool.length - 1)];
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
      console.log(`[NPCSpawner] Spawned NPC ${name} (${npc.factionId}) at (${x}, ${y}) heading to exit (${npc.goalTarget?.x}, ${npc.goalTarget?.y})`);
      return npc;
    }
    return null;
  }

  /**
   * Spawn a stationary shopkeeper NPC at the town square compound entrance.
   * @param {GameMap} gameMap - The map to spawn the shopkeeper on
   */
  static spawnShopkeeper(gameMap) {
    const compound = gameMap.metadata?.townSquareCompound;
    if (!compound) {
      console.warn('[NPCSpawner] spawnShopkeeper aborted: no townSquareCompound metadata found.');
      return null;
    }
    
    // Position exactly in between the two barrier icons at the compound gate entrance:
    const spawnX = Math.floor(gameMap.width / 2);
    const spawnY = compound.fenceBounds?.y2;
    
    if (spawnY === undefined) {
      console.warn('[NPCSpawner] spawnShopkeeper: no fenceBounds.y2 found in compound.');
      return null;
    }
    
    const typeId = 'shopkeeper';
    const typeDef = getNPCType(typeId);
    
    const id = `shopkeeper_${gameMap.id || 'map1'}`;
    const name = null;
    
    const npc = EntityFactory.createNPC(spawnX, spawnY, null, typeId, name, id);
    npc.isShopkeeper = true;
    npc.goalTarget = null;
    
    const added = gameMap.addEntity(npc, spawnX, spawnY);
    if (added) {
      console.log(`[NPCSpawner] Spawned Shopkeeper ${name} at (${spawnX}, ${spawnY})`);
      return npc;
    }
    return null;
  }

  /**
   * Build a town-faction auto-turret fitted with a suppressor so its gunfire
   * only wakes nearby zombies (noiseRadius 3) instead of broadcasting across the
   * whole map. Town defenses fire often, so an un-suppressed turret would draw a
   * steady stream of zombies into the compound.
   * @returns {Item|null}
   */
  static createTownTurret() {
    const turretData = createItemFromDef(TURRET_DEF_ID, { factionId: 'town', isOn: true });
    if (!turretData) return null;
    const turret = new Item(turretData);
    turret.factionId = 'town';
    turret.isOn = true;

    const suppressorData = createItemFromDef('attachment.suppressor');
    if (suppressorData) {
      turret.attachItem('barrel', new Item(suppressorData));
    }
    return turret;
  }

  /**
   * Spawn the town faction's defensive auto-turrets on the fence tiles flanking
   * the barrier icons either side of the shopkeeper's gate. These are neutral
   * (town faction): infinite battery/ammo, always powered on. They fire on
   * zombies unconditionally, and on the player only after escalation (the player
   * attacking the shopkeeper).
   * @param {GameMap} gameMap
   * @returns {number} number of turrets spawned
   */
  static spawnTownTurrets(gameMap) {
    const compound = gameMap.metadata?.townSquareCompound;
    if (!compound || !compound.fenceBounds || compound.fenceBounds.y2 === undefined) {
      console.warn('[NPCSpawner] spawnTownTurrets aborted: no townSquareCompound fenceBounds.');
      return 0;
    }

    const y = compound.fenceBounds.y2;
    const centerX = Math.floor(gameMap.width / 2);
    // Barriers sit at centerX +/- 1 (flanking the gate); turrets sit one tile
    // further out, on the fence tiles flanking those barriers.
    const positions = [centerX - 2, centerX + 2];

    let count = 0;
    for (const x of positions) {
      if (x < 0 || x >= gameMap.width) continue;
      const turret = NPCSpawner.createTownTurret();
      if (!turret) continue;
      gameMap.addItemsToTile(x, y, [turret]);
      count++;
      console.log(`[NPCSpawner] Spawned town turret at (${x}, ${y})`);
    }
    return count;
  }

  /**
   * Spawn the standard map-exit tollgate: a serpentine barrier maze, four
   * town-faction auto-turrets at the corners, and a gate guard blocking the only
   * opening. The whole layout is derived from the forward (north) exit center
   * (see computeTollGateLayout), so it drops onto any town-sized map.
   *
   * Mirrors spawnTownTurrets/spawnShopkeeper: call before saving so the entities
   * land in the map snapshot. Barriers persist as `place_icon` entities; turrets
   * as town-faction items; the guard as a stationary `gatekeeper` NPC.
   *
   * NOTE: this only PLACES the gate. The turret-firing rules during a toll run
   * and the pay-toll / guard-sidestep interaction are wired up separately.
   *
   * @param {GameMap} gameMap
   * @param {object} [opts] forwarded to computeTollGateLayout (e.g. { lanes })
   * @returns {boolean} whether the gate was placed
   */
  static spawnTollGate(gameMap, opts = {}) {
    const centerX = Math.floor(gameMap.width / 2);
    const exit = gameMap.metadata?.exits?.north || { x: centerX, y: 0 };

    const layout = computeTollGateLayout(exit, { edge: 'north', ...opts });
    const inBounds = (x, y) => x >= 0 && x < gameMap.width && y >= 0 && y < gameMap.height;

    // Record the exclusion footprint so spawners (loot/zombies/replenishment) keep
    // this area clear. The generator pre-records it (with default opts) before
    // population; refresh it here so it matches the gate that was actually placed.
    if (gameMap.metadata) gameMap.metadata.tollGate = layout.area;

    // 1. Barriers — block movement but not sight, so turrets fire across the maze.
    let barrierCount = 0;
    for (const { x, y } of layout.barriers) {
      if (!inBounds(x, y)) continue;
      const icon = new PlaceIcon(`tollgate-barrier-${gameMap.id || 'map'}-${x}-${y}`, x, y, 'barrier');
      if (gameMap.addEntity(icon, x, y)) barrierCount++;
    }

    // 2. Corner turrets — town faction (infinite battery/ammo, always on).
    let turretCount = 0;
    for (const { x, y } of layout.turrets) {
      if (!inBounds(x, y)) continue;
      const turret = NPCSpawner.createTownTurret();
      if (!turret) continue;
      gameMap.addItemsToTile(x, y, [turret]);
      turretCount++;
    }

    // 3. Gate guard — stationary, blocking the only opening. Records where to
    // sidestep so the pay-toll interaction can clear the path later.
    let guard = null;
    const { x: gx, y: gy } = layout.guard;
    if (inBounds(gx, gy)) {
      const id = `tollguard_${gameMap.id || 'map'}`;
      guard = EntityFactory.createNPC(gx, gy, null, 'gatekeeper', null, id);
      guard.isTollGuard = true;
      guard.goalTarget = null;
      guard.tollSidestep = layout.guard.sidestep;
      gameMap.addEntity(guard, gx, gy);
    }

    console.log(
      `[NPCSpawner] Tollgate at north exit (${exit.x},${exit.y}): ` +
      `${barrierCount} barriers, ${turretCount} turrets, guard=${!!guard}`
    );
    return barrierCount > 0;
  }
}
