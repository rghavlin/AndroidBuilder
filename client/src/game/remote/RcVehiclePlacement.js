/**
 * Moving an RC wagon's Item between its two homes.
 *
 * A wagon on a far tile is an on-map item entity whose attachments are raw JSON;
 * the moment the player stands on that tile it is instead a real Item inside
 * inventoryManager.groundContainer and the tile is emptied. Any code that
 * relocates one has to leave exactly ONE copy behind, or the wagon either
 * duplicates or quietly loses whatever its passengers did that turn.
 *
 * The two drives commit in deliberately opposite orders, and this module exists
 * so they can while still sharing the actual placement:
 *
 *   - Player-driven (RcVehicleMovement): animate, THEN commit. The player is
 *     watching; a cancelled or errored tween must not have already teleported
 *     the wagon. It parks a disposable ghost on the map for the tween to move.
 *   - Autonomous (WagonSystem): commit, THEN animate. The simulation has to be
 *     authoritative before TurretSystem runs, so a turret riding the wagon
 *     fires from the tile the wagon actually reached this turn. Playback is
 *     purely cosmetic, exactly like TURRET_SHOT.
 *
 * Do not "unify" these into one order. Each is wrong for the other's caller.
 */

/**
 * Put the wagon's Item at (x, y), removing it from whichever home holds it now.
 *
 * Deliberately free of UI side effects (no FOV recalc, no notifyUpdate) so it is
 * safe to call from inside the simulation phase. Precedent: DroneSystem.process
 * already lands drones via dropItemAtLocation mid-sim.
 *
 * dropItemAtLocation routes to the ground container when the target IS the
 * player's tile (see GroundManager.placeItemAtTile), so "the wagon arrives at
 * your feet" needs no branch here.
 *
 * @param {{item: Item, entity: Object|null, source: 'map'|'ground'}} device
 * @param {number} x
 * @param {number} y
 * @param {GameEngine} engine
 * @returns {Object|null} the resulting on-map entity, or null if it landed in
 *   the ground container (which has no entity of its own)
 */
export function relocateWagon(device, x, y, engine) {
  const inv = engine.inventoryManager;
  const gameMap = engine.gameMap;

  if (device.source === 'map' && device.entity) {
    gameMap.removeEntity(device.entity.id);
  } else {
    inv.destroyItem(device.item.instanceId);
  }

  inv.dropItemAtLocation(device.item, x, y, gameMap);

  return gameMap.getEntity(device.item.instanceId) || null;
}

/**
 * Lift the wagon out of whichever home it occupies and put a render ghost on
 * the map at its current tile. Afterwards the item exists in exactly one place
 * (the caller's `item` reference) plus one disposable entity, so a save taken
 * mid-drive can't duplicate or lose it.
 * @returns {Object|null} the on-map entity to animate
 */
export function materializeGhost(device, engine) {
  if (device.source === 'map') return device.entity;

  const inv = engine.inventoryManager;
  const gameMap = engine.gameMap;

  // Destroy-then-place, back to back and synchronously: syncWithMap early-returns
  // while the player is stationary, and finishDrive clears the tile again a few
  // hundred milliseconds later.
  inv.destroyItem(device.item.instanceId);
  const existing = gameMap.getItemsOnTile(device.x, device.y) || [];
  gameMap.setItemsOnTile(device.x, device.y, [...existing, device.item.toJSON()]);

  return gameMap.getEntity(device.item.instanceId);
}

/**
 * Authoritative placement at the end of a player-driven drive: destroy the
 * ghost, put the real Item at the target, and let the UI catch up.
 */
export function finishDrive(device, ghost, x, y, engine) {
  const gameMap = engine.gameMap;

  if (ghost) gameMap.removeEntity(ghost.id);
  engine.inventoryManager.dropItemAtLocation(device.item, x, y, gameMap);

  // engine.isDeviceAnimating is owned by RemoteTween's reference count. This
  // runs as its onFinish (and, when there was no ghost to animate, on a path
  // that never started a tween at all) — either way it must not touch the flag.
  engine.invalidateFOV?.();
  engine.recalculateFOV?.();
  engine.notifyUpdate?.();
}
