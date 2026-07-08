import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  settings: { autoLaunch: false },
  autoLaunch: {
    isEnabled: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
  },
  constructor: vi.fn(),
}))

vi.mock('auto-launch', () => ({
  default: class AutoLaunchMock {
    constructor(options: unknown) {
      mocks.constructor(options)
    }

    isEnabled() {
      return mocks.autoLaunch.isEnabled()
    }

    enable() {
      return mocks.autoLaunch.enable()
    }

    disable() {
      return mocks.autoLaunch.disable()
    }
  },
}))
vi.mock('./store-node', () => ({ getSettings: () => mocks.settings }))

import { ensure, get, sync } from './autoLauncher'

describe('auto launcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.settings.autoLaunch = false
  })

  it('creates one WorkspAIce launcher instance lazily', () => {
    expect(get()).toBe(get())
    expect(mocks.constructor).toHaveBeenCalledTimes(1)
    expect(mocks.constructor).toHaveBeenCalledWith({ name: 'WorkspAIce' })
  })

  it('enables startup when settings require it', async () => {
    mocks.settings.autoLaunch = true
    mocks.autoLaunch.isEnabled.mockResolvedValue(false)

    await sync()

    expect(mocks.autoLaunch.enable).toHaveBeenCalledOnce()
    expect(mocks.autoLaunch.disable).not.toHaveBeenCalled()
  })

  it('disables startup when settings no longer require it', async () => {
    mocks.settings.autoLaunch = false
    mocks.autoLaunch.isEnabled.mockResolvedValue(true)

    await sync()

    expect(mocks.autoLaunch.disable).toHaveBeenCalledOnce()
  })

  it('leaves matching state unchanged and supports explicit ensure calls', async () => {
    mocks.autoLaunch.isEnabled.mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    await sync()
    await ensure(true)
    await ensure(false)

    expect(mocks.autoLaunch.enable).toHaveBeenCalledOnce()
    expect(mocks.autoLaunch.disable).toHaveBeenCalledOnce()
  })
})
