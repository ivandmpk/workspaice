import { describe, expect, it, vi } from 'vitest'

vi.mock('electron-log/main', () => ({ default: { info: vi.fn() } }))

import { handleDeepLink } from './deeplinks'

function mainWindow() {
  return { webContents: { send: vi.fn() } }
}

describe('handleDeepLink', () => {
  it('routes MCP install links and safely re-encodes their payload', () => {
    const window = mainWindow()

    handleDeepLink(window as never, 'workspaice://mcp/install?server=hello%20world%26more')

    expect(window.webContents.send).toHaveBeenCalledWith('navigate-to', '/settings/mcp?install=hello%20world%26more')
  })

  it('normalizes development links and routes provider imports', () => {
    const window = mainWindow()

    handleDeepLink(window as never, 'workspaice-dev://provider/import?config=eyJhIjoxfQ%3D%3D')

    expect(window.webContents.send).toHaveBeenCalledWith('navigate-to', '/settings/provider?import=eyJhIjoxfQ%3D%3D')
  })

  it('ignores valid but unsupported deep links', () => {
    const window = mainWindow()
    handleDeepLink(window as never, 'workspaice://unknown/action')
    expect(window.webContents.send).not.toHaveBeenCalled()
  })

  it('rejects malformed URLs instead of navigating', () => {
    const window = mainWindow()
    expect(() => handleDeepLink(window as never, 'not a url')).toThrow()
    expect(window.webContents.send).not.toHaveBeenCalled()
  })
})
