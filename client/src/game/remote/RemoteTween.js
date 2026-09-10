/**
 * Shared travel animation for remotely-driven devices.
 *
 * One continuous tween across the WHOLE path (like the player's
 * smoothAnimateMovement) rather than a per-tile animation — stepping tile by
 * tile reads as choppy because the camera jumps a full tile at a time and the
 * render loop can go idle between steps.
 *
 * Extracted from DroneMovement so the drone and the RC wagon can't drift into
 * two different motion languages.
 */

const MIN_TRAVEL_MS = 300;
const MAX_TRAVEL_MS = 1200;

// Same ease-in/ease-out curve the player's movement uses, so a remote device
// reads as the same "thing moving" motion.
//
// Defined ONLY on [0, 1]. Outside it the curve turns around and climbs again —
// the t < 0.5 branch is 2t*t, so ease(-1) is 2 and ease(-2) is 8 — which is why
// every caller must clamp before calling in.
function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * engine.isDeviceAnimating keeps MapCanvas's render loop painting continuously
 * (it has no React state to drive it). It is REFERENCE COUNTED because playback
 * lanes run concurrently: several autonomous wagons tween at once, and a plain
 * boolean let the first one to finish switch the loop off underneath the rest,
 * leaving the longer trips to animate at the pulse cadence.
 *
 * This module owns the flag start to finish. Callers' onFinish handlers must not
 * touch it, or the count and the flag drift apart.
 */
function beginTween(engine) {
  if (!engine) return;
  engine._deviceTweenCount = (engine._deviceTweenCount || 0) + 1;
  engine.isDeviceAnimating = true;
}

function endTween(engine) {
  if (!engine) return;
  engine._deviceTweenCount = Math.max(0, (engine._deviceTweenCount || 1) - 1);
  engine.isDeviceAnimating = engine._deviceTweenCount > 0;
}

/**
 * Run the caller's authoritative placement, then release the render-loop count
 * whatever happens. Errors are logged rather than rethrown — see the call site.
 */
function settleTween(engine, onFinish) {
  try {
    onFinish();
  } catch (err) {
    console.error('[RemoteTween] onFinish threw; the device may be left mid-placement:', err);
  } finally {
    endTween(engine);
  }
}

/**
 * Tween `entity` along `path`, driving the camera and FOV every frame, then
 * hand off to `onFinish` for the authoritative placement.
 *
 * `onFinish` is called synchronously and immediately when there is no rAF
 * (headless / tests), so callers get identical end state either way.
 *
 * FOV is recalculated per frame, but GameEngine's options-hash dedupe (which
 * includes each device's ROUNDED tile) makes that a no-op until the device
 * actually crosses a tile boundary. Do NOT call invalidateFOV() from here —
 * that would defeat the dedupe and force a full shadowcast every frame.
 *
 * `followCamera` is on by default because the two hand-driven cases ARE the
 * camera: the player is looking through the device they're steering. An
 * autonomous wagon is the opposite — it moves on its own turn while the player
 * is somewhere else entirely, and yanking the view to it every end-turn would
 * make the game unplayable.
 *
 * @param {Object} entity - the render form being moved (drone entity / item ghost)
 * @param {Array<{x:number,y:number}>} path - includes the start tile
 * @param {GameEngine} engine
 * @param {{msPerTile: number, followCamera?: boolean}} options
 * @param {Function} onFinish - authoritative snap; runs exactly once
 * @returns {Promise<void>}
 */
export function tweenAlongPath(entity, path, engine, { msPerTile, followCamera = true }, onFinish) {
  // Headless (tests / Node): no rAF to tween on — snap straight to the target.
  // Same settle contract as the animated path, so behaviour can't diverge
  // between the two: the promise always resolves, errors are logged not thrown.
  if (typeof requestAnimationFrame === 'undefined') {
    settleTween(engine, onFinish);
    return Promise.resolve();
  }

  // Nothing to animate. Every caller already guards this, but a zero-length
  // path here would make `tiles` -1 and index off the FRONT of the array, so
  // fail the same way the headless branch does: run the authoritative
  // placement, resolve, and never start a frame loop. onFinish is called
  // directly rather than through settleTween because no beginTween has run —
  // endTween would take a count belonging to a concurrent tween.
  if (!Array.isArray(path) || path.length === 0) {
    console.warn('[RemoteTween] tweenAlongPath called with an empty path; nothing to animate');
    try {
      onFinish();
    } catch (err) {
      console.error('[RemoteTween] onFinish threw; the device may be left mid-placement:', err);
    }
    return Promise.resolve();
  }

  const tiles = path.length - 1;
  const duration = Math.min(MAX_TRAVEL_MS, Math.max(MIN_TRAVEL_MS, tiles * msPerTile));
  const startTime = performance.now();

  // Drive render coords directly and leave movementPath empty so EntityRenderer
  // falls through to entity.x/entity.y rather than running its own competing
  // animationProgress interpolation.
  entity.movementPath = [];
  entity.isAnimating = true;
  beginTween(engine);

  return new Promise((resolve) => {
    const animate = (now) => {
      let progress;
      try {
        // `now` is the frame's BEGIN time, which can predate the startTime
        // sampled when the tween was created — the main thread having been busy
        // in between (finishing a turn simulation, say) is exactly when that
        // happens, and an autonomous wagon starts its tween the instant the
        // simulation ends. The raw ratio therefore goes negative, so clamp both
        // ends: ease() climbs again below 0 (see its definition) and would walk
        // the index clean off the end of the path. A non-finite timestamp
        // collapses to 0 for the same reason.
        const elapsed = (now - startTime) / duration;
        progress = Number.isFinite(elapsed) ? Math.min(Math.max(elapsed, 0), 1) : 0;

        const p = ease(progress) * tiles;
        // Belt and braces: the clamp above already keeps this in range, and a
        // path index is not something to leave to a curve staying well behaved.
        const idx = Math.min(Math.max(Math.floor(p), 0), tiles);
        const frac = p - idx;
        const curr = path[idx];
        const next = path[Math.min(idx + 1, tiles)];

        const smoothX = curr.x + (next.x - curr.x) * frac;
        const smoothY = curr.y + (next.y - curr.y) * frac;

        entity.renderX = smoothX;
        entity.renderY = smoothY;
        if (followCamera) engine.camera?.centerOn(smoothX, smoothY);
        engine.recalculateFOV?.();
      } catch (err) {
        // A throw inside a frame callback escapes into the event loop where
        // nothing can catch it: this promise would never settle, and
        // TurnManager.processQueue would sit at isProcessing = true forever,
        // aborting every later turn with "Already processing" — the game stuck
        // on "PROCESSING TURNS...". End the tween honestly instead.
        console.error('[RemoteTween] frame failed; ending the tween early:', err);
        settleTween(engine, onFinish);
        resolve();
        return;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Release the count only after the authoritative placement, so the final
        // frame is painted with the device already where it belongs.
        //
        // A throwing onFinish must neither strand the render loop on nor leave
        // this promise unsettled: TurnManager.processQueue awaits it, and a
        // promise that never settles wedges isProcessing true — which aborts
        // every subsequent turn with "Already processing". Log and carry on.
        settleTween(engine, onFinish);
        resolve();
      }
    };
    requestAnimationFrame(animate);
  });
}
