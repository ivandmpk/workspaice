import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-ledger-'))
const showMessageBox = vi.fn()

vi.mock('electron', () => ({
  app: { getPath: () => tmpDir },
  dialog: {
    showMessageBox: (...args: unknown[]) => showMessageBox(...args),
  },
  BrowserWindow: {},
}))
vi.mock('electron-log/main', () => ({
  default: {
    create: () => ({
      transports: { console: {}, file: {} },
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}))

import {
  ensureStdioServerApproved,
  fingerprintStdioServer,
  isStdioServerApproved,
  recordStdioServerApproval,
  resetApprovalLedgerCache,
} from './approval-ledger'

const ledgerFile = path.join(tmpDir, 'mcp-approved-servers.json')

beforeEach(() => {
  showMessageBox.mockReset()
  fs.rmSync(ledgerFile, { force: true })
  resetApprovalLedgerCache()
})

describe('fingerprintStdioServer', () => {
  it('is stable for identical params', () => {
    const params = { command: 'npx', args: ['-y', 'server'], env: { A: '1' } }
    expect(fingerprintStdioServer(params)).toBe(fingerprintStdioServer({ ...params }))
  })

  it('is independent of env key order', () => {
    const a = fingerprintStdioServer({ command: 'npx', args: [], env: { A: '1', B: '2' } })
    const b = fingerprintStdioServer({ command: 'npx', args: [], env: { B: '2', A: '1' } })
    expect(a).toBe(b)
  })

  it('changes when command, args, or env change', () => {
    const base = fingerprintStdioServer({ command: 'npx', args: ['x'], env: { A: '1' } })
    expect(fingerprintStdioServer({ command: 'node', args: ['x'], env: { A: '1' } })).not.toBe(base)
    expect(fingerprintStdioServer({ command: 'npx', args: ['y'], env: { A: '1' } })).not.toBe(base)
    expect(fingerprintStdioServer({ command: 'npx', args: ['x'], env: { A: '2' } })).not.toBe(base)
  })

  it('treats missing args/env like empty', () => {
    expect(fingerprintStdioServer({ command: 'npx' })).toBe(
      fingerprintStdioServer({ command: 'npx', args: [], env: {} })
    )
  })
})

describe('approval ledger', () => {
  const params = { command: 'npx', args: ['-y', 'evil-server'], env: {} }

  it('is not approved until recorded', () => {
    expect(isStdioServerApproved(params)).toBe(false)
    recordStdioServerApproval(params, { name: 'Test' })
    expect(isStdioServerApproved(params)).toBe(true)
  })

  it('persists approvals across a cache reset (reads from disk)', () => {
    recordStdioServerApproval(params)
    resetApprovalLedgerCache()
    expect(isStdioServerApproved(params)).toBe(true)
  })

  it('prompts once and remembers the approval', async () => {
    showMessageBox.mockResolvedValue({ response: 0 })
    expect(await ensureStdioServerApproved(params, { name: 'Test' }, null)).toBe(true)
    expect(showMessageBox).toHaveBeenCalledTimes(1)
    // Second launch of the same fingerprint must not prompt again.
    expect(await ensureStdioServerApproved(params, { name: 'Test' }, null)).toBe(true)
    expect(showMessageBox).toHaveBeenCalledTimes(1)
  })

  it('blocks and records nothing when the user declines', async () => {
    showMessageBox.mockResolvedValue({ response: 1 })
    expect(await ensureStdioServerApproved(params, undefined, null)).toBe(false)
    expect(isStdioServerApproved(params)).toBe(false)
  })

  it('single-arg dialog form is used when there is no parent window', async () => {
    showMessageBox.mockResolvedValue({ response: 0 })
    await ensureStdioServerApproved(params, undefined, null)
    expect(showMessageBox).toHaveBeenCalledTimes(1)
    expect(showMessageBox.mock.calls[0]).toHaveLength(1)
  })
})
