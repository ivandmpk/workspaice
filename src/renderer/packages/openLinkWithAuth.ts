import platform from '@/platform'

async function openExternalLink(url: string) {
  if (platform.type === 'mobile') {
    try {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      await AppLauncher.openUrl({ url })
      return
    } catch (error) {
      console.warn('Failed to open link with AppLauncher, falling back to platform browser:', error)
    }
  }

  await platform.openLink(url)
}

export async function openLinkWithAuth(url: string): Promise<void> {
  await openExternalLink(url)
}
