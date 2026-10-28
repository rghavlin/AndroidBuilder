import { GameSaveSystem, START_MAP_SLOT } from './GameSaveSystem.js';

/**
 * Persistence for the start-menu tutorial map.
 *
 * The start map is a playable tutorial behind the title screen. Its progress is
 * kept in one private slot (START_MAP_SLOT) that is autosaved every turn and
 * resumed on boot, independent of the regular save slots: it never appears in
 * load/save lists and never writes the student to the CharacterRegistry.
 *
 * Each save is stamped with a fingerprint of the StartMenu scenario it was
 * played on. If the scenario changes (map edited, game updated), the stale save
 * is ignored and the tutorial starts fresh rather than resuming on an old layout.
 */

/** FNV-1a over the scenario's JSON — cheap, stable, and only compared for equality. */
export function scenarioFingerprint(scenarioData) {
  if (!scenarioData) return null;
  const str = JSON.stringify(scenarioData);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${str.length.toString(36)}-${(hash >>> 0).toString(36)}`;
}

/**
 * Write the current start-map state.
 * @param {Object} gameState - Same shape GameContext hands GameSaveSystem.saveToStorage
 * @param {string|null} fingerprint - scenarioFingerprint() of the StartMenu scenario
 */
export async function saveStartMap(gameState, fingerprint) {
  const state = {
    ...gameState,
    metadata: { ...(gameState.metadata || {}), scenarioFingerprint: fingerprint || undefined }
  };
  return GameSaveSystem.saveToStorage(state, START_MAP_SLOT, { syncCharacter: false });
}

/**
 * Deserialize the saved start map, or return null when there is none or it was
 * played on a different StartMenu scenario. The fingerprint is checked on the
 * raw data before loadGameState() touches any engine state.
 * @param {string|null} fingerprint - scenarioFingerprint() of the current StartMenu scenario
 */
export async function loadStartMap(fingerprint) {
  let saveData;
  try {
    saveData = await GameSaveSystem.readSaveData(START_MAP_SLOT);
  } catch (error) {
    console.warn('[StartMapSave] Failed to read start-map save:', error);
    return null;
  }
  if (!saveData) return null;

  const savedFingerprint = saveData.metadata?.scenarioFingerprint || null;
  if (fingerprint && savedFingerprint !== fingerprint) {
    console.log('[StartMapSave] StartMenu scenario changed since the last save — starting the tutorial fresh.');
    await resetStartMap();
    return null;
  }

  try {
    const components = await GameSaveSystem.loadGameState(saveData);
    if (components && components.worldManager) {
      components.worldManager.saveSlot = START_MAP_SLOT;
    }
    return components;
  } catch (error) {
    console.warn('[StartMapSave] Start-map save is unreadable — starting the tutorial fresh:', error);
    await resetStartMap();
    return null;
  }
}

/** Forget all start-map progress; the next boot starts the tutorial from scratch. */
export async function resetStartMap() {
  return GameSaveSystem.deleteSaveSlot(START_MAP_SLOT);
}
