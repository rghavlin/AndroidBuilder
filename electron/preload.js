
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,

  saveGame: (slotName, data) => ipcRenderer.invoke('save-game', slotName, data),
  loadGame: (slotName) => ipcRenderer.invoke('load-game', slotName),
  deleteGame: (slotName) => ipcRenderer.invoke('delete-game', slotName),
  deleteSave: (slotName) => ipcRenderer.invoke('delete-game', slotName),
  listSaves: () => ipcRenderer.invoke('list-saves'),

  // Scenario / Map Editor
  saveScenario: (name, data) => ipcRenderer.invoke('save-scenario', name, data),
  saveScenarioEditor: (name, data) => ipcRenderer.invoke('save-scenario-editor', name, data),
  listScenarios: () => ipcRenderer.invoke('list-scenarios'),
  loadScenario: (fileName) => ipcRenderer.invoke('load-scenario', fileName),
  loadScenarioEditor: (name) => ipcRenderer.invoke('load-scenario-editor', name),
  deleteScenario: (fileName) => ipcRenderer.invoke('delete-scenario', fileName),
  openEditorWindow: () => ipcRenderer.invoke('open-editor-window'),
  openGameWindow: () => ipcRenderer.invoke('open-game-window'),

  // Map editor: full entity-art catalog for the NPC icon picker.
  listEntityImages: () => ipcRenderer.invoke('list-entity-images')
});
