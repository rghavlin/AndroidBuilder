// Unified event model types for the map editor. Mirrors the plain-object shapes
// produced/consumed by migrateEvents.js (see QUEST_SYSTEM_PLAN.md §4).

export type ConditionKind = 'none' | 'itemEquipped' | 'itemInInventory' | 'itemConsumed' | 'flag' | 'var' | 'ap';
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
  | 'lockMovement' | 'unlockMovement' | 'lockActions' | 'unlockActions'
  | 'wait' | 'chain'
  | 'moveEntity' | 'startQuest' | 'setQuestTask' | 'setNpcAI'
  | 'controlEntity' | 'setFactionStance';

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
  // moveEntity
  entityTag?: string;
  targetX?: number;
  targetY?: number;
  // startQuest / setQuestTask
  questId?: string;
  taskIndex?: number;
  // setNpcAI (reuses entityTag above). `aiMode` is the current 3-state form;
  // `enabled` is the legacy 2-state field kept so older authored events still
  // run (EventRunner derives the mode from it when aiMode is absent).
  aiMode?: 'disabled' | 'normal' | 'attackOnSight';
  enabled?: boolean;
  // controlEntity (reuses entityTag above): open/close/lock/unlock a door or window
  entityAction?: 'open' | 'close' | 'lock' | 'unlock';
  // setFactionStance: set how faction `from` regards faction `to` at runtime.
  // When `to === 'player'`, `stance` accepts a disposition (neutral/extort/attackOnSight).
  factionFrom?: string;
  factionTo?: string;
  stance?: Stance | PlayerDisposition;
  mirror?: boolean;
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

// ─── Map Entity Registry ───────────────────────────────────────────────────
// Holds manual definitions of placed entities (doors, windows, zombies) that
// the event system can reference. NPCs with names are auto-registered.
// The tag is a unique name given by the author. At runtime, these are resolved
// to live instances on the map.

export interface EntityRegistryEntry {
  tag: string;
  type: 'door' | 'window' | 'zombie';
  x: number;
  y: number;
  description?: string;
}

export interface EntityRegistry {
  entries: EntityRegistryEntry[];
}

export function emptyEntityRegistry(): EntityRegistry {
  return { entries: [] };
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

export interface QuestTaskDef {
  id: string;
  text: string;
  complete: Condition[];
}

// ─── Quest completion rewards ──────────────────────────────────────────────
// Fired once, when a quest's last task completes (see QuestState.checkQuestProgression).
// Reuses the same step shapes as EventStep's 'give'/'setFlag'/'setVar' so the
// editor and runtime can share code; kept as its own narrow type so this list
// can only ever contain reward-shaped steps (kept extensible for more types later).
export type QuestRewardType = 'give' | 'setFlag' | 'setVar';
export interface QuestReward {
  type: QuestRewardType;
  // give
  defId?: string;
  count?: number;
  // setFlag
  flag?: string;
  value?: boolean;
  // setVar
  var?: string;
  op?: 'set' | 'add';
  varValue?: number;
}

export interface QuestDef {
  id: string;
  title: string;
  description: string;
  tasks: QuestTaskDef[];
  onComplete?: QuestReward[];
}

// ─── Factions ──────────────────────────────────────────────────────────────
// Directional stances mirror FactionRegistry: stances[from][to]. The `player`
// column is special — it holds a PlayerDisposition instead of a plain Stance.
export type Stance = 'ally' | 'neutral' | 'hostile';
export type PlayerDisposition = 'neutral' | 'extort' | 'attackOnSight';

export interface FactionDef {
  id: string;
  name: string;
  description?: string;
  builtin?: boolean;
}

export interface QuestRegistry {
  flags: FlagDef[];
  vars: VarDef[];
  quests: QuestDef[];
  // Author-created factions (built-ins live in FactionRegistry, not here).
  factions?: FactionDef[];
  // Authored stance deltas over the built-in baseline: factionStances[from][to].
  factionStances?: Record<string, Record<string, Stance | PlayerDisposition>>;
}

export function emptyQuestRegistry(): QuestRegistry {
  return { flags: [], vars: [], quests: [], factions: [], factionStances: {} };
}
