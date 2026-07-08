import type { Message, Session, SessionSettings } from '@shared/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getSessionSettings: vi.fn(),
  createModelDependencies: vi.fn(),
  createModel: vi.fn(),
  buildContext: vi.fn(),
  convertToModelMessages: vi.fn(),
  injectModelSystemPrompt: vi.fn(),
  loadSkill: vi.fn(),
  applyLegacyToolFallback: vi.fn(),
  buildToolsForSession: vi.fn(),
  persistStreamingMessage: vi.fn(),
  updateStreamingCache: vi.fn(),
  processStreamChunk: vi.fn(),
  initializeTargetMessage: vi.fn(),
  findTargetMessageIndex: vi.fn(),
  handleGenerationError: vi.fn(),
  setBlob: vi.fn(),
}))

vi.mock('@shared/context', () => ({ buildContext: mocks.buildContext }))
vi.mock('@/adapters', () => ({
  createModel: mocks.createModel,
  createModelDependencies: mocks.createModelDependencies,
}))
vi.mock('@/packages/model-calls/message-utils', () => ({
  convertToModelMessages: mocks.convertToModelMessages,
  injectModelSystemPrompt: mocks.injectModelSystemPrompt,
}))
vi.mock('@/packages/skills/controller', () => ({
  skillsController: { loadSkill: mocks.loadSkill },
}))
vi.mock('@/packages/token', () => ({ estimateTokensFromMessages: vi.fn(() => 17) }))
vi.mock('@/platform', () => ({
  default: {
    type: 'test',
    getConfig: vi.fn(async () => ({})),
  },
}))
vi.mock('@/storage', () => ({ default: { setBlob: mocks.setBlob } }))
vi.mock('@/utils/feature-flags', () => ({ featureFlags: { skills: true } }))
vi.mock('../chatStore', () => ({
  getSession: mocks.getSession,
  getSessionSettings: mocks.getSessionSettings,
}))
vi.mock('../settingsStore', () => ({
  settingsStore: { getState: () => ({ getSettings: () => ({ language: 'en' }) }) },
}))
vi.mock('../uiStore', () => ({
  uiStore: { getState: () => ({ sessionKnowledgeBaseMap: {} }) },
}))
vi.mock('./attachment-resolver', () => ({ createAttachmentResolver: vi.fn(() => ({ resolve: vi.fn() })) }))
vi.mock('./legacy-tool-fallback', () => ({ applyLegacyToolFallback: mocks.applyLegacyToolFallback }))
vi.mock('./messages', () => ({
  persistStreamingMessage: mocks.persistStreamingMessage,
  updateStreamingCache: mocks.updateStreamingCache,
}))
vi.mock('./ocr-helper', () => ({ getOCRModel: vi.fn(), ocrImagesInMessages: vi.fn() }))
vi.mock('./stream-chunk-processor', () => ({
  createInitialState: vi.fn(() => ({ contentParts: [], finishReason: undefined, usage: undefined })),
  processStreamChunk: mocks.processStreamChunk,
}))
vi.mock('./tools-builder', () => ({ buildToolsForSession: mocks.buildToolsForSession }))
vi.mock('./utils', () => ({
  findTargetMessageIndex: mocks.findTargetMessageIndex,
  getSessionWebBrowsing: vi.fn(() => false),
  handleGenerationError: mocks.handleGenerationError,
  initializeTargetMessage: mocks.initializeTargetMessage,
}))

import { orchestrateGeneration } from './orchestration'

const userMessage: Message = {
  id: 'user-1',
  role: 'user',
  timestamp: 1,
  contentParts: [{ type: 'text', text: '/review check this' }],
  invokedSkills: [{ name: 'review', args: 'check this' }],
}
const targetMessage: Message = {
  id: 'assistant-1',
  role: 'assistant',
  timestamp: 2,
  generating: true,
  contentParts: [],
}
const session: Session = {
  id: 'session-1',
  name: 'Test session',
  messages: [userMessage, targetMessage],
}
const settings: SessionSettings = {
  provider: 'openai',
  modelId: 'gpt-test',
}

function mockModel(stream: () => AsyncGenerator<unknown>) {
  return {
    modelId: 'gpt-test',
    isSupportToolUse: vi.fn(() => true),
    isSupportVision: vi.fn(() => true),
    isSupportSystemMessage: vi.fn(() => true),
    chatStream: vi.fn(stream),
  }
}

describe('orchestrateGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockResolvedValue(session)
    mocks.getSessionSettings.mockResolvedValue(settings)
    mocks.createModelDependencies.mockResolvedValue({})
    mocks.initializeTargetMessage.mockResolvedValue({ ...targetMessage })
    mocks.findTargetMessageIndex.mockReturnValue({ messages: session.messages, index: 1 })
    mocks.buildContext.mockImplementation(async (messages: Message[]) => messages)
    mocks.applyLegacyToolFallback.mockImplementation(async ({ promptMsgs }) => ({
      promptMsgs,
      fallbackToolCallPart: undefined,
    }))
    mocks.buildToolsForSession.mockResolvedValue({ tools: {}, instructions: 'base instructions' })
    mocks.loadSkill.mockResolvedValue({ body: '# Review\nInspect correctness.' })
    mocks.injectModelSystemPrompt.mockImplementation((_modelId, messages) => messages)
    mocks.convertToModelMessages.mockResolvedValue([{ role: 'user', content: 'prompt' }])
    mocks.persistStreamingMessage.mockResolvedValue(undefined)
    mocks.processStreamChunk.mockResolvedValue({
      state: {
        contentParts: [{ type: 'text', text: 'Done' }],
        finishReason: 'stop',
        usage: { inputTokens: 2, outputTokens: 1, totalTokens: 3 },
      },
      skipUpdate: false,
    })
    mocks.handleGenerationError.mockImplementation((_error, message) => ({
      ...message,
      generating: false,
      error: 'generation failed',
    }))
  })

  it('streams, injects invoked skill instructions, and persists the final message', async () => {
    mocks.createModel.mockResolvedValue(
      mockModel(async function* () {
        await Promise.resolve()
        yield { type: 'text-delta', text: 'Done' }
      })
    )

    await orchestrateGeneration(session.id, targetMessage, { operationType: 'send_message' })

    expect(mocks.loadSkill).toHaveBeenCalledWith('review')
    expect(mocks.injectModelSystemPrompt).toHaveBeenCalledWith(
      'gpt-test',
      [userMessage],
      expect.stringContaining('<skill name="review">'),
      'system'
    )
    expect(mocks.injectModelSystemPrompt.mock.calls[0][2]).toContain('User input: check this')
    expect(mocks.persistStreamingMessage).toHaveBeenLastCalledWith(
      session.id,
      expect.objectContaining({
        id: targetMessage.id,
        generating: false,
        cancel: undefined,
        contentParts: [{ type: 'text', text: 'Done' }],
        tokensUsed: 17,
        finishReason: 'stop',
      }),
      { refreshCounting: true }
    )
  })

  it('finalizes a cancelled stream without converting cancellation into an error', async () => {
    mocks.createModel.mockResolvedValue(
      mockModel(async function* () {
        await Promise.resolve()
        yield { type: 'text-delta', text: 'Partial' }
        const cached = mocks.updateStreamingCache.mock.calls.at(-1)?.[1] as Message | undefined
        cached?.cancel?.()
        throw new Error('aborted')
      })
    )

    await orchestrateGeneration(session.id, targetMessage)

    expect(mocks.handleGenerationError).not.toHaveBeenCalled()
    expect(mocks.persistStreamingMessage).toHaveBeenLastCalledWith(
      session.id,
      expect.objectContaining({ generating: false, cancel: undefined, status: [] }),
      { refreshCounting: true }
    )
  })

  it('maps provider failures and persists the error state', async () => {
    const providerError = new Error('provider offline')
    mocks.createModel.mockRejectedValue(providerError)

    await orchestrateGeneration(session.id, targetMessage)

    expect(mocks.handleGenerationError).toHaveBeenCalledWith(providerError, expect.any(Object), settings)
    expect(mocks.persistStreamingMessage).toHaveBeenLastCalledWith(
      session.id,
      expect.objectContaining({ generating: false, error: 'generation failed' }),
      { refreshCounting: true }
    )
  })

  it('returns without side effects when the session or settings no longer exists', async () => {
    mocks.getSession.mockResolvedValue(undefined)

    await orchestrateGeneration(session.id, targetMessage)

    expect(mocks.createModelDependencies).not.toHaveBeenCalled()
    expect(mocks.persistStreamingMessage).not.toHaveBeenCalled()
  })
})
