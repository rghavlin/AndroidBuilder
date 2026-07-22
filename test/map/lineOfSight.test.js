import { describe, it, expect } from 'vitest';
// T2 regression tests: LOS on a fixed ASCII map (sight lines, occlusions,
// diagonal corners, boundary tiles), the unified door-state sight matrix, the
// VisionSystem -> LineOfSight delegation parity, and the reinforced-window
// movement rule (R14#2).
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { LineOfSight } from '../../client/src/game/utils/LineOfSight.js';
import { VisionSystem } from '../../client/src/game/systems/VisionSystem.js';
import { Pathfinding } from '../../client/src/game/utils/Pathfinding.js';
import { Tile } from '../../client/src/game/map/Tile.js';
import { Door } from '../../client/src/game/entities/Door.js';
import { Window } from '../../client/src/game/entities/Window.js';

/**
 * Build a GameMap from ASCII rows.
 *   '.' grass   '#' wall   'T' tree   'W' water   'F' floor
 */
function buildMap(rows) {
  const height = rows.length;
  const width = rows[0].length;
  const map = new GameMap(width, height);
  const legend = { '.': 'grass', '#': 'wall', 'T': 'tree', 'W': 'water', 'F': 'floor' };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const terrain = legend[rows[y][x]];
      if (!terrain) throw new Error(`Unknown ASCII terrain '${rows[y][x]}' at (${x}, ${y})`);
      map.setTerrain(x, y, terrain);
    }
  }
  return map;
}

const los = (map, x0, y0, x1, y1) =>
  LineOfSight.hasLineOfSight(map, x0, y0, x1, y1, { maxRange: 100 });

describe('T2 line of sight on a fixed ASCII map', () => {
  it('sees across open ground', () => {
    const map = buildMap([
      '.....',
      '.....',
      '.....'
    ]);
    const res = los(map, 0, 1, 4, 1);
    expect(res.hasLineOfSight).toBe(true);
    expect(res.blockedBy).toBeNull();
  });

  it('is blocked by a wall and reports the terrain blocker', () => {
    const map = buildMap([
      '.....',
      '..#..',
      '.....'
    ]);
    const res = los(map, 0, 1, 4, 1);
    expect(res.hasLineOfSight).toBe(false);
    expect(res.blockedBy.type).toBe('terrain');
    expect(res.blockedBy.position).toEqual({ x: 2, y: 1 });
  });

  it('sees over water (water blocks movement, not sight)', () => {
    const map = buildMap([
      '.....',
      '..W..',
      '.....'
    ]);
    expect(los(map, 0, 1, 4, 1).hasLineOfSight).toBe(true);
  });

  it('cannot cut a diagonal corner past two walls', () => {
    // From (0,0) to (1,1): both cardinal corners are walls.
    const map = buildMap([
      '.#.',
      '#..',
      '...'
    ]);
    const res = los(map, 0, 0, 1, 1);
    expect(res.hasLineOfSight).toBe(false);
    expect(res.blockedBy.type).toBe('corner');
  });

  it('can slip a diagonal when one corner is open', () => {
    const map = buildMap([
      '.#.',
      '...',
      '...'
    ]);
    expect(los(map, 0, 0, 1, 1).hasLineOfSight).toBe(true);
  });

  it('treats out-of-bounds as blocking', () => {
    const map = buildMap([
      '...',
      '...'
    ]);
    const res = los(map, 0, 0, 5, 0);
    expect(res.hasLineOfSight).toBe(false);
    expect(['bounds', 'corner', 'edge']).toContain(res.blockedBy.type);
  });

  it('sees a tile itself standing next to a wall', () => {
    // The target tile never blocks sight to itself.
    const map = buildMap([
      '..',
      '.#'
    ]);
    expect(los(map, 0, 0, 1, 1).hasLineOfSight).toBe(true);
  });
});

describe('T2 unified door-state sight matrix', () => {
  const doorMatrix = [
    // [isOpen, isDamaged, expectedBlocksSight]
    [false, false, true],   // closed + intact blocks
    [true,  false, false],  // open lets sight through
    [false, true,  false],  // smashed door lets sight through (was divergent: R6#1)
    [true,  true,  false]
  ];

  for (const [isOpen, isDamaged, blocks] of doorMatrix) {
    it(`door isOpen=${isOpen} isDamaged=${isDamaged} -> blocksSight=${blocks}`, () => {
      const door = new Door('d1', 2, 1, false, isOpen, isDamaged, undefined);
      expect(LineOfSight.doorBlocksSight(door)).toBe(blocks);

      // Full-tile door sitting between observer and target
      const map = buildMap([
        '.....',
        '.....',
        '.....'
      ]);
      map.addEntity(door, 2, 1);
      const res = los(map, 0, 1, 4, 1);
      expect(res.hasLineOfSight).toBe(!blocks);
    });
  }

  it('edge-aligned closed door blocks sight across its edge; open/damaged do not', () => {
    const cases = [
      [false, false, false], // closed -> LOS blocked
      [true,  false, true],  // open -> clear
      [false, true,  true]   // damaged -> clear
    ];
    for (const [isOpen, isDamaged, expectedLos] of cases) {
      const map = buildMap([
        '.....',
        '.....',
        '.....'
      ]);
      const door = new Door(`d-${isOpen}-${isDamaged}`, 2, 1, false, isOpen, isDamaged, 'e');
      map.addEntity(door, 2, 1);
      expect(los(map, 0, 1, 4, 1).hasLineOfSight).toBe(expectedLos);
    }
  });

  it('VisionSystem delegates to LineOfSight (parity on the door matrix)', () => {
    const map = buildMap([
      '.....',
      '..#..',
      '.....'
    ]);
    const door = new Door('d1', 1, 0, false, false, false, undefined);
    map.addEntity(door, 1, 0);

    const cases = [
      [0, 1, 4, 1], // wall between
      [0, 0, 4, 0], // closed full-tile door between
      [0, 2, 4, 2], // clear
      [0, 0, 1, 1]  // diagonal past door corner
    ];
    for (const [x0, y0, x1, y1] of cases) {
      const expected = los(map, x0, y0, x1, y1).hasLineOfSight;
      expect(VisionSystem.hasLineOfSight(map, x0, y0, x1, y1)).toBe(expected);
    }
  });
});

describe('T2 reinforced-window movement rule (R14#2)', () => {
  const zombie = { id: 'z1', type: 'zombie', logicalX: -5, logicalY: -5 };

  function mapWithEdgeWindow(window) {
    const map = buildMap([
      'FFF',
      'FFF'
    ]);
    map.addEntity(window, 1, 0);
    return map;
  }

  it('a reinforced window blocks crossing even when open or broken', () => {
    for (const [isOpen, isBroken] of [[true, false], [false, true]]) {
      const win = new Window(`w-${isOpen}-${isBroken}`, 1, 0, false, isOpen, isBroken, 's');
      win.isReinforced = true;
      win.reinforcementHp = 10;
      const map = mapWithEdgeWindow(win);

      expect(Pathfinding.isEdgeBlocked(map, 1, 0, 1, 1, zombie, {})).toBe(true);
    }
  });

  it('an unreinforced open/broken window lets a zombie cross', () => {
    for (const [isOpen, isBroken] of [[true, false], [false, true]]) {
      const win = new Window(`w-${isOpen}-${isBroken}`, 1, 0, false, isOpen, isBroken, 's');
      const map = mapWithEdgeWindow(win);

      expect(Pathfinding.isEdgeBlocked(map, 1, 0, 1, 1, zombie, {})).toBe(false);
    }
  });

  it('Tile.isWalkable agrees: reinforced broken window blocks, plain broken window admits zombies', () => {
    const reinforced = new Tile(0, 0, 'building');
    const winR = new Window('wr', 0, 0, false, false, true, undefined);
    winR.isReinforced = true;
    winR.reinforcementHp = 10;
    reinforced.addEntity(winR);
    expect(reinforced.isWalkable(zombie)).toBe(false);

    const plain = new Tile(0, 0, 'building');
    plain.addEntity(new Window('wp', 0, 0, false, false, true, undefined));
    expect(plain.isWalkable(zombie)).toBe(true);
  });

  it('windows still always block the player', () => {
    const player = { id: 'p1', type: 'player', logicalX: -5, logicalY: -5 };
    const win = new Window('w1', 1, 0, false, true, false, 's'); // open, unreinforced
    const map = mapWithEdgeWindow(win);

    expect(Pathfinding.isEdgeBlocked(map, 1, 0, 1, 1, player, {})).toBe(true);
  });
});
