export type HomeWelcomeCardMode = 'none'

export function getHomeWelcomeCardMode(_params?: {
  providerCount?: number
  isLoggedIn?: boolean
}): HomeWelcomeCardMode {
  return 'none'
}
