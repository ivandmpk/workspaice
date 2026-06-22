export type HomeWelcomeCardMode = 'none' | 'login' | 'no-license' | 'expired-license'

export function getHomeWelcomeCardMode(_params?: {
  providerCount?: number
  isLoggedIn?: boolean
  hasLicense?: boolean
  hasExpiredLicense?: boolean
}): HomeWelcomeCardMode {
  return 'none'
}
