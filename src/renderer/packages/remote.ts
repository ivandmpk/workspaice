import type { Config, ProviderModelInfo, Settings } from '../../shared/types'

const LOCAL_ONLY_ERROR = 'This hosted service is not available in the local-only WorkspAIce build.'

function hostedServiceError(): Error {
  return new Error(LOCAL_ONLY_ERROR)
}

export function getAPIOrigin() {
  return ''
}

export function getWorkspAIceOrigin() {
  return ''
}

export function buildWorkspAIceUrl(path: string) {
  return path
}

export async function checkNeedUpdate(_version: string, _os: string, _config: Config, _settings: Settings) {
  return false
}

export async function parseUserLinkFree(params: { url: string }): Promise<{ title: string; text: string }> {
  const response = await fetch(params.url)
  const text = await response.text()
  return { title: params.url, text }
}

export async function getProviderModelsInfo(_params: { modelIds: string[] }): Promise<ProviderModelInfo[]> {
  return []
}

export async function reportContent(_params: { id: string; type: string; details: string }) {}

export interface ImageCompletionRequest {
  model: string
  prompt: string
  response_format: 'b64_json'
  style?: string
  aspect_ratio?: string
  quantity?: number
  images?: Array<{ image_url: string }>
}

export interface ImageGenerationItem {
  uuid: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  image_url?: string
  generated_at?: string
  error_code?: string
  error_message?: string
}

export interface ImageGenerationTaskResponse {
  items: ImageGenerationItem[]
  is_finished: boolean
  task_id: string
}

export async function submitImageGeneration(
  _params: ImageCompletionRequest,
  _hostedServiceToken: string
): Promise<ImageGenerationTaskResponse> {
  throw hostedServiceError()
}

export async function pollImageTask(
  _taskId: string,
  _hostedServiceToken: string,
  _signal?: AbortSignal
): Promise<ImageGenerationTaskResponse> {
  throw hostedServiceError()
}

export async function pollTaskUntilComplete(
  _taskId: string,
  _hostedServiceToken: string,
  _options?: {
    signal?: AbortSignal
    onPoll?: (response: ImageGenerationTaskResponse) => void
  }
): Promise<ImageGenerationTaskResponse> {
  throw hostedServiceError()
}
