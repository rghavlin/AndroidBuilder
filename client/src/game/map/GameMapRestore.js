// Per-type entity restore dispatch, extracted from map/GameMap.js
// (CODE_QUALITY_ACTION_PLAN.md Wave 4). fromJSON and fromJSONSelective both
// route through this data-driven map so the two restore paths can't drift —
// registering a new entity type is adding one map entry instead of a case.

import { Entity } from '../entities/Entity.js';
import { TestEntity } from '../entities/TestEntity.js';
import { Door } from '../entities/Door.js';
import { Window } from '../entities/Window.js';
import { PlaceIcon } from '../entities/PlaceIcon.js';
import { Rabbit } from '../entities/Rabbit.js';
import { GarageDoor } from '../entities/GarageDoor.js';
import { Drone } from '../entities/Drone.js';

/**
 * entityType -> (entityData, gameMap) => Entity|null
 */
export const ENTITY_RESTORERS = {
  player: (entityData) => Entity.fromJSON(entityData),
  zombie: (entityData) => Entity.fromJSON(entityData),
  npc: (entityData) => Entity.fromJSON(entityData),
  test: (entityData) => TestEntity.fromJSON(entityData),
  item: (entityData, gameMap) => (
    entityData.components
      ? Entity.fromJSON(entityData)
      : gameMap.convertLegacyItemToECS(entityData)
  ),
  door: (entityData) => Door.fromJSON(entityData),
  garage_door: (entityData) => GarageDoor.fromJSON(entityData),
  window: (entityData) => Window.fromJSON(entityData),
  place_icon: (entityData) => PlaceIcon.fromJSON(entityData),
  rabbit: (entityData) => Rabbit.fromJSON(entityData),
  drone: (entityData) => Drone.fromJSON(entityData)
};

/**
 * Restore a single entity via the registered restorer for its type.
 * Returns null (and warns) for an unregistered type.
 */
export function restoreEntity(entityType, entityData, gameMap) {
  const restorer = ENTITY_RESTORERS[entityType];
  if (!restorer) {
    console.warn(`[GameMap] Unknown entity type during restoration: ${entityType}`);
    return null;
  }
  return restorer(entityData, gameMap);
}
