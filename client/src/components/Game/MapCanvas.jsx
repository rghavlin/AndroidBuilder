import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { useCamera } from '../../contexts/CameraContext.jsx';
import { imageLoader } from '../../game/utils/ImageLoader.js';

/**
 * MapCanvas - Visual map rendering system for tile-based display
 * Renders the game map with proper terrain colors and entity positioning
 * Phase 1: Now uses direct sub-context access instead of useGame() aggregation
 */
export default function MapCanvas() {
  const canvasRef = useRef(null);

  // Phase 1: Direct sub-context access (no more useGame() aggregation)
  const { isInitialized } = useGame(); // Only initialization state from GameContext
  const { playerRef, playerRenderPosition, isMoving: isAnimatingMovement, playerFieldOfView, startAnimatedMovement } = usePlayer();
  const { gameMapRef, handleTileClick, handleTileHover, hoveredTile } = useGameMap();
  const { cameraRef } = useCamera();
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);


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
  const renderEntity = useCallback((ctx, entity, pixelX, pixelY, tileSize) => {
    // Try to get cached image for this entity
    // For player entities, don't use name as subtype since it's just the player's name
    const subtype = entity.type === 'player' ? null : (entity.subtype || entity.name);
    const subtypeImageKey = subtype ? `${entity.type}_${subtype}` : entity.type;
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
  }, []);

  // Default entity rendering (current system)
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
            tileSize * 3/4,
            tileSize * 3/4
          );
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3/4,
            tileSize * 3/4
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
  }, []);

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
            renderEntity(ctx, player, pixelX, pixelY, tileSize);
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
                  renderEntity(ctx, entity, pixelX, pixelY + offsetY, tileSize);
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
          renderEntity(ctx, player, smoothPixelX, smoothPixelY, tileSize);
        }
      }
    } catch (error) {
      console.error('[MapCanvas] Error rendering map:', error);
    }
  }, [gameMapRef.current, isInitialized, calculateTileSize, terrainColors, hoveredTile, playerRef.current, cameraRef.current]);

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
      const worldPos = camera.screenToWorld(screenTileX, screenTileY);

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

  // Handle canvas click events
  const handleCanvasClick = useCallback((event) => {
    const gameMap = gameMapRef.current;
    const camera = cameraRef.current;
    const player = playerRef.current;

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
      const worldPos = camera.screenToWorld(screenTileX, screenTileY);

      // Validate coordinates and trigger tile click
      if (worldPos.x >= 0 && worldPos.x < gameMap.width &&
          worldPos.y >= 0 && worldPos.y < gameMap.height) {
        // Call GameMapContext handleTileClick with required parameters
        // Use direct context access - handleTileClick expects these parameters:
        // (x, y, player, camera, isPlayerTurn, isMoving, isAutosaving, startAnimatedMovement)
        handleTileClick(worldPos.x, worldPos.y, player, camera, true, isAnimatingMovement, false, startAnimatedMovement);
      } else {
        console.log('[MapCanvas] Click outside valid map bounds');
      }
    } catch (error) {
      console.error('[MapCanvas] Error handling canvas click:', error);
    }
  }, [gameMapRef, handleTileClick, calculateTileSize, cameraRef, isDragging, playerRef, isAnimatingMovement, startAnimatedMovement]);

  // Preload entity images on initialization
  useEffect(() => {
    const preloadEntityImages = async () => {
      const commonEntityTypes = ['player', 'zombie', 'item', 'npc'];
      await imageLoader.preloadImages(commonEntityTypes);
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
  }, [renderMap, isInitialized, gameMapRef, cameraRef, hoveredTile, imagesLoaded, playerRenderPosition, isAnimatingMovement, playerFieldOfView]);

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
        className={`${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleCanvasHover}
        style={{
          imageRendering: 'crisp-edges', // Sharp pixel rendering
          display: 'block',
          width: '100%',
          height: '100%',
          padding: 0,
          margin: 0,
          border: 'none'
        }}
      />
    </div>
  );
}