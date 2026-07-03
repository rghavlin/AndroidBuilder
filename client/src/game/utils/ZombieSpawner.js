import { EntityFactory } from '../EntityFactory.js';
import { isInsideCompound, isInsideTollGate } from '../map/MapUtils.js';

import { gameRandom } from './SeededRandom.js';
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
            x = Math.floor(gameRandom.next() * gameMap.width);
            y = constraints.yMin + Math.floor(gameRandom.next() * constraints.yRange);
          } else {
            x = Math.floor(gameRandom.next() * gameMap.width);
            y = Math.floor(gameRandom.next() * gameMap.height);
          }

          const tile = gameMap.getTile(x, y);
          const distToPlayer = player ? Math.abs(x - player.x) + Math.abs(y - player.y) : 100;
          const actualMinDist = minDistance !== null ? minDistance : minDist;

          const compound = gameMap.metadata?.townSquareCompound;
          const isInside = isInsideCompound(compound, x, y) || isInsideTollGate(gameMap.metadata?.tollGate, x, y);

          if (tile && tile.isWalkable() && distToPlayer >= actualMinDist && tile.contents.length === 0 && !isInside) {
            const zombieId = `zombie-${subtype}-${Date.now()}-${spawnedCount}`;
            if (gameMap.addEntity(EntityFactory.createZombie(x, y, subtype, zombieId), x, y)) {
              spawnedCount++;
              spawned = true;
            }
          }
          attempts++;
        }
      }
    };

    // 1. Basic Zombies equally distributed across the entire map
    spawnHelper('basic', basicCount, 7);

    // 2. Specialized Ranges
    const crawlerCount = gameRandom.nextInt(crawlerRange.min, crawlerRange.max);
    spawnHelper('crawler', crawlerCount, 10);
    
    spawnHelper('runner', runnerCount, 10);
    
    const mapNumber = gameMap.mapNumber || 1;
    const isStraightRoad = gameMap.template === 'road' || gameMap.template === 'starting_road';

    const acidCount = gameRandom.nextInt(acidRange.min, acidRange.max);
    const acidConstraints = isStraightRoad ? { yMin: 0, yRange: Math.floor(gameMap.height * 0.3) } : {};
    spawnHelper('acid', acidCount, 10, acidConstraints);
    
    const fatCount = gameRandom.nextInt(fatRange.min, fatRange.max);
    const fatConstraints = isStraightRoad ? { yMin: 0, yRange: Math.floor(gameMap.height * 0.3) } : {};
    spawnHelper('fat', fatCount, 10, fatConstraints);

    spawnHelper('spitter', spitterCount, 10);

    // 3. Random Specialized (past Map 3)
    spawnHelper('swat', randomSwatCount, 10);
    spawnHelper('firefighter', randomFirefighterCount, 10);
    spawnHelper('soldier', soldierCount, 10);

    // 4. Map-progression Mutants (Starting from Map 11)
    if (mapNumber >= 11) {
      const mutantCount = Math.min(10, mapNumber - 10);
      spawnHelper('mutant', mutantCount, 10);
    }


    // 6. Spawn Special Zombies in Buildings
    const buildings = gameMap.buildings || gameMap.specialBuildings || [];
    
    buildings.forEach((station, sIdx) => {
      // Firefighters in Fire Stations
      if (station.type === 'firestation') {
        const ffCount = gameRandom.nextInt(firefighterRange.min, firefighterRange.max);
        let spawnedForStation = 0;
        let attempts = 0;
        while (spawnedForStation < ffCount && attempts < 50 && canSpawnMore()) {
          const x = station.x + 1 + Math.floor(gameRandom.next() * (station.width - 2));
          const y = station.y + 1 + Math.floor(gameRandom.next() * (station.height - 2));
          const tile = gameMap.getTile(x, y);
          if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
            const zombieId = `zombie-firefighter-${Date.now()}-${sIdx}-${spawnedForStation}`;
            if (gameMap.addEntity(EntityFactory.createZombie(x, y, 'firefighter', zombieId), x, y)) {
              spawnedCount++;
              spawnedForStation++;
            }
          }
          attempts++;
        }

        // Bomb Disposal Zombie (5% + map# chance)
        const bdChance = (5 + (gameMap.mapNumber || 1)) / 100;
        if (gameRandom.next() < bdChance && canSpawnMore()) {
            let bdAttempts = 0;
            let bdSpawned = false;
            while (!bdSpawned && bdAttempts < 50) {
                const x = station.x + 1 + Math.floor(gameRandom.next() * (station.width - 2));
                const y = station.y + 1 + Math.floor(gameRandom.next() * (station.height - 2));
                const tile = gameMap.getTile(x, y);
                if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
                    const zombieId = `zombie-bombdisposal-${Date.now()}-${sIdx}`;
                    if (gameMap.addEntity(EntityFactory.createZombie(x, y, 'bomb_disposal', zombieId), x, y)) {
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
        const sCount = gameRandom.nextInt(swatRange.min, swatRange.max);
        let spawnedForStation = 0;
        let attempts = 0;
        while (spawnedForStation < sCount && attempts < 100 && canSpawnMore()) {
          const x = station.x + 1 + Math.floor(gameRandom.next() * (station.width - 2));
          const y = station.y + 1 + Math.floor(gameRandom.next() * (station.height - 2));
          const tile = gameMap.getTile(x, y);
          if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
            const zombieId = `zombie-swat-${Date.now()}-${sIdx}-${spawnedForStation}`;
            if (gameMap.addEntity(EntityFactory.createZombie(x, y, 'swat', zombieId), x, y)) {
              spawnedCount++;
              spawnedForStation++;
            }
          }
          attempts++;
        }

        // Bomb Disposal Zombie (5% + map# chance)
        const bdChance = (5 + (gameMap.mapNumber || 1)) / 100;
        if (gameRandom.next() < bdChance && canSpawnMore()) {
            let bdAttempts = 0;
            let bdSpawned = false;
            while (!bdSpawned && bdAttempts < 50) {
                const x = station.x + 1 + Math.floor(gameRandom.next() * (station.width - 2));
                const y = station.y + 1 + Math.floor(gameRandom.next() * (station.height - 2));
                const tile = gameMap.getTile(x, y);
                if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
                    const zombieId = `zombie-bombdisposal-${Date.now()}-${sIdx}`;
                    if (gameMap.addEntity(EntityFactory.createZombie(x, y, 'bomb_disposal', zombieId), x, y)) {
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
        const insideCount = 1 + gameRandom.nextInt(0, 1);
        for (let i = 0; i < insideCount && canSpawnMore(); i++) {
          let spawnedIn = false;
          let inAttempts = 0;
          while (!spawnedIn && inAttempts < 20) {
            const rx = station.x + 1 + Math.floor(gameRandom.next() * (station.width - 2));
            const ry = station.y + 1 + Math.floor(gameRandom.next() * (station.height - 2));
            const tile = gameMap.getTile(rx, ry);
            if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
              const zombieId = `zombie-soldier-in-${Date.now()}-${sIdx}-${i}`;
              if (gameMap.addEntity(EntityFactory.createZombie(rx, ry, 'soldier', zombieId), rx, ry)) {
                spawnedCount++;
                spawnedIn = true;
              }
            }
            inAttempts++;
          }
        }
        
        // 1-2 Soldiers Outside (Radial spawn)
        const outsideCount = 1 + gameRandom.nextInt(0, 1);
        for (let i = 0; i < outsideCount && canSpawnMore(); i++) {
          let foundOut = false;
          for (let attempt = 0; attempt < 25; attempt++) {
            const angle = gameRandom.next() * Math.PI * 2;
            const dist = 5 + gameRandom.next() * 4; 
            const rx = Math.max(0, Math.min(gameMap.width - 1, Math.floor(station.x + station.width / 2 + Math.cos(angle) * dist)));
            const ry = Math.max(0, Math.min(gameMap.height - 1, Math.floor(station.y + station.height / 2 + Math.sin(angle) * dist)));
            
            const tile = gameMap.getTile(rx, ry);
            if (tile && tile.isWalkable() && tile.contents.length === 0 && !isInsideTollGate(gameMap.metadata?.tollGate, rx, ry)) {
              const zombieId = `zombie-soldier-out-${Date.now()}-${sIdx}-${i}`;
              if (gameMap.addEntity(EntityFactory.createZombie(rx, ry, 'soldier', zombieId), rx, ry)) {
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
          const x = hX + Math.floor(gameRandom.next() * hW);
          const y = station.y + 1 + Math.floor(gameRandom.next() * (station.height - 2));
          const tile = gameMap.getTile(x, y);
          if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
            const zombieId = `zombie-mutant-${Date.now()}-${sIdx}`;
            if (gameMap.addEntity(EntityFactory.createZombie(x, y, 'mutant', zombieId), x, y)) {
              spawnedCount++;
              mutantSpawned = true;
            }
          }
          mAttempts++;
        }

        // 2. Spawn 4 other Mutant Zombies anywhere in the Lab (including the main hall)
        let otherMutantsSpawned = 0;
        let omAttempts = 0;
        while (otherMutantsSpawned < 4 && omAttempts < 150 && canSpawnMore()) {
          const x = station.x + 1 + Math.floor(gameRandom.next() * (station.width - 2));
          const y = station.y + 1 + Math.floor(gameRandom.next() * (station.height - 2));
          const tile = gameMap.getTile(x, y);
          if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
            const zombieId = `zombie-mutant-additional-${Date.now()}-${sIdx}-${otherMutantsSpawned}`;
            if (gameMap.addEntity(EntityFactory.createZombie(x, y, 'mutant', zombieId), x, y)) {
              spawnedCount++;
              otherMutantsSpawned++;
            }
          }
          omAttempts++;
        }

        // 3. Spawn 4-6 Soldier Zombies anywhere in the Lab
        const sCount = 4 + gameRandom.nextInt(0, 2);
        let spawnedForLab = 0;
        let sAttempts = 0;
        while (spawnedForLab < sCount && sAttempts < 150 && canSpawnMore()) {
          const x = station.x + 1 + Math.floor(gameRandom.next() * (station.width - 2));
          const y = station.y + 1 + Math.floor(gameRandom.next() * (station.height - 2));
          const tile = gameMap.getTile(x, y);
          if (tile && tile.terrain === 'floor' && tile.contents.length === 0) {
            const zombieId = `zombie-labsoldier-${Date.now()}-${sIdx}-${spawnedForLab}`;
            if (gameMap.addEntity(EntityFactory.createZombie(x, y, 'soldier', zombieId), x, y)) {
              spawnedCount++;
              spawnedForLab++;
            }
          }
          sAttempts++;
        }

        // 4. Spawn 2 Soldier Zombies outside the south entrance to the Lab
        const entX = station.entranceX;
        const entY = station.entranceY;
        let spawnedOutside = 0;
        let outAttempts = 0;
        while (spawnedOutside < 2 && outAttempts < 50 && canSpawnMore()) {
          const dx = gameRandom.nextInt(0, 3) - 1; // -1, 0, 1, 2
          const dy = 1 + gameRandom.nextInt(0, 2); // 1, 2, 3
          const targetX = entX + dx;
          const targetY = entY + dy;
          const tile = gameMap.getTile(targetX, targetY);
          if (tile && tile.isWalkable() && tile.contents.length === 0 && !isInsideTollGate(gameMap.metadata?.tollGate, targetX, targetY)) {
            const zombieId = `zombie-outsidesoldier-${Date.now()}-${sIdx}-${spawnedOutside}`;
            if (gameMap.addEntity(EntityFactory.createZombie(targetX, targetY, 'soldier', zombieId), targetX, targetY)) {
              spawnedCount++;
              spawnedOutside++;
            }
          }
          outAttempts++;
        }

        console.log(`[ZombieSpawner] Lab: Spawned 1 Main Hall Mutant, ${otherMutantsSpawned} Additional Mutants, ${spawnedForLab} Soldiers inside, and ${spawnedOutside} Soldiers outside`);
      }
    });

    return spawnedCount;
  }
}
