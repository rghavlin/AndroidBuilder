import { Player } from './client/src/game/entities/Player.js';
import { GameMap } from './client/src/game/map/GameMap.js';

async function runTest() {
    console.log("=== Running Save/Load Serialization Test ===");
    
    // 1. Create player and map
    const player = new Player('player-1', 'Player', 0, 0);
    player.maxAp = 21;
    
    const map = new GameMap(10, 10);
    map.addEntity(player, 0, 0);
    
    // 2. Serialize map to JSON
    const mapJSON = map.toJSON();
    console.log("Serialized map JSON contains player maxAp:", JSON.stringify(mapJSON).includes('"maxAp":21'));
    
    // 3. Deserialize map from JSON
    const loadedMap = await GameMap.fromJSON(mapJSON);
    const loadedPlayer = loadedMap.getEntitiesByType('player')[0];
    
    console.log(`Loaded player maxAp: ${loadedPlayer.maxAp}`);
}

runTest();
