import { describe, it, expect } from 'vitest';
import { WeatherManager } from '../../client/src/game/utils/WeatherManager.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { InventoryManager } from '../../client/src/game/inventory/InventoryManager.js';

const assert = (condition, message) => expect(condition, message).toBeTruthy();

describe('Systems / Weather / Loose Soil Deletion', () => {
  it('deletes loose soil from map tiles and ground container when it rains', () => {
    // 1. Create GameMap and entities
    const map = new GameMap(5, 5);
    
    // 2. Setup mock engine
    const engine = {
      gameMap: map,
      weather: { type: 'clear', intensity: 0 },
      setWeather(type, intensity) {
        this.weather.type = type;
        this.weather.intensity = intensity;
      }
    };
    
    const invManager = new InventoryManager(engine);
    engine.inventoryManager = invManager;
    
    // Set synced tile coordinates for the player
    invManager.lastSyncedX = 1;
    invManager.lastSyncedY = 1;
    
    // 3. Create loose soil items
    const soilDef = createItemFromDef('crafting.loose_soil');
    const looseSoil1 = Item.fromJSON({ ...soilDef, instanceId: 'soil-1' });
    const looseSoil2 = Item.fromJSON({ ...soilDef, instanceId: 'soil-2' });
    const otherItem = Item.fromJSON({ id: 'food.raw_meat', instanceId: 'meat-1', name: 'Raw meat' });

    // Place one loose soil in the player's ground container
    invManager.groundContainer.addItem(looseSoil1);
    
    // Place one loose soil and one other item on map tile (2, 2)
    map.setItemsOnTile(2, 2, [looseSoil2, otherItem]);
    
    // Verify initial state
    assert(invManager.groundContainer.getAllItems().length === 1, 'ground container has 1 item');
    assert(map.getItemsOnTile(2, 2).length === 2, 'tile (2,2) has 2 items');

    // Create WeatherManager
    const wm = new WeatherManager(engine);
    
    // Trigger rain starting turn (or just set isRaining and duration manually)
    wm.isRaining = true;
    wm.durationRemaining = 5;
    wm.intensity = 0.5;

    // Run weather update
    wm.update(1);

    // Verify loose soil is deleted, but raw meat remains
    const groundItems = invManager.groundContainer.getAllItems();
    assert(groundItems.length === 0, 'ground container loose soil should be deleted');

    const tileItems = map.getItemsOnTile(2, 2);
    assert(tileItems.length === 1, 'tile (2,2) should have 1 item left');
    
    const remainingItemDefId = tileItems[0].defId || tileItems[0].id;
    assert(remainingItemDefId === 'food.raw_meat', 'remaining item should be raw meat');
  });
});
