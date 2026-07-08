import { beforeEach, describe, expect, it, vi } from 'vitest'

const getLocale = vi.hoisted(() => vi.fn())
vi.mock('electron', () => ({ app: { getLocale } }))

import Locale from './locales'

describe('main-process locale helper', () => {
  beforeEach(() => {
    getLocale.mockReset()
  })

  it('uses Chinese translations for Chinese locale variants', () => {
    getLocale.mockReturnValue('zh-TW')
    const locale = new Locale()
    expect(locale.isCN()).toBe(true)
    expect(locale.t('Exit')).toBe('退出')
  })

  it('uses English translations for other locales', () => {
    getLocale.mockReturnValue('bg-BG')
    const locale = new Locale()
    expect(locale.isCN()).toBe(false)
    expect(locale.t('Restart')).toBe('Restart')
  })

  it('falls back to English when Electron locale access fails', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    getLocale.mockImplementation(() => {
      throw new Error('app not ready')
    })

    const locale = new Locale()

    expect(locale.locale).toBe('en')
    expect(locale.t('Show/Hide')).toBe('Show/Hide')
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
