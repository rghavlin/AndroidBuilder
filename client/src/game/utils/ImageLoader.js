/**
 * ImageLoader - Handles loading and caching of entity images
 * Falls back to default rendering if images are not found
 */
export class ImageLoader {
  constructor() {
    this.imageCache = new Map();
    this.loadingPromises = new Map();

    // Determine the correct base path for images
    this.basePath = this.determineBasePath();
    console.log('[ImageLoader] Base path set to:', this.basePath);
  }

  /**
   * Determine the correct base path for images based on environment
   * @returns {string} - Base path for images
   */
  determineBasePath() {
    // Check if running in electron
    const isElectron = typeof window !== 'undefined' && window.electronAPI;

    if (isElectron) {
      // In electron, try multiple possible paths
      return './images/entities/';
    } else {
      // In web browser or development mode
      return '/images/entities/';
    }
  }

  async getImage(entityType, subtype = null) {
    // 1. Determine the canonical image key for this specific entity
    let imageKey = entityType;
    if (subtype && subtype !== 'basic') {
      imageKey = `${entityType}_${subtype}`;
    }

    // 2. Specialized mapping for known subtypes
    if (entityType === 'zombie') {
      if (subtype === 'crawler') imageKey = 'crawlerzombie';
      else if (subtype === 'runner') imageKey = 'runnerzombie';
      else if (subtype === 'acid') imageKey = 'acidzombie';
      else if (subtype === 'firefighter') imageKey = 'firefighterzombie';
      else if (subtype === 'swat') imageKey = 'swatzombie';
      else if (subtype === 'fat') imageKey = 'fatzombie';
      else if (subtype === 'soldier') imageKey = 'soldierzombie';
      else imageKey = 'zombie'; // Default zombie for basic/null
    } else if (entityType === 'rabbit') {
      imageKey = 'rabbit';
    } else if (entityType === 'item' && subtype === 'ground_pile') {
      // LOOT DROP ICON: Use default.png from items folder
      return this.getItemImage('default');
    } else if (entityType === 'item' && subtype === 'hole') {
      // HOLE ICON: Use hole.png from items folder
      return this.getItemImage('hole');
    } else if (entityType === 'item' && subtype === 'cornplant') {
      return this.getItemImage('cornplant');
    } else if (entityType === 'item' && subtype === 'tomatoplant') {
      return this.getItemImage('tomatoplant');
    } else if (entityType === 'item' && subtype === 'carrotplant') {
      return this.getItemImage('carrotplant');
    } else if (entityType === 'item' && subtype === 'harvestablecorn') {
      return this.getItemImage('harvestablecorn');
    } else if (entityType === 'item' && subtype === 'harvestabletomato') {
      return this.getItemImage('harvestabletomato');
    } else if (entityType === 'item' && subtype === 'harvestablecarrot') {
      return this.getItemImage('harvestablecarrot');
    } else if (entityType === 'item' && subtype === 'bed') {
      return this.getItemImage('bed');
    }

    // 3. Return cached image if available
    if (this.imageCache.has(imageKey)) {
      return this.imageCache.get(imageKey);
    }

    // 4. Return existing loading promise if already in flight
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    // 5. Special routing for place icons
    if (entityType === 'place_icon' && subtype) {
      // Use getPlaceImage but ensure we cache it under the canonical entity imageKey too
      const getPromise = this.getPlaceImage(subtype);
      this.loadingPromises.set(imageKey, getPromise);
      try {
        const image = await getPromise;
        if (image) {
          this.imageCache.set(imageKey, image);
          this.loadingPromises.delete(imageKey);
          return image;
        }
      } catch (error) {
        console.warn(`[ImageLoader] Place image load failed for ${subtype}`);
      }
    }

    // 6. Generic load attempt for entities
    const loadPromise = this.loadImage(imageKey);
    this.loadingPromises.set(imageKey, loadPromise);

    try {
      const image = await loadPromise;
      this.imageCache.set(imageKey, image);
      this.loadingPromises.delete(imageKey);
      return image;
    } catch (error) {
      // On failure, try to fall back to the base entity type image
      if (imageKey !== entityType) {
        console.log(`[ImageLoader] Failed to load ${imageKey}, falling back to ${entityType}`);
        return this.getImage(entityType);
      }
      
      // Complete failure: cache null to prevent thrashing
      console.warn(`[ImageLoader] No asset found for ${imageKey} or fallback`);
      this.imageCache.set(imageKey, null);
      this.loadingPromises.delete(imageKey);
      return null;
    }
  }

  /**
   * Get image for a special building or landmark (from places folder)
   * @param {string} placeName - Name of the place icon (grocer, firestation, etc)
   * @returns {Promise<HTMLImageElement|null>} - Image element or null if not found
   */
  async getPlaceImage(placeName) {
    // Standardize naming: police_station -> police
    const canonicalName = placeName === 'police_station' ? 'police' : placeName;
    const imageKey = `place_${canonicalName}`;

    // Return cached image if available
    if (this.imageCache.has(imageKey)) {
      return this.imageCache.get(imageKey);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    // Start loading the place image
    const loadPromise = this.loadPlaceImage(canonicalName);
    this.loadingPromises.set(imageKey, loadPromise);

    try {
      const image = await loadPromise;
      this.imageCache.set(imageKey, image);
      this.loadingPromises.delete(imageKey);
      return image;
    } catch (error) {
      console.log(`[ImageLoader] Place image not found: ${canonicalName}`);
      this.imageCache.set(imageKey, null);
      this.loadingPromises.delete(imageKey);
      return null;
    }
  }

  /**
   * Load place image from file system
   * @param {string} placeName - Name of the place icon
   * @returns {Promise<HTMLImageElement>} - Promise that resolves to image element
   */
  loadPlaceImage(placeName) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const extensions = ['png', 'jpg', 'jpeg'];
      let extensionIndex = 0;
      let basePathIndex = 0;

      const basePaths = [
        '/images/places/',
        './images/places/',
        '../images/places/',
        './client/public/images/places/',
        '../client/public/images/places/'
      ];

      const tryNextPath = () => {
        if (basePathIndex >= basePaths.length) {
          reject(new Error(`No place image found for: ${placeName}`));
          return;
        }

        const currentBasePath = basePaths[basePathIndex];
        extensionIndex = 0;
        tryNextExtension(currentBasePath);
      };

      const tryNextExtension = (currentBasePath) => {
        if (extensionIndex >= extensions.length) {
          basePathIndex++;
          tryNextPath();
          return;
        }

        const extension = extensions[extensionIndex];
        const fullPath = `${currentBasePath}${placeName}.${extension}`;

        img.src = fullPath;
        extensionIndex++;
      };

      img.onload = () => {
        if (img.naturalWidth > 0) {
          console.log(`[ImageLoader] Successfully loaded place image: ${img.src}`);
          resolve(img);
        } else {
          // Some browsers trigger onload even for broken images
          console.warn(`[ImageLoader] Place image reported success but has 0 dimensions: ${img.src}`);
          img.onerror();
        }
      };

      img.onerror = () => {
        tryNextExtension(basePaths[basePathIndex]);
      };

      tryNextPath();
    });
  }

  /**
   * Load image from file system
   * @param {string} imageKey - Key identifying the image
   * @returns {Promise<HTMLImageElement>} - Promise that resolves to image element
   */
  loadImage(imageKey) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      // Try different file extensions
      const extensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
      let extensionIndex = 0;
      let basePathIndex = 0;

      // Multiple base paths to try in electron
      const basePaths = [
        this.basePath,
        './images/entities/',
        '../images/entities/',
        './client/public/images/entities/',
        '../client/public/images/entities/'
      ];

      const tryNextPath = () => {
        if (basePathIndex >= basePaths.length) {
          reject(new Error(`No image found for: ${imageKey}`));
          return;
        }

        const currentBasePath = basePaths[basePathIndex];
        extensionIndex = 0;
        tryNextExtension(currentBasePath);
      };

      const tryNextExtension = (currentBasePath) => {
        if (extensionIndex >= extensions.length) {
          basePathIndex++;
          tryNextPath();
          return;
        }

        const extension = extensions[extensionIndex];
        const fullPath = `${currentBasePath}${imageKey}.${extension}`;

        img.src = fullPath;
        extensionIndex++;
      };

      img.onload = () => {
        if (img.naturalWidth > 0) {
          console.log(`[ImageLoader] Successfully loaded image: ${img.src}`);
          resolve(img);
        } else {
          // Some browsers trigger onload even for broken images
          console.warn(`[ImageLoader] Entity image reported success but has 0 dimensions: ${img.src}`);
          img.onerror();
        }
      };

      img.onerror = () => {
        tryNextExtension(basePaths[basePathIndex]);
      };

      // Start with first base path and extension
      tryNextPath();
    });
  }

  /**
   * Preload commonly used images
   * @param {Array<string>} entityTypes - Array of entity types to preload
   */
  async preloadImages(entityTypes) {
    const loadPromises = entityTypes.map(entityType => 
      this.getImage(entityType).catch(error => {
        return null;
      })
    );

    await Promise.all(loadPromises);
  }

  /**
   * Check if an image is available for an entity
   * @param {string} entityType - Type of entity
   * @param {string} subtype - Optional subtype
   * @returns {boolean} - Whether image is cached and available
   */
  hasImage(entityType, subtype = null) {
    const imageKey = subtype ? `${entityType}_${subtype}` : entityType;
    const cachedImage = this.imageCache.get(imageKey);
    return cachedImage !== null && cachedImage !== undefined;
  }

  /**
   * Get UI image (from UI folder)
   * @param {string} imageName - Name of the UI image (without extension)
   * @returns {Promise<HTMLImageElement|null>} - Image element or null if not found
   */
  async getUIImage(imageName) {
    const imageKey = `ui_${imageName}`;

    // Return cached image if available
    if (this.imageCache.has(imageKey)) {
      return this.imageCache.get(imageKey);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    // Start loading the UI image
    const loadPromise = this.loadUIImage(imageName);
    this.loadingPromises.set(imageKey, loadPromise);

    try {
      const image = await loadPromise;
      this.imageCache.set(imageKey, image);
      this.loadingPromises.delete(imageKey);
      return image;
    } catch (error) {
      // Cache null result to avoid repeated failed attempts
      this.imageCache.set(imageKey, null);
      this.loadingPromises.delete(imageKey);
      return null;
    }
  }

  /**
   * Load UI image from file system
   * @param {string} imageName - Name of the UI image
   * @returns {Promise<HTMLImageElement>} - Promise that resolves to image element
   */
  loadUIImage(imageName) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      // Try different file extensions
      const extensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
      let extensionIndex = 0;
      let basePathIndex = 0;

      console.log(`[ImageLoader] Loading UI image (using same logic as entity images)`);

      // Use EXACT same paths as entity images but point to UI folder
      // This should work since entity images are loading successfully
      const basePaths = [
        '/images/UI/',                    // Web mode path (will fail in electron)
        './images/UI/',                   // Working entity path equivalent
        '../images/UI/',                  // Working entity path equivalent  
        './client/public/images/UI/',     // Working entity path equivalent
        '../client/public/images/UI/'     // Working entity path equivalent
      ];

      const tryNextPath = () => {
        if (basePathIndex >= basePaths.length) {
          reject(new Error(`No UI image found for: ${imageName}`));
          return;
        }

        const currentBasePath = basePaths[basePathIndex];
        extensionIndex = 0;
        tryNextExtension(currentBasePath);
      };

      const tryNextExtension = (currentBasePath) => {
        if (extensionIndex >= extensions.length) {
          basePathIndex++;
          tryNextPath();
          return;
        }

        const extension = extensions[extensionIndex];
        const fullPath = `${currentBasePath}${imageName}.${extension}`;

        img.src = fullPath;
        extensionIndex++;
      };

      img.onload = () => {
        console.log(`[ImageLoader] Successfully loaded UI image: ${img.src}`);
        resolve(img);
      };

      img.onerror = () => {
        tryNextExtension(basePaths[basePathIndex]);
      };

      // Start with first base path and extension
      tryNextPath();
    });
  }

  /**
   * Get item image (from items folder)
   * @param {string} imageId - ID of the item image (without extension)
   * @returns {Promise<HTMLImageElement|null>} - Image element or null if not found
   */
  async getItemImage(imageId) {
    const imageKey = `item_${imageId}`;

    // Return cached image if available
    if (this.imageCache.has(imageKey)) {
      return this.imageCache.get(imageKey);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    // Start loading the item image
    const loadPromise = this.loadItemImage(imageId);
    this.loadingPromises.set(imageKey, loadPromise);

    try {
      const image = await loadPromise;
      this.imageCache.set(imageKey, image);
      this.loadingPromises.delete(imageKey);
      return image;
    } catch (error) {
      // Try to load default image as fallback
      console.log(`[ImageLoader] Item image not found: ${imageId}, trying default...`);
      const defaultPromise = this.loadItemImage('default');
      try {
        const defaultImage = await defaultPromise;
        this.imageCache.set(imageKey, defaultImage);
        this.loadingPromises.delete(imageKey);
        return defaultImage;
      } catch (defaultError) {
        // Cache null result to avoid repeated failed attempts
        this.imageCache.set(imageKey, null);
        this.loadingPromises.delete(imageKey);
        return null;
      }
    }
  }

  /**
   * Load item image from file system
   * @param {string} imageId - ID of the item image
   * @returns {Promise<HTMLImageElement>} - Promise that resolves to image element
   */
  loadItemImage(imageId) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      // Try different file extensions
      const extensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
      let extensionIndex = 0;
      let basePathIndex = 0;

      // Use same path structure as entity and UI images
      const basePaths = [
        '/images/items/',
        './images/items/',
        '../images/items/',
        './client/public/images/items/',
        '../client/public/images/items/'
      ];

      const tryNextPath = () => {
        if (basePathIndex >= basePaths.length) {
          reject(new Error(`No item image found for: ${imageId}`));
          return;
        }

        const currentBasePath = basePaths[basePathIndex];
        extensionIndex = 0;
        tryNextExtension(currentBasePath);
      };

      const tryNextExtension = (currentBasePath) => {
        if (extensionIndex >= extensions.length) {
          basePathIndex++;
          tryNextPath();
          return;
        }

        const extension = extensions[extensionIndex];
        const fullPath = `${currentBasePath}${imageId}.${extension}`;

        img.src = fullPath;
        extensionIndex++;
      };

      img.onload = () => {
        console.log(`[ImageLoader] Successfully loaded item image: ${img.src}`);
        resolve(img);
      };

      img.onerror = () => {
        tryNextExtension(basePaths[basePathIndex]);
      };

      // Start with first base path and extension
      tryNextPath();
    });
  }

  /**
   * Get tile image (from tiles folder)
   * @param {string} terrainType - Type of the terrain (grass, road, etc)
   * @returns {Promise<HTMLImageElement|null>} - Image element or null if not found
   */
  async getTileImage(terrainType) {
    const imageKey = `tile_${terrainType}`;

    // Return cached image if available
    if (this.imageCache.has(imageKey)) {
      return this.imageCache.get(imageKey);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    // Start loading the tile image
    const loadPromise = this.loadTileImage(terrainType);
    this.loadingPromises.set(imageKey, loadPromise);

    try {
      const image = await loadPromise;
      this.imageCache.set(imageKey, image);
      this.loadingPromises.delete(imageKey);
      return image;
    } catch (error) {
      // Cache null result to avoid repeated failed attempts
      console.log(`[ImageLoader] Tile image not found: ${terrainType}`);
      this.imageCache.set(imageKey, null);
      this.loadingPromises.delete(imageKey);
      return null;
    }
  }

  /**
   * Load tile image from file system
   * @param {string} terrainType - Type of the terrain
   * @returns {Promise<HTMLImageElement>} - Promise that resolves to image element
   */
  loadTileImage(terrainType) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      // Try different file extensions
      const extensions = ['png', 'jpg', 'jpeg', 'webp'];
      let extensionIndex = 0;
      let basePathIndex = 0;

      // Use same path structure
      const basePaths = [
        '/images/tiles/',
        './images/tiles/',
        '../images/tiles/',
        './client/public/images/tiles/',
        '../client/public/images/tiles/'
      ];

      const tryNextPath = () => {
        if (basePathIndex >= basePaths.length) {
          reject(new Error(`No tile image found for: ${terrainType}`));
          return;
        }

        const currentBasePath = basePaths[basePathIndex];
        extensionIndex = 0;
        tryNextExtension(currentBasePath);
      };

      const tryNextExtension = (currentBasePath) => {
        if (extensionIndex >= extensions.length) {
          basePathIndex++;
          tryNextPath();
          return;
        }

        const extension = extensions[extensionIndex];
        const fullPath = `${currentBasePath}${terrainType}.${extension}`;

        img.src = fullPath;
        extensionIndex++;
      };

      img.onload = () => {
        console.log(`[ImageLoader] Successfully loaded tile image: ${img.src}`);
        resolve(img);
      };

      img.onerror = () => {
        tryNextExtension(basePaths[basePathIndex]);
      };

      tryNextPath();
    });
  }

  /**
   * Clear the image cache
   */
  clearCache() {
    this.imageCache.clear();
    this.loadingPromises.clear();
    console.log('[ImageLoader] Cache cleared');
  }
}

// Create singleton instance
export const imageLoader = new ImageLoader();