// RemoteTween against a rAF timestamp that predates the tween.
//
// The timestamp a browser hands an rAF callback is the frame's begin time, and
// that can be EARLIER than a performance.now() sampled just before the frame was
// requested — the main thread having been busy in between is exactly when it
// happens. An autonomous wagon starts its tween the instant the turn simulation
// ends, so it is the caller that meets this.
//
// progress then goes negative, and the ease curve's t < 0.5 branch is 2t*t,
// which GROWS for negative t: at progress -1 it returns 2, and the path index
// (progress * tiles) runs clean off the end of the path. The frame then read
// curr.x off undefined and threw inside the rAF callback, where nothing could
// catch it: the tween promise never settled, so TurnManager.processQueue stayed
// isProcessing forever and every later turn aborted with "Already processing".

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tweenAlongPath } from '../../client/src/game/remote/RemoteTween.js';

const PATH = [{ x: 5, y: 10 }, { x: 6, y: 10 }, { x: 7, y: 10 }];

/**
 * Fake rAF whose first callback carries a timestamp `lagMs` in the past,
 * then advances normally.
 */
function installRaf(lagMs) {
  let firstFrame = true;
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => {
    const now = firstFrame ? performance.now() - lagMs : performance.now();
    firstFrame = false;
    cb(now);
  }, 0);
}

describe('RemoteTween with a stale frame timestamp', () => {
  let engine;
  let entity;
  let errors;

  beforeEach(() => {
    entity = { renderX: 5, renderY: 10, movementPath: [], isAnimating: false };
    engine = { camera: { centerOn: () => {} }, recalculateFOV: () => {} };
    errors = [];
    vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.join(' ')));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.requestAnimationFrame;
  });

  it('settles instead of throwing out of the frame callback', async () => {
    installRaf(400);
    let finished = false;

    await tweenAlongPath(entity, PATH, engine, { msPerTile: 140 }, () => { finished = true; });

    expect(finished).toBe(true);
    expect(errors.filter(e => e.includes('Cannot read properties'))).toEqual([]);
  });

  it('releases the render-loop refcount, so the next turn can still play', async () => {
    installRaf(400);

    await tweenAlongPath(entity, PATH, engine, { msPerTile: 140 }, () => {});

    expect(engine._deviceTweenCount).toBe(0);
    expect(engine.isDeviceAnimating).toBe(false);
  });

  it('never renders the entity off the end of its path', async () => {
    installRaf(400);
    const seen = [];
    const wrapped = { ...entity };
    Object.defineProperty(wrapped, 'renderX', {
      get() { return this._rx; },
      set(v) { this._rx = v; seen.push(v); }
    });

    await tweenAlongPath(wrapped, PATH, engine, { msPerTile: 140 }, () => {});

    expect(seen.length).toBeGreaterThan(0);
    for (const x of seen) {
      expect(Number.isFinite(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(5);
      expect(x).toBeLessThanOrEqual(7);
    }
  });

  it('still plays a normal tween start to finish', async () => {
    installRaf(0);
    let finished = false;

    await tweenAlongPath(entity, PATH, engine, { msPerTile: 140 }, () => { finished = true; });

    expect(finished).toBe(true);
    expect(entity.renderX).toBeCloseTo(7, 5);
    expect(engine.isDeviceAnimating).toBe(false);
    expect(engine._deviceTweenCount).toBe(0);
  });
});
