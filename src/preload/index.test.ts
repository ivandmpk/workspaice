import { beforeEach, describe, expect, it, vi } from 'vitest'

const electronMocks = vi.hoisted(() => ({
  exposeInMainWorld: vi.fn(),
  invoke: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  removeListener: vi.fn(),
  getPathForFile: vi.fn(),
}))

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: electronMocks.exposeInMainWorld,
  },
  ipcRenderer: {
    invoke: electronMocks.invoke,
    on: electronMocks.on,
    off: electronMocks.off,
    removeListener: electronMocks.removeListener,
  },
  webUtils: {
    getPathForFile: electronMocks.getPathForFile,
  },
}))

await import('./index')

type ExposedApi = {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  getPathForFile: (file: File) => string
  onNavigate: (callback: (path: string) => void) => () => void
  onWindowShow: (callback: () => void) => () => void
}

function exposedApi(): ExposedApi {
  const call = electronMocks.exposeInMainWorld.mock.calls.find(([name]) => name === 'electronAPI')
  if (!call) throw new Error('electronAPI was not exposed')
  return call[1] as ExposedApi
}

describe('preload IPC bridge', () => {
  beforeEach(() => {
    electronMocks.invoke.mockReset()
    electronMocks.on.mockReset()
    electronMocks.off.mockReset()
    electronMocks.removeListener.mockReset()
    electronMocks.getPathForFile.mockReset()
  })

  it('exposes the bridge under the expected global name', () => {
    expect(electronMocks.exposeInMainWorld).toHaveBeenCalledWith('electronAPI', expect.any(Object))
  })

  it('forwards allowlisted invoke channels and arguments', async () => {
    electronMocks.invoke.mockResolvedValueOnce('1.0.2-beta')

    await expect(exposedApi().invoke('getVersion', 'argument')).resolves.toBe('1.0.2-beta')
    expect(electronMocks.invoke).toHaveBeenCalledWith('getVersion', 'argument')
  })

  it('rejects channels outside the allowlist without reaching Electron', async () => {
    await expect(exposedApi().invoke('shell:execute', 'rm -rf /')).rejects.toThrow(
      'Blocked IPC invoke to disallowed channel: shell:execute'
    )
    expect(electronMocks.invoke).not.toHaveBeenCalled()
  })

  it('uses webUtils instead of trusting a renderer-supplied path', () => {
    const file = new File(['content'], 'notes.txt')
    electronMocks.getPathForFile.mockReturnValueOnce('/safe/notes.txt')

    expect(exposedApi().getPathForFile(file)).toBe('/safe/notes.txt')
    expect(electronMocks.getPathForFile).toHaveBeenCalledWith(file)
  })

  it('strips the Electron event from navigation callbacks and removes the exact listener', () => {
    const callback = vi.fn()
    const dispose = exposedApi().onNavigate(callback)
    const listener = electronMocks.on.mock.calls.find(([channel]) => channel === 'navigate-to')?.[1]

    expect(listener).toBeTypeOf('function')
    listener?.({ sender: 'untrusted' }, '/settings')
    expect(callback).toHaveBeenCalledWith('/settings')

    dispose()
    expect(electronMocks.off).toHaveBeenCalledWith('navigate-to', listener)
  })

  it('registers and disposes window event callbacks', () => {
    const callback = vi.fn()
    const dispose = exposedApi().onWindowShow(callback)

    expect(electronMocks.on).toHaveBeenCalledWith('window-show', callback)
    dispose()
    expect(electronMocks.off).toHaveBeenCalledWith('window-show', callback)
  })
})
