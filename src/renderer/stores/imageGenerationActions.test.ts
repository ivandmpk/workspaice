import { beforeEach, describe, expect, it, vi } from 'vitest'

const submitImageGenerationMock = vi.fn()
const pollTaskUntilCompleteMock = vi.fn()
const createRecordMock = vi.fn()
const updateRecordMock = vi.fn()
const setQueryDataMock = vi.fn()
const invalidateQueriesMock = vi.fn()
const getImageMock = vi.fn()
const paintMock = vi.fn()
const setCurrentGeneratingIdMock = vi.fn()
const setCurrentRecordIdMock = vi.fn()
const trackEventMock = vi.fn()

vi.mock('@/adapters', () => ({
  createModelDependencies: vi.fn(async () => ({
    storage: {
      getImage: getImageMock,
    },
  })),
}))

vi.mock('@/packages/remote', () => ({
  submitImageGeneration: submitImageGenerationMock,
  pollTaskUntilComplete: pollTaskUntilCompleteMock,
  pollImageTask: vi.fn(),
}))

vi.mock('@shared/providers', () => ({
  getModel: vi.fn(() => ({
    paint: paintMock,
  })),
}))

vi.mock('./imageGenerationStore', () => ({
  IMAGE_GEN_LIST_QUERY_KEY: 'image-gen-list',
  IMAGE_GEN_QUERY_KEY: 'image-gen',
  createRecord: createRecordMock,
  updateRecord: updateRecordMock,
  addGeneratedImage: vi.fn(),
  imageGenerationStore: {
    getState: () => ({
      currentGeneratingId: null,
      currentRecordId: null,
      setCurrentGeneratingId: setCurrentGeneratingIdMock,
      setCurrentRecordId: setCurrentRecordIdMock,
    }),
  },
}))

vi.mock('./queryClient', () => ({
  queryClient: {
    setQueryData: setQueryDataMock,
    invalidateQueries: invalidateQueriesMock,
  },
}))

vi.mock('./settingsStore', () => ({
  settingsStore: {
    getState: () => ({
      licenseKey: 'license-key',
      getSettings: () => ({}),
    }),
  },
}))

vi.mock('@/utils/track', () => ({
  trackEvent: trackEventMock,
}))

vi.mock('@/lib/utils', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/platform', () => ({
  default: {
    getConfig: vi.fn(async () => ({})),
    getImageGenerationStorage: vi.fn(() => ({
      getById: vi.fn(async () => ({ generatedImages: [] })),
    })),
  },
}))

vi.mock('@/storage', () => ({
  default: {
    setBlob: vi.fn(),
  },
}))

vi.mock('@/storage/StoreStorage', () => ({
  StorageKeyGenerator: {},
}))

describe('imageGenerationActions reference image payload', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    createRecordMock.mockResolvedValue({ id: 'record-1' })
    updateRecordMock.mockImplementation(async (id: string, patch: Record<string, unknown>) => ({ id, ...patch }))
    submitImageGenerationMock.mockResolvedValue({
      task_id: 'task-1',
      items: [{ status: 'pending' }],
    })
    pollTaskUntilCompleteMock.mockResolvedValue({
      items: [
        {
          status: 'completed',
          image_url: 'https://example.com/output.png',
        },
      ],
    })
    getImageMock.mockResolvedValue('data:image/png;base64,AAAA')
    paintMock.mockResolvedValue(['data:image/png;base64,OUTPUT'])
  })

  it('sends reference images as image_url entries for both URLs and stored images', async () => {
    const { createAndGenerate } = await import('./imageGenerationActions')

    await createAndGenerate({
      prompt: 'make a variation',
      referenceImages: ['https://example.com/reference.png', 'storage-key-1'],
      model: {
        provider: 'workspaice-ai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    await vi.waitFor(() => {
      expect(paintMock).toHaveBeenCalledTimes(1)
    })

    expect(paintMock).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [{ imageUrl: 'https://example.com/reference.png' }, { imageUrl: 'data:image/png;base64,AAAA' }],
      }),
      expect.any(AbortSignal),
      expect.any(Function)
    )
    expect(trackEventMock).toHaveBeenCalledWith(
      'generate_image',
      expect.objectContaining({ has_reference: true, path: 'direct' })
    )
  })

  it('stores structured error codes from WorkspAIce AI image generation failures', async () => {
    const { BaseError } = await import('@shared/models/errors')
    class StructuredImageGenerationError extends BaseError {
      public code = 20004
    }
    paintMock.mockRejectedValueOnce(new StructuredImageGenerationError('provider rejected request'))

    const { createAndGenerate } = await import('./imageGenerationActions')

    await createAndGenerate({
      prompt: 'make an image',
      referenceImages: [],
      model: {
        provider: 'workspaice-ai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    await vi.waitFor(() => {
      expect(updateRecordMock).toHaveBeenCalledWith(
        'record-1',
        expect.objectContaining({
          status: 'error',
          error: 'provider rejected request',
          errorCode: 20004,
        })
      )
    })
  })

  it('stores a direct-path error when the provider returns no generated images', async () => {
    paintMock.mockResolvedValueOnce([])

    const { createAndGenerate } = await import('./imageGenerationActions')

    await createAndGenerate({
      prompt: 'make an image',
      referenceImages: [],
      model: {
        provider: 'workspaice-ai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    await vi.waitFor(() => {
      expect(updateRecordMock).toHaveBeenCalledWith(
        'record-1',
        expect.objectContaining({
          status: 'error',
          error: 'All images failed to generate',
        })
      )
    })
  })
})
