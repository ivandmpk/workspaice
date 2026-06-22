import { Image } from '@mantine/core'
import { ModelProviderEnum } from '@shared/types'
import ProviderIcon from '@/components/icons/ProviderIcon'
import azureIcon from '../../../static/icons/providers/azure.png'
import chatglm6bIcon from '../../../static/icons/providers/chatglm-6b.png'
import claudeIcon from '../../../static/icons/providers/claude.png'
import deepseekIcon from '../../../static/icons/providers/deepseek.png'
import geminiIcon from '../../../static/icons/providers/gemini.png'
import groqIcon from '../../../static/icons/providers/groq.png'
import lmStudioIcon from '../../../static/icons/providers/lm-studio.png'
import minimaxIcon from '../../../static/icons/providers/minimax.png'
import mistralAiIcon from '../../../static/icons/providers/mistral-ai.png'
import ollamaIcon from '../../../static/icons/providers/ollama.png'
import openaiIcon from '../../../static/icons/providers/openai.png'
import openaiResponsesIcon from '../../../static/icons/providers/openai-responses.png'
import openrouterIcon from '../../../static/icons/providers/openrouter.png'
import perplexityIcon from '../../../static/icons/providers/perplexity.png'
import qwenIcon from '../../../static/icons/providers/qwen.png'
import siliconflowIcon from '../../../static/icons/providers/siliconflow.png'
import volcengineIcon from '../../../static/icons/providers/volcengine.png'
import xaiIcon from '../../../static/icons/providers/xAI.png'

const providerIconMap = new Map<string, string>([
  [ModelProviderEnum.OpenAI, openaiIcon],
  [ModelProviderEnum.OpenAIResponses, openaiResponsesIcon],
  [ModelProviderEnum.Azure, azureIcon],
  [ModelProviderEnum.ChatGLM6B, chatglm6bIcon],
  [ModelProviderEnum.Claude, claudeIcon],
  [ModelProviderEnum.Gemini, geminiIcon],
  [ModelProviderEnum.Qwen, qwenIcon],
  [ModelProviderEnum.MiniMax, minimaxIcon],
  [ModelProviderEnum.Ollama, ollamaIcon],
  [ModelProviderEnum.Groq, groqIcon],
  [ModelProviderEnum.DeepSeek, deepseekIcon],
  [ModelProviderEnum.SiliconFlow, siliconflowIcon],
  [ModelProviderEnum.VolcEngine, volcengineIcon],
  [ModelProviderEnum.MistralAI, mistralAiIcon],
  [ModelProviderEnum.LMStudio, lmStudioIcon],
  [ModelProviderEnum.Perplexity, perplexityIcon],
  [ModelProviderEnum.XAI, xaiIcon],
  [ModelProviderEnum.OpenRouter, openrouterIcon],
])

const PROVIDER_ICON_ALIASES: Record<string, string> = {
  [ModelProviderEnum.QwenPortal]: ModelProviderEnum.Qwen,
  [ModelProviderEnum.MiniMaxCN]: ModelProviderEnum.MiniMax,
}

export const FEATURED_PROVIDER_IDS: string[] = [
  ModelProviderEnum.OpenAI,
  ModelProviderEnum.Claude,
  ModelProviderEnum.Gemini,
  ModelProviderEnum.SiliconFlow,
  ModelProviderEnum.DeepSeek,
  ModelProviderEnum.OpenRouter,
  ModelProviderEnum.Ollama,
]

export function getProviderIconSrc(providerId: string): string | undefined {
  return providerIconMap.get(providerId) || providerIconMap.get(PROVIDER_ICON_ALIASES[providerId] || '')
}

export function ProviderIconImage({ providerId, size = 32 }: { providerId: string; size?: number }) {
  const iconSrc = getProviderIconSrc(providerId)
  return iconSrc ? (
    <Image w={size} h={size} src={iconSrc} alt={providerId} />
  ) : (
    <ProviderIcon provider={providerId} size={size} />
  )
}
