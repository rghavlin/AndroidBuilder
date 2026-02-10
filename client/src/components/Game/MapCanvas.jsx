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
  isTargeting = false
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


  // Define terrain colors
  const terrainColors = {
    //'grass': '#4a5d23',    // Dark green
    'grass': '#555555', //test (mid-gray ground)

    //'floor': '#654321',    // Brown
    'floor': '#888888', //test (building floor, lighter interior)

    'wall': '#2c2c2c',     // Dark gray

    //'road': '#404040',     // Medium dark gray
    'road': '#333333',     //test (dark road)

    //'sidewalk': '#6b7280', // Light gray
    'sidewalk': '#777777', //test (medium sidewalk gray)

    //'fence': '#8b6914',    // Brownish gray
    'fence': '#444444', //test (dark gray-brown fence)

    //'building': '#8B4513', // Reddish brown
    'building': '#AAAAAA', //test (light gray building walls)

    'water': '#666666',    //test (mid-gray water)

    'sand': '#999999',     //test (lighter gray for sand, optional)

    'tree': '#555555',      //test (same as ground, placeholder)
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
    if (entity.type === 'item' && entity.subtype === 'ground_pile') {
      subtypeImageKey = 'item_default';
    }

    const baseImageKey = entity.type;

    // Check if subtype-specific image is available, otherwise try base type
    let cachedImage = imageLoader.imageCache.get(subtypeImageKey);
    if (!cachedImage) {
      cachedImage = imageLoader.imageCache.get(baseImageKey);
    }

    if (cachedImage) {
      // Render with cached image
      const entitySize = entity.type === 'item' ? tileSize / 2 : (tileSize * 0.8);
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
      ctx.fillStyle = 'hsl(240, 10%, 10%)'; // Same as card background
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

          // Fill tile with terrain color
          ctx.fillStyle = terrainColors[tile.terrain] || terrainColors.default;
          ctx.fillRect(pixelX, pixelY, tileSize, tileSize);

          // Add tree center for tree terrain
          if (tile.terrain === 'tree') {
            // Draw darker green circle for tree center
            ctx.fillStyle = '#2d4016'; // Darker green
            ctx.beginPath();
            ctx.arc(
              pixelX + tileSize / 2,
              pixelY + tileSize / 2,
              tileSize / 4,
              0,
              2 * Math.PI
            );
            ctx.fill();
          }

          // Draw tile border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);

          // Highlight hovered tile
          if (hoveredTile && hoveredTile.x === worldX && hoveredTile.y === worldY && player) {
            const canAfford = hoveredTile.canAfford;

            // Hover highlight
            ctx.fillStyle = canAfford ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            ctx.fillRect(pixelX, pixelY, tileSize, tileSize);

            // AP cost text
            ctx.fillStyle = canAfford ? '#3b82f6' : '#ef4444';
            ctx.font = `${Math.floor(tileSize / 3)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(
              hoveredTile.apCost.toFixed(1),
              pixelX + tileSize / 2,
              pixelY + tileSize / 2 + Math.floor(tileSize / 8)
            );
          }

          // Render player using smooth position
          if (player && !isAnimatingMovement && player.x === worldX && player.y === worldY) {
            renderEntity(ctx, player, pixelX, pixelY, tileSize, performance.now());
          }

          // Highlight tiles within field of view
          if (player && playerFieldOfView) {
            const isTileVisible = playerFieldOfView.some(visibleTile =>
              visibleTile.x === worldX && visibleTile.y === worldY
            );

            if (isTileVisible && !(worldX === player.x && worldY === player.y)) {
              // Light blue tint for visible tiles
              ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
              ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
            }
          }

          // Render entities on this tile (if tile has contents and tile is visible)
          if (tile.contents && tile.contents.length > 0) {
            // Check if this tile is visible to the player
            const isTileVisible = !playerFieldOfView || playerFieldOfView.some(visibleTile =>
              visibleTile.x === worldX && visibleTile.y === worldY
            );

            if (isTileVisible) {
              tile.contents.forEach((entity, index) => {
                // Skip the player as it's rendered separately
                if (entity.type !== 'player') {
                  const offsetY = index * (tileSize / 8); // Stack entities vertically
                  renderEntity(ctx, entity, pixelX, pixelY + offsetY, tileSize, performance.now());
                }
              });
            }
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
  }, [gameMapRef.current, isInitialized, calculateTileSize, terrainColors, hoveredTile, playerRef.current, cameraRef.current, effects, renderEffect, renderEntity]); // Added renderEntity to dependency array

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
        handleTileHover(worldPos.x, worldPos.y, player);
      }
    } catch (error) {
      console.warn('[MapCanvas] Error handling tile hover:', error);
    }
  }, [gameMapRef, cameraRef, playerRef, handleTileHover, calculateTileSize]);

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
          handleTileClick(worldPos.x, worldPos.y, player, camera, true, isAnimatingMovement, false, startAnimatedMovement);
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
      const commonEntityTypes = ['player', 'zombie', 'item', 'npc'];
      await imageLoader.preloadImages(commonEntityTypes);

      // Preload the default item image for ground piles
      await imageLoader.getItemImage('default');

      setImagesLoaded(true);
    };

    if (isInitialized) {
      preloadEntityImages();
    }
  }, [isInitialized]);

  // Re-render when game state changes
  useEffect(() => {
    if (isInitialized && gameMapRef.current && cameraRef.current) {
      renderMap();
    }
  }, [renderMap, isInitialized, gameMapRef, cameraRef, hoveredTile, imagesLoaded, playerRenderPosition, isAnimatingMovement, playerFieldOfView, effects, tick, mapVersion]);

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