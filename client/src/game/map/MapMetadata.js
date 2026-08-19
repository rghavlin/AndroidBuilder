/**
 * The authored half of `gameMap.metadata` — the part that has to survive
 * serialization.
 *
 * `metadata` is stamped onto a GameMap once, at generation time
 * (TemplateMapGenerator.applyToGameMap), and everything authored in the map
 * editor rides on it: the map's events, its Switches & Variables registry, its
 * entity tags, its stairs/exit targets, its lighting. None of that was written
 * by GameMap.toJSON(), so a map you walked back into came back events-first-run
 * only — restored from the snapshot with `metadata` undefined, which reads as
 * "this map has no events, no quest registry, no transitions" everywhere
 * downstream (resolveMapEvents, applyMapRegistries, checkTransitionPoint).
 *
 * Only the authored/runtime-mutated fields are persisted. The generator's
 * scratch output (buildings, doors, windows, placeIcons, the raw scenario
 * `entities` list) is deliberately excluded: it is either already serialized at
 * the top level of the map or reconstituted from the restored tile entities,
 * and copying it here would duplicate the biggest part of every save.
 */
const PERSISTED_KEYS = [
  // Unified GameEvent model + the legacy arrays older maps still carry.
  'events',
  'eventTriggers',
  'bubbleEvents',
  // Flags/vars/factions seeded into QuestState, and quests read by the journal.
  'questRegistry',
  // entityTag -> entity lookups used by controlEntity / moveEntity / setNpcAI.
  'entityRegistry',
  // Stairs and road-edge exits (WorldManager.checkTransitionPoint).
  'mapTransitions',
  // playerStart / transitionPoints, re-read on every save and transition.
  'spawnZones',
  // Mutable at runtime via the setLightMode step.
  'lightMode',
  'alwaysDark',
];

/** The persistable subset of a live map's metadata, or null if there is none. */
export function pickPersistedMetadata(metadata) {
  if (!metadata) return null;
  const out = {};
  for (const key of PERSISTED_KEYS) {
    if (metadata[key] !== undefined) out[key] = structuredClone(metadata[key]);
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Reattach persisted metadata to a restored map. `buildings` is re-aliased to
 * the array the header restore already rebuilt, matching what
 * TemplateMapGenerator.applyToGameMap leaves on a freshly generated map.
 */
export function restoreMapMetadata(gameMap, data) {
  if (!data?.metadata) return;
  gameMap.metadata = structuredClone(data.metadata);
  gameMap.metadata.buildings = gameMap.buildings;
}
