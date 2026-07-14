import engine from '../GameEngine.js';
import { resolveMapEvents } from './migrateEvents.js';
import { applyItemGrants } from '../utils/applyItemGrants.js';
import { evalAll } from './conditions.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import Logger from '../utils/Logger.js';

const log = Logger.scope('EventRunner');

/**
 * Single runtime runner for all authored events (unified GameEvent[] — see
 * QUEST_SYSTEM_PLAN.md §6). Replaces the previously-separate modal-dialog
 * (GameContext.fireDialogTrigger) and speech-bubble (SpeechBubbleContext)
 * firing/chaining logic: both contexts now just render whichever step type is
 * currently active here, reacting to engine.notifyUpdate() the same way every
 * other engine-driven UI already does (see engine.subscribe/getSnapshot).
 *
 * Phase 4: preconditions/endWhen now gate every trigger type, `auto`/`parallel`
 * events are checked reactively (player move, inventory change, quest-state
 * change), and `lockMovement`'s own `until` conditions are watched the same
 * way to auto-clear the movement gate — which is now actually enforced at the
 * click-to-move chokepoint (GameMapContext.handleTileClick).
 * `parallel` is treated identically to `auto` for now: both pause turnPhase
 * like every other trigger. True non-blocking (turn-loop-concurrent) parallel
 * execution is a bigger architectural change and is deferred past this phase.
 */
class EventRunner {
  constructor() {
    this.activeRun = null; // { event, stepIndex } | null
    this.firedOnce = new Set();
    // Auto/parallel events whose endWhen has passed — a one-way latch so an
    // event never fires again via the auto/onEnter path once its "obligation"
    // is resolved, independent of repeat mode.
    this.autoResolved = new Set();
    // Active lockMovement steps awaiting their own `until` conditions:
    // { eventId, until: Condition[] }[]. Distinct from event.endWhen — this is
    // the specific "player can't move until X" release condition.
    this.activeLocks = [];
    this._onExternalChange = this._onExternalChange.bind(this);
    this._subscribe();
    engine.on('sync', () => {
      log.debug('Engine sync detected, re-subscribing event listeners to fresh managers');
      this._subscribe();
      this.recheckLocks();
      this.checkAutoEvents();
    });
  }

  _ctx() {
    return { inventoryManager: engine.inventoryManager, questState: engine.questState, player: engine.player };
  }

  // engine.inventoryManager / engine.questState are replaced with fresh
  // instances on every engine.reset() (new game), so re-subscribe whenever
  // reset() runs rather than assuming the constructor's references stay valid.
  _subscribe() {
    this._unsubscribe();
    this._invMgr = engine.inventoryManager;
    this._qState = engine.questState;
    if (this._invMgr) {
      this._invMgr.on('inventoryChanged', this._onExternalChange);
      this._invMgr.on('itemEquipped', this._onExternalChange);
      this._invMgr.on('itemUnequipped', this._onExternalChange);
    }
    if (this._qState) this._qState.on('questStateChanged', this._onExternalChange);
  }

  _unsubscribe() {
    if (this._invMgr) {
      this._invMgr.off('inventoryChanged', this._onExternalChange);
      this._invMgr.off('itemEquipped', this._onExternalChange);
      this._invMgr.off('itemUnequipped', this._onExternalChange);
    }
    if (this._qState) this._qState.off('questStateChanged', this._onExternalChange);
  }

  _onExternalChange() {
    if (this._checkingProgress) return;
    this._checkingProgress = true;
    try {
      if (this._qState) {
        const quests = engine.gameMap?.metadata?.questRegistry?.quests || [];
        this._qState.checkQuestProgression(quests, this._ctx());
      }
    } catch (err) {
      console.error('[EventRunner] Error checking quest progression:', err);
    } finally {
      this._checkingProgress = false;
    }
    this.recheckLocks();
    this.checkAutoEvents();
  }

  /** Call on new game / map load to forget prior "once" firings and any in-flight run. */
  reset() {
    this.activeRun = null;
    this.firedOnce = new Set();
    this.autoResolved = new Set();
    this.activeLocks = [];
    engine.movementLocked = false;
    engine.actionsLocked = false;
    this._subscribe(); // engine.inventoryManager/questState are fresh post-engine.reset()
  }

  isRunning() {
    return !!this.activeRun;
  }

  _currentStep() {
    if (!this.activeRun) return null;
    const { event, stepIndex } = this.activeRun;
    return event.steps[stepIndex] || null;
  }

  /** { speaker, text, video? } while the current step is a dialog line, else null. */
  getActiveDialogStep() {
    const step = this._currentStep();
    return step && step.type === 'dialog' ? step : null;
  }

  /** { anchorX, anchorY, speaker?, text } while the current step is a speech line, else null. */
  getActiveSpeechStep() {
    const step = this._currentStep();
    return step && step.type === 'speech' ? step : null;
  }

  /** { index, total } among this event's speech-typed steps, for the bubble progress counter. */
  getSpeechProgress() {
    if (!this.activeRun) return null;
    const { event, stepIndex } = this.activeRun;
    const speechSteps = event.steps.filter(s => s.type === 'speech');
    if (speechSteps.length === 0) return null;
    const current = event.steps[stepIndex];
    const index = speechSteps.indexOf(current);
    return { index: index < 0 ? 0 : index, total: speechSteps.length };
  }

  getActiveEventId() {
    return this.activeRun ? this.activeRun.event.id : null;
  }

  /**
   * Shared eligibility gate for every trigger type: has steps, hasn't already
   * fired (repeat:'once'), hasn't been permanently resolved via endWhen, its
   * endWhen (if any) hasn't just now passed (which resolves it permanently and
   * makes this and all future checks ineligible), and its preconditions pass.
   */
  _isEligible(ev, ctx) {
    if (!ev || !ev.steps || ev.steps.length === 0) return false;
    if (ev.repeat === 'once' && this.firedOnce.has(ev.id)) return false;
    if (this.autoResolved.has(ev.id)) return false;
    if (ev.endWhen && ev.endWhen.length > 0 && evalAll(ev.endWhen, ctx)) {
      this.autoResolved.add(ev.id);
      return false;
    }
    return evalAll(ev.preconditions, ctx);
  }

  /** First eligible onEnter event whose placement matches (x, y), author order = priority. */
  _findMatchAt(x, y) {
    const events = resolveMapEvents(engine.gameMap?.metadata);
    const ctx = this._ctx();
    for (const ev of events) {
      if (!ev || ev.trigger !== 'onEnter') continue;
      if (!this._isEligible(ev, ctx)) continue;
      const p = ev.placement;
      if (!p) continue;
      if (p.kind === 'tile') {
        if (p.x === x && p.y === y) return ev;
      } else if (p.kind === 'proximity') {
        const r = p.radius ?? 1;
        const dx = p.x - x, dy = p.y - y;
        if (dx * dx + dy * dy <= r * r) return ev;
      }
    }
    return null;
  }

  /**
   * Check every `auto`/`parallel` event (no player position involved) and run
   * the first eligible one. Call reactively whenever something that could
   * make an event newly eligible changes: player move, inventory change,
   * quest-state change (already wired via _onExternalChange), or once at map
   * load so an event whose preconditions are satisfied from the start fires
   * immediately without requiring the player to do anything first.
   */
  /**
   * @param {string|null} [excludeId] - skip this event id. Used by _endRun()
   *   so a still-eligible repeat:'everyTime'/'whileConditions' auto event
   *   can't immediately restart itself the instant its own run ends (that
   *   would tight-loop with no gap ever reachable by the player) — it simply
   *   re-fires on the next external reactive trigger instead, same as an
   *   onEnter event re-fires next time its trigger condition recurs. A
   *   *different* event that just became eligible is unaffected and still
   *   fires immediately.
   */
  checkAutoEvents(excludeId = null) {
    if (this.activeRun) return; // one run at a time
    const events = resolveMapEvents(engine.gameMap?.metadata);
    const ctx = this._ctx();
    for (const ev of events) {
      if (!ev || (ev.trigger !== 'auto' && ev.trigger !== 'parallel')) continue;
      if (excludeId && ev.id === excludeId) continue;
      if (!this._isEligible(ev, ctx)) continue;
      this.runEvent(ev);
      return;
    }
  }

  /** Re-evaluate active lockMovement/lockActions `until` conditions; auto-clear the gate(s) once satisfied. */
  recheckLocks() {
    if (this.activeLocks.length === 0) return;
    const ctx = this._ctx();
    const remaining = this.activeLocks.filter(lock => !evalAll(lock.until, ctx));
    if (remaining.length !== this.activeLocks.length) {
      this.activeLocks = remaining;
      if (this.activeLocks.length === 0) {
        engine.movementLocked = false;
        engine.actionsLocked = false;
        engine.notifyUpdate();
      }
    }
  }

  /** Called on PLAYER_MOVE_ENDED. No-op if a run is already in progress. */
  checkAndFireAt(x, y) {
    if (this.activeRun) return;
    const ev = this._findMatchAt(x, y);
    if (ev) this.runEvent(ev);
  }

  /**
   * Start running an event's steps from the top.
   * @param {object} event
   * @param {{ ignoreOnce?: boolean }} [opts] - ignoreOnce: replay even if
   *   repeat:'once' already fired (used by the placeable.help item to replay
   *   the tutorial at will).
   */
  runEvent(event, opts = {}) {
    if (!event || !event.steps || event.steps.length === 0) return;
    if (this.activeRun) return; // one run at a time
    if (event.repeat === 'once' && !opts.ignoreOnce) this.firedOnce.add(event.id);
    log.debug(`Running event "${event.id}" (${event.steps.length} step(s))`);
    this.activeRun = { event, stepIndex: 0 };
    engine.turnPhase = 'PAUSED_FOR_EVENT';
    this._processCurrentStep();
  }

  /** Advance past the current blocking step (dialog/speech dismissed by the player). */
  advance() {
    if (!this.activeRun) return;
    this.activeRun.stepIndex++;
    this._processCurrentStep();
  }

  /** Force-end the current run early (e.g. player closes the bubble/dialog outright). */
  cancel() {
    if (!this.activeRun) return;
    this._endRun();
  }

  _endRun() {
    const finishedId = this.activeRun ? this.activeRun.event.id : null;
    this.activeRun = null;
    engine.turnPhase = 'PLAYER_TURN';
    engine.notifyUpdate();
    // A step in the run that just ended may have just made a *different*
    // `auto` event eligible (e.g. its last step set a flag another event's
    // preconditions were waiting on) — check immediately rather than waiting
    // for the next player move/inventory change. Exclude the event that just
    // finished so a still-eligible everyTime/whileConditions auto event can't
    // instantly restart itself with no gap (see checkAutoEvents doc).
    this.recheckLocks();
    this.checkAutoEvents(finishedId);
  }

  _processCurrentStep() {
    if (!this.activeRun) return;
    const { event, stepIndex } = this.activeRun;
    const step = event.steps[stepIndex];

    if (!step) { this._endRun(); return; }

    switch (step.type) {
      case 'dialog':
      case 'speech':
        // Blocking: render this step and wait for advance().
        engine.notifyUpdate();
        return;

      case 'give':
        if (step.defId) {
          applyItemGrants(engine.gameMap, [{ defId: step.defId, count: step.count, x: step.x, y: step.y }], engine.inventoryManager);
        }
        this.activeRun.stepIndex++;
        this._processCurrentStep();
        return;

      case 'setFlag':
        if (engine.questState && step.flag) engine.questState.setFlag(step.flag, !!step.value);
        this.activeRun.stepIndex++;
        this._processCurrentStep();
        return;

      case 'setVar':
        if (engine.questState && step.var) {
          if (step.op === 'add') engine.questState.addVar(step.var, step.varValue || 0);
          else engine.questState.setVar(step.var, step.varValue || 0);
        }
        this.activeRun.stepIndex++;
        this._processCurrentStep();
        return;

      case 'startQuest':
        if (engine.questState && step.questId) {
          engine.questState.startQuest(step.questId);
        }
        this.activeRun.stepIndex++;
        this._processCurrentStep();
        return;

      case 'setQuestTask':
        if (engine.questState && step.questId && step.taskIndex !== undefined) {
          engine.questState.setQuestTask(step.questId, step.taskIndex);
        }
        this.activeRun.stepIndex++;
        this._processCurrentStep();
        return;

      case 'lockMovement':
        // Enforced at the click-to-move chokepoint (GameMapContext.handleTileClick).
        // If this step carries its own `until` conditions, track them so
        // recheckLocks() (called reactively on move/inventory/quest-state
        // change) can auto-clear the gate once they pass. With no `until`,
        // the lock is permanent until an explicit unlockMovement step.
        engine.movementLocked = true;
        if (step.until && step.until.length > 0) {
          this.activeLocks.push({ eventId: event.id, until: step.until });
        }
        this.activeRun.stepIndex++;
        this._processCurrentStep();
        return;

      case 'unlockMovement':
        // Explicit unlock always wins now, regardless of any other pending
        // lockMovement `until` conditions still outstanding.
        engine.movementLocked = false;
        this.activeLocks = [];
        this.activeRun.stepIndex++;
        this._processCurrentStep();
        return;

      case 'lockActions':
        // Superset of lockMovement: also blocks map interactions (door/window/
        // npc menus, combat & item targeting — see MapInterface.tsx's
        // onCellClick/onCellRightClick) via engine.actionsLocked. Deliberately
        // leaves turnPhase/isPlayerTurn alone so End Turn keeps working — the
        // typical `until` condition here is an 'ap' check, so ending the turn
        // (which refills AP) is exactly how the author expects this to clear.
        engine.movementLocked = true;
        engine.actionsLocked = true;
        if (step.until && step.until.length > 0) {
          this.activeLocks.push({ eventId: event.id, until: step.until, locksActions: true });
        }
        this.activeRun.stepIndex++;
        this._processCurrentStep();
        return;

      case 'unlockActions':
        engine.movementLocked = false;
        engine.actionsLocked = false;
        this.activeLocks = [];
        this.activeRun.stepIndex++;
        this._processCurrentStep();
        return;

      case 'wait': {
        const runToken = this.activeRun;
        engine.notifyUpdate();
        setTimeout(() => {
          if (this.activeRun !== runToken) return; // cancelled/replaced during the wait
          this.activeRun.stepIndex++;
          this._processCurrentStep();
        }, Math.max(0, step.ms || 0));
        return;
      }

      case 'chain': {
        const target = step.eventId
          ? resolveMapEvents(engine.gameMap?.metadata).find(e => e && e.id === step.eventId)
          : null;
        this.activeRun = null; // release the slot before starting the chained run
        if (target) this.runEvent(target);
        else engine.notifyUpdate();
        return;
      }

      case 'moveEntity': {
        if (!step.entityTag) {
          log.warn(`[EventRunner] moveEntity step has no entityTag`);
          this.activeRun.stepIndex++;
          this._processCurrentStep();
          return;
        }
        if (step.targetX === undefined || step.targetY === undefined) {
          log.warn(`[EventRunner] moveEntity step target coordinate is not set`);
          this.activeRun.stepIndex++;
          this._processCurrentStep();
          return;
        }

        const targetEntity = this._resolveEntity(step.entityTag);
        if (!targetEntity) {
          log.warn(`[EventRunner] Could not find entity with tag "${step.entityTag}"`);
          this.activeRun.stepIndex++;
          this._processCurrentStep();
          return;
        }

        // Calculate path using Pathfinding.findPath
        const startX = targetEntity.logicalX;
        const startY = targetEntity.logicalY;
        const path = Pathfinding.findPath(engine.gameMap, startX, startY, step.targetX, step.targetY, { entity: targetEntity });

        if (!path || path.length <= 1) {
          log.warn(`[EventRunner] No path found for entity "${step.entityTag}" to (${step.targetX}, ${step.targetY})`);
          this.activeRun.stepIndex++;
          this._processCurrentStep();
          return;
        }

        // Exclude starting point
        const walkSteps = path.slice(1);
        let stepIdx = 0;
        const runToken = this.activeRun;

        const performStep = () => {
          if (this.activeRun !== runToken) return; // cancelled/replaced
          if (stepIdx >= walkSteps.length) {
            this.activeRun.stepIndex++;
            this._processCurrentStep();
            return;
          }

          const next = walkSteps[stepIdx];
          const oldX = targetEntity.logicalX;
          const oldY = targetEntity.logicalY;
          const moved = engine.gameMap.moveEntity(targetEntity.id, next.x, next.y, { snap: false });
          if (moved) {
            targetEntity.movementPath = [{ x: oldX, y: oldY }, { x: next.x, y: next.y }];
            
            // Trigger animation if visible/relevant
            const action = {
              type: 'MOVE',
              entityId: targetEntity.id,
              data: { from: { x: oldX, y: oldY }, to: { x: next.x, y: next.y } }
            };

            // Let targetEntity play movement animation
            if (typeof targetEntity.playAction === 'function') {
              targetEntity.playAction(action).then(() => {
                stepIdx++;
                setTimeout(performStep, 30); // slight pause between steps
              });
            } else {
              stepIdx++;
              setTimeout(performStep, 150); // fallback delay
            }
            engine.notifyUpdate();
          } else {
            // Reached a blocked tile/fail-safe: force snap
            targetEntity.moveTo(next.x, next.y);
            stepIdx++;
            setTimeout(performStep, 100);
          }
        };

        performStep();
        return;
      }

      case 'setNpcAI': {
        if (!step.entityTag) {
          log.warn(`[EventRunner] setNpcAI step has no entityTag`);
        } else {
          const targetEntity = this._resolveEntity(step.entityTag);
          if (!targetEntity) {
            log.warn(`[EventRunner] Could not find entity with tag "${step.entityTag}"`);
          } else {
            // enabled: true = normal wandering/fleeing/combat AI resumes;
            // false = scripted (stays put, moved only by moveEntity/dialog steps).
            targetEntity.aiDisabled = !step.enabled;
          }
        }
        this.activeRun.stepIndex++;
        this._processCurrentStep();
        return;
      }

      default:
        log.warn(`Unsupported step type "${step.type}" — skipping. (Conditional branch is deferred; see QUEST_SYSTEM_PLAN.md §10.)`);
        this.activeRun.stepIndex++;
        this._processCurrentStep();
    }
  }

  _resolveEntity(tag) {
    if (tag === 'player') return engine.player;

    // Search by name (NPCs) or by registryTag (Zombies, Doors, Windows, etc.)
    for (const ent of engine.gameMap.entityMap.values()) {
      if (ent.name === tag || ent.registryTag === tag) {
        return ent;
      }
    }

    // Fallback: search manually registered entries' coordinates
    const registry = engine.gameMap.metadata?.entityRegistry;
    if (registry?.entries) {
      const entry = registry.entries.find(e => e.tag === tag);
      if (entry) {
        for (const ent of engine.gameMap.entityMap.values()) {
          if (ent.type === entry.type && ent.logicalX === entry.x && ent.logicalY === entry.y) {
            return ent;
          }
        }
      }
    }

    return null;
  }
}

const eventRunner = new EventRunner();
export default eventRunner;
