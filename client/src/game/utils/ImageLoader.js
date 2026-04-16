/**
 * ImageLoader - Handles loading and caching of entity images
 * Falls back to default rendering if images are not found
 */
import { getZombieType } from '../entities/ZombieTypes.js';

export class ImageLoader {
  constructor() {
    this.images = {};
    this.loadingPromises = new Map();
    this.failedImagesCount = new Map();
    this.permanentFailures = new Set(); // New: Track images that consistently fail to load
    this.maxRetries = 3;
    this.onImageLoaded = null; // Callback for reactive re-rendering (MapCanvas)

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
    
    // Determine the root public/images/ path
    // USE ABSOLUTE PATHS FROM DOMAIN ROOT to prevent resolution errors on reload.
    const rootPath = isElectron ? './images/' : '/images/';
    
    return {
      root: rootPath,
      entities: `${rootPath}entities/`,
      tiles: `${rootPath}tiles/`,
      items: `${rootPath}items/`,
      places: `${rootPath}places/`,
      UI: `${rootPath}UI/`
    };
  }

  async getImage(entityType, subtype = null) {
    // 1. Determine the canonical image key for this specific entity
    let imageKey = entityType;
    if (subtype && subtype !== 'basic') {
      imageKey = `${entityType}_${subtype}`;
    }

    // 2. Specialized mapping for known subtypes
    if (entityType === 'zombie') {
      const typeDef = getZombieType(subtype);
      imageKey = typeDef?.spriteKey || 'zombie';
    } else if (entityType === 'rabbit') {
      imageKey = 'rabbit';
    } else if (entityType === 'item') {
      // Specialized items (e.g., weapons, tools, furniture) load from /images/items/
      if (subtype && subtype !== 'basic' && subtype !== 'ground_pile' && subtype !== 'hole') {
        return this.getItemImage(subtype);
      }
      // Generic loot drops or holes fall through to standard getImage('item') or specific mapping
      if (subtype === 'hole') imageKey = 'hole';
      else imageKey = 'item';
    } else if (['cornplant', 'tomatoplant', 'carrotplant', 'harvestablecorn', 'harvestabletomato', 'harvestablecarrot', 'bed'].includes(subtype)) {
      return this.getItemImage(subtype);
    }

    // 3. Return cached image if available and valid
    if (this.images[imageKey]) {
      return this.images[imageKey];
    }

    // 4. Return existing loading promise if already in flight
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    // Stop trying if we have permanently failed (>= 3 times)
    if ((this.failedImagesCount.get(imageKey) || 0) >= 3) {
      return null;
    }

    // 5. Atomic loading wrapper to prevent race conditions and unhandled rejections
    const loadPromise = (async () => {
      try {
        // Special routing for place icons
        if (entityType === 'place_icon' && subtype) {
          const image = await this.getPlaceImage(subtype);
          if (image) {
            this.images[imageKey] = image;
            return image;
          }
        }

        // Generic load attempt for entities
        const image = await this.loadImage(imageKey);
        this.images[imageKey] = image;
        this.failedImagesCount.delete(imageKey);
        return image;
      } catch (error) {
        // On failure, try to fall back to the base entity type image
        if (imageKey !== entityType) {
          console.log(`[ImageLoader] Failed to load ${imageKey}, falling back to ${entityType}`);
          const fallback = await this.getImage(entityType);
          if (fallback) return fallback;
        }
        
        const fails = (this.failedImagesCount.get(imageKey) || 0) + 1;
        this.failedImagesCount.set(imageKey, fails);
        console.warn(`[ImageLoader] No asset found for ${imageKey} or fallback (Attempt ${fails}/3)`);
        return null;
      } finally {
        this.loadingPromises.delete(imageKey);
      }
    })();

    this.loadingPromises.set(imageKey, loadPromise);
    return loadPromise;
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
    if (this.images[imageKey]) {
      return this.images[imageKey];
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    const loadPromise = (async () => {
      try {
        const image = await this.loadPlaceImage(canonicalName);
        this.images[imageKey] = image;
        this.failedImagesCount.delete(imageKey); // Reset on success
        return image;
      } catch (error) {
        const fails = (this.failedImagesCount.get(imageKey) || 0) + 1;
        this.failedImagesCount.set(imageKey, fails);
        console.warn(`[ImageLoader] Failed to load place image: ${placeName} (Attempt ${fails}/3)`);
        return null;
      } finally {
        this.loadingPromises.delete(imageKey);
      }
    })();

    this.loadingPromises.set(imageKey, loadPromise);
    return loadPromise;
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
        this.basePath.places,
        '/images/places/',
        './images/places/'
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
          if (this.onImageLoaded) this.onImageLoaded();
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

      // Robust absolute paths based on environment detection
      const basePaths = [
        this.basePath.entities,
        '/images/entities/',
        './images/entities/'
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
          if (this.onImageLoaded) this.onImageLoaded();
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
    const cachedImage = this.images[imageKey];
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
    if (this.images[imageKey]) {
      return this.images[imageKey];
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    const loadPromise = (async () => {
      try {
        const image = await this.loadUIImage(imageName);
        this.images[imageKey] = image;
        return image;
      } catch (error) {
        console.warn(`[ImageLoader] UI image not found: ${imageName}`);
        this.images[imageKey] = null;
        return null;
      } finally {
        this.loadingPromises.delete(imageKey);
      }
    })();

    this.loadingPromises.set(imageKey, loadPromise);
    return loadPromise;
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
        this.basePath.UI,
        '/images/UI/',
        './images/UI/'
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
        if (this.onImageLoaded) this.onImageLoaded();
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
    if (this.images[imageKey]) {
      return this.images[imageKey];
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    const loadPromise = (async () => {
      try {
        const image = await this.loadItemImage(imageId);
        this.images[imageKey] = image;
        this.failedImagesCount.delete(imageKey);
        return image;
      } catch (error) {
        // Try to load default image as fallback
        console.log(`[ImageLoader] Item image not found: ${imageId}, trying default...`);
        try {
          const defaultImage = await this.loadItemImage('default');
          this.images[imageKey] = defaultImage;
          this.failedImagesCount.delete(imageKey); // Reset on fallback success
          return defaultImage;
        } catch (defaultError) {
          const fails = (this.failedImagesCount.get(imageKey) || 0) + 1;
          this.failedImagesCount.set(imageKey, fails);
          console.warn(`[ImageLoader] Failed to load item image: ${imageId} (Attempt ${fails}/3)`);
          return null;
        }
      } finally {
        this.loadingPromises.delete(imageKey);
      }
    })();

    this.loadingPromises.set(imageKey, loadPromise);
    return loadPromise;
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
        this.basePath.items,
        '/images/items/',
        './images/items/'
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
        if (this.onImageLoaded) this.onImageLoaded();
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
    if (this.images[imageKey]) {
      return this.images[imageKey];
    }

    // Return null immediately if this image is known to fail (prevents rendering loops)
    if (this.permanentFailures.has(imageKey)) {
        return null;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    const loadPromise = (async () => {
      try {
        const image = await this.loadTileImage(terrainType);
        this.images[imageKey] = image;
        this.failedImagesCount.delete(imageKey);
        return image;
      } catch (error) {
        const fails = (this.failedImagesCount.get(imageKey) || 0) + 1;
        this.failedImagesCount.set(imageKey, fails);
        
        if (fails >= this.maxRetries) {
            this.permanentFailures.add(imageKey);
            console.error(`[ImageLoader] Permanent failure for tile image: ${terrainType} (Retries exhausted)`);
        } else {
            console.warn(`[ImageLoader] Failed to load tile image: ${terrainType} (Attempt ${fails}/${this.maxRetries})`);
        }
        return null;
      } finally {
        this.loadingPromises.delete(imageKey);
      }
    })();

    this.loadingPromises.set(imageKey, loadPromise);
    return loadPromise;
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
        this.basePath.tiles,
        '/images/tiles/',
        './images/tiles/'
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
        if (this.onImageLoaded) this.onImageLoaded();
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
    this.images = {};
    this.loadingPromises.clear();
    console.log('[ImageLoader] Cache cleared');
  }
}

// Create singleton instance
export const imageLoader = new ImageLoader();