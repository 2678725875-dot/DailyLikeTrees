/** Electron preload script.
 *
 * Exposes `window.electronAPI` to the renderer via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Window controls ──
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  onMaximizeChange: (cb) => {
    const handler = (_event, isMax) => cb(isMax)
    ipcRenderer.on('window:maximizeChange', handler)
    return () => ipcRenderer.removeListener('window:maximizeChange', handler)
  },

  // ── Floating window ──
  openFloating: (opts) => ipcRenderer.invoke('floating:open', opts),
  closeFloating: () => ipcRenderer.send('floating:close'),
  resizeFloating: (width, height) => ipcRenderer.invoke('floating:resize', { width, height }),

  // ── FB event relay ──
  sendEvent: (name, payload) => ipcRenderer.send('fb:event', { name, payload: payload || {} }),
  onEvent: (cb) => {
    const handler = (_event, { name, payload }) => cb(name, payload)
    ipcRenderer.on('fb:event', handler)
    return () => ipcRenderer.removeListener('fb:event', handler)
  },
})
