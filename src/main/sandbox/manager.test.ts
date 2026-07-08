import { EventEmitter } from 'node:events'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  spawn: vi.fn(),
  initialize: vi.fn(),
  reset: vi.fn(),
  wrapWithSandbox: vi.fn(async (command: string) => `sandboxed:${command}`),
}))

vi.mock('node:child_process', () => ({ spawn: mocks.spawn }))
vi.mock('electron', () => ({ app: { isPackaged: false } }))
vi.mock('@anthropic-ai/sandbox-runtime', () => ({
  SandboxManager: {
    initialize: mocks.initialize,
    reset: mocks.reset,
    wrapWithSandbox: mocks.wrapWithSandbox,
  },
}))
vi.mock('../util', () => ({
  getLogger: () => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

import { checkAvailability, execCommand, getStatus, initSandbox, resetSandbox, writeFile } from './manager'

type FakeChild = EventEmitter & {
  stdout: EventEmitter
  stderr: EventEmitter
  stdin: EventEmitter & { end: ReturnType<typeof vi.fn> }
  pid: number
  killed: boolean
  kill: ReturnType<typeof vi.fn>
}

function childProcess(result: { stdout?: string; stderr?: string; exitCode?: number } = {}): FakeChild {
  const child = new EventEmitter() as FakeChild
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  child.stdin = Object.assign(new EventEmitter(), { end: vi.fn() })
  child.pid = 12345
  child.killed = false
  child.kill = vi.fn()

  queueMicrotask(() => {
    if (result.stdout) child.stdout.emit('data', Buffer.from(result.stdout))
    if (result.stderr) child.stderr.emit('data', Buffer.from(result.stderr))
    child.emit('close', result.exitCode ?? 0)
  })
  return child
}

describe('sandbox manager', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await resetSandbox()
    mocks.spawn.mockImplementation(() => childProcess())
  })

  afterEach(async () => {
    await resetSandbox()
  })

  it('rejects execution before initialization', async () => {
    await expect(execCommand('pwd')).rejects.toThrow('Sandbox not initialized')
    expect(mocks.spawn).not.toHaveBeenCalled()
  })

  it('initializes runtime policy for the requested working directory', async () => {
    mocks.initialize.mockResolvedValue(undefined)

    await expect(initSandbox('/tmp/workspaice-task')).resolves.toEqual({ success: true })

    expect(mocks.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        network: { deniedDomains: [] },
        filesystem: expect.objectContaining({ allowWrite: expect.arrayContaining(['/tmp/workspaice-task']) }),
      })
    )
    expect(getStatus()).toMatchObject({ state: 'initialized', workingDirectory: '/tmp/workspaice-task' })
  })

  it('wraps commands and resolves relative cwd inside the sandbox root', async () => {
    await initSandbox('/tmp/workspaice-task')
    mocks.spawn.mockImplementationOnce(() => childProcess({ stdout: 'done\n', stderr: 'warning\n', exitCode: 3 }))

    await expect(execCommand('echo done', { cwd: 'nested' })).resolves.toEqual({
      stdout: 'done\n',
      stderr: 'warning\n',
      exitCode: 3,
    })

    expect(mocks.wrapWithSandbox).toHaveBeenCalledWith('echo done')
    expect(mocks.spawn).toHaveBeenCalledWith(
      'sandboxed:echo done',
      expect.objectContaining({
        shell: true,
        cwd: path.resolve('/tmp/workspaice-task', 'nested'),
        detached: true,
      })
    )
  })

  it('rejects cwd traversal before spawning a child process', async () => {
    await initSandbox('/tmp/workspaice-task')

    await expect(execCommand('pwd', { cwd: '../outside' })).rejects.toThrow('cwd escapes sandbox working directory')
    expect(mocks.spawn).not.toHaveBeenCalled()
  })

  it('pipes untrusted file content through stdin and shell-escapes only the path', async () => {
    let child: FakeChild | undefined
    mocks.spawn.mockImplementationOnce(() => {
      child = childProcess()
      return child
    })
    await initSandbox('/tmp/workspaice-task')

    await expect(writeFile("notes'file.txt", 'content $(touch /tmp/injected)')).resolves.toEqual({ success: true })

    expect(mocks.wrapWithSandbox).toHaveBeenCalledWith("cat > 'notes'\\''file.txt'")
    expect(child?.stdin.end).toHaveBeenCalledWith('content $(touch /tmp/injected)')
    expect(mocks.spawn.mock.calls[0][0]).not.toContain('touch /tmp/injected')
    expect(mocks.spawn.mock.calls[0][1]).toMatchObject({ stdio: ['pipe', 'pipe', 'pipe'] })
  })

  it('reports availability on supported desktop platforms', async () => {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      await expect(checkAvailability()).resolves.toEqual({ available: true })
    }
  })
})
