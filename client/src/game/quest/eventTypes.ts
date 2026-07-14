// Unified event model types for the map editor. Mirrors the plain-object shapes
// produced/consumed by migrateEvents.js (see QUEST_SYSTEM_PLAN.md §4).

export type ConditionKind = 'none' | 'itemEquipped' | 'itemInInventory' | 'flag' | 'var';
export type CompareOp = '==' | '!=' | '>=' | '<=' | '>' | '<';

export interface Condition {
  kind: ConditionKind;
  defId?: string;
  count?: number;
  flag?: string;
  value?: boolean | number;
  var?: string;
  op?: CompareOp;
}

export type PlacementKind = 'tile' | 'proximity' | 'chainOnly';
export interface Placement {
  kind: PlacementKind;
  x?: number;
  y?: number;
  radius?: number;
}

export type TriggerType = 'onEnter' | 'onInteract' | 'auto' | 'parallel';
export type RepeatMode = 'once' | 'everyTime' | 'whileConditions';

export type StepType =
  | 'dialog' | 'speech' | 'give' | 'setFlag' | 'setVar'
  | 'lockMovement' | 'unlockMovement' | 'wait' | 'chain';

export interface EventStep {
  type: StepType;
  // dialog
  speaker?: string;
  text?: string;
  video?: string;
  // speech
  anchorX?: number;
  anchorY?: number;
  // give
  defId?: string;
  count?: number;
  x?: number;
  y?: number;
  // setFlag
  flag?: string;
  value?: boolean;
  // setVar
  var?: string;
  op?: 'set' | 'add';
  varValue?: number;
  // lockMovement
  until?: Condition[];
  // wait
  ms?: number;
  // chain
  eventId?: string;
}

export interface GameEvent {
  id: string;
  label?: string;
  placement: Placement;
  trigger: TriggerType;
  preconditions: Condition[];
  endWhen?: Condition[];
  repeat: RepeatMode;
  steps: EventStep[];
}

export function emptyEvent(id: string): GameEvent {
  return {
    id,
    placement: { kind: 'tile' },
    trigger: 'onEnter',
    preconditions: [],
    repeat: 'once',
    steps: [],
  };
}
