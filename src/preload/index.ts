// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { ElectronIPC } from 'src/shared/electron-types'
import { isInvokableIpcChannel } from 'src/shared/ipc-channels'

// export type Channels = 'ipc-example';

// Security boundary: only forward invoke() calls for channels that are on the
// explicit allowlist. This prevents a compromised renderer from reaching
// arbitrary ipcMain.handle channels (store I/O, shell exec, OAuth, etc.) by name.
function invokeAllowed(channel: string, ...args: unknown[]): Promise<unknown> {
  if (!isInvokableIpcChannel(channel)) {
    return Promise.reject(new Error(`Blocked IPC invoke to disallowed channel: ${String(channel)}`))
  }
  return ipcRenderer.invoke(channel, ...args)
}

function createListener<T extends unknown[]>(channel: string) {
  return (callback: (...args: T) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: T) => callback(...args)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  }
}

const electronHandler: ElectronIPC = {
  invoke: invokeAllowed,
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  onSystemThemeChange: (callback: () => void) => {
    ipcRenderer.on('system-theme-updated', callback)
    return () => ipcRenderer.off('system-theme-updated', callback)
  },
  onWindowMaximizedChanged: (callback: (_: Electron.IpcRendererEvent, windowMaximized: boolean) => void) => {
    ipcRenderer.on('window:maximized-changed', callback)
    return () => ipcRenderer.off('window:maximized-changed', callback)
  },
  onWindowFocused: (callback: (_: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.on('window:focused', callback)
    return () => ipcRenderer.off('window:focused', callback)
  },
  onWindowShow: (callback: () => void) => {
    ipcRenderer.on('window-show', callback)
    return () => ipcRenderer.off('window-show', callback)
  },
  addMcpStdioTransportEventListener: (transportId: string, event: string, callback?: (...args: any[]) => void) => {
    ipcRenderer.on(`mcp:stdio-transport:${transportId}:${event}`, (_event, ...args) => {
      callback?.(...args)
    })
  },
  onNavigate: (callback: (path: string) => void) => {
    const listener = (_event: unknown, path: string) => {
      callback(path)
    }
    ipcRenderer.on('navigate-to', listener)
    return () => ipcRenderer.off('navigate-to', listener)
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronHandler)
