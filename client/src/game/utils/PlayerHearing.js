// Player-hears-zombies sensory check. Distinct from (and unrelated to) the
// existing gameMap.emitNoise()/AudioSystem zombie-hears-player mechanics —
// this is purely about the player's own Perception-driven awareness of
// zombies they can't currently see. Marks `zombie.heardByPlayer = true` for
// the rest of this turn when a noisy zombie action (move, door smash) happens
// within earshot; EntityRenderer then draws a vague, detail-free silhouette
// for heard-but-unseen zombies instead of skipping them entirely.
//
// Known simplification: distance-only, no wall/door blocking (matches how
// gameMap.emitNoise already works for the reverse direction). A closed door
// muffling sound the way it already blocks sight is a reasonable follow-up,
// not done here.
export function markHeardIfInRange(zombie, player, noiseLevel) {
  if (!zombie || !player) return;

  const hearingRadius = Math.floor((player.currentPerception || 0) / 10);

  const zx = zombie.logicalX !== undefined ? zombie.logicalX : zombie.x;
  const zy = zombie.logicalY !== undefined ? zombie.logicalY : zombie.y;
  const px = player.logicalX !== undefined ? player.logicalX : player.x;
  const py = player.logicalY !== undefined ? player.logicalY : player.y;

  const dist = Math.sqrt((zx - px) ** 2 + (zy - py) ** 2);
  if (dist <= hearingRadius + noiseLevel) {
    zombie.heardByPlayer = true;
  }
}
