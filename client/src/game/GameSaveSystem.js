import engine from './GameEngine.js';

// --- Asynchronous IndexedDB Store Fallback ---

class IndexedDBStore {
  constructor(dbName = 'zombie_road_db', storeName = 'saves') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  _getDB() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      request.onerror = (event) => reject(request.error);
    });
  }

  async setItem(key, value) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async getItem(key) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllSaves() {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.openCursor();
      const saves = [];
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          saves.push({
            slotName: cursor.key,
            timestamp: cursor.value.timestamp,
            turn: cursor.value.turn,
            version: cursor.value.version
          });
          cursor.continue();
        } else {
          resolve(saves.sort((a, b) => b.timestamp - a.timestamp));
        }
      };
      req.onerror = () => reject(req.error);
    });
  }
}

const idbStore = new IndexedDBStore();



/**
 * Game Save System - Handles serialization and deserialization of complete game state
 * Follows UniversalGoals.md requirement that all game state must be JSON serializable
 */
export class GameSaveSystem {
  static CURRENT_VERSION = '1.1.0';
  static MIN_SUPPORTED_VERSION = '1.1.0';

  /**
   * Save complete game state to JSON
   * @param {Object} gameState - Complete game state from GameContext
   * @returns {Object} - Serializable game state
   */
  static saveGameState(gameState) {
    try {
      const saveData = {
        version: this.CURRENT_VERSION, 
        timestamp: Date.now(),

        // Core game state - only essential data
        turn: gameState.turn,
        bookStats: engine.bookStats,

        // Map state (includes all tiles and entities) - this contains positions
        gameMap: gameState.gameMap ? gameState.gameMap.toJSON() : null,

        // World state (multiple maps and transitions)
        worldManager: gameState.worldManager ? gameState.worldManager.toJSON() : null,

        // Player stats only (position is stored in gameMap)
        playerStats: {
          hp: gameState.player ? gameState.player.hp : 100,
          maxHp: gameState.player ? gameState.player.maxHp : 100,
          ap: gameState.player ? gameState.player.ap : 100,
          maxAp: gameState.player ? gameState.player.maxAp : 100,
          nutrition: gameState.player ? gameState.player.nutrition : 25,
          maxNutrition: gameState.player ? gameState.player.maxNutrition : 25,
          hydration: gameState.player ? gameState.player.hydration : 25,
          maxHydration: gameState.player ? gameState.player.maxHydration : 25,
          energy: gameState.player ? gameState.player.energy : 25,
          maxEnergy: gameState.player ? gameState.player.maxEnergy : 25,
          ammo: gameState.playerStats?.ammo || 0
        },

        // Inventory state (equipment, containers, items)
        inventoryManager: gameState.inventoryManager ? gameState.inventoryManager.toJSON() : null,

        // Camera position (for UI continuity only)
        cameraPosition: gameState.camera ? {
          x: gameState.camera.x,
          y: gameState.camera.y,
          zoomLevel: gameState.camera.zoomLevel
        } : null,

        // Game metadata
        metadata: {
          mapTemplate: gameState.metadata?.mapTemplate || 'road',
          gameMode: gameState.metadata?.gameMode || 'survival'
        },

        interactionState: {
          isPlayerTurn: gameState.isPlayerTurn !== undefined ? gameState.isPlayerTurn : true,
          isSleeping: engine.isSleeping,
          sleepProgress: engine.sleepProgress,
          targetingItemInstanceId: engine.targetingItemInstanceId,
          isFlashlightOn: engine.isFlashlightOn,
          dragging: (engine.dragging && engine.dragging.item) ? {
            itemInstanceId: engine.dragging.item.instanceId,
            tileX: engine.dragging.tileX,
            tileY: engine.dragging.tileY
          } : null,
          riding: (engine.riding && engine.riding.item) ? {
            itemInstanceId: engine.riding.item.instanceId,
            tileX: engine.riding.tileX,
            tileY: engine.riding.tileY
          } : null,
          weatherState: engine.weatherManager ? engine.weatherManager.toJSON() : null
        }
      };

      console.log('[GameSaveSystem] Game state serialized successfully');
      console.log('[GameSaveSystem] Save data size:', JSON.stringify(saveData).length, 'characters');

      return saveData;
    } catch (error) {
      console.error('[GameSaveSystem] Failed to serialize game state:', error);
      throw new Error('Failed to save game state: ' + error.message);
    }
  }

  /**
   * Load game state from JSON
   * @param {Object} saveData - Serialized game state
   * @returns {Promise<Object>} - Deserialized game state components
   */
  static async loadGameState(saveData) {
    try {
      console.log('[GameSaveSystem] Loading game state from save data...');

      // Validate save data format
      if (!saveData.version || !saveData.gameMap) {
        throw new Error('Invalid save data format');
      }

      // Phase 27: Version check
      if (this._compareVersions(saveData.version, this.MIN_SUPPORTED_VERSION) < 0) {
        throw new Error(`Save version ${saveData.version} is incompatible. Minimum required: ${this.MIN_SUPPORTED_VERSION}`);
      }

      // Restore GameMap with all entities (including player)
      console.log('[GameSaveSystem] Restoring GameMap...');
      const gameMap = await this.restoreGameMapFromJSON(saveData.gameMap);

      // Restore WorldManager if available
      let worldManager = null;
      if (saveData.worldManager) {
        console.log('[GameSaveSystem] Restoring WorldManager...');
        const { WorldManager } = await import('./WorldManager.js');
        worldManager = WorldManager.fromJSON(saveData.worldManager);

        // FIX: Validate currentMapId matches the loaded map
        // The loaded gameMap should be the current map the player is on
        if (worldManager && worldManager.currentMapId) {
          console.log(`[GameSaveSystem] WorldManager currentMapId: ${worldManager.currentMapId}`);
          // Re-save the loaded gameMap to ensure it's the current map in WorldManager
          // Pass the turn from saveData to ensure catch-up logic is correctly initialized
          worldManager.saveCurrentMap(gameMap, worldManager.currentMapId, saveData.turn);
          console.log(`[GameSaveSystem] Verified currentMapId ${worldManager.currentMapId} matches loaded map at Turn ${saveData.turn}`);
        }
      }

      // Find player in the restored game map
      const player = gameMap.getEntitiesByType('player')[0];
      if (!player) {
        throw new Error('No player found in saved game map');
      }

      // Create new camera and center it on player
      const { Camera } = await import('./Camera.js');
      const camera = new Camera(20, 20);
      camera.setWorldBounds(gameMap.width, gameMap.height);

      // Restore camera position if available, otherwise center on player
      if (saveData.cameraPosition) {
        camera.x = saveData.cameraPosition.x;
        camera.y = saveData.cameraPosition.y;
        camera.zoomLevel = saveData.cameraPosition.zoomLevel || 1.0;
      } else {
        camera.centerOn(player.x, player.y);
      }

      // Restore InventoryManager if available
      let inventoryManager = null;
      if (saveData.inventoryManager) {
        console.log('[GameSaveSystem] Restoring InventoryManager...');
        const { InventoryManager } = await import('./inventory/InventoryManager.js');
        inventoryManager = InventoryManager.fromJSON(saveData.inventoryManager);
        console.log('[GameSaveSystem] InventoryManager restored successfully');
      }

      // Restore LootGenerator
      console.log('[GameSaveSystem] Restoring LootGenerator...');
      const { LootGenerator } = await import('./map/LootGenerator.js');
      const lootGenerator = new LootGenerator();

      const gameComponents = {
        gameMap: gameMap,
        worldManager: worldManager,
        player: player,
        camera: camera,
        inventoryManager: inventoryManager,
        lootGenerator: lootGenerator,
        turn: saveData.turn || 1,
        playerStats: saveData.playerStats || { hp: 1000, maxHp: 1000, ap: 1000, maxAp: 1000, ammo: 0 },
        lastSeenTaggedTiles: new Set(), // Reset this - will be rebuilt
        metadata: saveData.metadata || {},
        interactionState: saveData.interactionState || null
      };

      if (saveData.bookStats) {
          engine.bookStats = saveData.bookStats;
      }

      console.log('[GameSaveSystem] Game state loaded successfully');
      console.log('[GameSaveSystem] Player restored at position:', player.x, player.y);
      return gameComponents;
    } catch (error) {
      console.error('[GameSaveSystem] Failed to load game state:', error);
      throw new Error('Failed to load game state: ' + error.message);
    }
  }

  /**
   * Save game state to storage
   * @param {Object} gameState - Game state to save
   * @param {string} slotName - Save slot name (default: 'quicksave')
   * @returns {Promise<boolean>} - True if save succeeded
   */
  static async saveToStorage(gameState, slotName = 'quicksave') {
    try {
      const saveData = this.saveGameState(gameState);

      // Check if running in Electron native filesystem environment
      if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.saveGame === 'function') {
        const serializedData = JSON.stringify(saveData);
        const result = await window.electronAPI.saveGame(slotName, serializedData);
        if (result && result.success) {
          console.log(`[GameSaveSystem] Game saved to desktop folder saves/${slotName}.json`);
          return true;
        }
        throw new Error(result ? result.error : 'Unknown desktop save error');
      }

      // Web Fallback: Use IndexedDB
      await idbStore.setItem(slotName, saveData);
      console.log(`[GameSaveSystem] Game saved to IndexedDB slot: ${slotName}`);
      return true;
    } catch (error) {
      console.error('[GameSaveSystem] Failed to save game state:', error);
      return false;
    }
  }

  /**
   * Load game state from storage
   * @param {string} slotName - Save slot name (default: 'quicksave')
   * @returns {Promise<Object|null>} - Loaded game state components or null
   */
  static async loadFromStorage(slotName = 'quicksave') {
    try {
      let saveData = null;

      // Check if running in Electron native filesystem environment
      if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.loadGame === 'function') {
        const result = await window.electronAPI.loadGame(slotName);
        if (result) {
          saveData = typeof result === 'string' ? JSON.parse(result) : result;
        }
      } else {
        // Web Fallback: Use IndexedDB
        saveData = await idbStore.getItem(slotName);
      }

      if (!saveData) {
        console.log(`[GameSaveSystem] No save found in slot: ${slotName}`);
        return null;
      }

      return await this.loadGameState(saveData);
    } catch (error) {
      console.error('[GameSaveSystem] Failed to load game state:', error);
      return null;
    }
  }

  // Compatibility wrappers for legacy code
  static async saveToLocalStorage(gameState, slotName = 'quicksave') {
    return await this.saveToStorage(gameState, slotName);
  }

  static async loadFromLocalStorage(slotName = 'quicksave') {
    return await this.loadFromStorage(slotName);
  }

  /**
   * Export game state as downloadable JSON file
   * @param {Object} gameState - Game state to export
   * @param {string} filename - Filename for download
   */
  static exportToFile(gameState, filename = 'zombie_game_save.json') {
    try {
      const saveData = this.saveGameState(gameState);
      const jsonString = JSON.stringify(saveData, null, 2);

      // Create downloadable blob
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      console.log(`[GameSaveSystem] Game exported to file: ${filename}`);
      return true;
    } catch (error) {
      console.error('[GameSaveSystem] Failed to export to file:', error);
      return false;
    }
  }

  /**
   * List available save slots in the storage
   * @returns {Promise<Array>} - Array of save slot names with metadata
   */
  static async listSaveSlots() {
    // Check if running in Electron native filesystem environment
    if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.listSaves === 'function') {
      try {
        return await window.electronAPI.listSaves();
      } catch (error) {
        console.error('[GameSaveSystem] Failed to list saves via Electron IPC:', error);
        return [];
      }
    }

    // Web Fallback: Use IndexedDB
    try {
      return await idbStore.getAllSaves();
    } catch (error) {
      console.error('[GameSaveSystem] Failed to list saves via IndexedDB:', error);
      return [];
    }
  }

  // Helper methods for complex object restoration
  static async restoreGameMapFromJSON(mapData) {
    const { GameMap } = await import('./map/GameMap.js');
    return GameMap.fromJSON(mapData);
  }

  static async restorePlayerFromJSON(playerData) {
    const { Player } = await import('./entities/Player.js');
    return Player.fromJSON(playerData);
  }

  static async restoreCameraFromJSON(cameraData) {
    const { Camera } = await import('./Camera.js');
    return Camera.fromJSON(cameraData);
  }

  /**
   * Internal version comparison helper (semver-lite)
   * @private
   */
  static _compareVersions(v1, v2) {
    if (!v1 || !v2) return 0;
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > (parts2[i] || 0)) return 1;
      if (parts1[i] < (parts2[i] || 0)) return -1;
    }
    return 0;
  }
}

