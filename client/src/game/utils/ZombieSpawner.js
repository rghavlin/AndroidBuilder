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
      spitterCount = 0,
      maxTotal = 100,
      minDistance = null
    } = options;

    let spawnedCount = 0;
    const canSpawnMore = () => spawnedCount < maxTotal;

    const spawnHelper = (subtype, count, minDist, constraints = {}) => {
      for (let i = 0; i < count && canSpawnMore(); i++) {
        let attempts = 0;
        let spawned = false;
        while (!spawned && attempts < 50) {
          let x, y;
          if (constraints.yMin !== undefined && constraints.yRange !== undefined) {
            x = Math.floor(Math.random() * gameMap.width);
            y = constraints.yMin + Math.floor(Math.random() * constraints.yRange);
          } else {
            x = Math.floor(Math.random() * gameMap.width);
            y = Math.floor(Math.random() * gameMap.height);
          }

          const tile = gameMap.getTile(x, y);
          const distToPlayer = player ? Math.abs(x - player.x) + Math.abs(y - player.y) : 100;
          const actualMinDist = minDistance !== null ? minDistance : minDist;

          if (tile && tile.isWalkable() && distToPlayer >= actualMinDist && tile.contents.length === 0) {
            const zombieId = `zombie-${subtype}-${Date.now()}-${spawnedCount}`;
            if (gameMap.addEntity(new Zombie(zombieId, x, y, subtype), x, y)) {
              spawnedCount++;
              spawned = true;
            }
          }
          attempts++;
        }
      }
    };

    // 1. Basic Zombies with top-half bias
    const spawnInTopHalf = Math.random() < 0.75;
    const yMin = spawnInTopHalf ? 0 : Math.floor(gameMap.height * 0.5);
    const yRange = spawnInTopHalf ? Math.floor(gameMap.height * 0.5) : (gameMap.height - yMin);
    spawnHelper('basic', basicCount, 7, { yMin, yRange });

    // 2. Specialized Ranges
    const crawlerCount = Math.floor(Math.random() * (crawlerRange.max - crawlerRange.min + 1)) + crawlerRange.min;
    spawnHelper('crawler', crawlerCount, 10);
    
    spawnHelper('runner', runnerCount, 10);
    
    const acidCount = Math.floor(Math.random() * (acidRange.max - acidRange.min + 1)) + acidRange.min;
    spawnHelper('acid', acidCount, 10);
    
    const fatCount = Math.floor(Math.random() * (fatRange.max - fatRange.min + 1)) + fatRange.min;
    spawnHelper('fat', fatCount, 10);

    spawnHelper('spitter', spitterCount, 10);

    // 3. Random Specialized (past Map 3)
    spawnHelper('swat', randomSwatCount, 10);
    spawnHelper('firefighter', randomFirefighterCount, 10);
    spawnHelper('soldier', soldierCount, 10);


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

        // Bomb Disposal Zombie (5% + map# chance)
        const bdChance = (5 + (gameMap.mapNumber || 1)) / 100;
        if (Math.random() < bdChance && canSpawnMore()) {
            let bdAttempts = 0;
            let bdSpawned = false;
            while (!bdSpawned && bdAttempts < 50) {
                const x = station.x + 1 + Math.floor(Math.random() * (station.width - 2));
                const y = station.y + 1 + Math.floor(Math.random() * (station.height - 2));
                const tile = gameMap.getTile(x, y);
                if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
                    if (gameMap.addEntity(new Zombie(`zombie-bombdisposal-${Date.now()}-${sIdx}`, x, y, 'bomb_disposal'), x, y)) {
                        spawnedCount++;
                        bdSpawned = true;
                    }
                }
                bdAttempts++;
            }
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

        // Bomb Disposal Zombie (5% + map# chance)
        const bdChance = (5 + (gameMap.mapNumber || 1)) / 100;
        if (Math.random() < bdChance && canSpawnMore()) {
            let bdAttempts = 0;
            let bdSpawned = false;
            while (!bdSpawned && bdAttempts < 50) {
                const x = station.x + 1 + Math.floor(Math.random() * (station.width - 2));
                const y = station.y + 1 + Math.floor(Math.random() * (station.height - 2));
                const tile = gameMap.getTile(x, y);
                if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
                    if (gameMap.addEntity(new Zombie(`zombie-bombdisposal-${Date.now()}-${sIdx}`, x, y, 'bomb_disposal'), x, y)) {
                        spawnedCount++;
                        bdSpawned = true;
                    }
                }
                bdAttempts++;
            }
        }
      }

      // Army Tent Specialized Spawns
      if (station.type === 'army_tent') {
        console.log(`[ZombieSpawner] Army Tent: Spawning soldier zombies for tent at (${station.x}, ${station.y})`);
        
        // 1-2 Soldiers Inside
        const insideCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < insideCount && canSpawnMore(); i++) {
          let spawnedIn = false;
          let inAttempts = 0;
          while (!spawnedIn && inAttempts < 20) {
            const rx = station.x + 1 + Math.floor(Math.random() * (station.width - 2));
            const ry = station.y + 1 + Math.floor(Math.random() * (station.height - 2));
            const tile = gameMap.getTile(rx, ry);
            if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
              if (gameMap.addEntity(new Zombie(`zombie-soldier-in-${Date.now()}-${sIdx}-${i}`, rx, ry, 'soldier'), rx, ry)) {
                spawnedCount++;
                spawnedIn = true;
              }
            }
            inAttempts++;
          }
        }
        
        // 1-2 Soldiers Outside (Radial spawn)
        const outsideCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < outsideCount && canSpawnMore(); i++) {
          let foundOut = false;
          for (let attempt = 0; attempt < 25; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 4; 
            const rx = Math.max(0, Math.min(gameMap.width - 1, Math.floor(station.x + station.width / 2 + Math.cos(angle) * dist)));
            const ry = Math.max(0, Math.min(gameMap.height - 1, Math.floor(station.y + station.height / 2 + Math.sin(angle) * dist)));
            
            const tile = gameMap.getTile(rx, ry);
            if (tile && tile.isWalkable() && tile.contents.length === 0) {
              if (gameMap.addEntity(new Zombie(`zombie-soldier-out-${Date.now()}-${sIdx}-${i}`, rx, ry, 'soldier'), rx, ry)) {
                spawnedCount++;
                foundOut = true;
                break;
              }
            }
          }
        }
      }

      // Laboratory Specialized Spawns
      if (station.type === 'lab') {
        // 1. Spawn Exactly 1 Mutant in the Central Hall
        let mutantSpawned = false;
        let mAttempts = 0;
        while (!mutantSpawned && mAttempts < 100 && canSpawnMore()) {
          const hX = station.hallXStart || (station.x + 7);
          const hW = station.hallWidth || 4;
          const x = hX + Math.floor(Math.random() * hW);
          const y = station.y + 1 + Math.floor(Math.random() * (station.height - 2));
          const tile = gameMap.getTile(x, y);
          if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
            if (gameMap.addEntity(new Zombie(`zombie-mutant-${Date.now()}-${sIdx}`, x, y, 'mutant'), x, y)) {
              spawnedCount++;
              mutantSpawned = true;
            }
          }
          mAttempts++;
        }

        // 2. Spawn 4-6 Soldier Zombies anywhere in the Lab
        const sCount = 4 + Math.floor(Math.random() * 3);
        let spawnedForLab = 0;
        let sAttempts = 0;
        while (spawnedForLab < sCount && sAttempts < 150 && canSpawnMore()) {
          const x = station.x + 1 + Math.floor(Math.random() * (station.width - 2));
          const y = station.y + 1 + Math.floor(Math.random() * (station.height - 2));
          const tile = gameMap.getTile(x, y);
          if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
            if (gameMap.addEntity(new Zombie(`zombie-labsoldier-${Date.now()}-${sIdx}-${spawnedForLab}`, x, y, 'soldier'), x, y)) {
              spawnedCount++;
              spawnedForLab++;
            }
          }
          sAttempts++;
        }
        console.log(`[ZombieSpawner] Lab: Spawned 1 Mutant and ${spawnedForLab} Soldiers`);
      }
    });

    return spawnedCount;
  }
}
