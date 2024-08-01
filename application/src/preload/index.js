import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (filePath, content) => ipcRenderer.invoke('dialog:saveFile', filePath, content),
  newFile: () => ipcRenderer.send('file:new'),
  readFile: (filepath) => ipcRenderer.invoke('file:read', filepath),
  
  // Folder operations
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  
  // Event listeners
  onFileOpened: (callback) => ipcRenderer.on('file:opened', (event, ...args) => callback(...args)),
  onFileSaved: (callback) => ipcRenderer.on('file:saved', (event, ...args) => callback(...args)),
  onNewFile: (callback) => ipcRenderer.on('file:new', (event, ...args) => callback(...args)),
  onFolderOpened: (callback) => ipcRenderer.on('folder:opened', (event, ...args) => callback(...args)),
  
  // Remove event listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}