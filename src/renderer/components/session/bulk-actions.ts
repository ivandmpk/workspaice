import type { SessionMetaRecord } from '@shared/types'

export interface BulkActionResult {
  succeededIds: string[]
  failedIds: string[]
}

export async function runBulkSessionAction(
  sessionIds: string[],
  action: (sessionId: string) => Promise<void>
): Promise<BulkActionResult> {
  const succeededIds: string[] = []
  const failedIds: string[] = []

  for (const sessionId of sessionIds) {
    try {
      await action(sessionId)
      succeededIds.push(sessionId)
    } catch {
      failedIds.push(sessionId)
    }
  }

  return { succeededIds, failedIds }
}

export function getBulkMoveSortOrders(
  orderedSessionIds: string[],
  sessions: SessionMetaRecord[],
  targetWorkspaceId: string | undefined,
  now = Date.now()
): Map<string, number> {
  const movingIds = new Set(orderedSessionIds)
  const highestDestinationOrder = sessions.reduce((highest, session) => {
    if (session.workspaceId !== targetWorkspaceId || movingIds.has(session.id)) {
      return highest
    }
    return Math.max(highest, session.sortOrder)
  }, 0)
  const firstOrder = Math.max(now, highestDestinationOrder) + orderedSessionIds.length * 1000

  return new Map(orderedSessionIds.map((sessionId, index) => [sessionId, firstOrder - index * 1000]))
}
