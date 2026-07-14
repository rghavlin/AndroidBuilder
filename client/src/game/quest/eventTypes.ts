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

// ─── Switches & Variables registry (map editor authoring aid) ─────────────
// Flags/vars themselves are just name-keyed entries on engine.questState at
// runtime (see QuestState.js) — this registry exists purely so the editor
// has a place to define names up front and every flag/var picker (condition
// rows, setFlag/setVar steps) can offer a real dropdown instead of free text.
// `initialValue` is read once per name by QuestState.seedFromRegistry() when
// a map loads — it seeds any name never before touched, and never overwrites
// one already set by prior play (see that method's doc for why).

export interface FlagDef {
  name: string;
  description?: string;
  initialValue?: boolean; // defaults to false if omitted
}

export interface VarDef {
  name: string;
  description?: string;
  initialValue?: number; // defaults to 0 if omitted
}

export interface QuestRegistry {
  flags: FlagDef[];
  vars: VarDef[];
}

export function emptyQuestRegistry(): QuestRegistry {
  return { flags: [], vars: [] };
}
