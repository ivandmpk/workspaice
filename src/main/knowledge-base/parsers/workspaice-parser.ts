import type { DocumentParserType } from '../../../shared/types/settings'
import { parseFileRemotely } from '../remote-file-parser'
import type { DocumentParser, ParserFileMeta } from './types'

/**
 * Hosted document parsing is disabled in the local-only build.
 */
export class WorkspAIceParser implements DocumentParser {
  readonly type: DocumentParserType = 'workspaice-ai'

  async parse(filePath: string, meta: ParserFileMeta): Promise<string> {
    return await parseFileRemotely(filePath, meta.filename, meta.mimeType)
  }
}
