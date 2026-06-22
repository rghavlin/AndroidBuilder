import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';
import audioManager from '../utils/AudioManager.js';
import { EntityType } from '../entities/Entity.js';
import engine from '../GameEngine.js';

/**
 * TurnManager - Orchestrates the sequential playback of game actions.
 * Ensures animations are locked and audio is synchronized.
 */
class TurnManager {
  constructor() {
    this.isProcessing = false;
    this.actionDelay = 20; // Reduced from 100ms for snappier feel
    this.shouldCancel = false;
  }

  /**
   * Immediately stop any current turn playback.
   */
  cancelPlayback() {
    console.log('[TurnManager] 🛑 Cancellation requested - stopping playback loop');
    this.shouldCancel = true;
  }

  /**
   * Process a queue of actions sequentially.
   * @param {Array} actionQueue - Array of GameAction objects
   * @param {Object} context - Game context (gameMap, player, etc.)
   */
    async processQueue(actionQueue, context) {
    if (this.isProcessing) {
      console.warn('[TurnManager] ⚠️ ABORTING processQueue: Already processing actions.');
      return;
    }

    if (!actionQueue || actionQueue.length === 0) {
      console.log('[TurnManager] 💤 Nothing to process (empty queue)');
      return;
    }

    this.isProcessing = true;
    this.shouldCancel = false;
    this.flashedEntityIds = new Set();
    const startTime = performance.now();
    console.log(`[TurnManager] 🎬 START TURN PLAYBACK (${actionQueue.length} actions)`);

    try {
      let i = 0;
      while (i < actionQueue.length) {
        if (this.shouldCancel) break;
        const action = actionQueue[i];
        if (!action) { i++; continue; }

        // Group consecutive MOVE actions for parallel playback
        if (action.type === 'MOVE') {
          const moveBatch = [];
          while (i < actionQueue.length && actionQueue[i] && actionQueue[i].type === 'MOVE') {
            moveBatch.push(actionQueue[i]);
            i++;
          }
          
          console.log(`[TurnManager] 🏃 Parallelizing batch of ${moveBatch.length} MOVE actions`);
          
          // Group by entityId to ensure sequential movement for each individual entity
          const entityMoveGroups = {};
          moveBatch.forEach(move => {
            if (!entityMoveGroups[move.entityId]) {
              entityMoveGroups[move.entityId] = [];
            }
            entityMoveGroups[move.entityId].push(move);
          });

          // Play all entity sequences in parallel
          await Promise.all(Object.values(entityMoveGroups).map(async (group) => {
            for (const moveAction of group) {
              if (this.shouldCancel) break;
              try {
                await this.executeAction(moveAction, context);
              } catch (err) {
                console.error(`[TurnManager] ❌ Error in parallel MOVE for ${moveAction.entityId}:`, err);
                // Force sync position on failure to prevent "invisible" desyncs
                const entity = context.gameMap.getEntity(moveAction.entityId);
                if (entity && moveAction.data?.to) {
                  entity.x = moveAction.data.to.x;
                  entity.y = moveAction.data.to.y;
                }
              }
            }
          }));

          // Small post-batch delay for visual clarity
          if (this.actionDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.actionDelay));
          }
        } else {
          // Sequential processing for non-MOVE actions (ATTACK, SOUND, etc.)
          console.log(`[TurnManager] 🏃 Executing sequential action ${i+1}/${actionQueue.length}: ${action.type} for ${action.entityId}`);
          try {
            await this.executeAction(action, context);
          } catch (err) {
            console.error(`[TurnManager] ❌ Error in sequential action ${action.type} for ${action.entityId}:`, err);
          }
          
          const nextAction = actionQueue[i + 1];
          if (nextAction && (nextAction.entityId !== action.entityId || nextAction.type === 'ATTACK')) {
            // Only delay if it's NOT a WAIT action, to keep things snappy
            if (this.actionDelay > 0 && action.type !== 'WAIT' && nextAction.type !== 'WAIT') {
              await new Promise(resolve => setTimeout(resolve, this.actionDelay));
            }
          }
          i++;
        }
      }
    } catch (error) {
      console.error(`[TurnManager] ❌ FATAL Playback error:`, error);
    } finally {
      this.isProcessing = false;
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`[TurnManager] ✅ FINISH TURN PLAYBACK in ${duration}ms`);
    }
  }

  /**
   * Execute a single action and wait for its completion.
   */
  async executeAction(action, context) {
    if (this.shouldCancel) return;
    const { type, entityId, data, metadata = {} } = action;
    const { gameMap, player } = context;

    // Find the entity responsible
    const entity = gameMap.getEntity(entityId) || (entityId === 'player' ? player : null);
    
    if (!entity && type !== 'GLOBAL' && type !== 'TURRET_SHOT' && type !== 'DEATH') {
      console.warn(`[TurnManager] Entity not found for action: ${entityId}`, action);
      return;
    }

    // Trigger audio if specified
    if (metadata.sound) {
      audioManager.playSound(metadata.sound, metadata.audioOptions || {});
    }

    // Delegate execution to the entity or handle globally
    console.log(`[TurnManager] >> START ${type} for ${entityId}`);
    
    switch (type) {
      case 'MOVE':
        if (entity && typeof entity.playAction === 'function') {
          // Remove gameMap.moveEntity calls! The simulation already put them in the correct tile.
          // Just play the visual animation.
          await entity.playAction(action);
          
          // Force a visual snap to ensure sync (updates renderX/renderY via Entity setters)
          entity.x = data.to.x;
          entity.y = data.to.y;
        } else if (entity) {
          // Fallback for entities without playAction: snap immediately
          entity.x = data.to.x;
          entity.y = data.to.y;
        }
        break;

      case 'STRUCTURE_INTERACT':
        // Handle zombies/NPCs attacking doors or windows
        if (entity && typeof entity.playAction === 'function') {
          await entity.playAction(action, {
            onImpact: () => {
              // Sync the structure's visual state at the moment of impact.
              // NOTE: Structural damage (hp reduction, break/open flags) was already
              // applied SILENTLY during the simulation phase by AISystem/NPCAI.
              // Here we only need to push those logical changes to the visual layer.
              const toX = data.to?.x ?? data.x;
              const toY = data.to?.y ?? data.y;
              const fromX = data.from?.x ?? entity?.logicalX ?? entity?.x;
              const fromY = data.from?.y ?? entity?.logicalY ?? entity?.y;

              const tileTo = (toX !== undefined && toY !== undefined) ? gameMap.getTile(toX, toY) : null;
              const tileFrom = (fromX !== undefined && fromY !== undefined) ? gameMap.getTile(fromX, fromY) : null;

              let structure = tileTo?.contents.find(e => e.id === data.targetId) || 
                              tileFrom?.contents.find(e => e.id === data.targetId);
              if (!structure) {
                structure = tileTo?.contents.find(e => e.type === 'door' || e.type === 'window') ||
                            tileFrom?.contents.find(e => e.type === 'door' || e.type === 'window');
              }
              if (structure && typeof structure.syncVisualState === 'function') {
                structure.syncVisualState();
              }

              GameEvents.emit(GAME_EVENT.STRUCTURE_INTERACT, {
                ...data,
                entity: entity,
                hit: data.success,
                damage: data.damage
              });

              if (data.broken) {
                GameEvents.emit(data.targetType === 'window' ? GAME_EVENT.WINDOW_SMASH : GAME_EVENT.DOOR_BROKEN, {
                  ...data,
                  windowPos: data.targetType === 'window' ? data.to : undefined,
                  doorPos: data.targetType === 'door' ? data.to : undefined,
                  source: entity?.type || 'zombie'
                });
              }
            }
          });
        }
        // NOTE: Do NOT call takeDamage here. It was already applied silently during
        // simulation. Calling it again would double-apply damage and corrupt HP values.
        break;

      case 'ESCAPE': {
        // NPC reached the south exit — remove from map and clean up references
        if (entity) {
          entity.hasExited = true;
        }
        
        // 1. Remove from map
        gameMap.removeEntity(entityId);
        
        // 2. Clear targeting references from all zombies to avoid ghost chasing
        const allZombies = gameMap.getEntitiesByType(EntityType.ZOMBIE);
        allZombies.forEach(z => {
          if (z.currentTarget && z.currentTarget.id === entityId) {
            z.currentTarget = null;
            z.behaviorState = 'idle';
          }
        });

        // 3. Emit escape event for UI log
        GameEvents.emit(GAME_EVENT.NPC_ESCAPED, { npc: entity });
        break;
      }

      case 'ATTACK': {
        const eventType = (entity.type === 'npc' || entity.type === EntityType.NPC) ? GAME_EVENT.NPC_ATTACK : GAME_EVENT.ZOMBIE_ATTACK;
        
        // 1. Play visual animation with synchronized feedback trigger
        if (entity && typeof entity.playAction === 'function') {
          await entity.playAction(action, {
            onImpact: () => {
              // Emit events for logs, audio, and UI feedback at the moment of contact
              GameEvents.emit(eventType, {
                ...data,
                zombie: entity.type !== 'npc' ? entity : null,
                npc: entity.type === 'npc' ? entity : null,
                entity: entity,
                hit: data.success,
                damage: data.damage
              });

              // Trigger visual projectile if specified
              if (metadata.projectile) {
                GameEvents.emit(GAME_EVENT.PROJECTILE_FIRED, {
                    ...metadata.projectile,
                    x: entity.logicalX,
                    y: entity.logicalY,
                    duration: 400
                });
              }

              // Always blink the attacker for visual feedback
              GameEvents.emit(GAME_EVENT.ENTITY_BLINK, {
                  entityId: entity.id,
                  x: entity.logicalX,
                  y: entity.logicalY,
                  duration: 500
              });
            }
          });
        }
        
        // 3. Apply damage AFTER animation for proper synchronization
        const target = data.targetType === 'player' ? player : gameMap.getEntity(data.targetId);
        if (target && data.success && data.damage > 0) {
          if (typeof target.takeDamage === 'function') {
            target.takeDamage(data.damage, false);
          }
          if (data.bleedingInflicted && typeof target.setBleeding === 'function') {
            target.setBleeding(true);
          }
          if (data.sickInflicted && typeof target.inflictSickness === 'function') {
            target.inflictSickness(24);
          }

          // Check if target died from the damage (visual triggers only)
          if (typeof target.isDead === 'function' && target.isDead()) {
            if (target.type === 'zombie' || target.type === EntityType.ZOMBIE) {
              if (!this.flashedEntityIds.has(target.id)) {
                GameEvents.emit(GAME_EVENT.ZOMBIE_KILLED, { x: target.logicalX ?? target.x, y: target.logicalY ?? target.y });
                this.flashedEntityIds.add(target.id);
              }
            }
          }
        }
        break;
      }

      case 'SOUND':
        // Pure sound action
        if (metadata && metadata.sound) {
          audioManager.playSound(metadata.sound, metadata.audioOptions);
        } else if (data && data.sound) {
          audioManager.playSound(data.sound, data.audioOptions);
        }
        break;

      case 'DEATH': {
        if (entity && typeof entity.playAction === 'function') {
          await entity.playAction(action);
        }

        const entityType = entity?.type || data?.entityType;
        const deathX = entity ? (entity.logicalX ?? entity.x) : data?.x;
        const deathY = entity ? (entity.logicalY ?? entity.y) : data?.y;
        
        if ((entityType === 'zombie' || entityType === EntityType.ZOMBIE) && deathX !== undefined && deathY !== undefined) {
          if (!this.flashedEntityIds.has(entityId)) {
            GameEvents.emit(GAME_EVENT.ZOMBIE_KILLED, { x: deathX, y: deathY });
            this.flashedEntityIds.add(entityId);
          }
          // Award 1 Earbuck if a zombie dies during turn simulation (turret, fire, npc, etc.)
          if (engine.player) {
            engine.player.earbucks = (engine.player.earbucks || 0) + 1;
            if (context.addLog) {
              context.addLog(`You earned 1 Earbuck! (${engine.player.earbucks} total)`, 'world');
            }
          }
        }

        gameMap.removeEntity(entityId);
        
        // Clear targeting references from all zombies to avoid ghost chasing
        const remainingZombies = gameMap.getEntitiesByType(EntityType.ZOMBIE);
        remainingZombies.forEach(z => {
          if (z.currentTarget && z.currentTarget.id === entityId) {
            z.currentTarget = null;
            z.behaviorState = 'idle';
          }
        });
        break;
      }

      case 'DEMAND':
        // NPC is making a demand - typically triggers a UI popup later, 
        // but we add a small visual pause here for the "encounter" feel
        if (entity) {
          entity.isAlerted = true; // Visual indicator
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        break;

      case 'TURRET_SHOT': {
        // Emit turret fire event for log / audio / visual effects
        GameEvents.emit(GAME_EVENT.TURRET_FIRED, {
          ...data,
          hit:    data.hit,
          damage: data.damage
        });

        // Trigger the crimson flash immediately if this shot was a killing blow
        if (data.isDead && data.targetId && data.targetX !== undefined && data.targetY !== undefined) {
          if (!this.flashedEntityIds.has(data.targetId)) {
            GameEvents.emit(GAME_EVENT.ZOMBIE_KILLED, { x: data.targetX, y: data.targetY });
            this.flashedEntityIds.add(data.targetId);
          }
        }

        // Add a small delay so consecutive turret shots are visually and audibly distinct
        await new Promise(resolve => setTimeout(resolve, 200));
        break;
      }

      case 'TILE_FLASH':
        if (context.addEffect) {
          context.addEffect({
            type: 'tile_flash',
            x: data.x,
            y: data.y,
            color: data.color,
            duration: data.duration || 600
          });
        }
        break;

      case 'DAMAGE_EFFECT':
        if (context.addEffect) {
          context.addEffect({
            type: 'damage',
            x: data.x,
            y: data.y,
            value: data.damage,
            color: data.color || '#ef4444',
            duration: 1500
          });
        }
        if (context.addLog && data.log) {
          context.addLog(data.log, 'combat');
        }
        break;

      case 'EXPLOSION_LOG':
        if (context.addLog && data.log) {
          context.addLog(data.log, 'combat');
        }
        break;

      default:
        console.warn(`[TurnManager] Unknown action type: ${type}`);
    }

    console.log(`[TurnManager] << FINISH ${type} for ${entityId}`);
  }
}

export default new TurnManager();
