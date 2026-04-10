import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { useCamera } from '../../contexts/CameraContext.jsx';
import { useVisualEffects } from '../../contexts/VisualEffectsContext.jsx';
import { imageLoader } from '../../game/utils/ImageLoader.js';
import engine from '../../game/GameEngine';

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
  isAnimatingZombies = false
}) {
  const canvasRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 }); // Phase 12 & 15: Track for optimized resizing


  // Phase 1: Direct sub-context access (no more useGame() aggregation)
  // Phase 1: Engine data is read DIRECTLY from the engine singleton in the render loop
  // We use hooks only for initialization and non-realtime settings
  const { isInitialized } = useGame(); 
  const { playerRef, playerRenderPosition, isMoving: isAnimatingMovement, startAnimatedMovement, startAnimatedMovementAsync } = usePlayer();
  const { gameMapRef, handleTileClick, handleTileHover, hoveredTile, mapVersion } = useGameMap();
  const { cameraRef } = useCamera();
  const { effects, addEffect } = useVisualEffects();

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

    // Special mapping for Soldier zombies
    if (entity.type === 'zombie' && entity.subtype === 'soldier') {
      subtypeImageKey = 'soldierzombie';
    }

    // Special mapping for ground piles
    // Must match the cache key used by ImageLoader.getItemImage(), which prefixes with 'item_'
    if (entity.type === 'item' && entity.subtype === 'ground_pile') {
      subtypeImageKey = 'item_default';
    }

    // 3. Fallback logic for images
    let cachedImage = imageLoader.imageCache.get(subtypeImageKey);
    const baseImageKey = entity.type;

    // Trigger load if not in cache
    if (cachedImage === undefined) {
       imageLoader.getImage(entity.type, subtype).then(() => {
          // Re-render handled by MapCanvas frame loop
       }).catch(err => {
          // Silent catch for missing assets
       });
    }

    if (!cachedImage) {
      cachedImage = imageLoader.imageCache.get(baseImageKey);
    }

    const isImageValid = cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0;

    if (isImageValid) {
      // Offset for certain types (e.g., items)
      let offsetX = 0;
      let offsetY = 0;
      let entitySize = tileSize;

      if (entity.type === 'item') {
        if (entity.subtype === 'bed') {
          offsetX = 0;
          offsetY = 0;
          entitySize = tileSize;
        } else {
          offsetX = tileSize * 0.25;
          offsetY = tileSize * 0.25;
          entitySize = tileSize * 0.5;
        }
      } else if (entity.type === 'place_icon') {
        entitySize = tileSize;
      } else if (entity.type !== 'window') {
        entitySize = (tileSize * 0.8);
        offsetX = (tileSize - entitySize) / 2;
        offsetY = (tileSize - entitySize) / 2;
      }

      ctx.drawImage(
        cachedImage,
        pixelX + offsetX,
        pixelY + offsetY,
        entitySize,
        entitySize
      );

      // Add a light gray frame for the player and zombies, similar to the end-turn button (gray-400)
      // Tight against the icon edges with no gap
      if (entity.type === 'player' || entity.type === 'zombie') {
        ctx.strokeStyle = '#9ca3af'; 
        ctx.lineWidth = Math.max(1, tileSize / 24);
        // Draw exactly at icon boundary
        ctx.strokeRect(pixelX + offsetX, pixelY + offsetY, entitySize, entitySize);
      }
    } else {
      // Fallback to default shapes if image not loaded, failed to load, or is a broken placeholder
      renderEntityDefault(ctx, entity, pixelX, pixelY, tileSize);
    }

    // Add Zombie HP bars (Phase 6)
    if (entity.type === 'zombie' && entity.hp !== undefined && entity.maxHp !== undefined) {
      // Draw HP bar above the entity within the tile
      const barWidth = Math.round(tileSize * 0.7);
      const barHeight = Math.max(2, Math.round(tileSize / 16));
      const barX = pixelX + Math.round((tileSize - barWidth) / 2);
      const barY = pixelY + Math.round(tileSize * 0.1); // 10% from the top

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
          pixelX + Math.round(tileSize / 2),
          pixelY + Math.round(tileSize / 2),
          Math.round(tileSize / 3),
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
          pixelX + Math.round(tileSize / 2),
          pixelY + Math.round(tileSize / 2),
          Math.round(Math.round(tileSize / 3)),
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
            pixelX + Math.round(tileSize / 2),
            pixelY + Math.round(tileSize / 2),
            Math.round(entity.sightRange * tileSize),
            0,
            2 * Math.PI
          );
          ctx.stroke();
        }
        break;

      case 'item':
        // Draw items as small colored squares
        const itemSize = Math.round(tileSize / 4);
        const itemX = pixelX + Math.round(tileSize / 2 - itemSize / 2);
        const itemY = pixelY + Math.round(tileSize / 2 - itemSize / 2);

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
          pixelX + Math.round(tileSize / 2),
          pixelY + Math.round(tileSize / 2),
          Math.round(Math.round(tileSize / 3)),
          0,
          2 * Math.PI
        );
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
          ctx.translate(pixelX + Math.round(tileSize / 2), pixelY + Math.round(tileSize / 2));
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-tileSize / 6, -tileSize / 6, Math.round(tileSize / 3), Math.round(tileSize / 3));
          ctx.restore();
        }
        break;

      case 'door':
        // Gray color for doors (user requested gray instead of brown)
        const doorColor = '#888888';
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
          // Closed door: solid gray square
          ctx.fillStyle = doorColor;
          ctx.fillRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3 / 4,
            tileSize * 3 / 4
          );
          // Darker gray border for closed door
          ctx.strokeStyle = '#555555';
          ctx.strokeRect(
            pixelX + tileSize / 8,
            pixelY + tileSize / 8,
            tileSize * 3 / 4,
            tileSize * 3 / 4
          );
        }
        break;

      case 'window':
        // Improved window rendering for visual clarity
        const glassFill = 'rgba(160, 180, 210, 0.35)'; // Bluish silver tint
        const winFrameColor = '#f3f4f6'; // cool-gray-100
        const winDividerColor = 'rgba(255, 255, 255, 0.4)';

        ctx.strokeStyle = winFrameColor;
        ctx.lineWidth = Math.max(1.5, tileSize / 12);

        const winMargin = tileSize / 8;
        const wL = pixelX + winMargin;
        const wT = pixelY + winMargin;
        const wR = pixelX + tileSize - winMargin;
        const wB = pixelY + tileSize - winMargin;
        const wW = wR - wL;
        const wH = wB - wT;

        if (entity.isBroken) {
          // Broken window: jagged shards with high contrast
          ctx.beginPath();
          ctx.moveTo(wL, wT);
          ctx.lineTo(wL + wW * 0.3, wT + wH * 0.1);
          ctx.lineTo(wL + wW * 0.5, wT - wH * 0.05);
          ctx.lineTo(wL + wW * 0.7, wT + wH * 0.15);
          ctx.lineTo(wR, wT);
          ctx.lineTo(wR - wW * 0.1, wT + wH * 0.4);
          ctx.lineTo(wR + wW * 0.05, wT + wH * 0.6);
          ctx.lineTo(wR, wB);
          ctx.lineTo(wR - wW * 0.4, wB - wH * 0.1);
          ctx.lineTo(wL, wB);
          ctx.lineTo(wL + wW * 0.1, wB - wH * 0.5);
          ctx.closePath();
          ctx.stroke();
          
          // Shards inside
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.moveTo(wL + wW * 0.2, wT + wH * 0.3);
          ctx.lineTo(wL + wW * 0.35, wT + wH * 0.2);
          ctx.lineTo(wL + wW * 0.45, wT + wH * 0.4);
          ctx.fill();
        } else if (entity.isOpen) {
          // OPEN WINDOW: Clear frame only (Red circle minus cross)
          ctx.strokeRect(wL, wT, wW, wH); 
        } else {
          // CLOSED WINDOW: Single horizontal sash divider
          ctx.fillStyle = glassFill;
          ctx.fillRect(wL, wT, wW, wH);
          ctx.strokeRect(wL, wT, wW, wH);
          
          // Sash Divider (Single horizontal line in middle, same style as frame)
          ctx.beginPath();
          ctx.moveTo(wL, wT + wH / 2);
          ctx.lineTo(wR, wT + wH / 2);
          ctx.stroke();
        }

        // Draw reinforcement boards if applicable
        if (entity.isReinforced && entity.reinforcementHp > 0) {
          ctx.save();
          ctx.strokeStyle = '#555555'; // Dark gray to match door outlines
          ctx.lineWidth = Math.max(3, tileSize / 8);
          
          const boardCount = entity.reinforcementHp > 10 ? 2 : 1;
          
          // Board 1: Diagonal
          ctx.beginPath();
          ctx.moveTo(wL - 2, wT + 2);
          ctx.lineTo(wR + 2, wB - 2);
          ctx.stroke();
          
          if (boardCount >= 2) {
            // Board 2: Opposite Diagonal
            ctx.beginPath();
            ctx.moveTo(wR + 2, wT + 2);
            ctx.lineTo(wL - 2, wB - 2);
            ctx.stroke();
          }
          ctx.restore();
        }
        break;

      case 'place_icon':
        // Place icons (signs, landmarks) - Blue square with white border
        ctx.fillStyle = '#3b82f6'; // blue-500
        ctx.fillRect(
          pixelX + Math.round(tileSize / 8),
          pixelY + Math.round(tileSize / 8),
          Math.round(tileSize * 3 / 4),
          Math.round(tileSize * 3 / 4)
        );
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          pixelX + Math.round(tileSize / 8),
          pixelY + Math.round(tileSize / 8),
          Math.round(tileSize * 3 / 4),
          Math.round(tileSize * 3 / 4)
        );
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(tileSize / 2)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = entity.subtype ? entity.subtype.charAt(0).toUpperCase() : '?';
        ctx.fillText(label, pixelX + Math.round(tileSize / 2), pixelY + Math.round(tileSize / 2));
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
  const renderEffect = useCallback((ctx, effect, rTileSize, globalOffsetX, globalOffsetY, currentTime) => {
    const elapsed = currentTime - effect.startTime;
    const progress = elapsed / effect.duration;

    if (progress > 1) return; // Effect has ended

    const pixelX = Math.round(effect.x * rTileSize + globalOffsetX);
    const pixelY = Math.round(effect.y * rTileSize + globalOffsetY);

    switch (effect.type) {
      case 'damage':
        {
          const startY = pixelY + Math.round(rTileSize / 2);
          const endY = startY - rTileSize; // Move upwards
          const currentY = startY - (endY - startY) * progress;
          const opacity = 1 - progress;

          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.fillStyle = effect.color;
          ctx.font = `${Math.floor(rTileSize / 2)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const valueText = typeof effect.value === 'number' ? `-${effect.value}` : effect.value;
          ctx.fillText(valueText, pixelX + Math.round(rTileSize / 2), currentY);
          ctx.restore();
        }
        break;
      case 'tile_flash':
        {
          const opacity = (1 - progress) * 0.6; // Fade out from 60% opacity
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.fillStyle = effect.color;
          ctx.fillRect(pixelX, pixelY, rTileSize, rTileSize);
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

  // Calculate responsive tile size based on container
  const calculateTileSize = useCallback((containerWidth, containerHeight) => {
    const minTileSize = 48;
    const maxTileSize = 200;

    const availableWidth = containerWidth - 10;
    const availableHeight = containerHeight - 10;

    const tileWidthSize = Math.floor(availableWidth / 20);
    const tileHeightSize = Math.floor(availableHeight / 20);

    const optimalSize = Math.min(tileWidthSize, tileHeightSize);
    const finalSize = Math.max(minTileSize, Math.min(maxTileSize, optimalSize));

    return finalSize;
  }, []);


  // Render the map on canvas
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // --- 1. HARDWARE CALIBRATION & DIAGNOSTIC FILL ---
      const layout = getLayoutDimensions(canvas);
      if (!layout) return;
      
      const { dpr, logicalWidth, logicalHeight, physicalWidth, physicalHeight } = layout;

      // Atomic Canvas Setup
      if (dimensionsRef.current.width !== physicalWidth || dimensionsRef.current.height !== physicalHeight) {
        canvas.width = physicalWidth;
        canvas.height = physicalHeight;
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;
        dimensionsRef.current = { width: physicalWidth, height: physicalHeight, dpr };
        // setCanvasSize is still used by UI components for overlay positioning
        setCanvasSize({ width: logicalWidth, height: logicalHeight });
      }


      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Reset transform - we will work in PHYSICAL PIXELS
      ctx.setTransform(1, 0, 0, 1, 0, 0); 
      ctx.imageSmoothingEnabled = false;

      // --- DIAGNOSTIC FILL ---
      // If the screen turns Gray, the loop is confirmed ALIVE.
      ctx.fillStyle = '#1a1a1a'; // Dark Gray
      ctx.fillRect(0, 0, physicalWidth, physicalHeight);

      // --- 2. ENGINE READINESS CHECK ---
      if (!engine.isReady()) {
         return;
      }

      // Phase 19: Movement Logic - Update FOV in real-time during animation
      if (isAnimatingMovement && playerRenderPosition) {
        engine.recalculateFOV(playerRenderPosition);
      }

      // Read directly from engine
      const player = engine.player;
      const gameMap = engine.gameMap;
      const camera = engine.camera;
      const playerFieldOfView = engine.playerFieldOfView;



      // --- 2. THE HARDWARE GRID (Anti-Fuzziness) ---
      const baseTileSize = calculateTileSize(logicalWidth, logicalHeight) || 48;
      const zoom = camera.zoomLevel || 1;
      const physicalTileSize = Math.max(1, Math.round(baseTileSize * zoom * dpr));
      const rTileSize = physicalTileSize; // Unified local name

      // Snap camera to the hardware grid with NaN protection
      const camX = camera.x || 0;
      const camY = camera.y || 0;
      const snappedCamX = Math.round(camX * physicalTileSize) / physicalTileSize;
      const snappedCamY = Math.round(camY * physicalTileSize) / physicalTileSize;

      // Offsets in physical pixels (Hardware Center)
      const globalOffsetX = Math.round((physicalWidth / 2) - (snappedCamX * physicalTileSize));
      const globalOffsetY = Math.round((physicalHeight / 2) - (snappedCamY * physicalTileSize));

      // Update camera viewport size (silent update)
      camera.updateViewportSize(logicalWidth, logicalHeight, baseTileSize);


      // Clear with solid black (Hardware pixels)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, physicalWidth, physicalHeight);


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

          // Draw at physical pixel coordinates
          const pixelX = worldX * rTileSize + globalOffsetX;
          const pixelY = worldY * rTileSize + globalOffsetY;



          // --- FOG OF WAR LOGIC ---
          const isExplored = tile.flags && tile.flags.explored;
          const isCurrentlyVisible = playerFieldOfView && playerFieldOfView.some(visibleTile =>
            visibleTile.x === worldX && visibleTile.y === worldY
          );

          if (!isExplored) {
            // Unexplored: Solid black
            ctx.fillStyle = '#000000';
            ctx.fillRect(pixelX, pixelY, rTileSize, rTileSize);
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
             ctx.drawImage(tileImage, pixelX, pixelY, rTileSize, rTileSize);
          } else {
             // Fill tile with solid grayscale terrain color fallback
             ctx.fillStyle = terrainColors[tile.terrain] || terrainColors.default;
             ctx.fillRect(pixelX, pixelY, rTileSize, rTileSize);
          }

          // Draw tile border (Stable 1-pixel line)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(pixelX, pixelY, rTileSize, rTileSize);

          // Noticeable green outline for tiles with crops (growth in progress)
          if (tile.cropInfo && tile.cropInfo.shortestTime !== null) {
            // New discovery check: Only show if it's not wild OR it's been discovered
            if (!tile.cropInfo.isWild || tile.cropInfo.discovered) {
              ctx.strokeStyle = '#22c55e'; // emerald-500
              ctx.lineWidth = 2;
              ctx.strokeRect(pixelX + 1, pixelY + 1, rTileSize - 2, rTileSize - 2);
            }
          }

          // Highlight hovered tile (on any explored tile)
          if (isExplored && hoveredTile && hoveredTile.x === worldX && hoveredTile.y === worldY && player) {
            const canAfford = hoveredTile.canAfford;

            // Hover highlight
            ctx.fillStyle = canAfford ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            ctx.fillRect(pixelX, pixelY, rTileSize, rTileSize);

            // AP cost text
            ctx.fillStyle = '#ffffff'; // White text
            ctx.font = `bold ${Math.floor(Math.round(rTileSize / 3))}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(
              hoveredTile.apCost.toFixed(1),
              pixelX + Math.round(rTileSize / 2),
              pixelY + Math.round(rTileSize / 2 + rTileSize / 8)
            );


          }

          // Render entities on this tile (except player)
          if (tile.contents && tile.contents.length > 0) {
            // Pass 1: Background/Persistent entities (Loot, Doors, Windows)
            tile.contents.forEach((entity, index) => {
              if (entity.type !== 'item' && entity.type !== 'door' && entity.type !== 'window' && entity.type !== 'place_icon') return;
              if (isExplored) {
                const offsetY = index * (rTileSize / 8);
                renderEntity(ctx, entity, pixelX, pixelY + offsetY, rTileSize, performance.now());
              }
            });

            // Pass 2: Foreground entities (Zombies, NPCs, etc.)
            tile.contents.forEach((entity, index) => {
              if (entity.type === 'player' || entity.type === 'item' || entity.type === 'door' || entity.type === 'window' || entity.type === 'place_icon') return;
              
              // Phase 11 & Animation Bugfix:
              // 1. Skip rendering zombies that are already in their smooth animation pass
              if (entity.type === 'zombie' && entity.isAnimating) return;

              // 2. Skip rendering zombies whose logical position has changed but are waiting for the animation phase
              // These will be rendered at their starting positions by the separate "NPCs in transition" pass below
              if (entity.type === 'zombie' && isAnimatingZombies && entity.movementPath && entity.movementPath.length > 1) {
                const startPos = entity.movementPath[0];
                if (startPos.x !== entity.x || startPos.y !== entity.y) {
                  return;
                }
              }

              if (isCurrentlyVisible) {
                const offsetY = index * (rTileSize / 8);
                renderEntity(ctx, entity, pixelX, pixelY + offsetY, rTileSize, performance.now());
              }
            });
          }

          // Apply "Fog" (dimming) for explored but NOT currently visible tiles
          if (isExplored && !isCurrentlyVisible) {
            ctx.fillStyle = isNight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.25)'; // Much lighter fog during day
            ctx.fillRect(pixelX, pixelY, rTileSize, rTileSize);

            // Add more prominent border for building/wall tiles in fog
            if (tile.terrain === 'building' || tile.terrain === 'wall') {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = 1;
              ctx.strokeRect(pixelX, pixelY, rTileSize, rTileSize);
            }
          }

          // Light blue tint for visible tiles (excluding player tile)
          if (isCurrentlyVisible && player && !(worldX === player.x && worldY === player.y)) {
            // Light blue tint for visible tiles
            ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
            ctx.fillRect(pixelX, pixelY, rTileSize, rTileSize);
          }


          // Render player on TOP of other entities
          if (player && !isAnimatingMovement && player.x === worldX && player.y === worldY) {
            renderEntity(ctx, player, pixelX, pixelY, rTileSize, performance.now());
          }
        }
      }
 
      // Render animating zombies (Phase 11)
      const allZombies = gameMap.getEntitiesByType('zombie');
      let zombiesAnimatedCount = 0;

      allZombies.forEach(zombie => {
        // Pass A: Individually animating zombies (Smooth interpolation)
        if (zombie.isAnimating && zombie.movementPath && zombie.movementPath.length > 0) {
          zombiesAnimatedCount++;
          const pathProgress = zombie.animationProgress * (zombie.movementPath.length - 1);
          const segmentIndex = Math.max(0, Math.floor(pathProgress));
          const segmentProgress = pathProgress - segmentIndex;
          
          const currentWaypoint = zombie.movementPath[segmentIndex];
          const nextWaypoint = zombie.movementPath[Math.min(segmentIndex + 1, zombie.movementPath.length - 1)];
          
          if (currentWaypoint && nextWaypoint) {
            const smoothX = currentWaypoint.x + (nextWaypoint.x - currentWaypoint.x) * segmentProgress;
            const smoothY = currentWaypoint.y + (nextWaypoint.y - currentWaypoint.y) * segmentProgress;
            
            const smoothPixelX = Math.round(smoothX * rTileSize + globalOffsetX);
            const smoothPixelY = Math.round(smoothY * rTileSize + globalOffsetY);
            
            // Only render if visible on physical screen
            if (smoothPixelX >= -rTileSize && smoothPixelX <= physicalWidth &&
                smoothPixelY >= -rTileSize && smoothPixelY <= physicalHeight) {

              renderEntity(ctx, zombie, smoothPixelX, smoothPixelY, rTileSize, performance.now());
            }
          }
        } 
        // Pass B: Zombies queued for animation (Hold at starting position)
        // This prevents the "teleportation" look during AI processing
        else if (isAnimatingZombies && !zombie.isAnimating && zombie.movementPath && zombie.movementPath.length > 1) {
          const startPos = zombie.movementPath[0];
          const startPixelX = Math.round(startPos.x * rTileSize + globalOffsetX);
          const startPixelY = Math.round(startPos.y * rTileSize + globalOffsetY);
          
          if (startPixelX >= -rTileSize && startPixelX <= physicalWidth &&
              startPixelY >= -rTileSize && startPixelY <= physicalHeight) {

            renderEntity(ctx, zombie, startPixelX, startPixelY, rTileSize, performance.now());
          }
        }
      });
 
      // Render player with smooth animation if moving
      if (player && isAnimatingMovement) {
        // Convert smooth world coordinates to physical screen coordinates
        const smoothPixelX = Math.round(playerRenderPosition.x * rTileSize + globalOffsetX);
        const smoothPixelY = Math.round(playerRenderPosition.y * rTileSize + globalOffsetY);


        // Only render if player is visible on physical screen
        if (smoothPixelX >= -rTileSize && smoothPixelX <= physicalWidth &&
          smoothPixelY >= -rTileSize && smoothPixelY <= physicalHeight) {

          renderEntity(ctx, player, smoothPixelX, smoothPixelY, rTileSize, performance.now());
        }
      }

      // Render visual effects
      if (effects && effects.length > 0) {
        const currentTime = performance.now();
        effects.forEach(effect => {
          renderEffect(ctx, effect, rTileSize, globalOffsetX, globalOffsetY, currentTime);
        });
      }

      if (zombiesAnimatedCount > 0 && Math.random() < 0.05) {
        console.log(`[MapCanvas] Smooth rendering ${zombiesAnimatedCount} zombies`);
      }

      // --- END RENDER ---
    } catch (error) {
       console.error('[MapCanvas] Critical Rendering Error:', error);
    }

  }, [gameMapRef.current, isInitialized, calculateTileSize, terrainColors, hoveredTile, playerRef.current, effects, renderEffect, renderEntity, isNight, isFlashlightOn, mapVersion]);


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
        const zombie = tile?.contents.find((e) => e.type === 'zombie');
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
  }, [gameMapRef, handleTileClick, calculateTileSize, cameraRef, isDragging, playerRef, isAnimatingMovement, startAnimatedMovement, startAnimatedMovementAsync, onCellClick, selectedItem, hasDragged]);

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
