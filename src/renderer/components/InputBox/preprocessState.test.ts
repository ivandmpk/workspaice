import { describe, expect, it, vi } from 'vitest'
import { StorageKeyGenerator } from '@/storage/StoreStorage'
import type { PreConstructedMessageState } from '../../types/input-box'
import {
  cleanupFile,
  cleanupLink,
  markFileProcessing,
  markLinkProcessing,
  onFileProcessed,
  onLinkProcessed,
  storeFilePromise,
  storeLinkPromise,
} from './preprocessState'

vi.mock('@/platform', () => ({
  default: {
    getStorageType: () => 'test',
  },
}))

function createState(file: File, fileKey: string): PreConstructedMessageState {
  return {
    draftMessageId: 'draft-1',
    text: '',
    pictureKeys: [],
    attachments: [file],
    links: [],
    preprocessedFiles: [
      {
        file,
        content: 'content',
        storageKey: fileKey,
      },
    ],
    preprocessedLinks: [],
    preprocessingStatus: {
      files: {
        [fileKey]: 'processing',
      },
      links: {},
    },
    preprocessingPromises: {
      files: new Map([[fileKey, Promise.resolve()]]),
      links: new Map(),
    },
  }
}

describe('cleanupFile', () => {
  it('removes a file when native path lookup changes the file key during deletion', () => {
    const file = new File(['content'], 'document.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      lastModified: 1710000000000,
    })
    const originalFileKey = StorageKeyGenerator.fileUniqKey(file)
    const prev = createState(file, originalFileKey)

    Object.defineProperty(file, 'path', {
      value: '/tmp/document.docx',
      configurable: true,
    })
    const fileKeyAfterPathLookup = StorageKeyGenerator.fileUniqKey(file)

    const next = cleanupFile(prev, file, {
      fileKeys: [originalFileKey, fileKeyAfterPathLookup],
      removeAttachment: true,
    })

    expect(next.attachments).toEqual([])
    expect(next.preprocessedFiles).toEqual([])
    expect(next.preprocessingStatus.files[originalFileKey]).toBeUndefined()
    expect(next.preprocessingStatus.files[fileKeyAfterPathLookup]).toBeUndefined()
    expect(next.preprocessingPromises.files.has(originalFileKey)).toBe(false)
    expect(next.preprocessingPromises.files.has(fileKeyAfterPathLookup)).toBe(false)
  })
})

describe('onFileProcessed', () => {
  it('completes processing when native path lookup changes the file key', () => {
    const file = new File(['content'], 'document.pdf', {
      type: 'application/pdf',
      lastModified: 1710000000000,
    })
    const originalFileKey = StorageKeyGenerator.fileUniqKey(file)
    const prev = createState(file, originalFileKey)

    Object.defineProperty(file, 'path', {
      value: '/tmp/document.pdf',
      configurable: true,
    })
    const fileKeyAfterPathLookup = StorageKeyGenerator.fileUniqKey(file)

    const next = onFileProcessed(
      prev,
      file,
      {
        file,
        inputFileKey: originalFileKey,
        content: 'parsed content',
        storageKey: originalFileKey,
      },
      20,
      { fileKeys: [originalFileKey, fileKeyAfterPathLookup] }
    )

    expect(next.preprocessingStatus.files[originalFileKey]).toBe('completed')
    expect(next.preprocessingStatus.files[fileKeyAfterPathLookup]).toBeUndefined()
    expect(next.preprocessingPromises.files.has(originalFileKey)).toBe(false)
    expect(next.preprocessingPromises.files.has(fileKeyAfterPathLookup)).toBe(false)
    expect(next.preprocessedFiles.at(-1)?.inputFileKey).toBe(originalFileKey)
  })

  it('ignores stale completions after processing was cancelled', () => {
    const file = new File(['content'], 'cancelled.txt')
    const key = StorageKeyGenerator.fileUniqKey(file)
    const prev = createState(file, key)
    prev.preprocessingStatus.files[key] = undefined

    expect(onFileProcessed(prev, file, { file, inputFileKey: key, content: 'late', storageKey: key })).toBe(prev)
  })

  it('retains only the configured number of completed files', () => {
    const file = new File(['new'], 'new.txt')
    const key = StorageKeyGenerator.fileUniqKey(file)
    const prev = createState(file, key)

    const next = onFileProcessed(prev, file, { file, inputFileKey: key, content: 'new', storageKey: key }, 1)

    expect(next.preprocessedFiles).toHaveLength(1)
    expect(next.preprocessedFiles[0].content).toBe('new')
  })
})

describe('preprocessing state transitions', () => {
  it('tracks and removes immutable file promises', () => {
    const file = new File(['content'], 'tracked.txt')
    const key = StorageKeyGenerator.fileUniqKey(file)
    const initial = createState(file, key)
    initial.preprocessingPromises.files = new Map()
    const promise = Promise.resolve()

    const marked = markFileProcessing(initial, file)
    const stored = storeFilePromise(marked, file, promise)
    const cleaned = cleanupFile(stored, file, { removeAttachment: false })

    expect(marked).not.toBe(initial)
    expect(stored.preprocessingPromises.files.get(key)).toBe(promise)
    expect(initial.preprocessingPromises.files.size).toBe(0)
    expect(cleaned.attachments).toEqual([file])
    expect(cleaned.preprocessingPromises.files.has(key)).toBe(false)
  })

  it('tracks, completes, deduplicates, caps, and cleans links', () => {
    const url = 'https://example.test/docs'
    const otherUrl = 'https://example.test/old'
    const initial: PreConstructedMessageState = {
      draftMessageId: 'draft-links',
      text: '',
      pictureKeys: [],
      attachments: [],
      links: [{ url }],
      preprocessedFiles: [],
      preprocessedLinks: [
        { url, title: 'Old duplicate', content: 'old', storageKey: 'old-duplicate' },
        { url: otherUrl, title: 'Old', content: 'old', storageKey: 'old' },
      ],
      preprocessingStatus: { files: {}, links: {} },
      preprocessingPromises: { files: new Map(), links: new Map() },
    }
    const promise = Promise.resolve()

    const marked = markLinkProcessing(initial, url)
    const stored = storeLinkPromise(marked, url, promise)
    const completed = onLinkProcessed(stored, url, { url, title: 'New', content: 'new', storageKey: 'new' }, 1)
    const cleaned = cleanupLink(completed, url)

    expect(stored.preprocessingPromises.links.size).toBe(1)
    expect(completed.preprocessedLinks).toEqual([{ url, title: 'New', content: 'new', storageKey: 'new' }])
    expect(Object.values(completed.preprocessingStatus.links)).toContain('completed')
    expect(cleaned.preprocessedLinks).toEqual([])
    expect(cleaned.preprocessingPromises.links.size).toBe(0)
  })

  it('marks failed links and ignores late link completions', () => {
    const url = 'https://example.test/failure'
    const initial: PreConstructedMessageState = {
      draftMessageId: 'draft-links',
      text: '',
      pictureKeys: [],
      attachments: [],
      links: [],
      preprocessedFiles: [],
      preprocessedLinks: [],
      preprocessingStatus: { files: {}, links: {} },
      preprocessingPromises: { files: new Map(), links: new Map() },
    }

    const failedLink = { url, title: '', content: '', storageKey: 'failure', error: 'offline' }
    expect(onLinkProcessed(initial, url, failedLink)).toBe(initial)

    const failed = onLinkProcessed(markLinkProcessing(initial, url), url, failedLink)
    expect(Object.values(failed.preprocessingStatus.links)).toContain('error')
  })
})
