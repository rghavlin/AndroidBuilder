import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ScenarioStorage } from '@/game/ScenarioStorage';
import { ItemDefs, createItemFromDef } from '@/game/inventory/ItemDefs';
import { ItemCategory } from '@/game/inventory/traits';

// ─── Constants ──────────────────────────────────────────────────────────────

const TERRAIN_TYPES = [
  { id: 'grass',     label: 'Grass',     color: '#1a3c1a' },
  { id: 'road',      label: 'Road',      color: '#2d2d2d' },
  { id: 'sidewalk',  label: 'Sidewalk',  color: '#555' },
  { id: 'floor',     label: 'Floor',     color: '#333' },
  { id: 'dirt',      label: 'Dirt',      color: '#3d2b1f' },
  { id: 'water',     label: 'Water',     color: '#1a3c5a' },
  { id: 'fence',     label: 'Fence',     color: '#4a3728' },
  { id: 'tent_floor',label: 'Tent Floor',color: '#5b4d3d' },
];

const EDGE_COLORS: Record<string, string> = {
  wall: '#ccc',
  door: '#c8a032',
  window: '#5599dd',
};

const ENTITY_TYPES = [
  { id: 'zombie',     label: 'Zombie',     symbol: 'Z', color: '#c44' },
  { id: 'npc',        label: 'NPC',        symbol: 'N', color: '#4a4' },
  { id: 'player',     label: 'Player Spawn', symbol: 'P', color: '#48f' },
  { id: 'rabbit',     label: 'Rabbit',     symbol: 'R', color: '#a86' },
];

const BUILDING_TYPES = [
  'residential', 'police', 'firestation', 'grocer', 'gas_station',
  'army_tent', 'hardware_store', 'lab'
];

type Edge = 'n' | 'e' | 's' | 'w';
type ToolMode = 'terrain' | 'edge_wall' | 'edge_door' | 'edge_window' | 'entity' | 'item' | 'building_rect' | 'eraser' | 'event_trigger';

interface EdgeState { wall: boolean; door: boolean; window: boolean; }
interface TileData {
  terrain: string;
  edgeWalls: Record<Edge, EdgeState>;
  entities: { type: string; subtype?: string }[];
  items: string[];
  eventTrigger?: { id: string; steps: { speaker: string; text: string }[]; oneShot: boolean };
}

interface BuildingMeta {
  type: string;
  x: number; y: number;
  width: number; height: number;
}

interface ScenarioData {
  name: string;
  width: number;
  height: number;
  tiles: TileData[][];
  buildings: BuildingMeta[];
  playerSpawn: { x: number; y: number } | null;
}

function createEmptyTile(terrain = 'grass'): TileData {
  return {
    terrain,
    edgeWalls: {
      n: { wall: false, door: false, window: false },
      e: { wall: false, door: false, window: false },
      s: { wall: false, door: false, window: false },
      w: { wall: false, door: false, window: false },
    },
    entities: [],
    items: [],
  };
}

function createEmptyGrid(w: number, h: number): TileData[][] {
  const grid: TileData[][] = [];
  for (let y = 0; y < h; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < w; x++) row.push(createEmptyTile());
    grid.push(row);
  }
  return grid;
}

function sanitizeTiles(tiles: any[][]): TileData[][] {
  return tiles.map(row =>
    row.map(t => {
      const empty = createEmptyTile(t.terrain || 'grass');
      return {
        ...empty,
        ...t,
        edgeWalls: {
          n: { ...empty.edgeWalls.n, ...t.edgeWalls?.n },
          e: { ...empty.edgeWalls.e, ...t.edgeWalls?.e },
          s: { ...empty.edgeWalls.s, ...t.edgeWalls?.s },
          w: { ...empty.edgeWalls.w, ...t.edgeWalls?.w },
        },
        entities: t.entities || [],
        items: t.items || [],
      };
    })
  );
}

function scenarioToEditorState(scenario: any): { name: string; width: number; height: number; tiles: TileData[][]; buildings: any[] } {
  const w = scenario.width;
  const h = scenario.height;
  const tiles = createEmptyGrid(w, h);

  // Rebuild terrain and edge walls from scenario tiles
  if (scenario.tiles) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const st = scenario.tiles[y]?.[x];
        if (!st) continue;
        tiles[y][x].terrain = st.terrain || 'grass';

        // Scenario edgeWalls are booleans; reconstruct as wall flags
        if (st.edgeWalls) {
          (['n', 'e', 's', 'w'] as Edge[]).forEach(edge => {
            if (st.edgeWalls[edge]) {
              tiles[y][x].edgeWalls[edge].wall = true;
            }
          });
        }

        // Items: scenario stores as inventoryItems with defId
        if (st.inventoryItems) {
          tiles[y][x].items = st.inventoryItems.map((it: any) => it.defId || it.id).filter(Boolean);
        }
      }
    }
  }

  // Doors: clear wall flag, set door flag
  if (scenario.metadata?.doors) {
    for (const d of scenario.metadata.doors) {
      const t = tiles[d.y]?.[d.x];
      if (!t || !d.edge) continue;
      t.edgeWalls[d.edge as Edge].wall = false;
      t.edgeWalls[d.edge as Edge].door = true;
    }
  }

  // Windows: clear wall flag, set window flag
  if (scenario.metadata?.windows) {
    for (const win of scenario.metadata.windows) {
      const t = tiles[win.y]?.[win.x];
      if (!t || !win.edge) continue;
      t.edgeWalls[win.edge as Edge].wall = false;
      t.edgeWalls[win.edge as Edge].window = true;
    }
  }

  // Entities: top-level array → per-tile
  if (scenario.entities) {
    for (const e of scenario.entities) {
      const t = tiles[e.y]?.[e.x];
      if (t) t.entities.push({ type: e.type, subtype: e.subtype });
    }
  }

  // Player spawn from metadata
  const spawn = scenario.metadata?.spawnZones?.playerStart?.[0];
  if (spawn) {
    const t = tiles[spawn.y]?.[spawn.x];
    if (t && !t.entities.some((e: any) => e.type === 'player')) {
      t.entities.push({ type: 'player' });
    }
  }

  // Event triggers
  const triggers = scenario.eventTriggers || scenario.metadata?.eventTriggers;
  if (triggers) {
    for (const evt of triggers) {
      const t = tiles[evt.y]?.[evt.x];
      if (!t) continue;
      if (evt.steps) {
        t.eventTrigger = { id: evt.id, steps: evt.steps, oneShot: evt.oneShot ?? true };
      } else if (evt.message) {
        t.eventTrigger = { id: evt.id, steps: [{ speaker: '', text: evt.message }], oneShot: true };
      }
    }
  }

  return {
    name: scenario.name || 'untitled',
    width: w,
    height: h,
    tiles,
    buildings: scenario.metadata?.buildings || [],
  };
}

// ─── Export: convert editor state → MapBuilder-compatible JSON ───────────

function exportScenario(scenario: ScenarioData) {
  const tiles = scenario.tiles.map((row, y) =>
    row.map((t, x) => {
      const edgeWalls = {
        n: t.edgeWalls.n.wall || t.edgeWalls.n.door || t.edgeWalls.n.window,
        e: t.edgeWalls.e.wall || t.edgeWalls.e.door || t.edgeWalls.e.window,
        s: t.edgeWalls.s.wall || t.edgeWalls.s.door || t.edgeWalls.s.window,
        w: t.edgeWalls.w.wall || t.edgeWalls.w.door || t.edgeWalls.w.window,
      };
      const tile: any = { x, y, terrain: t.terrain, edgeWalls, contents: [] };
      if (t.items.length > 0) {
        tile.inventoryItems = t.items.map(defId => {
          const full = createItemFromDef(defId);
          return full || { defId, quantity: 1 };
        });
      }
      return tile;
    })
  );

  const doors: any[] = [];
  const windows: any[] = [];
  scenario.tiles.forEach((row, y) =>
    row.forEach((t, x) => {
      (['n', 'e', 's', 'w'] as Edge[]).forEach(edge => {
        if (t.edgeWalls[edge].door) {
          doors.push({ x, y, isLocked: false, isOpen: false, edge });
        }
        if (t.edgeWalls[edge].window) {
          windows.push({ x, y, isLocked: false, isOpen: false, edge });
        }
      });
    })
  );

  const entities: any[] = [];
  scenario.tiles.forEach((row, y) =>
    row.forEach((t, x) => {
      t.entities.forEach(e => {
        entities.push({ type: e.type, x, y, subtype: e.subtype || null });
      });
    })
  );

  const eventTriggers: any[] = [];
  scenario.tiles.forEach((row, y) =>
    row.forEach((t, x) => {
      if (t.eventTrigger) {
        eventTriggers.push({ x, y, ...t.eventTrigger });
      }
    })
  );

  return {
    name: scenario.name,
    width: scenario.width,
    height: scenario.height,
    tiles,
    metadata: {
      buildings: scenario.buildings,
      specialBuildings: scenario.buildings.filter(b =>
        ['police', 'firestation', 'grocer', 'gas_station', 'army_tent', 'hardware_store', 'lab'].includes(b.type)
      ),
      doors,
      windows,
      placeIcons: [],
      spawnZones: scenario.playerSpawn
        ? { playerStart: [scenario.playerSpawn] }
        : {},
    },
    entities,
    eventTriggers,
  };
}

// ─── Main Editor Component ──────────────────────────────────────────────

const CELL = 32;

export default function MapEditor() {
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(20);
  const [scenarioName, setScenarioName] = useState('untitled');
  const [tiles, setTiles] = useState<TileData[][]>(() => createEmptyGrid(20, 20));
  const [buildings, setBuildings] = useState<BuildingMeta[]>([]);

  const [tool, setTool] = useState<ToolMode>('terrain');
  const [brushSize, setBrushSize] = useState(1);
  const [selectedTerrain, setSelectedTerrain] = useState('grass');
  const [selectedEdge, setSelectedEdge] = useState<Edge>('n');
  const [selectedEntity, setSelectedEntity] = useState('zombie');
  const [selectedBuildingType, setSelectedBuildingType] = useState('residential');
  const [selectedItem, setSelectedItem] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [triggerId, setTriggerId] = useState('');
  const [dialogSteps, setDialogSteps] = useState<{ speaker: string; text: string }[]>([]);
  const [dialogOneShot, setDialogOneShot] = useState(true);
  const [editSpeaker, setEditSpeaker] = useState('');
  const [editText, setEditText] = useState('');
  const dialogStepsRef = useRef(dialogSteps);
  dialogStepsRef.current = dialogSteps;

  // Build categorized item catalog from ItemDefs
  const allItems = useMemo(() => {
    return Object.entries(ItemDefs as Record<string, any>)
      .map(([id, def]) => ({
        id,
        name: def.name || id,
        w: def.width || 1,
        h: def.height || 1,
        categories: (def.categories || []) as string[],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const itemCategories = useMemo(() => {
    const cats = new Set<string>();
    allItems.forEach(it => it.categories.forEach(c => cats.add(c)));
    return Array.from(cats).sort();
  }, [allItems]);

  const filteredItems = useMemo(() => {
    if (!itemCategory) return allItems;
    return allItems.filter(it => it.categories.includes(itemCategory));
  }, [allItems, itemCategory]);

  const [isPainting, setIsPainting] = useState(false);
  const [buildStart, setBuildStart] = useState<{ x: number; y: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [showLoadPicker, setShowLoadPicker] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<{ name: string; width: number; height: number }[]>([]);
  const [inspectTile, setInspectTile] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const undoStack = useRef<{ tiles: TileData[][]; buildings: BuildingMeta[] }[]>([]);
  const strokeUndoPushed = useRef(false);
  const buildingsRef = useRef(buildings);
  buildingsRef.current = buildings;
  const pushUndo = useCallback((tileSnap: TileData[][], buildingSnap: BuildingMeta[]) => {
    undoStack.current.push({ tiles: tileSnap, buildings: buildingSnap });
    if (undoStack.current.length > 50) undoStack.current.shift();
  }, []);
  const handleUndo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev) {
      setTiles(prev.tiles);
      setBuildings(prev.buildings);
      setStatusMsg('Undo');
    }
  }, []);

  // ─── Ctrl+Z undo shortcut ─────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo]);

  // ─── Resize ──────────────────────────────────────────────────────────
  const resizeMap = useCallback((newW: number, newH: number) => {
    setTiles(prev => {
      const next = createEmptyGrid(newW, newH);
      for (let y = 0; y < Math.min(prev.length, newH); y++) {
        for (let x = 0; x < Math.min(prev[0].length, newW); x++) {
          next[y][x] = prev[y][x];
        }
      }
      return next;
    });
    setWidth(newW);
    setHeight(newH);
  }, []);

  // ─── Apply tool to cell ──────────────────────────────────────────────
  const applyTool = useCallback((x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;

    setTiles(prev => {
      if (!strokeUndoPushed.current) {
        pushUndo(prev, buildingsRef.current);
        strokeUndoPushed.current = true;
      }
      const next = prev.map(row => row.map(t => ({ ...t })));

      const useBrush = tool === 'terrain' || tool === 'eraser';
      const half = Math.floor(brushSize / 2);
      const coords: { cx: number; cy: number }[] = [];
      if (useBrush) {
        for (let dy = -half; dy < brushSize - half; dy++) {
          for (let dx = -half; dx < brushSize - half; dx++) {
            const cx = x + dx, cy = y + dy;
            if (cx >= 0 && cy >= 0 && cx < width && cy < height) coords.push({ cx, cy });
          }
        }
      } else {
        coords.push({ cx: x, cy: y });
      }

      for (const { cx, cy } of coords) {
      const tile = { ...next[cy][cx], edgeWalls: { ...next[cy][cx].edgeWalls }, entities: [...next[cy][cx].entities], items: [...next[cy][cx].items] };
      // Deep-copy each edge
      (['n', 'e', 's', 'w'] as Edge[]).forEach(e => {
        tile.edgeWalls[e] = { ...tile.edgeWalls[e] };
      });

      switch (tool) {
        case 'terrain':
          tile.terrain = selectedTerrain;
          break;
        case 'edge_wall':
          tile.edgeWalls[selectedEdge].wall = !tile.edgeWalls[selectedEdge].wall;
          tile.edgeWalls[selectedEdge].door = false;
          tile.edgeWalls[selectedEdge].window = false;
          break;
        case 'edge_door':
          tile.edgeWalls[selectedEdge].door = !tile.edgeWalls[selectedEdge].door;
          tile.edgeWalls[selectedEdge].wall = false;
          tile.edgeWalls[selectedEdge].window = false;
          break;
        case 'edge_window':
          tile.edgeWalls[selectedEdge].window = !tile.edgeWalls[selectedEdge].window;
          tile.edgeWalls[selectedEdge].wall = false;
          tile.edgeWalls[selectedEdge].door = false;
          break;
        case 'entity':
          if (selectedEntity === 'player') {
            // Remove any existing player spawns
            next.forEach(row => row.forEach(t => {
              t.entities = t.entities.filter(e => e.type !== 'player');
            }));
            tile.entities = tile.entities.filter(e => e.type !== 'player');
          }
          tile.entities.push({ type: selectedEntity });
          break;
        case 'item':
          if (selectedItem) tile.items.push(selectedItem);
          break;
        case 'event_trigger':
          if (triggerId && dialogStepsRef.current.length > 0) {
            tile.eventTrigger = { id: triggerId, steps: [...dialogStepsRef.current], oneShot: dialogOneShot };
          }
          break;
        case 'eraser':
          tile.terrain = 'grass';
          tile.edgeWalls = {
            n: { wall: false, door: false, window: false },
            e: { wall: false, door: false, window: false },
            s: { wall: false, door: false, window: false },
            w: { wall: false, door: false, window: false },
          };
          tile.entities = [];
          tile.items = [];
          delete tile.eventTrigger;
          break;
      }

      next[cy][cx] = tile;
      }
      return next;
    });
  }, [tool, selectedTerrain, selectedEdge, selectedEntity, selectedItem, triggerId, dialogSteps, dialogOneShot, brushSize, width, height]);

  // ─── Building rect drawing ──────────────────────────────────────────
  const finishBuildingRect = useCallback((endX: number, endY: number) => {
    if (!buildStart) return;
    const x1 = Math.min(buildStart.x, endX);
    const y1 = Math.min(buildStart.y, endY);
    const x2 = Math.max(buildStart.x, endX);
    const y2 = Math.max(buildStart.y, endY);
    const bw = x2 - x1 + 1;
    const bh = y2 - y1 + 1;
    if (bw < 3 || bh < 3) {
      setStatusMsg('Building too small (min 3×3)');
      setBuildStart(null);
      return;
    }

    setTiles(prev => {
      pushUndo(prev, buildingsRef.current);
      const next = prev.map(row => row.map(t => {
        const edgeWalls: any = {};
        (['n', 'e', 's', 'w'] as Edge[]).forEach(e => edgeWalls[e] = { ...t.edgeWalls[e] });
        return { ...t, edgeWalls, entities: [...t.entities], items: [...t.items] };
      }));

      for (let ty = y1; ty <= y2; ty++) {
        for (let tx = x1; tx <= x2; tx++) {
          next[ty][tx].terrain = 'floor';
          if (ty === y1) next[ty][tx].edgeWalls.n = { wall: true, door: false, window: false };
          if (ty === y2) next[ty][tx].edgeWalls.s = { wall: true, door: false, window: false };
          if (tx === x1) next[ty][tx].edgeWalls.w = { wall: true, door: false, window: false };
          if (tx === x2) next[ty][tx].edgeWalls.e = { wall: true, door: false, window: false };
        }
      }
      return next;
    });

    setBuildings(prev => [...prev, { type: selectedBuildingType, x: x1, y: y1, width: bw, height: bh }]);
    setBuildStart(null);
    setStatusMsg(`Placed ${selectedBuildingType} (${bw}×${bh})`);
  }, [buildStart, selectedBuildingType]);

  // ─── Canvas rendering ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * CELL;
    canvas.height = height * CELL;

    // Pass 1: terrain + grid
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = tiles[y][x];
        const sx = x * CELL;
        const sy = y * CELL;
        const tc = TERRAIN_TYPES.find(tt => tt.id === t.terrain);
        ctx.fillStyle = tc?.color || '#222';
        ctx.fillRect(sx, sy, CELL, CELL);

        if (showGrid) {
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.strokeRect(sx, sy, CELL, CELL);
        }
      }
    }

    // Building outlines
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    buildings.forEach(b => {
      ctx.strokeRect(b.x * CELL + 1, b.y * CELL + 1, b.width * CELL - 2, b.height * CELL - 2);
      ctx.fillStyle = 'rgba(255,255,0,0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(b.type, b.x * CELL + 4, b.y * CELL + 4);
    });
    ctx.lineWidth = 1;

    // Pass 2: edges, entities, items, events (drawn on top of building outlines)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = tiles[y][x];
        const sx = x * CELL;
        const sy = y * CELL;

        // Edge walls / doors / windows
        const drawEdge = (edge: Edge, ex: number, ey: number, ew: number, eh: number) => {
          const es = t.edgeWalls[edge];
          if (es.door)        { ctx.fillStyle = EDGE_COLORS.door;   ctx.fillRect(ex, ey, ew, eh); }
          else if (es.window) { ctx.fillStyle = EDGE_COLORS.window; ctx.fillRect(ex, ey, ew, eh); }
          else if (es.wall)   { ctx.fillStyle = EDGE_COLORS.wall;   ctx.fillRect(ex, ey, ew, eh); }
        };
        drawEdge('n', sx, sy, CELL, 3);
        drawEdge('s', sx, sy + CELL - 3, CELL, 3);
        drawEdge('w', sx, sy, 3, CELL);
        drawEdge('e', sx + CELL - 3, sy, 3, CELL);

        // Entities
        if (t.entities.length > 0) {
          const ent = t.entities[t.entities.length - 1];
          const def = ENTITY_TYPES.find(e => e.id === ent.type);
          if (def) {
            ctx.fillStyle = def.color;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(def.symbol, sx + CELL / 2, sy + CELL / 2);
          }
        }

        // Items indicator
        if (t.items.length > 0) {
          ctx.fillStyle = '#fc0';
          ctx.fillRect(sx + CELL - 10, sy + CELL - 10, 8, 8);
          ctx.fillStyle = '#000';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(t.items.length), sx + CELL - 6, sy + CELL - 6);
        }

        // Event trigger indicator
        if (t.eventTrigger) {
          ctx.fillStyle = '#f0f';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('E', sx + 2, sy + 2);
        }
      }
    }

    // Building-rect drag preview
    if (tool === 'building_rect' && buildStart && hoverCell) {
      const rx1 = Math.min(buildStart.x, hoverCell.x);
      const ry1 = Math.min(buildStart.y, hoverCell.y);
      const rx2 = Math.max(buildStart.x, hoverCell.x);
      const ry2 = Math.max(buildStart.y, hoverCell.y);
      ctx.strokeStyle = 'rgba(0,255,255,0.8)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(rx1 * CELL, ry1 * CELL, (rx2 - rx1 + 1) * CELL, (ry2 - ry1 + 1) * CELL);
      ctx.setLineDash([]);
    }

    // Hover highlight
    if (hoverCell && tool !== 'building_rect') {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      const useBrush = tool === 'terrain' || tool === 'eraser';
      if (useBrush && brushSize > 1) {
        const half = Math.floor(brushSize / 2);
        const bx = hoverCell.x - half;
        const by = hoverCell.y - half;
        ctx.strokeRect(bx * CELL, by * CELL, brushSize * CELL, brushSize * CELL);
      } else {
        ctx.strokeRect(hoverCell.x * CELL, hoverCell.y * CELL, CELL, CELL);
      }
    }
  }, [tiles, buildings, width, height, showGrid, hoverCell, buildStart, tool, brushSize]);

  // ─── Mouse handlers ──────────────────────────────────────────────────
  const cellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX / CELL),
      y: Math.floor((e.clientY - rect.top) * scaleY / CELL),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return; // right-click handled by onContextMenu
    setInspectTile(null);
    const { x, y } = cellFromEvent(e);
    if (tool === 'building_rect') {
      setBuildStart({ x, y });
    } else {
      strokeUndoPushed.current = false;
      setIsPainting(true);
      applyTool(x, y);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = cellFromEvent(e);
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const tile = tiles[y][x];
    const hasContent = tile.entities.length > 0 || tile.items.length > 0 || !!tile.eventTrigger;
    if (hasContent) {
      setInspectTile({ x, y, screenX: e.clientX, screenY: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = cellFromEvent(e);
    setHoverCell({ x, y });
    if (isPainting && tool === 'terrain') {
      applyTool(x, y);
    }
    if (isPainting && tool === 'eraser') {
      applyTool(x, y);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'building_rect' && buildStart) {
      const { x, y } = cellFromEvent(e);
      finishBuildingRect(x, y);
    }
    setIsPainting(false);
  };

  // ─── Save / Load ─────────────────────────────────────────────────────
  const getPlayerSpawn = (): { x: number; y: number } | null => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x].entities.some(e => e.type === 'player')) return { x, y };
      }
    }
    return null;
  };

  const handleExport = async () => {
    const scenario: ScenarioData = {
      name: scenarioName,
      width, height, tiles, buildings,
      playerSpawn: getPlayerSpawn(),
    };
    const exported = exportScenario(scenario);

    try {
      await ScenarioStorage.save(exported);
      setStatusMsg(`Published "${scenarioName}" to game library`);
    } catch (e: any) {
      console.warn('Scenario save failed:', e);
      setStatusMsg(`Save failed: ${e.message}`);
    }
  };

  const handleSaveEditor = async () => {
    const editorState = { name: scenarioName, width, height, tiles, buildings };
    try {
      await ScenarioStorage.saveEditorState(scenarioName, editorState);
      setStatusMsg(`Editor state saved for "${scenarioName}"`);
    } catch (e: any) {
      console.warn('Editor state save failed:', e);
      setStatusMsg(`Save failed: ${e.message}`);
    }
  };

  const handleOpenLoadPicker = async () => {
    try {
      const list = await ScenarioStorage.list();
      setSavedScenarios(list as any[]);
      setShowLoadPicker(true);
    } catch (e: any) {
      setStatusMsg(`Failed to list scenarios: ${e.message}`);
    }
  };

  const applyLoadedData = (data: any, label: string) => {
    // Detect format: editor state has tiles with .entities arrays,
    // scenario format has a top-level entities array and tiles with .inventoryItems
    const isScenarioFormat = data.metadata || data.entities || data.tiles?.[0]?.[0]?.contents !== undefined;
    const editor = isScenarioFormat ? scenarioToEditorState(data) : data;
    setScenarioName(editor.name || 'untitled');
    setWidth(editor.width);
    setHeight(editor.height);
    setTiles(sanitizeTiles(editor.tiles));
    setBuildings(editor.buildings || []);
    setStatusMsg(`Loaded "${label}"`);
  };

  const handlePickScenario = async (name: string) => {
    setShowLoadPicker(false);
    try {
      // Try editor state first, fall back to scenario file
      let data = await ScenarioStorage.loadEditorState(name);
      if (!data) data = await ScenarioStorage.load(name);
      if (!data) { setStatusMsg(`No data found for "${name}"`); return; }
      applyLoadedData(data, name);
    } catch (e: any) {
      setStatusMsg(`Load failed: ${e.message}`);
    }
  };

  const handleLoadEditor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        applyLoadedData(data, file.name);
      } catch (err) {
        setStatusMsg(`Failed to load: ${err}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    if (!confirm('Clear entire map?')) return;
    setTiles(prev => { pushUndo(prev, buildingsRef.current); return createEmptyGrid(width, height); });
    setBuildings([]);
    setStatusMsg('Map cleared');
  };

  // ─── UI ───────────────────────────────────────────────────────────────
  const toolButton = (mode: ToolMode, label: string) => (
    <button
      key={mode}
      onClick={() => setTool(mode)}
      style={{
        padding: '6px 12px',
        background: tool === mode ? '#4a90d9' : '#333',
        color: '#eee',
        border: tool === mode ? '2px solid #7bb8ff' : '1px solid #555',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1a1a1a', color: '#ddd', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* ─── Left panel: tools ─── */}
      <div style={{ width: 280, padding: 12, overflowY: 'auto', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#7bb8ff' }}>Map Editor</h2>

        {/* File ops */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888' }}>Scenario Name</label>
          <input
            value={scenarioName}
            onChange={e => setScenarioName(e.target.value)}
            style={{ background: '#222', border: '1px solid #444', color: '#ddd', padding: '4px 8px', borderRadius: 3, fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={handleExport} style={btnStyle('#2a7a2a')}>Publish</button>
            <button onClick={handleSaveEditor} style={btnStyle('#555')}>Save</button>
            <button onClick={handleOpenLoadPicker} style={btnStyle('#555')}>Load</button>
            <button onClick={() => fileInputRef.current?.click()} style={btnStyle('#444')}>Import</button>
            <button onClick={handleUndo} style={btnStyle('#555')}>Undo</button>
            <button onClick={handleClear} style={btnStyle('#7a2a2a')}>Clear</button>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoadEditor} style={{ display: 'none' }} />
        </div>

        {/* Map size */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 11, color: '#888' }}>Size</label>
          <input type="number" value={width} min={5} max={40} onChange={e => resizeMap(+e.target.value, height)}
            style={{ width: 50, ...inputStyle }} />
          <span>×</span>
          <input type="number" value={height} min={5} max={40} onChange={e => resizeMap(width, +e.target.value)}
            style={{ width: 50, ...inputStyle }} />
          <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
            Grid
          </label>
        </div>

        {/* Tools */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {toolButton('terrain', 'Terrain')}
          {toolButton('edge_wall', 'Wall')}
          {toolButton('edge_door', 'Door')}
          {toolButton('edge_window', 'Window')}
          {toolButton('building_rect', 'Building')}
          {toolButton('entity', 'Entity')}
          {toolButton('item', 'Item')}
          {toolButton('event_trigger', 'Event')}
          {toolButton('eraser', 'Eraser')}
        </div>

        {/* Tool-specific options */}
        {tool === 'terrain' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {TERRAIN_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTerrain(t.id)}
                  style={{
                    padding: '4px 8px',
                    background: t.color,
                    color: '#eee',
                    border: selectedTerrain === t.id ? '2px solid #fff' : '1px solid #555',
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#888' }}>Brush</label>
              {[1, 2, 3, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setBrushSize(s)}
                  style={{
                    padding: '2px 8px',
                    background: brushSize === s ? '#555' : '#222',
                    color: '#eee',
                    border: brushSize === s ? '1px solid #aaa' : '1px solid #444',
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >{s}x{s}</button>
              ))}
            </div>
          </div>
        )}

        {(tool === 'edge_wall' || tool === 'edge_door' || tool === 'edge_window') && (
          <div>
            <label style={{ fontSize: 11, color: '#888' }}>Edge side</label>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {(['n', 's', 'w', 'e'] as Edge[]).map(e => (
                <button
                  key={e}
                  onClick={() => setSelectedEdge(e)}
                  style={{
                    padding: '4px 10px',
                    background: selectedEdge === e ? '#4a90d9' : '#333',
                    color: '#eee',
                    border: selectedEdge === e ? '2px solid #7bb8ff' : '1px solid #555',
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  {{ n: 'North', s: 'South', w: 'West', e: 'East' }[e]}
                </button>
              ))}
            </div>
          </div>
        )}

        {tool === 'entity' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {ENTITY_TYPES.map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEntity(e.id)}
                style={{
                  padding: '4px 8px',
                  background: selectedEntity === e.id ? e.color : '#333',
                  color: '#eee',
                  border: selectedEntity === e.id ? '2px solid #fff' : '1px solid #555',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {e.label}
              </button>
            ))}
          </div>
        )}

        {tool === 'building_rect' && (
          <div>
            <label style={{ fontSize: 11, color: '#888' }}>Building Type</label>
            <select
              value={selectedBuildingType}
              onChange={e => setSelectedBuildingType(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginTop: 4 }}
            >
              {BUILDING_TYPES.map(bt => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>Click and drag on the grid to draw a building rectangle (min 3×3). Walls + floor auto-placed.</p>
          </div>
        )}

        {tool === 'item' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Category</label>
            <select
              value={itemCategory}
              onChange={e => { setItemCategory(e.target.value); setSelectedItem(''); }}
              style={{ ...inputStyle, width: '100%' }}
            >
              <option value="">All Categories</option>
              {itemCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label style={{ fontSize: 11, color: '#888' }}>Item</label>
            <select
              value={selectedItem}
              onChange={e => setSelectedItem(e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            >
              <option value="">— Select item —</option>
              {filteredItems.map(it => (
                <option key={it.id} value={it.id}>{it.name} ({it.w}x{it.h})</option>
              ))}
            </select>
            {selectedItem && (
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                {(() => { const def = (ItemDefs as any)[selectedItem]; return def ? `${def.name} — ${def.width}x${def.height}` : ''; })()}
              </div>
            )}
          </div>
        )}

        {tool === 'event_trigger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Trigger ID</label>
            <input value={triggerId} onChange={e => setTriggerId(e.target.value)} placeholder="e.g. tutorial_intro" style={{ ...inputStyle }} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888', cursor: 'pointer' }}>
              <input type="checkbox" checked={dialogOneShot} onChange={e => setDialogOneShot(e.target.checked)} />
              One-shot (only triggers once)
            </label>

            <div style={{ borderTop: '1px solid #444', paddingTop: 6 }}>
              <label style={{ fontSize: 11, color: '#888' }}>Dialog Steps</label>
              {dialogSteps.map((step, i) => (
                <div key={i} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 3, padding: 6, marginTop: 4, fontSize: 12 }}>
                  <div style={{ color: '#7bb8ff', fontWeight: 'bold', fontSize: 11 }}>{step.speaker || '(narrator)'}</div>
                  <div style={{ color: '#ccc', marginTop: 2 }}>{step.text}</div>
                  <button
                    onClick={() => setDialogSteps(prev => prev.filter((_, j) => j !== i))}
                    style={{ fontSize: 10, color: '#c44', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}
                  >Remove</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderTop: '1px solid #444', paddingTop: 6 }}>
              <label style={{ fontSize: 11, color: '#888' }}>Add Step</label>
              <input value={editSpeaker} onChange={e => setEditSpeaker(e.target.value)} placeholder="Speaker (optional)" style={{ ...inputStyle }} />
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                placeholder="Dialog text..."
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <button
                onClick={() => {
                  if (!editText.trim()) return;
                  setDialogSteps(prev => [...prev, { speaker: editSpeaker.trim(), text: editText.trim() }]);
                  setEditText('');
                }}
                disabled={!editText.trim()}
                style={btnStyle(editText.trim() ? '#2a7a2a' : '#333')}
              >+ Add Step</button>
            </div>

            <p style={{ fontSize: 10, color: '#666', margin: 0 }}>
              Click a tile to place this dialog trigger. Steps play in order when the player walks on the tile.
            </p>
          </div>
        )}

        {/* Legend */}
        <div style={{ borderTop: '1px solid #333', paddingTop: 8, fontSize: 11, color: '#888' }}>
          <div style={{ marginBottom: 4, fontWeight: 'bold' }}>Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: EDGE_COLORS.wall, borderRadius: 2 }} />Wall
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: EDGE_COLORS.door, borderRadius: 2 }} />Door
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: EDGE_COLORS.window, borderRadius: 2 }} />Window
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: '#fc0', borderRadius: 2 }} />Items
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{ color: '#f0f', fontWeight: 'bold' }}>E</span> Event Trigger
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ border: '1px solid #ff0', display: 'inline-block', width: 12, height: 12, borderRadius: 2 }} />Building outline
          </div>
        </div>

        {/* Hover info */}
        {hoverCell && hoverCell.x >= 0 && hoverCell.x < width && hoverCell.y >= 0 && hoverCell.y < height && (
          <div style={{ borderTop: '1px solid #333', paddingTop: 8, fontSize: 11, color: '#aaa' }}>
            <div><strong>({hoverCell.x}, {hoverCell.y})</strong> — {tiles[hoverCell.y][hoverCell.x].terrain}</div>
            {tiles[hoverCell.y][hoverCell.x].entities.length > 0 && (
              <div>Entities: {tiles[hoverCell.y][hoverCell.x].entities.map(e => e.type).join(', ')}</div>
            )}
            {tiles[hoverCell.y][hoverCell.x].items.length > 0 && (
              <div>Items: {tiles[hoverCell.y][hoverCell.x].items.join(', ')}</div>
            )}
            {tiles[hoverCell.y][hoverCell.x].eventTrigger && (
              <div>Event: {tiles[hoverCell.y][hoverCell.x].eventTrigger!.id} ({tiles[hoverCell.y][hoverCell.x].eventTrigger!.steps?.length || 0} steps{tiles[hoverCell.y][hoverCell.x].eventTrigger!.oneShot ? ', one-shot' : ''})</div>
            )}
          </div>
        )}

        {/* Status */}
        {statusMsg && (
          <div style={{ fontSize: 11, color: '#7bb8ff', padding: '4px 0' }}>{statusMsg}</div>
        )}
      </div>

      {/* ─── Load picker modal ─── */}
      {showLoadPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowLoadPicker(false)}>
          <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, minWidth: 300, maxHeight: '60vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#7bb8ff' }}>Load Scenario</h3>
            {savedScenarios.length === 0 ? (
              <p style={{ color: '#888', fontSize: 13 }}>No saved scenarios found.</p>
            ) : (
              savedScenarios.map(s => (
                <div key={s.name}
                  onClick={() => handlePickScenario(s.name)}
                  style={{ padding: '8px 12px', marginBottom: 4, background: '#333', borderRadius: 4, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#444')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#333')}>
                  <span style={{ color: '#ddd', fontSize: 13 }}>{s.name}</span>
                  <span style={{ color: '#888', fontSize: 11 }}>{s.width}x{s.height}</span>
                </div>
              ))
            )}
            <button onClick={() => setShowLoadPicker(false)}
              style={{ ...btnStyle('#555'), marginTop: 8, width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ─── Canvas area ─── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 16 }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          onMouseLeave={() => { setIsPainting(false); setHoverCell(null); }}
          style={{ cursor: 'crosshair', imageRendering: 'pixelated' }}
        />
      </div>

      {/* ─── Tile Inspector Popup ─── */}
      {inspectTile && tiles[inspectTile.y]?.[inspectTile.x] && (() => {
        const t = tiles[inspectTile.y][inspectTile.x];
        const tx = inspectTile.x;
        const ty = inspectTile.y;

        const removeEntity = (idx: number) => {
          setTiles(prev => {
            pushUndo(prev, buildingsRef.current);
            const next = prev.map(r => r.map(c => ({ ...c, entities: [...c.entities], items: [...c.items] })));
            next[ty][tx].entities.splice(idx, 1);
            return next;
          });
        };

        const removeItem = (idx: number) => {
          setTiles(prev => {
            pushUndo(prev, buildingsRef.current);
            const next = prev.map(r => r.map(c => ({ ...c, entities: [...c.entities], items: [...c.items] })));
            next[ty][tx].items.splice(idx, 1);
            return next;
          });
        };

        const removeEvent = () => {
          setTiles(prev => {
            pushUndo(prev, buildingsRef.current);
            const next = prev.map(r => r.map(c => ({ ...c, entities: [...c.entities], items: [...c.items] })));
            delete next[ty][tx].eventTrigger;
            return next;
          });
        };

        const editEvent = () => {
          if (t.eventTrigger) {
            setTriggerId(t.eventTrigger.id);
            setDialogSteps([...t.eventTrigger.steps]);
            setDialogOneShot(t.eventTrigger.oneShot);
            setTool('event_trigger');
            setStatusMsg(`Editing event "${t.eventTrigger.id}" — modify steps then click a tile to place`);
          }
          setInspectTile(null);
        };

        const popStyle: React.CSSProperties = {
          position: 'fixed',
          left: Math.min(inspectTile.screenX, window.innerWidth - 320),
          top: Math.min(inspectTile.screenY, window.innerHeight - 300),
          zIndex: 200,
          background: '#1a1a1a',
          border: '1px solid #555',
          borderRadius: 6,
          padding: 12,
          minWidth: 240,
          maxWidth: 300,
          maxHeight: '50vh',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        };

        const sectionStyle: React.CSSProperties = {
          borderTop: '1px solid #333',
          paddingTop: 6,
          marginTop: 6,
        };

        const rowStyle: React.CSSProperties = {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '3px 0',
          fontSize: 12,
        };

        const removeBtnStyle: React.CSSProperties = {
          background: 'none',
          border: 'none',
          color: '#c44',
          cursor: 'pointer',
          fontSize: 11,
          padding: '2px 6px',
        };

        const editBtnStyle: React.CSSProperties = {
          background: 'none',
          border: 'none',
          color: '#7bb8ff',
          cursor: 'pointer',
          fontSize: 11,
          padding: '2px 6px',
        };

        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setInspectTile(null)} />
            <div style={popStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 'bold', fontSize: 13, color: '#7bb8ff' }}>
                  Tile ({tx}, {ty}) — {t.terrain}
                </span>
                <button onClick={() => setInspectTile(null)} style={{ ...removeBtnStyle, color: '#888' }}>✕</button>
              </div>

              {/* Entities */}
              {t.entities.length > 0 && (
                <div style={sectionStyle}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Entities</div>
                  {t.entities.map((ent, i) => {
                    const def = ENTITY_TYPES.find(e => e.id === ent.type);
                    return (
                      <div key={i} style={rowStyle}>
                        <span style={{ color: def?.color || '#aaa' }}>
                          {def?.label || ent.type}{ent.subtype ? ` (${ent.subtype})` : ''}
                        </span>
                        <button onClick={() => removeEntity(i)} style={removeBtnStyle}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Items */}
              {t.items.length > 0 && (
                <div style={sectionStyle}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Items</div>
                  {t.items.map((defId, i) => {
                    const def = (ItemDefs as any)[defId];
                    return (
                      <div key={i} style={rowStyle}>
                        <span style={{ color: '#fc0' }}>
                          {def?.name || defId}
                          {def ? ` (${def.width}×${def.height})` : ''}
                        </span>
                        <button onClick={() => removeItem(i)} style={removeBtnStyle}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Event Trigger */}
              {t.eventTrigger && (
                <div style={sectionStyle}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Event Trigger</div>
                  <div style={{ fontSize: 12, color: '#f0f', marginBottom: 2 }}>
                    {t.eventTrigger.id}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
                    {t.eventTrigger.steps?.length || 0} step{(t.eventTrigger.steps?.length || 0) !== 1 ? 's' : ''}
                    {t.eventTrigger.oneShot ? ' · one-shot' : ' · repeatable'}
                  </div>
                  {t.eventTrigger.steps?.map((step, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#888', padding: '2px 0', borderTop: '1px solid #222' }}>
                      {step.speaker && <span style={{ color: '#7bb8ff' }}>{step.speaker}: </span>}
                      {step.text}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button onClick={editEvent} style={editBtnStyle}>Edit</button>
                    <button onClick={removeEvent} style={removeBtnStyle}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

// ─── Shared inline styles ────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: '#222',
  border: '1px solid #444',
  color: '#ddd',
  padding: '4px 8px',
  borderRadius: 3,
  fontSize: 13,
};

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '5px 10px',
    background: bg,
    color: '#eee',
    border: '1px solid #555',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 12,
  };
}
