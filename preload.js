const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  scanFolder: () => ipcRenderer.invoke('scan-folder'),
  getFiles: () => ipcRenderer.invoke('get-files'),
  updateFile: (id, data) => ipcRenderer.invoke('update-file', id, data),
  openLocation: (path) => ipcRenderer.invoke('open-location', path)
})
