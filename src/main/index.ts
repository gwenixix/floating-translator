import { app, shell, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Anthropic from '@anthropic-ai/sdk'
import { getApiKey, hasApiKey, setApiKey } from './apiKey'

let mainWindow: BrowserWindow | null = null

const LANGUAGES = ['English', 'German', 'Spanish', 'French']

async function translate(text: string, language: string): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey)
    throw new Error('No API key set. Open settings (gear icon) and add your Anthropic API key.')
  if (!LANGUAGES.includes(language)) throw new Error('Unsupported language')
  const client = new Anthropic({ apiKey })
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Translate the following text to ${language}. Return ONLY the translation, no explanations.\n\n${text}`
      }
    ]
  })
  return res.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim()
}

function toggleWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide()
  } else {
    mainWindow.center()
    mainWindow.show()
    mainWindow.focus()
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 380,
    height: 380,
    minWidth: 300,
    minHeight: 300,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  mainWindow = win

  // Keep above fullscreen apps and across workspaces
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  win.on('ready-to-show', () => win.show())
  win.on('closed', () => (mainWindow = null))

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.floatingtranslator.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('window:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close())
  ipcMain.on('window:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.handle('window:toggle-pin', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return true
    const next = !win.isAlwaysOnTop()
    win.setAlwaysOnTop(next, 'screen-saver')
    return next
  })
  ipcMain.handle('translate', (_e, text: string, language: string) =>
    translate(String(text), String(language))
  )

  ipcMain.handle('settings:has-key', () => hasApiKey())
  ipcMain.handle('settings:set-key', (_e, key: string) => setApiKey(String(key)))

  createWindow()

  if (!globalShortcut.register('CommandOrControl+Shift+T', toggleWindow)) {
    console.warn('Could not register global shortcut Ctrl+Shift+T')
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => globalShortcut.unregisterAll())

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
