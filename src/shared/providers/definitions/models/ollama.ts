import OpenAICompatible, { type OpenAICompatibleSettings } from '../../../models/openai-compatible'
import type { ProviderModelInfo } from '../../../types'
import type { ModelDependencies } from '../../../types/adapters'
import { normalizeOpenAIApiHostAndPath } from '../../../utils/llm_utils'

interface OllamaShowResponse {
  capabilities?: string[]
}

function addCapability(model: ProviderModelInfo, capability: NonNullable<ProviderModelInfo['capabilities']>[number]) {
  return model.capabilities?.includes(capability)
    ? model
    : {
        ...model,
        capabilities: [...(model.capabilities || []), capability],
      }
}

function getOllamaNativeApiHost(openAICompatibleHost: string) {
  return openAICompatibleHost.replace(/\/v1\/?$/, '')
}

const helpers = {
  isModelSupportVision: (model: string) => {
    const modelId = model.toLowerCase()
    if (/^gemma3:(270m|1b)(?:$|[-:])/.test(modelId)) {
      return false
    }

    return [
      'gemma3',
      'gemma4',
      'llava',
      'llama3.2-vision',
      'llava-llama3',
      'moondream',
      'bakllava',
      'llava-phi3',
      'granite3.2-vision',
      'qwen3-vl',
      'qwen3.5',
      'qwen3.6',
      'minicpm-v4.5',
      'minicpm-v4.6',
      'glm-ocr',
      'nemotron3',
      'translategemma',
      'kimi-k2.5',
      'kimi-k2.6',
      'kimi-k2.7-code',
      'mistral-medium-3.5',
      'medgemma',
      'medgemma1.5',
      'ministral-3',
      'devstral-small-2',
      'deepseek-ocr',
    ].some((m) => modelId.startsWith(m))
  },
  isModelSupportToolUse: (model: string) => {
    return [
      'qwq',
      'llama3.3',
      'llama3.2',
      'llama3.1',
      'mistral',
      'qwen2.5',
      'qwen2.5-coder',
      'qwen2',
      'mistral-nemo',
      'mixtral',
      'smollm2',
      'mistral-small',
      'command-r',
      'hermes3',
      'mistral-large',
      'qwen3',
    ].some((m) => model.startsWith(m))
  },
}

interface OllamaOptions extends OpenAICompatibleSettings {
  ollamaHost: string
}

export default class Ollama extends OpenAICompatible {
  public name = 'Ollama'
  public options: OllamaOptions

  constructor(options: Omit<OllamaOptions, 'apiKey' | 'apiHost'>, dependencies: ModelDependencies) {
    const apiHost = normalizeOpenAIApiHostAndPath({ apiHost: options.ollamaHost }).apiHost
    super(
      {
        apiKey: 'ollama',
        apiHost,
        model: options.model,
        temperature: options.temperature,
        topP: options.topP,
        maxOutputTokens: options.maxOutputTokens,
        stream: options.stream,
        useProxy: options.useProxy,
      },
      dependencies
    )
    this.options = {
      ...options,
      apiKey: 'ollama',
      apiHost,
    }
  }
  public isSupportToolUse(): boolean {
    return helpers.isModelSupportToolUse(this.options.model.modelId) || super.isSupportToolUse()
  }
  public isSupportVision(): boolean {
    return helpers.isModelSupportVision(this.options.model.modelId) || super.isSupportVision()
  }
  public async listModels(): Promise<ProviderModelInfo[]> {
    const models = await super.listModels()
    const nativeApiHost = getOllamaNativeApiHost(this.options.apiHost)

    return await Promise.all(
      models.map(async (model) => {
        try {
          const response = await this.dependencies.request.apiRequest({
            url: `${nativeApiHost}/api/show`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model: model.modelId }),
            useProxy: this.options.useProxy,
          })
          if (!response.ok) {
            throw new Error(`Ollama show failed with status ${response.status}`)
          }
          const detail = (await response.json()) as OllamaShowResponse
          if (detail.capabilities?.includes('vision')) {
            return addCapability(model, 'vision')
          }
        } catch (err) {
          console.debug('Failed to read Ollama model capabilities', model.modelId, err)
        }

        return helpers.isModelSupportVision(model.modelId) ? addCapability(model, 'vision') : model
      })
    )
  }
}
