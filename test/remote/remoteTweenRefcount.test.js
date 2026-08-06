// engine.isDeviceAnimating keeps MapCanvas painting continuously while a remote
// device slides across the map. It used to be a plain boolean set by
// RemoteTween and cleared by each caller's onFinish — fine when only one thing
// ever tweened, wrong once autonomous wagons arrived: playback lanes run
// concurrently, so the first wagon to finish switched the render loop off while
// the others were still moving, and their trips animated at the pulse cadence.
//
// It is now reference counted, and RemoteTween owns it exclusively.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tweenAlongPath } from '../../client/src/game/remote/RemoteTween.js';

const PATH = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];

/** A minimal engine double — the tween only touches these. */
function makeEngine() {
  return {
    isDeviceAnimating: false,
    _deviceTweenCount: 0,
    camera: { centerOn: () => {} },
    recalculateFOV: () => {}
  };
}

const makeEntity = () => ({ renderX: 0, renderY: 0, movementPath: null, isAnimating: false });

describe('RemoteTween — isDeviceAnimating reference counting', () => {
  let engine;

  beforeEach(() => {
    engine = makeEngine();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('headless (no requestAnimationFrame)', () => {
    it('finishes synchronously without stranding the flag on', async () => {
      // The path tests take: rAF is undefined, so the tween snaps.
      expect(typeof requestAnimationFrame).toBe('undefined');

      const onFinish = vi.fn();
      await tweenAlongPath(makeEntity(), PATH, engine, { msPerTile: 10 }, onFinish);

      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(engine.isDeviceAnimating).toBe(false);
      expect(engine._deviceTweenCount).toBe(0);
    });
  });

  describe('animated', () => {
    let frames;

    beforeEach(() => {
      // Drive rAF by hand so the two tweens can be finished in a chosen order.
      frames = [];
      vi.stubGlobal('requestAnimationFrame', (cb) => { frames.push(cb); return frames.length; });
      vi.stubGlobal('performance', { now: () => 0 });
    });

    /** Run every queued frame at `t`, which completes any tween past its duration. */
    const advance = (t) => {
      const queued = frames;
      frames = [];
      for (const cb of queued) cb(t);
    };

    it('holds the flag while one tween runs, releases it at the end', async () => {
      const promise = tweenAlongPath(makeEntity(), PATH, engine, { msPerTile: 10 }, () => {});

      expect(engine.isDeviceAnimating).toBe(true);
      expect(engine._deviceTweenCount).toBe(1);

      advance(10_000); // well past the duration
      await promise;

      expect(engine.isDeviceAnimating).toBe(false);
      expect(engine._deviceTweenCount).toBe(0);
    });

    it('keeps the flag on until the LAST concurrent tween finishes', async () => {
      // The regression: two wagons moving in the same turn.
      const shortTrip = tweenAlongPath(makeEntity(), PATH, engine, { msPerTile: 10 }, () => {});
      const longTrip = tweenAlongPath(makeEntity(), PATH, engine, { msPerTile: 10 }, () => {});

      expect(engine._deviceTweenCount).toBe(2);

      // Finish exactly one of them.
      const queued = frames;
      frames = [];
      queued[0](10_000);
      await shortTrip;

      expect(engine._deviceTweenCount, 'one tween still in flight').toBe(1);
      expect(engine.isDeviceAnimating, 'render loop must stay continuous').toBe(true);

      queued[1](10_000);
      await longTrip;

      expect(engine._deviceTweenCount).toBe(0);
      expect(engine.isDeviceAnimating).toBe(false);
    });

    it('still settles, and releases the count, if onFinish throws', async () => {
      // A promise that never settles is the dangerous failure here, not the
      // error itself: TurnManager.processQueue awaits this, and hanging leaves
      // isProcessing true, which aborts every subsequent turn.
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      const boom = () => { throw new Error('placement failed'); };

      const promise = tweenAlongPath(makeEntity(), PATH, engine, { msPerTile: 10 }, boom);
      advance(10_000);
      await promise; // must not hang, must not reject

      expect(engine._deviceTweenCount).toBe(0);
      expect(engine.isDeviceAnimating).toBe(false);
      expect(errors).toHaveBeenCalled(); // logged, not swallowed silently
      errors.mockRestore();
    });

    it('does not drive the camera when followCamera is off', async () => {
      const centerOn = vi.fn();
      engine.camera = { centerOn };

      const promise = tweenAlongPath(
        makeEntity(), PATH, engine, { msPerTile: 10, followCamera: false }, () => {}
      );
      advance(10_000);
      await promise;

      expect(centerOn).not.toHaveBeenCalled();
    });

    it('still follows the camera by default, for hand-driven devices', async () => {
      const centerOn = vi.fn();
      engine.camera = { centerOn };

      const promise = tweenAlongPath(makeEntity(), PATH, engine, { msPerTile: 10 }, () => {});
      advance(10_000);
      await promise;

      expect(centerOn).toHaveBeenCalled();
    });
  });
});
