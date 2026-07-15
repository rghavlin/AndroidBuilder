import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ScenarioStorage } from '@/game/ScenarioStorage';
import { ItemDefs, createItemFromDef } from '@/game/inventory/ItemDefs';
import { ItemCategory, ItemTrait } from '@/game/inventory/traits';
import { GameSaveSystem } from '@/game/GameSaveSystem';
import { migrateLegacyEvents, downconvertEvents, resolveMapEvents } from '@/game/quest/migrateEvents';
import { emptyEvent, emptyQuestRegistry, emptyEntityRegistry, type GameEvent, type QuestRegistry, type EntityRegistry, type EntityRegistryEntry } from '@/game/quest/eventTypes';
import EventWindow, { ConditionListEditor, QuestRewardEditor } from '@/components/MapEditor/EventWindow';

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
  { id: 'peeper',       label: 'Peeper Zombie',   defaultHp: 10 },
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

// NPC types the editor can author (drives stats/faction via NPCTypes.js at runtime).
const NPC_TYPES = [
  { id: 'survivor',   label: 'Survivor' },
  { id: 'shopkeeper', label: 'Shopkeeper' },
  { id: 'gatekeeper', label: 'Gatekeeper' },
];

// Custom icon catalog for NPCs: reuses art already shipped with the game (no
// new asset pipeline). Each `key` is a literal image filename already present
// in client/public/images/entities/ — EntityRenderer looks it up directly
// (imageLoader.getImage(key)), bypassing the usual npc_<subtype> convention
// since no such per-subtype NPC art exists.
const NPC_ICON_OPTIONS = [
  { key: 'npc',                label: 'Default (Survivor)' },
  { key: 'player',              label: 'Player-like' },
  { key: 'playerGREEN',         label: 'Player-like (Green)' },
  { key: 'rabbit',               label: 'Rabbit' },
  { key: 'zombie',               label: 'Zombie (basic)' },
  { key: 'runnerzombie',         label: 'Zombie (Runner)' },
  { key: 'peeperzombie',         label: 'Zombie (Peeper)' },
  { key: 'crawlerzombie',        label: 'Zombie (Crawler)' },
  { key: 'fatzombie',            label: 'Zombie (Fat)' },
  { key: 'soldierzombie',        label: 'Zombie (Soldier)' },
  { key: 'firefighterzombie',    label: 'Zombie (Firefighter)' },
  { key: 'swatzombie',           label: 'Zombie (SWAT)' },
  { key: 'acidzombie',           label: 'Zombie (Acid)' },
  { key: 'spitterzombie',        label: 'Zombie (Spitter)' },
  { key: 'bombdisposalzombie',   label: 'Zombie (Bomb Disposal)' },
  { key: 'zombiemutant',         label: 'Zombie (Mutant)' },
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
type ToolMode = 'terrain' | 'edge_wall' | 'edge_door' | 'edge_window' | 'entity' | 'item' | 'building_rect' | 'eraser' | 'map_transition' | 'place_icon' | 'event_editor';

// On-map, per-entity speech bubbles. A BubbleEvent is a sequence of lines, each
// anchored to a specific tile/entity, played one at a time when its trigger
// fires. Serialized to scenario top-level `bubbleEvents` (see SpeechBubbleContext).
interface BubbleLine { x: number; y: number; speaker?: string; text: string; }
// An event effect: spawn `count` of `defId` onto tile (x, y) when the event fires.
interface ItemGrant { defId: string; count?: number; x: number; y: number; }
// A modal dialog event that lives by id only (no tile) — fired solely via chaining.
interface DialogEventDef {
  id: string;
  steps: { speaker: string; text: string; video?: string }[];
  oneShot: boolean;
  grants?: ItemGrant[];
  next?: string;
}
interface BubbleEvent {
  id: string;
  oneShot: boolean;
  trigger: { type: 'tile' | 'proximity'; x: number; y: number; radius?: number };
  lines: BubbleLine[];
  grants?: ItemGrant[];
  next?: string; // id of an event to fire when this one completes
}

interface EdgeState { wall: boolean; door: boolean; window: boolean; locked?: boolean; }
interface TileData {
  terrain: string;
  edgeWalls: Record<Edge, EdgeState>;
  entities: { type: string; subtype?: string; hp?: number; noLoot?: boolean; deaf?: boolean; typeId?: string; name?: string; isHostile?: boolean; iconId?: string }[];
  items: { defId: string; ammoCount?: number; condition?: number; batteryCharges?: number; gunAmmoCount?: number; gunMagDefId?: string; gunAttachments?: Record<string, string>; transitionTargetId?: string; transitionTargetX?: number; transitionTargetY?: number; eventId?: string }[];
  eventTrigger?: { id: string; steps: { speaker: string; text: string; video?: string }[]; oneShot: boolean; grants?: ItemGrant[]; next?: string };
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
  alwaysDark?: boolean;
  seed?: number;
  lowSpots?: { x: number; y: number }[];
  bubbleEvents?: BubbleEvent[];
  chainDialogEvents?: DialogEventDef[];
  events?: GameEvent[];
  questRegistry?: QuestRegistry;
  entityRegistry?: EntityRegistry;
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

function scenarioToEditorState(scenario: any): { name: string; width: number; height: number; tiles: TileData[][]; buildings: any[]; noAutosave: boolean; alwaysDark?: boolean; seed?: number; lowSpots?: { x: number; y: number }[]; bubbleEvents?: BubbleEvent[]; chainDialogEvents?: DialogEventDef[]; events: GameEvent[]; questRegistry: QuestRegistry; entityRegistry: EntityRegistry } {
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
              if (it.transitionTargetId !== undefined) entry.transitionTargetId = it.transitionTargetId;
              if (it.transitionTargetX !== undefined) entry.transitionTargetX = it.transitionTargetX;
              if (it.transitionTargetY !== undefined) entry.transitionTargetY = it.transitionTargetY;
              if (it.eventId !== undefined) entry.eventId = it.eventId;
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
      if (t) t.entities.push({
        type: e.type, subtype: e.subtype,
        hp: e.hp || undefined,
        noLoot: e.noLoot || undefined,
        deaf: e.deaf || undefined,
        typeId: e.typeId || undefined,
        name: e.name || undefined,
        isHostile: e.isHostile || undefined,
        iconId: e.iconId || undefined,
      });
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

  // Event triggers. Resolved through the unified GameEvent model so a map
  // authored with only the new `events[]` shape (Phase 2+) loads correctly
  // here too. The resolved `unifiedEvents` is kept as the lossless source of
  // truth for the editor's "Open existing" list; the down-converted legacy
  // arrays below are a best-effort projection used only for canvas markers,
  // the tile-info popover, and runtime back-compat — for an event that mixes
  // dialog + speech steps that projection is necessarily lossy (only one of
  // the two step kinds survives down-conversion), so it must never be the
  // thing re-read back into the editor's authored event list.
  const unifiedEvents = resolveMapEvents({
    events: scenario.events || scenario.metadata?.events,
    eventTriggers: scenario.eventTriggers || scenario.metadata?.eventTriggers,
    bubbleEvents: scenario.bubbleEvents || scenario.metadata?.bubbleEvents,
  });
  const { eventTriggers: resolvedEventTriggers, bubbleEvents: resolvedBubbleEvents } = downconvertEvents(unifiedEvents);
  const triggers = resolvedEventTriggers;
  const chainDialogEvents: DialogEventDef[] = [];
  if (triggers) {
    for (const evt of triggers) {
      if (evt.chainOnly || evt.x === undefined || evt.y === undefined) {
        chainDialogEvents.push({ id: evt.id, steps: evt.steps || [], oneShot: evt.oneShot ?? true, ...(evt.grants ? { grants: evt.grants } : {}), ...(evt.next ? { next: evt.next } : {}) });
        continue;
      }
      const t = tiles[evt.y]?.[evt.x];
      if (!t) continue;
      if (evt.steps) {
        t.eventTrigger = { id: evt.id, steps: evt.steps, oneShot: evt.oneShot ?? true, ...(evt.grants ? { grants: evt.grants } : {}), ...(evt.next ? { next: evt.next } : {}) };
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
    alwaysDark: scenario.alwaysDark ?? scenario.metadata?.alwaysDark ?? false,
    seed: scenario.seed ?? scenario.metadata?.seed,
    lowSpots: scenario.metadata?.lowSpots || scenario.lowSpots || [],
    bubbleEvents: resolvedBubbleEvents || [],
    chainDialogEvents,
    events: unifiedEvents,
    questRegistry: scenario.questRegistry || scenario.metadata?.questRegistry || emptyQuestRegistry(),
    entityRegistry: scenario.entityRegistry || scenario.metadata?.entityRegistry || emptyEntityRegistry(),
  };
}

function saveGameMapToEditorState(mapData: any): { name: string; width: number; height: number; tiles: TileData[][]; buildings: any[]; noAutosave: boolean; alwaysDark?: boolean; seed?: number; lowSpots?: { x: number; y: number }[]; bubbleEvents?: BubbleEvent[]; chainDialogEvents?: DialogEventDef[]; events: GameEvent[]; questRegistry: QuestRegistry; entityRegistry: EntityRegistry } {
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
            if (it.transitionTargetId !== undefined) entry.transitionTargetId = it.transitionTargetId;
            if (it.transitionTargetX !== undefined) entry.transitionTargetX = it.transitionTargetX;
            if (it.transitionTargetY !== undefined) entry.transitionTargetY = it.transitionTargetY;
            if (it.eventId !== undefined) entry.eventId = it.eventId;
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
              tiles[y][x].entities.push({
                type: 'npc',
                typeId: e.typeId,
                name: e.name,
                isHostile: e.isHostile,
                iconId: e.iconId,
              });
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

  // Event Triggers and Map Transitions from map metadata. Resolved through the
  // unified GameEvent model (see scenarioToEditorState above for why).
  const metadata = mapData.metadata;
  // See scenarioToEditorState above: unifiedEvents is the lossless source kept
  // for the editor's authored event list; the down-converted legacy arrays are
  // a best-effort projection for canvas/tile-info/runtime back-compat only.
  const unifiedEvents = resolveMapEvents({
    events: mapData.events || metadata?.events,
    eventTriggers: metadata?.eventTriggers,
    bubbleEvents: mapData.bubbleEvents || metadata?.bubbleEvents,
  });
  const { eventTriggers: resolvedEventTriggers2, bubbleEvents: resolvedBubbleEvents2 } = downconvertEvents(unifiedEvents);
  const chainDialogEvents: DialogEventDef[] = [];
  if (resolvedEventTriggers2) {
    for (const evt of resolvedEventTriggers2) {
      if (evt.chainOnly || evt.x === undefined || evt.y === undefined) {
        chainDialogEvents.push({ id: evt.id, steps: evt.steps || [], oneShot: evt.oneShot ?? true, ...(evt.grants ? { grants: evt.grants } : {}), ...(evt.next ? { next: evt.next } : {}) });
        continue;
      }
      const t = tiles[evt.y]?.[evt.x];
      if (t) {
        t.eventTrigger = { id: evt.id, steps: evt.steps, oneShot: evt.oneShot ?? true, ...(evt.grants ? { grants: evt.grants } : {}), ...(evt.next ? { next: evt.next } : {}) };
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
    alwaysDark: mapData.alwaysDark ?? mapData.metadata?.alwaysDark ?? false,
    seed: mapData.seed ?? mapData.metadata?.seed,
    lowSpots: mapData.metadata?.lowSpots || mapData.lowSpots || [],
    bubbleEvents: resolvedBubbleEvents2 || [],
    chainDialogEvents,
    events: unifiedEvents,
    questRegistry: mapData.questRegistry || metadata?.questRegistry || emptyQuestRegistry(),
    entityRegistry: mapData.entityRegistry || metadata?.entityRegistry || emptyEntityRegistry(),
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
          if (full && item.transitionTargetId !== undefined) full.transitionTargetId = item.transitionTargetId;
          if (full && item.transitionTargetX !== undefined) full.transitionTargetX = item.transitionTargetX;
          if (full && item.transitionTargetY !== undefined) full.transitionTargetY = item.transitionTargetY;
          if (full && item.eventId !== undefined) full.eventId = item.eventId;
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
        entities.push({
          type: e.type, x, y, subtype: e.subtype || null,
          ...(e.hp ? { hp: e.hp } : {}),
          ...(e.noLoot ? { noLoot: true } : {}),
          ...(e.deaf ? { deaf: true } : {}),
          ...(e.typeId ? { typeId: e.typeId } : {}),
          ...(e.name ? { name: e.name } : {}),
          ...(e.isHostile ? { isHostile: true } : {}),
          ...(e.iconId ? { iconId: e.iconId } : {}),
        });
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
  // Chain-only dialog events: no tile, fired only via event chaining.
  (scenario.chainDialogEvents || []).forEach(ev => {
    eventTriggers.push({ chainOnly: true, id: ev.id, steps: ev.steps, oneShot: ev.oneShot, ...(ev.grants ? { grants: ev.grants } : {}), ...(ev.next ? { next: ev.next } : {}) });
  });

  const mapTransitions: any[] = [];
  scenario.tiles.forEach((row, y) =>
    row.forEach((t, x) => {
      if (t.mapTransition) {
        mapTransitions.push({ x, y, ...t.mapTransition });
      }
    })
  );

  // Dual-write the unified GameEvent model alongside the legacy eventTriggers/
  // bubbleEvents arrays: `scenario.events` (the editor's lossless authored list —
  // see allEditorEvents) is the canonical source and is what Phase 3's runtime
  // runner actually reads (resolveMapEvents prefers metadata.events). It is NOT
  // re-derived from the legacy arrays above — down-converting a mixed
  // dialog+speech event can only keep one of the two step kinds, which would
  // silently drop data on every export. Falls back to migrating the legacy
  // arrays only for a caller that never populated scenario.events.
  const events = scenario.events ?? migrateLegacyEvents({ eventTriggers, bubbleEvents: scenario.bubbleEvents || [] });

  return {
    name: scenario.name,
    width: scenario.width,
    height: scenario.height,
    ...(scenario.noAutosave ? { noAutosave: true } : {}),
    ...(scenario.alwaysDark ? { alwaysDark: true } : {}),
    seed: scenario.seed,
    tiles,
    metadata: {
      alwaysDark: scenario.alwaysDark,
      buildings: scenario.buildings,
      seed: scenario.seed,
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
    ...(scenario.bubbleEvents && scenario.bubbleEvents.length ? { bubbleEvents: scenario.bubbleEvents } : {}),
    ...(events.length ? { events } : {}),
    ...(scenario.questRegistry && (scenario.questRegistry.flags.length || scenario.questRegistry.vars.length || (scenario.questRegistry.quests && scenario.questRegistry.quests.length)) ? { questRegistry: scenario.questRegistry } : {}),
    ...(scenario.entityRegistry && scenario.entityRegistry.entries.length ? { entityRegistry: scenario.entityRegistry } : {}),
  };
}

// ─── Main Editor Component ──────────────────────────────────────────────

const CELL = 32;

export default function MapEditor() {
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(20);
  const [scenarioName, setScenarioName] = useState('untitled');
  const [noAutosave, setNoAutosave] = useState(false);
  const [alwaysDark, setAlwaysDark] = useState(false);
  const [tiles, setTiles] = useState<TileData[][]>(() => createEmptyGrid(20, 20));
  const [buildings, setBuildings] = useState<BuildingMeta[]>([]);
  const [zoom, setZoom] = useState(1.0);
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
  const [npcTypeId, setNpcTypeId] = useState('survivor');
  const [npcName, setNpcName] = useState('');
  const [npcIsHostile, setNpcIsHostile] = useState(false);
  const [npcIconId, setNpcIconId] = useState('npc');
  const [npcAiDisabled, setNpcAiDisabled] = useState(false);
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
  // ─── Speech bubble event storage (authored via the unified Event Window) ──
  const [bubbleEvents, setBubbleEvents] = useState<BubbleEvent[]>([]);

  // ─── Chain-only dialog events (no tile; fired only via chaining) ─────
  const [chainDialogEvents, setChainDialogEvents] = useState<DialogEventDef[]>([]);

  // Known event ids (speech + dialog) for the chain "then trigger" pickers.
  const knownEventIds = useMemo(() => {
    const ids = new Set<string>();
    bubbleEvents.forEach(e => e.id && ids.add(e.id));
    chainDialogEvents.forEach(e => e.id && ids.add(e.id));
    tiles.forEach(row => row.forEach(t => { if (t.eventTrigger?.id) ids.add(t.eventTrigger.id); }));
    return Array.from(ids).sort();
  }, [bubbleEvents, chainDialogEvents, tiles]);

  // ─── Unified Event Window (Phase 2) ───────────────────────────────────
  // Single "Event" tool: open an existing event or create a new one, editing
  // through one window regardless of whether it ends up dialog- or
  // speech-shaped. Storage stays the legacy tiles[].eventTrigger /
  // chainDialogEvents / bubbleEvents arrays (still what rendering, save/load,
  // and the runtime all use) — the window just authors GameEvent objects and
  // down-converts them into that storage via migrateEvents.js.
  const [eventEditorDraft, setEventEditorDraft] = useState<GameEvent | null>(null);
  // The id the draft was opened under (null for a brand-new event). Lets
  // saveEventDraft tell "renamed an existing event" apart from "created a new
  // one" so a rename removes the OLD id's entries instead of leaving a stale
  // duplicate behind under the original name.
  const [eventEditorOriginalId, setEventEditorOriginalId] = useState<string | null>(null);
  const [eventEditorNewName, setEventEditorNewName] = useState('');
  const [eventEditorPick, setEventEditorPick] = useState<{ mode: 'placement' } | { mode: 'step'; index: number } | null>(null);

  // All events currently on the map — the lossless source of truth for the
  // "Open existing" list and for export. NOT derived from the legacy storage
  // (tiles[].eventTrigger / chainDialogEvents / bubbleEvents) on every render:
  // that round-trips through downconvertEvents, which can only keep ONE of
  // {dialog, speech} steps for a mixed event and would silently drop the
  // other kind the moment it was re-derived. Populated from resolveMapEvents
  // on map load (see scenarioToEditorState/saveGameMapToEditorState), and
  // updated directly by saveEventDraft/deleteEventDraft below.
  const [allEditorEvents, setAllEditorEvents] = useState<GameEvent[]>([]);

  // ─── Switches & Variables registry ────────────────────────────────────
  // Authored names, independent of any single event — every flag/var picker
  // in the Event Window (conditions, setFlag/setVar steps) reads from this
  // instead of free text. Persisted per-map alongside events/bubbleEvents.
  const [questRegistry, setQuestRegistry] = useState<QuestRegistry>(emptyQuestRegistry());
  const [showQuestRegistryModal, setShowQuestRegistryModal] = useState(false);

  // ─── Map Entity Registry ──────────────────────────────────────────────
  const [entityRegistry, setEntityRegistry] = useState<EntityRegistry>(emptyEntityRegistry());
  const [showEntityRegistryModal, setShowEntityRegistryModal] = useState(false);
  const [newEntityTag, setNewEntityTag] = useState('');
  const [newEntityType, setNewEntityType] = useState<'door' | 'window' | 'zombie'>('door');
  const [newEntityX, setNewEntityX] = useState<number | ''>('');
  const [newEntityY, setNewEntityY] = useState<number | ''>('');
  const [newEntityDesc, setNewEntityDesc] = useState('');
  const [entityPickMode, setEntityPickMode] = useState(false);

  const addEntityRegistryEntry = useCallback(() => {
    const tag = newEntityTag.trim();
    if (!tag) { setStatusMsg('Tag name cannot be empty'); return; }
    if (newEntityX === '' || newEntityY === '') { setStatusMsg('Please select a tile coordinate on the map'); return; }
    
    // Validate uniqueness of tag
    if (entityRegistry.entries.some(e => e.tag === tag)) {
      setStatusMsg(`An entity registry entry with tag "${tag}" already exists`);
      return;
    }
    
    setEntityRegistry(prev => ({
      ...prev,
      entries: [...prev.entries, {
        tag,
        type: newEntityType,
        x: Number(newEntityX),
        y: Number(newEntityY),
        ...(newEntityDesc.trim() ? { description: newEntityDesc.trim() } : {}),
      }]
    }));
    
    setNewEntityTag('');
    setNewEntityX('');
    setNewEntityY('');
    setNewEntityDesc('');
  }, [newEntityTag, newEntityType, newEntityX, newEntityY, newEntityDesc, entityRegistry]);

  const removeEntityRegistryEntry = useCallback((tag: string) => {
    setEntityRegistry(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.tag !== tag)
    }));
  }, []);

  const knownEntities = useMemo(() => {
    const list: { tag: string; label: string; type?: string }[] = [{ tag: 'player', label: 'Player', type: 'player' }];
    
    // Auto-register NPCs with non-empty names
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = tiles[y]?.[x];
        if (t?.entities) {
          for (const ent of t.entities) {
            if (ent.type === 'npc' && ent.name?.trim()) {
              const name = ent.name.trim();
              if (!list.some(e => e.tag === name)) {
                list.push({ tag: name, label: `NPC: ${name} (at ${x},${y})`, type: 'npc' });
              }
            }
          }
        }
      }
    }
    
    // Add manually registered entities
    for (const entry of entityRegistry.entries) {
      if (!list.some(e => e.tag === entry.tag)) {
        list.push({
          tag: entry.tag,
          label: `${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}: ${entry.tag} (at ${entry.x},${entry.y})`,
          type: entry.type
        });
      }
    }
    
    return list;
  }, [tiles, entityRegistry, width, height]);
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');
  const [newFlagInitial, setNewFlagInitial] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarDesc, setNewVarDesc] = useState('');
  const [newVarInitial, setNewVarInitial] = useState<number>(0);

  const [registryTab, setRegistryTab] = useState<'flags' | 'vars' | 'quests'>('flags');
  const [newQuestId, setNewQuestId] = useState('');
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestDesc, setNewQuestDesc] = useState('');
  const [newQuestTaskText, setNewQuestTaskText] = useState<{ [questId: string]: string }>({});
  const [newQuestTaskId, setNewQuestTaskId] = useState<{ [questId: string]: string }>({});

  const addQuestDef = useCallback(() => {
    const id = newQuestId.trim();
    const title = newQuestTitle.trim();
    if (!id || !title) return;
    if (questRegistry.quests?.some(q => q.id === id)) {
      setStatusMsg(`Quest "${id}" already exists`);
      return;
    }
    setQuestRegistry(prev => ({
      ...prev,
      quests: [
        ...(prev.quests || []),
        {
          id,
          title,
          description: newQuestDesc.trim(),
          tasks: [],
        }
      ]
    }));
    setNewQuestId('');
    setNewQuestTitle('');
    setNewQuestDesc('');
  }, [newQuestId, newQuestTitle, newQuestDesc, questRegistry]);

  const removeQuestDef = useCallback((id: string) => {
    setQuestRegistry(prev => ({
      ...prev,
      quests: (prev.quests || []).filter(q => q.id !== id)
    }));
  }, []);

  const updateQuestDef = useCallback((id: string, fields: Partial<{ title: string; description: string }>) => {
    setQuestRegistry(prev => ({
      ...prev,
      quests: (prev.quests || []).map(q => q.id === id ? { ...q, ...fields } : q)
    }));
  }, []);

  const addTaskToQuest = useCallback((questId: string) => {
    const text = (newQuestTaskText[questId] || '').trim();
    const id = (newQuestTaskId[questId] || '').trim();
    if (!text || !id) return;

    setQuestRegistry(prev => {
      const quests = (prev.quests || []).map(q => {
        if (q.id === questId) {
          if (q.tasks.some(t => t.id === id)) {
            setStatusMsg(`Task ID "${id}" already exists in this quest`);
            return q;
          }
          return {
            ...q,
            tasks: [...q.tasks, { id, text, complete: [] }]
          };
        }
        return q;
      });
      return { ...prev, quests };
    });

    setNewQuestTaskText(prev => ({ ...prev, [questId]: '' }));
    setNewQuestTaskId(prev => ({ ...prev, [questId]: '' }));
  }, [newQuestTaskText, newQuestTaskId]);

  const removeTaskFromQuest = useCallback((questId: string, taskId: string) => {
    setQuestRegistry(prev => ({
      ...prev,
      quests: (prev.quests || []).map(q => {
        if (q.id === questId) {
          return {
            ...q,
            tasks: q.tasks.filter(t => t.id !== taskId)
          };
        }
        return q;
      })
    }));
  }, []);

  const updateTaskConditions = useCallback((questId: string, taskId: string, conditions: any[]) => {
    setQuestRegistry(prev => ({
      ...prev,
      quests: (prev.quests || []).map(q => {
        if (q.id === questId) {
          return {
            ...q,
            tasks: q.tasks.map(t => t.id === taskId ? { ...t, complete: conditions } : t)
          };
        }
        return q;
      })
    }));
  }, []);

  const updateQuestRewards = useCallback((questId: string, rewards: any[]) => {
    setQuestRegistry(prev => ({
      ...prev,
      quests: (prev.quests || []).map(q => q.id === questId ? { ...q, onComplete: rewards } : q)
    }));
  }, []);

  const addFlagDef = useCallback(() => {
    const name = newFlagName.trim();
    if (!name) return;
    if (questRegistry.flags.some(f => f.name === name)) { setStatusMsg(`Flag "${name}" already exists`); return; }
    setQuestRegistry(prev => ({ ...prev, flags: [...prev.flags, { name, ...(newFlagDesc.trim() ? { description: newFlagDesc.trim() } : {}), ...(newFlagInitial ? { initialValue: true } : {}) }] }));
    setNewFlagName('');
    setNewFlagDesc('');
    setNewFlagInitial(false);
  }, [newFlagName, newFlagDesc, newFlagInitial, questRegistry]);

  const removeFlagDef = useCallback((name: string) => {
    setQuestRegistry(prev => ({ ...prev, flags: prev.flags.filter(f => f.name !== name) }));
  }, []);

  const updateFlagDef = useCallback((name: string, fields: Partial<{ description: string; initialValue: boolean }>) => {
    setQuestRegistry(prev => ({
      ...prev,
      flags: prev.flags.map(f => f.name === name ? { ...f, ...fields } : f)
    }));
  }, []);

  const addVarDef = useCallback(() => {
    const name = newVarName.trim();
    if (!name) return;
    if (questRegistry.vars.some(v => v.name === name)) { setStatusMsg(`Variable "${name}" already exists`); return; }
    setQuestRegistry(prev => ({ ...prev, vars: [...prev.vars, { name, ...(newVarDesc.trim() ? { description: newVarDesc.trim() } : {}), ...(newVarInitial !== 0 ? { initialValue: newVarInitial } : {}) }] }));
    setNewVarName('');
    setNewVarDesc('');
    setNewVarInitial(0);
  }, [newVarName, newVarDesc, newVarInitial, questRegistry]);

  const removeVarDef = useCallback((name: string) => {
    setQuestRegistry(prev => ({ ...prev, vars: prev.vars.filter(v => v.name !== name) }));
  }, []);

  const updateVarDef = useCallback((name: string, fields: Partial<{ description: string; initialValue: number }>) => {
    setQuestRegistry(prev => ({
      ...prev,
      vars: prev.vars.map(v => v.name === name ? { ...v, ...fields } : v)
    }));
  }, []);

  const openExistingEvent = useCallback((id: string) => {
    const ev = allEditorEvents.find(e => e.id === id);
    if (ev) {
      setEventEditorDraft(ev);
      setEventEditorOriginalId(id);
    }
  }, [allEditorEvents]);

  const createNewEvent = useCallback(() => {
    const name = eventEditorNewName.trim();
    if (!name) { setStatusMsg('Enter a name for the new event'); return; }
    if (allEditorEvents.some(e => e.id === name)) { setStatusMsg(`An event named "${name}" already exists — pick Open existing instead`); return; }
    setEventEditorDraft(emptyEvent(name));
    setEventEditorOriginalId(null);
    setEventEditorNewName('');
  }, [eventEditorNewName, allEditorEvents]);

  // Strip any legacy entries for `id` out of all three storage arrays.
  const removeEventFromStorage = useCallback((id: string) => {
    setTiles(prev => {
      pushUndo(prev, buildingsRef.current);
      return prev.map(row => row.map(t => (t.eventTrigger?.id === id ? { ...t, eventTrigger: undefined } : t)));
    });
    setChainDialogEvents(prev => prev.filter(e => e.id !== id));
    setBubbleEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const saveEventDraft = useCallback(() => {
    const draft = eventEditorDraft;
    if (!draft) return;
    const id = draft.id.trim();
    if (!id) { setStatusMsg('Enter an event name first'); return; }
    // Renaming onto another existing event's id would silently clobber it.
    if (allEditorEvents.some(e => e.id === id && e.id !== eventEditorOriginalId)) {
      setStatusMsg(`An event named "${id}" already exists — choose a different name`);
      return;
    }
    const normalized: GameEvent = { ...draft, id };

    // Renamed (id changed from what this draft was opened under): remove the
    // OLD id's entries first, or it's left behind as a stale duplicate.
    if (eventEditorOriginalId && eventEditorOriginalId !== id) {
      removeEventFromStorage(eventEditorOriginalId);
      setAllEditorEvents(prev => prev.filter(e => e.id !== eventEditorOriginalId));
    }

    removeEventFromStorage(id);
    const { eventTriggers, bubbleEvents: dcBubbleEvents } = downconvertEvents([normalized]);

    for (const evt of eventTriggers) {
      if (evt.chainOnly) {
        setChainDialogEvents(prev => [...prev.filter(e => e.id !== id), { id: evt.id, steps: evt.steps, oneShot: evt.oneShot, ...(evt.grants ? { grants: evt.grants } : {}), ...(evt.next ? { next: evt.next } : {}) }]);
      } else if (evt.x !== undefined && evt.y !== undefined) {
        setTiles(prev => {
          const next = prev.map(row => row.map(t => ({ ...t })));
          if (next[evt.y]?.[evt.x]) {
            next[evt.y][evt.x].eventTrigger = { id: evt.id, steps: evt.steps, oneShot: evt.oneShot, ...(evt.grants ? { grants: evt.grants } : {}), ...(evt.next ? { next: evt.next } : {}) };
          }
          return next;
        });
      }
    }
    for (const evt of dcBubbleEvents) {
      setBubbleEvents(prev => [...prev.filter(e => e.id !== id), evt]);
    }

    // Lossless primary write — the actual authored event, unaffected by
    // downconvertEvents' one-of-{dialog,speech} limitation above.
    setAllEditorEvents(prev => [...prev.filter(e => e.id !== id), normalized]);

    setStatusMsg(`Saved event "${id}"`);
    setEventEditorDraft(null);
    setEventEditorOriginalId(null);
  }, [eventEditorDraft, eventEditorOriginalId, allEditorEvents, removeEventFromStorage]);

  const deleteEventDraft = useCallback(() => {
    const draft = eventEditorDraft;
    if (!draft) return;
    // Delete by the id it was opened under, so mid-edit renaming the id field
    // doesn't leave the original entry behind un-deleted.
    const targetId = eventEditorOriginalId ?? draft.id;
    removeEventFromStorage(targetId);
    setAllEditorEvents(prev => prev.filter(e => e.id !== targetId));
    setStatusMsg(`Deleted event "${targetId}"`);
    setEventEditorDraft(null);
    setEventEditorOriginalId(null);
  }, [eventEditorDraft, eventEditorOriginalId, removeEventFromStorage]);

  // Map-click routing while picking a placement/step coordinate for the open draft.
  const handleEventEditorPick = useCallback((x: number, y: number) => {
    setEventEditorDraft(prev => {
      if (!prev || !eventEditorPick) return prev;
      if (eventEditorPick.mode === 'placement') {
        return { ...prev, placement: { ...prev.placement, x, y } };
      }
      const idx = eventEditorPick.index;
      const step = prev.steps[idx];
      if (!step) return prev;
      let nextStep;
      if (step.type === 'speech') {
        nextStep = { ...step, anchorX: x, anchorY: y };
      } else if (step.type === 'moveEntity') {
        nextStep = { ...step, targetX: x, targetY: y };
      } else {
        nextStep = { ...step, x, y };
      }
      return { ...prev, steps: prev.steps.map((s, i) => (i === idx ? nextStep : s)) };
    });
    setEventEditorPick(null);
  }, [eventEditorPick]);

  const [transitionTargetType, setTransitionTargetType] = useState<'scenario' | 'generator' | 'tutorial_end'>('scenario');
  const [transitionTargetId, setTransitionTargetId] = useState('');
  const [transitionLevel, setTransitionLevel] = useState(1);
  const [transitionTargetX, setTransitionTargetX] = useState<number | ''>('');
  const [transitionTargetY, setTransitionTargetY] = useState<number | ''>('');
  // Authored event fired when the placed "?" help item is clicked in-game.
  const [helpEventId, setHelpEventId] = useState('');
  const [availableScenarios, setAvailableScenarios] = useState<{ name: string; width: number; height: number; fileName?: string }[]>([]);
  const [exitImage, setExitImage] = useState<HTMLImageElement | null>(null);
  // Full entity-art catalog (every image file in images/entities/), read live
  // from disk via Electron IPC so any new art is pickable with no code change.
  // Falls back to the curated NPC_ICON_OPTIONS list when not running in Electron.
  const [entityImageKeys, setEntityImageKeys] = useState<string[] | null>(null);

  useEffect(() => {
    ScenarioStorage.list().then(list => setAvailableScenarios(list as any[])).catch(console.warn);
    const img = new Image();
    img.src = '/images/items/exit.png';
    img.onload = () => setExitImage(img);

    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.listEntityImages) {
      electronAPI.listEntityImages().then((keys: string[]) => {
        if (Array.isArray(keys) && keys.length > 0) setEntityImageKeys(keys.sort((a, b) => a.localeCompare(b)));
      }).catch(console.warn);
    }
  }, []);

  // Turns a filename key like "bombdisposalzombie" into a readable label.
  const iconKeyToLabel = (key: string): string => {
    const curated = NPC_ICON_OPTIONS.find(o => o.key === key);
    if (curated) return curated.label;
    return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const npcIconChoices = useMemo(() => {
    if (entityImageKeys && entityImageKeys.length > 0) {
      return entityImageKeys.map(key => ({ key, label: iconKeyToLabel(key) }));
    }
    return NPC_ICON_OPTIONS;
  }, [entityImageKeys]);

  // Build categorized item catalog from ItemDefs
  const allItems = useMemo(() => {
    // Editor-only display names for items whose in-game name is too terse to
    // find in the alphabetical palette (e.g. the help item's name is literally
    // "?", which sorts above everything and reads as nothing). The underlying
    // def name is unchanged — this only relabels the palette entry.
    const EDITOR_LABELS: Record<string, string> = {
      'placeable.help': 'Help Trigger (?)',
    };
    return Object.entries(ItemDefs as Record<string, any>)
      .map(([id, def]) => ({
        id,
        name: EDITOR_LABELS[id] || def.name || id,
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
  const [showLootModal, setShowLootModal] = useState(false);
  const [lootAmount, setLootAmount] = useState<'lots' | 'some' | 'little'>('some');
  const [mapSeed, setMapSeed] = useState<number | ''>('');
  const [mapLowSpots, setMapLowSpots] = useState<{ x: number; y: number }[]>([]);
  const [lootModalSeed, setLootModalSeed] = useState<string>('');
  const [isGeneratingLoot, setIsGeneratingLoot] = useState(false);
  const [showZombieModal, setShowZombieModal] = useState(false);
  const [zombieDensity, setZombieDensity] = useState<'sparse' | 'normal' | 'dense'>('normal');
  const [zombieModalSeed, setZombieModalSeed] = useState<string>('');
  const [isGeneratingZombies, setIsGeneratingZombies] = useState(false);
  const [inspectTile, setInspectTile] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null);
  const [editStairsItem, setEditStairsItem] = useState<{ x: number; y: number; itemIndex: number } | null>(null);
  const [editStairsId, setEditStairsId] = useState('');
  const [editStairsX, setEditStairsX] = useState<number | ''>('');
  const [editStairsY, setEditStairsY] = useState<number | ''>('');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const requestConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ message, onConfirm });
  };


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
    if (isNaN(newW) || newW <= 0 || isNaN(newH) || newH <= 0) return;
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
            const ent: { type: string; subtype?: string; hp?: number; noLoot?: boolean; deaf?: boolean; typeId?: string; name?: string; isHostile?: boolean; iconId?: string; aiDisabled?: boolean } = { type: selectedEntity };
            if (selectedEntity === 'zombie') {
              ent.subtype = zombieSubtype;
              if (zombieHp !== '') ent.hp = zombieHp as number;
              if (zombieNoLoot) ent.noLoot = true;
              if (zombieDeaf) ent.deaf = true;
            } else if (selectedEntity === 'npc') {
              ent.typeId = npcTypeId;
              if (npcName.trim()) ent.name = npcName.trim();
              if (npcIsHostile) ent.isHostile = true;
              if (npcIconId && npcIconId !== 'npc') ent.iconId = npcIconId;
              if (npcAiDisabled) ent.aiDisabled = true;
            }
            tile.entities.push(ent);
          }
          break;
        case 'item':
          if (selectedItem) {
            const itemEntry: { defId: string; ammoCount?: number; condition?: number; batteryCharges?: number; gunAmmoCount?: number; gunMagDefId?: string; gunAttachments?: Record<string, string>; transitionTargetId?: string; transitionTargetX?: number; transitionTargetY?: number; eventId?: string } = { defId: selectedItem };
            if (waterFill !== '') itemEntry.ammoCount = waterFill as number;
            if (conditionVal !== '') itemEntry.condition = conditionVal as number;
            if (batteryCharges !== '') itemEntry.batteryCharges = batteryCharges as number;
            if (gunAmmoCount !== '') itemEntry.gunAmmoCount = gunAmmoCount as number;
            
            if (selectedItem === 'placeable.stairs_down' || selectedItem === 'placeable.stairs_up') {
              if (transitionTargetId) itemEntry.transitionTargetId = transitionTargetId;
              if (transitionTargetX !== '') itemEntry.transitionTargetX = transitionTargetX as number;
              if (transitionTargetY !== '') itemEntry.transitionTargetY = transitionTargetY as number;
            }
            if (selectedItem === 'placeable.help' && helpEventId) itemEntry.eventId = helpEventId;
            if (gunMagDefId) itemEntry.gunMagDefId = gunMagDefId;
            if (Object.keys(gunAttachments).some(k => gunAttachments[k])) itemEntry.gunAttachments = { ...gunAttachments };
            tile.items.push(itemEntry);
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

      // Check if we need to remove any empty buildings (buildings that have no floor tiles and no edge walls/doors/windows)
      if (buildingsRef.current.length > 0) {
        const remainingBuildings = buildingsRef.current.filter(b => {
          for (let ty = b.y; ty < b.y + b.height; ty++) {
            for (let tx = b.x; tx < b.x + b.width; tx++) {
              if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
                const t = next[ty][tx];
                if (t.terrain === 'floor') return true;
                const hasEdge = (['n', 'e', 's', 'w'] as Edge[]).some(e => {
                  const edge = t.edgeWalls[e];
                  return edge.wall || edge.door || edge.window;
                });
                if (hasEdge) return true;
              }
            }
          }
          return false;
        });

        if (remainingBuildings.length !== buildingsRef.current.length) {
          setBuildings(remainingBuildings);
        }
      }

      return next;
    });
  }, [tool, selectedTerrain, selectedEdge, edgeLocked, selectedEntity, zombieSubtype, zombieHp, zombieNoLoot, zombieDeaf, npcTypeId, npcName, npcIsHostile, npcIconId, npcAiDisabled, selectedItem, waterFill, conditionVal, batteryCharges, gunAmmoCount, gunMagDefId, gunAttachments, transitionTargetType, transitionTargetId, transitionLevel, helpEventId, selectedPlaceIconSubtype, brushSize, width, height]);

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
    if (width <= 0 || height <= 0) return;
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
    if (width <= 0 || height <= 0) return;
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

    const mapTotalW = width * CELL * zoom;
    const mapTotalH = height * CELL * zoom;

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
  }, [width, height, zoom]);

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

    const mapTotalW = width * CELL * zoom;
    const mapTotalH = height * CELL * zoom;

    const pctX = clickX / canvas.width;
    const pctY = clickY / canvas.height;

    container.scrollLeft = pctX * mapTotalW - container.clientWidth / 2;
    container.scrollTop = pctY * mapTotalH - container.clientHeight / 2;
    updateMinimapViewport();
  }, [width, height, zoom, updateMinimapViewport]);

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
    if (eventEditorPick) {
      handleEventEditorPick(x, y);
    } else if (entityPickMode) {
      setNewEntityX(x);
      setNewEntityY(y);
      setEntityPickMode(false);
      setShowEntityRegistryModal(true);
    } else if (tool === 'building_rect') {
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
    const insideBuilding = buildings.some(b =>
      x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height
    );
    const hasContent = tile.entities.length > 0 || tile.items.length > 0 || !!tile.eventTrigger || !!tile.mapTransition || !!tile.placeIcon || hasDoorOrWindow || insideBuilding;
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
      alwaysDark: alwaysDark || undefined,
      seed: mapSeed !== '' ? Number(mapSeed) : undefined,
      lowSpots: mapLowSpots,
      bubbleEvents,
      chainDialogEvents,
      events: allEditorEvents,
      questRegistry,
      entityRegistry,
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
    const editorState = {
      name: scenarioName,
      width,
      height,
      tiles,
      buildings,
      noAutosave: noAutosave || undefined,
      alwaysDark: alwaysDark || undefined,
      seed: mapSeed !== '' ? Number(mapSeed) : undefined,
      lowSpots: mapLowSpots,
      bubbleEvents,
      chainDialogEvents,
      events: allEditorEvents,
      questRegistry,
      entityRegistry,
    };
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
        setAlwaysDark(editor.alwaysDark ?? false);
        setMapSeed(editor.seed !== undefined ? editor.seed : '');
        setMapLowSpots(editor.lowSpots || []);
        setBubbleEvents((editor as any).bubbleEvents || []);
        setChainDialogEvents((editor as any).chainDialogEvents || []);
        setAllEditorEvents((editor as any).events || []);
        setQuestRegistry((editor as any).questRegistry || emptyQuestRegistry());
        setEntityRegistry((editor as any).entityRegistry || emptyEntityRegistry());
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
    setAlwaysDark(editor.alwaysDark ?? false);
    setMapSeed(editor.seed !== undefined ? editor.seed : '');
    setMapLowSpots(editor.lowSpots || []);
    setBubbleEvents((editor as any).bubbleEvents || data.bubbleEvents || []);
    setChainDialogEvents((editor as any).chainDialogEvents || data.chainDialogEvents || []);
    setAllEditorEvents((editor as any).events || data.events || []);
    setQuestRegistry((editor as any).questRegistry || data.questRegistry || emptyQuestRegistry());
    setEntityRegistry((editor as any).entityRegistry || data.entityRegistry || emptyEntityRegistry());
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
    setShowGenPicker(false);
    requestConfirm('Generate template? This will replace the current map layout!', async () => {
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
    });
  };

  const mapEcsItemToEditorItem = (it: any) => {
    const entry: any = { defId: it.defId || it.id };
    if (it.ammoCount !== undefined) entry.ammoCount = it.ammoCount;
    if (it.transitionTargetId !== undefined) entry.transitionTargetId = it.transitionTargetId;
    if (it.transitionTargetX !== undefined) entry.transitionTargetX = it.transitionTargetX;
    if (it.transitionTargetY !== undefined) entry.transitionTargetY = it.transitionTargetY;
    if (it.eventId !== undefined) entry.eventId = it.eventId;
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
  };

  const handleGenerateLoot = async () => {
    setIsGeneratingLoot(true);
    setStatusMsg('Running loot generator...');
    try {
      let finalSeed = parseInt(lootModalSeed, 10);
      if (isNaN(finalSeed)) {
        finalSeed = (Math.random() * 0xFFFFFFFF) >>> 0;
      }

      setMapSeed(finalSeed);
      setLootModalSeed(finalSeed.toString());

      const { gameRandom } = await import('@/game/utils/SeededRandom');
      gameRandom.seed(finalSeed);

      const scenario: ScenarioData = {
        name: scenarioName,
        width, height, tiles, buildings,
        playerSpawn: getPlayerSpawn(),
        noAutosave: noAutosave || undefined,
        seed: finalSeed,
      };
      const exported = exportScenario(scenario);

      const { TemplateMapGenerator } = await import('@/game/map/TemplateMapGenerator');
      const { GameMap } = await import('@/game/map/GameMap');
      const tmg = new TemplateMapGenerator();
      const mapData = await tmg.generateFromScenario(exported);
      const gameMap = new GameMap(mapData.width, mapData.height);
      await tmg.applyToGameMap(gameMap, mapData);

      const { LootGenerator } = await import('@/game/map/LootGenerator');
      const gen = new LootGenerator();
      
      let mapNumberForLoot = 5;
      if (lootAmount === 'lots') mapNumberForLoot = 1;
      else if (lootAmount === 'little') mapNumberForLoot = 9;

      gen.spawnLoot(gameMap, mapNumberForLoot);

      const newTiles = tiles.map((row, y) =>
        row.map((t, x) => {
          const rawItems = gameMap.getItemsOnTile(x, y);
          if (rawItems.length === 0) return t;

          const generatedEditorItems = rawItems.map((entity: any) => {
            const json = typeof entity.toJSON === 'function' ? entity.toJSON() : entity;
            return mapEcsItemToEditorItem(json);
          }).filter((it: any) => it.defId);

          return {
            ...t,
            items: [...t.items, ...generatedEditorItems]
          };
        })
      );

      pushUndo(tiles, buildings);
      setTiles(newTiles);
      setMapLowSpots(gameMap.lowSpots || []);
      setStatusMsg(`Loot generated using seed ${finalSeed}! (Amount level: ${lootAmount})`);
      setShowLootModal(false);
    } catch (err: any) {
      console.error('[GenerateLoot] Failed:', err);
      setStatusMsg(`Loot generation failed: ${err.message}`);
    } finally {
      setIsGeneratingLoot(false);
    }
  };

  const handleGenerateZombies = async () => {
    setIsGeneratingZombies(true);
    setStatusMsg('Running zombie spawner...');
    try {
      let finalSeed = parseInt(zombieModalSeed, 10);
      if (isNaN(finalSeed)) {
        finalSeed = (Math.random() * 0xFFFFFFFF) >>> 0;
      }

      setMapSeed(finalSeed);
      setZombieModalSeed(finalSeed.toString());

      const { gameRandom } = await import('@/game/utils/SeededRandom');
      gameRandom.seed(finalSeed);

      const scenario: ScenarioData = {
        name: scenarioName,
        width, height, tiles, buildings,
        playerSpawn: getPlayerSpawn(),
        noAutosave: noAutosave || undefined,
        seed: finalSeed,
      };
      const exported = exportScenario(scenario);

      const { TemplateMapGenerator } = await import('@/game/map/TemplateMapGenerator');
      const { GameMap } = await import('@/game/map/GameMap');
      const tmg = new TemplateMapGenerator();
      const mapData = await tmg.generateFromScenario(exported);
      const gameMap = new GameMap(mapData.width, mapData.height);
      await tmg.applyToGameMap(gameMap, mapData);

      // Density selection: 'sparse' -> map 1, 'normal' -> map 3, 'dense' -> map 6
      let mapNumberForZombies = 3;
      if (zombieDensity === 'sparse') mapNumberForZombies = 1;
      else if (zombieDensity === 'dense') mapNumberForZombies = 6;

      gameMap.mapNumber = mapNumberForZombies;

      const playerPos = getPlayerSpawn() || { x: Math.floor(width / 2), y: Math.floor(height / 2) };

      const { ZombieSpawner } = await import('@/game/utils/ZombieSpawner');
      const { getProgressionForMap, BASELINE_MAP_AREA } = await import('@/game/config/ProgressionConfig');
      const progression = getProgressionForMap(mapNumberForZombies);
      const areaMultiplier = (width * height) / BASELINE_MAP_AREA;
      const scale = (v: number) => Math.floor(v * areaMultiplier);
      const scaleRange = (r: { min: number; max: number }) => ({ min: scale(r.min), max: scale(r.max) });

      let randomSwatCount = 0;
      let randomFirefighterCount = 0;
      let soldierCount = 0;
      if (progression.randomSpecialized || mapNumberForZombies > 3) {
        const { swatChance, firefighterChance, soldierChance } = progression.randomSpecialized || {};
        if (gameRandom.next() < (swatChance || 0.15)) randomSwatCount = gameRandom.nextInt(0, 1) + 1;
        if (gameRandom.next() < (firefighterChance || 0.15)) randomFirefighterCount = gameRandom.nextInt(0, 1) + 1;
        if (gameRandom.next() < (soldierChance || 0.10)) soldierCount = 1;
      }

      const options = {
        basicCount: scale(progression.basicCount),
        crawlerRange: scaleRange(progression.crawlerRange),
        runnerCount: scale(progression.runnerCount),
        acidRange: scaleRange(progression.acidRange),
        fatRange: scaleRange(progression.fatRange),
        randomSwatCount: scale(randomSwatCount),
        randomFirefighterCount: scale(randomFirefighterCount),
        soldierCount: scale(soldierCount),
        spitterCount: scale(progression.spitterCount || 0),
        maxTotal: scale(progression.maxTotal),
        minDistance: 5
      };

      const spawnedCount = ZombieSpawner.spawnZombies(gameMap, playerPos, options);

      const newTiles = tiles.map((row, y) =>
        row.map((t, x) => {
          const tile = gameMap.getTile(x, y);
          if (!tile || tile.contents.length === 0) return t;

          const spawnedZombies = tile.contents
            .filter((entity: any) => entity.type === 'zombie')
            .map((entity: any) => ({
              type: 'zombie',
              subtype: entity.subtype || 'basic',
              hp: entity.hp || undefined,
              noLoot: entity.noLoot || undefined,
              deaf: entity.deaf || undefined
            }));

          if (spawnedZombies.length === 0) return t;

          return {
            ...t,
            entities: [...t.entities, ...spawnedZombies]
          };
        })
      );

      pushUndo(tiles, buildings);
      setTiles(newTiles);
      setStatusMsg(`Spawned ${spawnedCount} zombies using seed ${finalSeed}! (Density level: ${zombieDensity})`);
      setShowZombieModal(false);
    } catch (err: any) {
      console.error('[GenerateZombies] Failed:', err);
      setStatusMsg(`Zombie generation failed: ${err.message}`);
    } finally {
      setIsGeneratingZombies(false);
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
    requestConfirm('Clear entire map?', () => {
      setTiles(prev => { pushUndo(prev, buildingsRef.current); return createEmptyGrid(width, height); });
      setBuildings([]);
      setStatusMsg('Map cleared');
    });
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888', cursor: 'pointer', marginTop: 2 }}>
            <input type="checkbox" checked={alwaysDark} onChange={e => setAlwaysDark(e.target.checked)} />
            Always dark (indoors/underground)
          </label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={handleExport} style={btnStyle('#2a7a2a')}>Publish</button>
            <button onClick={handleSaveEditor} style={btnStyle('#555')}>Save</button>
            <button onClick={handleOpenLoadPicker} style={btnStyle('#555')}>Load</button>
            <button onClick={() => setShowGenPicker(true)} style={btnStyle('#6a4ab8')}>⚡ Generate</button>
            <button onClick={() => {
              setLootModalSeed(mapSeed !== '' ? mapSeed.toString() : Math.floor(Math.random() * 1000000).toString());
              setShowLootModal(true);
            }} style={btnStyle('#2b9a7a')}>🎲 Loot Gen</button>
            <button onClick={() => {
              setZombieModalSeed(mapSeed !== '' ? mapSeed.toString() : Math.floor(Math.random() * 1000000).toString());
              setShowZombieModal(true);
            }} style={btnStyle('#7a3a8a')}>🧟 Zombie Spawn</button>
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

        {/* Zoom */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
          <label style={{ fontSize: 11, color: '#888' }}>Zoom</label>
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} style={{ ...btnStyle('#555'), padding: '2px 8px', fontSize: 11, margin: 0 }}>Zoom Out</button>
          <span style={{ fontSize: 11, minWidth: 36, textAlign: 'center', fontWeight: 'bold' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3.0, z + 0.25))} style={{ ...btnStyle('#555'), padding: '2px 8px', fontSize: 11, margin: 0 }}>Zoom In</button>
          <button onClick={() => setZoom(1.0)} style={{ ...btnStyle('#444'), padding: '2px 8px', fontSize: 11, margin: 0 }}>Reset</button>
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
          {toolButton('event_editor', 'Event')}
          {toolButton('map_transition', 'Transition')}
          {toolButton('eraser', 'Eraser')}
        </div>

        <button onClick={() => setShowQuestRegistryModal(true)} style={{ ...btnStyle('#333'), width: '100%' }}>
          Switches &amp; Variables ({questRegistry.flags.length + questRegistry.vars.length})
        </button>
        <button onClick={() => setShowEntityRegistryModal(true)} style={{ ...btnStyle('#333'), width: '100%', marginTop: 4 }}>
          Map Entities ({entityRegistry.entries.length})
        </button>

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

            {selectedEntity === 'npc' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #444', paddingTop: 6 }}>
                <label style={{ fontSize: 11, color: '#888' }}>NPC Type</label>
                <select
                  value={npcTypeId}
                  onChange={e => setNpcTypeId(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  {NPC_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <label style={{ fontSize: 11, color: '#888' }}>Name (optional)</label>
                <input
                  value={npcName}
                  onChange={e => setNpcName(e.target.value)}
                  placeholder="e.g. Doc"
                  style={{ ...inputStyle, width: '100%' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={npcIsHostile} onChange={e => setNpcIsHostile(e.target.checked)} />
                  Hostile
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={npcAiDisabled} onChange={e => setNpcAiDisabled(e.target.checked)} />
                  Scripted (stays put — no wandering/fleeing AI until an event moves it)
                </label>
                <label style={{ fontSize: 11, color: '#888' }}>Icon</label>
                <select
                  value={npcIconId}
                  onChange={e => setNpcIconId(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  {npcIconChoices.map(o => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
                <p style={{ fontSize: 10, color: '#666', margin: 0 }}>
                  {entityImageKeys
                    ? `Any image in the entities folder (${entityImageKeys.length} found).`
                    : 'Icon reuses art already in the game — pick anything that fits the character.'}
                </p>
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
            
            {(selectedItem === 'placeable.stairs_down' || selectedItem === 'placeable.stairs_up') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #444', paddingTop: 6 }}>
                <label style={{ fontSize: 11, color: '#7bb8ff', fontWeight: 'bold' }}>Stairs Transition Target</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <select
                    value={transitionTargetId}
                    onChange={e => setTransitionTargetId(e.target.value)}
                    style={{ ...inputStyle, width: '100%' }}
                  >
                    <option value="">— Select map —</option>
                    {availableScenarios.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#888' }}>Target X</label>
                    <input type="number" min={0} value={transitionTargetX} onChange={e => setTransitionTargetX(e.target.value === '' ? '' : Number(e.target.value))} style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#888' }}>Target Y</label>
                    <input type="number" min={0} value={transitionTargetY} onChange={e => setTransitionTargetY(e.target.value === '' ? '' : Number(e.target.value))} style={{ ...inputStyle, width: '100%' }} />
                  </div>
                </div>
              </div>
            )}

            {selectedItem === 'placeable.help' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #444', paddingTop: 6 }}>
                <label style={{ fontSize: 11, color: '#7bb8ff', fontWeight: 'bold' }}>Help Item Event</label>
                <div style={{ fontSize: 10, color: '#888' }}>
                  Fired when the player clicks this "?" item in their ground container.
                  Author the event (dialog text / video) in the Event tool first — use a
                  chain-only event so it doesn't auto-fire on step.
                </div>
                <select
                  value={helpEventId}
                  onChange={e => setHelpEventId(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  <option value="">— Select event —</option>
                  {allEditorEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.id}</option>
                  ))}
                </select>
                {helpEventId && !allEditorEvents.some(ev => ev.id === helpEventId) && (
                  <div style={{ fontSize: 10, color: '#e0a030' }}>
                    ⚠ "{helpEventId}" isn't in this map's events — it won't fire until an event with that id exists.
                  </div>
                )}
              </div>
            )}

          </div>
        )}
        {tool === 'event_editor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, color: '#888' }}>New event name</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={eventEditorNewName} onChange={e => setEventEditorNewName(e.target.value)} placeholder="e.g. guard_intro" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={createNewEvent} style={btnStyle('#2a7a2a')}>Create</button>
            </div>

            {allEditorEvents.length > 0 && (
              <div style={{ borderTop: '1px solid #444', paddingTop: 6 }}>
                <label style={{ fontSize: 11, color: '#888' }}>Open existing ({allEditorEvents.length})</label>
                {allEditorEvents.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#161616', border: '1px solid #333', borderRadius: 3, padding: 6, marginTop: 4, fontSize: 12 }}>
                    <div>
                      <div style={{ color: '#e0b060', fontWeight: 'bold' }}>{ev.id}</div>
                      <div style={{ color: '#888', fontSize: 10 }}>
                        {ev.placement.kind}{ev.placement.x !== undefined ? ` @ (${ev.placement.x},${ev.placement.y})` : ''} · {ev.steps.length} step{ev.steps.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button onClick={() => openExistingEvent(ev.id)} style={{ ...btnStyle('#333'), fontSize: 11 }}>Open</button>
                  </div>
                ))}
              </div>
            )}

            {eventEditorPick && (
              <div style={{ borderTop: '1px solid #444', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 11, color: '#e0a020', margin: 0 }}>Click a tile on the map to set the location…</p>
                <button onClick={() => setEventEditorPick(null)} style={btnStyle('#555')}>Cancel picking</button>
              </div>
            )}
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
              <div>Entities: {tiles[hoverCell.y][hoverCell.x].entities.map(e => {
                if (e.type === 'npc') return `npc(${e.name || e.typeId || 'survivor'})`;
                return e.subtype ? `${e.type}(${e.subtype})` : e.type;
              }).join(', ')}</div>
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

      {/* ─── Unified Event Window ─── */}
      {eventEditorDraft && !eventEditorPick && (
        <EventWindow
          event={eventEditorDraft}
          onChange={setEventEditorDraft}
          onSave={saveEventDraft}
          onCancel={() => { setEventEditorDraft(null); setEventEditorOriginalId(null); }}
          onDelete={deleteEventDraft}
          onPickPlacement={() => setEventEditorPick({ mode: 'placement' })}
          onPickStepCoord={(index) => setEventEditorPick({ mode: 'step', index })}
          itemOptions={allItems}
          knownEventIds={knownEventIds}
          knownFlags={questRegistry.flags.map(f => f.name)}
          knownVars={questRegistry.vars.map(v => v.name)}
          knownEntities={knownEntities}
          knownQuests={questRegistry.quests || []}
        />
      )}

      {/* ─── Switches & Variables registry modal ─── */}
      {showQuestRegistryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowQuestRegistryModal(false)}>
          <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, width: 620, maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#7bb8ff' }}>Campaign Database</h3>

            {/* Tab header buttons */}
            <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #444', paddingBottom: 8, marginBottom: 12 }}>
              {(['flags', 'vars', 'quests'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRegistryTab(tab)}
                  style={{
                    ...btnStyle(registryTab === tab ? '#7bb8ff' : '#333'),
                    color: registryTab === tab ? '#111' : '#eee',
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                    padding: '4px 10px',
                  }}
                >
                  {tab === 'vars' ? 'variables' : tab}
                </button>
              ))}
            </div>

            {registryTab === 'flags' && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
                  Define boolean switches here (flags that are true or false).
                </p>
                <label style={{ fontSize: 11, color: '#7bb8ff', fontWeight: 'bold' }}>Flags (true/false switches)</label>
                {questRegistry.flags.length === 0 && <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>None yet.</div>}
                {questRegistry.flags.map(f => (
                  <div key={f.name} style={{ display: 'flex', gap: 4, alignItems: 'center', background: '#1a1a1a', border: '1px solid #333', borderRadius: 3, padding: '4px 8px', marginTop: 4 }}>
                    <div style={{ flex: 1, minWidth: 100, fontSize: 12, color: '#ddd', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>
                      {f.name}
                    </div>
                    <input
                      value={f.description || ''}
                      onChange={e => updateFlagDef(f.name, { description: e.target.value })}
                      placeholder="description (optional)"
                      style={{ ...inputStyle, flex: 2, fontSize: 11, minWidth: 80 }}
                    />
                    <select
                      value={String(!!f.initialValue)}
                      onChange={e => updateFlagDef(f.name, { initialValue: e.target.value === 'true' })}
                      style={{ ...inputStyle, width: 100, fontSize: 11 }}
                    >
                      <option value="false">starts false</option>
                      <option value="true">starts true</option>
                    </select>
                    <button onClick={() => removeFlagDef(f.name)} style={{ fontSize: 10, color: '#c44', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>Remove</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <input value={newFlagName} onChange={e => setNewFlagName(e.target.value)} placeholder="e.g. met_mayor" style={{ ...inputStyle, flex: 1 }} />
                  <input value={newFlagDesc} onChange={e => setNewFlagDesc(e.target.value)} placeholder="description (optional)" style={{ ...inputStyle, flex: 1 }} />
                  <select value={String(newFlagInitial)} onChange={e => setNewFlagInitial(e.target.value === 'true')} style={{ ...inputStyle, width: 90 }}>
                    <option value="false">starts false</option>
                    <option value="true">starts true</option>
                  </select>
                  <button onClick={addFlagDef} style={btnStyle('#2a7a2a')}>Add</button>
                </div>
              </div>
            )}

            {registryTab === 'vars' && (
              <div>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
                  Define numerical variables here (numbers like reputation, kills, or ammo counts).
                </p>
                <label style={{ fontSize: 11, color: '#7bb8ff', fontWeight: 'bold' }}>Variables (numbers)</label>
                {questRegistry.vars.length === 0 && <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>None yet.</div>}
                {questRegistry.vars.map(v => (
                  <div key={v.name} style={{ display: 'flex', gap: 4, alignItems: 'center', background: '#1a1a1a', border: '1px solid #333', borderRadius: 3, padding: '4px 8px', marginTop: 4 }}>
                    <div style={{ flex: 1, minWidth: 100, fontSize: 12, color: '#ddd', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.name}>
                      {v.name}
                    </div>
                    <input
                      value={v.description || ''}
                      onChange={e => updateVarDef(v.name, { description: e.target.value })}
                      placeholder="description (optional)"
                      style={{ ...inputStyle, flex: 2, fontSize: 11, minWidth: 80 }}
                    />
                    <input
                      type="number"
                      value={v.initialValue ?? 0}
                      onChange={e => updateVarDef(v.name, { initialValue: Number(e.target.value) || 0 })}
                      placeholder="starts at"
                      style={{ ...inputStyle, width: 80, fontSize: 11 }}
                    />
                    <button onClick={() => removeVarDef(v.name)} style={{ fontSize: 10, color: '#c44', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>Remove</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <input value={newVarName} onChange={e => setNewVarName(e.target.value)} placeholder="e.g. reputation" style={{ ...inputStyle, flex: 1 }} />
                  <input value={newVarDesc} onChange={e => setNewVarDesc(e.target.value)} placeholder="description (optional)" style={{ ...inputStyle, flex: 1 }} />
                  <input type="number" value={newVarInitial} onChange={e => setNewVarInitial(Number(e.target.value) || 0)} placeholder="starts at" style={{ ...inputStyle, width: 80 }} />
                  <button onClick={addVarDef} style={btnStyle('#2a7a2a')}>Add</button>
                </div>
              </div>
            )}

            {registryTab === 'quests' && (
              <div>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
                  Define campaign quests and their completion tasks.
                </p>
                <label style={{ fontSize: 11, color: '#7bb8ff', fontWeight: 'bold', display: 'block', marginBottom: 8 }}>Quests &amp; Objectives</label>
                
                {(!questRegistry.quests || questRegistry.quests.length === 0) && (
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4, marginBottom: 12 }}>None yet.</div>
                )}
                
                {(questRegistry.quests || []).map(q => (
                  <div key={q.id} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, padding: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, borderBottom: '1px solid #2a2a2a', paddingBottom: 4 }}>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 'bold', color: '#7bb8ff' }}>
                        {q.title} <span style={{ fontSize: 10, color: '#666', fontWeight: 'normal' }}>({q.id})</span>
                      </div>
                      <button onClick={() => removeQuestDef(q.id)} style={{ fontSize: 10, color: '#c44', background: 'none', border: 'none', cursor: 'pointer' }}>Remove Quest</button>
                    </div>

                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: '#666', flexShrink: 0 }}>Description:</span>
                      <input
                        style={{ ...inputStyle, flex: 1, fontSize: 11, padding: '2px 4px', height: 22 }}
                        value={q.description || ''}
                        onChange={e => updateQuestDef(q.id, { description: e.target.value })}
                        placeholder="e.g. Find the key in the locked cabinet and escape"
                      />
                    </div>

                    {/* Tasks section */}
                    <div style={{ paddingLeft: 12, borderLeft: '2px solid #444', marginTop: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 'bold', color: '#888', display: 'block', marginBottom: 4 }}>Tasks / Stages (Evaluated top-to-bottom):</span>
                      {q.tasks.length === 0 && <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>No tasks added yet.</div>}
                      {q.tasks.map((t, idx) => (
                        <div key={t.id || idx} style={{ background: '#222', border: '1px solid #444', borderRadius: 3, padding: 6, marginBottom: 6 }}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 'bold', background: '#333', padding: '1px 4px', borderRadius: 2, color: '#ccc' }}>
                              {idx + 1}
                            </span>
                            <div style={{ flex: 1, fontSize: 11, color: '#eee', fontWeight: 'bold' }}>
                              {t.text} <span style={{ fontSize: 9, color: '#666', fontWeight: 'normal' }}>({t.id})</span>
                            </div>
                            <button onClick={() => removeTaskFromQuest(q.id, t.id)} style={{ fontSize: 9, color: '#c44', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>

                          <div style={{ marginTop: 4 }}>
                            <span style={{ fontSize: 9, color: '#7bb8ff', display: 'block', marginBottom: 2 }}>Auto-Complete Conditions (AND-linked):</span>
                            <ConditionListEditor
                              conds={t.complete || []}
                              onChange={conds => updateTaskConditions(q.id, t.id, conds)}
                              itemOptions={allItems}
                              knownFlags={questRegistry.flags.map(f => f.name)}
                              knownVars={questRegistry.vars.map(v => v.name)}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Add Task Form */}
                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        <input
                          style={{ ...inputStyle, width: 100, fontSize: 11 }}
                          placeholder="task_id"
                          value={newQuestTaskId[q.id] || ''}
                          onChange={e => setNewQuestTaskId(prev => ({ ...prev, [q.id]: e.target.value }))}
                        />
                        <input
                          style={{ ...inputStyle, flex: 1, fontSize: 11 }}
                          placeholder="e.g. Find the rusty key"
                          value={newQuestTaskText[q.id] || ''}
                          onChange={e => setNewQuestTaskText(prev => ({ ...prev, [q.id]: e.target.value }))}
                        />
                        <button onClick={() => addTaskToQuest(q.id)} style={{ ...btnStyle('#2a7a2a'), padding: '4px 8px', fontSize: 11 }}>Add Task</button>
                      </div>
                    </div>

                    {/* On Complete rewards */}
                    <div style={{ paddingLeft: 12, borderLeft: '2px solid #444', marginTop: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 'bold', color: '#888', display: 'block', marginBottom: 4 }}>On Complete <span style={{ fontWeight: 'normal', color: '#666' }}>— runs once, when the last task is done</span>:</span>
                      <QuestRewardEditor
                        rewards={q.onComplete || []}
                        onChange={rewards => updateQuestRewards(q.id, rewards)}
                        itemOptions={allItems}
                        knownFlags={questRegistry.flags.map(f => f.name)}
                        knownVars={questRegistry.vars.map(v => v.name)}
                      />
                    </div>
                  </div>
                ))}

                {/* Add Quest Form */}
                <div style={{ background: '#1a1a1a', border: '1px dotted #555', borderRadius: 4, padding: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 'bold', color: '#7bb8ff', display: 'block', marginBottom: 6 }}>Register New Quest</span>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    <input style={{ ...inputStyle, width: 120 }} placeholder="quest_id" value={newQuestId} onChange={e => setNewQuestId(e.target.value)} />
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Quest Title (e.g. The Escape)" value={newQuestTitle} onChange={e => setNewQuestTitle(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Short description" value={newQuestDesc} onChange={e => setNewQuestDesc(e.target.value)} />
                    <button onClick={addQuestDef} style={btnStyle('#2a7a2a')}>Register</button>
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => setShowQuestRegistryModal(false)} style={{ ...btnStyle('#555'), width: '100%', marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}

      {/* ─── Map Entity Registry modal ─── */}
      {showEntityRegistryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowEntityRegistryModal(false)}>
          <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, width: 580, maxWidth: '95vw', maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#7bb8ff' }}>Map Entities (Manual Registry)</h3>
            <p style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
              Manually register doors, windows, and zombies that you want to reference in events. NPCs with names are automatically registered.
            </p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: '#1a1a1a', padding: 8, border: '1px solid #333', borderRadius: 4, marginBottom: 8 }}>
                <input style={{ ...inputStyle, width: 100 }} placeholder="unique tag" value={newEntityTag} onChange={e => setNewEntityTag(e.target.value)} />
                <select style={inputStyle} value={newEntityType} onChange={e => setNewEntityType(e.target.value as any)}>
                  <option value="door">Door</option>
                  <option value="window">Window</option>
                  <option value="zombie">Zombie</option>
                </select>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#888' }}>Tile:</span>
                  <span style={{ fontSize: 11, color: newEntityX !== '' ? '#9c6' : '#888', minWidth: 40 }}>
                    {newEntityX !== '' ? `(${newEntityX}, ${newEntityY})` : 'not set'}
                  </span>
                  <button onClick={() => { setEntityPickMode(true); setShowEntityRegistryModal(false); }} style={{ ...btnStyle('#333'), padding: '2px 6px', fontSize: 11 }}>Pick</button>
                </div>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="description (optional)" value={newEntityDesc} onChange={e => setNewEntityDesc(e.target.value)} />
                <button onClick={addEntityRegistryEntry} style={btnStyle('#2a7a2a')}>Add</button>
              </div>

              {entityRegistry.entries.length === 0 && <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>No manually registered entities yet.</div>}
              {entityRegistry.entries.map(e => (
                <div key={e.tag} style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#1a1a1a', border: '1px solid #333', borderRadius: 3, padding: '4px 8px', marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 'bold', color: '#ccc', minWidth: 100 }}>{e.tag}</span>
                  <span style={{ fontSize: 11, color: '#888', background: '#333', padding: '1px 5px', borderRadius: 3 }}>{e.type}</span>
                  <span style={{ fontSize: 11, color: '#9c6' }}>({e.x}, {e.y})</span>
                  {e.description && <span style={{ fontSize: 11, color: '#666', fontStyle: 'italic', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</span>}
                  {!e.description && <div style={{ flex: 1 }} />}
                  <button onClick={() => removeEntityRegistryEntry(e.tag)} style={{ fontSize: 10, color: '#c44', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>Remove</button>
                </div>
              ))}
            </div>

            <button onClick={() => setShowEntityRegistryModal(false)} style={{ ...btnStyle('#555'), width: '100%', marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}

      {/* ─── Entity Picking Indicator ─── */}
      {entityPickMode && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', border: '1px solid #7bb8ff', borderRadius: 6, padding: '8px 16px', zIndex: 140, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <span style={{ fontSize: 12, color: '#eee' }}>Click a tile on the map to register it for entity coordinate</span>
          <button onClick={() => { setEntityPickMode(false); setShowEntityRegistryModal(true); }} style={btnStyle('#555')}>Cancel</button>
        </div>
      )}

      {/* ─── Loot generator modal ─── */}
      {showLootModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowLootModal(false)}>
          <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, minWidth: 320, maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#7bb8ff' }}>🎲 Generate Ambient Loot</h3>
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
              This will populate buildings and outdoor areas with random items. Items will be merged with any existing loot on the tiles.
            </p>

            {/* Loot Amount Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>Loot Amount</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'lots', label: 'Lots' },
                  { id: 'some', label: 'Some' },
                  { id: 'little', label: 'A Little' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLootAmount(opt.id as any)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      background: lootAmount === opt.id ? '#4a90d9' : '#333',
                      color: '#eee',
                      border: lootAmount === opt.id ? '2px solid #7bb8ff' : '1px solid #555',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: lootAmount === opt.id ? 'bold' : 'normal',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Seed Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>RNG Seed</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={lootModalSeed}
                  onChange={e => setLootModalSeed(e.target.value.replace(/[^0-9-]/g, ''))}
                  placeholder="Enter number seed"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setLootModalSeed(Math.floor(Math.random() * 10000000).toString())}
                  style={btnStyle('#555')}
                >
                  🎲 Random
                </button>
              </div>
            </div>

            {/* Confirm / Cancel Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleGenerateLoot}
                disabled={isGeneratingLoot}
                style={{ ...btnStyle('#2b9a7a'), flex: 1, padding: '10px' }}
              >
                {isGeneratingLoot ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={() => setShowLootModal(false)}
                disabled={isGeneratingLoot}
                style={{ ...btnStyle('#555'), flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Zombie generator modal ─── */}
      {showZombieModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowZombieModal(false)}>
          <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, minWidth: 320, maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#7bb8ff' }}>🧟 Spawn Ambient Zombies</h3>
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
              This will distribute zombies across walkable tiles. Building-specific spawns (SWAT in police, firefighters in fire stations, etc.) will be automatically applied. Zombies are merged with existing entities.
            </p>

            {/* Density Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>Zombie Density</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'sparse', label: 'Sparse' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'dense', label: 'Dense' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setZombieDensity(opt.id as any)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      background: zombieDensity === opt.id ? '#4a90d9' : '#333',
                      color: '#eee',
                      border: zombieDensity === opt.id ? '2px solid #7bb8ff' : '1px solid #555',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: zombieDensity === opt.id ? 'bold' : 'normal',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Seed Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>RNG Seed</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={zombieModalSeed}
                  onChange={e => setZombieModalSeed(e.target.value.replace(/[^0-9-]/g, ''))}
                  placeholder="Enter number seed"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setZombieModalSeed(Math.floor(Math.random() * 10000000).toString())}
                  style={btnStyle('#555')}
                >
                  🎲 Random
                </button>
              </div>
            </div>

            {/* Confirm / Cancel Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleGenerateZombies}
                disabled={isGeneratingZombies}
                style={{ ...btnStyle('#2b9a7a'), flex: 1, padding: '10px' }}
              >
                {isGeneratingZombies ? 'Spawning...' : 'Spawn'}
              </button>
              <button
                onClick={() => setShowZombieModal(false)}
                disabled={isGeneratingZombies}
                style={{ ...btnStyle('#555'), flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
            </div>
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
          style={{ 
            cursor: 'crosshair', 
            imageRendering: 'pixelated',
            width: width * CELL * zoom,
            height: height * CELL * zoom
          }}
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

        const containingBuildings = buildings.filter(b =>
          tx >= b.x && tx < b.x + b.width && ty >= b.y && ty < b.y + b.height
        );

        const removeBuilding = (b: BuildingMeta) => {
          setTiles(prev => {
            pushUndo(prev, buildingsRef.current);
            return prev.map(r => r.map(c => ({ ...c })));
          });
          setBuildings(prev => prev.filter(item => item !== b));
          setInspectTile(null);
        };

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
          const removedId = t.eventTrigger?.id;
          setTiles(prev => {
            pushUndo(prev, buildingsRef.current);
            const next = prev.map(r => r.map(c => ({ ...c, entities: [...c.entities], items: [...c.items] })));
            delete next[ty][tx].eventTrigger;
            return next;
          });
          // Keep the lossless authored list in sync — removing via this
          // tile-level button must fully delete the event, or it'd linger in
          // "Open existing" (and get re-exported) even though its tile is gone.
          if (removedId) {
            setAllEditorEvents(prev => prev.filter(e => e.id !== removedId));
          }
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
            // Look up the lossless authored event by id (allEditorEvents) rather
            // than reconstructing from tile.eventTrigger alone, which can only
            // ever hold dialog steps and would silently drop any speech steps
            // the same event also has.
            const ev = allEditorEvents.find(e => e.id === t.eventTrigger!.id)
              ?? migrateLegacyEvents({ eventTriggers: [{ x: tx, y: ty, ...t.eventTrigger }] })[0];
            if (ev) {
              setEventEditorDraft(ev);
              setEventEditorOriginalId(ev.id);
              setTool('event_editor');
              setStatusMsg(`Editing event "${ev.id}"`);
            }
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

              {/* Buildings */}
              {containingBuildings.length > 0 && (
                <div style={sectionStyle}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Buildings</div>
                  {containingBuildings.map((b, idx) => (
                    <div key={idx} style={rowStyle}>
                      <span style={{ color: '#ff0' }}>
                        {b.type} ({b.width}×{b.height})
                      </span>
                      <button onClick={() => removeBuilding(b)} style={removeBtnStyle}>Remove Outline</button>
                    </div>
                  ))}
                </div>
              )}

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
                          {ent.type === 'npc' && ent.name ? ` · "${ent.name}"` : ''}
                          {ent.type === 'npc' && ent.typeId ? ` · ${ent.typeId}` : ''}
                          {ent.type === 'npc' && ent.isHostile ? ` · hostile` : ''}
                          {ent.type === 'npc' && ent.iconId ? ` · icon:${ent.iconId}` : ''}
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
                          {(item.defId === 'placeable.stairs_down' || item.defId === 'placeable.stairs_up') && item.transitionTargetId ? ` · ➡ ${item.transitionTargetId} (${item.transitionTargetX ?? '?'},${item.transitionTargetY ?? '?'})` : ''}
                          {item.defId === 'placeable.help' ? (item.eventId ? ` · ▶ ${item.eventId}` : ' · ▶ (no event)') : ''}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(item.defId === 'placeable.stairs_down' || item.defId === 'placeable.stairs_up') && (
                            <button onClick={() => {
                              setEditStairsItem({ x: tx, y: ty, itemIndex: i });
                              setEditStairsId(item.transitionTargetId || '');
                              setEditStairsX(item.transitionTargetX ?? '');
                              setEditStairsY(item.transitionTargetY ?? '');
                            }} style={editBtnStyle}>Edit</button>
                          )}
                          <button onClick={() => removeItem(i)} style={removeBtnStyle}>Remove</button>
                        </div>
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
      {editStairsItem && (() => {
        const handleSaveEdit = () => {
          setTiles(prev => {
            const next = prev.map(r => r.map(c => ({ ...c, items: [...c.items] })));
            const cell = next[editStairsItem.y][editStairsItem.x];
            const item = cell.items[editStairsItem.itemIndex];
            if (item) {
              item.transitionTargetId = editStairsId;
              item.transitionTargetX = editStairsX === '' ? undefined : Number(editStairsX);
              item.transitionTargetY = editStairsY === '' ? undefined : Number(editStairsY);
            }
            return next;
          });
          setEditStairsItem(null);
        };

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditStairsItem(null)}>
            <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, minWidth: 300 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#7bb8ff' }}>Edit Stairs Target</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <select
                  value={editStairsId}
                  onChange={e => setEditStairsId(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  <option value="">— Select map —</option>
                  {availableScenarios.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: '#888' }}>Target X</label>
                  <input type="number" min={0} value={editStairsX} onChange={e => setEditStairsX(e.target.value === '' ? '' : Number(e.target.value))} style={{ ...inputStyle }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: '#888' }}>Target Y</label>
                  <input type="number" min={0} value={editStairsY} onChange={e => setEditStairsY(e.target.value === '' ? '' : Number(e.target.value))} style={{ ...inputStyle }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveEdit} style={{ ...btnStyle('#2b9a7a'), flex: 1, padding: 8 }}>Save</button>
                <button onClick={() => setEditStairsItem(null)} style={{ ...btnStyle('#555'), flex: 1, padding: 8 }}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, minWidth: 300, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#eee', marginBottom: 16 }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} style={{ ...btnStyle('#2b9a7a'), minWidth: 80 }}>Yes</button>
              <button onClick={() => setConfirmModal(null)} style={{ ...btnStyle('#555'), minWidth: 80 }}>No</button>
            </div>
          </div>
        </div>
      )}

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
