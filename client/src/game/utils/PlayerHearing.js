import { gameRandom } from './SeededRandom.js';
import { AttributeProgressionManager } from '../systems/AttributeProgressionManager.js';

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

// Loudest noise level any zombie action currently emits (structure smash).
// Used to size the per-turn hearing zone so it covers every event that could
// possibly be heard this turn, regardless of which action ends up firing.
export const MAX_NOISE_LEVEL = 10;

// Snapshot of "every tile the player could possibly hear something on this
// turn" -> distance from player, taken once per turn (SimulationManager,
// alongside the heardByPlayer reset) using the player's position as it stood
// when the zombie/NPC phase begins. Checks during that phase read distance
// from this frozen snapshot instead of recomputing live, so a zombie's
// earlier (unheard) tiles on its path can never retroactively become "heard"
// once it reaches a tile in range — the reveal is tied to arrival on a tile
// that was already known to be listenable, not to the live chase.
export function computeHearingZone(player) {
  const zone = new Map();
  if (!player) return zone;

  const hearingRadius = Math.floor((player.currentPerception || 0) / 10);
  const maxRadius = hearingRadius + MAX_NOISE_LEVEL;
  const px = player.logicalX !== undefined ? player.logicalX : player.x;
  const py = player.logicalY !== undefined ? player.logicalY : player.y;

  for (let dx = -maxRadius; dx <= maxRadius; dx++) {
    for (let dy = -maxRadius; dy <= maxRadius; dy++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= maxRadius) {
        zone.set(`${px + dx},${py + dy}`, dist);
      }
    }
  }
  return zone;
}

export function markHeardIfInRange(zombie, player, noiseLevel) {
  if (!zombie || !player) return;

  const hearingRadius = Math.floor((player.currentPerception || 0) / 10);

  const zx = zombie.logicalX !== undefined ? zombie.logicalX : zombie.x;
  const zy = zombie.logicalY !== undefined ? zombie.logicalY : zombie.y;

  const zone = player.hearingZone;
  let dist;
  if (zone) {
    dist = zone.get(`${Math.round(zx)},${Math.round(zy)}`);
    if (dist === undefined) return; // outside any earshot possible this turn
  } else {
    // Fallback for callers that haven't computed a per-turn zone (e.g. tests).
    const px = player.logicalX !== undefined ? player.logicalX : player.x;
    const py = player.logicalY !== undefined ? player.logicalY : player.y;
    dist = Math.sqrt((zx - px) ** 2 + (zy - py) ** 2);
  }

  const maxDistance = hearingRadius + noiseLevel;
  if (dist > maxDistance) return;

  const baseChance = player.currentPerception || 20;
  const distancePenalty = dist * 4;
  const volumeBonus = noiseLevel * 5;
  const targetChance = Math.max(0, baseChance + volumeBonus - distancePenalty);

  if (gameRandom.next() * 100 < targetChance) {
    // Only stamp the reveal moment on the false->true edge so a zombie that's
    // already heard this turn (e.g. moves then smashes) doesn't restart the
    // pulse animation partway through.
    if (!zombie.heardByPlayer) {
      zombie.hearingRevealedAt = performance.now();
      AttributeProgressionManager.recordAction(player, 'HEARING_SUCCESS');
    }
    zombie.heardByPlayer = true;
  }
}
