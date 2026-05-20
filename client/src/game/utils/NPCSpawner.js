/**
 * NPCSpawner - Handles placement of NPCs on maps.
 * Disabled: All NPC spawns have been removed from the game.
 */
export class NPCSpawner {
  /**
   * Spawn NPCs on a given game map
   * @returns {number} - 0 (NPC spawns disabled)
   */
  static spawnNPCs(gameMap, options = {}) {
    return 0;
  }

  /**
   * Spawn a single NPC at a specific location
   * @returns {null} - null (NPC spawns disabled)
   */
  static spawnNPCAt(gameMap, x, y, options = {}) {
    return null;
  }
}
