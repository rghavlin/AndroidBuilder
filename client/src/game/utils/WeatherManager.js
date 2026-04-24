import { createItemFromDef, ItemDefs } from '../inventory/ItemDefs.js';
import { Item } from '../inventory/Item.js';

/**
 * WeatherManager - Handles procedural weather cycles
 * Implementation based on a moderate climate (rain every 3-5 days)
 */
export class WeatherManager {
  constructor(engine) {
    this.engine = engine;
    this.isRaining = false;
    this.durationRemaining = 0;
    this.nextEventTurn = Math.floor(24 + Math.random() * 24); // Initial rain between 1-2 days
    this.intensity = 0;

    // Configuration (Turns = Hours)
    this.RAIN_INTERVAL_MIN = 48; // 2 days
    this.RAIN_INTERVAL_MAX = 96; // 4 days
    this.RAIN_DURATION_MIN = 2;
    this.RAIN_DURATION_MAX = 7;
    this.INTENSITY_CHANGE_MAX = 0.15;
  }

  /**
   * Update weather state for a new turn
   * @param {number} turn - Current absolute game turn
   */
  update(turn) {
    const currentTurn = Number(turn);
    
    // Phase 25 Safety: Ensure nextEventTurn isn't stuck in the far future (e.g. from old save data)
    if (!this.isRaining && this.nextEventTurn > currentTurn + this.RAIN_INTERVAL_MAX) {
      const oldEventTurn = this.nextEventTurn;
      this.nextEventTurn = currentTurn + Math.floor(this.RAIN_INTERVAL_MIN + Math.random() * (this.RAIN_INTERVAL_MAX - this.RAIN_INTERVAL_MIN));
      console.log(`[WeatherManager] 🛠️ Safety Reset: nextEventTurn was ${oldEventTurn}, reset to ${this.nextEventTurn} (Turn: ${currentTurn})`);
    }

    if (!this.isRaining) {
      // Check if it's time to start raining
      if (currentTurn >= this.nextEventTurn) {
        this.startRain(currentTurn);
        // Initial splash of water when rain starts
        this.updatePuddles();
      } else if (currentTurn % 10 === 0) {
          // Log every 10 turns for debugging
          console.log(`[WeatherManager] Status: Clear | Turn: ${currentTurn} | Next Rain: ${this.nextEventTurn}`);
      }
    } else {
      // Process ongoing rain
      this.durationRemaining--;
      
      if (this.durationRemaining <= 0) {
        this.stopRain(turn);
      } else {
        // Vary intensity across turns
        this.varyIntensity();
        // Accumulate water in puddles
        this.updatePuddles();
        // Accumulate water in rain collectors
        this.updateRainCollectors();
      }
    }

    // Sync visual state to engine
    this.syncToEngine();
  }

  /**
   * Accumulate water in designated low spots
   */
  updatePuddles() {
    if (!this.engine.gameMap || !this.engine.gameMap.lowSpots) return;
    
    const map = this.engine.gameMap;
    const inv = this.engine.inventoryManager;
    const isHeavy = this.intensity > 0.7;
    const amount = isHeavy ? 20 : 10;

    map.lowSpots.forEach(spot => {
      const isPlayerTile = (inv.lastSyncedX === spot.x && inv.lastSyncedY === spot.y);
      
      if (isPlayerTile) {
        // Use items from live ground container
        const items = inv.groundContainer.getAllItems();
        const existingPuddle = items.find(it => it.defId === 'environment.water_puddle');

        if (existingPuddle) {
          if (existingPuddle.ammoCount < 50) {
            existingPuddle.ammoCount = Math.min(50, (existingPuddle.ammoCount || 0) + amount);
            console.log(`[WeatherManager] Puddle on player tile (${spot.x}, ${spot.y}) filled to ${existingPuddle.ammoCount}`);
            inv.emit('inventoryChanged');
          }
        } else {
          // Spawn new puddle in ground container
          const puddleData = createItemFromDef('environment.water_puddle');
          if (puddleData) {
            const puddle = Item.fromJSON(puddleData);
            puddle.ammoCount = 10;
            inv.groundContainer.addItem(puddle);
            console.log(`[WeatherManager] New puddle spawned on player tile (${spot.x}, ${spot.y})`);
            inv.emit('inventoryChanged');
          }
        }
        return;
      }

      // Standard map tile processing
      const items = [...(map.getItemsOnTile(spot.x, spot.y) || [])];
      const existingPuddle = items.find(it => it.defId === 'environment.water_puddle');

      if (existingPuddle) {
        if (existingPuddle.ammoCount < 50) {
          existingPuddle.ammoCount = Math.min(50, existingPuddle.ammoCount + amount);
          console.log(`[WeatherManager] Puddle at (${spot.x}, ${spot.y}) filled to ${existingPuddle.ammoCount}`);
          // Re-set items to trigger updates/events
          map.setItemsOnTile(spot.x, spot.y, items);
        }
      } else {
        // Only spawn if the spot is empty or contains no other items
        const puddle = createItemFromDef('environment.water_puddle');
        if (puddle) {
          puddle.ammoCount = 10;
          items.push(puddle);
          map.setItemsOnTile(spot.x, spot.y, items);
          console.log(`[WeatherManager] New puddle spawned at (${spot.x}, ${spot.y}) due to rain.`);
        }
      }
    });
  }

  /**
   * Accumulate water in rain collectors placed on the ground or in vehicles
   */
  updateRainCollectors() {
    if (!this.engine.gameMap || !this.engine.inventoryManager) return;
    
    const map = this.engine.gameMap;
    const invManager = this.engine.inventoryManager;
    const isHeavy = this.intensity > 0.7;
    const amount = isHeavy ? 20 : 10;

    // Recursive helper to process items and their nested contents
    const processItemData = (itemData, isExposed) => {
      if (!itemData) return false;
      let modified = false;

      // 1. Accumulate if it's a rain collector and it's exposed to the sky
      if (itemData.defId === 'provision.rain_collector' && isExposed) {
        const currentAmmo = itemData.ammoCount || 0;
        if (currentAmmo < 100) {
          itemData.ammoCount = Math.min(100, currentAmmo + amount);
          itemData.waterQuality = 'dirty';
          modified = true;
          console.log(`[WeatherManager] Filled rain collector: ${itemData.instanceId} to ${itemData.ammoCount}`);
        }
      }

      // 2. Recurse into container grid if it exists (e.g. Wagon, Backpack)
      if (itemData.containerGrid && itemData.containerGrid.items) {
        const def = ItemDefs[itemData.defId];
        // Vehicles/Wagons are open-air containers. 
        // We check def.isWagon or container level isVehicle flag.
        const containerIsExposed = itemData.isVehicle || 
                                 def?.isWagon || 
                                 itemData.containerGrid.isVehicle ||
                                 def?.containerGrid?.isVehicle;
        
        // Contents are only exposed if the parent is exposed AND the parent is an open-air container type
        const contentsExposed = isExposed && containerIsExposed;

        // Handle both Map POJO arrays and Container Map instances
        const items = itemData.containerGrid.items;
        const itemsList = Array.isArray(items) ? items : Array.from(items.values());

        itemsList.forEach(nestedItem => {
          if (processItemData(nestedItem, contentsExposed)) {
            modified = true;
          }
        });
      }

      return modified;
    };

    // 1. Process all tiles on the map for ground-placed collectors and wagons
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const isPlayerTile = (invManager.lastSyncedX === x && invManager.lastSyncedY === y);
        
        let items;
        if (isPlayerTile) {
          items = invManager.groundContainer.getAllItems();
        } else {
          items = map.getItemsOnTile(x, y);
        }
        
        if (!items || items.length === 0) continue;

        let tileModified = false;
        const tile = map.getTile(x, y);
        const isExposed = tile && tile.terrain !== 'floor' && tile.terrain !== 'building';

        items.forEach(itemData => {
          if (processItemData(itemData, isExposed)) { 
            tileModified = true;
          }
        });

        if (tileModified) {
          if (isPlayerTile) {
            // Signal UI refresh for live container
            invManager.emit('inventoryChanged');
          } else {
            map.setItemsOnTile(x, y, items);
          }
        }
      }
    }

    // 2. Process currently dragged item (handles wagons being pulled by player)
    if (this.engine.dragging && this.engine.dragging.item && this.engine.player) {
      const px = Math.round(this.engine.player.x);
      const py = Math.round(this.engine.player.y);
      const playerTile = map.getTile(px, py);
      const playerIsExposed = playerTile && playerTile.terrain !== 'floor' && playerTile.terrain !== 'building';

      if (processItemData(this.engine.dragging.item, playerIsExposed)) {
        invManager.emit('inventoryChanged');
      }
    }

    // 3. Process vehicle containers registered in InventoryManager (fallback/redundancy)
    invManager.containers.forEach(container => {
      if (container.isVehicle) {
        // We need to find the item's location if it's not being dragged or on ground (already handled above)
        // For simplicity, if it's a vehicle container not covered by above, we check its owner's position
        // but the ground loop already covers all map-based items and the drag loop covers the active pull.
      }
    });
  }

  /**
   * Start a new rain event
   */
  startRain(turn) {
    console.log(`[WeatherManager] 🌦️ Rain starting at turn ${turn}`);
    this.isRaining = true;
    this.durationRemaining = Math.floor(this.RAIN_DURATION_MIN + Math.random() * (this.RAIN_DURATION_MAX - this.RAIN_DURATION_MIN + 1));
    this.intensity = 0.2 + Math.random() * 0.6; // Start with moderate intensity [0.2, 0.8]
    console.log(`[WeatherManager] - Duration: ${this.durationRemaining} turns, Initial Intensity: ${this.intensity.toFixed(2)}`);
  }

  /**
   * Stop current rain event and schedule next one
   */
  stopRain(turn) {
    console.log(`[WeatherManager] ☀️ Rain stopping at turn ${turn}`);
    this.isRaining = false;
    this.intensity = 0;
    
    // Schedule next rain event (3-5 days from now)
    const interval = Math.floor(this.RAIN_INTERVAL_MIN + Math.random() * (this.RAIN_INTERVAL_MAX - this.RAIN_INTERVAL_MIN + 1));
    this.nextEventTurn = turn + interval;
    console.log(`[WeatherManager] - Next rain event scheduled for turn: ${this.nextEventTurn}`);
  }

  /**
   * Randomly fluctuate rain intensity
   */
  varyIntensity() {
    const change = (Math.random() * 2 - 1) * this.INTENSITY_CHANGE_MAX;
    this.intensity = Math.max(0.1, Math.min(1.0, this.intensity + change));
    console.log(`[WeatherManager] - Intensity varied to: ${this.intensity.toFixed(2)}`);
  }

  /**
   * Update the visual weather object in GameEngine
   */
  syncToEngine() {
    if (this.engine) {
      const weatherType = this.isRaining ? 'rain' : 'clear';
      // Only trigger engine update if state actually changed to minimize re-renders
      if (this.engine.weather.type !== weatherType || this.engine.weather.intensity !== this.intensity) {
        this.engine.setWeather(weatherType, this.intensity);
      }
    }
  }

  /**
   * Serialize state for saving
   */
  toJSON() {
    return {
      isRaining: this.isRaining,
      durationRemaining: this.durationRemaining,
      nextEventTurn: this.nextEventTurn,
      intensity: this.intensity
    };
  }

  /**
   * Restore state from save
   */
  fromJSON(data) {
    if (!data) return;
    this.isRaining = data.isRaining || false;
    this.durationRemaining = data.durationRemaining || 0;
    this.nextEventTurn = data.nextEventTurn || 0;
    this.intensity = data.intensity || 0;
    this.syncToEngine();
  }
}
