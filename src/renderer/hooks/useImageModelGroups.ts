import { ModelProviderEnum, ModelProviderType, type ProviderModelInfo } from '@shared/types'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getModelManifest, type RemoteModelInfo } from '@/packages/remote'
import { useLanguage, useSettingsStore } from '@/stores/settingsStore'
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

function remoteImageModelToOption(model: RemoteModelInfo): ImageModelOption {
  return {
    modelId: model.modelId,
    displayName: model.modelName || model.modelId,
  }
}

function manualImageModelToOption(model: ProviderModelInfo): ImageModelOption {
  return {
    modelId: model.modelId,
    displayName: model.nickname || model.modelId,
  }
}

function mergeImageModels(remoteModels: ImageModelOption[], manualModels: ImageModelOption[]): ImageModelOption[] {
  const modelsById = new Map<string, ImageModelOption>()
  for (const model of remoteModels) {
    modelsById.set(model.modelId, model)
  }
  for (const model of manualModels) {
    modelsById.set(model.modelId, {
      ...modelsById.get(model.modelId),
      ...model,
    })
  }
  return [...modelsById.values()]
}

export function useProviderImageModels(provider: ModelProviderEnum, enabled: boolean): ImageModelOption[] {
  const language = useLanguage()

  const { data } = useQuery({
    queryKey: ['provider-image-models', provider, language],
    enabled,
    staleTime: 3600 * 1000,
    queryFn: async () => {
      const manifest = await getModelManifest({
        aiProvider: provider,
        language,
      })
      return manifest.imageModels.map(remoteImageModelToOption)
    },
  })

  return data || []
}

export function useImageModelGroups(): ImageModelGroup[] {
  const { providers } = useProviders()
  const providerSettingsMap = useSettingsStore((state) => state.providers)

  const openAIProvider = providers.find((p) => p.id === ModelProviderEnum.OpenAI)
  const geminiProvider = providers.find((p) => p.id === ModelProviderEnum.Gemini)
  const customGeminiProviders = providers.filter((p) => p.isCustom && p.type === ModelProviderType.Gemini)

  const openAIImageModels = useProviderImageModels(ModelProviderEnum.OpenAI, !!openAIProvider)
  const geminiImageModels = useProviderImageModels(
    ModelProviderEnum.Gemini,
    !!geminiProvider || customGeminiProviders.length > 0
  )

  return useMemo(() => {
    const groups: ImageModelGroup[] = []
    if (geminiProvider) {
      const manualModels = (providerSettingsMap?.[geminiProvider.id]?.models || [])
        .filter((model) => model.type === 'image')
        .map(manualImageModelToOption)
      const models = mergeImageModels(geminiImageModels, manualModels)
      if (models.length > 0) {
        groups.push({
          label: geminiProvider.name,
          providerId: geminiProvider.id,
          models,
        })
      }
    }

    for (const provider of customGeminiProviders) {
      const manualModels = (providerSettingsMap?.[provider.id]?.models || [])
        .filter((model) => model.type === 'image')
        .map(manualImageModelToOption)
      const models = mergeImageModels(geminiImageModels, manualModels)
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
      const manualModels = (providerSettingsMap?.[openAIProvider.id]?.models || [])
        .filter((model) => model.type === 'image')
        .map(manualImageModelToOption)
      const models = mergeImageModels(openAIImageModels, manualModels)
      if (models.length > 0) {
        groups.push({
          label: openAIProvider.name,
          providerId: openAIProvider.id,
          models,
        })
      }
    }

    return groups
  }, [
    workspaiceProvider,
    openAIProvider,
    geminiProvider,
    customGeminiProviders,
    providerSettingsMap,
    workspaiceAIImageModels,
    openAIImageModels,
    geminiImageModels,
  ])
}
