// Unified event model types for the map editor. Mirrors the plain-object shapes
// produced/consumed by migrateEvents.js (see QUEST_SYSTEM_PLAN.md §4).

export type ConditionKind = 'none' | 'itemEquipped' | 'itemInInventory' | 'itemConsumed' | 'flag' | 'var' | 'ap';
export type CompareOp = '==' | '!=' | '>=' | '<=' | '>' | '<';

export interface Condition {
  kind: ConditionKind;
  defId?: string;
  count?: number;
  flag?: string;
  value?: boolean | number | string;
  var?: string;
  op?: CompareOp;
}

// Global variables may hold either a number (reputation, kills, ammo…) or a
// string (a chosen name, a branch id…). Declared per-var in the map's
// Switches & Variables registry; the runtime store (QuestState) is
// type-agnostic and keeps whatever value it's handed.
export type VarType = 'number' | 'string';

export type PlacementKind = 'tile' | 'proximity' | 'chainOnly';
export interface Placement {
  kind: PlacementKind;
  x?: number;
  y?: number;
  radius?: number;
}

export type TriggerType = 'onEnter' | 'onInteract' | 'auto' | 'parallel' | 'onMapEnter';
export type RepeatMode = 'once' | 'everyTime' | 'whileConditions' | 'oncePerTurn';

// What the event looks like on the map while it is active. This is our
// equivalent of an RPG Maker event page's *graphic*: since we use flat
// first-eligible-wins events rather than pages (QUEST_SYSTEM_PLAN §10 decision
// 2), the sprite belongs to the event, and its presence is recomputed from the
// event's own preconditions by EventMarkers.syncEventMarkers().
//
// Authoring an on/off switch is therefore two events on one tile with opposite
// flag preconditions and opposite appearances — exactly one is ever eligible,
// so exactly one sprite ever exists.
export interface EventAppearance {
  defId: string; // item def spawned at placement.{x,y} while the event is active
}

export type StepType =
  | 'dialog' | 'speech' | 'give' | 'setFlag' | 'setVar'
  | 'lockMovement' | 'unlockMovement' | 'lockActions' | 'unlockActions'
  | 'wait' | 'chain'
  | 'moveEntity' | 'startQuest' | 'setQuestTask' | 'setNpcAI'
  | 'controlEntity' | 'setFactionStance' | 'setLightMode';

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
  varValue?: number | string;
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
  // setLightMode: change map lighting dynamically ('always_dark' | 'always_light' | 'time_dependent')
  lightMode?: 'always_dark' | 'always_light' | 'time_dependent';
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
  // Only honoured for placement.kind === 'tile'.
  appearance?: EventAppearance;
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

// ─── Legacy (down-converted) event shapes ─────────────────────────────────
// What `downconvertEvents()` in migrateEvents.js emits, and what the runtime
// still reads off `gameMap.metadata` / a scenario's top level. The unified
// GameEvent above is the authoring model; these are its lossy projection onto
// the two older arrays (see QUEST_SYSTEM_PLAN.md §4 and §11.2).
//
// They live here rather than being inferred at each call site because
// down-convert builds each entry in one of several branches: TS would
// otherwise infer a union of object literals and reject any field that is
// absent from one arm (`chainOnly`, `x`, `y`), even where the code guards for
// it. One interface with the branch-specific fields optional describes the
// array accurately.

// An event effect: spawn `count` of `defId` onto tile (x, y) when it fires.
export interface LegacyItemGrant {
  defId: string;
  count?: number;
  x: number;
  y: number;
}

export interface LegacyDialogStep {
  speaker: string;
  text: string;
  video?: string;
}

// One line of an on-map speech bubble, anchored to a specific tile/entity.
export interface LegacyBubbleLine {
  x: number;
  y: number;
  speaker?: string;
  text: string;
}

// A modal-dialog event. Tile-placed events carry x/y; chain-only events carry
// `chainOnly: true` and no coordinates, so both are optional here — narrow on
// `chainOnly` or an explicit `x/y !== undefined` check before using them.
export interface LegacyEventTrigger {
  id: string;
  steps: LegacyDialogStep[];
  oneShot: boolean;
  chainOnly?: boolean;
  x?: number;
  y?: number;
  grants?: LegacyItemGrant[];
  next?: string;
  // Pre-`steps` authored form: a single line of text instead of a step list.
  // Never emitted by down-convert; still read when loading older maps.
  message?: string;
}

// A tile-placed or proximity speech-bubble event. trigger.x/y are always set
// for both placement kinds the editor can author.
export interface LegacyBubbleEvent {
  id: string;
  oneShot: boolean;
  trigger: { type: 'tile' | 'proximity'; x: number; y: number; radius?: number };
  lines: LegacyBubbleLine[];
  grants?: LegacyItemGrant[];
  next?: string; // id of an event to fire when this one completes
}

export interface DownconvertedEvents {
  eventTriggers: LegacyEventTrigger[];
  bubbleEvents: LegacyBubbleEvent[];
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
  // Omitted means 'number' (back-compat: every var authored before string
  // support was numeric).
  type?: VarType;
  // For a number var, defaults to 0 if omitted; for a string var, ''.
  initialValue?: number | string;
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
  varValue?: number | string;
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
