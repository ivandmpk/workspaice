import { Alert, Button, Flex, Group, Paper, Pill, Stack, Text, Title, Tooltip } from '@mantine/core'
import { SystemProviders } from '@shared/defaults'
import type { KnowledgeBase, ProviderModelInfo } from '@shared/types'
import type { DocumentParserConfig, DocumentParserType } from '@shared/types/settings'
import { parseKnowledgeBaseModelString } from '@shared/utils/knowledge-base-model-parser'
import { IconAlertTriangle, IconInfoCircle, IconLogin, IconPlus } from '@tabler/icons-react'
import compact from 'lodash/compact'
import flatten from 'lodash/flatten'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/layout/Overlay'
import { useProviders } from '@/hooks/useProviders'
import { navigateToSettings } from '@/modals/Settings'
import * as remote from '@/packages/remote'
import { toastError } from '@/packages/toast'
import platform from '@/platform'
import { useAuthInfoStore } from '@/stores/authInfoStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { trackEvent } from '@/utils/track'
import { ScalableIcon } from '../common/ScalableIcon'
import KnowledgeBaseDocuments from './KnowledgeBaseDocuments'
import {
  DocumentParserDisplay,
  DocumentParserSelector,
  KnowledgeBaseWorkspAIceAIInfo,
  KnowledgeBaseFormActions,
  KnowledgeBaseModelSelectors,
  KnowledgeBaseNameInput,
  KnowledgeBaseProviderModeSelect,
} from './KnowledgeBaseForm'

interface ModelPillProps {
  modelValue: string | null | undefined
  formatModelName: (model: string) => string
  isProviderAvailable: (model: string) => boolean
  type: 'embedding' | 'rerank' | 'vision'
  t: (key: string) => string
  unavailableTooltip?: string
  onUnavailableClick?: () => void
}

const ModelPill: React.FC<ModelPillProps> = ({
  modelValue,
  formatModelName,
  isProviderAvailable,
  type,
  t,
  unavailableTooltip,
  onUnavailableClick,
}) => {
  const isEmbedding = type === 'embedding'
  const hasModel = !!modelValue
  const modelUnavailable = useMemo(
    () => !hasModel || !isProviderAvailable(modelValue),
    [hasModel, isProviderAvailable, modelValue]
  )
  const getColor = () => {
    if (!hasModel) return 'dimmed'
    if (modelUnavailable) return 'red'
    return ''
  }

  const getIcon = () => {
    if (!hasModel || isProviderAvailable(modelValue)) return null
    const icon = (
      <ScalableIcon
        icon={IconAlertTriangle}
        size={12}
        color="red"
        title={unavailableTooltip || t('Provider unavailable')}
      />
    )
    if (onUnavailableClick) {
      return (
        <Tooltip label={unavailableTooltip || t('Provider unavailable')} withArrow multiline maw={200} position="top">
          <span style={{ cursor: 'pointer' }} onClick={onUnavailableClick}>
            {icon}
          </span>
        </Tooltip>
      )
    }
    return icon
  }

  const maxWidth = isEmbedding ? 200 : 150

  const modelText = useMemo(
    () => (hasModel ? formatModelName(modelValue) : t('None')),
    [hasModel, modelValue, formatModelName, t]
  )

  return (
    <Pill style={{ display: 'flex', alignItems: 'center' }}>
      <Flex align="center" gap="xs" maw={maxWidth} h={'100%'}>
        <Text
          c={getColor()}
          size="xs"
          title={modelText}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {modelText}
        </Text>
        {getIcon()}
      </Flex>
    </Pill>
  )
}

const KnowledgeBasePage: React.FC = () => {
  const { t } = useTranslation()
  const [kbList, setKbList] = useState<KnowledgeBase[]>([])
  const [newKbName, setNewKbName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const licenseKey = useSettingsStore((state) => state.licenseKey)
  const customProviders = useSettingsStore((state) => state.customProviders)
  const accessToken = useAuthInfoStore((state) => state.accessToken)
  const refreshToken = useAuthInfoStore((state) => state.refreshToken)
  const isLoggedIn = !!(accessToken && refreshToken)

  const [newEmbeddingModel, setNewEmbeddingModel] = useState<string | null>(null)
  const [newRerankModel, setNewRerankModel] = useState<string | null>(null)
  const [newVisionModel, setNewVisionModel] = useState<string | null>(null)
  const [newDocumentParser, setNewDocumentParser] = useState<DocumentParserConfig>({ type: 'local' })
  const [editKb, setEditKb] = useState<(Partial<KnowledgeBase> & { id: number }) | null>(null)
  const [editRerankModel, setEditRerankModel] = useState<string | null>(null)
  const [editVisionModel, setEditVisionModel] = useState<string | null>(null)
  const [deleteConfirmKb, setDeleteConfirmKb] = useState<(Partial<KnowledgeBase> & { id: number }) | null>(null)
  const [isUnsupportedPlatform, setIsUnsupportedPlatform] = useState(false)

  const [workspaiceAIModels, setWorkspAIceAIModels] = useState<{
    embedding: string
    vision: string
    rerank: string
  } | null>(null)

  const canUseWorkspAIceAIProvider = useMemo(() => {
    return !!(workspaiceAIModels && licenseKey)
  }, [workspaiceAIModels, licenseKey])

  const isWorkspAIceAIKnowledgeBase = useCallback(
    (kb: KnowledgeBase) => {
      // Use the stored providerMode if available
      if (kb.providerMode) {
        return kb.providerMode === 'workspaice-ai'
      }
      // Fallback for legacy KBs created before providerMode was stored: check embedding model
      if (!workspaiceAIModels) return false
      return kb.embeddingModel === workspaiceAIModels.embedding
    },
    [workspaiceAIModels]
  )

  // Check if there are WorkspAIce AI KBs but user is not logged in — show login prompt.
  // A KB counts as a WorkspAIce AI KB when its embedding model is the WorkspAIce AI embedding model.
  const workspaiceAIKbNeedsLogin = useMemo(() => {
    if (canUseWorkspAIceAIProvider) return false
    if (!workspaiceAIModels) return false
    // key
    return kbList.some((kb) => kb.embeddingModel === workspaiceAIModels.embedding)
  }, [canUseWorkspAIceAIProvider, workspaiceAIModels, kbList])

  const [newProviderMode, setNewProviderMode] = useState<'workspaice-ai' | 'custom'>('custom')

  useEffect(() => {
    if (canUseWorkspAIceAIProvider) {
      setNewProviderMode('workspaice-ai')
    } else {
      setNewProviderMode('custom')
    }
  }, [canUseWorkspAIceAIProvider])

  const { providers } = useProviders()

  const getModelList = useCallback(
    (filter: (model: ProviderModelInfo) => boolean) => {
      return compact(
        flatten(
          providers.map((provider) => {
            return provider.models?.filter(filter).map((model) => {
              return {
                label: `${provider.name} | ${model.nickname || model.modelId}`,
                value: `${provider.id}:${model.modelId}`,
              }
            })
          })
        )
      )
    },
    [providers]
  )

  const embeddingModelList = useMemo(() => {
    return getModelList((model) => !!model.type && model.type === 'embedding')
  }, [getModelList])

  const rerankModelList = useMemo(() => {
    return getModelList((model) => model.type === 'rerank')
  }, [getModelList])

  const visionModelList = useMemo(() => {
    return getModelList((model) => !!model.capabilities?.includes('vision'))
  }, [getModelList])

  const knowledgeBaseController = useMemo(() => {
    return platform.getKnowledgeBaseController()
  }, [])

  const getProviderName = useCallback(
    (providerId: string) => {
      if (SystemProviders().some((it) => it.id === providerId)) {
        return SystemProviders().find((it) => it.id === providerId)?.name
      }

      const customProvider = customProviders?.find((it) => it.id === providerId)
      if (customProvider) {
        return customProvider.name
      }

      return providerId
    },
    [customProviders]
  )

  const getModelName = useCallback(
    (providerId: string, modelId: string) => {
      const provider = providers.find((it) => it.id === providerId)
      if (provider) {
        const model = provider.models?.find((it) => it.modelId === modelId)
        if (model) {
          return model.nickname || model.modelId
        }
      }
    },
    [providers]
  )

  const isProviderAvailable = useCallback(
    (modelString: string) => {
      const parsed = parseKnowledgeBaseModelString(modelString)
      if (!parsed) return false
      return providers.some((provider) => provider.id === parsed.providerId)
    },
    [providers]
  )

  function formatModelName(model: string) {
    const parsed = parseKnowledgeBaseModelString(model)
    if (!parsed) return t('Unknown')
    const { providerId, modelId } = parsed
    const providerName = getProviderName(providerId)
    const modelName = getModelName(providerId, modelId) || modelId
    return `${providerName} | ${modelName}`
  }

  function formatParserType(parserType?: DocumentParserType): string {
    switch (parserType) {
      case 'workspaice-ai':
        return 'WorkspAIce AI'
      case 'mineru':
        return 'MinerU'
      case 'local':
      default:
        return t('Local')
    }
  }

  const fetchKbList = useCallback(async () => {
    if (isUnsupportedPlatform) return
    try {
      const list = await knowledgeBaseController.list()
      if (list) {
        setKbList(list)
      }
    } catch (error) {
      toastError(t('Failed to fetch knowledge base list, Error: {{error}}', { error: error }))
    }
  }, [knowledgeBaseController, isUnsupportedPlatform, t])

  useEffect(() => {
    fetchKbList()
  }, [fetchKbList])

  // Check platform compatibility
  useEffect(() => {
    const checkPlatform = async () => {
      try {
        const platformName = await platform.getPlatform()
        const arch = await platform.getArch()
        const isWin32Arm64 = platformName === 'win32' && arch === 'arm64'
        setIsUnsupportedPlatform(isWin32Arm64)
      } catch (error) {
        console.error('Failed to check platform compatibility:', error)
      }
    }
    checkPlatform()
  }, [])

  // Fetch WorkspAIce AI models configuration
  useEffect(() => {
    const fetchWorkspAIceAIModels = async () => {
      try {
        const config = await remote.getRemoteConfig('knowledge_base_models')
        if (config.knowledge_base_models) {
          setWorkspAIceAIModels(config.knowledge_base_models)
        }
      } catch (error) {
        toastError(t('Failed to fetch WorkspAIce AI models config, Error: {{error}}', { error: error }))
      }
    }
    fetchWorkspAIceAIModels()
  }, [t])

  const createKb = async () => {
    if (!newKbName) return

    let embeddingModel: string
    let rerankModel: string
    let visionModel: string
    let documentParser: DocumentParserConfig | undefined

    if (newProviderMode === 'workspaice-ai') {
      if (!workspaiceAIModels) return
      embeddingModel = workspaiceAIModels.embedding
      rerankModel = workspaiceAIModels.rerank
      visionModel = workspaiceAIModels.vision
      // WorkspAIce AI mode uses local parsing by default to save compute points
      // Users can retry with server parsing (WorkspAIce AI) if local parsing fails
      documentParser = { type: 'local' }
    } else {
      if (!newEmbeddingModel) return
      embeddingModel = newEmbeddingModel
      rerankModel = newRerankModel || ''
      visionModel = newVisionModel || ''
      // Custom mode uses the selected parser config
      documentParser = newDocumentParser
    }

    try {
      await knowledgeBaseController.create({
        name: newKbName,
        embeddingModel: embeddingModel,
        rerankModel: rerankModel,
        visionModel: visionModel,
        documentParser: documentParser,
        providerMode: newProviderMode,
      })

      trackEvent('knowledge_base_created', {
        provider_mode: newProviderMode,
        embedding_model: embeddingModel,
        rerank_model: rerankModel || null,
        vision_model: visionModel || null,
        document_parser: documentParser?.type || 'global',
        knowledge_base_name: newKbName,
      })

      // Reset form
      setNewKbName('')
      setNewProviderMode('workspaice-ai')
      setNewEmbeddingModel(null)
      setNewRerankModel(null)
      setNewVisionModel(null)
      setNewDocumentParser({ type: 'local' })
      setShowCreate(false)
      fetchKbList()
    } catch (e) {
      toastError(t('Failed to create knowledge base, Error: {{error}}', { error: e }))
    }
  }

  const handleEditKb = (kb: KnowledgeBase) => {
    setEditKb(kb)
    setEditRerankModel(kb.rerankModel ? `${kb.rerankModel}` : null)
    setEditVisionModel(kb.visionModel ? `${kb.visionModel}` : null)
  }

  const handleSaveEditKb = async () => {
    if (!editKb) return

    try {
      await knowledgeBaseController.update({
        id: editKb.id,
        name: editKb.name,
        rerankModel: editRerankModel || '',
        visionModel: editVisionModel || '',
      })
      setEditKb(null)
      setEditRerankModel(null)
      setEditVisionModel(null)
      fetchKbList()
    } catch (e) {
      toastError(t('Failed to update knowledge base, Error: {{error}}', { error: e }))
    }
  }

  const handleDeleteKb = async () => {
    if (!deleteConfirmKb) return
    try {
      await knowledgeBaseController.delete(deleteConfirmKb.id)
      setDeleteConfirmKb(null)
      setEditKb(null) // Close edit modal if it's open
      fetchKbList()
    } catch (error) {
      console.error('Failed to delete knowledge base:', error)
    }
  }

  return (
    <Stack p="md" gap="xl">
      <Group justify="space-between" align="center">
        <Title order={5}>{t('Knowledge Base')}</Title>
        <Button variant="outline" onClick={() => setShowCreate(true)} disabled={isUnsupportedPlatform}>
          <Group gap="xs">
            <ScalableIcon icon={IconPlus} size={16} />
            <Text size="sm" c="workspaice-brand" fw={400}>
              {t('Add')}
            </Text>
          </Group>
        </Button>
      </Group>

      {isUnsupportedPlatform && (
        <Alert
          variant="light"
          color="orange"
          title={t('Platform Not Supported')}
          icon={<ScalableIcon icon={IconInfoCircle} size={16} />}
        >
          <Text size="sm">
            {t(
              'Knowledge Base functionality is not available on Windows ARM64 due to library compatibility issues. This feature is supported on Windows x64, macOS, and Linux.'
            )}
          </Text>
        </Alert>
      )}

      <Modal opened={showCreate} onClose={() => setShowCreate(false)} title={t('Create Knowledge Base')} centered>
        <Stack gap="md">
          <KnowledgeBaseNameInput value={newKbName} onChange={setNewKbName} autoFocus />

          <KnowledgeBaseProviderModeSelect
            value={newProviderMode}
            onChange={setNewProviderMode}
            isWorkspAIceAIDisabled={!canUseWorkspAIceAIProvider}
          />

          {newProviderMode === 'workspaice-ai' ? (
            <KnowledgeBaseWorkspAIceAIInfo hasError={!workspaiceAIModels} />
          ) : (
            <>
              <DocumentParserSelector parserConfig={newDocumentParser} onParserConfigChange={setNewDocumentParser} />
              <KnowledgeBaseModelSelectors
                embeddingModelList={embeddingModelList}
                rerankModelList={rerankModelList}
                visionModelList={visionModelList}
                embeddingModel={newEmbeddingModel}
                rerankModel={newRerankModel}
                visionModel={newVisionModel}
                onEmbeddingModelChange={setNewEmbeddingModel}
                onRerankModelChange={setNewRerankModel}
                onVisionModelChange={setNewVisionModel}
              />
            </>
          )}

          <KnowledgeBaseFormActions
            onCancel={() => setShowCreate(false)}
            onConfirm={createKb}
            confirmText={t('Create')}
            isConfirmDisabled={
              !newKbName || (newProviderMode === 'workspaice-ai' ? !canUseWorkspAIceAIProvider : !newEmbeddingModel)
            }
          />
        </Stack>
      </Modal>
      <Modal opened={!!editKb} onClose={() => setEditKb(null)} title={t('Edit Knowledge Base')} centered>
        <Stack gap="md">
          <KnowledgeBaseNameInput
            value={editKb?.name || ''}
            onChange={(value) => editKb && setEditKb({ ...editKb, name: value })}
            label={t('Name') as string}
          />
          {editKb && isWorkspAIceAIKnowledgeBase(editKb as KnowledgeBase) ? (
            <KnowledgeBaseWorkspAIceAIInfo showModelsLabel />
          ) : (
            <>
              <DocumentParserDisplay parserType={editKb?.documentParser?.type} />
              <KnowledgeBaseModelSelectors
                embeddingModelList={embeddingModelList}
                rerankModelList={rerankModelList}
                visionModelList={visionModelList}
                embeddingModel={editKb ? `${editKb.embeddingModel}` : ''}
                rerankModel={editRerankModel}
                visionModel={editVisionModel}
                onRerankModelChange={setEditRerankModel}
                onVisionModelChange={setEditVisionModel}
                isEmbeddingDisabled
              />
            </>
          )}
          <KnowledgeBaseFormActions
            onCancel={() => setEditKb(null)}
            onConfirm={handleSaveEditKb}
            confirmText={t('Save')}
            showDelete
            onDelete={() => setDeleteConfirmKb(editKb)}
          />
        </Stack>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        opened={!!deleteConfirmKb}
        onClose={() => setDeleteConfirmKb(null)}
        title={t('Delete Knowledge Base')}
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            {t('Are you sure you want to delete the knowledge base')} "{deleteConfirmKb?.name}"?
          </Text>
          <Text size="sm" c="dimmed">
            {t('This action cannot be undone. All documents and their embeddings will be permanently deleted.')}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteConfirmKb(null)}>
              {t('Cancel')}
            </Button>
            <Button color="red" onClick={handleDeleteKb}>
              {t('Delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
      {!isUnsupportedPlatform && (
        <Stack gap="xl">
          {workspaiceAIKbNeedsLogin && (
            <Alert
              variant="light"
              color="orange"
              icon={<IconAlertTriangle size={16} />}
              title={t('Sign in to WorkspAIce AI')}
            >
              <Text size="sm">
                {t(
                  'Your WorkspAIce AI knowledge base requires an active login. Please sign in to WorkspAIce AI to use this knowledge base.'
                )}
              </Text>
              <Group mt="sm">
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconLogin size={14} />}
                  onClick={() => navigateToSettings('workspaice-ai')}
                >
                  {t('Log in to WorkspAIce AI')}
                </Button>
              </Group>
            </Alert>
          )}
          {kbList.length === 0 ? (
            <Paper withBorder p="xl" style={{ textAlign: 'center' }}>
              <Stack gap="md" align="center">
                <ScalableIcon icon={IconInfoCircle} size={48} color="var(--workspaice-tint-tertiary)" />
                <Stack gap="xs" align="center">
                  <Text fw={500} size="lg">
                    {t('No Knowledge Base Yet')}
                  </Text>
                  <Text size="sm" c="dimmed" style={{ maxWidth: 400 }}>
                    {t(
                      'Create your first knowledge base to start adding documents and enhance your AI conversations with contextual information.'
                    )}
                  </Text>
                </Stack>
                <Button variant="outline" onClick={() => setShowCreate(true)} size="sm">
                  <Group gap="xs">
                    <ScalableIcon icon={IconPlus} size={16} />
                    {t('Create First Knowledge Base')}
                  </Group>
                </Button>
              </Stack>
            </Paper>
          ) : (
            kbList.map((kb) => (
              <Paper key={kb.id} withBorder p="md">
                <Stack gap="md">
                  <Stack gap="0">
                    <Group justify="space-between" align="center">
                      <Text fw={600} size="lg">
                        {kb.name}
                      </Text>
                      <Button size="xs" variant="subtle" onClick={() => handleEditKb(kb)}>
                        {t('Edit')}
                      </Button>
                    </Group>
                    <Group gap="xs" wrap="wrap" align="center">
                      {isWorkspAIceAIKnowledgeBase(kb) ? (
                        <>
                          <Text size="xs" c="dimmed">
                            {t('Models')}:
                          </Text>
                          <ModelPill
                            modelValue={'WorkspAIce AI'}
                            formatModelName={() => 'WorkspAIce AI'}
                            isProviderAvailable={() => canUseWorkspAIceAIProvider}
                            type="embedding"
                            t={t}
                            unavailableTooltip={
                              !isLoggedIn
                                ? String(t('Sign in to WorkspAIce AI to use this knowledge base'))
                                : String(t('Provider unavailable'))
                            }
                            onUnavailableClick={!isLoggedIn ? () => navigateToSettings('workspaice-ai') : undefined}
                          />
                        </>
                      ) : (
                        <>
                          <Text size="xs" c="dimmed">
                            {t('Parser')}:
                          </Text>
                          <Pill>{formatParserType(kb.documentParser?.type)}</Pill>
                          <Text size="xs" c="dimmed">
                            {t('Embedding')}:
                          </Text>
                          <ModelPill
                            modelValue={kb.embeddingModel}
                            formatModelName={formatModelName}
                            isProviderAvailable={isProviderAvailable}
                            type="embedding"
                            t={t}
                          />
                          <Text size="xs" c="dimmed">
                            {t('Rerank')}:
                          </Text>
                          <ModelPill
                            modelValue={kb.rerankModel}
                            formatModelName={formatModelName}
                            isProviderAvailable={isProviderAvailable}
                            type="rerank"
                            t={t}
                          />
                          <Text size="xs" c="dimmed">
                            {t('Vision')}:
                          </Text>
                          <ModelPill
                            modelValue={kb.visionModel}
                            formatModelName={formatModelName}
                            isProviderAvailable={isProviderAvailable}
                            type="vision"
                            t={t}
                          />
                        </>
                      )}
                    </Group>
                  </Stack>
                  <KnowledgeBaseDocuments knowledgeBase={kb} />
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      )}
    </Stack>
  )
}

export default KnowledgeBasePage
