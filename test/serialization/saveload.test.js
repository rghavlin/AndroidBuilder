import { describe, it, expect } from 'vitest';
// Ported from verify_saveload.mjs. That script imported a now-deleted Player.js;
// the player is created via EntityFactory.createPlayer these days.
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';

describe('Serialization / save-load round trip', () => {
  it('preserves player maxAp through map toJSON -> fromJSON', async () => {
    const player = EntityFactory.createPlayer(0, 0);
    player.maxAp = 21;

    const map = new GameMap(10, 10);
    map.addEntity(player, 0, 0);

    const mapJSON = map.toJSON();
    expect(JSON.stringify(mapJSON)).toContain('"maxAp":21');

    const loadedMap = await GameMap.fromJSON(mapJSON);
    const loadedPlayer = loadedMap.getEntitiesByType('player')[0];

    expect(loadedPlayer).toBeDefined();
    expect(loadedPlayer.maxAp).toBe(21);
  });
});
