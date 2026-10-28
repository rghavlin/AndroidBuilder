import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameSaveSystem, START_MAP_SLOT } from '../../client/src/game/GameSaveSystem.js';
import { scenarioFingerprint, loadStartMap } from '../../client/src/game/StartMapSave.js';

// A fake Electron save folder: GameSaveSystem's desktop path is the simplest
// storage backend to stand up headless (no IndexedDB / localStorage needed).
function installFakeElectron() {
  const files = new Map();
  globalThis.window = {
    electronAPI: {
      saveGame: async (slot, data) => { files.set(slot, data); return { success: true }; },
      loadGame: async (slot) => files.get(slot) ?? null,
      deleteSave: async (slot) => {
        for (const key of [...files.keys()]) {
          if (key === slot || key.startsWith(`${slot}_chunk_`)) files.delete(key);
        }
        return { success: true };
      },
      listSaves: async () => [...files.entries()].map(([slotName, data]) => {
        const parsed = JSON.parse(data);
        return { slotName, timestamp: parsed.timestamp || 0, turn: parsed.turn || 1 };
      }),
    },
  };
  return files;
}

describe('Start-map tutorial save', () => {
  let files;
  beforeEach(() => { files = installFakeElectron(); });
  afterEach(() => { delete globalThis.window; });

  it('fingerprints scenarios by content', () => {
    const a = { name: 'StartMenu', tiles: [[1, 2]], entities: [] };
    expect(scenarioFingerprint(a)).toBe(scenarioFingerprint({ ...a }));
    expect(scenarioFingerprint(a)).not.toBe(scenarioFingerprint({ ...a, tiles: [[1, 3]] }));
    expect(scenarioFingerprint(null)).toBeNull();
  });

  it('keeps the start-map slot and its chunks out of the save lists', async () => {
    files.set('autosave', JSON.stringify({ timestamp: 2, turn: 5 }));
    files.set(START_MAP_SLOT, JSON.stringify({ timestamp: 3, turn: 9 }));
    files.set(`${START_MAP_SLOT}_chunk_map_002`, JSON.stringify({ timestamp: 1 }));

    const slots = (await GameSaveSystem.listSaveSlots()).map(s => s.slotName);
    expect(slots).toEqual(['autosave']);
  });

  it('discards a save made on a different StartMenu scenario without loading it', async () => {
    files.set(START_MAP_SLOT, JSON.stringify({
      timestamp: 1, turn: 4,
      metadata: { scenarioFingerprint: 'old-map' },
    }));

    expect(await loadStartMap('new-map')).toBeNull();
    expect(files.has(START_MAP_SLOT)).toBe(false);
  });

  it('returns null when there is no start-map save', async () => {
    expect(await loadStartMap('any')).toBeNull();
  });
});
