import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { INVOKABLE_IPC_CHANNELS, isInvokableIpcChannel } from './ipc-channels'
import { OAuthIpcChannels } from './oauth'

const MAIN_ROOT = path.resolve(process.cwd(), 'src/main')

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(entryPath)
    return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [entryPath] : []
  })
}

function registeredInvokeChannels(): string[] {
  const literalChannels = sourceFiles(MAIN_ROOT).flatMap((file) => {
    const source = fs.readFileSync(file, 'utf8')
    return [...source.matchAll(/ipcMain\.handle\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
  })

  return [...new Set([...literalChannels, ...Object.values(OAuthIpcChannels)])].sort()
}

describe('IPC invoke allowlist', () => {
  it('contains no duplicates', () => {
    expect(new Set(INVOKABLE_IPC_CHANNELS).size).toBe(INVOKABLE_IPC_CHANNELS.length)
  })

  it('matches every main-process ipcMain.handle registration exactly', () => {
    expect([...INVOKABLE_IPC_CHANNELS].sort()).toEqual(registeredInvokeChannels())
  })

  it('rejects non-string and unknown channel names', () => {
    expect(isInvokableIpcChannel('getVersion')).toBe(true)
    expect(isInvokableIpcChannel('getVersion ')).toBe(false)
    expect(isInvokableIpcChannel('shell:execute')).toBe(false)
    expect(isInvokableIpcChannel(null)).toBe(false)
  })
})
