import { createItemFromDef } from './ItemDefs.js';
import { Item } from './Item.js';

/**
 * Synthesizes the Zombie Virus Cure from Patient Zero's Head using a Pharmaceutical Synthesizer.
 *
 * @param {Object} engine - The GameEngine singleton
 * @param {Object} headItem - The Patient Zero Head item instance
 * @param {Object} synthesizerItem - The Pharmaceutical Synthesizer item instance
 * @returns {{ success: boolean, reason?: string, cureItem?: Object }}
 */
export function synthesizeZombieVirusCure(engine, headItem, synthesizerItem) {
  if (!engine || !headItem || !synthesizerItem) {
    return { success: false, reason: 'Invalid parameters for synthesis' };
  }

  const headDefId = headItem.defId || headItem.id;
  const synthDefId = synthesizerItem.defId || synthesizerItem.id;

  if (headDefId !== 'zombie.patient_zero_head') {
    return { success: false, reason: "The synthesizer requires the head of Patient Zero." };
  }

  if (synthDefId !== 'furniture.pharmaceutical_synthesizer') {
    return { success: false, reason: 'Target is not a pharmaceutical synthesizer.' };
  }

  // 1. Delete the Patient Zero Head from player inventory / containers
  if (engine.inventoryManager && headItem.instanceId) {
    engine.inventoryManager.removeItem(headItem.instanceId);
  }
  headItem.stackCount = 0;

  // 2. Spawn the Zombie Virus Cure on the ground
  const cureData = createItemFromDef('medical.zombie_virus_cure');
  if (!cureData) {
    return { success: false, reason: 'Failed to create Zombie Virus Cure definition' };
  }
  const cureItem = Item.fromJSON(cureData);

  // Determine ground placement coordinates on the world map
  let targetX = 0;
  let targetY = 0;

  if (synthesizerItem.worldX !== undefined && synthesizerItem.worldY !== undefined) {
    targetX = synthesizerItem.worldX;
    targetY = synthesizerItem.worldY;
  } else if (engine.inventoryManager && engine.inventoryManager.lastSyncedX !== undefined && engine.inventoryManager.lastSyncedY !== undefined) {
    targetX = engine.inventoryManager.lastSyncedX;
    targetY = engine.inventoryManager.lastSyncedY;
  } else if (engine.player) {
    targetX = Math.round(engine.player.x);
    targetY = Math.round(engine.player.y);
  }

  // 3. Add to GameMap tile
  if (engine.gameMap) {
    if (typeof engine.gameMap.addItemsToTile === 'function') {
      engine.gameMap.addItemsToTile(targetX, targetY, [cureItem]);
    } else if (typeof engine.gameMap.setItemsOnTile === 'function') {
      const existing = engine.gameMap.getItemsOnTile(targetX, targetY) || [];
      if (!existing.some(i => i.instanceId === cureItem.instanceId)) {
        engine.gameMap.setItemsOnTile(targetX, targetY, [...existing, cureItem]);
      }
    }
  }

  // 4. Add to ground container / ground manager if available
  if (engine.inventoryManager) {
    if (engine.inventoryManager.groundManager) {
      engine.inventoryManager.groundManager.addItemSmart(cureItem);
    } else {
      const groundContainer = engine.inventoryManager.getContainer('ground');
      if (groundContainer && !groundContainer.items.has(cureItem.instanceId)) {
        groundContainer.addItem(cureItem);
      }
    }
    engine.inventoryManager.emit('inventoryChanged');
  }

  if (typeof engine.notifyUpdate === 'function') {
    engine.notifyUpdate();
  }

  return { success: true, cureItem };
}
