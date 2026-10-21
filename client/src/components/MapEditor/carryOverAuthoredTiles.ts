// Re-applies the hand-authored, tile-anchored layer of a map onto a freshly
// generated layout, so "Generate" can swap the terrain/buildings underneath a
// scenario without losing what its events depend on. Events address the map by
// coordinates (placement / give / moveEntity targets) and by entity tag, so the
// pieces copied here stay at their original (x, y):
//   - every placed entity (player spawn, NPCs, turrets, hand-placed zombies) —
//     the template generator emits none, so nothing is overwritten
//   - legacy tile event triggers
//   - items bound to an event (eventId), stairs, and exit arrows with an
//     authored destination; ordinary loot belongs to the old layout and is dropped
// Place icons (shop signs, fuel pumps, barriers) are NOT carried: the generator
// emits one per special building, so they belong to the layout — carrying them
// stacked a stale grocer sign in front of a random house on every Generate.
// For the same reason the road-chain exits (next/previous map) are not carried:
// each generated layout places its own at its own road ends.
// Anything that falls outside the new map's bounds is counted, not placed.

import { isTransitionItem, transitionTypeOf } from '../../game/inventory/transitionFields';

interface CarryTile {
  entities: any[];
  items: { defId: string; eventId?: string; transitionTargetType?: string }[];
  eventTrigger?: unknown;
}

const isAuthoredItem = (it: CarryTile['items'][number]) => !!it.eventId
  || (isTransitionItem(it) && !['next', 'previous'].includes(transitionTypeOf(it) ?? ''));

export interface CarryOverResult<T> {
  tiles: T[][];
  carried: number;
  dropped: number;
}

export function carryOverAuthoredTiles<T extends CarryTile>(oldTiles: T[][], newTiles: T[][]): CarryOverResult<T> {
  const height = newTiles.length;
  const width = newTiles[0]?.length ?? 0;
  const tiles = newTiles.map(row => row.slice());
  let carried = 0;
  let dropped = 0;

  oldTiles.forEach((row, y) => row.forEach((old, x) => {
    const eventItems = old.items.filter(isAuthoredItem);
    const count = old.entities.length + eventItems.length + (old.eventTrigger ? 1 : 0);
    if (count === 0) return;
    if (x >= width || y >= height) { dropped += count; return; }

    const t = tiles[y][x];
    tiles[y][x] = {
      ...t,
      entities: [...t.entities, ...old.entities],
      items: [...t.items, ...eventItems],
      ...(old.eventTrigger ? { eventTrigger: old.eventTrigger } : {}),
    };
    carried += count;
  }));

  return { tiles, carried, dropped };
}
