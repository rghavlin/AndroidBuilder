/**
 * EntityRenderer - Pure functions for drawing world entities (Players, NPCs, Items)
 */
import { imageLoader } from '../../game/utils/ImageLoader.js';
import { EntityType } from '../entities/Entity.js';
import { getZombieType } from '../entities/ZombieTypes.js';
import { ItemDefs } from '../inventory/ItemDefs.js';

export const EntityRenderer = {
  renderEntity: (ctx, entity, tileSize, sprites, visibilitySet, isExplored, engine, currentTime = performance.now(), isGlobalAnimating = false) => {
    // Reset globalAlpha to ensure state from previous entity draws doesn't leak
    ctx.globalAlpha = 1.0;

    if (!isExplored) return;

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
        // Only anchor to path-start if it's reasonably close (prevents stale path ghosting)
        // PHASE 19 FIX: Increased threshold to 100 and added isGlobalAnimating check to prevent "destination flash" 
        // during long zombie moves before they officially begin their animation loop.
        const distToPathStart = Math.abs(entity.x - entity.movementPath[0].x) + Math.abs(entity.y - entity.movementPath[0].y);
        if (isGlobalAnimating || distToPathStart <= 100.0) {
          renderX = entity.movementPath[0].x;
          renderY = entity.movementPath[0].y;
        } else {
          renderX = entity.x;
          renderY = entity.y;
        }
      }
    }

    // 2. Visibility Filtering (Fog of War vs Line of Sight)
    const isPersistent = ['door', 'window', 'place_icon', 'item'].includes(entity.type);
    
    // PERFORM VISUAL LOS CHECK BASED ON RENDER COORDS
    const visualX = Math.round(renderX);
    const visualY = Math.round(renderY);
    const isVisible = visibilitySet.has(`${visualX},${visualY}`);

    // Transient entities (zombies, rabbits) are ONLY visible if in active LOS
    if (!isVisible && !isPersistent) return;

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
      const subtype = entity.type === EntityType.PLAYER ? null : (entity.subtype || 'basic');
      
      // Phase 27: Priority for Image Mapping
      // 1. If it's an Item with an explicit imageId, use it (canonical)
      // 2. If it's an item subtype with a definition, use that definition's imageId
      // 3. Fallback to subtype itself
      let effectiveImageId = subtype;
      if (entity.type === 'item') {
        effectiveImageId = entity.imageId || (ItemDefs[subtype]?.imageId) || subtype;
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

        // PHASE 15 Fix: Scale loot drops to 2/3 size and center them
        // Metadata driven: check if the item is marked as full-tile
        const isFullTileItem = entity.renderFullTile || 
                               ItemDefs[entity.subtype]?.renderFullTile || 
                               (entity.type === 'item' && Object.values(ItemDefs).some(d => d.imageId === entity.subtype && d.renderFullTile));
        
        if (entity.type === 'item' && !isFullTileItem) {
          drawSize = tileSize * (2 / 3);
          drawX = screenX + (tileSize - drawSize) / 2;
          drawY = screenY + (tileSize - drawSize) / 2;
        }

        ctx.drawImage(sprite, drawX, drawY, drawSize, drawSize);
        
        // Square 'Picture Frame' for Player and Zombies
        if (entity.type === EntityType.PLAYER || entity.type === EntityType.ZOMBIE) {
          ctx.save();
          ctx.strokeStyle = '#333'; // Very thin dark frame
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX, screenY, tileSize, tileSize);
          ctx.restore();
        }
      } else {
        EntityRenderer.renderDefaultSquare(ctx, entity, screenX, screenY, tileSize);
      }
    }

    // 3. Health Bars (Show if damaged, excluding structural obstacles)
    const isWounded = entity.hp !== undefined && entity.maxHp !== undefined && entity.hp < entity.maxHp;
    const isStructural = entity.type === EntityType.DOOR || entity.type === EntityType.WINDOW;
    if (isVisible && isWounded && !isStructural) {
      EntityRenderer.renderHealthBar(ctx, entity, screenX, screenY, tileSize);
    }

    ctx.globalAlpha = 1.0;
  },

  drawDoor: (ctx, entity, x, y, tileSize) => {
    const doorColor = '#999999'; // Slightly brighter to stand out in fog
    ctx.strokeStyle = doorColor;
    ctx.lineWidth = 3;
    const margin = tileSize / 8;

    if (entity.visualIsOpen === true) {
      ctx.strokeRect(x + margin, y + margin, tileSize - margin * 2, tileSize - margin * 2);
    } else {
      ctx.fillStyle = doorColor;
      ctx.fillRect(x + margin, y + margin, tileSize - margin * 2, tileSize - margin * 2);
      ctx.strokeStyle = '#555555';
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

    if (entity.subtype === 'broken') {
      ctx.beginPath();
      ctx.moveTo(x + margin, y + margin);
      ctx.lineTo(x + margin + w * 0.5, y + margin + w * 0.1);
      ctx.lineTo(x + margin + w, y + margin);
      ctx.lineTo(x + margin + w * 0.9, y + margin + w * 0.6);
      ctx.lineTo(x + margin + w, y + margin + w);
      ctx.lineTo(x + margin, y + margin + w);
      ctx.closePath();
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
      ctx.stroke();
      ctx.stroke();
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
   * Simple square fallback for missing sprites
   */
  renderDefaultSquare: (ctx, entity, x, y, tileSize) => {
    ctx.fillStyle = entity.type === EntityType.PLAYER ? '#44f' : 
                   entity.type === EntityType.ZOMBIE ? '#f44' : '#888';
    
    ctx.fillRect(x, y, tileSize, tileSize);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, tileSize, tileSize);
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
