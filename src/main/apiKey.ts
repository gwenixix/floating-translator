import { app, safeStorage } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'

// The key is encrypted with the OS keychain (DPAPI on Windows) and never sent to the renderer.
const keyFile = (): string => join(app.getPath('userData'), 'api-key.bin')

export function getApiKey(): string | undefined {
  try {
    if (existsSync(keyFile()) && safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(readFileSync(keyFile()))
    }
  } catch {
    // unreadable or corrupt: fall through to env
  }
  return process.env.ANTHROPIC_API_KEY || undefined
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

export function setApiKey(key: string): void {
  const trimmed = key.trim()
  if (!trimmed) {
    if (existsSync(keyFile())) unlinkSync(keyFile())
    return
  }
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure storage is not available')
  writeFileSync(keyFile(), safeStorage.encryptString(trimmed))
}
