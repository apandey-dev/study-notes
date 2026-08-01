const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  createFileDialog: (opts) => ipcRenderer.invoke('create-file-dialog', opts),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileContent: (data) => ipcRenderer.invoke('save-file-content', data),
  readFileContent: (data) => ipcRenderer.invoke('read-file-content', data),
  checkFileExists: (data) => ipcRenderer.invoke('check-file-exists', data),
  renameFile: (data) => ipcRenderer.invoke('rename-file', data),
  deleteFile: (data) => ipcRenderer.invoke('delete-file', data),
  duplicateFile: (data) => ipcRenderer.invoke('duplicate-file', data),
  getWorkspaceFiles: () => ipcRenderer.invoke('get-workspace-files'),
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  saveAppConfig: (data) => ipcRenderer.invoke('save-app-config', data),
  onOpenFileFromSystem: (callback) => ipcRenderer.on('open-file-from-system', (event, filePath) => callback(filePath)),
  isElectron: true
});
