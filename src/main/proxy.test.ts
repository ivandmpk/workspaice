import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  setProxy: vi.fn(),
  settings: { proxy: '' },
}))

vi.mock('electron', () => ({ session: { defaultSession: { setProxy: mocks.setProxy } } }))
vi.mock('./store-node', () => ({ getSettings: () => mocks.settings }))

import { ensure, init } from './proxy'

describe('proxy configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.settings.proxy = ''
  })

  it('applies and clears explicit proxy rules', () => {
    ensure('socks5://127.0.0.1:6153')
    ensure()

    expect(mocks.setProxy).toHaveBeenNthCalledWith(1, { proxyRules: 'socks5://127.0.0.1:6153' })
    expect(mocks.setProxy).toHaveBeenNthCalledWith(2, {})
  })

  it('initializes only configured proxies', () => {
    init()
    expect(mocks.setProxy).not.toHaveBeenCalled()

    mocks.settings.proxy = 'http://proxy.test:8080'
    init()
    expect(mocks.setProxy).toHaveBeenCalledWith({ proxyRules: 'http://proxy.test:8080' })
  })
})
