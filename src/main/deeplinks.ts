import type { BrowserWindow } from 'electron'
import log from 'electron-log/main'

export function handleDeepLink(mainWindow: BrowserWindow, link: string) {
  const normalizedLink = link.replace(/^workspaice-dev:\/\//, 'workspaice://')
  const url = new URL(normalizedLink)

  log.info('🔗 Parsed URL:', { hostname: url.hostname, pathname: url.pathname, params: url.searchParams.toString() })

  // handle `workspaice://mcp/install?server=`
  if (url.hostname === 'mcp' && url.pathname === '/install') {
    const encodedConfig = url.searchParams.get('server') || ''
    mainWindow.webContents.send('navigate-to', `/settings/mcp?install=${encodeURIComponent(encodedConfig)}`)
  }

  // handle `workspaice://provider/import?config=`
  if (url.hostname === 'provider' && url.pathname === '/import') {
    const encodedConfig = url.searchParams.get('config') || ''
    mainWindow.webContents.send('navigate-to', `/settings/provider?import=${encodeURIComponent(encodedConfig)}`)
  }

}
