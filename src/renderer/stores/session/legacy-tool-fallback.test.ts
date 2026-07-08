import type { ModelInterface } from '@shared/models/types'
import type { Message } from '@shared/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  combinedSearchByPromptEngineering,
  constructMessagesWithKnowledgeBaseResults,
  constructMessagesWithSearchResults,
  knowledgeBaseSearchByPromptEngineering,
  searchByPromptEngineering,
} from '@/packages/model-calls/tools'
import { applyLegacyToolFallback } from './legacy-tool-fallback'

vi.mock('@/packages/model-calls/tools', () => ({
  combinedSearchByPromptEngineering: vi.fn(),
  constructMessagesWithKnowledgeBaseResults: vi.fn(),
  constructMessagesWithSearchResults: vi.fn(),
  knowledgeBaseSearchByPromptEngineering: vi.fn(),
  searchByPromptEngineering: vi.fn(),
}))

const promptMsgs: Message[] = [
  {
    id: 'user-1',
    role: 'user',
    timestamp: 1,
    contentParts: [{ type: 'text', text: 'Find the answer' }],
  },
]
const enrichedMsgs: Message[] = [
  ...promptMsgs,
  {
    id: 'result-1',
    role: 'assistant',
    timestamp: 2,
    contentParts: [{ type: 'text', text: 'Search result' }],
  },
]

function modelWithUnsupportedTools(unsupported: string[]): ModelInterface {
  return {
    modelId: 'legacy-model',
    name: 'Legacy model',
    isSupportToolUse: (tool: string) => !unsupported.includes(tool),
  } as ModelInterface
}

describe('applyLegacyToolFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(constructMessagesWithKnowledgeBaseResults).mockReturnValue(enrichedMsgs)
    vi.mocked(constructMessagesWithSearchResults).mockReturnValue(enrichedMsgs)
  })

  it('does nothing when the model supports every requested tool', async () => {
    const result = await applyLegacyToolFallback({
      model: modelWithUnsupportedTools([]),
      promptMsgs,
      knowledgeBase: { id: 7 },
      webBrowsing: true,
      signal: new AbortController().signal,
    })

    expect(result).toEqual({ promptMsgs, fallbackToolCallPart: undefined })
    expect(combinedSearchByPromptEngineering).not.toHaveBeenCalled()
  })

  it('uses combined fallback and records a knowledge-base tool result', async () => {
    const searchResult = { type: 'knowledge_base' as const, query: 'answer', searchResults: [{ text: 'result' }] }
    vi.mocked(combinedSearchByPromptEngineering).mockResolvedValue(searchResult as never)

    const result = await applyLegacyToolFallback({
      model: modelWithUnsupportedTools(['knowledge-base', 'web-browsing']),
      promptMsgs,
      knowledgeBase: { id: 7 },
      webBrowsing: true,
      signal: new AbortController().signal,
    })

    expect(combinedSearchByPromptEngineering).toHaveBeenCalledWith(expect.anything(), promptMsgs, 7, expect.anything())
    expect(constructMessagesWithKnowledgeBaseResults).toHaveBeenCalledWith(promptMsgs, searchResult.searchResults)
    expect(result.promptMsgs).toBe(enrichedMsgs)
    expect(result.fallbackToolCallPart).toMatchObject({
      type: 'tool-call',
      state: 'result',
      toolName: 'query_knowledge_base',
      args: { query: 'answer' },
      result: searchResult,
    })
  })

  it('uses web fallback when only web tool-use is unsupported', async () => {
    const searchResult = { query: 'latest answer', searchResults: [{ title: 'result' }] }
    vi.mocked(searchByPromptEngineering).mockResolvedValue(searchResult as never)

    const result = await applyLegacyToolFallback({
      model: modelWithUnsupportedTools(['web-browsing']),
      promptMsgs,
      knowledgeBase: undefined,
      webBrowsing: true,
      signal: new AbortController().signal,
    })

    expect(constructMessagesWithSearchResults).toHaveBeenCalledWith(promptMsgs, searchResult.searchResults)
    expect(result.fallbackToolCallPart).toMatchObject({ toolName: 'web_search', args: { query: 'latest answer' } })
  })

  it('uses knowledge-base fallback when only knowledge-base tool-use is unsupported', async () => {
    const searchResult = { query: 'manual', searchResults: [{ text: 'result' }] }
    vi.mocked(knowledgeBaseSearchByPromptEngineering).mockResolvedValue(searchResult as never)

    const result = await applyLegacyToolFallback({
      model: modelWithUnsupportedTools(['knowledge-base']),
      promptMsgs,
      knowledgeBase: { id: 9 },
      webBrowsing: false,
      signal: new AbortController().signal,
    })

    expect(knowledgeBaseSearchByPromptEngineering).toHaveBeenCalledWith(expect.anything(), promptMsgs, 9)
    expect(result.fallbackToolCallPart).toMatchObject({ toolName: 'query_knowledge_base', args: { query: 'manual' } })
  })

  it('does not fabricate a tool result when fallback search is empty', async () => {
    vi.mocked(searchByPromptEngineering).mockResolvedValue({ query: 'nothing', searchResults: [] } as never)

    const result = await applyLegacyToolFallback({
      model: modelWithUnsupportedTools(['web-browsing']),
      promptMsgs,
      knowledgeBase: undefined,
      webBrowsing: true,
      signal: new AbortController().signal,
    })

    expect(result).toEqual({ promptMsgs, fallbackToolCallPart: undefined })
    expect(constructMessagesWithSearchResults).not.toHaveBeenCalled()
  })
})
