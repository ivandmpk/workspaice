import type {
  SearchResult,
  WorkspAIceAILicenseDetail,
  Config,
  CopilotDetail,
  ModelProvider,
  ProviderModelInfo,
  RemoteConfig,
  SessionRagConfig,
  Settings,
} from '../../shared/types'

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

export async function listCopilotTags(_lang: string): Promise<string[]> {
  return []
}

export async function listCopilotsByCursor(
  _lang: string,
  _filters?: {
    limit?: number
    cursor?: string
    tag?: string
    search?: string
  }
): Promise<{ data: CopilotDetail[]; next_cursor: string | null }> {
  return { data: [], next_cursor: null }
}

export async function recordCopilotUsage(_params: {
  id: string
  action: 'create_session' | 'create_thread' | 'create_message' | 'use_copilot'
}) {}

export async function recordCopilotShare(_detail: CopilotDetail) {}

export async function getPremiumPrice() {
  return { price: 0, discount: 0, discountLabel: '' }
}

export async function getRemoteConfig<T extends keyof RemoteConfig>(_config: T): Promise<RemoteConfig[T] | undefined> {
  return undefined
}

export async function getSessionRagConfig(_params?: { licenseKey?: string }): Promise<SessionRagConfig | undefined> {
  return undefined
}

export function invalidateSessionRagConfigCache(_licenseKey?: string) {}

export interface DialogConfig {
  enabled: boolean
  title?: string
  content?: string
  markdown?: string
  buttons?: Array<{ label: string; url: string }>
}

export async function getDialogConfig(_params: { uuid: string; language: string; version: string }): Promise<null> {
  return null
}

export async function getLicenseDetail(_params: { licenseKey: string }): Promise<WorkspAIceAILicenseDetail | undefined> {
  return undefined
}

export interface LicenseDetailError {
  code: string
  message?: string
}

export interface LicenseDetailResponse {
  data?: WorkspAIceAILicenseDetail
  error?: LicenseDetailError
}

export async function getLicenseDetailRealtime(_params: { licenseKey: string }): Promise<LicenseDetailResponse> {
  return { error: { code: 'local_only', message: LOCAL_ONLY_ERROR } }
}

export async function generateUploadUrl(_params: { licenseKey: string; filename: string }): Promise<never> {
  throw hostedServiceError()
}

export async function createUserFile<T extends boolean>(_params: {
  licenseKey: string
  filename: string
  fileKey: string
  waitParse?: T
}): Promise<T extends true ? { storageKey: string } : { id: string }> {
  throw hostedServiceError()
}

export async function uploadAndCreateUserFile(_licenseKey: string, _file: File): Promise<never> {
  throw hostedServiceError()
}

export async function parseUserLinkPro(_params: {
  licenseKey: string
  url: string
  abortSignal?: AbortSignal
}): Promise<{ storageKey: string; title: string }> {
  throw hostedServiceError()
}

export async function parseUserLinkFree(params: { url: string }): Promise<{ title: string; text: string }> {
  const response = await fetch(params.url)
  const text = await response.text()
  return { title: params.url, text }
}

export async function webBrowsing(_params: { licenseKey: string; query: string }): Promise<{ links: SearchResult['items'] }> {
  throw hostedServiceError()
}

export async function activateLicense(_params: { licenseKey: string; instanceName: string }) {
  return { valid: false, error: 'local_only', instanceId: '' }
}

export async function deactivateLicense(_params: { licenseKey: string; instanceId: string }) {}

export async function validateLicense(_params: { licenseKey: string; instanceId: string }) {
  return { valid: false, error: 'local_only' }
}

export type RemoteModelInfo = ProviderModelInfo

export async function getModelManifest(_params: {
  aiProvider: ModelProvider
  licenseKey?: string
  language?: string
}): Promise<{ models: ProviderModelInfo[]; imageModels: ProviderModelInfo[] }> {
  return { models: [], imageModels: [] }
}

export async function reportContent(_params: { id: string; type: string; details: string }) {}

export async function getProviderModelsInfo(_params: { modelIds: string[] }): Promise<ProviderModelInfo[]> {
  return []
}

export async function requestLoginTicketId(): Promise<never> {
  throw hostedServiceError()
}

export async function sendEmailLoginCode(_params: { email: string; lang?: string }): Promise<never> {
  throw hostedServiceError()
}

export async function loginOrSignupWithEmailCode(_params: { email: string; code: string }): Promise<never> {
  throw hostedServiceError()
}

export async function getWebAuthToken(): Promise<never> {
  throw hostedServiceError()
}

export async function checkLoginStatus(_ticketId: string): Promise<never> {
  throw hostedServiceError()
}

export async function refreshAccessToken(_params: { refreshToken: string }): Promise<never> {
  throw hostedServiceError()
}

export async function getUserProfile(): Promise<never> {
  throw hostedServiceError()
}

export interface UserLicense {
  id: string
  name?: string
  key?: string
}

export async function listLicensesByUser(): Promise<UserLicense[]> {
  return []
}

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
  _licenseKey: string
): Promise<ImageGenerationTaskResponse> {
  throw hostedServiceError()
}

export async function pollImageTask(
  _taskId: string,
  _licenseKey: string,
  _signal?: AbortSignal
): Promise<ImageGenerationTaskResponse> {
  throw hostedServiceError()
}

export async function pollTaskUntilComplete(
  _taskId: string,
  _licenseKey: string,
  _options?: {
    signal?: AbortSignal
    onPoll?: (response: ImageGenerationTaskResponse) => void
  }
): Promise<ImageGenerationTaskResponse> {
  throw hostedServiceError()
}
