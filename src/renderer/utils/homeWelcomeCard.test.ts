import { describe, expect, it } from 'vitest'

import { getHomeWelcomeCardMode } from './homeWelcomeCard'

describe('getHomeWelcomeCardMode', () => {
  it('always returns "none" after hosted welcome cards were removed', () => {
    expect(getHomeWelcomeCardMode({ providerCount: 1, isLoggedIn: false })).toBe('none')
    expect(getHomeWelcomeCardMode({ providerCount: 0, isLoggedIn: true })).toBe('none')
    expect(getHomeWelcomeCardMode({ providerCount: 0, isLoggedIn: false })).toBe('none')
  })
})
