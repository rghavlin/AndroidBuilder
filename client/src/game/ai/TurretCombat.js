/**
 * TurretCombat - Shared turret target-resolution + destruction helpers.
 *
 * Used by player combat (CombatContext) and, later, by hostile AI target
 * resolution. A turret is only a valid target while POWERED ON; an inert turret
 * (out of ammo/battery, or manually off) is untargetable and ignored here.
 *
 * Turrets can live in two places on a tile:
 *   - standalone deployed turret entity directly in tile.contents
 *   - a turret item nested inside a wagon/container parked on the tile
 * Both are surfaced so a powered-on wagon-mounted turret is targetable too.
 */

import { gridItems } from '../inventory/gridUtils.js';

export const TURRET_DEF_ID = 'placeable.auto_turret';

export function isPoweredTurret(obj) {
  return !!obj && obj.defId === TURRET_DEF_ID && obj.isOn === true;
}

function factionOf(obj) {
  if (!obj) return null;
  if (typeof obj.getFaction === 'function') return obj.getFaction();
  return obj.factionId || 'neutral';
}

/**
 * Whether a mover may walk onto a tile occupied by this turret.
 *  - A non-turret object never blocks (returns true).
 *  - An inert (powered-off) turret is walkable by everyone.
 *  - A powered-on turret is passable ONLY by its own faction (so the player can
 *    step onto and retrieve their own turret); it blocks everyone else, and
 *    blocks unknown/no-mover queries (treated as a solid obstacle).
 */
export function isTurretPassableBy(turret, mover) {
  if (!turret || turret.defId !== TURRET_DEF_ID) return true;
  if (!turret.isOn) return true;
  const moverFaction = (mover && typeof mover.getFaction === 'function') ? mover.getFaction() : null;
  if (!moverFaction) return false;
  return moverFaction === factionOf(turret);
}

/**
 * Find a powered-on auto-turret carried inside an item's container (e.g. a
 * wagon), or null. Used to surface the turret in tooltips / rendering.
 */
export function getCarriedPoweredTurret(item) {
  if (!item) return null;
  const grid = item.containerGrid || (typeof item.getContainerGrid === 'function' ? item.getContainerGrid() : null);
  if (!grid) return null;
  for (const nested of gridItems(grid)) {
    if (isPoweredTurret(nested)) return nested;
  }
  return null;
}

/**
 * Find a powered-on auto-turret on a tile (standalone or wagon-nested), or null.
 */
export function getPoweredTurretOnTile(tile) {
  if (!tile || !tile.contents) return null;
  for (const e of tile.contents) {
    if (isPoweredTurret(e)) return e;
    const grid = e.containerGrid || (typeof e.getContainerGrid === 'function' ? e.getContainerGrid() : null);
    if (grid) {
      for (const nested of gridItems(grid)) {
        if (isPoweredTurret(nested)) return nested;
      }
    }
  }
  return null;
}

/**
 * Standalone powered-on turret ENTITIES on the map that are valid targets for
 * hostile AI (other turrets, hostile NPCs). A turret is "shielded" — and thus
 * excluded — when an entity of its OWN faction stands on its tile (e.g. the
 * player on their own turret); the shield is targeted instead.
 *
 * NOTE: wagon-nested turrets are not surfaced here yet (they'd need their tile
 * position synced from the carrying wagon); that's handled when hostiles that
 * target them exist.
 *
 * @param {GameMap} gameMap
 * @param {Array} shieldEntities - entities that can shield a turret (player, npcs)
 */
export function getExposedTurretTargets(gameMap, shieldEntities = []) {
  if (!gameMap || typeof gameMap.getEntitiesByType !== 'function') return [];
  const turrets = gameMap.getEntitiesByType('item').filter(isPoweredTurret);
  if (turrets.length === 0) return [];
  return turrets.filter(turret => {
    const tf = factionOf(turret);
    const tx = turret.logicalX !== undefined ? turret.logicalX : turret.x;
    const ty = turret.logicalY !== undefined ? turret.logicalY : turret.y;
    const shielded = shieldEntities.some(e => {
      if (!e) return false;
      const ex = e.logicalX !== undefined ? e.logicalX : e.x;
      const ey = e.logicalY !== undefined ? e.logicalY : e.y;
      return ex === tx && ey === ty && factionOf(e) === tf;
    });
    return !shielded;
  });
}

/**
 * Resolve a turret on the tile that `attacker` is allowed to attack: powered-on
 * and NOT the attacker's own faction. The player cannot attack their own
 * turrets — those are retrieved via the ground container, not the map.
 */
export function getAttackableTurretOnTile(tile, attacker) {
  const turret = getPoweredTurretOnTile(tile);
  if (!turret) return null;
  const attackerFaction = factionOf(attacker);
  if (attackerFaction && factionOf(turret) === attackerFaction) return null;
  return turret;
}

/**
 * Escalation: make every member of `faction` on the map — both turrets and NPCs
 * — hostile to the player (adds 'player' to each one's hostileOverrides).
 * Idempotent. Used when the player attacks the shopkeeper to activate the town's
 * defensive turrets and townsfolk.
 * @returns {number} number of turrets newly escalated
 */
export function escalateFactionAgainstPlayer(gameMap, faction = 'town') {
  if (!gameMap || typeof gameMap.getEntitiesByType !== 'function') return 0;
  const turrets = gameMap.getEntitiesByType('item')
    .filter(e => e && e.defId === TURRET_DEF_ID && factionOf(e) === faction);
  let escalated = 0;
  for (const t of turrets) {
    if (!t.hostileOverrides) t.hostileOverrides = new Set();
    if (!t.hostileOverrides.has('player')) {
      t.hostileOverrides.add('player');
      escalated++;
    }
  }

  // Also escalate any NPCs belonging to the faction
  const npcs = gameMap.getEntitiesByType('npc') || [];
  for (const npc of npcs) {
    if (factionOf(npc) === faction) {
      if (!npc.hostileOverrides) npc.hostileOverrides = new Set();
      if (!npc.hostileOverrides.has('player')) {
        npc.hostileOverrides.add('player');
        npc.isHostile = true; // Legacy isHostile fallback check
      }
    }
  }

  return escalated;
}

/**
 * Remove a destroyed turret from wherever it lives: the map entityMap (standalone
 * deployed turret) or a wagon/container grid on its tile.
 */
export function removeDestroyedTurret(turret, gameMap, x, y) {
  if (!turret || !gameMap) return;

  // Standalone deployed turret entity in the map's entity index.
  if (turret.id && typeof gameMap.getEntity === 'function' && gameMap.getEntity(turret.id)) {
    gameMap.removeEntity(turret.id);
    return;
  }

  // Direct container reference lookup (handles nested grids and ground container items perfectly)
  if (turret._container && typeof turret._container.removeItem === 'function') {
    turret._container.removeItem(turret.instanceId || turret.id);
    return;
  }

  // Nested in a wagon/container parked on the tile.
  const tile = gameMap.getTile(x, y);
  if (!tile || !tile.contents) return;
  for (const e of tile.contents) {
    const grid = e.containerGrid || (typeof e.getContainerGrid === 'function' ? e.getContainerGrid() : null);
    if (grid && typeof grid.removeItem === 'function') {
      if (gridItems(grid).some(it => it === turret || it.instanceId === turret.instanceId)) {
        grid.removeItem(turret.instanceId);
        return;
      }
    }
  }
}
