// Build-time environment variables injected by electron-vite's `define` config.
// Vite replaces `process.env.WORKSPAICE_BUILD_*` at compile time.

export const WORKSPAICE_BUILD_TARGET = (process.env.WORKSPAICE_BUILD_TARGET || 'unknown') as 'unknown' | 'mobile_app'
export const WORKSPAICE_BUILD_PLATFORM = (process.env.WORKSPAICE_BUILD_PLATFORM || 'unknown') as
  | 'unknown'
  | 'ios'
  | 'android'
  | 'web'

export const WORKSPAICE_BUILD_CHANNEL = (process.env.WORKSPAICE_BUILD_CHANNEL || 'unknown') as 'unknown' | 'google_play'

export const USE_LOCAL_API = process.env.USE_LOCAL_API || ''

export const NODE_ENV = process.env.NODE_ENV || 'development'
