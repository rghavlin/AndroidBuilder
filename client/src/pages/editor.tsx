import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ScenarioStorage } from '@/game/ScenarioStorage';
import { ItemDefs, createItemFromDef } from '@/game/inventory/ItemDefs';
import { ItemCategory, ItemTrait } from '@/game/inventory/traits';
import { GameSaveSystem } from '@/game/GameSaveSystem';

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

const ZOMBIE_SUBTYPES = [
  { id: 'basic',        label: 'Zombie',          defaultHp: 10 },
  { id: 'runner',       label: 'Runner',          defaultHp: 10 },
  { id: 'crawler',      label: 'Crawler',         defaultHp: 7  },
  { id: 'fat',          label: 'Fat Zombie',      defaultHp: 20 },
  { id: 'soldier',      label: 'Soldier',         defaultHp: 25 },
  { id: 'firefighter',  label: 'Firefighter',     defaultHp: 15 },
  { id: 'swat',         label: 'SWAT',            defaultHp: 15 },
  { id: 'acid',         label: 'Acid',            defaultHp: 10 },
  { id: 'spitter',      label: 'Spitter',         defaultHp: 10 },
  { id: 'bomb_disposal',label: 'Bomb Disposal',   defaultHp: 200 },
  { id: 'mutant',       label: 'Mutant',          defaultHp: 75 },
];

const BUILDING_TYPES = [
  'residential', 'police', 'firestation', 'grocer', 'gas_station',
  'army_tent', 'hardware_store', 'lab'
];

const PLACE_ICON_TYPES = [
  { id: 'grocer',         label: 'Grocer Sign',        symbol: 'G', color: '#4c4' },
  { id: 'police',         label: 'Police Sign',         symbol: 'P', color: '#44f' },
  { id: 'firestation',    label: 'Fire Station Sign',   symbol: 'F', color: '#f44' },
  { id: 'gas_station',    label: 'Gas Station Sign',    symbol: '$', color: '#fa0' },
  { id: 'fuelpump',       label: 'Fuel Pump',           symbol: 'U', color: '#fa0' },
  { id: 'hardware_store', label: 'Hardware Store Sign', symbol: 'H', color: '#a64' },
  { id: 'army_tent',      label: 'Army Tent Sign',      symbol: 'A', color: '#6a6' },
  { id: 'lab',            label: 'Lab Sign',            symbol: 'L', color: '#0ff' },
  { id: 'barrier',        label: 'Barrier',             symbol: 'B', color: '#888' },
];

type Edge = 'n' | 'e' | 's' | 'w';
type ToolMode = 'terrain' | 'edge_wall' | 'edge_door' | 'edge_window' | 'entity' | 'item' | 'building_rect' | 'eraser' | 'event_trigger' | 'map_transition' | 'place_icon';

interface EdgeState { wall: boolean; door: boolean; window: boolean; locked?: boolean; }
interface TileData {
  terrain: string;
  edgeWalls: Record<Edge, EdgeState>;
  entities: { type: string; subtype?: string; hp?: number; noLoot?: boolean; deaf?: boolean }[];
  items: { defId: string; ammoCount?: number; condition?: number; batteryCharges?: number; gunAmmoCount?: number; gunMagDefId?: string; gunAttachments?: Record<string, string> }[];
  eventTrigger?: { id: string; steps: { speaker: string; text: string; video?: string }[]; oneShot: boolean };
  mapTransition?: { targetType: 'scenario' | 'generator' | 'tutorial_end'; targetId: string; level?: number };
  placeIcon?: string;
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
  noAutosave?: boolean;
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
        mapTransition: t.mapTransition,
      };
    })
  );
}

function scenarioToEditorState(scenario: any): { name: string; width: number; height: number; tiles: TileData[][]; buildings: any[]; noAutosave: boolean } {
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
          tiles[y][x].items = st.inventoryItems
            .map((it: any) => {
              const entry: any = { defId: it.defId || it.id };
              if (it.ammoCount !== undefined) entry.ammoCount = it.ammoCount;
              if (it.condition !== undefined) entry.condition = it.condition;
              if (it.attachments) {
                const itItemDef = (ItemDefs as any)[entry.defId];
                const slotInfo = getBatterySlotInfo(itItemDef);
                if (slotInfo && it.attachments[slotInfo.slotId]?.ammoCount !== undefined) {
                  entry.batteryCharges = it.attachments[slotInfo.slotId].ammoCount;
                }
                if (itItemDef?.categories?.includes(ItemCategory.GUN)) {
                  const ammoAtt = it.attachments['ammo'];
                  if (ammoAtt) {
                    if (itItemDef.directLoad) {
                      entry.gunAmmoCount = ammoAtt.stackCount ?? 0;
                    } else {
                      entry.gunMagDefId = ammoAtt.defId;
                      entry.gunAmmoCount = ammoAtt.ammoCount ?? 0;
                    }
                  }
                  const nonAmmo: Record<string, string> = {};
                  for (const [slotId, att] of Object.entries(it.attachments as Record<string, any>)) {
                    if (slotId !== 'ammo' && att?.defId) nonAmmo[slotId] = att.defId;
                  }
                  if (Object.keys(nonAmmo).length > 0) entry.gunAttachments = nonAmmo;
                }
              }
              return entry;
            })
            .filter((it: any) => it.defId);
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
      t.edgeWalls[d.edge as Edge].locked = d.isLocked ?? false;
    }
  }

  // Windows: clear wall flag, set window flag
  if (scenario.metadata?.windows) {
    for (const win of scenario.metadata.windows) {
      const t = tiles[win.y]?.[win.x];
      if (!t || !win.edge) continue;
      t.edgeWalls[win.edge as Edge].wall = false;
      t.edgeWalls[win.edge as Edge].window = true;
      t.edgeWalls[win.edge as Edge].locked = win.isLocked ?? false;
    }
  }

  // Entities: top-level array → per-tile
  if (scenario.entities) {
    for (const e of scenario.entities) {
      const t = tiles[e.y]?.[e.x];
      if (t) t.entities.push({ type: e.type, subtype: e.subtype, hp: e.hp || undefined, noLoot: e.noLoot || undefined, deaf: e.deaf || undefined });
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

  // Map transitions
  const transitions = scenario.mapTransitions || scenario.metadata?.mapTransitions;
  if (transitions) {
    for (const tr of transitions) {
      const t = tiles[tr.y]?.[tr.x];
      if (t) {
        t.mapTransition = { targetType: tr.targetType, targetId: tr.targetId, level: tr.level };
      }
    }
  }

  // Place icons
  const placeIcons = scenario.metadata?.placeIcons;
  if (placeIcons) {
    for (const icon of placeIcons) {
      const t = tiles[icon.y]?.[icon.x];
      if (t) t.placeIcon = icon.subtype;
    }
  }

  return {
    name: scenario.name || 'untitled',
    width: w,
    height: h,
    tiles,
    buildings: scenario.metadata?.buildings || [],
    noAutosave: scenario.noAutosave ?? false,
  };
}

function saveGameMapToEditorState(mapData: any): { name: string; width: number; height: number; tiles: TileData[][]; buildings: any[]; noAutosave: boolean } {
  const w = mapData.width;
  const h = mapData.height;
  const tiles = createEmptyGrid(w, h);

  // Rebuild terrain and edge walls from save game tiles
  if (mapData.tiles) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const st = mapData.tiles[y]?.[x];
        if (!st) continue;
        tiles[y][x].terrain = st.terrain || 'grass';

        // Reconstruct edge booleans as walls initially
        if (st.edgeWalls) {
          (['n', 'e', 's', 'w'] as Edge[]).forEach(edge => {
            if (st.edgeWalls[edge]) {
              tiles[y][x].edgeWalls[edge].wall = true;
            }
          });
        }

        // Reconstruct item list on the tile from contents and inventoryItems
        const itemEntities = (st.contents || []).filter((e: any) => e.type === 'item');
        const rawItems = (st.inventoryItems || []).map((it: any) => {
          if (it._ref) {
            // Find full entity in contents
            return itemEntities.find((e: any) => e.id === it._ref);
          }
          return it;
        }).filter(Boolean);

        const uniqueItems = new Map<string, any>();
        itemEntities.forEach((it: any) => {
          if (it.id) uniqueItems.set(it.id, it);
        });
        rawItems.forEach((it: any) => {
          if (it.id) uniqueItems.set(it.id, it);
        });

        tiles[y][x].items = Array.from(uniqueItems.values())
          .map((it: any) => {
            const entry: any = { defId: it.defId || it.id };
            if (it.ammoCount !== undefined) entry.ammoCount = it.ammoCount;
            if (it.condition !== undefined) entry.condition = it.condition;
            if (it.attachments) {
              const itItemDef = (ItemDefs as any)[entry.defId];
              const slotInfo = getBatterySlotInfo(itItemDef);
              if (slotInfo && it.attachments[slotInfo.slotId]?.ammoCount !== undefined) {
                entry.batteryCharges = it.attachments[slotInfo.slotId].ammoCount;
              }
              if (itItemDef?.categories?.includes(ItemCategory.GUN)) {
                const ammoAtt = it.attachments['ammo'];
                if (ammoAtt) {
                  if (itItemDef.directLoad) {
                    entry.gunAmmoCount = ammoAtt.stackCount ?? 0;
                  } else {
                    entry.gunMagDefId = ammoAtt.defId;
                    entry.gunAmmoCount = ammoAtt.ammoCount ?? 0;
                  }
                }
                const nonAmmo: Record<string, string> = {};
                for (const [slotId, att] of Object.entries(it.attachments as Record<string, any>)) {
                  if (slotId !== 'ammo' && att?.defId) nonAmmo[slotId] = att.defId;
                }
                if (Object.keys(nonAmmo).length > 0) entry.gunAttachments = nonAmmo;
              }
            }
            return entry;
          })
          .filter((it: any) => it.defId);

        // Reconstruct entities from contents
        if (st.contents) {
          for (const e of st.contents) {
            if (e.type === 'player') {
              tiles[y][x].entities.push({ type: 'player' });
            } else if (e.type === 'zombie') {
              tiles[y][x].entities.push({
                type: 'zombie',
                subtype: e.subtype || 'basic',
                hp: e.hp,
                noLoot: e.noLoot,
                deaf: e.deaf,
              });
            } else if (e.type === 'npc') {
              tiles[y][x].entities.push({ type: 'npc' });
            } else if (e.type === 'rabbit') {
              tiles[y][x].entities.push({ type: 'rabbit' });
            } else if (e.type === 'place_icon') {
              tiles[y][x].placeIcon = e.subtype;
            } else if (e.type === 'door') {
              tiles[y][x].edgeWalls[e.edge as Edge].wall = false;
              tiles[y][x].edgeWalls[e.edge as Edge].door = true;
              tiles[y][x].edgeWalls[e.edge as Edge].locked = e.isLocked ?? false;
            } else if (e.type === 'window') {
              tiles[y][x].edgeWalls[e.edge as Edge].wall = false;
              tiles[y][x].edgeWalls[e.edge as Edge].window = true;
              tiles[y][x].edgeWalls[e.edge as Edge].locked = e.isLocked ?? false;
            }
          }
        }
      }
    }
  }

  // Event Triggers and Map Transitions from map metadata
  const metadata = mapData.metadata;
  if (metadata?.eventTriggers) {
    for (const evt of metadata.eventTriggers) {
      const t = tiles[evt.y]?.[evt.x];
      if (t) {
        t.eventTrigger = { id: evt.id, steps: evt.steps, oneShot: evt.oneShot ?? true };
      }
    }
  }
  if (metadata?.mapTransitions) {
    for (const tr of metadata.mapTransitions) {
      const t = tiles[tr.y]?.[tr.x];
      if (t) {
        t.mapTransition = { targetType: tr.targetType, targetId: tr.targetId, level: tr.level };
      }
    }
  }

  return {
    name: mapData.name || 'imported_save',
    width: w,
    height: h,
    tiles,
    buildings: mapData.buildings || [],
    noAutosave: mapData.noAutosave ?? false,
  };
}

// ─── Battery slot helper ─────────────────────────────────────────────────

function getBatterySlotInfo(def: any): { slotId: string; batteryDefId: string; capacity: number } | null {
  if (!def?.attachmentSlots) return null;
  const slot = def.attachmentSlots.find((s: any) =>
    s.allowedCategories?.includes(ItemCategory.BATTERY) ||
    s.allowedCategories?.includes(ItemCategory.LARGE_BATTERY)
  );
  if (!slot) return null;
  const isLarge = slot.allowedCategories?.includes(ItemCategory.LARGE_BATTERY);
  const batteryDefId = isLarge ? 'tool.large_battery' : 'tool.battery';
  const batteryDef = (ItemDefs as any)[batteryDefId];
  return { slotId: slot.id, batteryDefId, capacity: batteryDef?.capacity ?? (isLarge ? 100 : 10) };
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
        tile.inventoryItems = t.items.map(item => {
          const full = createItemFromDef(item.defId);
          if (full && item.ammoCount !== undefined) full.ammoCount = item.ammoCount;
          if (full && item.condition !== undefined) full.condition = item.condition;
          if (full && item.batteryCharges !== undefined) {
            const slotInfo = getBatterySlotInfo((ItemDefs as any)[item.defId]);
            if (slotInfo) {
              const batteryItem = createItemFromDef(slotInfo.batteryDefId);
              if (batteryItem) {
                batteryItem.ammoCount = item.batteryCharges;
                if (!full.attachments) full.attachments = {};
                full.attachments[slotInfo.slotId] = batteryItem;
              }
            }
          }
          if (full && item.gunAmmoCount !== undefined) {
            const gunDef = (ItemDefs as any)[item.defId];
            if (gunDef?.directLoad) {
              const ammoItem = createItemFromDef(gunDef.directLoad.ammoId);
              if (ammoItem) {
                ammoItem.stackCount = item.gunAmmoCount;
                if (!full.attachments) full.attachments = {};
                full.attachments[gunDef.directLoad.slotId] = ammoItem;
              }
            } else if (item.gunMagDefId) {
              const mag = createItemFromDef(item.gunMagDefId);
              if (mag) {
                mag.ammoCount = item.gunAmmoCount;
                if (!full.attachments) full.attachments = {};
                full.attachments['ammo'] = mag;
              }
            }
          }
          if (full && item.gunAttachments) {
            for (const [slotId, attDefId] of Object.entries(item.gunAttachments)) {
              if (attDefId) {
                const att = createItemFromDef(attDefId);
                if (att) {
                  if (!full.attachments) full.attachments = {};
                  full.attachments[slotId] = att;
                }
              }
            }
          }
          return full || { defId: item.defId, quantity: 1 };
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
          doors.push({ x, y, isLocked: t.edgeWalls[edge].locked ?? false, isOpen: false, edge });
        }
        if (t.edgeWalls[edge].window) {
          windows.push({ x, y, isLocked: t.edgeWalls[edge].locked ?? false, isOpen: false, edge });
        }
      });
    })
  );

  const entities: any[] = [];
  scenario.tiles.forEach((row, y) =>
    row.forEach((t, x) => {
      t.entities.forEach(e => {
        entities.push({ type: e.type, x, y, subtype: e.subtype || null, ...(e.hp ? { hp: e.hp } : {}), ...(e.noLoot ? { noLoot: true } : {}), ...(e.deaf ? { deaf: true } : {}) });
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

  const mapTransitions: any[] = [];
  scenario.tiles.forEach((row, y) =>
    row.forEach((t, x) => {
      if (t.mapTransition) {
        mapTransitions.push({ x, y, ...t.mapTransition });
      }
    })
  );

  return {
    name: scenario.name,
    width: scenario.width,
    height: scenario.height,
    ...(scenario.noAutosave ? { noAutosave: true } : {}),
    tiles,
    metadata: {
      buildings: scenario.buildings,
      specialBuildings: scenario.buildings.filter(b =>
        ['police', 'firestation', 'grocer', 'gas_station', 'army_tent', 'hardware_store', 'lab'].includes(b.type)
      ),
      doors,
      windows,
      placeIcons: scenario.tiles.flatMap((row: TileData[], y: number) =>
        row.flatMap((t: TileData, x: number) => t.placeIcon ? [{ subtype: t.placeIcon, x, y }] : [])
      ),
      spawnZones: scenario.playerSpawn
        ? { playerStart: [scenario.playerSpawn] }
        : {},
    },
    entities,
    eventTriggers,
    mapTransitions,
  };
}

// ─── Main Editor Component ──────────────────────────────────────────────

const CELL = 32;

export default function MapEditor() {
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(20);
  const [scenarioName, setScenarioName] = useState('untitled');
  const [noAutosave, setNoAutosave] = useState(false);
  const [tiles, setTiles] = useState<TileData[][]>(() => createEmptyGrid(20, 20));
  const [buildings, setBuildings] = useState<BuildingMeta[]>([]);
  const [saveSlots, setSaveSlots] = useState<{ slotName: string; timestamp: number; turn?: number }[]>([]);
  const [loadTab, setLoadTab] = useState<'scenarios' | 'saves'>('scenarios');
  const [showGenPicker, setShowGenPicker] = useState(false);

  const [tool, setTool] = useState<ToolMode>('terrain');
  const [brushSize, setBrushSize] = useState(1);
  const [selectedTerrain, setSelectedTerrain] = useState('grass');
  const [selectedEdge, setSelectedEdge] = useState<Edge>('n');
  const [edgeLocked, setEdgeLocked] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('zombie');
  const [zombieSubtype, setZombieSubtype] = useState('basic');
  const [zombieHp, setZombieHp] = useState<number | ''>('');
  const [zombieNoLoot, setZombieNoLoot] = useState(false);
  const [zombieDeaf, setZombieDeaf] = useState(false);
  const [selectedBuildingType, setSelectedBuildingType] = useState('residential');
  const [selectedPlaceIconSubtype, setSelectedPlaceIconSubtype] = useState('grocer');
  const [selectedItem, setSelectedItem] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [waterFill, setWaterFill] = useState<number | ''>('');
  const [conditionVal, setConditionVal] = useState<number | ''>('');
  const [batteryCharges, setBatteryCharges] = useState<number | ''>('');
  const [gunAmmoCount, setGunAmmoCount] = useState<number | ''>('');
  const [gunMagDefId, setGunMagDefId] = useState('');
  const [gunAttachments, setGunAttachments] = useState<Record<string, string>>({});
  const [triggerId, setTriggerId] = useState('');
  const [dialogSteps, setDialogSteps] = useState<{ speaker: string; text: string; video?: string }[]>([]);
  const [dialogOneShot, setDialogOneShot] = useState(true);
  const [editSpeaker, setEditSpeaker] = useState('');
  const [editText, setEditText] = useState('');
  const [editVideo, setEditVideo] = useState('');
  const dialogStepsRef = useRef(dialogSteps);
  dialogStepsRef.current = dialogSteps;

  const [transitionTargetType, setTransitionTargetType] = useState<'scenario' | 'generator' | 'tutorial_end'>('scenario');
  const [transitionTargetId, setTransitionTargetId] = useState('');
  const [transitionLevel, setTransitionLevel] = useState(1);
  const [availableScenarios, setAvailableScenarios] = useState<{ name: string; width: number; height: number; fileName?: string }[]>([]);
  const [exitImage, setExitImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    ScenarioStorage.list().then(list => setAvailableScenarios(list as any[])).catch(console.warn);
    const img = new Image();
    img.src = '/images/items/exit.png';
    img.onload = () => setExitImage(img);
  }, []);

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
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const isDraggingMinimap = useRef(false);
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
          if (tile.edgeWalls[selectedEdge].door) tile.edgeWalls[selectedEdge].locked = edgeLocked;
          break;
        case 'edge_window':
          tile.edgeWalls[selectedEdge].window = !tile.edgeWalls[selectedEdge].window;
          tile.edgeWalls[selectedEdge].wall = false;
          tile.edgeWalls[selectedEdge].door = false;
          if (tile.edgeWalls[selectedEdge].window) tile.edgeWalls[selectedEdge].locked = edgeLocked;
          break;
        case 'entity':
          if (selectedEntity === 'player') {
            // Remove any existing player spawns
            next.forEach(row => row.forEach(t => {
              t.entities = t.entities.filter(e => e.type !== 'player');
            }));
            tile.entities = tile.entities.filter(e => e.type !== 'player');
          }
          {
            const ent: { type: string; subtype?: string; hp?: number; noLoot?: boolean; deaf?: boolean } = { type: selectedEntity };
            if (selectedEntity === 'zombie') {
              ent.subtype = zombieSubtype;
              if (zombieHp !== '') ent.hp = zombieHp as number;
              if (zombieNoLoot) ent.noLoot = true;
              if (zombieDeaf) ent.deaf = true;
            }
            tile.entities.push(ent);
          }
          break;
        case 'item':
          if (selectedItem) {
            const itemEntry: { defId: string; ammoCount?: number; condition?: number; batteryCharges?: number; gunAmmoCount?: number; gunMagDefId?: string; gunAttachments?: Record<string, string> } = { defId: selectedItem };
            if (waterFill !== '') itemEntry.ammoCount = waterFill as number;
            if (conditionVal !== '') itemEntry.condition = conditionVal as number;
            if (batteryCharges !== '') itemEntry.batteryCharges = batteryCharges as number;
            if (gunAmmoCount !== '') itemEntry.gunAmmoCount = gunAmmoCount as number;
            if (gunMagDefId) itemEntry.gunMagDefId = gunMagDefId;
            if (Object.keys(gunAttachments).some(k => gunAttachments[k])) itemEntry.gunAttachments = { ...gunAttachments };
            tile.items.push(itemEntry);
          }
          break;
        case 'event_trigger':
          if (triggerId && dialogStepsRef.current.length > 0) {
            tile.eventTrigger = { id: triggerId, steps: [...dialogStepsRef.current], oneShot: dialogOneShot };
          }
          break;
        case 'map_transition':
          if (transitionTargetId || transitionTargetType === 'tutorial_end') {
            tile.mapTransition = {
              targetType: transitionTargetType,
              targetId: transitionTargetType === 'tutorial_end' ? 'tutorial_end' : transitionTargetId,
              level: transitionTargetType === 'generator' ? transitionLevel : undefined
            };
          }
          break;
        case 'place_icon':
          tile.placeIcon = selectedPlaceIconSubtype;
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
          delete tile.mapTransition;
          delete tile.placeIcon;
          break;
      }

      next[cy][cx] = tile;
      }
      return next;
    });
  }, [tool, selectedTerrain, selectedEdge, edgeLocked, selectedEntity, zombieSubtype, zombieHp, zombieNoLoot, zombieDeaf, selectedItem, waterFill, conditionVal, batteryCharges, gunAmmoCount, gunMagDefId, gunAttachments, triggerId, dialogSteps, dialogOneShot, transitionTargetType, transitionTargetId, transitionLevel, selectedPlaceIconSubtype, brushSize, width, height]);

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

  // ─── Offscreen Static Map Renderer ───────────────────────────────────
  useEffect(() => {
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenRef.current;
    offscreen.width = width * CELL;
    offscreen.height = height * CELL;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

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

        // Place icons
        if (t.placeIcon) {
          const iconDef = PLACE_ICON_TYPES.find(p => p.id === t.placeIcon);
          ctx.fillStyle = iconDef?.color ?? '#fff';
          ctx.font = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(iconDef?.symbol ?? '?', sx + CELL / 2, sy + CELL / 2);
          ctx.strokeStyle = iconDef?.color ?? '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx + 2, sy + 2, CELL - 4, CELL - 4);
        }

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

        // Map transition indicator
        if (t.mapTransition) {
          if (exitImage) {
            ctx.drawImage(exitImage, sx, sy, CELL, CELL);
          } else {
            ctx.fillStyle = '#0ff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('T', sx + CELL / 2, sy + CELL / 2);
          }
        }
      }
    }
  }, [tiles, buildings, width, height, showGrid, exitImage]);

  // ─── Main Canvas Render (Dynamic Overlays) ───────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * CELL;
    canvas.height = height * CELL;

    // Draw static offscreen map
    if (offscreenRef.current) {
      ctx.drawImage(offscreenRef.current, 0, 0);
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
  }, [width, height, hoverCell, buildStart, tool, brushSize, tiles, buildings, showGrid]);

  // ─── Minimap update logic ────────────────────────────────────────────
  const updateMinimapViewport = useCallback(() => {
    const canvas = minimapRef.current;
    const container = scrollContainerRef.current;
    const offscreen = offscreenRef.current;
    if (!canvas || !container || !offscreen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw cached static map
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);

    // Calculate viewport bounds
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const clientWidth = container.clientWidth;
    const clientHeight = container.clientHeight;

    const mapTotalW = width * CELL;
    const mapTotalH = height * CELL;

    const viewX = (scrollLeft / mapTotalW) * canvas.width;
    const viewY = (scrollTop / mapTotalH) * canvas.height;
    const viewW = Math.min(canvas.width - viewX, (clientWidth / mapTotalW) * canvas.width);
    const viewH = Math.min(canvas.height - viewY, (clientHeight / mapTotalH) * canvas.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(viewX, viewY, viewW, viewH);

    // Draw semi-transparent mask outside viewport for focus
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    // left box
    ctx.fillRect(0, 0, viewX, canvas.height);
    // right box
    ctx.fillRect(viewX + viewW, 0, canvas.width - (viewX + viewW), canvas.height);
    // top box
    ctx.fillRect(viewX, 0, viewW, viewY);
    // bottom box
    ctx.fillRect(viewX, viewY + viewH, viewW, canvas.height - (viewY + viewH));
  }, [width, height]);

  const handleScroll = useCallback(() => {
    updateMinimapViewport();
  }, [updateMinimapViewport]);

  const handleMinimapInteraction = useCallback((clientX: number, clientY: number) => {
    const canvas = minimapRef.current;
    const container = scrollContainerRef.current;
    if (!canvas || !container) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(canvas.width, ((clientX - rect.left) / rect.width) * canvas.width));
    const clickY = Math.max(0, Math.min(canvas.height, ((clientY - rect.top) / rect.height) * canvas.height));

    const mapTotalW = width * CELL;
    const mapTotalH = height * CELL;

    const pctX = clickX / canvas.width;
    const pctY = clickY / canvas.height;

    container.scrollLeft = pctX * mapTotalW - container.clientWidth / 2;
    container.scrollTop = pctY * mapTotalH - container.clientHeight / 2;
    updateMinimapViewport();
  }, [width, height, updateMinimapViewport]);

  const onMinimapMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingMinimap.current = true;
    handleMinimapInteraction(e.clientX, e.clientY);
  }, [handleMinimapInteraction]);

  const onMinimapMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingMinimap.current) {
      handleMinimapInteraction(e.clientX, e.clientY);
    }
  }, [handleMinimapInteraction]);

  const onMinimapMouseUpOrLeave = useCallback(() => {
    isDraggingMinimap.current = false;
  }, []);

  // Recalculate minimap canvas size on map size change
  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const maxMinimapDim = 120;
    const mapTotalW = width * CELL;
    const mapTotalH = height * CELL;
    const minimapScale = Math.min(maxMinimapDim / mapTotalW, maxMinimapDim / mapTotalH);
    canvas.width = Math.round(mapTotalW * minimapScale);
    canvas.height = Math.round(mapTotalH * minimapScale);
    updateMinimapViewport();
  }, [width, height, updateMinimapViewport]);

  // Hook into offscreen redraw to keep minimap synced
  useEffect(() => {
    updateMinimapViewport();
  }, [tiles, buildings, width, height, showGrid, exitImage, updateMinimapViewport]);

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
    const hasDoorOrWindow = (['n', 'e', 's', 'w'] as Edge[]).some(e => tile.edgeWalls[e].door || tile.edgeWalls[e].window);
    const hasContent = tile.entities.length > 0 || tile.items.length > 0 || !!tile.eventTrigger || !!tile.mapTransition || !!tile.placeIcon || hasDoorOrWindow;
    if (hasContent) {
      setInspectTile({ x, y, screenX: e.clientX, screenY: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = cellFromEvent(e);
    setHoverCell(prev => {
      if (prev && prev.x === x && prev.y === y) return prev;
      return { x, y };
    });
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
      noAutosave: noAutosave || undefined,
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
    const editorState = { name: scenarioName, width, height, tiles, buildings, noAutosave: noAutosave || undefined };
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
      
      try {
        const slots = await GameSaveSystem.listSaveSlots();
        setSaveSlots(slots || []);
      } catch (err) {
        console.warn('Failed to list save slots:', err);
        setSaveSlots([]);
      }
      
      setShowLoadPicker(true);
    } catch (e: any) {
      setStatusMsg(`Failed to list scenarios: ${e.message}`);
    }
  };

  const applyLoadedData = (data: any, label: string) => {
    let isSaveGame = false;
    let mapData = data;
    if (data && data.gameMap) {
      isSaveGame = true;
      mapData = data.gameMap;
      if (!mapData.metadata && data.worldManager && data.worldManager.currentMapId) {
        const mapsList = Array.isArray(data.worldManager.maps) ? data.worldManager.maps : [];
        const mapEntry = mapsList.find((m: any) => m.id === data.worldManager.currentMapId);
        if (mapEntry && mapEntry.metadata) {
          mapData.metadata = mapEntry.metadata;
        }
      }
    } else if (data && data.tiles && data.tiles[0]?.[0]?.contents !== undefined && data.scentSequenceCounter !== undefined) {
      isSaveGame = true;
    }

    if (isSaveGame) {
      try {
        const editor = saveGameMapToEditorState(mapData);
        setScenarioName(editor.name || 'imported_save');
        setWidth(editor.width);
        setHeight(editor.height);
        setTiles(sanitizeTiles(editor.tiles));
        setBuildings(editor.buildings || []);
        setNoAutosave(editor.noAutosave ?? false);
        setStatusMsg(`Loaded save game map "${label}"`);
        return;
      } catch (err: any) {
        setStatusMsg(`Failed to parse save game: ${err.message}`);
        return;
      }
    }

    // Detect format: editor state has tiles with .entities arrays,
    // scenario format has a top-level entities array and tiles with .inventoryItems
    const isScenarioFormat = data.metadata || data.entities || data.tiles?.[0]?.[0]?.contents !== undefined;
    const editor = isScenarioFormat ? scenarioToEditorState(data) : data;
    setScenarioName(editor.name || 'untitled');
    setWidth(editor.width);
    setHeight(editor.height);
    setTiles(sanitizeTiles(editor.tiles));
    setBuildings(editor.buildings || []);
    setNoAutosave(editor.noAutosave ?? false);
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

  const handlePickSaveSlot = async (slotName: string) => {
    setShowLoadPicker(false);
    try {
      const components = await GameSaveSystem.loadFromStorage(slotName);
      if (!components || !components.gameMap) {
        setStatusMsg(`Failed to load save slot "${slotName}"`);
        return;
      }
      
      const serializedMap = components.gameMap.toJSON();
      
      let mapMetadata = null;
      if (components.worldManager && components.worldManager.currentMapId) {
        const mapEntry = components.worldManager.maps.get(components.worldManager.currentMapId);
        if (mapEntry && mapEntry.metadata) {
          mapMetadata = mapEntry.metadata;
        }
      }
      
      const editorData = saveGameMapToEditorState({
        ...serializedMap,
        name: `save_${slotName}`,
        metadata: mapMetadata
      });
      
      applyLoadedData(editorData, `Save: ${slotName}`);
    } catch (e: any) {
      console.warn('Failed to load save slot:', e);
      setStatusMsg(`Load failed: ${e.message}`);
    }
  };

  const handleGenerateTemplate = async (templateName: string) => {
    if (!confirm('Generate template? This will replace the current map layout!')) return;
    setShowGenPicker(false);
    setStatusMsg(`Generating map template "${templateName}"...`);
    try {
      const { TemplateMapGenerator } = await import('@/game/map/TemplateMapGenerator');
      const generator = new TemplateMapGenerator();
      const scenarioData = generator.generateFromTemplate(templateName, { mapNumber: 1 });
      if (!scenarioData) {
        setStatusMsg('Generation failed: no map produced');
        return;
      }
      scenarioData.name = `generated_${templateName}`;
      applyLoadedData(scenarioData, `Generated: ${templateName}`);
    } catch (err: any) {
      console.error('Failed to generate template:', err);
      setStatusMsg(`Generation failed: ${err.message}`);
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888', cursor: 'pointer', marginTop: 2 }}>
            <input type="checkbox" checked={noAutosave} onChange={e => setNoAutosave(e.target.checked)} />
            Disable autosave
          </label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={handleExport} style={btnStyle('#2a7a2a')}>Publish</button>
            <button onClick={handleSaveEditor} style={btnStyle('#555')}>Save</button>
            <button onClick={handleOpenLoadPicker} style={btnStyle('#555')}>Load</button>
            <button onClick={() => setShowGenPicker(true)} style={btnStyle('#6a4ab8')}>⚡ Generate</button>
            <button onClick={() => fileInputRef.current?.click()} style={btnStyle('#444')}>Import</button>
            <button onClick={handleUndo} style={btnStyle('#555')}>Undo</button>
            <button onClick={handleClear} style={btnStyle('#7a2a2a')}>Clear</button>
            <button onClick={() => (window as any).electronAPI?.openGameWindow?.() ?? window.open(window.location.href.replace(/#.*$/, '#/'), '_blank')} style={btnStyle('#1a3a6a')}>▶ Launch Game</button>
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
          {toolButton('place_icon', 'Sign')}
          {toolButton('entity', 'Entity')}
          {toolButton('item', 'Item')}
          {toolButton('event_trigger', 'Event')}
          {toolButton('map_transition', 'Transition')}
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
            {(tool === 'edge_door' || tool === 'edge_window') && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ddd', cursor: 'pointer', marginTop: 4 }}>
                <input type="checkbox" checked={edgeLocked} onChange={e => setEdgeLocked(e.target.checked)} />
                Locked
              </label>
            )}
          </div>
        )}

        {tool === 'entity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

            {selectedEntity === 'zombie' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #444', paddingTop: 6 }}>
                <label style={{ fontSize: 11, color: '#888' }}>Zombie Type</label>
                <select
                  value={zombieSubtype}
                  onChange={e => { setZombieSubtype(e.target.value); setZombieHp(''); }}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  {ZOMBIE_SUBTYPES.map(z => (
                    <option key={z.id} value={z.id}>{z.label} ({z.defaultHp} hp)</option>
                  ))}
                </select>
                <label style={{ fontSize: 11, color: '#888' }}>Starting HP (blank = full health)</label>
                <input
                  type="number"
                  min={1}
                  value={zombieHp}
                  onChange={e => setZombieHp(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={String(ZOMBIE_SUBTYPES.find(z => z.id === zombieSubtype)?.defaultHp ?? '')}
                  style={{ ...inputStyle, width: '100%' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={zombieNoLoot} onChange={e => setZombieNoLoot(e.target.checked)} />
                  No loot drop on death
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={zombieDeaf} onChange={e => setZombieDeaf(e.target.checked)} />
                  Deaf (ignores noise, e.g. door opening)
                </label>
              </div>
            )}
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

        {tool === 'place_icon' && (
          <div>
            <label style={{ fontSize: 11, color: '#888' }}>Sign / Icon Type</label>
            <select
              value={selectedPlaceIconSubtype}
              onChange={e => setSelectedPlaceIconSubtype(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginTop: 4 }}
            >
              {PLACE_ICON_TYPES.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>Click a tile to place the sign. Signs block movement. Use Eraser to remove.</p>
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
              onChange={e => { setSelectedItem(e.target.value); setWaterFill(''); setConditionVal(''); setBatteryCharges(''); setGunAmmoCount(''); setGunMagDefId(''); setGunAttachments({}); }}
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
            {(() => {
              const def = (ItemDefs as any)[selectedItem];
              const isWater = def?.traits?.includes(ItemTrait.WATER_CONTAINER);
              const isFuel = def?.traits?.includes(ItemTrait.FUEL_CONTAINER);
              if (!isWater && !isFuel) return null;
              const cap: number = def.capacity ?? 0;
              const label = isFuel ? `Fuel units (blank = empty, max ${cap})` : `Water units (blank = full, max ${cap})`;
              const placeholder = isFuel ? '0' : String(cap);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderTop: '1px solid #444', paddingTop: 6 }}>
                  <label style={{ fontSize: 11, color: '#888' }}>{label}</label>
                  <input
                    type="number"
                    min={0}
                    max={cap}
                    value={waterFill}
                    onChange={e => setWaterFill(e.target.value === '' ? '' : Math.min(Number(e.target.value), cap))}
                    placeholder={placeholder}
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
              );
            })()}
            {(() => {
              const def = (ItemDefs as any)[selectedItem];
              const isDegradable = def?.traits?.includes(ItemTrait.DEGRADABLE);
              if (!isDegradable) return null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderTop: '1px solid #444', paddingTop: 6 }}>
                  <label style={{ fontSize: 11, color: '#888' }}>Condition % (blank = 100%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={conditionVal}
                    onChange={e => setConditionVal(e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value))))}
                    placeholder="100"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
              );
            })()}
            {(() => {
              const def = (ItemDefs as any)[selectedItem];
              const slotInfo = getBatterySlotInfo(def);
              if (!slotInfo) return null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderTop: '1px solid #444', paddingTop: 6 }}>
                  <label style={{ fontSize: 11, color: '#888' }}>Battery charges (blank = no battery, max {slotInfo.capacity})</label>
                  <input
                    type="number"
                    min={0}
                    max={slotInfo.capacity}
                    value={batteryCharges}
                    onChange={e => setBatteryCharges(e.target.value === '' ? '' : Math.min(Number(e.target.value), slotInfo.capacity))}
                    placeholder="blank = no battery"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
              );
            })()}
            {(() => {
              const def = (ItemDefs as any)[selectedItem];
              if (!def?.categories?.includes(ItemCategory.GUN)) return null;
              const slots: any[] = def.attachmentSlots || [];
              const directLoad = def.directLoad;
              const ammoSlot = slots.find((s: any) => s.id === 'ammo');
              const nonAmmoSlots = slots.filter((s: any) => s.id !== 'ammo');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #444', paddingTop: 6 }}>
                  <label style={{ fontSize: 11, color: '#7bb8ff', fontWeight: 'bold' }}>Gun Loadout</label>

                  {/* Non-ammo attachment slots (barrel, sight, etc.) */}
                  {nonAmmoSlots.map((slot: any) => {
                    const allowed = allItems.filter(it => {
                      const itDef = (ItemDefs as any)[it.id];
                      return slot.allowedItems?.includes(it.id) ||
                        slot.allowedCategories?.some((cat: string) => itDef?.categories?.includes(cat));
                    });
                    return (
                      <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <label style={{ fontSize: 11, color: '#888' }}>{slot.name}</label>
                        <select
                          value={gunAttachments[slot.id] || ''}
                          onChange={e => setGunAttachments(prev => ({ ...prev, [slot.id]: e.target.value }))}
                          style={{ ...inputStyle, width: '100%' }}
                        >
                          <option value="">— None —</option>
                          {allowed.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                        </select>
                      </div>
                    );
                  })}

                  {/* Ammo slot */}
                  {ammoSlot && !directLoad && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <label style={{ fontSize: 11, color: '#888' }}>{ammoSlot.name}</label>
                      <select
                        value={gunMagDefId}
                        onChange={e => { setGunMagDefId(e.target.value); setGunAmmoCount(''); }}
                        style={{ ...inputStyle, width: '100%' }}
                      >
                        <option value="">— No magazine —</option>
                        {ammoSlot.allowedItems?.map((id: string) => {
                          const magDef = (ItemDefs as any)[id];
                          return <option key={id} value={id}>{magDef?.name || id}</option>;
                        })}
                      </select>
                    </div>
                  )}
                  {ammoSlot && (directLoad || gunMagDefId) && (() => {
                    const capacity = directLoad
                      ? directLoad.capacity
                      : ((ItemDefs as any)[gunMagDefId]?.capacity ?? 0);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <label style={{ fontSize: 11, color: '#888' }}>Rounds loaded (blank = empty, max {capacity})</label>
                        <input
                          type="number"
                          min={0}
                          max={capacity}
                          value={gunAmmoCount}
                          onChange={e => setGunAmmoCount(e.target.value === '' ? '' : Math.min(Number(e.target.value), capacity))}
                          placeholder="0"
                          style={{ ...inputStyle, width: '100%' }}
                        />
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
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
                  {step.video && <div style={{ color: '#fa0', fontSize: 10, marginTop: 2 }}>▶ {step.video}</div>}
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
              <input
                value={editVideo}
                onChange={e => setEditVideo(e.target.value)}
                placeholder="Video filename (optional, e.g. movement.webm)"
                style={{ ...inputStyle }}
              />
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                placeholder="Caption text below video..."
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <button
                onClick={() => {
                  if (!editText.trim() && !editVideo.trim()) return;
                  const step: { speaker: string; text: string; video?: string } = {
                    speaker: editSpeaker.trim(),
                    text: editText.trim(),
                  };
                  if (editVideo.trim()) step.video = editVideo.trim();
                  setDialogSteps(prev => [...prev, step]);
                  setEditText('');
                  setEditVideo('');
                }}
                disabled={!editText.trim() && !editVideo.trim()}
                style={btnStyle((editText.trim() || editVideo.trim()) ? '#2a7a2a' : '#333')}
              >+ Add Step</button>
            </div>

            <p style={{ fontSize: 10, color: '#666', margin: 0 }}>
              Click a tile to place this dialog trigger. Steps play in order when the player walks on the tile.
            </p>
          </div>
        )}

        {tool === 'map_transition' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Target Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={{ fontSize: 11, color: '#ddd', display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="radio"
                  name="transitionTargetType"
                  checked={transitionTargetType === 'scenario'}
                  onChange={() => { setTransitionTargetType('scenario'); setTransitionTargetId(''); }}
                />
                Scenario
              </label>
              <label style={{ fontSize: 11, color: '#ddd', display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="radio"
                  name="transitionTargetType"
                  checked={transitionTargetType === 'generator'}
                  onChange={() => { setTransitionTargetType('generator'); setTransitionTargetId(''); }}
                />
                Generator
              </label>
              <label style={{ fontSize: 11, color: '#ddd', display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="radio"
                  name="transitionTargetType"
                  checked={transitionTargetType === 'tutorial_end'}
                  onChange={() => { setTransitionTargetType('tutorial_end'); setTransitionTargetId(''); }}
                />
                Tutorial End
              </label>
            </div>

            {transitionTargetType !== 'tutorial_end' && (
              <>
                <label style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                  {transitionTargetType === 'scenario' ? 'Select Scenario' : 'Select Generator'}
                </label>

                <select
                  value={transitionTargetId}
                  onChange={e => setTransitionTargetId(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  <option value="">— Select —</option>
                  {transitionTargetType === 'scenario' ? (
                    availableScenarios.map(s => (
                      <option key={s.fileName || s.name} value={s.fileName || s.name}>
                        {s.name} ({s.width}x{s.height})
                      </option>
                    ))
                  ) : (
                    [
                      'BranchingRoadGenerator',
                      'LabMapGenerator',
                      'MirroredWindingRoadGenerator',
                      'RoadGenerator',
                      'ScenarioMapGenerator',
                      'SplitRoadGenerator',
                      'StartingRoadGenerator',
                      'WindingRoadGenerator'
                    ].map(gen => (
                      <option key={gen} value={gen}>{gen}</option>
                    ))
                  )}
                </select>

                {transitionTargetType === 'generator' && (
                  <>
                    <label style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Level (Scaling)</label>
                    <input
                      type="number"
                      min={1}
                      value={transitionLevel}
                      onChange={e => setTransitionLevel(+e.target.value)}
                      style={{ ...inputStyle }}
                    />
                  </>
                )}
              </>
            )}

            <p style={{ fontSize: 10, color: '#666', margin: 0, marginTop: 4 }}>
              Click a tile to place this map transition. The player will be teleported here when stepping on the tile.
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            {exitImage ? (
              <img src="/images/items/exit.png" style={{ width: 14, height: 14, objectFit: 'contain' }} alt="Exit" />
            ) : (
              <span style={{ color: '#0ff', fontWeight: 'bold' }}>T</span>
            )}Map Transition
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
              <div>Entities: {tiles[hoverCell.y][hoverCell.x].entities.map(e => e.subtype ? `${e.type}(${e.subtype})` : e.type).join(', ')}</div>
            )}
            {tiles[hoverCell.y][hoverCell.x].items.length > 0 && (
              <div>Items: {tiles[hoverCell.y][hoverCell.x].items.map(i => i.defId).join(', ')}</div>
            )}
            {tiles[hoverCell.y][hoverCell.x].eventTrigger && (
              <div>Event: {tiles[hoverCell.y][hoverCell.x].eventTrigger!.id} ({tiles[hoverCell.y][hoverCell.x].eventTrigger!.steps?.length || 0} steps{tiles[hoverCell.y][hoverCell.x].eventTrigger!.oneShot ? ', one-shot' : ''})</div>
            )}
            {tiles[hoverCell.y][hoverCell.x].placeIcon && (
              <div>Sign: {PLACE_ICON_TYPES.find(p => p.id === tiles[hoverCell.y][hoverCell.x].placeIcon)?.label ?? tiles[hoverCell.y][hoverCell.x].placeIcon}</div>
            )}
            {tiles[hoverCell.y][hoverCell.x].mapTransition && (
              <div>Transition: {tiles[hoverCell.y][hoverCell.x].mapTransition!.targetType === 'tutorial_end' ? 'Tutorial End' : `${tiles[hoverCell.y][hoverCell.x].mapTransition!.targetId} (${tiles[hoverCell.y][hoverCell.x].mapTransition!.targetType}${tiles[hoverCell.y][hoverCell.x].mapTransition!.targetType === 'generator' ? `, Lvl ${tiles[hoverCell.y][hoverCell.x].mapTransition!.level}` : ''})`}</div>
            )}
          </div>
        )}

        {/* Status */}
        {statusMsg && (
          <div style={{ fontSize: 11, color: '#7bb8ff', padding: '4px 0' }}>{statusMsg}</div>
        )}
      </div>

      {/* ─── Generator picker modal ─── */}
      {showGenPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowGenPicker(false)}>
          <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, minWidth: 320, maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#7bb8ff' }}>Generate Map Template</h3>
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>Select a map template to procedurally generate. This will overwrite the current map!</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { id: 'starting_road', name: 'Starting Road (Yard/House)' },
                { id: 'road', name: 'Straight Road' },
                { id: 'winding_road', name: 'Winding Road' },
                { id: 'mirrored_winding_road', name: 'Mirrored Winding Road' },
                { id: 'split_road', name: 'Split Road' },
                { id: 'branching_road', name: 'Branching Road' },
                { id: 'lab', name: 'Lab Complex' },
                { id: 'small_building', name: 'Small Building base' },
                { id: 'mall_section', name: 'Mall Section base' },
                { id: 'outdoor_area', name: 'Outdoor Area base' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => handleGenerateTemplate(t.id)}
                  style={{
                    padding: '8px 12px',
                    background: '#333',
                    border: '1px solid #555',
                    borderRadius: 4,
                    color: '#ddd',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#444')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#333')}
                >
                  <span>{t.name}</span>
                  <span style={{ color: '#888', fontSize: 10 }}>{t.id}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowGenPicker(false)}
              style={{ ...btnStyle('#555'), marginTop: 16, width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ─── Load picker modal ─── */}
      {showLoadPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowLoadPicker(false)}>
          <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, minWidth: 320, maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#7bb8ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Load Map</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setLoadTab('scenarios')}
                  style={{
                    padding: '2px 8px',
                    fontSize: 11,
                    background: loadTab === 'scenarios' ? '#4a90d9' : '#333',
                    border: '1px solid #555',
                    borderRadius: 3,
                    color: '#eee',
                    cursor: 'pointer'
                  }}
                >Scenarios</button>
                <button
                  onClick={() => setLoadTab('saves')}
                  style={{
                    padding: '2px 8px',
                    fontSize: 11,
                    background: loadTab === 'saves' ? '#4a90d9' : '#333',
                    border: '1px solid #555',
                    borderRadius: 3,
                    color: '#eee',
                    cursor: 'pointer'
                  }}
                >Game Saves</button>
              </div>
            </h3>

            {loadTab === 'scenarios' ? (
              savedScenarios.length === 0 ? (
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
              )
            ) : (
              saveSlots.length === 0 ? (
                <p style={{ color: '#888', fontSize: 13 }}>No game saves found.</p>
              ) : (
                saveSlots.map(s => (
                  <div key={s.slotName}
                    onClick={() => handlePickSaveSlot(s.slotName)}
                    style={{ padding: '8px 12px', marginBottom: 4, background: '#333', borderRadius: 4, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#444')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#333')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#ddd', fontSize: 13, fontWeight: 'bold' }}>{s.slotName}</span>
                      <span style={{ color: '#888', fontSize: 11 }}>Turn {s.turn || 1}</span>
                    </div>
                    <span style={{ color: '#666', fontSize: 10 }}>{new Date(s.timestamp).toLocaleString()}</span>
                  </div>
                ))
              )
            )}
            <button onClick={() => setShowLoadPicker(false)}
              style={{ ...btnStyle('#555'), marginTop: 12, width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ─── Canvas area ─── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 16, position: 'relative' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          onMouseLeave={() => { setIsPainting(false); setHoverCell(null); }}
          style={{ cursor: 'crosshair', imageRendering: 'pixelated' }}
        />

        {/* ─── Floating Minimap ─── */}
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: '#151515',
          border: '2px solid #444',
          borderRadius: 6,
          padding: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          zIndex: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          userSelect: 'none',
        }}>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 'bold', alignSelf: 'flex-start' }}>NAVIGATION</div>
          <canvas
            ref={minimapRef}
            onMouseDown={onMinimapMouseDown}
            onMouseMove={onMinimapMouseMove}
            onMouseUp={onMinimapMouseUpOrLeave}
            onMouseLeave={onMinimapMouseUpOrLeave}
            style={{ 
              background: '#000', 
              borderRadius: 3, 
              cursor: 'pointer',
              display: 'block'
            }}
          />
        </div>
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

        const removeTransition = () => {
          setTiles(prev => {
            pushUndo(prev, buildingsRef.current);
            const next = prev.map(r => r.map(c => ({ ...c, entities: [...c.entities], items: [...c.items] })));
            delete next[ty][tx].mapTransition;
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

        const editTransition = () => {
          if (t.mapTransition) {
            setTransitionTargetType(t.mapTransition.targetType);
            setTransitionTargetId(t.mapTransition.targetId);
            setTransitionLevel(t.mapTransition.level || 1);
            setTool('map_transition');
            setStatusMsg(t.mapTransition.targetType === 'tutorial_end' ? 'Editing Tutorial End transition — click a tile to place' : `Editing transition to "${t.mapTransition.targetId}" — click a tile to place`);
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

              {/* Edge Walls (doors / windows) */}
              {(['n', 'e', 's', 'w'] as Edge[]).some(edge => t.edgeWalls[edge].door || t.edgeWalls[edge].window) && (
                <div style={sectionStyle}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Doors &amp; Windows</div>
                  {(['n', 'e', 's', 'w'] as Edge[]).map(edge => {
                    const es = t.edgeWalls[edge];
                    if (!es.door && !es.window) return null;
                    const label = { n: 'North', e: 'East', s: 'South', w: 'West' }[edge];
                    const kind = es.door ? 'Door' : 'Window';
                    const color = es.door ? '#c8a032' : '#5599dd';
                    return (
                      <div key={edge} style={rowStyle}>
                        <span style={{ color }}>{label} {kind}</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ddd', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!es.locked}
                            onChange={() => {
                              setTiles(prev => {
                                const next = prev.map(r => r.map(c => ({ ...c, edgeWalls: { ...c.edgeWalls } })));
                                next[ty][tx].edgeWalls[edge] = { ...next[ty][tx].edgeWalls[edge], locked: !es.locked };
                                return next;
                              });
                            }}
                          />
                          Locked
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Entities */}
              {t.entities.length > 0 && (
                <div style={sectionStyle}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Entities</div>
                  {t.entities.map((ent, i) => {
                    const def = ENTITY_TYPES.find(e => e.id === ent.type);
                    return (
                      <div key={i} style={rowStyle}>
                        <span style={{ color: def?.color || '#aaa' }}>
                          {def?.label || ent.type}
                          {ent.subtype ? ` · ${ent.subtype}` : ''}
                          {ent.hp ? ` · ${ent.hp} hp` : ''}
                          {ent.noLoot ? ` · no loot` : ''}
                          {ent.deaf ? ` · deaf` : ''}
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
                  {t.items.map((item, i) => {
                    const def = (ItemDefs as any)[item.defId];
                    const isWaterContainer = def?.traits?.includes(ItemTrait.WATER_CONTAINER);
                    const isFuelContainer = def?.traits?.includes(ItemTrait.FUEL_CONTAINER);
                    const isDegradable = def?.traits?.includes(ItemTrait.DEGRADABLE);
                    const slotInfo = getBatterySlotInfo(def);
                    const isGun = def?.categories?.includes(ItemCategory.GUN);
                    const gunAmmoLabel = (() => {
                      if (!isGun) return '';
                      const parts: string[] = [];
                      if (item.gunMagDefId) parts.push((ItemDefs as any)[item.gunMagDefId]?.name || item.gunMagDefId);
                      if (item.gunAmmoCount !== undefined) parts.push(`${item.gunAmmoCount} rds`);
                      if (item.gunAttachments) {
                        for (const attDefId of Object.values(item.gunAttachments)) {
                          if (attDefId) parts.push((ItemDefs as any)[attDefId]?.name || attDefId);
                        }
                      }
                      return parts.length ? ` · ${parts.join(', ')}` : '';
                    })();
                    return (
                      <div key={i} style={rowStyle}>
                        <span style={{ color: '#fc0' }}>
                          {def?.name || item.defId}
                          {def ? ` (${def.width}×${def.height})` : ''}
                          {isWaterContainer && item.ammoCount !== undefined ? ` · ${item.ammoCount}/${def.capacity} water` : ''}
                          {isFuelContainer && item.ammoCount !== undefined ? ` · ${item.ammoCount}/${def.capacity} fuel` : ''}
                          {isDegradable && item.condition !== undefined ? ` · ${item.condition}% cond` : ''}
                          {slotInfo && item.batteryCharges !== undefined ? ` · ${item.batteryCharges}/${slotInfo.capacity} chg` : ''}
                          {gunAmmoLabel}
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

              {/* Place Icon */}
              {t.placeIcon && (
                <div style={sectionStyle}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Place Icon / Sign</div>
                  <div style={{ fontSize: 12, color: '#fc0', marginBottom: 4 }}>
                    {PLACE_ICON_TYPES.find(p => p.id === t.placeIcon)?.label ?? t.placeIcon}
                  </div>
                  <button
                    onClick={() => {
                      setTiles(prev => {
                        pushUndo(prev, buildingsRef.current);
                        const next = prev.map(r => r.map(tile => ({ ...tile, edgeWalls: { ...tile.edgeWalls }, entities: [...tile.entities], items: [...tile.items] })));
                        delete next[inspectTile!.y][inspectTile!.x].placeIcon;
                        return next;
                      });
                      setInspectTile(null);
                    }}
                    style={removeBtnStyle}
                  >Remove</button>
                </div>
              )}

              {/* Map Transition */}
              {t.mapTransition && (
                <div style={sectionStyle}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Map Transition</div>
                  <div style={{ fontSize: 12, color: '#0ff', marginBottom: 2 }}>
                    {t.mapTransition.targetType === 'tutorial_end' ? 'Tutorial End' : `Target: ${t.mapTransition.targetId}`}
                  </div>
                  {t.mapTransition.targetType !== 'tutorial_end' && (
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
                      Type: {t.mapTransition.targetType}
                      {t.mapTransition.targetType === 'generator' && ` · Level: ${t.mapTransition.level}`}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button onClick={editTransition} style={editBtnStyle}>Edit</button>
                    <button onClick={removeTransition} style={removeBtnStyle}>Remove</button>
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
