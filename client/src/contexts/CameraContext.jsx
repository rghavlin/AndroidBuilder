import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';

const CameraContext = createContext();

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};

export const CameraProvider = ({ children }) => {
  // Camera ref as single source of truth
  const cameraRef = useRef(null);

  // Version state for rare structural re-renders
  const [cameraVersion, setCameraVersion] = useState(0);

  // Set camera ref (called during initialization)
  const setCamera = useCallback((camera) => {
    console.log('[CameraContext] setCamera called with:', camera ? `Camera at (${camera.x}, ${camera.y})` : 'null');
    cameraRef.current = camera;
    setCameraVersion(v => v + 1); // Trigger useMemo recalculation
    console.log('[CameraContext] cameraRef.current now:', cameraRef.current ? `Camera at (${cameraRef.current.x}, ${cameraRef.current.y})` : 'null');
    console.log('[CameraContext] cameraVersion incremented to trigger context value update');
  }, []);

  // Update camera viewport size based on canvas dimensions
  const updateCameraViewport = useCallback((canvasWidth, canvasHeight, tileSize) => {
    if (!cameraRef.current) return;

    cameraRef.current.updateViewportSize(canvasWidth, canvasHeight, tileSize);
    console.log('[CameraContext] Viewport updated:', {
      canvasSize: `${canvasWidth}x${canvasHeight}`,
      tileSize,
      viewport: `${cameraRef.current.viewportWidth}x${cameraRef.current.viewportHeight}`
    });
  }, []);

  // Center camera on specific coordinates
  const centerCameraOn = useCallback((x, y) => {
    if (!cameraRef.current) return;

    cameraRef.current.centerOn(x, y);
    console.log(`[CameraContext] Camera centered on (${x}, ${y})`);
  }, []);

  // Pan camera by delta amount
  const panCamera = useCallback((deltaX, deltaY) => {
    if (!cameraRef.current) return;

    cameraRef.current.pan(deltaX, deltaY);
    console.log(`[CameraContext] Camera panned by (${deltaX}, ${deltaY})`);
  }, []);

  // Zoom camera
  const zoomCamera = useCallback((zoomLevel) => {
    if (!cameraRef.current) return;

    if (zoomLevel > 0) {
      cameraRef.current.zoomIn(zoomLevel);
    } else {
      cameraRef.current.zoomOut(Math.abs(zoomLevel));
    }
    console.log(`[CameraContext] Camera zoom changed: ${zoomLevel > 0 ? 'in' : 'out'} by ${Math.abs(zoomLevel)}`);
  }, []);

  // Get camera visible bounds (for rendering optimization)
  const getCameraVisibleBounds = useCallback(() => {
    if (!cameraRef.current) return null;

    return cameraRef.current.getVisibleBounds();
  }, []);

  // Check if tile is visible in current camera view
  const isTileVisible = useCallback((tileX, tileY) => {
    if (!cameraRef.current) return false;

    return cameraRef.current.isTileVisible(tileX, tileY);
  }, []);

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX, worldY) => {
    if (!cameraRef.current) return { x: 0, y: 0 };

    return cameraRef.current.worldToScreen(worldX, worldY);
  }, []);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX, screenY) => {
    if (!cameraRef.current) return { x: 0, y: 0 };

    return cameraRef.current.screenToWorld(screenX, screenY);
  }, []);

  // Update camera each frame (for smooth following)
  const updateCamera = useCallback(() => {
    if (!cameraRef.current) return;

    cameraRef.current.update();
  }, []);

  // Set camera world bounds with version increment
  const setWorldBounds = useCallback((width, height) => {
    if (!cameraRef.current) return;

    cameraRef.current.setWorldBounds(width, height);
    setCameraVersion(v => v + 1);
    console.log(`[CameraContext] Camera world bounds set to ${width}x${height}, version incremented`);
  }, []);

  // Center camera without state update (no re-render)
  const centerOn = useCallback((x, y) => {
    if (!cameraRef.current) return;

    cameraRef.current.centerOn(x, y);
    console.log(`[CameraContext] Camera centered on (${x}, ${y}) - no state update`);
  }, []);

  // Legacy method for compatibility
  const setCameraWorldBounds = useCallback((width, height) => {
    setWorldBounds(width, height);
  }, [setWorldBounds]);

  // Follow entity (like player)
  const followEntity = useCallback((entity) => {
    if (!cameraRef.current || !entity) return;

    cameraRef.current.followEntity(entity);
    console.log(`[CameraContext] Camera following entity at (${entity.x}, ${entity.y})`);
  }, []);

  const contextValue = useMemo(() => ({
    // Camera data - expose both ref and current value
    cameraRef,
    camera: cameraRef.current,
    cameraVersion,

    // Methods
    setCamera,
    setWorldBounds,
    centerOn,
    updateCameraViewport,
    centerCameraOn,
    panCamera,
    zoomCamera,
    getCameraVisibleBounds,
    isTileVisible,
    worldToScreen,
    screenToWorld,
    updateCamera,
    setCameraWorldBounds, // Legacy compatibility
    followEntity
  }), [
    cameraVersion, // Version triggers updates when camera ref changes
    setCamera,
    setWorldBounds,
    centerOn,
    updateCameraViewport,
    centerCameraOn,
    panCamera,
    zoomCamera,
    getCameraVisibleBounds,
    isTileVisible,
    worldToScreen,
    screenToWorld,
    updateCamera,
    setCameraWorldBounds,
    followEntity
  ]);

  return (
    <CameraContext.Provider value={contextValue}>
      {children}
    </CameraContext.Provider>
  );
};