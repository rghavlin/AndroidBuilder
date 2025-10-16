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

  /**
   * Get image for an entity type
   * @param {string} entityType - Type of entity (player, zombie, item, etc.)
   * @param {string} subtype - Optional subtype (e.g., 'pistol' for item type)
   * @returns {Promise<HTMLImageElement|null>} - Image element or null if not found
   */
  async getImage(entityType, subtype = null) {
    const imageKey = subtype ? `${entityType}_${subtype}` : entityType;

    // Return cached image if available
    if (this.imageCache.has(imageKey)) {
      return this.imageCache.get(imageKey);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(imageKey)) {
      return this.loadingPromises.get(imageKey);
    }

    // Start loading the image
    const loadPromise = this.loadImage(imageKey);
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
        console.log(`[ImageLoader] Successfully loaded image: ${img.src}`);
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