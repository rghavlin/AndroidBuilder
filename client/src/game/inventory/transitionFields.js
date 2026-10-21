/**
 * transitionFields - the map-transition data carried by the items that move the
 * player between maps: the road exit arrow (placeable.exit) and stairs.
 *
 * The destination lives ON THE ITEM. There is no special terrain: an exit is an
 * ordinary road tile with an arrow item on it, exactly like stairs, and both are
 * resolved by WorldManager.resolveItemTransition.
 *
 *   transitionTargetType  'next' | 'previous'      — the procedural road chain
 *                         'scenario' | 'generator' — an authored destination
 *                         'tutorial_end'           — finish the tutorial
 *                         (absent on stairs authored before the field existed:
 *                         those are scenario links)
 *   transitionTargetId    scenario name / generator id (scenario, generator)
 *   transitionTargetX/Y   arrival tile; omitted = the destination's default
 *   transitionLevel       generator level (loot/zombie scaling)
 *
 * Kept in one list so Item, the ECS whitelist and the editor's item copies agree.
 */

export const TRANSITION_ITEM_IDS = ['placeable.exit', 'placeable.stairs_down', 'placeable.stairs_up'];
export const isTransitionItem = (item) => !!item && TRANSITION_ITEM_IDS.includes(item.defId);

export const TRANSITION_TYPES = ['next', 'previous', 'scenario', 'generator', 'tutorial_end'];

export const TRANSITION_FIELDS = [
  'transitionTargetType', 'transitionTargetId', 'transitionTargetX', 'transitionTargetY', 'transitionLevel',
];

/** Copy whichever transition fields `src` defines onto `dst`. Returns dst. */
export function copyTransitionFields(src, dst) {
  if (!src) return dst;
  for (const f of TRANSITION_FIELDS) {
    if (src[f] !== undefined) dst[f] = src[f];
  }
  return dst;
}

/** The item's effective transition type, or null for an exit with none set. */
export function transitionTypeOf(item) {
  if (item?.transitionTargetType) return item.transitionTargetType;
  return item?.defId === 'placeable.exit' ? null : 'scenario';
}

/**
 * Item fields for a legacy tile-level transition ({ targetType, targetId, level },
 * the shape the editor used to export as scenario.mapTransitions).
 */
export function fieldsFromLegacyMapTransition(tr) {
  if (tr.targetType === 'tutorial_end') return { transitionTargetType: 'tutorial_end' };
  const fields = { transitionTargetType: tr.targetType || 'scenario', transitionTargetId: tr.targetId };
  if (tr.targetType === 'generator' && tr.level !== undefined) fields.transitionLevel = tr.level;
  return fields;
}

/**
 * Item fields for a legacy 'transition' terrain tile that had no authored target:
 * the top row led to the next map, the bottom row back to the previous one.
 * Anywhere else it never did anything, so null.
 */
export function edgeExitFields(y, mapHeight) {
  if (y === 0) return { transitionTargetType: 'next' };
  if (y === mapHeight - 1) return { transitionTargetType: 'previous' };
  return null;
}

/** One-line summary for editor lists, e.g. "→ next map", "→ Tutorial01 (5,6)". */
export function describeTransition(item) {
  const type = transitionTypeOf(item);
  const at = item.transitionTargetX !== undefined && item.transitionTargetY !== undefined
    ? ` (${item.transitionTargetX},${item.transitionTargetY})` : '';
  switch (type) {
    case 'next': return `→ next map${at}`;
    case 'previous': return `→ previous map${at}`;
    case 'tutorial_end': return '→ tutorial end';
    case 'generator': return `→ ${item.transitionTargetId || '(no generator)'} Lv${item.transitionLevel ?? 1}${at}`;
    case 'scenario': return `→ ${item.transitionTargetId || '(no map)'}${at}`;
    default: return '→ (no destination)';
  }
}
