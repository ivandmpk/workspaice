import { ModelProviderEnum, ModelProviderType, type ProviderModelInfo } from '@shared/types'
import { useMemo } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useProviders } from './useProviders'

export interface ImageModelOption {
  modelId: string
  displayName: string
}

export interface ImageModelGroup {
  label: string
  providerId: string
  isCustom?: boolean
  models: ImageModelOption[]
}

function manualImageModelToOption(model: ProviderModelInfo): ImageModelOption {
  return {
    modelId: model.modelId,
    displayName: model.nickname || model.modelId,
  }
}

export function useImageModelGroups(): ImageModelGroup[] {
  const { providers } = useProviders()
  const providerSettingsMap = useSettingsStore((state) => state.providers)

  const openAIProvider = providers.find((p) => p.id === ModelProviderEnum.OpenAI)
  const geminiProvider = providers.find((p) => p.id === ModelProviderEnum.Gemini)
  const customGeminiProviders = providers.filter((p) => p.isCustom && p.type === ModelProviderType.Gemini)

  return useMemo(() => {
    const groups: ImageModelGroup[] = []

    if (geminiProvider) {
      const models = (providerSettingsMap?.[geminiProvider.id]?.models || [])
        .filter((model) => model.type === 'image')
        .map(manualImageModelToOption)
      if (models.length > 0) {
        groups.push({
          label: geminiProvider.name,
          providerId: geminiProvider.id,
          models,
        })
      }
    }

    for (const provider of customGeminiProviders) {
      const models = (providerSettingsMap?.[provider.id]?.models || [])
        .filter((model) => model.type === 'image')
        .map(manualImageModelToOption)
      if (models.length > 0) {
        groups.push({
          label: provider.name,
          providerId: provider.id,
          isCustom: true,
          models,
        })
      }
    }

    if (openAIProvider) {
      const models = (providerSettingsMap?.[openAIProvider.id]?.models || [])
        .filter((model) => model.type === 'image')
        .map(manualImageModelToOption)
      if (models.length > 0) {
        groups.push({
          label: openAIProvider.name,
          providerId: openAIProvider.id,
          models,
        })
      }
    }

    return groups
  }, [openAIProvider, geminiProvider, customGeminiProviders, providerSettingsMap])
}
