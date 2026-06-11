
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
  listSaves: () => ipcRenderer.invoke('list-saves')
});
