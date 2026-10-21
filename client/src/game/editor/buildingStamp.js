/**
 * buildingStamp - the map editor's "Stamp Building" tool, minus the React.
 *
 * Stamped buildings are drawn by the generator's own MapBuilder code, never a
 * second copy of it: a house goes through MapBuilder.drawBuilding with a forced
 * floorplan, a special through drawSpecialBuilding, the tent through
 * drawArmyTent. So a stamp carries everything a generated building does —
 * partition walls, interior/exterior/garage doors, windows, signs, the gas
 * station's paved lot, and the building record (room roles, floorplanId,
 * furniturePlan) that loot and furniture read in-game — and stays identical to
 * generated buildings as the generator evolves.
 *
 * The builder draws onto a blank grass map. Only the cells it actually touched
 * (see stampedCells) are copied into the editor's map, so the gap between a
 * shop and its sign keeps whatever terrain the author painted there.
 *
 * Door locks and window positions roll gameRandom exactly as generation does,
 * so re-stamping gives a fresh roll.
 */
import { MapBuilder } from '../map/MapBuilder.js';
import { FLOORPLANS, mirrorFloorplanH } from '../map/FloorplanRegistry.js';
import { SPECIAL_BUILDING_SPECS } from '../map/BuildingTypes.js';

export const FRONTAGES = ['south', 'west', 'north', 'east'];
const TENT = { width: 10, height: 6 }; // MapBuilder.drawArmyTent's fixed shape

const FAMILY_LABELS = {
  parallel: 'Houses: hall across',
  perp: 'Houses: hall front-to-back',
  open: 'Houses: open plan',
};

const houseItem = (p) => {
  const beds = Object.values(p.legend).filter(r => r === 'bedroom').length;
  return { key: `house:${p.id}`, label: `${p.id} (${p.width}×${p.height}, ${beds} bed)`, frontages: FRONTAGES, mirrorable: true };
};

/** Picker contents: [{ label, items: [{ key, label, frontages, mirrorable }] }]. */
export const STAMP_GROUPS = [
  ...Object.entries(FAMILY_LABELS).map(([family, label]) => ({
    label,
    items: FLOORPLANS.filter(p => p.archetype === family)
      .slice().sort((a, b) => a.width * a.height - b.width * b.height || a.id.localeCompare(b.id))
      .map(houseItem),
  })),
  {
    label: 'Special buildings',
    items: [
      ...Object.entries(SPECIAL_BUILDING_SPECS).map(([type, s]) => (
        { key: `special:${type}`, label: `${type} (${s.width}×${s.height})`, frontages: FRONTAGES, mirrorable: false })),
      // drawArmyTent only opens east or west.
      { key: 'tent:army_tent', label: `army_tent (${TENT.width}×${TENT.height})`, frontages: ['east', 'west'], mirrorable: false },
    ],
  },
];

const ITEMS = new Map(STAMP_GROUPS.flatMap(g => g.items).map(i => [i.key, i]));
export const getStampItem = (key) => ITEMS.get(key) || null;

/**
 * Draw the selected building onto `builder` with its lot anchored at (x, y).
 * @param {{ key: string, frontage: string, mirror?: boolean }} sel
 */
function drawSelection(builder, sel, x, y) {
  const [kind, id] = sel.key.split(':');
  if (kind === 'house') {
    let plan = FLOORPLANS.find(p => p.id === id);
    if (!plan) throw new Error(`Unknown floorplan '${id}'`);
    if (sel.mirror) plan = mirrorFloorplanH(plan);
    const sideways = sel.frontage === 'east' || sel.frontage === 'west';
    builder.drawBuilding(x, y, sideways ? plan.height : plan.width, sideways ? plan.width : plan.height, sel.frontage, 'residential', plan);
  } else if (kind === 'special') {
    const spec = SPECIAL_BUILDING_SPECS[id];
    builder.drawSpecialBuilding({ x, y, width: spec.width, height: spec.height, frontage: sel.frontage }, id);
  } else if (kind === 'tent') {
    // drawArmyTent puts the tent at (startX+1, startY+1); undo that offset.
    builder.drawArmyTent(x - 1, y - 1, sel.frontage !== 'west');
  } else {
    throw new Error(`Unknown stamp '${sel.key}'`);
  }
}

/**
 * Cells the builder changed from its blank grass canvas: anything inside a
 * building it registered, plus any non-grass terrain or edge wall outside
 * (the gas station's lot). Place icons are reported separately.
 */
export function stampedCells(mapData) {
  const cells = [];
  const inBuilding = (x, y) => mapData.metadata.buildings.some(b =>
    x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height);
  mapData.tiles.forEach((row, y) => row.forEach((t, x) => {
    const e = t.edgeWalls;
    if (t.terrain !== 'grass' || e.n || e.e || e.s || e.w || inBuilding(x, y)) cells.push({ x, y });
  }));
  return cells;
}

/**
 * Draw the stamp onto a full-size scratch map at its real coordinates.
 * Returns the builder's mapData (scenario format) — tiles, doors, windows,
 * garageDoors, placeIcons and buildings all in the editor map's coordinates.
 */
export function buildStampMap(sel, x, y, mapW, mapH) {
  const builder = new MapBuilder(mapW, mapH);
  drawSelection(builder, sel, x, y);
  return builder.getFinalMapData('stamp', {});
}

const PAD = 8; // > the furthest anything is drawn outside the lot (gas station lot + 1 shift)

/**
 * Footprint of a selection relative to the cursor (the lot's top-left):
 * `bounds` covers every touched cell and icon, `building` the walls alone.
 * Measured by drawing on a padded scratch map, so it can't drift from what
 * the builder really does.
 */
export function measureStamp(sel) {
  const mapData = buildStampMap(sel, PAD, PAD, 22 + 2 * PAD, 22 + 2 * PAD);
  const pts = [...stampedCells(mapData), ...mapData.metadata.placeIcons];
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const b = mapData.metadata.buildings[0];
  return {
    bounds: { x: minX - PAD, y: minY - PAD, w: Math.max(...xs) - minX + 1, h: Math.max(...ys) - minY + 1 },
    building: { x: b.x - PAD, y: b.y - PAD, w: b.width, h: b.height },
  };
}

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Why the stamp can't go at (x, y), or null if it can.
 * @param {ReturnType<typeof measureStamp>} footprint
 * @param {{x:number,y:number,width:number,height:number}[]} buildings existing buildings
 * @param {{x:number,y:number,w:number,h:number}[]} furniture existing loose furniture
 */
export function stampBlockedReason(footprint, x, y, mapW, mapH, buildings, furniture) {
  const bounds = { ...footprint.bounds, x: x + footprint.bounds.x, y: y + footprint.bounds.y };
  const walls = { ...footprint.building, x: x + footprint.building.x, y: y + footprint.building.y };
  if (bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.w > mapW || bounds.y + bounds.h > mapH) return 'does not fit on the map';
  if (buildings.some(b => overlaps(bounds, { x: b.x, y: b.y, w: b.width, h: b.height }))) return 'overlaps an existing building';
  if (furniture.some(p => overlaps(walls, p))) return 'overlaps loose furniture';
  return null;
}

/**
 * Copy the stamp into the editor's tiles. `scratchTiles` are the editor-format
 * tiles converted from `mapData` (scenarioToEditorState), so doors, windows
 * and garage doors arrive as edge flags. Terrain, edges and decoration of each
 * stamped cell are replaced; entities and items already there are kept.
 * Returns a new grid; the input is not mutated.
 */
export function mergeStampTiles(tiles, scratchTiles, mapData) {
  const next = tiles.map(row => row.slice());
  for (const { x, y } of stampedCells(mapData)) {
    const { decoration, placeIcon, ...kept } = next[y][x];
    const s = scratchTiles[y][x];
    next[y][x] = { ...kept, terrain: s.terrain, edgeWalls: s.edgeWalls, ...(s.decoration ? { decoration: s.decoration } : {}) };
  }
  for (const icon of mapData.metadata.placeIcons) {
    next[icon.y][icon.x] = { ...next[icon.y][icon.x], placeIcon: icon.subtype };
  }
  return next;
}
