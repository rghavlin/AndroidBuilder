
/**
 * Universal Pathfinding System
 * Pure functional pathfinding utility for all entities
 * Follows UniversalGoals.md: modular, testable, serializable
 * Optimized with Min-Heap for Phase 32 performance fix.
 */
import { EntityType } from '../entities/Entity.js';

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
    const {
      allowDiagonal = true,
      maxDistance = 1000,
      entityFilter = null,
      isZombie = false,
      debug = false
    } = options;

    if (!gameMap || !gameMap.getTile) {
      throw new Error('[Pathfinding] Invalid gameMap provided');
    }

    const startTile = gameMap.getTile(startX, startY);
    const endTile = gameMap.getTile(endX, endY);

    // Only return early if startTile is unwalkable (zombie is in a wall)
    if (!this.isTileWalkable(startTile, entityFilter || options.entity, options)) return [];
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
        const isWalkable = this.isTileWalkable(neighborTile, entityFilter || options.entity, options);
        
        // Check edge blocking
        if (this.isEdgeBlocked(gameMap, current.x, current.y, neighbor.x, neighbor.y, entityFilter || options.entity, options)) {
            continue;
        }

        // REVISE: Allow pathfinding through closed doors/windows for zombies
        const hasBreachableStructure = (isZombie || options.entity?.type === 'zombie') && neighborTile.contents.some(e => e.type === 'door' || e.type === 'window');
        
        if (!isWalkable && !hasBreachableStructure && !isTarget) continue;

        if (allowDiagonal && this.isDiagonalMove(current.x, current.y, neighbor.x, neighbor.y)) {
          if (!this.canMoveDiagonally(gameMap, current.x, current.y, neighbor.x, neighbor.y, entityFilter || options.entity, options)) continue;
        }

        const distanceFromStart = Math.abs(neighbor.x - startX) + Math.abs(neighbor.y - startY);
        if (distanceFromStart > maxDistance) continue;

        const tentativeG = current.g + this.getMovementCost(current.x, current.y, neighbor.x, neighbor.y, neighborTile, { ...options, isPathfinding: true });
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
    for (let i = 1; i < path.length; i++) {
        const nextTile = gameMap ? gameMap.getTile(path[i].x, path[i].y) : null;
        const cost = this.getMovementCost(path[i - 1].x, path[i - 1].y, path[i].x, path[i].y, nextTile, entity);
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

        const moveCost = this.getMovementCost(current.x, current.y, neighbor.x, neighbor.y, neighborTile, { ...options, isPathfinding: true });
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
        const structure = targetTile.contents.find(e => e.type === 'door' || e.type === 'window');
        if (structure) {
          const isClosed = (structure.type === 'door' && !structure.isOpen) || 
                          (structure.type === 'window' && !structure.isOpen && !structure.isBroken);
          if (isClosed) {
            const hp = (structure.hp !== undefined ? structure.hp : 0) + (structure.reinforcementHp || 0);
            baseCost += hp > 0 ? hp : (structure.maxHp || 1);
          }
        }
        const hasOtherZombie = targetTile.contents.some(e => e.type === 'zombie');
        if (hasOtherZombie) baseCost += 0.2; // Tiny penalty to allow clustering
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
    
    // SAFETY: If we are checking the entity's current position, it MUST be walkable
    // (Prevents being stuck if a door closes on the zombie's current tile)
    if (entityOrFilter && tile.x === entityOrFilter.logicalX && tile.y === entityOrFilter.logicalY) {
        return true;
    }

    // For zombies, we allow them to "path" through closed doors/windows so they can approach to attack them
    if (isZombie && options.isPathfinding) {
        options.allowBreaching = true;
    }
    
    return tile.isWalkable(entityOrFilter, options);
  }

  static isDiagonalMove(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) === 1 && Math.abs(y1 - y2) === 1;
  }

  static canMoveDiagonally(gameMap, x1, y1, x2, y2, entityOrFilter = null, options = {}) {
    // Check edge boundaries first (you can't squeeze through diagonal walls)
    if (this.isEdgeBlocked(gameMap, x1, y1, x1, y2, entityOrFilter, options) || 
        this.isEdgeBlocked(gameMap, x1, y1, x2, y1, entityOrFilter, options) ||
        this.isEdgeBlocked(gameMap, x1, y2, x2, y2, entityOrFilter, options) ||
        this.isEdgeBlocked(gameMap, x2, y1, x2, y2, entityOrFilter, options)) return false;

    const tile1 = gameMap.getTile(x1, y2);
    const tile2 = gameMap.getTile(x2, y1);
    const tile1Walkable = tile1 && this.isTileWalkable(tile1, entityOrFilter, options);
    const tile2Walkable = tile2 && this.isTileWalkable(tile2, entityOrFilter, options);
    
    // If BOTH corners are walkable, it's clear.
    if (tile1Walkable && tile2Walkable) return true;

    // RELAXED: If one corner is a BREACHABLE structure, allow the diagonal move.
    // This allows zombies to "turn the corner" of a building window/door.
    const isZombie = (entityOrFilter && entityOrFilter.type === 'zombie');
    if (isZombie) {
        const t1Breachable = tile1 && tile1.contents.some(e => e.type === 'door' || e.type === 'window');
        const t2Breachable = tile2 && tile2.contents.some(e => e.type === 'door' || e.type === 'window');
        if ((tile1Walkable && t2Breachable) || (tile2Walkable && t1Breachable)) return true;
    }

    return false;
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

      const breachable1 = tile1.contents.filter(e => (e.type === 'door' || e.type === 'window') && e.edge === dir1to2);
      const breachable2 = tile2.contents.filter(e => (e.type === 'door' || e.type === 'window') && e.edge === dir2to1);
      
      const allBreachable = [...breachable1, ...breachable2];
      
      // If there is no door/window, the edge is solid
      if (allBreachable.length === 0) return true;

      // If there is a door/window, check if it allows passage
      for (const e of allBreachable) {
         if (e.type === 'window' && isPlayer) {
             // Windows are ALWAYS blocked for players (unwalkable)
             continue;
         }
         if (e.isOpen || e.isBroken || (isZombie && options.isPathfinding) || options.allowBreaching) {
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
      ((e.type === EntityType.DOOR && !e.isOpen) || 
       (e.type === EntityType.WINDOW && (e.isReinforced || (!e.isBroken && !e.isOpen)))) && 
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
      const breachable1 = tile1.contents.filter(e => (e.type === EntityType.DOOR || e.type === EntityType.WINDOW) && e.edge === dir1to2);
      const breachable2 = tile2.contents.filter(e => (e.type === EntityType.DOOR || e.type === EntityType.WINDOW) && e.edge === dir2to1);
      
      const allBreachable = [...breachable1, ...breachable2];
      for (const e of allBreachable) {
        if ((e.type === EntityType.DOOR && !e.isOpen) || 
            (e.type === EntityType.WINDOW && (e.isReinforced || (!e.isBroken && !e.isOpen)))) {
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
