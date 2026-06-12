
/**
 * Universal Pathfinding System
 * Pure functional pathfinding utility for all entities
 * Follows UniversalGoals.md: modular, testable, serializable
 * Optimized with Min-Heap for Phase 32 performance fix.
 */
import { EntityType } from '../entities/Entity.js';
import { getNPCType } from '../entities/NPCTypes.js';

class MinHeap {
  constructor(comparator) {
    this.heap = [];
    this.comparator = comparator;
  }
  push(val) {
    this.heap.push(val);
    this.bubbleUp();
  }
  pop() {
    if (this.size() === 0) return null;
    if (this.size() === 1) return this.heap.pop();
    const top = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown();
    return top;
  }
  size() { return this.heap.length; }
  bubbleUp() {
    let index = this.heap.length - 1;
    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parentIndex]) < 0) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else break;
    }
  }
  bubbleDown() {
    let index = 0;
    while (true) {
      let left = 2 * index + 1;
      let right = 2 * index + 2;
      let smallest = index;
      if (left < this.heap.length && this.comparator(this.heap[left], this.heap[smallest]) < 0) smallest = left;
      if (right < this.heap.length && this.comparator(this.heap[right], this.heap[smallest]) < 0) smallest = right;
      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else break;
    }
  }
}

export class Pathfinding {
  /**
   * Find optimal path using A* algorithm
   * @param {GameMap} gameMap - The game map instance
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Target X coordinate
   * @param {number} endY - Target Y coordinate
   * @param {Object} options - Pathfinding options
   * @returns {Array} Array of {x, y} coordinates representing the path
   */
  static findPath(gameMap, startX, startY, endX, endY, options = {}) {
    const pathOptions = { ...options, isPathfinding: true };
    const {
      allowDiagonal = true,
      maxDistance = 1000,
      entityFilter = null,
      isZombie = false,
      debug = false
    } = pathOptions;

    if (!gameMap || !gameMap.getTile) {
      throw new Error('[Pathfinding] Invalid gameMap provided');
    }

    // Ensure target coordinates are within loaded map boundaries (Requirement 4)
    const originalEndTile = gameMap.getTile(endX, endY);
    if (endX < 0 || endX >= gameMap.width || endY < 0 || endY >= gameMap.height || !originalEndTile) {
      let clampedX = Math.max(0, Math.min(gameMap.width - 1, endX));
      let clampedY = Math.max(0, Math.min(gameMap.height - 1, endY));

      let found = false;
      const entity = options.entity || options.entityFilter;

      // Spiral outward from clamped coordinates to find the nearest walkable tile on the border
      const maxRadius = 5;
      for (let r = 0; r <= maxRadius && !found; r++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const tx = clampedX + dx;
            const ty = clampedY + dy;
            if (tx >= 0 && tx < gameMap.width && ty >= 0 && ty < gameMap.height) {
              const tile = gameMap.getTile(tx, ty);
              if (tile && this.isTileWalkable(tile, entity, pathOptions)) {
                endX = tx;
                endY = ty;
                found = true;
              }
            }
          }
        }
      }

      // If no walkable border tile is found, safely halt (return empty path)
      if (!found) {
        return [];
      }
    }

    const startTile = gameMap.getTile(startX, startY);
    const endTile = gameMap.getTile(endX, endY);

    // Only return early if startTile is unwalkable (zombie is in a wall)
    if (!this.isTileWalkable(startTile, entityFilter || pathOptions.entity, pathOptions)) return [];
    if (startX === endX && startY === endY) return [{ x: startX, y: startY }];

    const openSet = new MinHeap((a, b) => {
      if (a.f !== b.f) return a.f - b.f;
      return a.h - b.h;
    });
    
    const startNode = { 
      x: startX, 
      y: startY, 
      g: 0, 
      h: this.heuristic(startX, startY, endX, endY, allowDiagonal), 
      f: 0, 
      parent: null 
    };
    startNode.f = startNode.g + startNode.h;
    
    const closedSet = new Set();
    const openSetMap = new Map();

    openSet.push(startNode);
    openSetMap.set(`${startX},${startY}`, startNode);

    while (openSet.size() > 0) {
      const current = openSet.pop();
      if (!current) break;
      openSetMap.delete(`${current.x},${current.y}`);
      closedSet.add(`${current.x},${current.y}`);

      if (current.x === endX && current.y === endY) {
        return this.reconstructPath(current);
      }

      const neighbors = this.getNeighbors(current.x, current.y, allowDiagonal);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(neighborKey)) continue;

        const neighborTile = gameMap.getTile(neighbor.x, neighbor.y);
        if (!neighborTile) continue;
        
        const isTarget = neighbor.x === endX && neighbor.y === endY;
        const isWalkable = this.isTileWalkable(neighborTile, entityFilter || pathOptions.entity, pathOptions);
        
        // Check edge blocking
        if (this.isEdgeBlocked(gameMap, current.x, current.y, neighbor.x, neighbor.y, entityFilter || pathOptions.entity, pathOptions)) {
            continue;
        }

        // REVISE: Allow pathfinding through closed doors/windows for zombies and NPCs
        const isNPC = pathOptions.isNPC || pathOptions.entity?.type === 'npc' || (entityFilter && entityFilter.type === 'npc');
        const hasBreachableStructure = (isZombie || pathOptions.entity?.type === 'zombie' || isNPC) && neighborTile.contents.some(e => e.type === 'door' || e.type === 'window');
        
        if (!isWalkable && !hasBreachableStructure && !isTarget) continue;

        if (allowDiagonal && this.isDiagonalMove(current.x, current.y, neighbor.x, neighbor.y)) {
          if (!this.canMoveDiagonally(gameMap, current.x, current.y, neighbor.x, neighbor.y, entityFilter || pathOptions.entity, pathOptions)) continue;
        }

        const distanceFromStart = Math.abs(neighbor.x - startX) + Math.abs(neighbor.y - startY);
        if (distanceFromStart > maxDistance) continue;

        const tentativeG = current.g + this.getMovementCost(current.x, current.y, neighbor.x, neighbor.y, neighborTile, { ...pathOptions, gameMap, isPathfinding: true });
        const existingNode = openSetMap.get(neighborKey);

        if (!existingNode) {
          const newNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.heuristic(neighbor.x, neighbor.y, endX, endY, allowDiagonal),
            f: 0,
            parent: current
          };
          newNode.f = newNode.g + newNode.h;
          openSet.push(newNode);
          openSetMap.set(neighborKey, newNode);
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
        }
      }
    }

    return [];
  }

  static calculateMovementCost(gameMap, path, entity = null) {
    if (!path || path.length <= 1) return 0;
    let baseCost = 0;
    const options = {
      entity,
      isZombie: entity?.type === 'zombie',
      isNPC: entity?.type === 'npc',
      gameMap,
      isPathfinding: true
    };
    for (let i = 1; i < path.length; i++) {
        const nextTile = gameMap ? gameMap.getTile(path[i].x, path[i].y) : null;
        const cost = this.getMovementCost(path[i - 1].x, path[i - 1].y, path[i].x, path[i].y, nextTile, options);
        baseCost += cost;
    }
    const numTiles = path.length - 1;
    const bonus = Math.floor(numTiles / 5) * 0.5;
    return Math.max(0.1, baseCost - bonus);
  }

  static isPathWalkable(gameMap, path, entity = null) {
    if (!path || path.length === 0) return false;
    for (let i = 0; i < path.length; i++) {
      const point = path[i];
      const tile = gameMap.getTile(point.x, point.y);
      if (!tile || !this.isTileWalkable(tile, entity, { ignoreZombies: true })) return false;
      
      // Check edge collision
      if (i > 0) {
        const prev = path[i - 1];
        if (this.isEdgeBlocked(gameMap, prev.x, prev.y, point.x, point.y, entity, { ignoreZombies: true })) return false;
      }
    }
    return true;
  }

  static getReachableTiles(gameMap, startX, startY, maxCost, options = {}) {
    const reachable = [];
    const visited = new Set();
    const queue = [{ x: startX, y: startY, cost: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (current.cost > 0) {
        reachable.push({ x: current.x, y: current.y, cost: current.cost });
      }

      const neighbors = this.getNeighbors(current.x, current.y, options.allowDiagonal || false);
      for (const neighbor of neighbors) {
        const neighborTile = gameMap.getTile(neighbor.x, neighbor.y);
        if (!neighborTile || !this.isTileWalkable(neighborTile, options.entityFilter || options.entity, options)) continue;

        if (this.isEdgeBlocked(gameMap, current.x, current.y, neighbor.x, neighbor.y, options.entityFilter || options.entity, options)) continue;

        const moveCost = this.getMovementCost(current.x, current.y, neighbor.x, neighbor.y, neighborTile, { ...options, gameMap, isPathfinding: true });
        const totalCost = current.cost + moveCost;

        if (totalCost <= maxCost && !visited.has(`${neighbor.x},${neighbor.y}`)) {
          queue.push({ x: neighbor.x, y: neighbor.y, cost: totalCost });
        }
      }
    }
    return reachable;
  }

  static heuristic(x1, y1, x2, y2, allowDiagonal = false) {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    if (allowDiagonal) return Math.max(dx, dy);
    return dx + dy;
  }

  static getMovementCost(x1, y1, x2, y2, targetTile = null, options = {}) {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    let baseCost = 1;
    if (dx === 1 && dy === 1) baseCost = 1.4; // 1.4 is sqrt(2), the true diagonal distance

    if (targetTile && targetTile.contents && Array.isArray(targetTile.contents)) {
      const window = targetTile.contents.find(e => e.type === EntityType.WINDOW);
      if (window) {
        if (options?.isZombie) {
          baseCost = window.isBroken ? 1.0 : 2.0;
        } else {
          baseCost += 1;
        }
      }

      if (options?.isZombie || options?.entity?.type === 'zombie') {
        if (options.isPathfinding && options.gameMap) {
          const structure = this.getBlockingStructure(options.gameMap, x1, y1, x2, y2);
          if (structure) {
            const isClosed = (structure.type === 'door' && !structure.isOpen) || 
                            (structure.type === 'window' && !structure.isOpen && !structure.isBroken);
            if (isClosed) {
              baseCost += 1.0; // Minimal penalty so they prefer an open path if it's identical distance, but won't path around the building
            }
          }
        }
        const hasOtherZombie = targetTile.contents.some(e => e.type === 'zombie');
        if (hasOtherZombie) baseCost += 0.2; // Tiny penalty to allow clustering
      }

      const isNPC = options?.isNPC || options?.entity?.type === 'npc';
      if (isNPC) {
        if (options.isPathfinding && options.gameMap) {
          const structure = this.getBlockingStructure(options.gameMap, x1, y1, x2, y2);
          if (structure) {
            if (structure.type === EntityType.DOOR && !structure.isOpen) {
              baseCost += structure.isLocked ? 2 : 1;
            } else if (structure.type === EntityType.WINDOW && !structure.isOpen && !structure.isBroken) {
              baseCost += structure.isLocked ? 2 : 1;
            }
          }
        }
      }

      const npc = options.entity;
      // Add path cost penalty for tiles close to known threats in memory
      if (options.isPathfinding && npc && npc.recentThreats && npc.recentThreats.length > 0) {
          const typeDef = getNPCType(npc.typeId);
          const dangerRadius = typeDef?.ai?.dangerRadius || 8;
          const memoryDangerRadius = Math.max(3, dangerRadius - 1);
          let minDistance = Infinity;
          let activeRadius = dangerRadius;
          for (const threat of npc.recentThreats) {
            const dx = x2 - threat.x;
            const dy = y2 - threat.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const isVisible = options.gameMap && typeof npc.canSeePosition === 'function' && npc.canSeePosition(options.gameMap, threat.x, threat.y);
            const radius = isVisible ? dangerRadius : memoryDangerRadius;
            if (dist <= radius && dist < minDistance) {
              minDistance = dist;
              activeRadius = radius;
            }
          }
          if (minDistance <= activeRadius) {
            // Significant penalty: closer to threat means higher cost
            baseCost += (activeRadius + 1 - minDistance) * 5.0;
          }
      }
    }
    return baseCost;
  }

  static getNeighbors(x, y, allowDiagonal = false) {
    const neighbors = [{ x: x + 1, y: y }, { x: x - 1, y: y }, { x: x, y: y + 1 }, { x: x, y: y - 1 }];
    if (allowDiagonal) {
      neighbors.push({ x: x + 1, y: y + 1 }, { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }, { x: x - 1, y: y - 1 });
    }
    return neighbors;
  }

  static isTileWalkable(tile, entityOrFilter = null, options = {}) {
    if (entityOrFilter && typeof entityOrFilter === 'function') return entityOrFilter(tile);
    
    const isZombie = options.isZombie || (entityOrFilter && (entityOrFilter.type === 'zombie' || entityOrFilter.type === EntityType.ZOMBIE));
    const isNPC = options.isNPC || (entityOrFilter && (entityOrFilter.type === 'npc' || entityOrFilter.type === EntityType.NPC));
    
    // SAFETY: If we are checking the entity's current position, it MUST be walkable
    // (Prevents being stuck if a door closes on the zombie's current tile)
    if (entityOrFilter && tile.x === entityOrFilter.logicalX && tile.y === entityOrFilter.logicalY) {
        return true;
    }

    // For zombies and NPCs, we allow them to "path" through closed doors/windows so they can approach to attack/open them
    if ((isZombie || isNPC) && options.isPathfinding) {
        options.allowBreaching = true;
    }
    
    return tile.isWalkable(entityOrFilter, options);
  }

  static isDiagonalMove(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) === 1 && Math.abs(y1 - y2) === 1;
  }

  static canMoveDiagonally(gameMap, x1, y1, x2, y2, entityOrFilter = null, options = {}) {
    // Diagonal moves cannot breach/bypass closed structures or cut corner walls
    const diagOptions = { ...options, allowBreaching: false, isPathfinding: false };

    // Check edge boundaries first (you can't squeeze through diagonal walls)
    if (this.isEdgeBlocked(gameMap, x1, y1, x1, y2, entityOrFilter, diagOptions) || 
        this.isEdgeBlocked(gameMap, x1, y1, x2, y1, entityOrFilter, diagOptions) ||
        this.isEdgeBlocked(gameMap, x1, y2, x2, y2, entityOrFilter, diagOptions) ||
        this.isEdgeBlocked(gameMap, x2, y1, x2, y2, entityOrFilter, diagOptions)) return false;

    const tile1 = gameMap.getTile(x1, y2);
    const tile2 = gameMap.getTile(x2, y1);
    const tile1Walkable = tile1 && this.isTileWalkable(tile1, entityOrFilter, diagOptions);
    const tile2Walkable = tile2 && this.isTileWalkable(tile2, entityOrFilter, diagOptions);
    
    // BOTH corners must be walkable for a clean diagonal pass
    return !!(tile1Walkable && tile2Walkable);
  }

  static isEdgeBlocked(gameMap, x1, y1, x2, y2, entity = null, options = {}) {
    // Diagonal moves are not checked by this directly, but caller enforces diagonal logic
    if (Math.abs(x1 - x2) > 0 && Math.abs(y1 - y2) > 0) return false; 

    const tile1 = gameMap.getTile(x1, y1);
    const tile2 = gameMap.getTile(x2, y2);
    if (!tile1 || !tile2) return true;

    let dir1to2 = null;
    let dir2to1 = null;
    if (x2 > x1) { dir1to2 = 'e'; dir2to1 = 'w'; }
    else if (x2 < x1) { dir1to2 = 'w'; dir2to1 = 'e'; }
    else if (y2 > y1) { dir1to2 = 's'; dir2to1 = 'n'; }
    else if (y2 < y1) { dir1to2 = 'n'; dir2to1 = 's'; }

    if (!dir1to2) return false;

    const wallBlocks = (tile1.edgeWalls && tile1.edgeWalls[dir1to2]) || (tile2.edgeWalls && tile2.edgeWalls[dir2to1]);
    
    if (wallBlocks) {
      const isZombie = options.isZombie || (entity && typeof entity !== 'function' && entity.type === 'zombie');
      const isNPC = entity && typeof entity !== 'function' && entity.type === 'npc';
      const isPlayer = !isZombie && !isNPC;

      const breachable1 = tile1.contents.filter(e => (e.type === 'door' || e.type === 'window' || e.type === EntityType.DOOR || e.type === EntityType.WINDOW) && (!e.edge || e.edge === dir1to2));
      const breachable2 = tile2.contents.filter(e => (e.type === 'door' || e.type === 'window' || e.type === EntityType.DOOR || e.type === EntityType.WINDOW) && (!e.edge || e.edge === dir2to1));
      
      const allBreachable = [...breachable1, ...breachable2];
      
      // If there is no door/window, the edge is solid
      if (allBreachable.length === 0) return true;

      for (const e of allBreachable) {
         if (e.type === 'window' && isPlayer) {
             // Windows are ALWAYS blocked for players (unwalkable)
             continue;
         }
         if (e.isOpen || e.isBroken || e.isDamaged || ((isZombie || isNPC) && options.isPathfinding) || options.allowBreaching) {
             return false; // Can pass through
         }
      }
      return true; // Blocked by closed structure
    }

    return false;
  }

  static getBlockingStructure(gameMap, x1, y1, x2, y2) {
    const tile1 = gameMap.getTile(x1, y1);
    const tile2 = gameMap.getTile(x2, y2);
    if (!tile1 || !tile2) return null;

    // Check full-tile structures on target tile
    const fullTileStructure = tile2.contents.find(e => 
      (((e.type === EntityType.DOOR || e.type === 'door') && !e.isOpen && !e.isDamaged && !e.isBroken) || 
       ((e.type === EntityType.WINDOW || e.type === 'window') && (e.isReinforced || (!e.isBroken && !e.isOpen)))) && 
      !e.edge
    );
    if (fullTileStructure) return fullTileStructure;

    // Check edge structures between tile1 and tile2
    let dir1to2 = null;
    let dir2to1 = null;
    if (x2 > x1) { dir1to2 = 'e'; dir2to1 = 'w'; }
    else if (x2 < x1) { dir1to2 = 'w'; dir2to1 = 'e'; }
    else if (y2 > y1) { dir1to2 = 's'; dir2to1 = 'n'; }
    else if (y2 < y1) { dir1to2 = 'n'; dir2to1 = 's'; }

    if (dir1to2) {
      const breachable1 = tile1.contents.filter(e => (e.type === EntityType.DOOR || e.type === EntityType.WINDOW || e.type === 'door' || e.type === 'window') && (!e.edge || e.edge === dir1to2));
      const breachable2 = tile2.contents.filter(e => (e.type === EntityType.DOOR || e.type === EntityType.WINDOW || e.type === 'door' || e.type === 'window') && (!e.edge || e.edge === dir2to1));
      
      const allBreachable = [...breachable1, ...breachable2];
      for (const e of allBreachable) {
        if (((e.type === EntityType.DOOR || e.type === 'door') && !e.isOpen && !e.isDamaged && !e.isBroken) || 
            ((e.type === EntityType.WINDOW || e.type === 'window') && (e.isReinforced || (!e.isBroken && !e.isOpen)))) {
          return e;
        }
      }
    }
    return null;
  }

  static reconstructPath(node) {
    const path = [];
    let current = node;
    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }
    return path;
  }

  static serializePath(gameMap, path) {
    return {
      path: path.map(point => ({ x: point.x, y: point.y })),
      length: path.length,
      cost: this.calculateMovementCost(gameMap, path),
      generated: new Date().toISOString()
    };
  }

  static deserializePath(data) {
    return data.path || [];
  }
}
