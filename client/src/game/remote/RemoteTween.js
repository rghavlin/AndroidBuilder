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
function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
  if (typeof requestAnimationFrame === 'undefined') {
    onFinish();
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
  engine.isDeviceAnimating = true;

  return new Promise((resolve) => {
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const p = ease(progress) * tiles;
      const idx = Math.floor(p);
      const frac = p - idx;
      const curr = path[idx];
      const next = path[Math.min(idx + 1, path.length - 1)];

      const smoothX = curr.x + (next.x - curr.x) * frac;
      const smoothY = curr.y + (next.y - curr.y) * frac;

      entity.renderX = smoothX;
      entity.renderY = smoothY;
      if (followCamera) engine.camera?.centerOn(smoothX, smoothY);
      engine.recalculateFOV?.();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onFinish();
        resolve();
      }
    };
    requestAnimationFrame(animate);
  });
}
