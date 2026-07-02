import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ shell: { openExternal: vi.fn() } }))
vi.mock('electron-log/main', () => ({ default: { info: vi.fn(), warn: vi.fn() } }))

import { shell } from 'electron'
import { openExternalSafe } from './open-external'

describe('openExternalSafe', () => {
  beforeEach(() => {
    vi.mocked(shell.openExternal).mockClear()
  })

  it.each(['https://github.com/ivandmpk/workspaice', 'http://localhost:11434/', 'mailto:someone@example.com'])(
    'opens allowlisted URL %s',
    async (url) => {
      await expect(openExternalSafe(url)).resolves.toBe(true)
      expect(shell.openExternal).toHaveBeenCalledWith(url)
    }
  )

  it.each([
    'file:///etc/passwd',
    'smb://attacker.example/share',
    'javascript:alert(1)',
    'itms-apps://itunes.apple.com/app/id0',
    'vscode://malicious/payload',
  ])('blocks non-allowlisted scheme %s without calling shell.openExternal', async (url) => {
    await expect(openExternalSafe(url)).resolves.toBe(false)
    expect(shell.openExternal).not.toHaveBeenCalled()
  })

  it('blocks strings that do not parse as URLs', async () => {
    await expect(openExternalSafe('not a url')).resolves.toBe(false)
    expect(shell.openExternal).not.toHaveBeenCalled()
  })

  it('treats scheme matching as case-insensitive per URL normalization', async () => {
    await expect(openExternalSafe('HTTPS://example.com')).resolves.toBe(true)
    expect(shell.openExternal).toHaveBeenCalledWith('HTTPS://example.com')
  })
})
