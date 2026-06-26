import platform from '@/platform'

export const featureFlags = {
  mcp: platform.type === 'desktop',
  knowledgeBase: platform.type === 'desktop',
  skills: platform.type === 'desktop',
  taskMode: false,
}
