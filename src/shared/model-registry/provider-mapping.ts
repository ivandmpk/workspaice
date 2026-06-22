/**
 * Mapping from WorkspAIce provider IDs (ModelProviderEnum values)
 * to models.dev provider IDs.
 *
 * Only providers with a known models.dev counterpart are listed here.
 * Providers not in this map (Ollama, LM Studio, VolcEngine,
 * WorkspAIceAI, Azure) will not receive models.dev enrichment.
 */
export const PROVIDER_ID_MAP: Record<string, string> = {
  openai: 'openai',
  'openai-responses': 'openai',
  claude: 'anthropic',
  gemini: 'google',
  xAI: 'xai',
  deepseek: 'deepseek',
  groq: 'groq',
  'mistral-ai': 'mistral',
  perplexity: 'perplexity',
  openrouter: 'openrouter',
  minimax: 'minimax',
  'minimax-cn': 'minimax-cn',
  moonshot: 'moonshotai',
  'moonshot-cn': 'moonshotai',
  siliconflow: 'siliconflow',
  'chatglm-6b': 'zhipuai',
  qwen: 'alibaba',
  'qwen-portal': 'alibaba',
}

/** Reverse mapping: models.dev provider ID -> WorkspAIce provider IDs */
export const REVERSE_PROVIDER_MAP: Record<string, string[]> = Object.entries(PROVIDER_ID_MAP).reduce(
  (acc, [workspaiceId, modelsDevId]) => {
    if (!acc[modelsDevId]) {
      acc[modelsDevId] = []
    }
    acc[modelsDevId].push(workspaiceId)
    return acc
  },
  {} as Record<string, string[]>
)

/**
 * Get the models.dev provider ID for a WorkspAIce provider.
 * Returns undefined if no mapping exists.
 */
export function getModelsDevProviderId(workspaiceProviderId: string): string | undefined {
  return PROVIDER_ID_MAP[workspaiceProviderId]
}

/**
 * Get all WorkspAIce provider IDs that map to a given models.dev provider ID.
 */
export function getWorkspAIceProviderIds(modelsDevProviderId: string): string[] {
  return [...(REVERSE_PROVIDER_MAP[modelsDevProviderId] ?? [])]
}
