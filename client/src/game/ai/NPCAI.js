import { EntityType } from '../entities/Entity.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import { LineOfSight } from '../utils/LineOfSight.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';
import { ItemDefs } from '../inventory/ItemDefs.js';

/**
 * NPCAI - Handles decision making for NPCs
 */
export class NPCAI {
  /**
   * Execute NPC turn logic
   */
  static executeNPCTurn(npc, gameMap, player, zombies = [], skipAPReset = false) {
    if (!npc || npc.hp <= 0) return { success: false };

    const turnResult = {
      npcId: npc.id,
      actions: [],
      apUsed: 0,
      success: true
    };

    try {
      // 1. Behavior State Logic
      let safetyCounter = 0;
      while (npc.ap >= 1.0 && safetyCounter < 20) {
        safetyCounter++;

        // Priority 1: Escape if already extorted the player
        if (npc.behaviorState === 'escaping') {
          if (this.processEscape(npc, gameMap, zombies, turnResult)) {
            continue;
          } else {
            break;
          }
        }

        // Priority 2: Hostile interaction with player
        if (npc.isHostile) {
          if (this.processHostileBehavior(npc, gameMap, player, zombies, turnResult)) {
            continue;
          }
        }

        // Priority 3: Defend against zombies (Counter-attack)
        if (this.processZombieCombat(npc, gameMap, player, zombies, turnResult)) {
          continue;
        }

        // Priority 4: Stationary/Idle (No wandering)
        break; 
      }

    } catch (error) {
      console.error(`[NPCAI] Error in turn for ${npc.id}:`, error);
    }

    npc.ap = Math.max(0, npc.ap); // Ensure no negative AP
    turnResult.apUsed = npc.maxAp - npc.ap;
    turnResult.success = true;
    return turnResult;
  }

  /**
   * Process hostile behavior towards player
   */
  static processHostileBehavior(npc, gameMap, player, zombies, turnResult) {
    if (npc.hasExtorted) return false;
    if (npc.wasAttackedThisTurn) npc.behaviorState = 'attacking';
    
    const dist = Math.abs(npc.logicalX - player.logicalX) + Math.abs(npc.logicalY - player.logicalY);
    const canSee = LineOfSight.hasLineOfSight(gameMap, npc.logicalX, npc.logicalY, player.logicalX, player.logicalY, { maxRange: 20 }).hasLineOfSight;
    const isAggressive = npc.behaviorState === 'attacking' || npc.behaviorState === 'demanding';

    // Broaden awareness: pursuit if canSee OR if already aggressive OR if within 20 tiles (for hostile NPCs)
    if (!canSee && !isAggressive && dist > 20) {
      return false;
    }

    // Adjacent -> Demand or Attack
    if (dist === 1) {
      if (!npc.hasDemanded) {
        // Trigger Demand
        npc.behaviorState = 'demanding';
        turnResult.actions.push({ 
          type: 'DEMAND', 
          entityId: npc.id, 
          data: { x: npc.logicalX, y: npc.logicalY } 
        });
        return false; // Break loop but preserve AP
      } else if (npc.hasDemanded && !npc.hasExtorted) {
        // Refused or just attacking
        npc.behaviorState = 'attacking';
        return this.performAttack(npc, player, turnResult);
      }
    } else if (npc.hasDemanded && !npc.hasExtorted) {
      // Ranged attack check
      const weapon = npc.getEquippedWeapon();
      const isRanged = weapon && (ItemDefs[weapon.defId]?.rangedStats || weapon.rangedStats);
      
      if (isRanged && dist <= 8 && canSee) {
        npc.behaviorState = 'attacking';
        return this.performAttack(npc, player, turnResult);
      }
    }
    
    // Not adjacent -> Approach
    if (npc.ap >= 1.0) {
      const path = Pathfinding.findPath(gameMap, npc.logicalX, npc.logicalY, player.logicalX, player.logicalY, {
        allowDiagonal: false,
        entityFilter: (tile) => {
          // Allow pathing to tiles with the player
          if (tile.contents.some(e => e.type === EntityType.PLAYER)) return true;
          // Standard walkability
          return tile.isWalkable();
        }
      });

      if (path && path.length > 1) {
        const nextStep = path[1];
        // Check for doors/windows
        const tile = gameMap.getTile(nextStep.x, nextStep.y);
        const door = tile.contents.find(e => e.type === EntityType.DOOR);
        if (door && !door.isOpen) {
          if (npc.ap >= 2.0) {
            door.open();
            npc.useAP(2.0);
            turnResult.actions.push({ 
              type: 'STRUCTURE_INTERACT', 
              entityId: npc.id, 
              data: { x: nextStep.x, y: nextStep.y, interaction: 'open_door' } 
            });
            return true;
          }
          return false;
        }

        const fromPos = { x: npc.logicalX, y: npc.logicalY };
        const apCost = (nextStep.x !== npc.logicalX && nextStep.y !== npc.logicalY) ? 1.4 : 1.0;
        if (npc.ap >= apCost && gameMap.moveEntity(npc.id, nextStep.x, nextStep.y, { snap: false })) {
          npc.useAP(apCost);
          
          if (!npc.movementPath || npc.movementPath.length === 0) {
            npc.movementPath = [{ x: fromPos.x, y: fromPos.y }]; // Ensure starting position is recorded
          }
          npc.movementPath.push({ x: nextStep.x, y: nextStep.y });
          
          turnResult.actions.push({ 
            type: 'MOVE', 
            entityId: npc.id, 
            data: { from: fromPos, to: { x: nextStep.x, y: nextStep.y } } 
          });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Process escape behavior
   */
  static processEscape(npc, gameMap, zombies, turnResult) {
    // Check if reached edge
    if (npc.logicalY === 0 || npc.logicalY === gameMap.height - 1) {
      gameMap.removeEntity(npc.id);
      turnResult.actions.push({ 
        type: 'ESCAPE', 
        entityId: npc.id, 
        data: { x: npc.logicalX, y: npc.logicalY } 
      });
      return false;
    }

    // Check for counter-attack
    if (npc.wasAttackedThisTurn) {
      const adjacentZombie = zombies.find(z => Math.abs(z.logicalX - npc.logicalX) + Math.abs(z.logicalY - npc.logicalY) === 1);
      if (adjacentZombie) {
        this.performAttack(npc, adjacentZombie, turnResult);
        return true;
      }
    }

    // Pathfind to nearest edge
    const targetY = (npc.logicalY < gameMap.height / 2) ? 0 : gameMap.height - 1;
    // Find a walkable tile on that edge
    let targetX = npc.logicalX;
    for (let offset = 0; offset < gameMap.width; offset++) {
        if (gameMap.getTile(npc.logicalX + offset, targetY)?.isWalkable()) { targetX = npc.logicalX + offset; break; }
        if (gameMap.getTile(npc.logicalX - offset, targetY)?.isWalkable()) { targetX = npc.logicalX - offset; break; }
    }

    const path = Pathfinding.findPath(gameMap, npc.logicalX, npc.logicalY, targetX, targetY, { canOpenDoors: true });
    if (path && path.length > 1) {
      const nextStep = path[1];
      const fromPos = { x: npc.logicalX, y: npc.logicalY };
      const apCost = (nextStep.x !== npc.logicalX && nextStep.y !== npc.logicalY) ? 1.4 : 1.0;
      if (npc.ap >= apCost && gameMap.moveEntity(npc.id, nextStep.x, nextStep.y, { snap: false })) {
        npc.useAP(apCost);
        
        if (!npc.movementPath || npc.movementPath.length === 0) {
          npc.movementPath = [{ x: fromPos.x, y: fromPos.y }]; // Ensure starting position is recorded
        }
        npc.movementPath.push({ x: nextStep.x, y: nextStep.y });
        
        turnResult.actions.push({ 
          type: 'MOVE', 
          entityId: npc.id, 
          data: { from: fromPos, to: { x: nextStep.x, y: nextStep.y } } 
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Process zombie combat (non-escaping)
   */
  static processZombieCombat(npc, gameMap, player, zombies, turnResult) {
    const weapon = npc.getEquippedWeapon();
    const isRanged = weapon && (ItemDefs[weapon.defId]?.rangedStats || weapon.rangedStats);

    // 1. Ranged attack within 5 squares
    if (isRanged) {
      const targetZombie = zombies.find(z => {
        const dist = Math.sqrt(Math.pow(z.logicalX - npc.logicalX, 2) + Math.pow(z.logicalY - npc.logicalY, 2));
        return dist <= 5 && LineOfSight.hasLineOfSight(gameMap, npc.logicalX, npc.logicalY, z.logicalX, z.logicalY).hasLineOfSight;
      });

      if (targetZombie) {
        return this.performAttack(npc, targetZombie, turnResult);
      }
    }

    // 2. Melee counter-attack if hit
    if (npc.wasAttackedThisTurn) {
      // Check for adjacent player first
      const distToPlayer = Math.abs(npc.logicalX - player.logicalX) + Math.abs(npc.logicalY - player.logicalY);
      if (distToPlayer === 1) {
        return this.performAttack(npc, player, turnResult);
      }

      const adjacentZombie = zombies.find(z => Math.abs(z.logicalX - npc.logicalX) + Math.abs(z.logicalY - npc.logicalY) === 1);
      if (adjacentZombie) {
        return this.performAttack(npc, adjacentZombie, turnResult);
      }
    }

    return false;
  }

  /**
   * Perform an attack on a target
   */
  static performAttack(npc, target, turnResult) {
    const weapon = npc.getEquippedWeapon();
    const weaponDef = weapon ? ItemDefs[weapon.defId] : null;
    const isRanged = weaponDef?.rangedStats || weapon?.rangedStats;
    const apCost = isRanged ? 2.0 : 1.0;

    if (npc.ap < apCost) return false;

    npc.useAP(apCost);

    // Accuracy calculation (simplified for NPC)
    const baseAccuracy = isRanged ? 0.5 : 0.6;
    const hit = Math.random() < baseAccuracy;
    let damage = 0;

    if (hit) {
      const damageRange = isRanged ? (weaponDef?.rangedStats?.damage || weapon?.rangedStats?.damage) : (weaponDef?.damage || weapon?.damage || { min: 1, max: 3 });
      damage = Math.floor(Math.random() * (damageRange.max - damageRange.min + 1)) + damageRange.min;
    }
      
    // Phase 1 Action Serialization: Damage and events are deferred to TurnManager playback
    // target.takeDamage and GameEvents.emit removed here

    turnResult.actions.push({
      type: 'ATTACK',
      entityId: npc.id,
      data: {
        targetId: target.id,
        targetType: target.type,
        success: hit,
        damage,
        from: { x: npc.logicalX, y: npc.logicalY },
        to: { x: target.logicalX || target.x, y: target.logicalY || target.y }
      }
    });

    return true;
  }
}
