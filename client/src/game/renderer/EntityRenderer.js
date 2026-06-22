/**
 * EntityRenderer - Pure functions for drawing world entities (Players, NPCs, Items)
 */
import { imageLoader } from '../../game/utils/ImageLoader.js';
import { EntityType } from '../entities/Entity.js';
import { getZombieType } from '../entities/ZombieTypes.js';
import { ItemDefs } from '../inventory/ItemDefs.js';

let tempCanvas = null;
let tempCtx = null;

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
  if (entity.defId === 'placeable.auto_turret' && entity.isOn) return entity;
  const grid = entity.containerGrid || (typeof entity.getContainerGrid === 'function' ? entity.getContainerGrid() : null);
  if (grid && grid.items) {
    const items = grid.items instanceof Map
      ? Array.from(grid.items.values())
      : (Array.isArray(grid.items) ? grid.items : Object.values(grid.items));
    for (const it of items) {
      if (it && it.defId === 'placeable.auto_turret' && it.isOn) return it;
    }
  }
  return null;
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
          const tileItems = engine.gameMap.getItemsOnTile(Math.round(entity.x), Math.round(entity.y));
          if (tileItems && tileItems.length > 0) {
            let largestItem = null;
            let maxArea = -1;
            for (const item of tileItems) {
              const defId = item.defId || item.id;
              const def = ItemDefs[defId];
              const w = item.width || def?.width || 1;
              const h = item.height || def?.height || 1;
              const area = w * h;
              if (area > maxArea) {
                maxArea = area;
                largestItem = item;
              }
            }
            if (largestItem) {
              const defId = largestItem.defId || largestItem.id;
              const def = ItemDefs[defId];
              effectiveImageId = largestItem.imageId || def?.imageId || defId;
            }
          }
        } else {
          effectiveImageId = entity.imageId || (ItemDefs[subtype]?.imageId) || subtype;
        }

        // Turret icon priority: a carrier (e.g. a wagon) holding a powered-on
        // turret renders AS the turret — it's the exposed, targetable object on
        // this tile. (Standalone turrets already use the turret image.)
        if (renderTurret && entity.defId !== 'placeable.auto_turret') {
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
        const tileItems = (engine && engine.gameMap) ? engine.gameMap.getItemsOnTile(Math.round(entity.x), Math.round(entity.y)) : [];
        const isCrop = tileItems.some(item => {
          const defId = item.defId || item.id;
          return (defId && (defId.endsWith('_plant') || defId.startsWith('provision.harvestable_'))) || item.isWild || item.isHarvestable;
        });

        // Check if the item on the tile is a piece of furniture or a vehicle
        const hasFurnitureOrVehicle = tileItems.some(item => {
          const defId = item.defId || item.id;
          if (!defId) return false;
          if (defId.startsWith('furniture.') || defId.startsWith('vehicle.')) return true;
          
          const traits = item.traits || [];
          const categories = item.categories || [];
          if (traits.includes('furniture') || traits.includes('vehicle') ||
              categories.includes('furniture') || categories.includes('vehicle')) {
            return true;
          }
          
          const def = ItemDefs[defId];
          if (def) {
            const defTraits = def.traits || [];
            const defCategories = def.categories || [];
            if (defTraits.includes('furniture') || defTraits.includes('vehicle') ||
                defCategories.includes('furniture') || defCategories.includes('vehicle')) {
              return true;
            }
          }
          return false;
        });

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
          let matchingDef = null;
          let isFood = false;
          let isMedical = false;
          
          if (subtype === 'ground_pile' && engine && engine.gameMap) {
            const tileItems = engine.gameMap.getItemsOnTile(Math.round(entity.x), Math.round(entity.y));
            if (tileItems && tileItems.length > 0) {
              let largestItem = null;
              let maxArea = -1;
              for (const item of tileItems) {
                const defId = item.defId || item.id;
                const def = ItemDefs[defId];
                const w = item.width || def?.width || 1;
                const h = item.height || def?.height || 1;
                const area = w * h;
                if (area > maxArea) {
                  maxArea = area;
                  largestItem = item;
                }
              }
              if (largestItem) {
                const defId = largestItem.defId || largestItem.id;
                matchingDef = ItemDefs[defId];
                const cats = largestItem.categories || matchingDef?.categories || [];
                isFood = cats.includes('food');
                isMedical = cats.includes('medical');
              }
            }
          } else {
            const defId = entity.defId || subtype;
            matchingDef = ItemDefs[defId];
            const cats = matchingDef?.categories || [];
            isFood = cats.includes('food');
            isMedical = cats.includes('medical');
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

          const centerX = drawX + drawSize / 2;
          const centerY = drawY + drawSize / 2;
          const radius = drawSize / 2;

          // 1. Draw background circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fillStyle = itemBgColor;
          ctx.fill();
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
          ctx.drawImage(sprite, sX, sY, sSize, sSize);
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
            const t = 0.5 + 0.5 * Math.sin(currentTime / 250); // 0..1
            const lerp = (a, b) => Math.round(a + (b - a) * t);
            // silver (226,232,240) <-> dark electric blue (15,60,180)
            ctx.strokeStyle = `rgb(${lerp(226, 15)}, ${lerp(232, 60)}, ${lerp(240, 180)})`;
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
        if (entity.type === EntityType.PLAYER || entity.type === EntityType.ZOMBIE || entity.type === EntityType.RABBIT) {
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
    const doorColor = isBW ? '#999999' : '#5d4037';
    const strokeColor = isBW ? '#555555' : '#3e2723';
    
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
    } else {
      // Fallback: original centered drawing
      ctx.fillStyle = doorColor;
      ctx.fillRect(x + margin, y + margin, tileSize - margin * 2, tileSize - margin * 2);
      ctx.strokeStyle = strokeColor;
      ctx.strokeRect(x + margin, y + margin, tileSize - margin * 2, tileSize - margin * 2);
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
    
    if (sprite) {
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
