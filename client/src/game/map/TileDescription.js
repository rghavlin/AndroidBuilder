import { EntityType } from '../entities/Entity.js';
import { findEdgeStructure } from '../utils/EdgeStructure.js';

/**
 * What is on a tile that the tooltip layer can describe.
 *
 * These fields exist ONLY to feed MapInterface's cheap "is there anything here
 * worth a tooltip" gate. TileTooltipOverlay re-reads every one of them off the
 * map itself and uses nothing from this payload but x/y — which is exactly why
 * every hover mode has to fill them in. A mode that sets a bare cursor payload
 * does not render a plain tooltip, it renders NO tooltip.
 *
 * That is what happened while flying the recon drone: its hover branch returned
 * early with just an AP cost, so the one mode whose entire job is looking at
 * things was the one mode that could not.
 *
 * The `data` argument is the enriched hover payload MapCanvas passes down. It
 * is the fallback for entities mid-animation, whose logical tile is already the
 * next one over.
 */
export function describeTile(gameMap, targetTile, x, y, data = null, hoveredDrone = null) {
  if (!gameMap || !targetTile) return {};

  const zombie = targetTile.contents.find(e => e.type === EntityType.ZOMBIE);
  const rabbit = targetTile.contents.find(e => e.type === EntityType.RABBIT);
  const { structure: door } = findEdgeStructure(gameMap, x, y, { type: 'door' });
  const { structure: windowEntity } = findEdgeStructure(gameMap, x, y, { type: 'window' });

  return {
    zombie: zombie
      ? { subtype: zombie.subtype, hp: zombie.hp, maxHp: zombie.maxHp, currentAP: zombie.currentAP, maxAP: zombie.maxAP }
      : (data?.zombie || null),
    rabbit: rabbit
      ? { id: rabbit.id, type: rabbit.type, hp: rabbit.hp, maxHp: rabbit.maxHp, currentAP: rabbit.currentAP, maxAP: rabbit.maxAP }
      : (data?.rabbit || null),
    cropInfo: targetTile.cropInfo || data?.cropInfo || null,
    lootItems: targetTile.inventoryItems || null,
    specialBuilding: targetTile.contents.find(e => e.type === EntityType.PLACE_ICON)?.subtype || null,
    door,
    window: windowEntity,
    npc: targetTile.contents.find(e => e.type === EntityType.NPC),
    drone: hoveredDrone
  };
}

/**
 * describeTile, but only for ground the player has actually seen. Unexplored
 * tiles describe nothing at all — the tooltip layer refuses them anyway, and a
 * remote camera must not become an x-ray of the map it hasn't flown over yet.
 */
export function describeIfExplored(gameMap, targetTile, x, y, data = null, hoveredDrone = null) {
  return targetTile?.flags?.explored ? describeTile(gameMap, targetTile, x, y, data, hoveredDrone) : {};
}
