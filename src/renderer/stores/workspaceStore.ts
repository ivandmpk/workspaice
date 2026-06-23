import type { SessionMetaRecord, Workspace } from '@shared/types'
import { useQuery } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import storage, { StorageKey } from '@/storage'
import { sortSessionRecords } from '@/storage/SessionMetaStorage'
import { deleteSessions, getMetaStorage, listAllSessionsMeta, updateSession, updateSessionListData } from './chatStore'
import queryClient from './queryClient'

export const WorkspaceQueryKeys = {
  Workspaces: ['workspaces'],
}

function sortWorkspaces(workspaces: Workspace[]) {
  return [...workspaces].sort((a, b) => b.sortOrder - a.sortOrder)
}

async function readWorkspaces(): Promise<Workspace[]> {
  const workspaces = await storage.getItem<Workspace[]>(StorageKey.Workspaces, [])
  return sortWorkspaces(
    workspaces.filter((workspace) => workspace?.id && workspace.name && Number.isFinite(workspace.sortOrder))
  )
}

async function writeWorkspaces(workspaces: Workspace[]) {
  const sorted = sortWorkspaces(workspaces)
  await storage.setItemNow(StorageKey.Workspaces, sorted)
  queryClient.setQueryData(WorkspaceQueryKeys.Workspaces, sorted)
  return sorted
}

export function useWorkspaces() {
  return useQuery({
    queryKey: WorkspaceQueryKeys.Workspaces,
    queryFn: readWorkspaces,
    staleTime: Infinity,
  })
}

export async function listWorkspaces() {
  return await queryClient.fetchQuery({
    queryKey: WorkspaceQueryKeys.Workspaces,
    queryFn: readWorkspaces,
    staleTime: Infinity,
  })
}

export async function createWorkspace(name: string) {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Workspace name is required')
  }
  const workspaces = await listWorkspaces()
  const workspace: Workspace = {
    id: uuidv4(),
    name: trimmed,
    sortOrder: Date.now(),
    createdAt: Date.now(),
    expanded: true,
  }
  await writeWorkspaces([workspace, ...workspaces])
  return workspace
}

export async function updateWorkspace(workspaceId: string, updates: Partial<Pick<Workspace, 'name' | 'expanded'>>) {
  const workspaces = await listWorkspaces()
  const updated = workspaces.map((workspace) =>
    workspace.id === workspaceId
      ? {
          ...workspace,
          ...updates,
          name: updates.name === undefined ? workspace.name : updates.name.trim() || workspace.name,
        }
      : workspace
  )
  await writeWorkspaces(updated)
}

export async function deleteWorkspaceAndSessions(workspaceId: string) {
  const sessions = await listAllSessionsMeta()
  const sessionIds = sessions.filter((session) => session.workspaceId === workspaceId).map((session) => session.id)
  await deleteSessions(sessionIds)
  const workspaces = await listWorkspaces()
  await writeWorkspaces(workspaces.filter((workspace) => workspace.id !== workspaceId))
}

export async function reorderWorkspaces(oldIndex: number, newIndex: number) {
  const workspaces = await listWorkspaces()
  const movedWorkspace = workspaces[oldIndex]
  if (!movedWorkspace || oldIndex === newIndex) return

  const reordered = [...workspaces]
  reordered.splice(oldIndex, 1)
  reordered.splice(newIndex, 0, movedWorkspace)

  const before = reordered[newIndex - 1]
  const after = reordered[newIndex + 1]
  let sortOrder: number
  if (!before && !after) {
    sortOrder = Date.now()
  } else if (!before) {
    sortOrder = after.sortOrder + 1000
  } else if (!after) {
    sortOrder = before.sortOrder - 1000
  } else {
    sortOrder = (before.sortOrder + after.sortOrder) / 2
  }

  await writeWorkspaces(
    workspaces.map((workspace) => (workspace.id === movedWorkspace.id ? { ...workspace, sortOrder } : workspace))
  )
}

export function getWorkspaceSortOrder(
  sessions: SessionMetaRecord[],
  workspaceId: string | undefined,
  targetIndex: number,
  excludeSessionId?: string
) {
  const group = sortSessionRecords(
    sessions.filter((session) => session.workspaceId === workspaceId && session.id !== excludeSessionId)
  )
  const before = group[targetIndex - 1]
  const after = group[targetIndex]

  if (!before && !after) {
    return Date.now()
  }
  if (!before) {
    return after.sortOrder + 1000
  }
  if (!after) {
    return before.sortOrder - 1000
  }
  return (before.sortOrder + after.sortOrder) / 2
}

export async function moveSessionToWorkspace(
  sessionId: string,
  workspaceId: string | undefined,
  options: { sortOrder?: number } = {}
) {
  const nextWorkspaceId = workspaceId || undefined
  const updated = await updateSession(sessionId, { workspaceId: nextWorkspaceId })

  if (options.sortOrder !== undefined) {
    const metaStorage = await getMetaStorage()
    await metaStorage.update(sessionId, { workspaceId: nextWorkspaceId, sortOrder: options.sortOrder })
    updateSessionListData((items) =>
      sortSessionRecords(
        items.map((session) =>
          session.id === sessionId
            ? { ...session, workspaceId: nextWorkspaceId, sortOrder: options.sortOrder as number }
            : session
        )
      )
    )
  }

  return updated
}
