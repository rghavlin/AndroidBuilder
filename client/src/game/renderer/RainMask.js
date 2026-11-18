import { isIndoorFloor, isOpenToSky } from '../map/TerrainTypes.js';

/**
 * RainMask — which tiles the screen-space rain layer is drawn over.
 *
 * Rain is a single full-screen particle layer, so "rain stops indoors" is done
 * by clipping that layer to tiles rather than by simulating drops per tile:
 *
 *   • Player OUTSIDE → mode 'exclude': rain everywhere EXCEPT interior floor the
 *     player can currently see (through an open door or window). Interior they
 *     can't see still gets rain — from top-down that reads as the roof.
 *   • Player INSIDE → mode 'include': rain ONLY on open-sky tiles the player can
 *     currently see — the view out through doors and windows. The room's own
 *     walls and every other room stay dry.
 *
 * The result is a list of horizontal runs in tile units ([x, y, width]) so the
 * caller builds one clip path with a rect per row segment, not one per tile.
 * Pure (no canvas), so it runs headless in tests.
 *
 * @param {object} gameMap - exposes getTile(x, y)
 * @param {{startX:number,endX:number,startY:number,endY:number}} bounds - inclusive tile range to scan (the on-screen tiles)
 * @param {Set<string>} visibleTileSet - "x,y" keys of the tiles the player can see
 * @param {boolean} playerInside - is the player standing on an indoor floor
 * @returns {{ mode: 'include' | 'exclude', runs: Array<[number, number, number]> }}
 */
export function computeRainMask(gameMap, bounds, visibleTileSet, playerInside) {
  const mode = playerInside ? 'include' : 'exclude';
  const runs = [];
  if (!gameMap || !bounds || !visibleTileSet) return { mode, runs };

  for (let y = bounds.startY; y <= bounds.endY; y++) {
    let runStart = -1;
    for (let x = bounds.startX; x <= bounds.endX + 1; x++) {
      let inMask = false;
      if (x <= bounds.endX && visibleTileSet.has(`${x},${y}`)) {
        const tile = gameMap.getTile(x, y);
        if (tile) {
          inMask = playerInside ? isOpenToSky(tile.terrain) : isIndoorFloor(tile.terrain);
        }
      }
      if (inMask && runStart < 0) {
        runStart = x;
      } else if (!inMask && runStart >= 0) {
        runs.push([runStart, y, x - runStart]);
        runStart = -1;
      }
    }
  }
  return { mode, runs };
}

// Rain animates every frame, but the mask only changes when the FOV is
// recalculated (the engine swaps in a new visibleTileSet), the camera scrolls
// to a new tile range, or the player crosses a threshold — so reuse the last
// result until one of those does.
let memo = null;

export function getRainMask(gameMap, bounds, visibleTileSet, playerInside) {
  if (memo &&
      memo.gameMap === gameMap &&
      memo.visibleTileSet === visibleTileSet &&
      memo.playerInside === playerInside &&
      memo.startX === bounds.startX && memo.endX === bounds.endX &&
      memo.startY === bounds.startY && memo.endY === bounds.endY) {
    return memo.result;
  }
  const result = computeRainMask(gameMap, bounds, visibleTileSet, playerInside);
  memo = {
    gameMap, visibleTileSet, playerInside,
    startX: bounds.startX, endX: bounds.endX, startY: bounds.startY, endY: bounds.endY,
    result
  };
  return result;
}
