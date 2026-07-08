// SEC-1: main-authoritative approval ledger for MCP stdio server launches.
//
// The renderer is untrusted (webSecurity is off and rendered LLM/tool/web
// content can inject script), so any command/args/env it asks the main
// process to spawn is untrusted — as is anything it writes into settings.
// The only trust anchor is a native confirmation the injected JS cannot forge.
//
// Every stdio spawn is fingerprinted over its exact exec parameters
// (command + args + config-supplied env). A fingerprint that isn't already in
// the persisted ledger triggers a native "allow this command to run?" dialog;
// approving it records the fingerprint so the same server runs silently next
// time. Editing the command/args/env produces a new fingerprint and re-prompts.
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { app, type BrowserWindow, dialog } from 'electron'
import Locale from '../locales'
import { getLogger } from '../util'

const logger = getLogger('mcp:approval-ledger')

export type StdioSpawnParams = {
  command: string
  args?: string[]
  env?: Record<string, string>
}

type ApprovalRecord = {
  fingerprint: string
  name?: string
  command: string
  approvedAt: string
}

// The fingerprint intentionally covers only the renderer/config-controlled
// exec parameters. The shell env that `enhanceEnv` later merges in is derived
// by the main process (trusted) and can vary between runs, so it is excluded
// to avoid spurious re-prompts.
export function fingerprintStdioServer(params: StdioSpawnParams): string {
  const canonical = JSON.stringify({
    command: params.command,
    args: params.args ?? [],
    env: canonicalEnv(params.env),
  })
  return createHash('sha256').update(canonical).digest('hex')
}

function canonicalEnv(env?: Record<string, string>): Array<[string, string]> {
  if (!env) {
    return []
  }
  return Object.keys(env)
    .sort()
    .map((key) => [key, env[key]])
}

let ledgerPath: string | undefined
function getLedgerPath(): string {
  if (!ledgerPath) {
    ledgerPath = path.join(app.getPath('userData'), 'mcp-approved-servers.json')
  }
  return ledgerPath
}

let cache: Map<string, ApprovalRecord> | undefined
function load(): Map<string, ApprovalRecord> {
  if (cache) {
    return cache
  }
  cache = new Map()
  try {
    const data = JSON.parse(fs.readFileSync(getLedgerPath(), 'utf8'))
    if (Array.isArray(data?.approved)) {
      for (const record of data.approved) {
        if (record && typeof record.fingerprint === 'string') {
          cache.set(record.fingerprint, record)
        }
      }
    }
  } catch {
    // Missing or unreadable ledger → start empty. A corrupt file is treated as
    // "nothing approved yet", which fails safe (re-prompts) rather than open.
  }
  return cache
}

function persist(): void {
  try {
    fs.writeFileSync(getLedgerPath(), `${JSON.stringify({ approved: Array.from(load().values()) }, null, 2)}\n`)
  } catch (err) {
    logger.error('failed to persist approval ledger', err)
  }
}

export function isStdioServerApproved(params: StdioSpawnParams): boolean {
  return load().has(fingerprintStdioServer(params))
}

export function recordStdioServerApproval(params: StdioSpawnParams, meta?: { name?: string }): void {
  const fingerprint = fingerprintStdioServer(params)
  load().set(fingerprint, {
    fingerprint,
    name: meta?.name,
    command: params.command,
    approvedAt: new Date().toISOString(),
  })
  persist()
}

// Returns true if the server may spawn: either already approved, or the user
// approves the native confirmation now. Declining returns false and records
// nothing.
export async function ensureStdioServerApproved(
  params: StdioSpawnParams,
  meta: { name?: string } | undefined,
  parentWindow: BrowserWindow | null
): Promise<boolean> {
  if (isStdioServerApproved(params)) {
    return true
  }

  const locale = new Locale()
  const argsStr = (params.args ?? []).join(' ')
  const detail = [meta?.name, `${params.command}${argsStr ? ` ${argsStr}` : ''}`].filter(Boolean).join('\n\n')
  const options: Electron.MessageBoxOptions = {
    type: 'warning',
    buttons: [locale.t('MCP_Allow'), locale.t('MCP_Cancel')],
    defaultId: 1,
    cancelId: 1,
    noLink: true,
    title: locale.t('MCP_Run_Title'),
    message: locale.t('MCP_Run_Message'),
    detail,
  }
  const result = parentWindow
    ? await dialog.showMessageBox(parentWindow, options)
    : await dialog.showMessageBox(options)

  const approved = result.response === 0
  if (approved) {
    recordStdioServerApproval(params, meta)
  } else {
    logger.warn('user declined MCP server launch', params.command)
  }
  return approved
}

// Test hook: drop the in-memory cache and resolved path so a fresh ledger file
// (e.g. a mocked userData dir) is re-read on the next access.
export function resetApprovalLedgerCache(): void {
  cache = undefined
  ledgerPath = undefined
}
