import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { useCamera } from '../../contexts/CameraContext.jsx';
import { useVisualEffects } from '../../contexts/VisualEffectsContext.jsx';
import { imageLoader } from '../../game/utils/ImageLoader.js';

/**
 * MapCanvas - Visual map rendering system for tile-based display
 * Renders the game map with proper terrain colors and entity positioning
 * Phase 1: Now uses direct sub-context access instead of useGame() aggregation
 */
export default function MapCanvas({
  onCellClick = null,
  onCellRightClick = null,
  selectedItem = null,
  isTargeting = false,
  isNight = false,
  isFlashlightOn = false
}) {
  const canvasRef = useRef(null);

  // Phase 1: Direct sub-context access (no more useGame() aggregation)
  const { isInitialized } = useGame(); // Only initialization state from GameContext
  const { playerRef, playerRenderPosition, isMoving: isAnimatingMovement, playerFieldOfView, startAnimatedMovement } = usePlayer();
  const { gameMapRef, handleTileClick, handleTileHover, hoveredTile, mapVersion } = useGameMap();
  const { cameraRef } = useCamera();
  const { effects, addEffect, tick } = useVisualEffects();
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const nextEffectTimeRef = useRef(0);


  // Define terrain colors (Grayscale Retro Palette for fallback)
  const terrainColors = {
    'grass': '#2a2a2a',    // Dark gray (but brighter than before)
    'floor': '#555555',    // Medium gray
    'wall': '#000000',     // Black (for high contrast edges)
    'road': '#333333',     // Asphalt gray
    'sidewalk': '#888888', // Light gray
    'fence': '#444444',    // Dark gray
    'building': '#aaaaaa', // Very light gray (walls)
    'window': '#2c3e50',   // Dark bluish gray (terrain base)
    'water': '#1b3a57',    // Muted slate blue
    'sand': '#cccccc',     // Light silver
    'tree': '#111111',     // Very dark
    'default': '#222222'
  };


  // Entity rendering function with image support
  const renderEntity = useCallback((ctx, entity, pixelX, pixelY, tileSize, currentTime = 0) => {
    // Check for active flicker effects
    if (effects && effects.length > 0) {
      const flickerEffect = effects.find(e => e.type === 'flicker' && e.targetId === entity.id);
      if (flickerEffect) {
        const elapsed = currentTime - flickerEffect.startTime;
        if (elapsed >= 0 && elapsed < flickerEffect.duration) {
          // Flicker every 100ms
          if (Math.floor(elapsed / 100) % 2 === 1) return;
        }
      }
    }

    // Try to get cached image for this entity
    // For player entities, don't use name as subtype since it's just the player's name
    const subtype = entity.type === 'player' ? null : (entity.subtype || entity.name || entity.id);

    // Special case for ground items proxy - use the 'item_default' image
    let subtypeImageKey = subtype ? `${entity.type}_${subtype}` : entity.type;
    
    // Special mapping for Crawler zombies (Phase 6)
    if (entity.type === 'zombie' && entity.subtype === 'crawler') {
      subtypeImageKey = 'crawlerzombie';
    }

    // Special mapping for Firefighter zombies
    if (entity.type === 'zombie' && entity.subtype === 'firefighter') {
      subtypeImageKey = 'firefighterzombie';
    }

    // Special mapping for Runner zombies
    if (entity.type === 'zombie' && entity.subtype === 'runner') {
      subtypeImageKey = 'runnerzombie';
    }

    // Special mapping for Acid zombies
    if (entity.type === 'zombie' && entity.subtype === 'acid') {
      subtypeImageKey = 'acidzombie';
    }

    // Special mapping for SWAT zombies
    if (entity.type === 'zombie' && entity.subtype === 'swat') {
      subtypeImageKey = 'swatzombie';
    }

    // Special mapping for Fat zombies
    if (entity.type === 'zombie' && entity.subtype === 'fat') {
      subtypeImageKey = 'fatzombie';
    }

    // Special mapping for ground piles
    // Must match the cache key used by ImageLoader.getItemImage(), which prefixes with 'item_'
    if (entity.type === 'item' && entity.subtype === 'ground_pile') {
      subtypeImageKey = 'item_default';
    }

    const baseImageKey = entity.type;
    let cachedImage = imageLoader.imageCache.get(subtypeImageKey);

    // Trigger load if not in cache
    if (cachedImage === undefined) {
       imageLoader.getImage(entity.type, entity.subtype).then(() => {
          // Re-render handled by MapCanvas frame loop
       }).catch(err => {
          // Silent catch for missing assets
       });
    }

    if (!cachedImage) {
      cachedImage = imageLoader.imageCache.get(baseImageKey);
    }

    if (cachedImage) {
      // Render with cached image
      let entitySize = (tileSize * 0.8);
      if (entity.type === 'item') {
        entitySize = tileSize / 2;
      } else if (entity.type === 'place_icon') {
        entitySize = tileSize;
      }
      
      const offsetX = (tileSize - entitySize) / 2;
      const offsetY = (tileSize - entitySize) / 2;

      ctx.drawImage(
        cachedImage,
        pixelX + offsetX,
        pixelY + offsetY,
        entitySize,
        entitySize
      );
    } else {
      // Fallback to default shapes (image not loaded or failed to load)
      renderEntityDefault(ctx, entity, pixelX, pixelY, tileSize);
    }

    // Add Zombie HP bars (Phase 6)
    if (entity.type === 'zombie' && entity.hp !== undefined && entity.maxHp !== undefined) {
      // Draw HP bar above the entity within the tile
      const barWidth = tileSize * 0.7;
      const barHeight = Math.max(2, tileSize / 16);
      const barX = pixelX + (tileSize - barWidth) / 2;
      const barY = pixelY + (tileSize * 0.1); // 10% from the top

      // Background (gray/semi-transparent)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Foreground (HP amount)
      const hpPercent = Math.max(0, Math.min(1, entity.hp / entity.maxHp));
      
      // Color coded by health
      if (hpPercent > 0.6) ctx.fillStyle = '#22c55e'; // Green (emerald-500)
      else if (hpPercent > 0.25) ctx.fillStyle = '#f59e0b'; // Amber (amber-500)
      else ctx.fillStyle = '#ef4444'; // Red (red-500)

      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

      // Optional: Add a subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  }, [effects]); // Added effects to dependency array

  // Get color for different item types
  const getItemColor = useCallback((itemType) => {
    const itemColors = {
      'weapon': '#ef4444',     // Red
      'ammo': '#f59e0b',       // Orange
      'food': '#10b981',       // Green
      'medicine': '#3b82f6',   // Blue
      'tool': '#6b7280',       // Gray
      'key': '#fbbf24',        // Yellow
      'book': '#8b5cf6',       // Purple
      'clothing': '#ec4899',   // Pink
      'container': '#92400e',  // Brown
    };

    return itemColors[itemType] || '#fbbf24'; // Default yellow
  }, []);

  const renderEntityDefault = useCallback((ctx, entity, pixelX, pixelY, tileSize) => {
    switch (entity.type) {
      case 'player':
        // Draw player as blue circle
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(
          pixelX + tileSize / 2,
          pixelY + tileSize / 2,
          tileSize / 3,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // Player border
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'zombie':
        // Draw zombie as red circle
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(
          pixelX + tileSize / 2,
          pixelY + tileSize / 2,
          tileSize / 3,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // Zombie border
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add zombie sight range indicator if it's their turn
        if (entity.isActive) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(
            pixelX + tileSize / 2,
            pixelY + tileSize / 2,
            entity.sightRange * tileSize,
            0,
            2 * Math.PI
          );
          ctx.stroke();
        }
        break;

      case 'item':
        // Draw items as small colored squares
        const itemSize = tileSize / 4;
        const itemX = pixelX + tileSize / 2 - itemSize / 2;
        const itemY = pixelY + tileSize / 2 - itemSize / 2;

        // Color based on item subtype or default yellow
        const itemColor = getItemColor(entity.subtype || entity.name);
        ctx.fillStyle = itemColor;
        ctx.fillRect(itemX, itemY, itemSize, itemSize);

        // Item border
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1;
        ctx.strokeRect(itemX, itemY, itemSize, itemSize);
        break;

      case 'npc':
        // Draw NPC as green circle
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(
          pixelX + tileSize / 2,
          pixelY + tileSize / 2,
          tileSize / 3,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // NPC border
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'test':
        // Draw test entities based on subtype
        if (entity.subtype === 'obstacle') {
          // Draw obstacle as dark red square (blocks sight)
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3 / 4,
            tileSize * 3 / 4
          );
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3 / 4,
            tileSize * 3 / 4
          );
        } else {
          // Draw other test entities as purple diamonds
          ctx.fillStyle = '#7c3aed';
          ctx.save();
          ctx.translate(pixelX + tileSize / 2, pixelY + tileSize / 2);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-tileSize / 6, -tileSize / 6, tileSize / 3, tileSize / 3);
          ctx.restore();
        }
        break;

      case 'door':
        // Brownish-gray color for doors
        const doorColor = '#8b7355';
        ctx.strokeStyle = doorColor;
        ctx.lineWidth = 3;

        if (entity.isOpen) {
          // Open door: brownish-gray outline
          ctx.strokeRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3 / 4,
            tileSize * 3 / 4
          );
        } else {
          // Closed door: solid brownish-gray square
          ctx.fillStyle = doorColor;
          ctx.fillRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3 / 4,
            tileSize * 3 / 4
          );
          // Darker border for closed door
          ctx.strokeStyle = '#5d4d3a';
          ctx.strokeRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3 / 4,
            tileSize * 3 / 4
          );
        }
        break;

      case 'window':
        // Bluish transparent color for windows
        const windowColor = 'rgba(52, 152, 219, 0.4)';
        const frameColor = '#2980b9';
        
        ctx.strokeStyle = frameColor;
        ctx.lineWidth = 2;

        if (entity.isBroken) {
          // Broken window: jagged jagged frame
          ctx.beginPath();
          const margin = tileSize / 8;
          const left = pixelX + margin;
          const top = pixelY + margin;
          const right = pixelX + tileSize - margin;
          const bottom = pixelY + tileSize - margin;
          
          // Jagged outline
          ctx.moveTo(left, top);
          ctx.lineTo(left + (right-left)*0.3, top + (bottom-top)*0.1);
          ctx.lineTo(left + (right-left)*0.5, top - (bottom-top)*0.05);
          ctx.lineTo(left + (right-left)*0.7, top + (bottom-top)*0.15);
          ctx.lineTo(right, top);
          ctx.lineTo(right - (right-left)*0.1, top + (bottom-top)*0.4);
          ctx.lineTo(right + (right-left)*0.05, top + (bottom-top)*0.6);
          ctx.lineTo(right, bottom);
          ctx.lineTo(right - (right-left)*0.4, bottom - (bottom-top)*0.1);
          ctx.lineTo(left, bottom);
          ctx.lineTo(left + (right-left)*0.1, bottom - (bottom-top)*0.5);
          ctx.closePath();
          ctx.stroke();
          
          // Some "glass fragments" inside
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.moveTo(left + (right-left)*0.2, top + (bottom-top)*0.3);
          ctx.lineTo(left + (right-left)*0.3, top + (bottom-top)*0.2);
          ctx.lineTo(left + (right-left)*0.4, top + (bottom-top)*0.35);
          ctx.fill();
        } else if (entity.isOpen) {
          // Open window: simple frame
          ctx.strokeRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3 / 4,
            tileSize * 3 / 4
          );
        } else {
          // Closed window: bluish square
          ctx.fillStyle = windowColor;
          ctx.fillRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3 / 4,
            tileSize * 3 / 4
          );
          ctx.strokeRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3 / 4,
            tileSize * 3 / 4
          );
        }
        break;

      default:
        // Unknown entity - gray square
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(
          pixelX + tileSize / 4,
          pixelY + tileSize / 4,
          tileSize / 2,
          tileSize / 2
        );
        break;
    }
  }, [getItemColor]);

  // Render visual effects
  const renderEffect = useCallback((ctx, effect, camera, tileSize, currentTime) => {
    const elapsed = currentTime - effect.startTime;
    const progress = elapsed / effect.duration;

    if (progress > 1) return; // Effect has ended

    const screenPos = camera.worldToScreen(effect.x, effect.y);
    const pixelX = screenPos.x * tileSize;
    const pixelY = screenPos.y * tileSize;

    switch (effect.type) {
      case 'damage':
        {
          const startY = pixelY + tileSize / 2;
          const endY = startY - tileSize; // Move upwards
          const currentY = startY - (endY - startY) * progress;
          const opacity = 1 - progress;

          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.fillStyle = effect.color;
          ctx.font = `${Math.floor(tileSize / 2)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const valueText = typeof effect.value === 'number' ? `-${effect.value}` : effect.value;
          ctx.fillText(valueText, pixelX + tileSize / 2, currentY);
          ctx.restore();
        }
        break;
      case 'tile_flash':
        {
          const opacity = (1 - progress) * 0.6; // Fade out from 60% opacity
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.fillStyle = effect.color;
          ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
          ctx.restore();
        }
        break;
      case 'flicker':
        // Flicker effect is handled in renderEntity, no direct rendering here
        break;
      default:
        break;
    }
  }, []);

  // Calculate responsive tile size based on container
  const calculateTileSize = useCallback((containerWidth, containerHeight) => {
    //const minTileSize = 16;  // Reduced minimum
    const minTileSize = 48;  // Increased minimum
    const maxTileSize = 200; // Increased maximum
    //return 48; // Fixed size for now

    // Calculate optimal tile size to fit 20x20 grid with minimal padding
    const availableWidth = containerWidth - 10; // Even less padding
    const availableHeight = containerHeight - 10;

    const tileWidthSize = Math.floor(availableWidth / 20);
    const tileHeightSize = Math.floor(availableHeight / 20);

    // Use the smaller dimension to ensure square tiles that fit
    const optimalSize = Math.min(tileWidthSize, tileHeightSize);

    // Clamp between min and max, but prefer larger tiles when space allows
    const finalSize = Math.max(minTileSize, Math.min(maxTileSize, optimalSize));

    return finalSize;
  }, []);

  // Render the map on canvas
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    const gameMap = gameMapRef.current;
    const camera = cameraRef.current;
    const player = playerRef.current;

    if (!canvas || !gameMap || !isInitialized || !camera) {
      console.log('[MapCanvas] Skipping render - missing requirements');
      return;
    }

    try {
      const ctx = canvas.getContext('2d');
      const containerRect = canvas.parentElement.getBoundingClientRect();

      // Calculate base tile size and adjust for zoom
      const baseTileSize = calculateTileSize(containerRect.width, containerRect.height);
      const tileSize = baseTileSize * camera.zoomLevel;

      // Use full container dimensions for canvas (ensure no gaps)
      const mapWidth = Math.floor(containerRect.width);
      const mapHeight = Math.floor(containerRect.height);

      // Set canvas size to fill container completely with no gaps
      canvas.width = mapWidth;
      canvas.height = mapHeight;
      canvas.style.width = `${mapWidth}px`;
      canvas.style.height = `${mapHeight}px`;

      // Update camera viewport size based on actual canvas dimensions
      // Use base tile size (without zoom) for viewport calculations
      camera.updateViewportSize(mapWidth, mapHeight, baseTileSize);

      // Clear canvas - match game controls background (--card color)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, mapWidth, mapHeight);

      // Get visible tile bounds from camera and extend them to fill canvas completely
      const visibleTiles = camera.getVisibleTiles();

      // Calculate how many extra tiles we need to ensure full canvas coverage
      const extraTiles = Math.ceil(2 / camera.zoomLevel) + 1; // More tiles when zoomed out

      // Extend the rendering area beyond visible tiles to eliminate any borders
      const extendedBounds = {
        startX: Math.max(0, visibleTiles.startX - extraTiles),
        endX: Math.min(gameMap.width - 1, visibleTiles.endX + extraTiles),
        startY: Math.max(0, visibleTiles.startY - extraTiles),
        endY: Math.min(gameMap.height - 1, visibleTiles.endY + extraTiles)
      };

      // Render extended area to ensure full canvas coverage
      for (let worldY = extendedBounds.startY; worldY <= extendedBounds.endY; worldY++) {
        for (let worldX = extendedBounds.startX; worldX <= extendedBounds.endX; worldX++) {
          const tile = gameMap.getTile(worldX, worldY);
          if (!tile) continue;

          // Convert world coordinates to screen coordinates
          const screenPos = camera.worldToScreen(worldX, worldY);
          const pixelX = screenPos.x * tileSize;
          const pixelY = screenPos.y * tileSize;

          // --- FOG OF WAR LOGIC ---
          const isExplored = tile.flags && tile.flags.explored;
          const isCurrentlyVisible = playerFieldOfView && playerFieldOfView.some(visibleTile =>
            visibleTile.x === worldX && visibleTile.y === worldY
          );

          if (!isExplored) {
            // Unexplored: Solid black
            ctx.fillStyle = '#000000';
            ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
            continue; // Skip rest of tile rendering
          }

          // Map Tile Rendering (with Image Load Fallback)
          let tileImage = imageLoader.imageCache.get(`tile_${tile.terrain}`);
          
          if (tileImage === undefined) {
             // Trigger load if not in cache (will re-render via frame loop when ready)
             imageLoader.getTileImage(tile.terrain).catch(() => {});
          }

          if (tileImage) {
             // Draw tile texture
             ctx.drawImage(tileImage, pixelX, pixelY, tileSize, tileSize);
          } else {
             // Fill tile with solid grayscale terrain color fallback
             ctx.fillStyle = terrainColors[tile.terrain] || terrainColors.default;
             ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
          }

          // Draw tile border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);

          // Highlight hovered tile (on any explored tile)
          if (isExplored && hoveredTile && hoveredTile.x === worldX && hoveredTile.y === worldY && player) {
            const canAfford = hoveredTile.canAfford;

            // Hover highlight
            ctx.fillStyle = canAfford ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            ctx.fillRect(pixelX, pixelY, tileSize, tileSize);

            // AP cost text
            ctx.fillStyle = '#ffffff'; // White text
            ctx.font = `bold ${Math.floor(tileSize / 3)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(
              hoveredTile.apCost.toFixed(1),
              pixelX + tileSize / 2,
              pixelY + tileSize / 2 + Math.floor(tileSize / 8)
            );
          }

          // Render entities on this tile (except player)
          if (tile.contents && tile.contents.length > 0) {
            // Pass 1: Background/Persistent entities (Loot, Doors)
            tile.contents.forEach((entity, index) => {
              if (entity.type !== 'item' && entity.type !== 'door') return;
              if (isExplored) {
                const offsetY = index * (tileSize / 8);
                renderEntity(ctx, entity, pixelX, pixelY + offsetY, tileSize, performance.now());
              }
            });

            // Pass 2: Foreground entities (Zombies, NPCs, etc.)
            tile.contents.forEach((entity, index) => {
              if (entity.type === 'player' || entity.type === 'item' || entity.type === 'door') return;
              if (isCurrentlyVisible) {
                const offsetY = index * (tileSize / 8);
                renderEntity(ctx, entity, pixelX, pixelY + offsetY, tileSize, performance.now());
              }
            });
          }

          // Apply "Fog" (dimming) for explored but NOT currently visible tiles
          if (isExplored && !isCurrentlyVisible) {
            ctx.fillStyle = isNight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.25)'; // Much lighter fog during day
            ctx.fillRect(pixelX, pixelY, tileSize, tileSize);

            // Add more prominent border for building/wall tiles in fog
            if (tile.terrain === 'building' || tile.terrain === 'wall') {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = 1;
              ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);
            }
          }

          // Light blue tint for visible tiles (excluding player tile)
          if (isCurrentlyVisible && player && !(worldX === player.x && worldY === player.y)) {
            // Light blue tint for visible tiles
            ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
            ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
          }

          // Render player on TOP of other entities
          if (player && !isAnimatingMovement && player.x === worldX && player.y === worldY) {
            renderEntity(ctx, player, pixelX, pixelY, tileSize, performance.now());
          }
        }
      }



      // Render player with smooth animation if moving
      if (player && isAnimatingMovement) {
        // Convert smooth world coordinates to screen coordinates
        const screenPos = camera.worldToScreen(playerRenderPosition.x, playerRenderPosition.y);
        const smoothPixelX = screenPos.x * tileSize;
        const smoothPixelY = screenPos.y * tileSize;

        // Only render if player is visible on screen
        if (smoothPixelX >= -tileSize && smoothPixelX <= mapWidth &&
          smoothPixelY >= -tileSize && smoothPixelY <= mapHeight) {
          renderEntity(ctx, player, smoothPixelX, smoothPixelY, tileSize, performance.now());
        }
      }

      // Render visual effects
      if (effects && effects.length > 0) {
        const currentTime = performance.now();
        effects.forEach(effect => {
          renderEffect(ctx, effect, camera, tileSize, currentTime);
        });
      }
    } catch (error) {
      console.error('[MapCanvas] Error rendering map:', error);
    }
  }, [gameMapRef.current, isInitialized, calculateTileSize, terrainColors, hoveredTile, playerRef.current, cameraRef.current, effects, renderEffect, renderEntity, isNight, isFlashlightOn]); // Add light state to dependencies

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((event) => {
    const startPos = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
    setLastMousePos(startPos);
    setDragStartPos(startPos);
    setHasDragged(false);
  }, []);

  // Handle canvas hover events
  // This function is now correctly placed and its call in handleMouseMove is conditional
  const handleCanvasHover = useCallback((event) => {
    const gameMap = gameMapRef.current;
    const camera = cameraRef.current;
    const player = playerRef.current;

    if (!gameMap || !camera) return;

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const containerRect = canvas.parentElement.getBoundingClientRect();

      const baseTileSize = calculateTileSize(containerRect.width, containerRect.height);
      const tileSize = baseTileSize * camera.zoomLevel;

      // Calculate hovered pixel coordinates
      const hoverX = event.clientX - rect.left;
      const hoverY = event.clientY - rect.top;

      // Convert pixel coordinates to screen tile coordinates (accounting for zoom)
      const screenTileX = hoverX / tileSize;
      const screenTileY = hoverY / tileSize;

      // Convert screen coordinates to world coordinates using camera
      let worldPos = camera.screenToWorld(screenTileX, screenTileY);
      worldPos = { x: Math.floor(worldPos.x), y: Math.floor(worldPos.y) };

      // Store hovered position for rendering - Fix: pass player parameter
      if (worldPos.x >= 0 && worldPos.x < gameMap.width &&
        worldPos.y >= 0 && worldPos.y < gameMap.height) {
        handleTileHover(worldPos.x, worldPos.y, player, isNight, isFlashlightOn);
      }
    } catch (error) {
      console.warn('[MapCanvas] Error handling tile hover:', error);
    }
  }, [gameMapRef, cameraRef, playerRef, handleTileHover, calculateTileSize, isNight, isFlashlightOn]);

  // Handle mouse move for panning
  const handleMouseMove = useCallback((event) => {
    const camera = cameraRef.current;

    if (isDragging && camera) {
      const deltaX = lastMousePos.x - event.clientX;
      const deltaY = lastMousePos.y - event.clientY;

      // Check if we've moved enough to consider this a drag (minimum 5 pixels)
      const totalDistance = Math.sqrt(
        Math.pow(event.clientX - dragStartPos.x, 2) +
        Math.pow(event.clientY - dragStartPos.y, 2)
      );

      if (totalDistance > 5) {
        setHasDragged(true);
      }

      // Convert pixel movement to tile movement
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const containerRect = canvas.parentElement.getBoundingClientRect();
      const baseTileSize = calculateTileSize(containerRect.width, containerRect.height);
      const tileSize = baseTileSize * camera.zoomLevel;

      const tileDeltaX = Math.round(deltaX / tileSize);
      const tileDeltaY = Math.round(deltaY / tileSize);

      if (tileDeltaX !== 0 || tileDeltaY !== 0) {
        if (camera.pan) {
          camera.pan(tileDeltaX, tileDeltaY);
        }
        setLastMousePos({ x: event.clientX, y: event.clientY });
        renderMap();
      }
    } else if (!isDragging) { // Only call handleCanvasHover if not currently dragging
      // Handle hover when not dragging - independent of player turn guards
      handleCanvasHover(event);
    }
  }, [isDragging, lastMousePos, dragStartPos, cameraRef, calculateTileSize, renderMap, handleCanvasHover]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Reset drag state after a brief delay to prevent immediate clicks
    setTimeout(() => {
      setHasDragged(false);
    }, 50);
  }, []);

  // Handle mousewheel zoom
  const handleWheel = useCallback((event) => {
    if (!cameraRef.current) return; // Use cameraRef.current directly here

    event.preventDefault(); // Prevent page scrolling

    const zoomFactor = 1.1; // 10% zoom increment
    const camera = cameraRef.current; // Get camera instance

    if (event.deltaY < 0) {
      // Scroll up - zoom in
      camera.zoomIn(zoomFactor);
    } else {
      // Scroll down - zoom out
      camera.zoomOut(zoomFactor);
    }

    // Re-render the map with new zoom level
    renderMap();
  }, [renderMap, cameraRef]); // Include cameraRef in dependencies

  // Handle canvas click events (left click)
  const handleCanvasClick = useCallback((event) => {
    const gameMap = gameMapRef.current;
    const camera = cameraRef.current;
    const player = playerRef.current;

    // Block all map clicks when an item is selected for inventory movement
    if (selectedItem) {
      console.debug('[MapCanvas] Map click blocked - item selected for inventory movement');
      return;
    }

    if (!gameMap || !camera || isDragging || hasDragged) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const containerRect = canvas.parentElement.getBoundingClientRect();

      const baseTileSize = calculateTileSize(containerRect.width, containerRect.height);
      const tileSize = baseTileSize * camera.zoomLevel;

      // Calculate clicked pixel coordinates
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      // Convert pixel coordinates to screen tile coordinates (accounting for zoom)
      const screenTileX = clickX / tileSize;
      const screenTileY = clickY / tileSize;

      // Convert screen coordinates to world coordinates using camera
      let worldPos = camera.screenToWorld(screenTileX, screenTileY);
      worldPos = { x: Math.floor(worldPos.x), y: Math.floor(worldPos.y) };

      // Validate coordinates and trigger tile click
      if (worldPos.x >= 0 && worldPos.x < gameMap.width &&
        worldPos.y >= 0 && worldPos.y < gameMap.height) {

        // Pass click to MapInterface handler first (handles targeting, selection etc)
        const handled = onCellClick && onCellClick(worldPos.x, worldPos.y);

        // Only trigger movement if the click wasn't handled by MapInterface
        if (!handled) {
          // Call GameMapContext handleTileClick with required parameters
          handleTileClick(worldPos.x, worldPos.y, player, camera, true, isAnimatingMovement, false, startAnimatedMovement, isNight, isFlashlightOn);
        }
      } else {
        console.log('[MapCanvas] Click outside valid map bounds');
      }
    } catch (error) {
      console.error('[MapCanvas] Error handling canvas click:', error);
    }
  }, [gameMapRef, handleTileClick, calculateTileSize, cameraRef, isDragging, playerRef, isAnimatingMovement, startAnimatedMovement, onCellClick, selectedItem, hasDragged]);

  // Handle canvas context menu (right click)
  const handleCanvasContextMenu = useCallback((event) => {
    event.preventDefault(); // Prevent standard browser menu

    const gameMap = gameMapRef.current;
    const camera = cameraRef.current;

    if (!gameMap || !camera || !onCellRightClick) return;

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const containerRect = canvas.parentElement.getBoundingClientRect();

      const baseTileSize = calculateTileSize(containerRect.width, containerRect.height);
      const tileSize = baseTileSize * camera.zoomLevel;

      // Calculate clicked pixel coordinates
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      // Convert pixel coordinates to screen tile coordinates
      const screenTileX = clickX / tileSize;
      const screenTileY = clickY / tileSize;

      // Convert screen coordinates to world coordinates
      let worldPos = camera.screenToWorld(screenTileX, screenTileY);
      worldPos = { x: Math.floor(worldPos.x), y: Math.floor(worldPos.y) };

      // Validate coordinates and trigger right click
      if (worldPos.x >= 0 && worldPos.x < gameMap.width &&
        worldPos.y >= 0 && worldPos.y < gameMap.height) {
        onCellRightClick(worldPos.x, worldPos.y, event.clientX, event.clientY);
      }
    } catch (error) {
      console.error('[MapCanvas] Error handling context menu:', error);
    }
  }, [gameMapRef, cameraRef, calculateTileSize, onCellRightClick]);

  // Setup effect listeners for player actions
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !addEffect) return;

    // Handle damage taken to trigger visual effects
    const handleDamageTaken = (eventData) => {
      console.log('[MapCanvas] damageTaken event received:', eventData);

      const now = performance.now();
      const startTime = Math.max(now, nextEffectTimeRef.current);
      // Stagger multiple attacks by 200ms
      nextEffectTimeRef.current = startTime + 200;

      // Add floating damage number
      addEffect({
        type: 'damage',
        x: player.x,
        y: player.y,
        value: eventData.amount,
        color: '#ef4444',
        duration: 1200,
        startTime: startTime
      });

      // Add red tile flash
      addEffect({
        type: 'tile_flash',
        x: player.x,
        y: player.y,
        color: 'rgba(239, 68, 68, 0.6)',
        duration: 400,
        startTime: startTime
      });

      // Flicker the attacker
      if (eventData.source) {
        addEffect({
          type: 'flicker',
          targetId: eventData.source.id,
          x: eventData.source.x,
          y: eventData.source.y,
          duration: 600, // Slightly longer flicker
          startTime: startTime
        });
      }
    };

    player.on('damageTaken', handleDamageTaken);
    return () => player.off('damageTaken', handleDamageTaken);
  }, [playerRef.current, addEffect]);

  // Preload entity images on initialization
  useEffect(() => {
    const preloadEntityImages = async () => {
      const commonEntityTypes = ['player', 'zombie', 'item', 'npc', 'place_icon'];
      await imageLoader.preloadImages(commonEntityTypes);

      // Preload the default item image for ground piles
      await imageLoader.getItemImage('default');
      
      // Preload special zombie variant images
      await imageLoader.getImage('zombie', 'crawler');
      await imageLoader.getImage('zombie', 'firefighter');
      await imageLoader.getImage('zombie', 'swat');

      setImagesLoaded(true);
    };

    if (isInitialized) {
      preloadEntityImages();
    }
  }, [isInitialized]);

  // Preload specific place icons when map changes
  useEffect(() => {
    if (!isInitialized || !gameMapRef.current) return;

    const loadPlaceIcons = async () => {
      const gameMap = gameMapRef.current;
      const placeIcons = gameMap.getEntitiesByType('place_icon');
      
      if (placeIcons.length === 0) return;

      const subtypes = [...new Set(placeIcons.map(icon => icon.subtype))];
      const loadPromises = subtypes.map(subtype => 
        imageLoader.getImage('place_icon', subtype)
      );

      await Promise.all(loadPromises);
      setImagesLoaded(true);
    };

    loadPlaceIcons();
  }, [isInitialized, mapVersion]);

  // Re-render when game state changes
  useEffect(() => {
    if (isInitialized && gameMapRef.current && cameraRef.current) {
      renderMap();
    }
  }, [renderMap, isInitialized, gameMapRef, cameraRef, hoveredTile, imagesLoaded, playerRenderPosition, isAnimatingMovement, playerFieldOfView, effects, tick, mapVersion, isNight, isFlashlightOn]);

  // Add mouse event listeners for panning and zooming
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleGlobalMouseMove = (event) => handleMouseMove(event);
    const handleGlobalMouseUp = () => handleMouseUp();

    // Add wheel event listener directly to canvas
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleWheel]);

  // Handle window resize for responsive tile sizing
  useEffect(() => {
    const handleResize = () => {
      if (isInitialized && gameMapRef.current && cameraRef.current) {
        renderMap();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderMap, isInitialized, gameMapRef, cameraRef]);




  // Debug logging to identify the issue
  const gameMap = gameMapRef.current;
  const camera = cameraRef.current;
  /*
    console.log('[MapCanvas] Render check:', {
      isInitialized,
      gameMapExists: !!gameMap,
      cameraExists: !!camera,
      gameMapType: typeof gameMap,
      cameraType: typeof camera,
      gameMapWidth: gameMap?.width,
      gameMapHeight: gameMap?.height,
      cameraX: camera?.x,
      cameraY: camera?.y,
      gameMapValue: gameMap,
      cameraValue: camera,
      gameMapIsNull: gameMap === null,
      gameMapIsUndefined: gameMap === undefined,
      cameraIsNull: camera === null,
      cameraIsUndefined: camera === undefined
    });*/

  if (!isInitialized) {
    console.log('[MapCanvas] Not initialized yet');
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Initializing map canvas...</p>
      </div>
    );
  }

  if (!gameMap || !camera) {
    console.log('[MapCanvas] Missing components:', { gameMap: !!gameMap, camera: !!camera });
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Loading game components...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden min-h-0" style={{ padding: 0, margin: 0 }}>
      <canvas
        ref={canvasRef}
        className={`${isTargeting ? 'cursor-crosshair' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasContextMenu}
        onMouseDown={handleMouseDown}
        onMouseMove={handleCanvasHover}
        style={{
          imageRendering: 'crisp-edges', // Sharp pixel rendering
          display: 'block',
          width: '100%',
          height: '100%',
          padding: 0,
          margin: 0,
          border: 'none',
          pointerEvents: selectedItem ? 'none' : 'auto' // Disable all mouse events when item selected
        }}
      />
    </div>
  );
}