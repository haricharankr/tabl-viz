const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),

  // Listeners for menu actions
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (event, paths) => callback(paths)),
  onExportChart: (callback) => ipcRenderer.on('export-chart', () => callback()),
  onSaveWorkspace: (callback) => ipcRenderer.on('save-workspace', () => callback()),
  onLoadWorkspace: (callback) => ipcRenderer.on('load-workspace', () => callback()),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
