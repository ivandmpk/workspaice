// 在 webpack.config.base.ts 的 webpack.EnvironmentPlugin 中注册的变量，
// 在编译时 webpack 会根据环境变量替换掉 process.env.XXX

export const WORKSPAICE_BUILD_TARGET = (process.env.WORKSPAICE_BUILD_TARGET || 'unknown') as 'unknown' | 'mobile_app'
export const WORKSPAICE_BUILD_PLATFORM = (process.env.WORKSPAICE_BUILD_PLATFORM || 'unknown') as
  | 'unknown'
  | 'ios'
  | 'android'
  | 'web'

export const WORKSPAICE_BUILD_CHANNEL = (process.env.WORKSPAICE_BUILD_CHANNEL || 'unknown') as 'unknown' | 'google_play'

// api.workspaiceai.app
export const USE_LOCAL_API = process.env.USE_LOCAL_API || ''
export const USE_BETA_API = process.env.USE_BETA_API || ''
export const USE_NEWDB_API = process.env.USE_NEWDB_API || ''

// workspaiceai.app
export const USE_LOCAL_WORKSPAICE = process.env.USE_LOCAL_WORKSPAICE || ''
export const USE_BETA_WORKSPAICE = process.env.USE_BETA_WORKSPAICE || ''

export const NODE_ENV = process.env.NODE_ENV || 'development'
