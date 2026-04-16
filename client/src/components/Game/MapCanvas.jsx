import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { useCamera } from '../../contexts/CameraContext.jsx';
import { useVisualEffects } from '../../contexts/VisualEffectsContext.jsx';
import { TileRenderer } from '../../game/renderer/TileRenderer.js';
import { EntityRenderer } from '../../game/renderer/EntityRenderer.js';
import { EffectRenderer } from '../../game/renderer/EffectRenderer.js';
import { imageLoader } from '../../game/utils/ImageLoader.js';
import { EntityType } from '../../game/entities/Entity.js';
import engine from '../../game/GameEngine.js';

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
  isFlashlightOn = false,
  flashlightRange = 8,
  isAnimatingZombies = false,
  isNightVision = false
}) {
  const canvasRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 }); // Phase 12 & 15: Track for optimized resizing


  // Phase 1: Direct sub-context access (no more useGame() aggregation)
  // Phase 1: Engine data is read DIRECTLY from the engine singleton in the render loop
  // We use hooks only for initialization and non-realtime settings
  const { isInitialized } = useGame(); 
  const { playerRef, playerRenderPosition, isMoving: isAnimatingMovement, startAnimatedMovement, startAnimatedMovementAsync, playerFieldOfView } = usePlayer();
  const { gameMapRef, handleTileClick, handleTileHover, hoveredTile, mapVersion } = useGameMap();
  const { cameraRef } = useCamera();
  const { effects, addEffect } = useVisualEffects();
  
  // Phase 25/26: Reactive Image Loading - trigger re-render when textures arrive
  const [, setLoadTick] = React.useState(0);
  useEffect(() => {
    imageLoader.onImageLoaded = () => {
      setLoadTick(t => t + 1);
    };
    return () => { imageLoader.onImageLoaded = null; };
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); // Phase 12: Atomic 1:1 CSS scaling
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
    'tent_wall': '#556b2f', // Olive Drab (for army tents)
    'window': '#c0c0c0',   // Bright silver (terrain base)
    'water': '#1b3a57',    // Muted slate blue
    'sand': '#cccccc',     // Light silver
    'tree': '#111111',     // Very dark
    'default': '#222222'
  };


  // Phase 19: Layout Synchronization Helper
  const getLayoutDimensions = useCallback((canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;
    if (!container) return null;
    
    const rect = container.getBoundingClientRect();
    const logicalWidth = Math.floor(rect.width) || 800;
    const logicalHeight = Math.floor(rect.height) || 600;
    
    return {
      dpr,
      logicalWidth,
      logicalHeight,
      physicalWidth: Math.round(logicalWidth * dpr),
      physicalHeight: Math.round(logicalHeight * dpr),
      rect
    };
  }, []);

  const calculateTileSize = useCallback((width, height) => {
    const minDim = Math.min(width, height);
    if (minDim === 0) return 48;
    const baseSize = Math.floor(minDim / 14);
    return Math.max(32, Math.min(80, baseSize));
  }, []);


  // Render the map on canvas
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const layout = getLayoutDimensions(canvas);
      if (!layout) return;
      
      const { dpr, logicalWidth, logicalHeight, physicalWidth, physicalHeight } = layout;

      // 1. Hardware Calibration
      if (dimensionsRef.current.width !== physicalWidth || dimensionsRef.current.height !== physicalHeight) {
        canvas.width = physicalWidth;
        canvas.height = physicalHeight;
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;
        dimensionsRef.current = { width: physicalWidth, height: physicalHeight, dpr };
        setCanvasSize({ width: logicalWidth, height: logicalHeight });
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0); 
      ctx.imageSmoothingEnabled = false;

      // 2. Engine Readiness
      if (!engine.isReady()) return;

      if (isAnimatingMovement && playerRenderPosition) {
        engine.recalculateFOV(playerRenderPosition);
      }

      const player = engine.player;
      const gameMap = engine.gameMap;
      const camera = engine.camera;
      const playerFieldOfView = engine.playerFieldOfView;

      // 3. Grid Alignment (Anti-Fuzziness)
      const baseTileSize = calculateTileSize(logicalWidth, logicalHeight) || 48;
      const zoom = camera.zoomLevel || 1;
      const rTileSize = Math.max(1, Math.round(baseTileSize * zoom * dpr));

      const camX = camera.x || 0;
      const camY = camera.y || 0;
      const snappedCamX = Math.round(camX * rTileSize) / rTileSize;
      const snappedCamY = Math.round(camY * rTileSize) / rTileSize;

      const globalOffsetX = Math.round((physicalWidth / 2) - (snappedCamX * rTileSize));
      const globalOffsetY = Math.round((physicalHeight / 2) - (snappedCamY * rTileSize));

      camera.updateViewportSize(logicalWidth, logicalHeight, baseTileSize);

      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, physicalWidth, physicalHeight);

      // 4. Rendering Layers
      const currentTime = performance.now();
      const visibleTiles = camera.getVisibleTiles();
      const extraTiles = Math.ceil(2 / zoom) + 1;
      const extendedBounds = {
        startX: Math.max(0, visibleTiles.startX - extraTiles),
        endX: Math.min(gameMap.width - 1, visibleTiles.endX + extraTiles),
        startY: Math.max(0, visibleTiles.startY - extraTiles),
        endY: Math.min(gameMap.height - 1, visibleTiles.endY + extraTiles)
      };
      
      // OPTIMIZATION: Convert visible tiles array to a Set of strings for O(1) high-speed lookups
      // CRITICAL FIX: Use engine.playerFieldOfView as the primary source to avoid 'invisible entities' 
      // when loading a game (avoids waiting for React state to cycle).
      const fovSource = engine.playerFieldOfView || playerFieldOfView || [];
      const visibleTileSet = new Set(fovSource.map(v => `${Math.round(v.x)},${Math.round(v.y)}`));

      // Layer 1: Tiles & Highlights
      ctx.save();
      ctx.translate(globalOffsetX, globalOffsetY);
      for (let worldY = extendedBounds.startY; worldY <= extendedBounds.endY; worldY++) {
        for (let worldX = extendedBounds.startX; worldX <= extendedBounds.endX; worldX++) {
          const tile = gameMap.getTile(worldX, worldY);
          if (!tile) continue;

          const isExplored = tile.flags?.explored;
          const isVisible = visibleTileSet.has(`${worldX},${worldY}`);

          TileRenderer.drawTile(ctx, worldX, worldY, rTileSize, tile, isVisible, isExplored, isNight, engine, imageLoader.images);

          // Highlights
          if (isExplored && hoveredTile && hoveredTile.x === worldX && hoveredTile.y === worldY && player) {
            TileRenderer.drawHighlight(ctx, worldX, worldY, rTileSize, hoveredTile.canAfford ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)', 'fill');
            
            // AP Text
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.floor(rTileSize / 3)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(hoveredTile.apCost.toFixed(1), worldX * rTileSize + rTileSize / 2, worldY * rTileSize + rTileSize / 2 + rTileSize / 8);
          }
        }
      }
      ctx.restore();

      // Layer 2 & 3: World Entities (Categorized by Z-Order)
      const allEntities = gameMap.getAllEntities();
      const groundEntities = [];
      const livingEntities = [];

      allEntities.forEach(entity => {
        if (entity.type === EntityType.PLAYER) return;
        
        // Use logic-position bounds check
        if (entity.x < extendedBounds.startX || entity.x > extendedBounds.endX || entity.y < extendedBounds.startY || entity.y > extendedBounds.endY) return;

        // Categorize into layers: Persistent structures and ground items go to bottom
        if ([EntityType.ITEM, EntityType.PLACE_ICON, EntityType.DOOR, EntityType.WINDOW].includes(entity.type)) {
          groundEntities.push(entity);
        } else {
          livingEntities.push(entity);
        }
      });

      // Pass 2a: Ground & Structural Layer (Items, Icons, Doors, Windows)
      ctx.save();
      ctx.translate(globalOffsetX, globalOffsetY);
      groundEntities.forEach(entity => {
        const isExplored = gameMap.getTile(Math.round(entity.x), Math.round(entity.y))?.flags?.explored;
        ctx.save(); // Isolate individual entity draws to prevent state leakage (e.g. globalAlpha)
        EntityRenderer.renderEntity(ctx, entity, rTileSize, imageLoader.images, visibleTileSet, isExplored, engine, currentTime, isAnimatingZombies);
        ctx.restore();
      });
      ctx.restore();

      // Pass 2b: Living Layer (Zombies, Animals, NPCs)
      ctx.save();
      ctx.translate(globalOffsetX, globalOffsetY);
      livingEntities.forEach(entity => {
        const isExplored = gameMap.getTile(Math.round(entity.x), Math.round(entity.y))?.flags?.explored;
        ctx.save(); // Isolate individual entity draws to prevent state leakage (e.g. globalAlpha)
        EntityRenderer.renderEntity(ctx, entity, rTileSize, imageLoader.images, visibleTileSet, isExplored, engine, currentTime, isAnimatingZombies);
        ctx.restore();
      });
      ctx.restore();

      // Layer 4: Player
      if (player) {
        const pX = isAnimatingMovement ? playerRenderPosition.x : player.x;
        const pY = isAnimatingMovement ? playerRenderPosition.y : player.y;
        
        ctx.save();
        ctx.translate(globalOffsetX, globalOffsetY);
        EntityRenderer.renderEntity(ctx, { ...player, x: pX, y: pY }, rTileSize, imageLoader.images, visibleTileSet, true, engine, currentTime);
        ctx.restore();
      }

      // Layer 4.5: Night Vision Overlay
      if (isFlashlightOn && isNightVision) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Overlay in screen space
        
        if (isNight) {
          // Classic Green Night Vision Filter
          ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
          ctx.fillRect(0, 0, physicalWidth, physicalHeight);
          
          // Add subtle scanlines for "high-tech" feel
          ctx.strokeStyle = 'rgba(0, 50, 0, 0.1)';
          ctx.lineWidth = dpr;
          for (let i = 0; i < physicalHeight; i += 4 * dpr) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(physicalWidth, i);
            ctx.stroke();
          }
        } else {
          // Blinding Daylight Overexposure
          ctx.fillStyle = 'rgba(200, 255, 200, 0.75)';
          ctx.fillRect(0, 0, physicalWidth, physicalHeight);
          
          // White-out center glow
          const radial = ctx.createRadialGradient(
            physicalWidth / 2, physicalHeight / 2, 0,
            physicalWidth / 2, physicalHeight / 2, Math.max(physicalWidth, physicalHeight) / 2
          );
          radial.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          radial.addColorStop(1, 'transparent');
          ctx.fillStyle = radial;
          ctx.fillRect(0, 0, physicalWidth, physicalHeight);
        }
        ctx.restore();
      }

      // Layer 5: Effects
      if (effects && effects.length > 0) {
        ctx.save();
        ctx.translate(globalOffsetX, globalOffsetY);
        effects.forEach(effect => EffectRenderer.renderEffect(ctx, effect, rTileSize, currentTime));
        ctx.restore();
      }

    } catch (error) {
      console.error('[MapCanvas] Critical Rendering Error:', error);
    }

  }, [getLayoutDimensions, calculateTileSize, isAnimatingMovement, playerRenderPosition, hoveredTile, isNight, isFlashlightOn, isNightVision, effects]);


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

      const layout = getLayoutDimensions(canvas);
      if (!layout) return;

      const { dpr, logicalWidth, logicalHeight, physicalWidth, physicalHeight, rect } = layout;

      // Precision Math Sync: Use the exact same physical coordinates as renderMap
      const baseTileSize = calculateTileSize(logicalWidth, logicalHeight) || 48;
      const zoom = camera.zoomLevel || 1;
      const rTileSize = Math.max(1, Math.round(baseTileSize * zoom * dpr));
      
      const camX = camera.x || 0;
      const camY = camera.y || 0;
      const snappedCamX = Math.round(camX * rTileSize) / rTileSize;
      const snappedCamY = Math.round(camY * rTileSize) / rTileSize;

      const globalOffsetX = Math.round((physicalWidth / 2) - (snappedCamX * rTileSize));
      const globalOffsetY = Math.round((physicalHeight / 2) - (snappedCamY * rTileSize));

      // Calculate world coordinates using PHYSICAL PIXEL offsets
      const hoverX = (event.clientX - rect.left) * dpr;
      const hoverY = (event.clientY - rect.top) * dpr;

      const worldX = Math.floor((hoverX - globalOffsetX) / rTileSize);
      const worldY = Math.floor((hoverY - globalOffsetY) / rTileSize);


      // Store hovered position for rendering
      if (worldX >= 0 && worldX < gameMap.width &&
        worldY >= 0 && worldY < gameMap.height) {
        
        const tile = gameMap.getTile(worldX, worldY);
        const zombie = tile?.contents.find((e) => e.type === EntityType.ZOMBIE);
        const cropInfo = tile?.cropInfo;
        
        // Pass enriched hover data to MapInterface
        handleTileHover(worldX, worldY, player, isNight, isFlashlightOn, { zombie, cropInfo });
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

      const layout = getLayoutDimensions(canvas);
      if (!layout) return;

      const { dpr, logicalWidth, logicalHeight, physicalWidth, physicalHeight, rect } = layout;

      // Precision Math Sync: Use the exact same formula as renderMap
      const baseTileSize = calculateTileSize(logicalWidth, logicalHeight) || 48;
      const zoom = camera.zoomLevel || 1;
      const rTileSize = Math.max(1, Math.round(baseTileSize * zoom * dpr));
      
      const clickX = (event.clientX - rect.left) * dpr;
      const clickY = (event.clientY - rect.top) * dpr;

      const camX = camera.x || 0;
      const camY = camera.y || 0;
      const snappedCamX = Math.round(camX * rTileSize) / rTileSize;
      const snappedCamY = Math.round(camY * rTileSize) / rTileSize;
      
      const globalOffsetX = Math.round((physicalWidth / 2) - (snappedCamX * rTileSize));
      const globalOffsetY = Math.round((physicalHeight / 2) - (snappedCamY * rTileSize));

      const worldX = Math.floor((clickX - globalOffsetX) / rTileSize);
      const worldY = Math.floor((clickY - globalOffsetY) / rTileSize);


      // Validate coordinates and trigger tile click
      if (worldX >= 0 && worldX < gameMap.width &&
        worldY >= 0 && worldY < gameMap.height) {

        // Pass click to MapInterface handler first (handles targeting, selection etc)
        const handled = onCellClick && onCellClick(worldX, worldY);

        // Only trigger movement if the click wasn't handled by MapInterface
        if (!handled) {
          // Call GameMapContext handleTileClick with required parameters
          handleTileClick(worldX, worldY, player, camera, true, isAnimatingMovement, false, startAnimatedMovementAsync, isNight, isFlashlightOn, flashlightRange);
        }
      } else {
        console.log('[MapCanvas] Click outside valid map bounds');
      }
    } catch (error) {
      console.error('[MapCanvas] Error handling canvas click:', error);
    }
  }, [gameMapRef, handleTileClick, calculateTileSize, cameraRef, isDragging, playerRef, isAnimatingMovement, startAnimatedMovement, startAnimatedMovementAsync, onCellClick, selectedItem, hasDragged, isNight, isFlashlightOn, flashlightRange]);

  // Handle canvas context menu (right click)
  const handleCanvasContextMenu = useCallback((event) => {
    event.preventDefault(); // Prevent standard browser menu

    const gameMap = gameMapRef.current;
    const camera = cameraRef.current;

    if (!gameMap || !camera || !onCellRightClick) return;

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const layout = getLayoutDimensions(canvas);
      if (!layout) return;

      const { dpr, logicalWidth, logicalHeight, physicalWidth, physicalHeight, rect } = layout;

      // Precision Math Sync: Use the exact same hardware logic as renderMap
      const baseTileSize = calculateTileSize(logicalWidth, logicalHeight) || 48;
      const zoom = camera.zoomLevel || 1;
      const rTileSize = Math.max(1, Math.round(baseTileSize * zoom * dpr));
      
      const clickX = (event.clientX - rect.left) * dpr;
      const clickY = (event.clientY - rect.top) * dpr;

      const camX = camera.x || 0;
      const camY = camera.y || 0;
      const snappedCamX = Math.round(camX * rTileSize) / rTileSize;
      const snappedCamY = Math.round(camY * rTileSize) / rTileSize;

      const globalOffsetX = Math.round((physicalWidth / 2) - (snappedCamX * rTileSize));
      const globalOffsetY = Math.round((physicalHeight / 2) - (snappedCamY * rTileSize));

      // worldX = (clickX - globalOffsetX) / rTileSize
      const worldX = Math.floor((clickX - globalOffsetX) / rTileSize);
      const worldY = Math.floor((clickY - globalOffsetY) / rTileSize);


      // Validate coordinates and trigger right click
      if (worldX >= 0 && worldX < gameMap.width &&
        worldY >= 0 && worldY < gameMap.height) {
        onCellRightClick(worldX, worldY, event.clientX, event.clientY);
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
      const commonEntityTypes = [EntityType.PLAYER, EntityType.ZOMBIE, EntityType.ITEM, EntityType.NPC, EntityType.PLACE_ICON, EntityType.RABBIT];
      await imageLoader.preloadImages(commonEntityTypes);

      // Preload the default item image for ground piles
      await imageLoader.getItemImage('default');
      
      // Preload special zombie variant images
      await imageLoader.getImage(EntityType.ZOMBIE, 'crawler');
      await imageLoader.getImage(EntityType.ZOMBIE, 'firefighter');
      await imageLoader.getImage(EntityType.ZOMBIE, 'swat');

      // PHASE 23 Fix: Use engine.gameMap directly instead of a ref to avoid race conditions during save loading.
      const currentMap = engine.gameMap;
      
      if (currentMap) {
        // Preload ALL item subtypes found on the map (including ground_pile/loot drops)
        const itemEntities = currentMap.getEntitiesByType(EntityType.ITEM);
        const itemSubtypes = [...new Set(itemEntities.map(i => i.subtype).filter(s => s))];
        if (itemSubtypes.length > 0) {
          console.log(`[MapCanvas] Preloading ${itemSubtypes.length} item subtypes:`, itemSubtypes);
          await Promise.all(itemSubtypes.map(s => imageLoader.getImage('item', s)));
        }

        // Preload ALL zombie subtypes found on the map
        const zombieEntities = currentMap.getEntitiesByType(EntityType.ZOMBIE);
        const zombieSubtypes = [...new Set(zombieEntities.map(z => z.subtype).filter(s => s && s !== 'basic'))];
        if (zombieSubtypes.length > 0) {
          console.log(`[MapCanvas] Preloading ${zombieSubtypes.length} zombie subtypes:`, zombieSubtypes);
          await Promise.all(zombieSubtypes.map(s => imageLoader.getImage(EntityType.ZOMBIE, s)));
        }
      }

      // Preload common terrain images to prevent flickering
      const terrainToPreload = ['grass', 'road', 'building', 'water', 'floor', 'wall', 'fence', 'tent_wall', 'tent_floor'];
      await Promise.all(terrainToPreload.map(t => imageLoader.getTileImage(t)));

      setImagesLoaded(true);
    };

    if (isInitialized) {
      preloadEntityImages();
    }
  }, [isInitialized, mapVersion]); // PHASE 23 Fix: Re-preload images whenever mapVersion changes (new map loaded)

  // Preload specific place icons when map changes
  useEffect(() => {
    if (!isInitialized || !gameMapRef.current) return;

    const loadPlaceIcons = async () => {
      const gameMap = gameMapRef.current;
      const placeIcons = gameMap.getEntitiesByType(EntityType.PLACE_ICON);
      
      if (placeIcons.length === 0) return;

      const subtypes = [...new Set(placeIcons.map(icon => icon.subtype))];
      const loadPromises = subtypes.map(subtype => 
        imageLoader.getImage(EntityType.PLACE_ICON, subtype)
      );

      await Promise.all(loadPromises);
      setImagesLoaded(true);
    };

    loadPlaceIcons();
  }, [isInitialized, mapVersion]);


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

  // Phase 17 & 18: Autonomous 60fps Rendering Loop
  // This loop runs independently of React state, reading directly from the engine.
  // We no longer guard with 'isInitialized' to ensure the heartbeat starts immediately.
  useEffect(() => {
    let rafId;
    const tick = () => {
      renderMap();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [renderMap]);


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

  return (
    <div className="h-full w-full overflow-hidden min-h-0 flex items-center justify-center bg-black" style={{ padding: 0, margin: 0 }}>
      <canvas
        ref={canvasRef}
        className={`${isTargeting ? 'cursor-crosshair' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasContextMenu}
        onMouseDown={handleMouseDown}
        onMouseMove={handleCanvasHover}
        style={{
          imageRendering: 'pixelated', 
          display: 'block',
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          padding: 0,
          margin: 0,
          border: 'none',
          pointerEvents: 'auto' 
        }}
      />
    </div>
  );

}
