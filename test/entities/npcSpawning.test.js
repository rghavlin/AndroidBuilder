import { describe, it, expect } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { NPCSpawner } from '../../client/src/game/utils/NPCSpawner.js';

describe('NPC Spawning Rules', () => {
  it('spawnNPCs returns 0 and spawns no entities on any map', () => {
    const map = new GameMap(30, 30);
    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 30; x++) {
        map.setTerrain(x, y, 'floor_wood');
      }
    }
    const spawnedCount = NPCSpawner.spawnNPCs(map, { count: 5, mapNumber: 2 });
    expect(spawnedCount).toBe(0);
    const npcs = map.getEntitiesByType('npc');
    expect(npcs.length).toBe(0);
  });

  it('spawnTollGate places barriers and turrets but no gate guard NPC', () => {
    const map = new GameMap(40, 40);
    map.metadata = {
      exits: { north: { x: 20, y: 0 }, south: { x: 20, y: 39 } }
    };
    
    const placed = NPCSpawner.spawnTollGate(map);
    expect(placed).toBe(true);

    const npcs = map.getEntitiesByType('npc');
    expect(npcs.length).toBe(0);

    const tollGuards = map.getAllEntities().filter(e => e.isTollGuard || e.typeId === 'gatekeeper');
    expect(tollGuards.length).toBe(0);

    // Barriers and corner turrets should still be present
    const barriers = map.getEntitiesByType('place_icon').filter(e => e.subtype === 'barrier');
    expect(barriers.length).toBeGreaterThan(0);

    const turrets = map.getEntitiesByType('item').filter(item => item.factionId === 'town' && item.isOn);
    expect(turrets.length).toBe(4);
  });

  it('spawnShopkeeper spawns the shopkeeper NPC when townSquareCompound is present', () => {
    const map = new GameMap(40, 40);
    map.metadata = {
      townSquareCompound: {
        fenceBounds: { x1: 10, y1: 10, x2: 30, y2: 25 }
      }
    };

    const shopkeeper = NPCSpawner.spawnShopkeeper(map);
    expect(shopkeeper).not.toBeNull();
    expect(shopkeeper.type).toBe('npc');
    expect(shopkeeper.isShopkeeper).toBe(true);

    const npcs = map.getEntitiesByType('npc');
    expect(npcs.length).toBe(1);
    expect(npcs[0]).toBe(shopkeeper);
  });
});
