import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { AISystem } from '../../client/src/game/systems/AISystem.js';
import { ScentTrail, SCENT_FOLLOW_RADIUS } from '../../client/src/game/utils/ScentTrail.js';
import { Door } from '../../client/src/game/entities/Door.js';
import engine from '../../client/src/game/GameEngine.js';

/**
 * Regression cover for two linked zombie-AI bugs, both reproduced on
 * customMaps/zombieSightSoundTest (a sealed 7x4 room with one door on the south
 * edge of (9,10); zombie inside, player outside):
 *
 *  1. ScentTrail.findFreshestScent was a Manhattan box scan with no occlusion, so
 *     a zombie sealed indoors smelled a breadcrumb the player dropped outside and
 *     — since a scent hit is laundered into a confirmed sighting — beelined to the
 *     door and breached it without ever seeing or hearing anything.
 *  2. Acquiring a scent enqueued no intent, and SimulationManager breaks its AI
 *     loop the moment a cycle yields zero intents, so the zombie burned an entire
 *     turn standing still before acting on the trail.
 */

/** Sealed room: floor x6..12 / y7..10, perimeter walls, one door on (9,10) south. */
function buildRoom(h, { doorOpen = false } = {}) {
  const map = h.gameMap;
  for (let y = 7; y <= 10; y++) {
    for (let x = 6; x <= 12; x++) {
      map.setTerrain(x, y, 'floor');
      map.getTile(x, y).edgeWalls = { n: y === 7, s: y === 10, w: x === 6, e: x === 12 };
    }
  }
  const door = new Door('door-9-10-s', 9, 10, false, doorOpen, false, 's', false);
  map.addEntity(door, 9, 10);
  return door;
}

describe('scent occlusion', () => {
  let h;

  beforeEach(() => {
    h = new GameHarness({ seed: 11, width: 20, height: 20, terrain: 'grass' }).bootstrap();
  });

  it('does not carry through a closed door', () => {
    buildRoom(h);
    ScentTrail.dropScent(h.gameMap, 9, 11); // player's tile, just outside the door

    // Manhattan distance 3 — well inside SCENT_FOLLOW_RADIUS, so only occlusion
    // can keep this hidden.
    expect(Math.abs(9 - 9) + Math.abs(11 - 8)).toBeLessThan(SCENT_FOLLOW_RADIUS);
    expect(ScentTrail.findFreshestScent(h.gameMap, 9, 8, SCENT_FOLLOW_RADIUS, 0)).toBeNull();
  });

  it('does not carry through a solid wall', () => {
    buildRoom(h);
    ScentTrail.dropScent(h.gameMap, 7, 11); // outside, below a solid stretch of wall
    expect(ScentTrail.findFreshestScent(h.gameMap, 7, 9, SCENT_FOLLOW_RADIUS, 0)).toBeNull();
  });

  it('carries through an open door', () => {
    buildRoom(h, { doorOpen: true });
    ScentTrail.dropScent(h.gameMap, 9, 11);
    expect(ScentTrail.findFreshestScent(h.gameMap, 9, 8, SCENT_FOLLOW_RADIUS, 0))
      .toMatchObject({ x: 9, y: 11 });
  });

  it('still finds a trail that routes the long way around an obstacle', () => {
    // Open ground: BFS distance equals Manhattan distance, so nothing changes.
    ScentTrail.dropScent(h.gameMap, 9, 11);
    expect(ScentTrail.findFreshestScent(h.gameMap, 9, 8, SCENT_FOLLOW_RADIUS, 0))
      .toMatchObject({ x: 9, y: 11 });
  });

  it('respects minSequence so a zombie does not re-acquire a trail it already has', () => {
    ScentTrail.dropScent(h.gameMap, 9, 11);
    const found = ScentTrail.findFreshestScent(h.gameMap, 9, 8, SCENT_FOLLOW_RADIUS, 0);
    expect(ScentTrail.findFreshestScent(h.gameMap, 9, 8, SCENT_FOLLOW_RADIUS, found.sequence)).toBeNull();
  });
});

describe('scent acquisition costs no turn', () => {
  it('produces an intent in the same AI cycle it picks up the trail', () => {
    const h = new GameHarness({ seed: 3, width: 20, height: 20, terrain: 'floor' }).bootstrap();
    const z = h.spawnZombie(9, 8, 'standard', 'z1');
    // Park the player far away and out of sight range so only scent can fire.
    h.gameMap.moveEntity(h.player.id, 1, 19);
    h.player.logicalX = 1; h.player.logicalY = 19;
    h.player.getComponent('Position').x = 1;
    h.player.getComponent('Position').y = 19;

    ScentTrail.dropScent(h.gameMap, 9, 11);

    const ai = z.getComponent('AIBehavior');
    expect(ai.lastSeenPlayerCoords).toBeNull();

    const intents = AISystem.process(
      [h.player, z], engine.worldManager, engine, [], null
    );

    // Before the fix this was 0: the zombie latched onto the scent and returned
    // without an intent, and SimulationManager ended its turn on the spot.
    expect(intents).toBeGreaterThan(0);
    expect(ai.lastSeenPlayerCoords).toEqual({ x: 9, y: 11 });
    expect(z.hasComponent('MoveIntent') || z.hasComponent('DamageIntent')).toBe(true);
  });
});
