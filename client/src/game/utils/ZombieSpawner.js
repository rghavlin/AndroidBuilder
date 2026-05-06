import { Zombie } from '../entities/Zombie.js';

/**
 * ZombieSpawner - Utility class to handle zombie population on maps
 * Centralizes spawning logic for initial and subsequent maps
 */
export class ZombieSpawner {
  /**
   * Spawn a population of zombies on a game map
   * @param {GameMap} gameMap - The map to populate
   * @param {Player} player - Player entity for distance checks
   * @param {Object} options - Spawning options
   * @returns {number} - Number of zombies spawned
   */
  static spawnZombies(gameMap, player, options = {}) {
    const {
      basicCount = 15,
      crawlerRange = { min: 2, max: 4 },
      runnerCount = 1,
      acidRange = { min: 1, max: 2 },
      fatRange = { min: 1, max: 2 },
      firefighterRange = { min: 2, max: 3 },
      swatRange = { min: 2, max: 3 },
      randomSwatCount = 0,
      randomFirefighterCount = 0,
      soldierCount = 0,
      maxTotal = 100
    } = options;

    let spawnedCount = 0;
    const mapWidth = gameMap.width;
    const mapHeight = gameMap.height;
    const mapArea = mapWidth * mapHeight;
    
    // Scale density based on a "standard" 45x125 map (5,625 tiles)
    const standardArea = 45 * 125;
    const densityFactor = Math.max(1, mapArea / standardArea);
    
    const scaledBasicCount = Math.floor(basicCount * densityFactor);
    const scaledRunnerCount = Math.floor(runnerCount * densityFactor);
    const scaledMaxTotal = Math.floor(maxTotal * densityFactor);

    // Helper to check if we can spawn more
    const canSpawnMore = () => spawnedCount < scaledMaxTotal;

    // 1. Spawn Basic Zombies
    for (let i = 0; i < scaledBasicCount && canSpawnMore(); i++) {
      const maxAttempts = 50;
      let attempts = 0;
      let spawned = false;

      // 75% chance to spawn in the top 50% of the map
      const spawnInTopHalf = Math.random() < 0.75;
      const yMin = spawnInTopHalf ? 0 : Math.floor(mapHeight * 0.5);
      const yRange = spawnInTopHalf ? Math.floor(mapHeight * 0.5) : (mapHeight - yMin);

      while (!spawned && attempts < maxAttempts) {
        const x = Math.floor(Math.random() * mapWidth);
        const y = yMin + Math.floor(Math.random() * yRange);

        const tile = gameMap.getTile(x, y);
        const distanceFromPlayer = player ? Math.abs(x - player.x) + Math.abs(y - player.y) : 100;
        const minDistanceFromPlayer = 7;

        if (tile && tile.isWalkable() && distanceFromPlayer >= minDistanceFromPlayer && tile.contents.length === 0) {
          const zombieId = `zombie-basic-${Date.now()}-${i}`;
          if (gameMap.addEntity(new Zombie(zombieId, x, y, 'basic'), x, y)) {
            spawnedCount++;
            spawned = true;
          }
        }
        attempts++;
      }
    }

    // 2. Spawn Crawler Zombies
    const scaledCrawlerMin = Math.floor(crawlerRange.min * densityFactor);
    const scaledCrawlerMax = Math.floor(crawlerRange.max * densityFactor);
    const crawlerCount = Math.floor(Math.random() * (scaledCrawlerMax - scaledCrawlerMin + 1)) + scaledCrawlerMin;
    for (let i = 0; i < crawlerCount && canSpawnMore(); i++) {
      let attempts = 0;
      let spawned = false;
      while (!spawned && attempts < 50) {
        const x = Math.floor(Math.random() * mapWidth);
        const y = Math.floor(Math.random() * mapHeight);
        const tile = gameMap.getTile(x, y);
        const distanceFromPlayer = player ? Math.abs(x - player.x) + Math.abs(y - player.y) : 100;
        if (tile && tile.isWalkable() && distanceFromPlayer >= 10 && tile.contents.length === 0) {
          if (gameMap.addEntity(new Zombie(`zombie-crawler-${Date.now()}-${i}`, x, y, 'crawler'), x, y)) {
            spawnedCount++;
            spawned = true;
          }
        }
        attempts++;
      }
    }

    // 3. Spawn Runner Zombies
    for (let i = 0; i < scaledRunnerCount && canSpawnMore(); i++) {
      let attempts = 0;
      let spawned = false;
      while (!spawned && attempts < 50) {
        const x = Math.floor(Math.random() * mapWidth);
        const y = Math.floor(Math.random() * mapHeight);
        const tile = gameMap.getTile(x, y);
        const distanceFromPlayer = player ? Math.abs(x - player.x) + Math.abs(y - player.y) : 100;
        if (tile && tile.isWalkable() && distanceFromPlayer >= 10 && tile.contents.length === 0) {
          if (gameMap.addEntity(new Zombie(`zombie-runner-${Date.now()}-${i}`, x, y, 'runner'), x, y)) {
            spawnedCount++;
            spawned = true;
          }
        }
        attempts++;
      }
    }

    // 4. Spawn Acid Zombies
    const scaledAcidMin = Math.floor(acidRange.min * densityFactor);
    const scaledAcidMax = Math.floor(acidRange.max * densityFactor);
    const acidCount = Math.floor(Math.random() * (scaledAcidMax - scaledAcidMin + 1)) + scaledAcidMin;
    for (let i = 0; i < acidCount && canSpawnMore(); i++) {
        let attempts = 0;
        let spawned = false;
        while (!spawned && attempts < 50) {
            const x = Math.floor(Math.random() * mapWidth);
            const y = Math.floor(Math.random() * mapHeight);
            const tile = gameMap.getTile(x, y);
            const distanceFromPlayer = player ? Math.abs(x - player.x) + Math.abs(y - player.y) : 100;
            if (tile && tile.isWalkable() && distanceFromPlayer >= 10 && tile.contents.length === 0) {
                if (gameMap.addEntity(new Zombie(`zombie-acid-${Date.now()}-${i}`, x, y, 'acid'), x, y)) {
                    spawnedCount++;
                    spawned = true;
                }
            }
            attempts++;
        }
    }

    // 5. Spawn Fat Zombies
    const scaledFatMin = Math.floor(fatRange.min * densityFactor);
    const scaledFatMax = Math.floor(fatRange.max * densityFactor);
    const fatCount = Math.floor(Math.random() * (scaledFatMax - scaledFatMin + 1)) + scaledFatMin;
    for (let i = 0; i < fatCount && canSpawnMore(); i++) {
        let attempts = 0;
        let spawned = false;
        while (!spawned && attempts < 50) {
            const x = Math.floor(Math.random() * mapWidth);
            const y = Math.floor(Math.random() * mapHeight);
            const tile = gameMap.getTile(x, y);
            const distanceFromPlayer = player ? Math.abs(x - player.x) + Math.abs(y - player.y) : 100;
            if (tile && tile.isWalkable() && distanceFromPlayer >= 10 && tile.contents.length === 0) {
                if (gameMap.addEntity(new Zombie(`zombie-fat-${Date.now()}-${i}`, x, y, 'fat'), x, y)) {
                    spawnedCount++;
                    spawned = true;
                }
            }
            attempts++;
        }
    }

    // 5.5 Spawn Random Specialized Zombies (past Map 3 interspersement)
    const randomSpecialized = [
      { count: randomSwatCount, type: 'swat', label: 'swat' },
      { count: randomFirefighterCount, type: 'firefighter', label: 'firefighter' },
      { count: soldierCount, type: 'soldier', label: 'soldier' }
    ];

    randomSpecialized.forEach(spec => {
      for (let i = 0; i < spec.count && canSpawnMore(); i++) {
        let attempts = 0;
        let spawned = false;
        while (!spawned && attempts < 50) {
          const x = Math.floor(Math.random() * mapWidth);
          const y = Math.floor(Math.random() * mapHeight);
          const tile = gameMap.getTile(x, y);
          const distanceFromPlayer = player ? Math.abs(x - player.x) + Math.abs(y - player.y) : 100;
          if (tile && tile.isWalkable() && distanceFromPlayer >= 10 && tile.contents.length === 0) {
            if (gameMap.addEntity(new Zombie(`zombie-random-${spec.label}-${Date.now()}-${i}`, x, y, spec.type), x, y)) {
              spawnedCount++;
              spawned = true;
            }
          }
          attempts++;
        }
      }
    });

    // 6. Spawn Special Zombies in Buildings
    const buildings = gameMap.buildings || gameMap.specialBuildings || [];
    
    buildings.forEach((station, sIdx) => {
      // Firefighters in Fire Stations
      if (station.type === 'firestation') {
        const ffCount = Math.floor(Math.random() * (firefighterRange.max - firefighterRange.min + 1)) + firefighterRange.min;
        let spawnedForStation = 0;
        let attempts = 0;
        while (spawnedForStation < ffCount && attempts < 50 && canSpawnMore()) {
          const x = station.x + 1 + Math.floor(Math.random() * (station.width - 2));
          const y = station.y + 1 + Math.floor(Math.random() * (station.height - 2));
          const tile = gameMap.getTile(x, y);
          if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
            if (gameMap.addEntity(new Zombie(`zombie-firefighter-${Date.now()}-${sIdx}-${spawnedForStation}`, x, y, 'firefighter'), x, y)) {
              spawnedCount++;
              spawnedForStation++;
            }
          }
          attempts++;
        }
      }

      // SWAT in Police Stations
      if (station.type === 'police' || station.type === 'police_station') {
        const sCount = Math.floor(Math.random() * (swatRange.max - swatRange.min + 1)) + swatRange.min;
        let spawnedForStation = 0;
        let attempts = 0;
        while (spawnedForStation < sCount && attempts < 100 && canSpawnMore()) {
          const x = station.x + 1 + Math.floor(Math.random() * (station.width - 2));
          const y = station.y + 1 + Math.floor(Math.random() * (station.height - 2));
          const tile = gameMap.getTile(x, y);
          if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
            if (gameMap.addEntity(new Zombie(`zombie-swat-${Date.now()}-${sIdx}-${spawnedForStation}`, x, y, 'swat'), x, y)) {
              spawnedCount++;
              spawnedForStation++;
            }
          }
          attempts++;
        }
      }
    });

    return spawnedCount;
  }
}
