import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';
import audioManager from '../utils/AudioManager.js';
import { EntityType } from '../entities/Entity.js';
import engine from '../GameEngine.js';
import { CombatResolver } from '../systems/CombatResolver.js';
import { SICKNESS_TURNS } from '../systems/CombatSystem.js';

/**
 * TurnManager - Orchestrates the sequential playback of game actions.
 * Ensures animations are locked and audio is synchronized.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * DAMAGE-TIMING MODELS (canonical reference for P5-02)
 *
 * The game resolves a turn in two phases: a synchronous *simulation* phase
 * (SimulationManager runs the AI/systems and produces an action queue) followed
 * by an async *playback* phase (this class animates that queue). Damage is
 * applied in ONE of those phases depending on the action type. There are two
 * models, and the choice is deliberate — do not "fix" one to match the other
 * without understanding why:
 *
 *  1. SIMULATION-FIRST  (damage already applied; playback is purely cosmetic)
 *     - TURRET_SHOT:        TurretAI calls target.takeDamage() during simulation
 *                           (TurretAI.js), so a turret can keep firing at the
 *                           post-hit HP within the same turn. Playback only
 *                           emits visual/audio events — it must NOT re-apply.
 *     - STRUCTURE_INTERACT: CombatSystem applies takeDamage(total, silent=true)
 *                           during simulation (CombatSystem.js). The playback
 *                           case carries an explicit "do NOT call takeDamage"
 *                           note for the same reason.
 *
 *  2. PLAYBACK-FIRST    (damage deferred to the animation's impact moment)
 *     - ATTACK (entity-vs-entity): CombatSystem pushes the ATTACK action WITHOUT
 *                           applying damage; the ATTACK case below applies
 *                           takeDamage() *after* the swing animation so HP/death
 *                           visuals line up with the moment of contact.
 *
 * Rule of thumb: structures/turrets resolve in simulation (no per-hit animation
 * to sync against, and intra-turn HP must be live); living-entity melee/ranged
 * attacks resolve in playback (the hit should land when the animation connects).
 * Player-initiated attacks are a separate path resolved immediately in
 * CombatContext, outside this queue.
 * ────────────────────────────────────────────────────────────────────────────
 */
class TurnManager {
  constructor() {
    this.isProcessing = false;
    this.shouldCancel = false;
  }

  /**
   * Immediately stop any current turn playback.
   *
   * INVARIANT: cancelling drops any not-yet-executed actions, including
   * PLAYBACK-FIRST ATTACK damage that the simulation already committed to
   * (see damage-timing models above). Every current caller replaces or locks
   * the whole game state right after (defeat, load, new game), so that's
   * acceptable — do NOT build a "skip animation" feature on this method, it
   * would silently eat enemy hits.
   */
  cancelPlayback() {
    console.log('[TurnManager] 🛑 Cancellation requested - stopping playback loop');
    this.shouldCancel = true;
    // Release any in-flight SequencerAction promises so the playback loop's
    // current await returns and the finally block can clear isProcessing.
    // Without this, a cancel during an animation leaves isProcessing stuck
    // true and every later turn aborts with "Already processing".
    if (engine && typeof engine.flushActiveActions === 'function') {
      engine.flushActiveActions();
    }
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
      // Partition the flat, cycle-ordered queue into independent playback "lanes":
      // one lane per entity (preserving that entity's own relative action order),
      // plus a shared GLOBAL lane for entity-less effects/logs (explosion flashes,
      // etc.). Lanes are played CONCURRENTLY, so a zombie banging a door across the
      // map — or an adjacent zombie taking 12 bites out of the player — no longer
      // stalls every other zombie's walk animation, which is what made movement
      // look stop-and-go. Ordering is preserved only WITHIN a lane, which is
      // exactly what the damage-timing invariants require (see class header): each
      // attacker's move→attack→death sequence still plays in order, so
      // PLAYBACK-FIRST damage still lands at each swing's impact, and turret shots
      // (keyed by their own turret id) stay sequential per turret.
      const GLOBAL_KEY = '__global__';
      const lanes = new Map();
      for (const action of actionQueue) {
        if (!action) continue;
        const key = (action.entityId === undefined || action.entityId === null)
          ? GLOBAL_KEY
          : action.entityId;
        if (!lanes.has(key)) lanes.set(key, []);
        lanes.get(key).push(action);
      }

      const playLane = async (actions) => {
        for (const action of actions) {
          if (this.shouldCancel) break;
          if (!action) continue;
          try {
            await this.executeAction(action, context);
          } catch (err) {
            console.error(`[TurnManager] ❌ Error in ${action.type} for ${action.entityId}:`, err);
            // Force-sync position on a failed MOVE to prevent "invisible" desyncs.
            if (action.type === 'MOVE') {
              const entity = context.gameMap.getEntity(action.entityId);
              if (entity && action.data?.to) {
                entity.x = action.data.to.x;
                entity.y = action.data.to.y;
              }
            }
          }
        }
      };

      console.log(`[TurnManager] 🏃 Playing ${lanes.size} parallel lane(s)`);
      await Promise.all(Array.from(lanes.values()).map(playLane));
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
              // applied SILENTLY during the simulation phase by AISystem/NPCAISystem.
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
        // SIMULATION-FIRST (see class header): Do NOT call takeDamage here. It was
        // already applied silently during simulation. Calling it again would
        // double-apply damage and corrupt HP values.
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
        const eventType = (entity.type === EntityType.NPC) ? GAME_EVENT.NPC_ATTACK : GAME_EVENT.ZOMBIE_ATTACK;
        
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

              // Gunfire gets a single bright muzzle flash instead of the generic
              // attacker blink — the blink's 3 slow pulses read as "something
              // happened here", not as a shot going off.
              if (metadata.muzzleFlash) {
                GameEvents.emit(GAME_EVENT.MUZZLE_FLASH, {
                    x: metadata.muzzleFlash.x ?? entity.logicalX,
                    y: metadata.muzzleFlash.y ?? entity.logicalY
                });
              } else {
                // Otherwise blink the attacker for visual feedback
                GameEvents.emit(GAME_EVENT.ENTITY_BLINK, {
                    entityId: entity.id,
                    x: entity.logicalX,
                    y: entity.logicalY,
                    duration: 500
                });
              }
            }
          });
        }
        
        // 3. PLAYBACK-FIRST: apply damage AFTER the animation (CombatSystem
        // deliberately did not apply it during simulation — see class header).
        const target = data.targetType === 'player' ? player : gameMap.getEntity(data.targetId);

        if (target && data.success && data.damage > 0) {
          const finalDamage = CombatResolver.applyArmorAbsorption(target, data.damage, engine?.inventoryManager);
          if (finalDamage > 0 && typeof target.takeDamage === 'function') {
            target.takeDamage(finalDamage, entity);
          }
          if (data.bleedingInflicted && typeof target.setBleeding === 'function') {
            target.setBleeding(true);
          }
          if (data.sickInflicted && typeof target.inflictSickness === 'function') {
            target.inflictSickness(SICKNESS_TURNS);
          }
          if (data.infectionInflicted && typeof target.inflictInfection === 'function') {
            target.inflictInfection();
          }

          // Check if target died from the damage (visual triggers only)
          if (typeof target.isDead === 'function' && target.isDead()) {
            if (target.type === EntityType.ZOMBIE) {
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
        
        if (entityType === EntityType.ZOMBIE && deathX !== undefined && deathY !== undefined) {
          if (!this.flashedEntityIds.has(entityId)) {
            GameEvents.emit(GAME_EVENT.ZOMBIE_KILLED, { x: deathX, y: deathY });
            this.flashedEntityIds.add(entityId);
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
        // SIMULATION-FIRST: damage was already applied by TurretAI during
        // simulation (see class header). This case is cosmetic only — emit
        // fire/hit/kill visuals; do NOT call takeDamage here.
        GameEvents.emit(GAME_EVENT.TURRET_FIRED, {
          ...data,
          hit:    data.hit,
          damage: data.damage
        });

        // Trigger the crimson flash immediately if this shot was a killing blow on a zombie
        if (data.isDead && data.targetType === EntityType.ZOMBIE && data.targetId && data.targetX !== undefined && data.targetY !== undefined) {
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
