import { contextBridge, ipcRenderer } from 'electron'

const api = {
  closeWindow: (): void => ipcRenderer.send('window:close'),
  minimizeWindow: (): void => ipcRenderer.send('window:minimize'),
  togglePin: (): Promise<boolean> => ipcRenderer.invoke('window:toggle-pin'),
  hasApiKey: (): Promise<boolean> => ipcRenderer.invoke('settings:has-key'),
  setApiKey: (key: string): Promise<void> => ipcRenderer.invoke('settings:set-key', key),
  translate: (text: string, language: string): Promise<string> =>
    ipcRenderer.invoke('translate', text, language)
}

export type Api = typeof api

// contextIsolation is enabled, so expose only this narrow API (no raw ipcRenderer)
contextBridge.exposeInMainWorld('api', api)
