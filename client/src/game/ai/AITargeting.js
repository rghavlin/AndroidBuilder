/**
 * AITargeting - Faction-aware target selection shared by all AI (zombies, NPCs,
 * turrets). Centralizes "who may I attack" so hostility is resolved consistently
 * through Entity.isHostileTo (which consults per-entity overrides and the
 * FactionRegistry stance table).
 *
 * This module makes no decisions about HOW to engage a target (move, shoot,
 * melee) — only which candidates are valid hostiles, optionally gated by line of
 * sight and range, and sorted by distance.
 */

export const AITargeting = {
  /**
   * Filter candidates down to living entities `attacker` is hostile toward,
   * sorted nearest-first.
   *
   * @param {Entity} attacker
   * @param {Array<Entity>} candidates
   * @param {Object} [options]
   * @param {GameMap} [options.gameMap]   - required when requireLineOfSight is set
   * @param {number}  [options.maxRange]  - Euclidean tile range cap
   * @param {boolean} [options.requireLineOfSight=false]
   * @returns {Array<Entity>}
   */
  acquireTargets(attacker, candidates, options = {}) {
    if (!attacker || !Array.isArray(candidates)) return [];
    const { gameMap = null, maxRange = Infinity, requireLineOfSight = false } = options;

    const results = [];
    for (const candidate of candidates) {
      if (!candidate || candidate === attacker) continue;
      if (candidate.hp !== undefined && candidate.hp <= 0) continue;
      if (!attacker.isHostileTo(candidate)) continue;

      const cx = candidate.logicalX !== undefined ? candidate.logicalX : candidate.x;
      const cy = candidate.logicalY !== undefined ? candidate.logicalY : candidate.y;
      const dist = attacker.getDistanceTo(cx, cy);
      if (dist > maxRange) continue;

      if (requireLineOfSight && gameMap && !attacker.canSeeEntity(gameMap, candidate)) continue;

      results.push({ entity: candidate, dist });
    }

    results.sort((a, b) => a.dist - b.dist);
    return results.map(r => r.entity);
  },

  /**
   * Convenience: the single nearest valid hostile, or null.
   */
  acquireNearestTarget(attacker, candidates, options = {}) {
    const targets = this.acquireTargets(attacker, candidates, options);
    return targets.length > 0 ? targets[0] : null;
  }
};
