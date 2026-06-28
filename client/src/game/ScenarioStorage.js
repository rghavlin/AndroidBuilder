const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI?.saveScenario;

// ─── IndexedDB fallback (browser / dev server) ─────────────────────────

const DB_NAME = 'zombie_road_scenarios';
const STORE_NAME = 'scenarios';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const idbStorage = {
  async save(scenarioData) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(scenarioData);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async list() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result.map(s => ({
        name: s.name, width: s.width, height: s.height,
      })));
      req.onerror = () => reject(req.error);
    });
  },
  async load(name) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(name);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },
  async remove(name) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

// ─── Electron file-based storage (customMaps/) ─────────────────────────

const electronStorage = {
  async save(scenarioData) {
    const res = await window.electronAPI.saveScenario(scenarioData.name, scenarioData);
    if (!res.success) throw new Error(res.error);
  },
  async saveEditorState(name, editorData) {
    const res = await window.electronAPI.saveScenarioEditor(name, editorData);
    if (!res.success) throw new Error(res.error);
  },
  async loadEditorState(name) {
    const raw = await window.electronAPI.loadScenarioEditor(name);
    return raw ? JSON.parse(raw) : null;
  },
  async list() {
    return window.electronAPI.listScenarios();
  },
  async load(nameOrFileName) {
    const fileName = nameOrFileName.endsWith('.json')
      ? nameOrFileName
      : `${nameOrFileName}.scenario.json`;
    const raw = await window.electronAPI.loadScenario(fileName);
    return raw ? JSON.parse(raw) : null;
  },
  async remove(nameOrFileName) {
    const fileName = nameOrFileName.endsWith('.json')
      ? nameOrFileName
      : `${nameOrFileName}.scenario.json`;
    const res = await window.electronAPI.deleteScenario(fileName);
    if (!res.success) throw new Error(res.error);
  },
};

// ─── Unified API ────────────────────────────────────────────────────────

export const ScenarioStorage = {
  save:      (d) => isElectron() ? electronStorage.save(d)      : idbStorage.save(d),
  list:      ()  => isElectron() ? electronStorage.list()       : idbStorage.list(),
  load:      (n) => isElectron() ? electronStorage.load(n)      : idbStorage.load(n),
  remove:    (n) => isElectron() ? electronStorage.remove(n)    : idbStorage.remove(n),
  saveEditorState: (name, data) => isElectron()
    ? electronStorage.saveEditorState(name, data)
    : idbStorage.save({ ...data, name }),
  loadEditorState: (name) => isElectron()
    ? electronStorage.loadEditorState(name)
    : idbStorage.load(name),
  openEditorWindow: () => {
    if (isElectron()) return window.electronAPI.openEditorWindow();
    window.location.hash = '#/editor';
    return Promise.resolve({ success: true });
  },
};
