/**
 * Unified GameEvent model + migration to/from the legacy event shapes
 * (`eventTriggers[]` / `bubbleEvents[]`, both living on `gameMap.metadata` or a
 * scenario object). See QUEST_SYSTEM_PLAN.md §4 and §11.2 for the full design.
 *
 * GameEvent shape (plain object, not a class — serializes as-is):
 *   {
 *     id: string,
 *     label?: string,
 *     placement: { kind:'tile', x, y } | { kind:'proximity', x, y, radius } | { kind:'chainOnly' },
 *     trigger: 'onEnter' | 'onInteract' | 'auto' | 'parallel',
 *     preconditions: Condition[],
 *     endWhen?: Condition[],
 *     repeat: 'once' | 'everyTime' | 'whileConditions',
 *     steps: EventStep[],
 *   }
 *
 * EventStep shape: { type: 'dialog'|'speech'|'give'|'setFlag'|'setVar'|'lockMovement'|
 *   'unlockMovement'|'wait'|'chain', ...fields per type }. See plan §4.3.
 *
 * Legacy shapes (unchanged, still what the current runtime reads):
 *   eventTriggers[]: { x, y, id, steps:[{speaker,text,video?}], oneShot, grants?, next? }
 *                     or { chainOnly:true, id, steps, oneShot, grants?, next? } (no x/y)
 *   bubbleEvents[]:  { id, oneShot, trigger:{type:'tile'|'proximity',x,y,radius?},
 *                      lines:[{x,y,speaker?,text}], grants?, next? }
 */

const REPRESENTABLE_LEGACY_STEP_TYPES = new Set(['dialog', 'speech', 'give', 'chain']);

/** Up-convert one legacy modal-dialog eventTrigger entry into a GameEvent. */
function migrateDialogTrigger(evt) {
  const isChainOnly = !!evt.chainOnly || evt.x === undefined || evt.y === undefined;
  const steps = [];
  for (const line of evt.steps || []) {
    steps.push({ type: 'dialog', speaker: line.speaker || '', text: line.text, ...(line.video ? { video: line.video } : {}) });
  }
  for (const grant of evt.grants || []) {
    steps.push({ type: 'give', defId: grant.defId, ...(grant.count ? { count: grant.count } : {}), x: grant.x, y: grant.y });
  }
  if (evt.next) steps.push({ type: 'chain', eventId: evt.next });

  return {
    id: evt.id,
    placement: isChainOnly ? { kind: 'chainOnly' } : { kind: 'tile', x: evt.x, y: evt.y },
    trigger: 'onEnter',
    preconditions: [],
    repeat: evt.oneShot === false ? 'everyTime' : 'once',
    steps,
  };
}

/** Up-convert one legacy BubbleEvent into a GameEvent. */
function migrateBubbleEvent(evt) {
  const steps = [];
  for (const line of evt.lines || []) {
    steps.push({ type: 'speech', anchorX: line.x, anchorY: line.y, ...(line.speaker ? { speaker: line.speaker } : {}), text: line.text });
  }
  for (const grant of evt.grants || []) {
    steps.push({ type: 'give', defId: grant.defId, ...(grant.count ? { count: grant.count } : {}), x: grant.x, y: grant.y });
  }
  if (evt.next) steps.push({ type: 'chain', eventId: evt.next });

  const placement = evt.trigger?.type === 'proximity'
    ? { kind: 'proximity', x: evt.trigger.x, y: evt.trigger.y, radius: evt.trigger.radius ?? 2 }
    : { kind: 'tile', x: evt.trigger?.x, y: evt.trigger?.y };

  return {
    id: evt.id,
    placement,
    trigger: 'onEnter',
    preconditions: [],
    repeat: evt.oneShot === false ? 'everyTime' : 'once',
    steps,
  };
}

/**
 * Up-convert a map's legacy event arrays into unified GameEvent[]. Reads
 * `eventTriggers`/`bubbleEvents` off whatever object is passed (works for both
 * `gameMap.metadata` at runtime and an editor scenario object at save time).
 */
export function migrateLegacyEvents(metadata) {
  const events = [];
  for (const evt of metadata?.eventTriggers || []) {
    events.push(migrateDialogTrigger(evt));
  }
  for (const evt of metadata?.bubbleEvents || []) {
    events.push(migrateBubbleEvent(evt));
  }
  return events;
}

/**
 * Resolve the events a map should use: prefer an already-unified `events[]`
 * (new canonical shape) if present, else up-convert from the legacy arrays.
 */
export function resolveMapEvents(metadata) {
  if (Array.isArray(metadata?.events)) return metadata.events;
  return migrateLegacyEvents(metadata);
}

/**
 * Down-convert unified GameEvent[] back into the legacy `{ eventTriggers,
 * bubbleEvents }` shapes, so the current (pre-Phase-3) runtime keeps working
 * off events authored/edited through the new model ("dual-write").
 *
 * Only the dialog/speech/give/chain step subset has a legacy equivalent.
 * Any other step type (setFlag, setVar, lockMovement, wait, …) — or a
 * placement/step combination legacy never supported (e.g. proximity + dialog
 * steps) — is dropped with a console.warn. That's expected pre-Phase-3: the
 * Phase 2 editor won't let authors create those yet, and once Phase 3 lands,
 * down-conversion and the legacy arrays go away entirely.
 */
export function downconvertEvents(events) {
  const eventTriggers = [];
  const bubbleEvents = [];

  for (const ev of events || []) {
    const dialogSteps = [];
    const speechLines = [];
    const grants = [];
    let next;
    const dropped = [];

    for (const step of ev.steps || []) {
      switch (step.type) {
        case 'dialog':
          dialogSteps.push({ speaker: step.speaker || '', text: step.text, ...(step.video ? { video: step.video } : {}) });
          break;
        case 'speech':
          speechLines.push({ x: step.anchorX, y: step.anchorY, ...(step.speaker ? { speaker: step.speaker } : {}), text: step.text });
          break;
        case 'give':
          grants.push({ defId: step.defId, ...(step.count ? { count: step.count } : {}), x: step.x, y: step.y });
          break;
        case 'chain':
          next = step.eventId;
          break;
        default:
          dropped.push(step.type);
      }
    }

    const oneShot = ev.repeat !== 'everyTime';
    if (ev.repeat === 'whileConditions') {
      console.warn(`[downconvertEvents] event "${ev.id}": repeat:'whileConditions' has no legacy equivalent, treated as one-shot on down-convert.`);
    }

    if (ev.placement?.kind === 'proximity') {
      if (dialogSteps.length > 0) {
        console.warn(`[downconvertEvents] event "${ev.id}": dialog steps aren't representable with proximity placement in the legacy shape; dropped.`);
      }
      bubbleEvents.push({
        id: ev.id,
        oneShot,
        trigger: { type: 'proximity', x: ev.placement.x, y: ev.placement.y, radius: ev.placement.radius },
        lines: speechLines,
        ...(grants.length ? { grants } : {}),
        ...(next ? { next } : {}),
      });
    } else if (ev.placement?.kind === 'chainOnly') {
      if (speechLines.length > 0) {
        console.warn(`[downconvertEvents] event "${ev.id}": speech steps aren't representable on a chain-only event in the legacy shape; dropped.`);
      }
      eventTriggers.push({
        chainOnly: true,
        id: ev.id,
        steps: dialogSteps,
        oneShot,
        ...(grants.length ? { grants } : {}),
        ...(next ? { next } : {}),
      });
    } else {
      // tile placement: legacy distinguishes modal-dialog vs. speech-bubble by which
      // step kind is present. Dialog wins if both appear (can't occur pre-Phase-3);
      // an event with neither (grant-only) defaults to the dialog shape, which
      // already supports a grants-only, steps-less trigger.
      if (dialogSteps.length > 0 || speechLines.length === 0) {
        if (speechLines.length > 0) {
          console.warn(`[downconvertEvents] event "${ev.id}": mixes dialog and speech steps, which the legacy shape can't represent together; speech steps dropped.`);
        }
        eventTriggers.push({
          x: ev.placement?.x, y: ev.placement?.y,
          id: ev.id,
          steps: dialogSteps,
          oneShot,
          ...(grants.length ? { grants } : {}),
          ...(next ? { next } : {}),
        });
      } else {
        bubbleEvents.push({
          id: ev.id,
          oneShot,
          trigger: { type: 'tile', x: ev.placement?.x, y: ev.placement?.y },
          lines: speechLines,
          ...(grants.length ? { grants } : {}),
          ...(next ? { next } : {}),
        });
      }
    }

    if (dropped.length > 0) {
      console.warn(`[downconvertEvents] event "${ev.id}": step type(s) not representable in the legacy shape, dropped: ${dropped.join(', ')}`);
    }
  }

  return { eventTriggers, bubbleEvents };
}
