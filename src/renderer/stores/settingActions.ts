import { isUsingOAuth, mergeSharedOAuthProviderSettings } from '@shared/oauth'
import { ModelProviderEnum } from '@shared/types'
import platform from '@/platform'
import { settingsStore } from './settingsStore'

export function needEditSetting() {
  const settings = settingsStore.getState()

  if (settings.providers && Object.keys(settings.providers).length > 0) {
    const providers = settings.providers
    const keys = Object.keys(settings.providers)
    // 有任何一个供应商配置了api key 或者 OAuth
    if (
      keys.filter((key) => {
        const providerSettings = mergeSharedOAuthProviderSettings(key, providers)
        return !!providerSettings.apiKey || isUsingOAuth(providerSettings, platform.type)
      }).length > 0
    ) {
      return false
    }
    // Bedrock configured with AWS credentials
    if (providers[ModelProviderEnum.Bedrock]?.accessKey && providers[ModelProviderEnum.Bedrock]?.secretKey) {
      return false
    }
    // Ollama / LMStudio/ custom provider 配置了至少一个模型
    if (
      keys.filter(
        (key) =>
          (key === ModelProviderEnum.Ollama ||
            key === ModelProviderEnum.LMStudio ||
            key.startsWith('custom-provider')) &&
          providers[key].models?.length
      ).length > 0
    ) {
      return false
    }
  }
  return true
}

export function getLanguage() {
  return settingsStore.getState().language
}

export function getProxy() {
  return settingsStore.getState().proxy
}

export function getAutoGenerateTitle() {
  return settingsStore.getState().autoGenerateTitle
}

export function getExtensionSettings() {
  return settingsStore.getState().extension
}
