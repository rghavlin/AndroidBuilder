/**
 * EntityRenderer - Pure functions for drawing world entities (Players, NPCs, Items)
 */
import { imageLoader } from '../../game/utils/ImageLoader.js';
import { EntityType } from '../entities/Entity.js';
import { getZombieType } from '../entities/ZombieTypes.js';
import { ItemDefs } from '../inventory/ItemDefs.js';
import { EquipmentSlot, ItemCategory, ItemTrait } from '../inventory/traits.js';
import { TURRET_DEF_ID } from '../ai/TurretCombat.js';
import { gridItems } from '../inventory/gridUtils.js';

let tempCanvas = null;
let tempCtx = null;

// Phase 1 (dirty-flag rendering): renderEntity sets hasPulser = true whenever it
// draws a time-animated decoration (stun pulse, fire ring, active-turret ring,
// heard-blip pulse). MapCanvas resets this before its entity passes and reads it
// afterward to decide whether the scene must keep re-rendering while otherwise
// idle. Shared module-level object so no call-site signature change is needed.
export const frameRenderFlags = { hasPulser: false };

// Perf Phase 2: per-frame cached tile-item lookups. During a render pass
// MapCanvas sets engine._frameItemCache / _frameDominantCache (cleared each
// frame). renderEntity resolves getItemsOnTile / dominant-item up to ~5x per
// item entity per frame; these helpers collapse that to one lookup per tile per
// frame. Falls back to a direct lookup when no frame cache is present (e.g.
// called outside the render loop).
function getTileItemsCached(engine, x, y) {
  if (!engine || !engine.gameMap) return [];
  const cache = engine._frameItemCache;
  if (!cache) return engine.gameMap.getItemsOnTile(x, y);
  const key = `${x},${y}`;
  let items = cache.get(key);
  if (items === undefined) {
    items = engine.gameMap.getItemsOnTile(x, y);
    cache.set(key, items);
  }
  return items;
}

function getDominantItemCached(engine, x, y) {
  if (!engine || !engine.gameMap) return null;
  const cache = engine._frameDominantCache;
  if (!cache) return getDominantItemInTile(getTileItemsCached(engine, x, y));
  const key = `${x},${y}`;
  if (cache.has(key)) return cache.get(key); // cache null results too (empty tiles)
  const dominant = getDominantItemInTile(getTileItemsCached(engine, x, y));
  cache.set(key, dominant);
  return dominant;
}

let lastQueryTime = 0;
let cachedIsLight = false;

function isLightTheme() {
  const now = performance.now();
  if (now - lastQueryTime > 16) {
    cachedIsLight = typeof document !== 'undefined' &&
      (document.documentElement.classList.contains('light') ||
       document.documentElement.classList.contains('steampunk'));
    lastQueryTime = now;
  }
  return cachedIsLight;
}

const invertedImageCache = new Map();

function getInvertedImage(sprite) {
  if (!sprite) return null;
  const width = sprite.naturalWidth || sprite.width;
  const height = sprite.naturalHeight || sprite.height;
  if (!width || !height) return null;
  
  if (invertedImageCache.has(sprite)) {
    return invertedImageCache.get(sprite);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.filter = 'invert(1)';
  ctx.drawImage(sprite, 0, 0);
  
  invertedImageCache.set(sprite, canvas);
  return canvas;
}

function getTempCanvas(size) {
  const roundedSize = Math.ceil(size);
  if (!tempCanvas) {
    tempCanvas = document.createElement('canvas');
    tempCtx = tempCanvas.getContext('2d');
  }
  if (tempCanvas.width !== roundedSize) {
    tempCanvas.width = roundedSize;
    tempCanvas.height = roundedSize;
  }
  return { canvas: tempCanvas, ctx: tempCtx };
}

/**
 * The powered-on auto-turret an on-map entity is or carries: the entity itself
 * if it's a powered turret, otherwise a powered turret nested in its container
 * (e.g. a wagon). Returns null if none. Used for turret icon priority + the
 * pulsing "active/targetable" border. (Inert turrets return null.)
 */
function getPoweredTurretForEntity(entity) {
  if (!entity) return null;
  if (entity.defId === TURRET_DEF_ID && entity.isOn) return entity;
  const grid = entity.containerGrid || (typeof entity.getContainerGrid === 'function' ? entity.getContainerGrid() : null);
  for (const it of gridItems(grid)) {
    if (it && it.defId === TURRET_DEF_ID && it.isOn) return it;
  }
  return null;
}

// Ground-pile icon priority. A tile may hold many items, but it renders as a
// single icon — the "dominant" item. We pick by category tier first (lower
// rank = shown on top), then by footprint area within a tier. Tiers below mirror
// the design: vehicles > backpacks > food > guns > medical > containers >
// lighters/matches > (everything else, by size).
const TILE_ICON_RANK = {
  VEHICLE: 0,
  BACKPACK: 1,
  FOOD: 2,
  GUN: 3,
  MEDICAL: 4,
  CONTAINER: 5,
  FIRESTARTER: 6,
  OTHER: 7,
};

const FIRESTARTER_DEF_IDS = new Set(['tool.lighter', 'tool.matchbook']);

// Resolve traits/categories/slot from the item instance, falling back to its
// definition (ground-pile entries are often plain data, not Item instances).
function resolveItemMeta(item) {
  const defId = item.defId || item.id;
  const def = ItemDefs[defId] || {};
  const traits = item.traits || def.traits || [];
  const categories = item.categories || def.categories || [];
  const equippableSlot = item.equippableSlot || def.equippableSlot;
  return { defId, def, traits, categories, equippableSlot };
}

/**
 * Priority tier for a single item's ground-pile icon. Lower = higher priority.
 */
function getTileIconRank(item) {
  const { defId, traits, categories, equippableSlot } = resolveItemMeta(item);
  const hasTrait = (t) => traits.includes(t);
  const hasCategory = (c) => categories.includes(c);

  if (hasTrait(ItemTrait.VEHICLE) || hasTrait(ItemTrait.WAGON) ||
      hasTrait(ItemTrait.SCOOTER) || hasCategory(ItemCategory.VEHICLE)) {
    return TILE_ICON_RANK.VEHICLE;
  }
  if (equippableSlot === EquipmentSlot.BACKPACK) return TILE_ICON_RANK.BACKPACK;
  if (hasCategory(ItemCategory.FOOD)) return TILE_ICON_RANK.FOOD;
  if (hasCategory(ItemCategory.GUN)) return TILE_ICON_RANK.GUN;
  if (hasCategory(ItemCategory.MEDICAL) || hasTrait(ItemTrait.MEDICAL)) {
    return TILE_ICON_RANK.MEDICAL;
  }
  // Loose containers (lunchbox, toolbox, gun case, medkit). Backpacks are
  // already handled above, so any remaining CONTAINER-trait item lands here.
  if (hasTrait(ItemTrait.CONTAINER)) return TILE_ICON_RANK.CONTAINER;
  if (FIRESTARTER_DEF_IDS.has(defId)) return TILE_ICON_RANK.FIRESTARTER;
  return TILE_ICON_RANK.OTHER;
}

/**
 * The dominant item among items sharing a ground tile, used to decide which item
 * a ground pile renders as. Selection is by category priority (vehicles >
 * backpacks > food > guns > medical > containers > lighters/matches), and within
 * a tier by footprint area (largest wins). Width/height fall back to the item
 * definition, then to 1. Returns null for an empty/missing list.
 */
export function getDominantItemInTile(tileItems) {
  if (!tileItems || tileItems.length === 0) return null;
  let bestItem = null;
  let bestRank = Infinity;
  let bestArea = -1;
  for (const item of tileItems) {
    const { def } = resolveItemMeta(item);
    const w = item.width || def?.width || 1;
    const h = item.height || def?.height || 1;
    const area = w * h;
    const rank = getTileIconRank(item);
    if (rank < bestRank || (rank === bestRank && area > bestArea)) {
      bestRank = rank;
      bestArea = area;
      bestItem = item;
    }
  }
  return bestItem;
}



export const EntityRenderer = {
  renderEntity: (ctx, entity, tileSize, sprites, visibilitySet, isExplored, engine, currentTime = performance.now(), isGlobalAnimating = false) => {
    // Reset globalAlpha to ensure state from previous entity draws doesn't leak
    ctx.globalAlpha = 1.0;

    let explored = isExplored;
    if (!explored && entity.edge && ['door', 'window'].includes(entity.type) && engine && engine.gameMap) {
      let adjX = Math.round(entity.x);
      let adjY = Math.round(entity.y);
      if (entity.edge === 'e') adjX += 1;
      else if (entity.edge === 'w') adjX -= 1;
      else if (entity.edge === 's') adjY += 1;
      else if (entity.edge === 'n') adjY -= 1;
      
      const adjTile = engine.gameMap.getTile(adjX, adjY);
      if (adjTile && adjTile.flags?.explored) {
        explored = true;
      }
    }

    if (!explored) return;

    // Skip rendering non-dominant items on the same tile to avoid overlapping tokens
    if (entity.type === 'item' && engine && engine.gameMap) {
      const dominantItem = getDominantItemCached(engine, Math.round(entity.x), Math.round(entity.y));
      if (dominantItem && dominantItem.id !== entity.id) {
        return;
      }
    }

    // 1. Movement Interpolation (Phase 11 Fix: Prevent Teleportation Flash)
    let renderX = entity.x;
    let renderY = entity.y;

    if (entity.movementPath && entity.movementPath.length > 1) {
      if (entity.isAnimating) {
        // Linear interpolation across the entire path nodes
        const path = entity.movementPath;
        const progress = entity.animationProgress || 0;
        const totalSteps = path.length - 1;
        const exactStep = progress * totalSteps;
        const startIndex = Math.floor(exactStep);
        const endIndex = Math.min(startIndex + 1, totalSteps);
        const stepProgress = exactStep - startIndex;
        
        const startNode = path[startIndex];
        const endNode = path[endIndex];
        
        renderX = startNode.x + (endNode.x - startNode.x) * stepProgress;
        renderY = startNode.y + (endNode.y - startNode.y) * stepProgress;
      } else {
        // If we're not actively animating this specific entity, always use its logical position.
        // Previous attempts to anchor to movementPath[0] during global animations caused persistent ghosting desyncs.
        renderX = entity.x;
        renderY = entity.y;
      }
    } else if (entity.isAnimating && entity.activeAction && entity.activeAction.type === 'ATTACK') {
      const from = entity.activeAction.data.from || { x: entity.x, y: entity.y };
      const to = entity.activeAction.data.to;
      if (to) {
        const progress = entity.animationProgress || 0;
        // Bump animation: slides toward target, peak at 0.5, returns to start at 1.0
        const factor = Math.sin(progress * Math.PI) * 0.35;
        renderX = from.x + (to.x - from.x) * factor;
        renderY = from.y + (to.y - from.y) * factor;
      }
    }

    // 2. Visibility Filtering (Fog of War vs Line of Sight)
    const isPersistent = ['door', 'window', 'place_icon', 'item'].includes(entity.type);
    
    // PERFORM VISUAL LOS CHECK BASED ON RENDER COORDS
    const visualX = Math.round(renderX);
    const visualY = Math.round(renderY);
    let isVisible = visibilitySet.has(`${visualX},${visualY}`);

    // If it is an edge-aligned entity (door/window), check if the visible side neighbor is visible
    if (!isVisible && entity.edge && ['door', 'window'].includes(entity.type)) {
      let adjX = visualX;
      let adjY = visualY;
      if (entity.edge === 'e') adjX += 1;
      else if (entity.edge === 'w') adjX -= 1;
      else if (entity.edge === 's') adjY += 1;
      else if (entity.edge === 'n') adjY -= 1;
      if (visibilitySet.has(`${adjX},${adjY}`)) {
        isVisible = true;
      }
    }

    // Player hears this zombie's recent noise (move/smash) even without line
    // of sight — render a vague, detail-free silhouette instead of skipping it
    // or showing its real sprite (see PlayerHearing.markHeardIfInRange).
    // Anchored to the entity's actual logical tile (entity.logicalX/Y), NOT
    // renderX/renderY: those interpolate across the movement tween, which
    // would otherwise drag the shadow through tiles on the zombie's path that
    // were never themselves in hearing range (see PlayerHearing.js's
    // per-turn hearingZone snapshot for why only the landing tile counts).
    //
    // Two gates beyond the plain !isVisible above, both fixing real leaks:
    // - isVisible was computed from renderX/renderY (the mid-tween position),
    //   so a zombie already LOS-visible at its logical landing tile could
    //   still get a shadow drawn there because the tween hadn't caught up yet.
    //   Re-check LOS against the logical tile specifically.
    // - Only show once turnPhase is back to PLAYER_TURN: heardByPlayer is set
    //   the instant the zombie moves during SIMULATING, but the shadow must
    //   not appear mid-playback (ANIMATING) — that's still the zombies' turn.
    const heardX = entity.logicalX !== undefined ? entity.logicalX : entity.x;
    const heardY = entity.logicalY !== undefined ? entity.logicalY : entity.y;
    const isLogicallyVisible = visibilitySet.has(`${Math.round(heardX)},${Math.round(heardY)}`);
    const isPlayerTurnNow = !engine.turnPhase || engine.turnPhase === 'PLAYER_TURN';

    if (!isVisible && !isLogicallyVisible && isPlayerTurnNow && entity.type === EntityType.ZOMBIE && entity.heardByPlayer && !engine.seeThroughWalls) {
      const ghostScreenX = heardX * tileSize;
      const ghostScreenY = heardY * tileSize;

      // Brief pop + a couple of pulses right when it's newly heard, settling
      // to a steady dim blip for the rest of the turn.
      const PULSE_DURATION = 900;
      const revealedAt = entity.hearingRevealedAt || 0;
      const elapsed = currentTime - revealedAt;
      let alpha = 0.4;
      let radius = tileSize * 0.32;
      if (elapsed >= 0 && elapsed < PULSE_DURATION) {
        const pulse = Math.sin((elapsed / PULSE_DURATION) * Math.PI * 4) * 0.5 + 0.5;
        alpha = 0.4 + pulse * 0.35;
        radius = tileSize * (0.32 + pulse * 0.12);
        frameRenderFlags.hasPulser = true; // animating heard-blip; keep frames warm
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.arc(ghostScreenX + tileSize / 2, ghostScreenY + tileSize / 2, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Transient entities (zombies, rabbits) are ONLY visible if in active LOS
    if (!isVisible && !isPersistent && !engine.seeThroughWalls) return;

    // Persistent entities stay visible if explored, but use consistent fog alpha
    // PHASE 15 Fix: Increase opacity for structural objects in fog to prevent them looking 'open' or hollow
    if (!isVisible) ctx.globalAlpha = isPersistent ? 0.8 : 0.55;

    const screenX = renderX * tileSize;
    const screenY = renderY * tileSize;

    // 2. Specialized Rendering by Subtype/Type
    if (entity.type === EntityType.DOOR) {
      EntityRenderer.drawDoor(ctx, entity, screenX, screenY, tileSize);
    } else if (entity.type === EntityType.WINDOW) {
      EntityRenderer.drawWindow(ctx, entity, screenX, screenY, tileSize);
    } else if (entity.type === EntityType.PLACE_ICON) {
      EntityRenderer.drawPlaceIcon(ctx, entity, screenX, screenY, tileSize, sprites);
    } else {
      // Standard Sprite Rendering
      // Standardize subtype: use 'basic' if null/undefined to hit base sprite entries
      // Standard Sprite Rendering
      // Standardize subtype: use 'basic' if null/undefined to hit base sprite entries
      const subtype = entity.type === EntityType.PLAYER ? null : (entity.subtype || 'basic');

      // The powered-on turret this item is or carries (null otherwise). Drives
      // turret icon priority, forced token rendering, and the pulsing ring.
      const renderTurret = entity.type === 'item' ? getPoweredTurretForEntity(entity) : null;

      // Phase 27: Priority for Image Mapping
      // 1. If it's an Item with an explicit imageId, use it (canonical)
      // 2. If it's an item subtype with a definition, use that definition's imageId
      // 3. Fallback to subtype itself
      // 4. Special: Ground pile displays the image of the largest item in the pile
      let effectiveImageId = subtype;
      if (entity.type === 'item') {
        if (subtype === 'ground_pile' && engine && engine.gameMap) {
          const dominantItem = getDominantItemCached(engine, Math.round(entity.x), Math.round(entity.y));
          if (dominantItem) {
            const defId = dominantItem.defId || dominantItem.id;
            const def = ItemDefs[defId];
            effectiveImageId = dominantItem.imageId || def?.imageId || defId;
          }
        } else {
          effectiveImageId = entity.imageId || (ItemDefs[subtype]?.imageId) || subtype;
        }

        // Turret icon priority: a carrier (e.g. a wagon) holding a powered-on
        // turret renders AS the turret — it's the exposed, targetable object on
        // this tile. (Standalone turrets already use the turret image.)
        if (renderTurret && entity.defId !== TURRET_DEF_ID) {
          effectiveImageId = 'turret';
        }
      }

      // PHASE 26 FIX: Normalize sprite keys to match ImageLoader canonical forms
      let spriteKey = entity.type;
      if (effectiveImageId && effectiveImageId !== 'basic') {
        spriteKey = `${entity.type}_${effectiveImageId}`;
      }
      
      // Special mappings for zombie subtypes to match ImageLoader's specific naming
      if (entity.type === EntityType.ZOMBIE) {
        const typeDef = getZombieType(subtype);
        spriteKey = typeDef?.spriteKey || 'zombie';
      }

      // Custom NPC icon: authored in the map editor as a literal filename already
      // shipped in client/public/images/entities/ (e.g. 'soldierzombie', 'player'),
      // reusing existing art rather than a per-typeId sprite convention. Takes
      // priority over the generic npc sprite.
      const npcIconKey = (entity.type === EntityType.NPC && entity.iconId) ? entity.iconId : null;
      if (npcIconKey) spriteKey = npcIconKey;

      let sprite = sprites[spriteKey];

      // Type-specific fallbacks
      if (!sprite) {
        if (entity.type === 'item') {
          // Fallback to generic item sprite or item_default
          sprite = sprites['item'] || sprites['item_default'];

          if (!sprite) {
            // Trigger lazy-loading for the base item default
            imageLoader.getItemImage('default');
          }

          // Trigger lazy-loading for missing specialized sprites (e.g., bed, campfire, toywagon)
          if (effectiveImageId && effectiveImageId !== 'ground_pile' && effectiveImageId !== 'basic') {
            imageLoader.getItemImage(effectiveImageId);
          }
        } else if (npcIconKey) {
          // Lazy-load the custom icon directly by its literal filename key.
          imageLoader.getImage(npcIconKey);
        } else {
          sprite = sprites[entity.type];
          if (!sprite && ['player', 'zombie', 'npc', 'rabbit'].includes(entity.type)) {
            // Reactive lazy-loading for core missing entities
            imageLoader.getImage(entity.type);
          }
        }
      }

      // 2. Specialized Rendering by Subtype/Type
      if (sprite) {
        let drawX = screenX;
        let drawY = screenY;
        let drawSize = tileSize;

        // Check if the item on the tile is a crop (growing or harvestable, wild or player-planted)
        const tileItems = getTileItemsCached(engine, Math.round(entity.x), Math.round(entity.y));
        const isCrop = tileItems.some(item => item.isCrop || false);

        // Check if the item on the tile is a piece of furniture or a vehicle
        const hasFurnitureOrVehicle = tileItems.some(item => item.isFurnitureOrVehicle || false);

        // Metadata driven: check if the item is marked as full-tile
        // We check the entity property (set by GameMap for ground items) or the definition
        let isFullTileItem = entity.renderFullTile ||
                               ItemDefs[subtype]?.renderFullTile ||
                               ItemDefs[entity.defId]?.renderFullTile;

        // A powered-on turret (standalone or wagon-carried) always renders as a
        // circular token so its framing ring can pulse to signal it's active.
        if (renderTurret) isFullTileItem = false;

        // Override: render crops, furniture, and vehicles in a circular token frame (not full tile)
        if (isCrop || hasFurnitureOrVehicle) {
          isFullTileItem = false;
        }
        
        const isExit = subtype === 'exit' || entity.defId === 'placeable.exit' || entity.subtype === 'exit';

        if (entity.type === 'item' && !isFullTileItem) {
          drawSize = tileSize * (2 / 3);
          drawX = screenX + (tileSize - drawSize) / 2;
          drawY = screenY + (tileSize - drawSize) / 2;
        } else if (entity.type === 'item' && isFullTileItem && !isExit) {
          drawSize = tileSize * 0.8;
          drawX = screenX + (tileSize - drawSize) / 2;
          drawY = screenY + (tileSize - drawSize) / 2;
        } else if (['player', 'zombie', 'npc', 'rabbit'].includes(entity.type)) {
          drawSize = tileSize * 0.8;
          drawX = screenX + (tileSize - drawSize) / 2;
          drawY = screenY + (tileSize - drawSize) / 2;
        }

        // Draw background token circle for items
        if (entity.type === 'item' && !isFullTileItem && !isExit) {
          let itemBgColor = '#0a0a0a';
          let isFood = false;
          let isMedical = false;
          let matchingDef = null;
          
          if (subtype === 'ground_pile' && engine && engine.gameMap) {
            const dominantItem = getDominantItemCached(engine, Math.round(entity.x), Math.round(entity.y));
            if (dominantItem) {
              isFood = dominantItem.isFood || false;
              isMedical = dominantItem.isMedical || false;
              const defId = dominantItem.defId || dominantItem.id;
              matchingDef = dominantItem._def || ItemDefs[defId];
            }
          } else {
            isFood = entity.isFood || false;
            isMedical = entity.isMedical || false;
            const defId = entity.defId || subtype;
            matchingDef = entity._def || ItemDefs[defId];
          }

          if (isCrop) {
            itemBgColor = '#006B18';
          } else if (hasFurnitureOrVehicle) {
            itemBgColor = '#36454F'; // Charcoal background
          } else if (matchingDef && matchingDef.backgroundColor) {
            itemBgColor = matchingDef.backgroundColor;
          } else if (isFood) {
            itemBgColor = '#006B18';
          } else if (isMedical) {
            itemBgColor = '#8a0303';
          } else {
            itemBgColor = '#0a0a0a';
          }

          const isLight = isLightTheme();
          if (isLight) {
            const lower = itemBgColor.toLowerCase();
            if (lower === '#006b18') itemBgColor = '#639A88';
            else if (lower === '#8a0303') itemBgColor = '#C15C5C';
            else if (lower === '#0a2e5c') itemBgColor = '#5C8AB3';
            else itemBgColor = '#ffffff';
          }

          const centerX = drawX + drawSize / 2;
          const centerY = drawY + drawSize / 2;
          const radius = drawSize / 2;

          // 1. Draw background circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fillStyle = itemBgColor;
          ctx.fill();
          if (isLight) {
            ctx.strokeStyle = '#d4d4d8';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          ctx.restore();

          // 2. Draw sprite (clipped and scaled down so it fits perfectly inside the circle)
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.clip();

          // Scale down slightly (0.72) to prevent corner overflow (e.g. wagon wheels/handle)
          const scale = 0.72;
          const sSize = drawSize * scale;
          const sX = drawX + (drawSize - sSize) / 2;
          const sY = drawY + (drawSize - sSize) / 2;
          let drawSprite = sprite;
          if (isLight && itemBgColor === '#ffffff') {
            drawSprite = getInvertedImage(sprite) || sprite;
          }
          ctx.drawImage(drawSprite, sX, sY, sSize, sSize);
          ctx.restore();
          
          // 3. Draw outer and inner borders on top of the clipped sprite
          ctx.save();
          
          // Draw outer dark border for high contrast
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.lineWidth = Math.max(1.5, drawSize * 0.08);
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();

          // Draw inner border. Normally silver; a powered-on turret pulses its
          // ring between silver and dark electric blue to signal it's active.
          if (renderTurret) {
            frameRenderFlags.hasPulser = true; // pulsing active-turret ring
            const t = 0.5 + 0.5 * Math.sin(currentTime / 250); // 0..1
            const lerp = (a, b) => Math.round(a + (b - a) * t);
            // silver (226,232,240) <-> dark electric blue (15,60,180)
            ctx.strokeStyle = `rgb(${lerp(226, 15)}, ${lerp(232, 60)}, ${lerp(240, 180)})`;
            ctx.lineWidth = Math.max(1.2, drawSize * 0.06);
          } else if (matchingDef && matchingDef.borderColor) {
            ctx.strokeStyle = matchingDef.borderColor;
            ctx.lineWidth = Math.max(1.2, drawSize * 0.06);
          } else {
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = Math.max(0.8, drawSize * 0.04);
          }
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }

        // Draw metallic background plate for player
        if (entity.type === EntityType.PLAYER) {
          ctx.save();
          // Dark metallic gradient background
          const bgGrad = ctx.createLinearGradient(drawX, drawY, drawX, drawY + drawSize);
          bgGrad.addColorStop(0, '#334155');
          bgGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(drawX, drawY, drawSize, drawSize);

          // Subtle horizontal ridges for texture
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          for (let i = 2; i < drawSize; i += 4) {
            ctx.fillRect(drawX, drawY + i, drawSize, 1.5);
          }

          // Subtle inner glow
          const glowGrad = ctx.createRadialGradient(
            drawX + drawSize/2, drawY + drawSize/2, 0,
            drawX + drawSize/2, drawY + drawSize/2, drawSize/2
          );
          glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)'); // faint blue glow in center
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glowGrad;
          ctx.fillRect(drawX, drawY, drawSize, drawSize);
          
          ctx.restore();
        }

        // Apply health tinting for player icon
        const currentHp = entity.hp ?? entity._hp;
        const currentMaxHp = entity.maxHp ?? entity._maxHp;
        if (entity.type === EntityType.PLAYER && currentHp !== undefined && currentMaxHp !== undefined && currentHp < currentMaxHp) {
            const hpPercent = Math.max(0, currentHp / currentMaxHp);
            const damagePercent = 1.0 - hpPercent;
            
            const { canvas: tCanvas, ctx: tCtx } = getTempCanvas(drawSize);
            tCtx.clearRect(0, 0, tCanvas.width, tCanvas.height);
            
            // Draw original sprite
            tCtx.drawImage(sprite, 0, 0, drawSize, drawSize);
            
            // Apply red color tint from the bottom up (damage percentage)
            const fillHeight = drawSize * damagePercent;
            const startY = drawSize - fillHeight;
            
            // 'color' blend mode preserves luminosity (black stays black) but changes hue (green becomes red)
            tCtx.globalCompositeOperation = 'color';
            tCtx.fillStyle = '#ef4444'; // Solid red tint
            tCtx.fillRect(0, startY, drawSize, fillHeight);
            
            // Mask out any areas that were originally transparent
            tCtx.globalCompositeOperation = 'destination-in';
            tCtx.drawImage(sprite, 0, 0, drawSize, drawSize);
            
            // Reset composite operation
            tCtx.globalCompositeOperation = 'source-over';
            
            ctx.drawImage(tCanvas, drawX, drawY, drawSize, drawSize);
        } else {
            const isSouthExit = entity.type === 'item' && 
                                (entity.defId === 'placeable.exit' || entity.subtype === 'exit') && 
                                engine.gameMap && 
                                entity.y === engine.gameMap.height - 1;
            
            const isTokenItem = entity.type === 'item' && !isFullTileItem && !isExit;

            if (isSouthExit) {
              ctx.save();
              ctx.translate(drawX + drawSize / 2, drawY + drawSize / 2);
              ctx.rotate(Math.PI);
              ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
              ctx.restore();
            } else if (!isTokenItem) {
              ctx.drawImage(sprite, drawX, drawY, drawSize, drawSize);
            }
        }
        
        // Square 'Picture Frame' for Player, Zombies and Rabbits (distinct silver game piece outline)
        if (entity.type === EntityType.PLAYER) {
          ctx.save();
          
          // Outer dark bevel (softened to reduce the heavy shadow effect)
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.lineWidth = 5;
          ctx.strokeRect(drawX, drawY, drawSize, drawSize);

          // Complex metallic gradient for the player frame
          const grad = ctx.createLinearGradient(drawX, drawY, drawX + drawSize, drawY + drawSize);
          grad.addColorStop(0, '#ffffff');   // bright top-left
          grad.addColorStop(0.3, '#94a3b8'); // mid gray
          grad.addColorStop(0.5, '#cbd5e1'); // reflection
          grad.addColorStop(0.8, '#475569'); // dark gray
          grad.addColorStop(1, '#334155');   // softened shadow bottom-right

          ctx.strokeStyle = grad;
          ctx.lineWidth = 3;
          ctx.strokeRect(drawX, drawY, drawSize, drawSize);

          // Corner rivets to emphasize the metallic/industrial look
          ctx.fillStyle = '#334155'; // softened rivet color
          const r = 1.5;
          const inset = 3;
          ctx.beginPath(); ctx.arc(drawX + inset, drawY + inset, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(drawX + drawSize - inset, drawY + inset, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(drawX + inset, drawY + drawSize - inset, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(drawX + drawSize - inset, drawY + drawSize - inset, r, 0, Math.PI * 2); ctx.fill();

          ctx.restore();
        } else if (entity.type === EntityType.ZOMBIE || entity.type === EntityType.RABBIT) {
          ctx.save();
          
          // Draw outer high-contrast border
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.lineWidth = 4.5;
          ctx.strokeRect(drawX, drawY, drawSize, drawSize);

          // Draw inner silver metallic outline
          ctx.strokeStyle = '#e2e8f0'; // Metallic silver/slate-200
          ctx.lineWidth = 2.5;
          ctx.strokeRect(drawX, drawY, drawSize, drawSize);
          
          ctx.restore();
        }

        // Orange pulsing frame for any entity on fire
        if (entity.fireTurns > 0) {
          frameRenderFlags.hasPulser = true; // pulsing fire ring
          ctx.save();
          const pulse = 0.5 + Math.sin(currentTime / 150) * 0.4;
          ctx.strokeStyle = `rgba(249, 115, 22, ${pulse})`;
          ctx.lineWidth = 4.0;
          ctx.strokeRect(drawX - 2, drawY - 2, drawSize + 4, drawSize + 4);
          ctx.restore();
        }
      } else {
        EntityRenderer.renderDefaultSquare(ctx, entity, screenX, screenY, tileSize);
      }
    }

    // 3. Health Bars (Show if damaged, excluding structural obstacles and player)
    const eHp = entity.hp ?? entity._hp;
    const eMaxHp = entity.maxHp ?? entity._maxHp;
    const isWounded = eHp !== undefined && eMaxHp !== undefined && eHp < eMaxHp;
    const isStructural = entity.type === EntityType.DOOR || entity.type === EntityType.WINDOW;
    if (isVisible && isWounded && !isStructural && entity.type !== EntityType.PLAYER) {
      EntityRenderer.renderHealthBar(ctx, entity, screenX, screenY, tileSize);
    }

    // Pulse highlight for stunned entities (Sky blue)
    if (entity.stunnedTurns > 0) {
      frameRenderFlags.hasPulser = true; // pulsing stun highlight
      let drawSize = tileSize;
      let drawX = screenX;
      let drawY = screenY;
      if (['player', 'zombie', 'npc', 'rabbit'].includes(entity.type)) {
        drawSize = tileSize * 0.8;
        drawX = screenX + (tileSize - drawSize) / 2;
        drawY = screenY + (tileSize - drawSize) / 2;
      }
      ctx.save();
      const pulse = Math.sin(currentTime / 150);
      const alpha = 0.6 + 0.4 * pulse;
      const lineWidth = 3.5 + 1.5 * pulse;
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(drawX, drawY, drawSize, drawSize);
      ctx.restore();
    }

    ctx.globalAlpha = 1.0;
  },

  drawDoor: (ctx, entity, x, y, tileSize) => {
    const isBW = imageLoader.tileSet === 'b&w';
    // Make doors much darker and higher contrast
    const doorColor = isBW ? '#3a3a3a' : '#3e2723';
    const strokeColor = isBW ? '#111111' : '#1a0a05';
    const knobColor = isBW ? '#ffffff' : '#facc15';
    
    ctx.lineWidth = 3;
    const margin = tileSize / 8;

    if (entity.edge && ['n', 's', 'e', 'w'].includes(entity.edge)) {
      const length = tileSize - margin * 2;
      const thickness = Math.max(8, Math.floor(tileSize * 0.18));
      
      // Determine closed vs open geometry based on edge
      let rx, ry, rw, rh;
      const isOpen = entity.visualIsOpen === true;

      if (entity.edge === 'n') {
        if (isOpen) {
          rx = x + margin - thickness / 2;
          ry = y;
          rw = thickness;
          rh = length;
        } else {
          rx = x + margin;
          ry = y - thickness / 2;
          rw = length;
          rh = thickness;
        }
      } else if (entity.edge === 's') {
        if (isOpen) {
          rx = x + margin - thickness / 2;
          ry = y + tileSize - length;
          rw = thickness;
          rh = length;
        } else {
          rx = x + margin;
          ry = y + tileSize - thickness / 2;
          rw = length;
          rh = thickness;
        }
      } else if (entity.edge === 'w') {
        if (isOpen) {
          rx = x;
          ry = y + margin - thickness / 2;
          rw = length;
          rh = thickness;
        } else {
          rx = x - thickness / 2;
          ry = y + margin;
          rw = thickness;
          rh = length;
        }
      } else if (entity.edge === 'e') {
        if (isOpen) {
          rx = x + tileSize - length;
          ry = y + margin - thickness / 2;
          rw = length;
          rh = thickness;
        } else {
          rx = x + tileSize - thickness / 2;
          ry = y + margin;
          rw = thickness;
          rh = length;
        }
      }

      ctx.fillStyle = doorColor;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = strokeColor;
      ctx.strokeRect(rx, ry, rw, rh);

      // Draw doorknob/handle if closed
      if (!isOpen) {
        ctx.save();
        ctx.fillStyle = knobColor;
        ctx.beginPath();
        const knobRadius = Math.max(2, Math.floor(thickness * 0.25));
        let kx, ky;
        if (entity.edge === 'n' || entity.edge === 's') {
          kx = rx + rw * 0.75;
          ky = ry + rh / 2;
        } else {
          kx = rx + rw / 2;
          ky = ry + rh * 0.75;
        }
        ctx.arc(kx, ky, knobRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Fallback: original centered drawing
      ctx.fillStyle = doorColor;
      ctx.fillRect(x + margin, y + margin, tileSize - margin * 2, tileSize - margin * 2);
      ctx.strokeStyle = strokeColor;
      ctx.strokeRect(x + margin, y + margin, tileSize - margin * 2, tileSize - margin * 2);

      // Draw doorknob/handle if closed
      if (!entity.visualIsOpen && !entity.isOpen) {
        ctx.save();
        ctx.fillStyle = knobColor;
        ctx.beginPath();
        const knobRadius = Math.max(2.5, Math.floor(tileSize * 0.06));
        const kx = x + margin + (tileSize - margin * 2) * 0.75;
        const ky = y + margin + (tileSize - margin * 2) * 0.5;
        ctx.arc(kx, ky, knobRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }
  },

  drawWindow: (ctx, entity, x, y, tileSize) => {
    const glassFill = 'rgba(160, 180, 210, 0.35)';
    const winFrameColor = '#f3f4f6';
    ctx.strokeStyle = winFrameColor;
    ctx.lineWidth = Math.max(1.5, tileSize / 12);
    const margin = tileSize / 8;
    const w = tileSize - margin * 2;

    if (entity.edge && ['n', 's', 'e', 'w'].includes(entity.edge)) {
      const length = tileSize - margin * 2;
      const thickness = Math.max(6, Math.floor(tileSize * 0.12));
      let rx, ry, rw, rh;

      if (entity.edge === 'n') {
        rx = x + margin;
        ry = y - thickness / 2;
        rw = length;
        rh = thickness;
      } else if (entity.edge === 's') {
        rx = x + margin;
        ry = y + tileSize - thickness / 2;
        rw = length;
        rh = thickness;
      } else if (entity.edge === 'w') {
        rx = x - thickness / 2;
        ry = y + margin;
        rw = thickness;
        rh = length;
      } else if (entity.edge === 'e') {
        rx = x + tileSize - thickness / 2;
        ry = y + margin;
        rw = thickness;
        rh = length;
      }

      const isBroken = entity.subtype === 'broken';
      const isOpen = entity.isOpen;

      // Draw glass first if not broken and not open
      if (!isBroken && !isOpen) {
        ctx.fillStyle = glassFill;
        ctx.fillRect(rx, ry, rw, rh);
      }

      // Draw window frame outline (always draw the frame outline, even if broken)
      ctx.strokeStyle = winFrameColor;
      ctx.strokeRect(rx, ry, rw, rh);

      // Draw internal details (sash / broken glass)
      if (isBroken) {
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = Math.max(1.5, tileSize / 12);

        if (entity.edge === 'n' || entity.edge === 's') {
          // Sharp high-frequency jagged crack line horizontally
          ctx.beginPath();
          ctx.moveTo(rx, ry + rh * 0.5);
          ctx.lineTo(rx + rw * 0.12, ry + rh * 0.1);
          ctx.lineTo(rx + rw * 0.25, ry + rh * 0.9);
          ctx.lineTo(rx + rw * 0.38, ry + rh * 0.15);
          ctx.lineTo(rx + rw * 0.50, ry + rh * 0.85);
          ctx.lineTo(rx + rw * 0.62, ry + rh * 0.1);
          ctx.lineTo(rx + rw * 0.75, ry + rh * 0.9);
          ctx.lineTo(rx + rw * 0.88, ry + rh * 0.2);
          ctx.lineTo(rx + rw, ry + rh * 0.5);
          ctx.stroke();
        } else {
          // Sharp high-frequency jagged crack line vertically
          ctx.beginPath();
          ctx.moveTo(rx + rw * 0.5, ry);
          ctx.lineTo(rx + rw * 0.1, ry + rh * 0.12);
          ctx.lineTo(rx + rw * 0.9, ry + rh * 0.25);
          ctx.lineTo(rx + rw * 0.15, ry + rh * 0.38);
          ctx.lineTo(rx + rw * 0.85, ry + rh * 0.50);
          ctx.lineTo(rx + rw * 0.1, ry + rh * 0.62);
          ctx.lineTo(rx + rw * 0.9, ry + rh * 0.75);
          ctx.lineTo(rx + rw * 0.2, ry + rh * 0.88);
          ctx.lineTo(rx + rw * 0.5, ry + rh);
          ctx.stroke();
        }
      } else if (!isOpen) {
        // Draw sash across the middle
        ctx.strokeStyle = winFrameColor;
        ctx.beginPath();
        if (entity.edge === 'n' || entity.edge === 's') {
          ctx.moveTo(rx + rw / 2, ry);
          ctx.lineTo(rx + rw / 2, ry + rh);
        } else {
          ctx.moveTo(rx, ry + rh / 2);
          ctx.lineTo(rx + rw, ry + rh / 2);
        }
        ctx.stroke();
      }

      // Draw reinforcements if present
      if (entity.isReinforced && entity.reinforcementHp > 0) {
        ctx.strokeStyle = '#8b5a2b'; // Wood brown
        ctx.lineWidth = Math.max(3, tileSize / 10);
        ctx.beginPath();
        if (entity.edge === 'n' || entity.edge === 's') {
          // Horizontal/slanted planks crossing
          ctx.moveTo(rx, ry - 2);
          ctx.lineTo(rx + rw, ry + rh + 2);
          ctx.moveTo(rx, ry + rh + 2);
          ctx.lineTo(rx + rw, ry - 2);
        } else {
          // Vertical/slanted planks crossing
          ctx.moveTo(rx - 2, ry);
          ctx.lineTo(rx + rw + 2, ry + rh);
          ctx.moveTo(rx + rw + 2, ry);
          ctx.lineTo(rx - 2, ry + rh);
        }
        ctx.stroke();
      }

    } else {
      // Fallback to old centered drawing
      if (entity.subtype === 'broken') {
        ctx.strokeStyle = winFrameColor;
        ctx.strokeRect(x + margin, y + margin, w, w);

        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = Math.max(1.5, tileSize / 12);
        
        const rx = x + margin;
        const ry = y + margin;
        
        // Sharp high-frequency jagged crack line horizontally
        ctx.beginPath();
        ctx.moveTo(rx, ry + w * 0.5);
        ctx.lineTo(rx + w * 0.12, ry + w * 0.15);
        ctx.lineTo(rx + w * 0.25, ry + w * 0.85);
        ctx.lineTo(rx + w * 0.38, ry + w * 0.20);
        ctx.lineTo(rx + w * 0.50, ry + w * 0.80);
        ctx.lineTo(rx + w * 0.62, ry + w * 0.15);
        ctx.lineTo(rx + w * 0.75, ry + w * 0.85);
        ctx.lineTo(rx + w * 0.88, ry + w * 0.25);
        ctx.lineTo(rx + w, ry + w * 0.5);
        ctx.stroke();
      } else if (entity.isOpen) {
        ctx.strokeRect(x + margin, y + margin, w, w);
      } else {
        ctx.fillStyle = glassFill;
        ctx.fillRect(x + margin, y + margin, w, w);
        ctx.strokeRect(x + margin, y + margin, w, w);
        // Sash
        ctx.beginPath();
        ctx.moveTo(x + margin, y + margin + w / 2);
        ctx.lineTo(x + margin + w, y + margin + w / 2);
        ctx.stroke();
      }

      if (entity.isReinforced && entity.reinforcementHp > 0) {
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = Math.max(3, tileSize / 8);
        ctx.beginPath();
        ctx.moveTo(x + margin, y + margin);
        ctx.lineTo(x + margin + w, y + margin + w);
        ctx.moveTo(x + margin + w, y + margin);
        ctx.lineTo(x + margin, y + margin + w);
        ctx.stroke();
      }
    }
  },

  drawPlaceIcon: (ctx, entity, x, y, tileSize, sprites) => {
    const subtype = entity.subtype || 'default';
    const sprite = sprites[`place_icon_${subtype}`] || sprites['place_icon'];
    
    if (subtype === 'barrier') {
      const drawSize = tileSize * 0.9;
      const offsetX = x + (tileSize - drawSize) / 2;
      const offsetY = y + (tileSize - drawSize) / 2;
      
      // Dark background with slight orange tinge
      ctx.fillStyle = '#26160a';
      ctx.fillRect(offsetX, offsetY, drawSize, drawSize);
      
      if (sprite) {
        ctx.drawImage(sprite, offsetX, offsetY, drawSize, drawSize);
      }
      
      ctx.strokeStyle = '#110a05';
      ctx.lineWidth = Math.max(1, tileSize * 0.05);
      ctx.strokeRect(offsetX, offsetY, drawSize, drawSize);
    } else if (sprite) {
      ctx.drawImage(sprite, x, y, tileSize, tileSize);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(x + tileSize/2, y + tileSize/2, tileSize/4, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /**
   * Render default square when sprite is missing
   */
  renderDefaultSquare: (ctx, entity, x, y, tileSize) => {
    let drawX = x;
    let drawY = y;
    let drawSize = tileSize;
    if (['player', 'zombie', 'npc', 'rabbit'].includes(entity.type)) {
      drawSize = tileSize * 0.8;
      drawX = x + (tileSize - drawSize) / 2;
      drawY = y + (tileSize - drawSize) / 2;
    }
    ctx.fillStyle = entity.type === EntityType.PLAYER ? '#44f' : 
                   entity.type === EntityType.ZOMBIE ? '#f44' : '#888';
    
    ctx.fillRect(drawX, drawY, drawSize, drawSize);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(drawX, drawY, drawSize, drawSize);
  },

  /**
   * Render health bar above entity
   */
  renderHealthBar: (ctx, entity, x, y, tileSize) => {
    const barWidth = tileSize * 0.8;
    const barHeight = 4;
    const barX = x + (tileSize - barWidth) / 2;
    const barY = y - 6;

    const hpPercent = Math.max(0, entity.hp / entity.maxHp);

    // Border/Background (Black)
    ctx.fillStyle = '#000';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Inner Background (Dark Red)
    ctx.fillStyle = '#600';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Foreground (Green/Yellow/Red)
    ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }
};
