import { EntityFactory } from '../EntityFactory.js';
import { gameRandom } from '../utils/SeededRandom.js';
import { MAX_VISION_RANGE } from '../config/VisionConfig.js';
import { isInsideTollGate, isInStartArea } from '../map/MapUtils.js';
import engine from '../GameEngine.js';
import Logger from '../utils/Logger.js';

const logger = Logger.scope('ZombieReplenishment');

export class ZombieReplenishmentSystem {
  /**
   * Main tick entry called on map turns (including sleep/catch-up)
   * @param {GameMap} gameMap 
   * @param {Player} player 
   * @param {WorldManager} worldManager 
   * @param {number} currentTurn 
   */
  static processTurn(gameMap, player, worldManager, currentTurn) {
    const wm = worldManager || engine?.worldManager;
    if (!gameMap || !player || !wm) {
      logger.debug('Missing engine or map context');
      return;
    }

    const mapId = wm.currentMapId;
    if (!mapId) {
      logger.debug('Missing currentMapId');
      return;
    }

    const entryTurn = wm.firstEntryTurn[mapId] || 1;
    const turnsOnMap = currentTurn - entryTurn;
    logger.debug(`mapId: ${mapId}, entryTurn: ${entryTurn}, currentTurn: ${currentTurn}, turnsOnMap: ${turnsOnMap}`);

    // 1. Turn Gate: countdown starts when player first enters the map.
    // Zombie spawning begins at turn 25 (24 turns after entry).
    if (turnsOnMap < 24) {
      logger.debug('Gated by turn count (less than 25 turns on map)');
      return;
    }

    // 2. Cap Gate: no more zombies than original starting total
    const liveZombies = gameMap.getEntitiesByType('zombie') || [];
    const maxZombies = wm.zombiesInitialCount?.[mapId] ?? wm.zombiesSpawned[mapId] ?? 0;
    logger.debug(`liveZombies: ${liveZombies.length}, maxZombies (cap): ${maxZombies}`);
    if (liveZombies.length >= maxZombies) {
      logger.debug('Gated by cap (map has maximum allowed zombies)');
      return;
    }

    // 3. Candidate Pool Search:
    // Finds explored, walkable, empty tiles outside player's maximum sight range
    const visibleKeys = new Set((engine.playerFieldOfView || []).map(t => `${t.x},${t.y}`));
    const tollGate = gameMap.metadata?.tollGate;
    const candidates = [];

    for (let x = 0; x < gameMap.width; x++) {
      for (let y = 0; y < gameMap.height; y++) {
        const tile = gameMap.getTile(x, y);
        if (!tile || !tile.flags.explored || !tile.isWalkable() || tile.contents.length > 0) {
          continue;
        }
        if (isInsideTollGate(tollGate, x, y)) continue;

        // Distance check (Euclidean distance matching vision system)
        const dx = x - player.x;
        const dy = y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Exclude within player's max vision range (distance + line of sight safety check)
        if (dist <= MAX_VISION_RANGE || visibleKeys.has(`${x},${y}`)) {
          continue;
        }

        candidates.push(tile);
      }
    }

    logger.debug(`Found ${candidates.length} candidate sample tiles.`);
    if (candidates.length === 0) {
      logger.debug('Gated by empty candidate pool (no explored, out-of-sight tiles)');
      return;
    }

    // 4. Sector-based Variety (3x3 grid)
    if (!wm.lastReplenishSector) {
      wm.lastReplenishSector = {};
    }

    const playerSectorX = Math.floor(player.x / (gameMap.width / 3));
    const playerSectorY = Math.floor(player.y / (gameMap.height / 3));
    const playerSectorId = playerSectorY * 3 + playerSectorX;
    const lastSectorId = wm.lastReplenishSector[mapId];

    // Filter to avoid player's sector and the last spawned sector
    let targetPool = candidates.filter(tile => {
      const sx = Math.floor(tile.x / (gameMap.width / 3));
      const sy = Math.floor(tile.y / (gameMap.height / 3));
      const sId = sy * 3 + sx;
      return sId !== playerSectorId && sId !== lastSectorId;
    });

    // Fallbacks if constraints are too restrictive
    if (targetPool.length === 0) {
      targetPool = candidates.filter(tile => {
        const sx = Math.floor(tile.x / (gameMap.width / 3));
        const sy = Math.floor(tile.y / (gameMap.height / 3));
        const sId = sy * 3 + sx;
        return sId !== playerSectorId;
      });
    }
    if (targetPool.length === 0) {
      targetPool = candidates;
    }

    // 5. Spawn Zombie
    const spawnTile = targetPool[Math.floor(gameRandom.next() * targetPool.length)];

    // Weighted Subtype Probability (no mutants)
    const roll = gameRandom.next();
    let subtype = 'basic';
    if (roll < 0.60) {
      subtype = 'basic';
    } else if (roll < 0.70) {
      subtype = 'runner';
    } else if (roll < 0.80) {
      subtype = 'peeper';
    } else if (roll < 0.88) {
      subtype = 'crawler';
    } else if (roll < 0.93) {
      subtype = 'fat';
    } else if (roll < 0.96) {
      subtype = 'acid';
    } else if (roll < 0.98) {
      subtype = 'spitter';
    } else if (roll < 0.99) {
      subtype = 'swat';
    } else {
      subtype = 'firefighter';
    }

    if (isInStartArea(gameMap, spawnTile.x, spawnTile.y)) {
      if (gameRandom.next() < 0.40) {
        logger.info(`Replenishment skipped in starting area to reduce density.`);
        return;
      }
      if (subtype !== 'basic' && subtype !== 'crawler') {
        subtype = 'basic';
      }
    }

    const zombieId = `zombie-${subtype}-${Date.now()}-replenish`;
    const zombie = EntityFactory.createZombie(spawnTile.x, spawnTile.y, subtype, zombieId);

    if (gameMap.addEntity(zombie, spawnTile.x, spawnTile.y)) {
      wm.recordZombieSpawn(mapId);
      const finalSx = Math.floor(spawnTile.x / (gameMap.width / 3));
      const finalSy = Math.floor(spawnTile.y / (gameMap.height / 3));
      wm.lastReplenishSector[mapId] = finalSy * 3 + finalSx;
      logger.info(`Spawned ${subtype} zombie at (${spawnTile.x}, ${spawnTile.y}) on turn ${currentTurn}`);
    }
  }
}

