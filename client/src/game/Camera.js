/**
 * Camera - Handles viewport management and smooth following
 * Follows UniversalGoals.md: modular, event-driven, serialization
 */
export class Camera {
  constructor(viewportWidth = 20, viewportHeight = 20, tileSize = 24) {
    this.baseViewportWidth = viewportWidth;
    this.baseViewportHeight = viewportHeight;
    this.tileSize = tileSize;

    // Zoom settings
    this.zoomLevel = 1.0;
    this.minZoom = 0.5;  // 50% of starting point
    this.maxZoom = 1.2;  // 20% larger than starting point

    // Camera position in world coordinates
    this.x = 0;
    this.y = 0;

    // Target position for smooth following
    this.targetX = 0;
    this.targetY = 0;

    // World bounds
    this.worldWidth = 20;
    this.worldHeight = 20;

    // Smoothing settings
    this.followSpeed = 0.1;
    this.isFollowing = false;

    // Event system
    this.listeners = new Map();

    console.log('[Camera] Camera initialized with viewport:', this.viewportWidth, 'x', this.viewportHeight);
  }

  /**
   * Get current effective viewport size (accounting for zoom)
   */
  get viewportWidth() {
    return this.baseViewportWidth / this.zoomLevel;
  }

  get viewportHeight() {
    return this.baseViewportHeight / this.zoomLevel;
  }

  /**
   * Set zoom level
   */
  setZoom(zoomLevel) {
    const oldZoom = this.zoomLevel;
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoomLevel));

    // Recalculate camera position to maintain center point
    if (oldZoom !== this.zoomLevel) {
      this.setPosition(this.x, this.y); // Re-constrain with new viewport size
      this.emit('zoomChanged', {
        zoomLevel: this.zoomLevel,
        viewportWidth: this.viewportWidth,
        viewportHeight: this.viewportHeight
      });
    }
  }

  /**
   * Zoom in by a factor
   */
  zoomIn(factor = 1.2) {
    this.setZoom(this.zoomLevel * factor);
  }

  /**
   * Zoom out by a factor
   */
  zoomOut(factor = 1.2) {
    this.setZoom(this.zoomLevel / factor);
  }

  /**
   * Add event listener
   */
  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit events
   */
  emit(eventType, data = {}) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => callback(data));
    }
  }

  /**
   * Set world bounds
   */
  setWorldBounds(width, height) {
    this.worldWidth = width;
    this.worldHeight = height;
    console.log('[Camera] World bounds set to:', width, 'x', height);
  }

  /**
   * Update viewport size based on actual canvas dimensions and tile size
   */
  updateViewportSize(canvasWidth, canvasHeight, tileSize) {
    const tilesWide = Math.floor(canvasWidth / tileSize);
    const tilesHigh = Math.floor(canvasHeight / tileSize);

    // Ensure we have valid viewport dimensions
    this.baseViewportWidth = Math.max(1, tilesWide);
    this.baseViewportHeight = Math.max(1, tilesHigh);

    // Viewport updated silently
  }

  /**
   * Center camera on specific coordinates
   * NOTE: This only moves the camera view, not any entities
   */
  centerOn(x, y) {
    const newX = x;
    const newY = y;
    this.setPosition(newX, newY);
    // Only log significant center changes (reduced logging during smooth movement)
    if (Math.abs(newX - this.x) > 2 || Math.abs(newY - this.y) > 2) {
      console.log('[Camera] Centered on:', Math.round(newX * 10) / 10, Math.round(newY * 10) / 10);
    }
  }

  /**
   * Pan camera by delta amount
   */
  pan(deltaX, deltaY) {
    this.setPosition(this.x + deltaX, this.y + deltaY);
  }

  /**
   * Get visible tiles for the current viewport
   */
  getVisibleTiles() {
    const startX = Math.max(0, Math.floor(this.x - this.viewportWidth / 2));
    const endX = Math.min(this.worldWidth - 1, Math.ceil(this.x + this.viewportWidth / 2));
    const startY = Math.max(0, Math.floor(this.y - this.viewportHeight / 2));
    const endY = Math.min(this.worldHeight - 1, Math.ceil(this.y + this.viewportHeight / 2));

    return { startX, endX, startY, endY };
  }

  /**
   * Set camera position immediately with boundary constraints
   */
  setPosition(x, y) {
    const newX = x;
    const newY = y;
    const constrainedPos = this.constrainPosition(newX, newY);
    this.x = constrainedPos.x;
    this.y = constrainedPos.y;
    this.targetX = constrainedPos.x;
    this.targetY = constrainedPos.y;
    this.emit('cameraPositionChanged', { x: this.x, y: this.y });
    // Reduced logging for smooth movement (less frequent during animation)
    if (Math.abs(newX - this.x) > 1 || Math.abs(newY - this.y) > 1) {
      console.log('[Camera] Position set to:', Math.round(newX * 10) / 10, Math.round(newY * 10) / 10);
    }
  }

  /**
   * Constrain camera position to valid bounds
   */
  constrainPosition(x, y) {
    // Edge buffer - camera won't move when player is within this distance of map edge
    const edgeBuffer = 5;
    // Calculate camera movement bounds based on edge buffer
    const minX = edgeBuffer;
    const maxX = this.worldWidth - edgeBuffer;
    const minY = edgeBuffer;
    const maxY = this.worldHeight - edgeBuffer;

    // Constrain camera position to stay away from edges
    const constrainedX = Math.max(minX, Math.min(maxX, x));
    const constrainedY = Math.max(minY, Math.min(maxY, y));

    const debugInfo = {
      requested: { x, y },
      edgeBuffer,
      world: { width: this.worldWidth, height: this.worldHeight },
      bounds: { minX, maxX, minY, maxY },
      result: { x: constrainedX, y: constrainedY }
    };

    // Only log constraint changes when position actually changes
    if (Math.abs(debugInfo.result.x - debugInfo.requested.x) > 0.01 ||
        Math.abs(debugInfo.result.y - debugInfo.requested.y) > 0.01) {
      console.log('[Camera] Constraint applied:', {
        from: `(${Math.round(debugInfo.requested.x)}, ${Math.round(debugInfo.requested.y)})`,
        to: `(${Math.round(debugInfo.result.x)}, ${Math.round(debugInfo.result.y)})`
      });
    }

    return { x: constrainedX, y: constrainedY };
  }

  /**
   * Set target position for smooth following
   */
  setTarget(x, y) {
    const constrainedPos = this.constrainPosition(x, y);
    this.targetX = constrainedPos.x;
    this.targetY = constrainedPos.y;
    console.log('[Camera] Target set to:', this.targetX, this.targetY, '(requested:', x, y, ')');
  }

  /**
   * Follow an entity (like the player)
   */
  followEntity(entity) {
    if (entity && entity.x !== undefined && entity.y !== undefined) {
      this.setTarget(entity.x, entity.y);
      this.isFollowing = true;
      console.log('[Camera] Following entity at:', entity.x, entity.y);
    }
  }

  /**
   * Update camera position (call each frame)
   */
  update() {
    if (this.isFollowing) {
      // Smooth interpolation toward target
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;

      const newX = this.x + dx * this.followSpeed;
      const newY = this.y + dy * this.followSpeed;

      this.x = newX;
      this.y = newY;

      // Stop following when close enough
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isFollowing = false;
      }

      this.emit('cameraPositionChanged', { x: this.x, y: this.y });
      // Reduced logging for smooth movement (less frequent during update)
      if (Math.abs(newX - this.x) > 1 || Math.abs(newY - this.y) > 1) {
        console.log('[Camera] Position set to:', Math.round(newX * 10) / 10, Math.round(newY * 10) / 10);
      }
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY) {
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    const screenX = centerX + (worldX - this.x);
    const screenY = centerY + (worldY - this.y);

    return { x: screenX, y: screenY };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    const worldX = this.x + (screenX - centerX);
    const worldY = this.y + (screenY - centerY);

    return { x: Math.floor(worldX), y: Math.floor(worldY) };
  }

  /**
   * Get visible tile bounds
   */
  getVisibleBounds() {
    const halfWidth = this.viewportWidth / 2;
    const halfHeight = this.viewportHeight / 2;

    return {
      left: Math.floor(this.x - halfWidth - 1),
      right: Math.ceil(this.x + halfWidth + 1),
      top: Math.floor(this.y - halfHeight - 1),
      bottom: Math.ceil(this.y + halfHeight + 1)
    };
  }

  /**
   * Check if a tile is visible
   */
  isTileVisible(tileX, tileY) {
    const bounds = this.getVisibleBounds();
    return tileX >= bounds.left && tileX <= bounds.right &&
           tileY >= bounds.top && tileY <= bounds.bottom;
  }

  /**
   * Get viewport bounds (camera position and dimensions)
   */
  getViewportBounds() {
    const halfWidth = this.viewportWidth / 2;
    const halfHeight = this.viewportHeight / 2;

    return {
      x: this.x,
      y: this.y,
      width: this.viewportWidth,
      height: this.viewportHeight,
      left: this.x - halfWidth,
      right: this.x + halfWidth,
      top: this.y - halfHeight,
      bottom: this.y + halfHeight
    };
  }

  /**
   * Serialize camera state to JSON
   */
  toJSON() {
    return {
      x: this.x,
      y: this.y,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
      zoomLevel: this.zoomLevel,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom
    };
  }

  /**
   * Create Camera from JSON data
   */
  static fromJSON(data) {
    const camera = new Camera(data.viewportWidth, data.viewportHeight);
    camera.x = data.x;
    camera.y = data.y;
    camera.setWorldBounds(data.worldWidth, data.worldHeight);
    camera.zoomLevel = data.zoomLevel;
    camera.minZoom = data.minZoom;
    camera.maxZoom = data.maxZoom;
    return camera;
  }
}