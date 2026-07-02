import { shell } from 'electron'
import log from 'electron-log/main'

// The only allowed schemes for URLs leaving the app. Anything else
// (file:, smb:, javascript:, custom protocol handlers of other apps)
// is a lateral-movement primitive for a compromised renderer and is
// dropped. All external URL opening must go through this helper —
// shell.openExternal must have no other call site (FABLE_REVIEW SEC-4).
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

export async function openExternalSafe(url: string): Promise<boolean> {
  let protocol: string
  try {
    protocol = new URL(url).protocol
  } catch {
    log.warn(`[openExternal] blocked unparseable URL: ${url}`)
    return false
  }
  if (!ALLOWED_PROTOCOLS.has(protocol)) {
    log.warn(`[openExternal] blocked non-allowlisted URL scheme "${protocol}": ${url}`)
    return false
  }
  await shell.openExternal(url)
  return true
}
