import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { useCamera } from '../../contexts/CameraContext.jsx';
import { useVisualEffects } from '../../contexts/VisualEffectsContext.jsx';
import { TileChunkCache, TILE_CHUNK_SIZE } from '../../game/renderer/TileChunkCache.js';
import { EntityRenderer, getDominantItemInTile, frameRenderFlags } from '../../game/renderer/EntityRenderer.js';
import { EffectRenderer } from '../../game/renderer/EffectRenderer.js';
import { SpeechBubbleRenderer } from '../../game/renderer/SpeechBubbleRenderer.js';
import { useSpeechBubbles } from '../../contexts/SpeechBubbleContext.jsx';
import { imageLoader } from '../../game/utils/ImageLoader.js';
import { configManager } from '../../game/utils/ConfigManager.js';
import { EntityType } from '../../game/entities/Entity.js';
import { isIndoorFloor } from '../../game/map/TerrainTypes.js';
import { ItemDefs } from '../../game/inventory/ItemDefs.js';
import engine from '../../game/GameEngine.js';
import { getScaleFactor } from '../../hooks/useWindowSize';

// Ids of malformed entities we've already warned about, so a single corrupt
// entity doesn't spam the console at 60fps (this used to throw and blank the
// entire frame — see the finite-coordinate guard in the render loop).
const warnedMalformedEntityIds = new Set();

// Perf Phase 2: reused each frame for the player draw so we don't allocate a
// fresh `{ ...player }` clone at 60fps. Object.assign has identical own-enumerable
// copy semantics to the spread it replaces; renderEntity only reads known keys,
// so any stale key left over from a previous frame is harmless.
const playerRenderScratch = {};

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
  isNightVision = false,
  isPlayerTurn = false,
  isAutosaving = false,
  isInitialized = false
}) {
  const canvasRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 }); // Phase 12 & 15: Track for optimized resizing
  const chunkCacheRef = useRef(new TileChunkCache());
  // Static furniture is baked into chunk canvases, so build a spatial index
  // (chunk key -> overlapping pieces) once per furniture array.
  const furnitureIndexRef = useRef(null);
  const lastFurnitureRef = useRef(null);
  // Perf Phase 5: zoom-settle state. Chunks are (re)built at `builtTileSizeRef`;
  // while the live `rTileSize` differs (an in-progress zoom gesture) we scale-blit
  // the existing chunks and only rebuild crisp once the gesture has been idle for
  // ZOOM_SETTLE_MS. zoomPendingRef keeps the render loop warm until that rebuild.
  const builtTileSizeRef = useRef(0);
  const prevRTileSizeRef = useRef(0);
  const lastZoomChangeAtRef = useRef(0);
  const zoomPendingRef = useRef(false);
  const lastThemeRef = useRef(null);
  const lastFurnitureOpacityRef = useRef(null);
  // Offscreen canvases for the smooth fog/lighting overlay (sized to viewport).
  // lightingCanvas holds the final fog layer; lightMaskCanvas holds the sharp
  // per-tile visibility mask that we blur once to feather the fog boundary.
  const lightingCanvasRef = useRef(null);
  const lightMaskCanvasRef = useRef(null);

  const renderMapRef = useRef(null);
  const handleMouseMoveRef = useRef(null);
  const handleMouseUpRef = useRef(null);
  const handleWheelRef = useRef(null);

  // Phase 1: Dirty-flag render gating. The rAF loop below renders only when
  // something changed (renderRequestedRef), when the scene is continuously
  // animating (continuousRef), or — throttled — when a pulsing element is on
  // screen (sceneHasPulsersRef, re-set by renderMap each frame it draws one).
  const renderRequestedRef = useRef(true); // render at least once on mount
  const continuousRef = useRef(false);
  const sceneHasPulsersRef = useRef(false);
  const lastRenderTimeRef = useRef(0);
  const lastPulseFrameRef = useRef(0);

  const requestRender = useCallback(() => {
    renderRequestedRef.current = true;
  }, []);

  // Sync refs on every render to ensure they always call the latest closures
  useEffect(() => {
    renderMapRef.current = renderMap;
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
    handleWheelRef.current = handleWheel;

    // Refresh the continuous-animation snapshot for the gated rAF loop and
    // request a frame. This effect runs on EVERY React render — i.e. exactly
    // when a state/context change (hover, effects, movement, camera version,
    // theme) could alter the map. When the game is truly idle there are no
    // re-renders, so the loop stays quiet and the CPU goes idle.
    continuousRef.current = Boolean(
      isAnimatingMovement || isAnimatingZombies || (effects && effects.length > 0) || activeBubble
    );
    renderRequestedRef.current = true;
  });

  // Belt-and-suspenders: engine state pulses (turn end, FOV, inventory, player
  // state) may not always re-render this component through a context, so also
  // request a frame directly on every engine 'update'.
  useEffect(() => {
    const unsubscribe = engine.subscribe(requestRender);
    return unsubscribe;
  }, [requestRender]);


  // Phase 1: Direct sub-context access (no more useGame() aggregation)
  // Phase 1: Engine data is read DIRECTLY from the engine singleton in the render loop
  // We use hooks only for initialization and non-realtime settings
  useGame(); 
  const { player, playerRef, playerRenderPosition, isMoving: isAnimatingMovement, startAnimatedMovement, startAnimatedMovementAsync, playerFieldOfView } = usePlayer();
  const { gameMapRef, handleTileClick, handleTileHover, hoveredTile, setHoveredTile, mapVersion } = useGameMap();
  const { cameraRef } = useCamera();
  const { effects, addEffect } = useVisualEffects();
  const { activeBubble } = useSpeechBubbles();
  // Tracks when the current bubble first became active, to drive its pop-in.
  const bubbleAppearRef = useRef({ bubble: null, at: 0 });

  // Phase 25/26: Reactive Image Loading - trigger re-render when textures arrive
  const [, setLoadTick] = React.useState(0);
  useEffect(() => {
    imageLoader.onImageLoaded = () => {
      chunkCacheRef.current.invalidateAll();
      requestRender();
      setLoadTick(t => t + 1);
    };
    return () => { imageLoader.onImageLoaded = null; };
  }, []);

  // Sync config updates (like furniture opacity) directly in real-time
  useEffect(() => {
    const handleConfigChange = (e) => {
      if (e.detail?.key === 'furnitureOpacity') {
        chunkCacheRef.current.invalidateAll();
        requestRender();
      }
    };
    window.addEventListener('config-changed', handleConfigChange);
    return () => window.removeEventListener('config-changed', handleConfigChange);
  }, [requestRender]);

  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); // Phase 12: Atomic 1:1 CSS scaling
  const nextEffectTimeRef = useRef(0);


  // Define terrain colors (Grayscale Retro Palette for fallback)
  const isLightMode = document.documentElement.classList.contains('light');
  const isSteampunkMode = document.documentElement.classList.contains('steampunk');
  const terrainColors = isSteampunkMode ? {
    'grass': '#8a7d5a',
    'floor': '#b0a288',
    'wall': '#5c4a32',
    'road': '#6b5f4a',
    'sidewalk': '#9c8f74',
    'fence': '#4a3a26',
    'building': '#7a6a50',
    'tent_wall': '#8a7a5c',
    'window': '#b0a288',
    'water': '#4a5c6a',
    'sand': '#a89a7c',
    'tree': '#4d5c3a',
    'default': '#6b5f4a'
  } : isLightMode ? {
    'grass': '#e2e8f0',
    'floor': '#f1f5f9',
    'wall': '#475569',
    'road': '#cbd5e1',
    'sidewalk': '#94a3b8',
    'fence': '#cbd5e1',
    'building': '#94a3b8',
    'tent_wall': '#cbd5e1',
    'window': '#e2e8f0',
    'water': '#38bdf8',
    'sand': '#e2e8f0',
    'tree': '#15803d',
    'default': '#cbd5e1'
  } : {
    'grass': '#2a2a2a',
    'floor': '#555555',
    'wall': '#000000',
    'road': '#333333',
    'sidewalk': '#888888',
    'fence': '#444444',
    'building': '#aaaaaa',
    'tent_wall': '#556b2f',
    'window': '#c0c0c0',
    'water': '#1b3a57',
    'sand': '#cccccc',
    'tree': '#111111',
    'default': '#222222'
  };


  // Phase 19: Layout Synchronization Helper
  const getLayoutDimensions = useCallback((canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;
    if (!container) return null;
    
    const rect = container.getBoundingClientRect();
    const logicalWidth = container.clientWidth || Math.floor(rect.width) || 800;
    const logicalHeight = container.clientHeight || Math.floor(rect.height) || 600;
    
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

    // Phase 1: reset the per-frame pulser flag. renderMap + EntityRenderer set
    // it true when they draw a time-animated decoration; the rAF loop reads it
    // to keep animating those while the scene is otherwise idle.
    sceneHasPulsersRef.current = false;
    frameRenderFlags.hasPulser = false;

    // Perf Phase 2: per-frame memo for tile item lookups. EntityRenderer resolves
    // getItemsOnTile / dominant-item up to ~5x per item entity per frame; these
    // reused-and-cleared Maps collapse that to one lookup per tile per frame.
    // Reused across frames (not reallocated) to avoid its own GC churn.
    if (!engine._frameItemCache) engine._frameItemCache = new Map();
    if (!engine._frameDominantCache) engine._frameDominantCache = new Map();
    engine._frameItemCache.clear();
    engine._frameDominantCache.clear();

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

      const isLight = document.documentElement.classList.contains('light');
      const isSteampunk = document.documentElement.classList.contains('steampunk');
      const currentTheme = isSteampunk ? 'steampunk' : (isLight ? 'light' : 'dark');
      if (currentTheme !== lastThemeRef.current) {
        chunkCacheRef.current.invalidateAll();
        lastThemeRef.current = currentTheme;
      }

      const currentFurnitureOpacity = configManager.get('furnitureOpacity') ?? 0.85;
      if (currentFurnitureOpacity !== lastFurnitureOpacityRef.current) {
        chunkCacheRef.current.invalidateAll();
        lastFurnitureOpacityRef.current = currentFurnitureOpacity;
      }

      ctx.fillStyle = isSteampunk ? '#2a2118' : (isLight ? '#f5f5f7' : '#111');
      ctx.fillRect(0, 0, physicalWidth, physicalHeight);

      // 4. Rendering Layers
      const currentTime = performance.now();
      const visibleTiles = camera.getVisibleTiles();

      // Build (or reuse) a spatial index for static furniture so chunk caching
      // can bake the outlines instead of redrawing them every frame.
      const furniture = gameMap.furniture || [];
      if (furniture !== lastFurnitureRef.current) {
        const index = new Map();
        for (const piece of furniture) {
          const minCX = Math.floor(piece.x / TILE_CHUNK_SIZE);
          const maxCX = Math.floor((piece.x + piece.w - 1) / TILE_CHUNK_SIZE);
          const minCY = Math.floor(piece.y / TILE_CHUNK_SIZE);
          const maxCY = Math.floor((piece.y + piece.h - 1) / TILE_CHUNK_SIZE);
          for (let cy = minCY; cy <= maxCY; cy++) {
            for (let cx = minCX; cx <= maxCX; cx++) {
              const key = `${cx},${cy}`;
              if (!index.has(key)) index.set(key, []);
              index.get(key).push(piece);
            }
          }
        }
        furnitureIndexRef.current = index;
        lastFurnitureRef.current = furniture;
      }
      const extraTiles = Math.ceil(2 / zoom) + 1;
      const extendedBounds = {
        startX: Math.max(0, visibleTiles.startX - extraTiles),
        endX: Math.min(gameMap.width - 1, visibleTiles.endX + extraTiles),
        startY: Math.max(0, visibleTiles.startY - extraTiles),
        endY: Math.min(gameMap.height - 1, visibleTiles.endY + extraTiles)
      };
      
      // OPTIMIZATION: Visibility lookup Set for O(1) `.has()`. Perf Phase 2: the
      // engine now builds this Set once per FOV recalculation (engine.playerFovSet),
      // so we no longer rebuild it from the FOV array every single frame. Fall back
      // to building it here only before the engine's first FOV pass (e.g. right
      // after a load), using engine state or React state, whichever is populated —
      // this preserves the original "avoid invisible entities on load" fix.
      let visibleTileSet;
      if (engine.playerFovSet && engine.playerFieldOfView && engine.playerFieldOfView.length > 0) {
        visibleTileSet = engine.playerFovSet;
      } else {
        const fovSource = (engine.playerFieldOfView && engine.playerFieldOfView.length > 0)
          ? engine.playerFieldOfView
          : (playerFieldOfView || []);
        visibleTileSet = new Set(fovSource.map(v => `${Math.round(v.x)},${Math.round(v.y)}`));
      }

      // Layer 1: Tiles — static terrain blitted from chunk cache, then dynamic overlays.
      const chunkCache = chunkCacheRef.current;

      // Perf Phase 5: defer chunk rebuilds during a zoom (or DPR) change until the
      // gesture settles, instead of invalidating every visible chunk on each wheel
      // notch. On the very first render adopt the current size directly; otherwise
      // rebuild only after ZOOM_SETTLE_MS of no further size change. While pending,
      // `zoomActive` drives the scale-blit path in the loop below.
      const ZOOM_SETTLE_MS = 120;
      if (builtTileSizeRef.current === 0) {
        builtTileSizeRef.current = rTileSize;
        prevRTileSizeRef.current = rTileSize;
        lastZoomChangeAtRef.current = currentTime;
      }
      if (rTileSize !== prevRTileSizeRef.current) {
        lastZoomChangeAtRef.current = currentTime;
        prevRTileSizeRef.current = rTileSize;
      }
      const zoomSettled = (currentTime - lastZoomChangeAtRef.current) >= ZOOM_SETTLE_MS;
      if (rTileSize !== builtTileSizeRef.current && zoomSettled) {
        chunkCache.invalidateAll();
        builtTileSizeRef.current = rTileSize;
      }
      const zoomActive = rTileSize !== builtTileSizeRef.current;
      zoomPendingRef.current = zoomActive;

      ctx.save();
      ctx.translate(globalOffsetX, globalOffsetY);

      // Pass 1a: Blit cached chunk canvases (terrain, decorations, edge walls).
      const startCX = Math.floor(extendedBounds.startX / TILE_CHUNK_SIZE);
      const endCX   = Math.floor(extendedBounds.endX   / TILE_CHUNK_SIZE);
      const startCY = Math.floor(extendedBounds.startY / TILE_CHUNK_SIZE);
      const endCY   = Math.floor(extendedBounds.endY   / TILE_CHUNK_SIZE);

      const chunkPixels = TILE_CHUNK_SIZE * rTileSize;
      for (let cy = startCY; cy <= endCY; cy++) {
        for (let cx = startCX; cx <= endCX; cx++) {
          const dx = cx * TILE_CHUNK_SIZE * rTileSize;
          const dy = cy * TILE_CHUNK_SIZE * rTileSize;
          if (zoomActive) {
            // Mid-zoom: scale-blit the existing (old-size) chunk to the new size
            // rather than rebuilding it. Rebuild happens crisply on settle above.
            const entry = chunkCache.peekChunk(cx, cy);
            if (entry) {
              ctx.drawImage(entry.canvas, dx, dy, chunkPixels, chunkPixels);
              continue;
            }
            // Not cached yet (e.g. just scrolled into view) — build at current size.
          }
          const chunkCanvas = chunkCache.getChunk(cx, cy, rTileSize, gameMap, engine, imageLoader.images, furnitureIndexRef.current, currentTheme);
          ctx.drawImage(chunkCanvas, dx, dy);
        }
      }
      // Keep a margin ring of off-screen chunks so small pans don't rebuild them.
      chunkCache.evictOffscreen(startCX, endCX, startCY, endCY);

      // Pass 1a.5: Floorplan furniture outlines are now baked into the chunk
      // canvases above, so they cost nothing per frame. They still sit before
      // the unexplored/fog passes, so visibility works per-tile automatically.

      // Pass 1b: Unexplored tiles stay hard black. Visible/fire overlays are
      // handled with a smooth radial lighting pass after this layer restores.
      for (let worldY = extendedBounds.startY; worldY <= extendedBounds.endY; worldY++) {
        for (let worldX = extendedBounds.startX; worldX <= extendedBounds.endX; worldX++) {
          const tile = gameMap.getTile(worldX, worldY);
          if (!tile || tile.flags?.explored) continue;

          const screenX = worldX * rTileSize;
          const screenY = worldY * rTileSize;
          ctx.fillStyle = '#000';
          ctx.fillRect(screenX, screenY, rTileSize, rTileSize);
        }
      }

      ctx.restore();

      // Pass 1c: Smooth lighting / fog overlay in screen space.
      // Rather than stacking a radial gradient per tile (which pools into a
      // visible per-tile checkerboard and bleeds a full tile past walls), we:
      //   1. rasterise the visible tiles as flat opaque squares into a mask,
      //   2. blur that mask ONCE to feather only the outer boundary,
      //   3. use it to subtract fog (source-out) so the lit region is uniform
      //      inside and softly faded at its edge.
      const isDark = isNight || gameMap?.metadata?.alwaysDark;
      const overlayColor = isDark ? 'rgba(0, 5, 20, 0.55)' : 'rgba(0, 0, 0, 0.45)';
      // Day: fully clear visible tiles. Night: leave a subtle blue tint so
      // visible areas still feel dim, matching the old 0.3 tint.
      const eraseStrength = isDark ? 0.45 : 1.0;
      // Feather radius for the fog boundary. Kept well under a tile so the soft
      // edge doesn't spill across a whole wall into the fog beyond it.
      const featherPx = Math.max(1, rTileSize * 0.35);

      let lightingCanvas = lightingCanvasRef.current;
      if (!lightingCanvas) {
        lightingCanvas = document.createElement('canvas');
        lightingCanvasRef.current = lightingCanvas;
      }
      let lightMaskCanvas = lightMaskCanvasRef.current;
      if (!lightMaskCanvas) {
        lightMaskCanvas = document.createElement('canvas');
        lightMaskCanvasRef.current = lightMaskCanvas;
      }
      const lctx = lightingCanvas.getContext('2d');
      const mctx = lightMaskCanvas.getContext('2d');
      if (lightingCanvas.width !== physicalWidth || lightingCanvas.height !== physicalHeight) {
        lightingCanvas.width = physicalWidth;
        lightingCanvas.height = physicalHeight;
      }
      if (lightMaskCanvas.width !== physicalWidth || lightMaskCanvas.height !== physicalHeight) {
        lightMaskCanvas.width = physicalWidth;
        lightMaskCanvas.height = physicalHeight;
      }

      // Step 1: sharp visibility mask — one flat opaque square per visible tile.
      // Flat fills mean the lit interior is perfectly uniform (no per-tile pools).
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.filter = 'none';
      mctx.globalCompositeOperation = 'source-over';
      mctx.clearRect(0, 0, physicalWidth, physicalHeight);
      mctx.fillStyle = `rgba(0, 0, 0, ${eraseStrength})`;
      const fov = engine.playerFieldOfView || playerFieldOfView || [];
      for (const pos of fov) {
        const wx = Math.round(pos.x);
        const wy = Math.round(pos.y);
        if (wx < extendedBounds.startX || wx > extendedBounds.endX ||
            wy < extendedBounds.startY || wy > extendedBounds.endY) continue;
        const sx = wx * rTileSize + globalOffsetX;
        const sy = wy * rTileSize + globalOffsetY;
        mctx.fillRect(sx, sy, rTileSize, rTileSize);
      }

      // Step 2: paint fog everywhere, then blur the mask in as we subtract it.
      // 'source-out' keeps the fog only where the (blurred) mask is transparent,
      // scaling fog alpha by 1 - maskAlpha, giving a feathered visible boundary.
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.filter = 'none';
      lctx.globalCompositeOperation = 'source-over';
      lctx.clearRect(0, 0, physicalWidth, physicalHeight);
      lctx.filter = `blur(${featherPx}px)`;
      lctx.drawImage(lightMaskCanvas, 0, 0);
      lctx.filter = 'none';
      lctx.globalCompositeOperation = 'source-out';
      lctx.fillStyle = overlayColor;
      lctx.fillRect(0, 0, physicalWidth, physicalHeight);
      lctx.globalCompositeOperation = 'source-over';

      ctx.drawImage(lightingCanvas, 0, 0);

      // Pass 1d: Fire overlay (drawn after lighting so it glows through fog).
      ctx.save();
      ctx.translate(globalOffsetX, globalOffsetY);
      for (let worldY = extendedBounds.startY; worldY <= extendedBounds.endY; worldY++) {
        for (let worldX = extendedBounds.startX; worldX <= extendedBounds.endX; worldX++) {
          const tile = gameMap.getTile(worldX, worldY);
          if (!tile || tile.fireTurns <= 0 || !tile.flags?.explored) continue;

          frameRenderFlags.hasPulser = true; // animating fire-tile glow
          const pulse = 0.35 + Math.sin(currentTime / 180) * 0.15;
          ctx.fillStyle = `rgba(249, 115, 22, ${pulse})`;
          ctx.fillRect(worldX * rTileSize, worldY * rTileSize, rTileSize, rTileSize);
        }
      }
      ctx.restore();

      // Layer 2 & 3: World Entities (Categorized by Z-Order)
      const allEntities = gameMap.getAllEntities();
      const groundEntities = [];
      const livingEntities = [];

      allEntities.forEach(entity => {
        if (entity.type === EntityType.PLAYER) return;
        
        // Pure ECS: Skip rendering detached item entities (e.g. items in inventory) that do not have a Position component
        if (entity.type === EntityType.ITEM && entity.hasComponent && !entity.hasComponent('Position')) return;

        // Use logic-position bounds check
        // Robust bounds check: include both current visual position and logical destination during animations
        const minX = Math.min(entity.x, entity.logicalX ?? entity.x);
        const maxX = Math.max(entity.x, entity.logicalX ?? entity.x);
        const minY = Math.min(entity.y, entity.logicalY ?? entity.y);
        const maxY = Math.max(entity.y, entity.logicalY ?? entity.y);

        // Resilience: a malformed/partially-restored entity (e.g. missing its
        // components map, so the coordinate getters return undefined) would
        // produce NaN bounds and crash the renderer — which, inside this frame's
        // single try/catch, blanks the ENTIRE map (player, doors, windows,
        // zombies all vanish). Skip such an entity and warn once instead.
        if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
          if (!warnedMalformedEntityIds.has(entity.id)) {
            warnedMalformedEntityIds.add(entity.id);
            console.warn('[MapCanvas] Skipping malformed entity (non-finite position):', {
              id: entity.id, type: entity.type, hasComponents: !!entity.components
            });
          }
          return;
        }

        if (maxX < extendedBounds.startX || minX > extendedBounds.endX || maxY < extendedBounds.startY || minY > extendedBounds.endY) return;

        // Categorize into layers: Persistent structures and ground items go to bottom
        if ([EntityType.ITEM, EntityType.PLACE_ICON, EntityType.DOOR, EntityType.WINDOW, EntityType.GARAGE_DOOR].includes(entity.type)) {
          groundEntities.push(entity);
        } else {
          livingEntities.push(entity);
        }
      });

      // Pass 2a-1: Ground Items (Items / Loot drops)
      ctx.save();
      ctx.translate(globalOffsetX, globalOffsetY);
      groundEntities.forEach(entity => {
        if (entity.type !== EntityType.ITEM) return;
        const isExplored = gameMap.getTile(Math.round(entity.x), Math.round(entity.y))?.flags?.explored;
        ctx.save(); // Isolate individual entity draws to prevent state leakage (e.g. globalAlpha)
        EntityRenderer.renderEntity(ctx, entity, rTileSize, imageLoader.images, visibleTileSet, isExplored, engine, currentTime, isAnimatingZombies);
        ctx.restore();
      });
      ctx.restore();

      // Pass 2a-2: Hover Cursor Highlight (above items, below doors/windows/zombies)
      if (hoveredTile && player) {
        const tile = gameMap.getTile(hoveredTile.x, hoveredTile.y);
        if (tile && tile.flags?.explored) {
          ctx.save();
          ctx.translate(globalOffsetX, globalOffsetY);
          
          // Draw Cursor Highlight!
          drawImprovedCursor(ctx, hoveredTile.x, hoveredTile.y, rTileSize, hoveredTile.canAfford);
          
          // AP Text with thick dark outline for readability
          const textX = hoveredTile.x * rTileSize + rTileSize / 2;
          const textY = hoveredTile.y * rTileSize + rTileSize / 2 + rTileSize / 8;
          const text = hoveredTile.apCost.toFixed(1);

          ctx.font = `bold ${Math.floor(rTileSize / 3)}px Arial`;
          ctx.textAlign = 'center';
          ctx.lineJoin = 'round';
          
          // Outline
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.strokeText(text, textX, textY);
          
          // Fill
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, textX, textY);
          
          ctx.restore();
        }
      }

      // Pass 2a-3: Other Ground & Structural Layer (Doors, Windows, Place Icons)
      ctx.save();
      ctx.translate(globalOffsetX, globalOffsetY);
      groundEntities.forEach(entity => {
        if (entity.type === EntityType.ITEM) return;
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
        Object.assign(playerRenderScratch, player);
        playerRenderScratch.x = pX;
        playerRenderScratch.y = pY;
        EntityRenderer.renderEntity(ctx, playerRenderScratch, rTileSize, imageLoader.images, visibleTileSet, true, engine, currentTime);
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

      // Layer 5.5: On-map speech bubbles (drawn above entities/effects so they're
      // never occluded). Anchored to the world tile of the current line.
      if (activeBubble) {
        // Stamp the appearance time whenever the active line changes so each
        // bubble gets its own pop-in.
        if (bubbleAppearRef.current.bubble !== activeBubble) {
          bubbleAppearRef.current = { bubble: activeBubble, at: currentTime };
        }
        ctx.save();
        ctx.translate(globalOffsetX, globalOffsetY);
        SpeechBubbleRenderer.renderBubble(
          ctx,
          { ...activeBubble, appearedAt: bubbleAppearRef.current.at },
          rTileSize,
          currentTime
        );
        ctx.restore();
      }

      // Layer 6: Global Weather (Screen Space)
      if (engine.weather && engine.weather.type === 'rain' && player) {
        const currentX = isAnimatingMovement ? playerRenderPosition.x : player.x;
        const currentY = isAnimatingMovement ? playerRenderPosition.y : player.y;
        const playerTile = engine.gameMap.getTile(Math.round(currentX), Math.round(currentY));
        const isInside = playerTile && isIndoorFloor(playerTile.terrain);

        if (!isInside) {
          renderRain(ctx, physicalWidth, physicalHeight, engine.weather.intensity, dpr);
        }
      }

      // Phase 1: publish whether this frame drew any time-animated decoration
      // (fire, stun, active-turret ring, heard-blip). The rAF loop keeps those
      // ticking (throttled) even when nothing else is changing.
      sceneHasPulsersRef.current = frameRenderFlags.hasPulser;

    } catch (error) {
      console.error('[MapCanvas] Critical Rendering Error:', error);
    }

  }, [getLayoutDimensions, calculateTileSize, isAnimatingMovement, playerRenderPosition, hoveredTile, isNight, isFlashlightOn, isNightVision, effects, activeBubble]);


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

      // Calculate world coordinates using PHYSICAL PIXEL offsets, adjusted for visual scale transforms
      const hoverX = (event.clientX - rect.left) * (logicalWidth / rect.width) * dpr;
      const hoverY = (event.clientY - rect.top) * (logicalHeight / rect.height) * dpr;

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

      const scale = getScaleFactor();
      const layoutDeltaX = deltaX / scale;
      const layoutDeltaY = deltaY / scale;

      // Convert pixel movement to tile movement
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      const containerWidth = container ? container.clientWidth : 800;
      const containerHeight = container ? container.clientHeight : 600;
      const baseTileSize = calculateTileSize(containerWidth, containerHeight);
      const tileSize = baseTileSize * camera.zoomLevel;

      const tileDeltaX = Math.round(layoutDeltaX / tileSize);
      const tileDeltaY = Math.round(layoutDeltaY / tileSize);

      if (tileDeltaX !== 0 || tileDeltaY !== 0) {
        if (camera.pan) {
          camera.pan(tileDeltaX, tileDeltaY);
        }
        setLastMousePos({ x: event.clientX, y: event.clientY });
        requestRender();
      }
    } else if (!isDragging) { // Only call handleCanvasHover if not currently dragging
      // Handle hover when not dragging - independent of player turn guards
      handleCanvasHover(event);
    }
  }, [isDragging, lastMousePos, dragStartPos, cameraRef, calculateTileSize, handleCanvasHover]);

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
    requestRender();
  }, [cameraRef, requestRender]); // Include cameraRef in dependencies

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
      
      const clickX = (event.clientX - rect.left) * (logicalWidth / rect.width) * dpr;
      const clickY = (event.clientY - rect.top) * (logicalHeight / rect.height) * dpr;

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
          handleTileClick(worldX, worldY, player, camera, isPlayerTurn, isAnimatingMovement, isAutosaving, startAnimatedMovementAsync, isNight, isFlashlightOn, flashlightRange, isAnimatingZombies);
        }
      } else {
        console.log('[MapCanvas] Click outside valid map bounds');
      }
    } catch (error) {
      console.error('[MapCanvas] Error handling canvas click:', error);
    }
  }, [gameMapRef, handleTileClick, calculateTileSize, cameraRef, isDragging, playerRef, isAnimatingMovement, startAnimatedMovement, startAnimatedMovementAsync, onCellClick, selectedItem, hasDragged, isNight, isFlashlightOn, flashlightRange, isAnimatingZombies]);

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
      
      const clickX = (event.clientX - rect.left) * (logicalWidth / rect.width) * dpr;
      const clickY = (event.clientY - rect.top) * (logicalHeight / rect.height) * dpr;

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

  // Setup effect listeners for player actions.
  // Bound to the reactive `player` value (from usePlayer()'s memoized context),
  // NOT playerRef.current: a plain ref mutation doesn't cause a re-render, so
  // using playerRef.current as a dependency lags one render cycle behind the
  // actual engine.player swap (e.g. right after a new game starts post-death).
  // During that lag window this effect would stay bound to the OLD, detached
  // player object — so a stray takeDamage() call still in flight from the old
  // game (see the runIdRef guards in GameContext/SleepContext) could fire a
  // "ghost" damage flash at the old player's frozen coordinates on the new map.
  useEffect(() => {
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
  }, [player, addEffect]);

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
        // Map to their effective imageIds from definitions if available
        const itemImageIds = [];
        for (const i of itemEntities) {
          const subtype = i.subtype || 'basic';
          if (subtype === 'ground_pile') {
            const tileItems = currentMap.getItemsOnTile(Math.round(i.x), Math.round(i.y));
            const dominantItem = getDominantItemInTile(tileItems);
            if (dominantItem) {
              const defId = dominantItem.defId || dominantItem.id;
              const def = ItemDefs[defId];
              const id = dominantItem.imageId || def?.imageId || defId;
              if (id && id !== 'basic') {
                itemImageIds.push(id);
              }
            } else {
              itemImageIds.push('default');
            }
          } else {
            const id = i.imageId || (ItemDefs[subtype]?.imageId) || subtype;
            if (id && id !== 'basic') {
              itemImageIds.push(id);
            }
          }
        }

        const uniqueImageIds = [...new Set(itemImageIds)];
        if (uniqueImageIds.length > 0) {
          console.log(`[MapCanvas] Preloading ${uniqueImageIds.length} item imageIds:`, uniqueImageIds);
          await Promise.all(uniqueImageIds.map(id => imageLoader.getItemImage(id)));
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

      // Preload outdoor decorations
      const decorationsToPreload = ['outdoordecor1', 'outdoordecor2', 'outdoordecor3', 'outdoordecor4', 'outdoordecor5'];
      await Promise.all(decorationsToPreload.map(d => imageLoader.getDecorationImage(d, 'outdoor')));

      // Preload indoor decorations
      const indoorDecorationsToPreload = ['brokenchair', 'crack', 'debris', 'paper', 'tabledebris'];
      await Promise.all(indoorDecorationsToPreload.map(d => imageLoader.getDecorationImage(d, 'indoor')));

      // Preload road and sidewalk decorations
      const roadDecorationsToPreload = ['road1', 'road2', 'road3'];
      await Promise.all(roadDecorationsToPreload.map(d => imageLoader.getDecorationImage(d, 'roadandsidewalk')));

      setImagesLoaded(true);
    };

    if (isInitialized) {
      preloadEntityImages();
    }
  }, [isInitialized, mapVersion]); // PHASE 23 Fix: Re-preload images whenever mapVersion changes (new map loaded)

  // Bust chunk cache whenever the active map changes (new map loaded, save restored).
  useEffect(() => {
    chunkCacheRef.current.invalidateAll();
  }, [mapVersion]);

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

    const handleGlobalMouseMove = (event) => handleMouseMoveRef.current?.(event);
    const handleGlobalMouseUp = () => handleMouseUpRef.current?.();
    const handleGlobalWheel = (event) => handleWheelRef.current?.(event);

    // Add wheel event listener directly to canvas
    canvas.addEventListener('wheel', handleGlobalWheel, { passive: false });

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      canvas.removeEventListener('wheel', handleGlobalWheel);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []); // Decoupled from state changes; runs exactly once on mount

  // Phase 17 & 18 + Phase 1 (dirty-flag gating): Autonomous rendering loop.
  // Runs independently of React state, reading directly from the engine, but
  // now renders a frame ONLY when needed:
  //   • renderRequestedRef — a one-shot dirty flag set by requestRender() / the
  //     per-render sync effect / engine 'update' subscription.
  //   • continuous animation — movement/zombie tweens, live effects, in-flight
  //     visual actions, or active rain — render every frame.
  //   • pulsers (fire/stun/turret/heard-blip) — render throttled to ~20fps.
  //   • safety heartbeat — a low-rate fallback so a missed dirty source can
  //     never strand the map on a stale frame (remove once Phase 1 is proven).
  useEffect(() => {
    let rafId;
    const PULSE_INTERVAL_MS = 50;    // ~20fps for pulse-only frames
    const SAFETY_INTERVAL_MS = 500;  // temporary fallback heartbeat

    const tick = (now) => {
      const continuous =
        continuousRef.current ||
        (engine.activeActions && engine.activeActions.size > 0) ||
        (engine.weather && engine.weather.type === 'rain') ||
        zoomPendingRef.current; // Phase 5: keep painting until the zoom settle-rebuild fires

      let doRender = false;
      if (renderRequestedRef.current || continuous) {
        doRender = true;
      } else if (sceneHasPulsersRef.current && (now - lastPulseFrameRef.current) >= PULSE_INTERVAL_MS) {
        doRender = true;
      } else if ((now - lastRenderTimeRef.current) >= SAFETY_INTERVAL_MS) {
        doRender = true;
      }

      if (doRender) {
        renderRequestedRef.current = false;
        renderMapRef.current?.();
        lastRenderTimeRef.current = now;
        // renderMap has now refreshed sceneHasPulsersRef for this frame.
        if (sceneHasPulsersRef.current) lastPulseFrameRef.current = now;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []); // Decoupled from state changes; runs exactly once on mount


  useEffect(() => {
    const handleResize = () => {
      if (isInitialized && gameMapRef.current && cameraRef.current) {
        requestRender();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialized, gameMapRef, cameraRef]);




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
        onMouseLeave={() => setHoveredTile?.(null)}
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

// --- Weather Rendering System (Screen Space) ---

const rainParticles = [];
const MAX_RAIN_PARTICLES = 1000;
let lastRainUpdate = performance.now();

function renderRain(ctx, width, height, intensity, dpr) {
  const now = performance.now();
  const dt = (now - lastRainUpdate) / 1000;
  lastRainUpdate = now;

  // 1. Particle Lifecycle
  const targetCount = Math.floor(MAX_RAIN_PARTICLES * intensity);
  
  // Add new particles if needed
  if (rainParticles.length < targetCount) {
    const toAdd = Math.min(20, targetCount - rainParticles.length);
    for (let i = 0; i < toAdd; i++) {
      rainParticles.push({
        x: Math.random() * width,
        y: Math.random() * -height, // Start above screen
        speed: (1500 + Math.random() * 1000) * dpr,
        length: (18 + Math.random() * 18) * dpr,
        width: (1.2 + Math.random() * 1) * dpr,
        opacity: 0.25 + Math.random() * 0.35
      });
    }
  }

  // 2. Update & Render
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Screen space
  ctx.strokeStyle = 'rgba(174, 194, 224, 0.85)'; // Brighter slate blue/gray rain
  ctx.lineCap = 'round';

  for (let i = rainParticles.length - 1; i >= 0; i--) {
    const p = rainParticles[i];
    
    // Move slanted (simulating wind)
    p.y += p.speed * dt;
    p.x += (p.speed * 0.15) * dt; // Slant to the right

    // Wrap or Recycle
    if (p.y > height) {
      if (rainParticles.length > targetCount) {
        rainParticles.splice(i, 1);
        continue;
      } else {
        p.y = -p.length;
        p.x = Math.random() * width;
      }
    }
    if (p.x > width) p.x = 0;

    // Draw raindrop
    ctx.globalAlpha = p.opacity;
    ctx.lineWidth = p.width;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + (p.length * 0.15), p.y + p.length);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw an improved survival-game style cursor highlight with corner brackets
 */
function drawImprovedCursor(ctx, x, y, size, canAfford) {
  const screenX = x * size;
  const screenY = y * size;
  const baseColor = canAfford ? '34, 197, 94' : '239, 68, 68'; // green vs red

  ctx.save();

  // 1. Draw subtle tile fill
  ctx.fillStyle = `rgba(${baseColor}, 0.2)`;
  ctx.fillRect(screenX, screenY, size, size);

  // 2. Draw thin full border
  ctx.strokeStyle = `rgba(${baseColor}, 0.3)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX, screenY, size, size);

  // 3. Draw thick corner brackets
  const len = Math.max(6, size / 5);
  const pad = 1.5; // small padding inside the tile boundary
  ctx.strokeStyle = `rgba(${baseColor}, 0.95)`;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Top-Left corner
  ctx.beginPath();
  ctx.moveTo(screenX + pad + len, screenY + pad);
  ctx.lineTo(screenX + pad, screenY + pad);
  ctx.lineTo(screenX + pad, screenY + pad + len);
  ctx.stroke();

  // Top-Right corner
  ctx.beginPath();
  ctx.moveTo(screenX + size - pad - len, screenY + pad);
  ctx.lineTo(screenX + size - pad, screenY + pad);
  ctx.lineTo(screenX + size - pad, screenY + pad + len);
  ctx.stroke();

  // Bottom-Left corner
  ctx.beginPath();
  ctx.moveTo(screenX + pad + len, screenY + size - pad);
  ctx.lineTo(screenX + pad, screenY + size - pad);
  ctx.lineTo(screenX + pad, screenY + size - pad - len);
  ctx.stroke();

  // Bottom-Right corner
  ctx.beginPath();
  ctx.moveTo(screenX + size - pad - len, screenY + size - pad);
  ctx.lineTo(screenX + size - pad, screenY + size - pad);
  ctx.lineTo(screenX + size - pad, screenY + size - pad - len);
  ctx.stroke();

  ctx.restore();
}
