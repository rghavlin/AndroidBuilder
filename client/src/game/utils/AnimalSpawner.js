import { Rabbit } from '../entities/Rabbit.js';

/**
 * AnimalSpawner - Utility class to handle animal population on maps
 */
export class AnimalSpawner {
  /**
   * Spawn animals (rabbits) on a game map
   * @param {GameMap} gameMap - The map to populate
   * @param {Player} player - Player entity for distance checks
   * @param {Object} options - Spawning options
   * @returns {number} - Number of animals spawned
   */
  static spawnAnimals(gameMap, player, options = {}) {
    const {
      rabbitRange = { min: 1, max: 2 },
      minDistanceFromPlayer = 12
    } = options;

    let spawnedCount = 0;
    const mapWidth = gameMap.width;
    const mapHeight = gameMap.height;

    // 1. Determine how many rabbits to spawn
    const rabbitCount = Math.floor(Math.random() * (rabbitRange.max - rabbitRange.min + 1)) + rabbitRange.min;

    for (let i = 0; i < rabbitCount; i++) {
      let attempts = 0;
      let spawned = false;
      const maxAttempts = 50;

      while (!spawned && attempts < maxAttempts) {
        const x = Math.floor(Math.random() * mapWidth);
        const y = Math.floor(Math.random() * mapHeight);

        const tile = gameMap.getTile(x, y);
        const distToPlayer = player ? Math.abs(x - player.x) + Math.abs(y - player.y) : 100;

        // Rabbits spawn on grass or foliage
        const isNaturalTerrain = tile && (tile.terrain === 'grass' || tile.terrain === 'foliage');
        
        if (isNaturalTerrain && tile.isWalkable() && distToPlayer >= minDistanceFromPlayer && tile.contents.length === 0) {
          const rabbitId = `rabbit-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
          const rabbit = new Rabbit(rabbitId, x, y);
          
          if (gameMap.addEntity(rabbit, x, y)) {
            console.log(`[AnimalSpawner] Spawned rabbit at (${x}, ${y})`);
            spawnedCount++;
            spawned = true;
          }
        }
        attempts++;
      }
    }

    return spawnedCount;
  }
}
