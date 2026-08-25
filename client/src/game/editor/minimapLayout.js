/**
 * minimapLayout - pure sizing maths for the map editor's navigation minimap.
 *
 * Extracted from editor.tsx (AGENTS.md §6: pure helpers belong in game/editor/).
 *
 * The old rule was `scale = min(120 / mapPxW, 120 / mapPxH)` — fit the whole map
 * inside a 120x120 box, preserving aspect. That works for roughly square maps
 * and collapses for long ones: a 20x800 corridor is 640x25600 map pixels, which
 * fits into a **3 x 120** canvas. Three pixels wide is not a navigation aid, and
 * a corridor is exactly the map you most need one for, because it is 25,600
 * pixels of scrolling with no landmarks.
 *
 * Two changes fix it:
 *   1. Separate budgets for the long and short axis, so a tall map is allowed to
 *      be a tall minimap instead of being squeezed to fit a square.
 *   2. A floor on the short axis. Past roughly 1:10 even the generous budget
 *      leaves a hairline, so the narrow axis gets widened past its true scale.
 *      That deliberately distorts the aspect ratio, which is safe here: every
 *      consumer of this canvas (the drawImage blit, the viewport rectangle, the
 *      click-to-scroll handler) works in fractions of canvas.width/height rather
 *      than in map pixels, so a stretched minimap stays numerically correct.
 */

/** Cap on the narrow axis — how wide a tall map's minimap may get. */
export const MINIMAP_MAX_SHORT = 120;
/** Cap on the long axis — how tall a tall map's minimap may get. */
export const MINIMAP_MAX_LONG = 400;
/** Floor on the narrow axis, so extreme aspect ratios stay clickable. */
export const MINIMAP_MIN_SHORT = 44;

/**
 * Pixel size for the minimap canvas backing store.
 *
 * @param {number} mapPxW - full map width in pixels (tiles * CELL)
 * @param {number} mapPxH - full map height in pixels (tiles * CELL)
 * @returns {{width: number, height: number, stretched: boolean}} canvas size,
 *   and whether the short axis had to be widened past its true scale.
 */
export function computeMinimapSize(mapPxW, mapPxH) {
  if (!(mapPxW > 0) || !(mapPxH > 0)) {
    return { width: 0, height: 0, stretched: false };
  }

  const isTall = mapPxH >= mapPxW;
  const scale = isTall
    ? Math.min(MINIMAP_MAX_SHORT / mapPxW, MINIMAP_MAX_LONG / mapPxH)
    : Math.min(MINIMAP_MAX_LONG / mapPxW, MINIMAP_MAX_SHORT / mapPxH);

  let width = Math.max(1, Math.round(mapPxW * scale));
  let height = Math.max(1, Math.round(mapPxH * scale));

  let stretched = false;
  if (isTall && width < MINIMAP_MIN_SHORT) {
    width = MINIMAP_MIN_SHORT;
    stretched = true;
  } else if (!isTall && height < MINIMAP_MIN_SHORT) {
    height = MINIMAP_MIN_SHORT;
    stretched = true;
  }

  return { width, height, stretched };
}
