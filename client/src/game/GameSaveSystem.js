import engine from './GameEngine.js';
import { gameRandom } from './utils/SeededRandom.js';
import { CharacterRegistry } from './CharacterRegistry.js';

export const DEFAULT_PLAYER_STATS = {
  hp: 100,
  maxHp: 100,
  ap: 12,
  maxAp: 12,
  nutrition: 25,
  maxNutrition: 25,
  hydration: 25,
  maxHydration: 25,
  energy: 25,
  maxEnergy: 25,
  ammo: 0
};

// Compression helper using browser native CompressionStream / DecompressionStream
export async function compressString(str) {
  if (typeof CompressionStream === 'undefined') {
    return str; // No compression if not supported
  }
  try {
    const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
    const response = new Response(stream);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    
    // Convert ArrayBuffer to base64
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return '_gz_:' + btoa(binary);
  } catch (error) {
    console.error('[GameSaveSystem] Compression failed, falling back to raw JSON:', error);
    return str;
  }
}

export async function decompressString(str) {
  if (typeof str !== 'string' || !str.startsWith('_gz_:')) {
    return str; // Not compressed or not a string
  }
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream not supported in this environment');
  }
  try {
    const base64Str = str.slice(5);
    const binary = atob(base64Str);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const stream = new Blob([bytes.buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    const response = new Response(stream);
    return await response.text();
  } catch (error) {
    console.error('[GameSaveSystem] Decompression failed:', error);
    throw error;
  }
}

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
      try {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('IndexedDB is not supported/accessible in this environment'));
          return;
        }
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
        request.onerror = (event) => {
          console.error('[IndexedDBStore] Open request error event:', event);
          reject(request.error || new Error('IndexedDB open error event'));
        };
      } catch (err) {
        console.error('[IndexedDBStore] open threw synchronous exception:', err);
        reject(err);
      }
    });
  }

  async setItem(key, value) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.put(value, key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.error('[IndexedDBStore] setItem request error:', req.error);
          reject(req.error || new Error('IndexedDB put error'));
        };
      } catch (err) {
        console.error('[IndexedDBStore] setItem transaction threw exception:', err);
        reject(err);
      }
    });
  }

  async getItem(key) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => {
          console.error('[IndexedDBStore] getItem request error:', req.error);
          reject(req.error || new Error('IndexedDB get error'));
        };
      } catch (err) {
        console.error('[IndexedDBStore] getItem transaction threw exception:', err);
        reject(err);
      }
    });
  }

  async deleteItem(key) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.error('[IndexedDBStore] deleteItem request error:', req.error);
          reject(req.error || new Error('IndexedDB delete error'));
        };
      } catch (err) {
        console.error('[IndexedDBStore] deleteItem transaction threw exception:', err);
        reject(err);
      }
    });
  }

  async deleteChunks(slotName) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.openCursor();
        req.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const key = cursor.key;
            if (typeof key === 'string' && key.startsWith(`${slotName}_chunk_`)) {
              store.delete(key);
            }
            cursor.continue();
          } else {
            resolve(true);
          }
        };
        req.onerror = () => {
          console.error('[IndexedDBStore] deleteChunks cursor error:', req.error);
          reject(req.error || new Error('IndexedDB cursor error'));
        };
      } catch (err) {
        console.error('[IndexedDBStore] deleteChunks transaction threw exception:', err);
        reject(err);
      }
    });
  }

  async getAllSaves() {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      try {
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
              version: cursor.value.version,
              characterId: cursor.value.characterId || null
            });
            cursor.continue();
          } else {
            resolve(saves.sort((a, b) => b.timestamp - a.timestamp));
          }
        };
        req.onerror = () => {
          console.error('[IndexedDBStore] getAllSaves cursor error:', req.error);
          reject(req.error || new Error('IndexedDB cursor error'));
        };
      } catch (err) {
        console.error('[IndexedDBStore] getAllSaves transaction threw exception:', err);
        reject(err);
      }
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
        characterId: gameState.player ? gameState.player.id : null,

        // Core game state - only essential data
        turn: gameState.turn,
        gameSeed: engine.gameSeed || null,
        // The RNG's current working state, distinct from the original seed.
        // Restoring THIS on load (instead of re-seeding to gameSeed) lets AI/
        // world-gen rolls continue from where they left off rather than
        // replaying identically from the start of the stream every load.
        gameRandomState: gameRandom.getState(),
        bookStats: engine.bookStats,
        craftingQueue: engine.craftingQueue,
        questState: engine.questState ? engine.questState.toJSON() : null,

        // Map state (includes all tiles and entities) - this contains positions
        gameMap: gameState.gameMap ? gameState.gameMap.toJSON() : null,

        // World state (multiple maps and transitions)
        worldManager: gameState.worldManager ? gameState.worldManager.toJSON() : null,

        // Player stats only (position is stored in gameMap)
        playerStats: {
          hp: gameState.player ? gameState.player.hp : DEFAULT_PLAYER_STATS.hp,
          maxHp: gameState.player ? gameState.player.maxHp : DEFAULT_PLAYER_STATS.maxHp,
          ap: gameState.player ? gameState.player.ap : DEFAULT_PLAYER_STATS.ap,
          maxAp: gameState.player ? gameState.player.maxAp : DEFAULT_PLAYER_STATS.maxAp,
          nutrition: gameState.player ? gameState.player.nutrition : DEFAULT_PLAYER_STATS.nutrition,
          maxNutrition: gameState.player ? gameState.player.maxNutrition : DEFAULT_PLAYER_STATS.maxNutrition,
          hydration: gameState.player ? gameState.player.hydration : DEFAULT_PLAYER_STATS.hydration,
          maxHydration: gameState.player ? gameState.player.maxHydration : DEFAULT_PLAYER_STATS.maxHydration,
          energy: gameState.player ? gameState.player.energy : DEFAULT_PLAYER_STATS.energy,
          maxEnergy: gameState.player ? gameState.player.maxEnergy : DEFAULT_PLAYER_STATS.maxEnergy,
          ammo: gameState.playerStats?.ammo !== undefined ? gameState.playerStats.ammo : DEFAULT_PLAYER_STATS.ammo
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

      // Defensive: scan/heal any entity with a malformed components field on load
      // (the toJSON path does the same on save). See "malformed entity" bug.
      if (typeof gameMap.auditEntityComponents === 'function') {
        gameMap.auditEntityComponents('load');
      }

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
        playerStats: saveData.playerStats || DEFAULT_PLAYER_STATS,
        lastSeenTaggedTiles: new Set(), // Reset this - will be rebuilt
        metadata: saveData.metadata || {},
        interactionState: saveData.interactionState || null
      };

      if (saveData.bookStats) {
          engine.bookStats = saveData.bookStats;
      }

      engine.craftingQueue = saveData.craftingQueue || null;

      // Older saves have no questState — leaves engine.questState at its fresh-reset
      // empty default, which is the correct behavior for a save predating quests.
      if (saveData.questState && engine.questState) {
        engine.questState.fromJSON(saveData.questState);
      }

      // Restore game seed for PRNG continuity
      if (saveData.gameSeed !== undefined && saveData.gameSeed !== null) {
        engine.gameSeed = saveData.gameSeed;

        if (saveData.gameRandomState !== undefined && saveData.gameRandomState !== null) {
          // Resume the RNG stream exactly where the save left off. Re-seeding to
          // the original gameSeed here would replay every AI/world-gen roll
          // since turn 1 identically on each load — save-scummable and the
          // reason this field exists.
          gameRandom.setState(saveData.gameRandomState);
          console.log(`[GameSaveSystem] Restored game RNG state: ${saveData.gameRandomState} (seed: ${saveData.gameSeed})`);
        } else {
          // Older save predating gameRandomState: fall back to re-seeding.
          gameRandom.seed(saveData.gameSeed);
          console.log(`[GameSaveSystem] Restored game seed: ${saveData.gameSeed} (no saved RNG state; legacy save)`);
        }
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
      // Sync character stats to character registry whenever the character is saved
      if (gameState.player) {
        try {
          CharacterRegistry.saveCharacterFromPlayer(gameState.player);
        } catch (e) {
          console.error('[GameSaveSystem] Failed to sync character to registry on save:', e);
        }
      }

      const saveData = this.saveGameState(gameState);

      // Save all inactive map chunks to storage!
      if (gameState.worldManager && gameState.worldManager.maps) {
        for (const [mapId, mapData] of gameState.worldManager.maps.entries()) {
          if (mapId !== gameState.worldManager.currentMapId) {
            // Build the chunk data
            const chunkData = {
              id: mapId,
              serializedMap: mapData.serializedMap,
              compressedMap: mapData.compressedMap,
              timestamp: mapData.timestamp,
              lastProcessedTurn: mapData.lastProcessedTurn,
              type: mapData.type,
              metadata: mapData.metadata
            };
            const serializedChunk = JSON.stringify(chunkData);
            
            // Save using Electron / IDB / localStorage
            if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.saveGame === 'function') {
              await window.electronAPI.saveGame(`${slotName}_chunk_${mapId}`, serializedChunk);
            } else {
              try {
                await idbStore.setItem(`${slotName}_chunk_${mapId}`, chunkData);
              } catch (idbError) {
                if (typeof window !== 'undefined' && window.localStorage) {
                  const compressed = await compressString(serializedChunk);
                  window.localStorage.setItem(`zombie_road_save_${slotName}_chunk_${mapId}`, compressed);
                }
              }
            }
          }
        }
      }

      // Check if running in Electron native filesystem environment
      if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.saveGame === 'function') {
        let serializedData;
        try {
          serializedData = JSON.stringify(saveData);
        } catch (stringError) {
          console.error('[GameSaveSystem] FATAL: Circular reference detected during game save serialization:', stringError);
          // Return false so GameContext shows the failure toast
          return false;
        }

        const result = await window.electronAPI.saveGame(slotName, serializedData);
        if (result && result.success) {
          console.log(`[GameSaveSystem] Game saved to desktop folder saves/${slotName}.json`);
          return true;
        }
        throw new Error(result ? result.error : 'Unknown desktop save error');
      }

      // Web Fallback: Try IndexedDB, fallback to localStorage
      try {
        await idbStore.setItem(slotName, saveData);
        console.log(`[GameSaveSystem] Game saved to IndexedDB slot: ${slotName}`);
        return true;
      } catch (idbError) {
        console.warn('[GameSaveSystem] IndexedDB save failed, trying localStorage fallback:', idbError);
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const key = `zombie_road_save_${slotName}`;
            let serializedData;
            try {
              serializedData = JSON.stringify(saveData);
            } catch (stringError) {
              console.error('[GameSaveSystem] FATAL: Circular reference detected during localstorage serialization:', stringError);
              return false;
            }
            const compressedData = await compressString(serializedData);
            window.localStorage.setItem(key, compressedData);
            console.log(`[GameSaveSystem] Game saved to localStorage key: ${key} (compressed size: ${compressedData.length} chars, uncompressed: ${serializedData.length} chars)`);
            return true;
          }
        } catch (lsError) {
          console.error('[GameSaveSystem] localStorage save fallback also failed:', lsError);
        }
      }
      return false;
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
        // Web Fallback: Try IndexedDB
        try {
          saveData = await idbStore.getItem(slotName);
        } catch (idbError) {
          console.warn('[GameSaveSystem] IndexedDB load failed, trying localStorage fallback:', idbError);
        }

        // Try localStorage if IndexedDB returned null or failed
        if (!saveData) {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              const key = `zombie_road_save_${slotName}`;
              const localData = window.localStorage.getItem(key);
              if (localData) {
                console.log(`[GameSaveSystem] Loaded game from localStorage key: ${key}`);
                const decompressed = await decompressString(localData);
                saveData = JSON.parse(decompressed);
              }
            }
          } catch (lsError) {
            console.error('[GameSaveSystem] localStorage load fallback also failed:', lsError);
          }
        }
      }

      if (!saveData) {
        console.log(`[GameSaveSystem] No save found in slot: ${slotName}`);
        return null;
      }

      const components = await this.loadGameState(saveData);
      if (components && components.worldManager) {
        components.worldManager.saveSlot = slotName;
      }
      return components;
    } catch (error) {
      console.error('[GameSaveSystem] Failed to load game state:', error);
      return null;
    }
  }

  /**
   * Load an individual map chunk from storage
   */
  static async loadChunkFromStorage(slotName, mapId) {
    const chunkSlotName = `${slotName}_chunk_${mapId}`;
    try {
      let chunkData = null;
      if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.loadGame === 'function') {
        const result = await window.electronAPI.loadGame(chunkSlotName);
        if (result) {
          chunkData = typeof result === 'string' ? JSON.parse(result) : result;
        }
      } else {
        try {
          chunkData = await idbStore.getItem(chunkSlotName);
        } catch (e) {}
        if (!chunkData) {
          if (typeof window !== 'undefined' && window.localStorage) {
            const key = `zombie_road_save_${chunkSlotName}`;
            const localData = window.localStorage.getItem(key);
            if (localData) {
              const decompressed = await decompressString(localData);
              chunkData = JSON.parse(decompressed);
            }
          }
        }
      }
      return chunkData;
    } catch (error) {
      console.error(`[GameSaveSystem] Failed to load chunk ${mapId}:`, error);
      return null;
    }
  }

  /**
   * Delete a save slot from storage
   * @param {string} slotName - Save slot name
   * @returns {Promise<boolean>} - True if deletion succeeded
   */
  static async deleteSaveSlot(slotName) {
    try {
      if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.deleteSave === 'function') {
        const result = await window.electronAPI.deleteSave(slotName);
        return !!(result && result.success);
      }

      let deletedAny = false;

      // Try IndexedDB
      try {
        await idbStore.deleteItem(slotName);
        await idbStore.deleteChunks(slotName);
        console.log(`[GameSaveSystem] Deleted save and chunks from IndexedDB slot: ${slotName}`);
        deletedAny = true;
      } catch (idbError) {
        console.warn(`[GameSaveSystem] Failed to delete slot ${slotName} from IndexedDB:`, idbError);
      }

      // Try localStorage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const key = `zombie_road_save_${slotName}`;
          if (window.localStorage.getItem(key) !== null) {
            window.localStorage.removeItem(key);
            console.log(`[GameSaveSystem] Deleted save from localStorage key: ${key}`);
            deletedAny = true;
          }
          // Remove chunks from localStorage
          const keysToRemove = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && k.startsWith(`zombie_road_save_${slotName}_chunk_`)) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach(k => window.localStorage.removeItem(k));
        }
      } catch (lsError) {
        console.error(`[GameSaveSystem] Failed to delete slot ${slotName} from localStorage:`, lsError);
      }

      return deletedAny;
    } catch (error) {
      console.error('[GameSaveSystem] Failed to delete save slot:', error);
      return false;
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

    let idbSaves = [];
    try {
      idbSaves = await idbStore.getAllSaves();
    } catch (error) {
      console.warn('[GameSaveSystem] Failed to list saves via IndexedDB:', error);
    }

    // Merge or fallback to localStorage
    const savesMap = new Map();
    idbSaves.forEach(s => savesMap.set(s.slotName, s));

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('zombie_road_save_')) {
            const slotName = key.replace('zombie_road_save_', '');
            if (!savesMap.has(slotName)) {
              try {
                const rawValue = window.localStorage.getItem(key);
                if (rawValue) {
                  const decompressed = await decompressString(rawValue);
                  const data = JSON.parse(decompressed);
                  if (data) {
                    savesMap.set(slotName, {
                      slotName: slotName,
                      timestamp: data.timestamp || Date.now(),
                      turn: data.turn || 1,
                      version: data.version || '1.0.0',
                      characterId: data.characterId || null
                    });
                  }
                }
              } catch (e) {
                // ignore invalid
              }
            }
          }
        }
      }
    } catch (lsError) {
      console.error('[GameSaveSystem] Failed to list saves from localStorage:', lsError);
    }

    return Array.from(savesMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Helper methods for complex object restoration
  static async restoreGameMapFromJSON(mapData) {
    const { GameMap } = await import('./map/GameMap.js');
    return GameMap.fromJSON(mapData);
  }

  static async restorePlayerFromJSON(playerData) {
    const { Entity } = await import('./entities/Entity.js');
    return Entity.fromJSON(playerData);
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

