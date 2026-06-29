import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  detect: vi.fn<(input: Uint8Array) => string | null>(() => 'utf8'),
  officeParse: vi.fn(),
  epub: {
    metadata: {} as { title?: string; creator?: string; language?: string },
    chapters: [] as Array<{ id: string; content: string | Error }>,
    parseError: undefined as Error | undefined,
  },
}))

vi.mock('chardet', () => ({ detect: mocks.detect }))
vi.mock('officeparser', () => ({ default: { parseOfficeAsync: mocks.officeParse } }))
vi.mock('epub', () => ({
  default: class EpubMock {
    metadata = mocks.epub.metadata
    flow = mocks.epub.chapters.map(({ id }) => ({ id }))
    private listeners = new Map<string, (value?: Error) => void>()

    on(event: string, callback: (value?: Error) => void) {
      this.listeners.set(event, callback)
    }

    parse() {
      queueMicrotask(() => {
        if (mocks.epub.parseError) this.listeners.get('error')?.(mocks.epub.parseError)
        else this.listeners.get('end')?.()
      })
    }

    getChapter(id: string, callback: (error: Error | null, text?: string) => void) {
      const chapter = mocks.epub.chapters.find((item) => item.id === id)
      queueMicrotask(() => {
        if (!chapter) callback(new Error('missing chapter'))
        else if (chapter.content instanceof Error) callback(chapter.content)
        else callback(null, chapter.content)
      })
    }
  },
}))

import { parseEpub, parseFile } from './file-parser'

let tempDirectory: string

describe('main-process file parser', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mocks.epub.metadata = {}
    mocks.epub.chapters = []
    mocks.epub.parseError = undefined
    tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'workspaice-parser-'))
  })

  afterEach(async () => {
    await fs.rm(tempDirectory, { recursive: true, force: true })
  })

  it('detects and decodes regular text files', async () => {
    const filePath = path.join(tempDirectory, 'notes.txt')
    await fs.writeFile(filePath, 'hello\nworld')

    await expect(parseFile(filePath)).resolves.toBe('hello\nworld')
    expect(mocks.detect).toHaveBeenCalledOnce()
    expect((mocks.detect.mock.calls[0][0] as Uint8Array).byteLength).toBe(11)
  })

  it('delegates office documents and propagates parser errors', async () => {
    mocks.officeParse.mockResolvedValueOnce('office text').mockRejectedValueOnce(new Error('invalid office file'))

    await expect(parseFile('/tmp/document.docx')).resolves.toBe('office text')
    await expect(parseFile('/tmp/broken.pptx')).rejects.toThrow('invalid office file')
  })

  it('extracts readable EPUB chapters, decodes entities, and skips broken chapters', async () => {
    mocks.epub.metadata = { title: 'Book', creator: 'Author', language: 'en' }
    mocks.epub.chapters = [
      { id: 'one', content: '<h1>Hello &amp; &#x77;orld</h1>' },
      { id: 'broken', content: new Error('bad chapter') },
      { id: 'two', content: '<p>Second&nbsp;chapter</p>' },
    ]

    await expect(parseEpub('/tmp/book.epub')).resolves.toBe('Hello & world\n\nSecond chapter')
  })

  it('rejects EPUB parser errors and books with no readable text', async () => {
    mocks.epub.parseError = new Error('invalid epub')
    await expect(parseEpub('/tmp/broken.epub')).rejects.toThrow('invalid epub')

    mocks.epub.parseError = undefined
    mocks.epub.chapters = [{ id: 'empty', content: '<p> </p>' }]
    await expect(parseEpub('/tmp/empty.epub')).rejects.toThrow('No readable text content found')
  })
})
