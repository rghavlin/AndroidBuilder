
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,
  
  // Add any specific APIs your game needs here
  // For example:
  // saveGameData: (data) => ipcRenderer.invoke('save-game-data', data),
  // loadGameData: () => ipcRenderer.invoke('load-game-data'),
});
