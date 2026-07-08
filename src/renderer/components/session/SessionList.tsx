import type { DragEndEvent } from '@dnd-kit/core'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import NiceModal from '@ebay/nice-modal-react'
import { ActionIcon, Box, Flex, Text, Tooltip } from '@mantine/core'
import type { SessionMetaRecord, Workspace } from '@shared/types'
import {
  IconArchive,
  IconChevronDown,
  IconChevronRight,
  IconDots,
  IconEdit,
  IconFolder,
  IconFolderOpen,
  IconFolderPlus,
  IconFolderSymlink,
  IconInbox,
  IconLoader2,
  IconMessagePlus,
  IconSearch,
  IconSquareCheck,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { useRouterState } from '@tanstack/react-router'
import { type CSSProperties, type MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { router } from '@/router'
import { sortSessionRecords } from '@/storage/SessionMetaStorage'
import {
  createSession as createSessionStore,
  deleteSession as deleteSessionStore,
  getMetaStorage,
  listAllSessionsMeta,
  updateSessionListData,
  useSessionList,
} from '@/stores/chatStore'
import { switchCurrentSession } from '@/stores/sessionActions'
import { initEmptyChatSession } from '@/stores/sessionHelpers'
import { useUIStore } from '@/stores/uiStore'
import {
  deleteWorkspaceAndSessions,
  getWorkspaceSortOrder,
  moveSessionToWorkspace,
  updateWorkspace,
  useWorkspaces,
} from '@/stores/workspaceStore'
import ActionMenu, { type ActionMenuItemProps } from '../ActionMenu'
import { ScalableIcon } from '../common/ScalableIcon'
import BulkDeleteChatsModal from './BulkDeleteChatsModal'
import { getBulkMoveSortOrders, runBulkSessionAction } from './bulk-actions'
import SessionItem from './SessionItem'

export interface Props {
  sessionListViewportRef: MutableRefObject<HTMLDivElement | null>
}

const WORKSPACE_DROPPABLE_PREFIX = 'workspace:'
const UNASSIGNED_WORKSPACE_ID = '__chat__'

function getDroppableId(workspaceId: string | undefined) {
  return `${WORKSPACE_DROPPABLE_PREFIX}${workspaceId ?? UNASSIGNED_WORKSPACE_ID}`
}

function getWorkspaceIdFromDroppableId(id: string) {
  if (!id.startsWith(WORKSPACE_DROPPABLE_PREFIX)) return null
  const raw = id.slice(WORKSPACE_DROPPABLE_PREFIX.length)
  return raw === UNASSIGNED_WORKSPACE_ID ? undefined : raw
}

function getSessionsForWorkspace(sessions: SessionMetaRecord[], workspaceId: string | undefined) {
  return sortSessionRecords(sessions.filter((session) => session.workspaceId === workspaceId))
}

function getSortOrderFromReorderedGroup(group: SessionMetaRecord[], sessionId: string) {
  const index = group.findIndex((session) => session.id === sessionId)
  const before = group[index - 1]
  const after = group[index + 1]
  if (index < 0) return Date.now()
  if (!before && !after) return Date.now()
  if (!before) return after.sortOrder + 1000
  if (!after) return before.sortOrder - 1000
  return (before.sortOrder + after.sortOrder) / 2
}

export default function SessionList(props: Props) {
  const { t } = useTranslation()
  const { sessionMetaList: sortedSessions, fetchNextPage, hasNextPage, isFetchingNextPage } = useSessionList()
  const { data: workspaces = [] } = useWorkspaces()
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(() => new Set())
  const [bulkAction, setBulkAction] = useState<'move' | 'delete' | null>(null)
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const setOpenSearchDialog = useUIStore((s) => s.setOpenSearchDialog)
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 10,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const onDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }
  const onDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null)
    if (!event.over) {
      return
    }
    if (!sortedSessions) {
      return
    }
    const activeId = String(event.active.id)
    const overId = String(event.over.id)
    const activeSession = sortedSessions.find((session) => session.id === activeId)
    if (!activeSession) return

    const targetWorkspaceFromDropzone = getWorkspaceIdFromDroppableId(overId)
    if (targetWorkspaceFromDropzone !== null) {
      const sortOrder = getWorkspaceSortOrder(sortedSessions, targetWorkspaceFromDropzone, 0, activeId)
      await moveSessionToWorkspace(activeId, targetWorkspaceFromDropzone, { sortOrder })
      if (targetWorkspaceFromDropzone) {
        await updateWorkspace(targetWorkspaceFromDropzone, { expanded: true })
      }
      return
    }

    if (activeId === overId) {
      return
    }

    const overSession = sortedSessions.find((session) => session.id === overId)
    if (!overSession) {
      return
    }

    const targetWorkspaceId = overSession.workspaceId
    const sameWorkspace = activeSession.workspaceId === targetWorkspaceId
    let sortOrder: number

    if (sameWorkspace) {
      const group = getSessionsForWorkspace(sortedSessions, targetWorkspaceId)
      const oldIndex = group.findIndex((session) => session.id === activeId)
      const newIndex = group.findIndex((session) => session.id === overId)
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return
      const reordered = [...group]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)
      sortOrder = getSortOrderFromReorderedGroup(reordered, activeId)
    } else {
      const targetGroup = getSessionsForWorkspace(sortedSessions, targetWorkspaceId).filter(
        (session) => session.id !== activeId
      )
      const targetIndex = Math.max(
        0,
        targetGroup.findIndex((session) => session.id === overId)
      )
      sortOrder = getWorkspaceSortOrder(sortedSessions, targetWorkspaceId, targetIndex, activeId)
    }

    await moveSessionToWorkspace(activeId, targetWorkspaceId, { sortOrder })
    if (targetWorkspaceId) {
      await updateWorkspace(targetWorkspaceId, { expanded: true })
    }
  }
  const onDragCancel = () => {
    setActiveDragId(null)
  }
  const activeDragSession = useMemo(
    () => sortedSessions?.find((session) => session.id === activeDragId),
    [activeDragId, sortedSessions]
  )
  const chatSessions = useMemo(() => getSessionsForWorkspace(sortedSessions ?? [], undefined), [sortedSessions])
  const sessionsByWorkspace = useMemo(() => {
    const map = new Map<string, SessionMetaRecord[]>()
    for (const workspace of workspaces) {
      map.set(workspace.id, getSessionsForWorkspace(sortedSessions ?? [], workspace.id))
    }
    return map
  }, [sortedSessions, workspaces])
  const orderedSessions = useMemo(
    () => [...workspaces.flatMap((workspace) => sessionsByWorkspace.get(workspace.id) ?? []), ...chatSessions],
    [chatSessions, sessionsByWorkspace, workspaces]
  )
  const selectedSessions = useMemo(
    () => orderedSessions.filter((session) => selectedSessionIds.has(session.id)),
    [orderedSessions, selectedSessionIds]
  )
  const orderedSelectedIds = useMemo(() => selectedSessions.map((session) => session.id), [selectedSessions])
  const routerState = useRouterState()
  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedSessionIds(new Set())
    setDeleteModalOpened(false)
  }, [])
  const toggleSessionSelection = useCallback((sessionId: string) => {
    setSelectedSessionIds((current) => {
      const next = new Set(current)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }, [])
  const finishBulkAction = useCallback(
    (result: { succeededIds: string[]; failedIds: string[] }, action: 'move' | 'delete') => {
      const succeededCount = result.succeededIds.length
      const failedCount = result.failedIds.length

      if (failedCount === 0) {
        toast.success(
          action === 'move'
            ? t(succeededCount === 1 ? 'Moved 1 chat' : 'Moved {{count}} chats', { count: succeededCount })
            : t(succeededCount === 1 ? 'Deleted 1 chat' : 'Deleted {{count}} chats', { count: succeededCount })
        )
        exitSelectionMode()
        return
      }

      if (succeededCount > 0) {
        toast.error(
          action === 'move'
            ? t(
                succeededCount === 1
                  ? 'Moved 1 chat; {{failedCount}} failed.'
                  : 'Moved {{successCount}} chats; {{failedCount}} failed.',
                { successCount: succeededCount, failedCount }
              )
            : t(
                succeededCount === 1
                  ? 'Deleted 1 chat; {{failedCount}} failed.'
                  : 'Deleted {{successCount}} chats; {{failedCount}} failed.',
                { successCount: succeededCount, failedCount }
              )
        )
      } else {
        toast.error(action === 'move' ? t('Failed to move selected chats.') : t('Failed to delete selected chats.'))
      }
      setSelectedSessionIds(new Set(result.failedIds))
    },
    [exitSelectionMode, t]
  )
  const moveSelectedSessions = useCallback(
    async (targetWorkspaceId: string | undefined) => {
      if (orderedSelectedIds.length === 0 || bulkAction) return
      setBulkAction('move')
      try {
        const allSessions = await listAllSessionsMeta()
        const sortOrders = getBulkMoveSortOrders(orderedSelectedIds, allSessions, targetWorkspaceId)
        const result = await runBulkSessionAction(orderedSelectedIds, async (sessionId) => {
          const sortOrder = sortOrders.get(sessionId)
          if (sortOrder === undefined) throw new Error(`Missing sort order for session ${sessionId}`)
          await moveSessionToWorkspace(sessionId, targetWorkspaceId, { sortOrder })
        })
        if (targetWorkspaceId && result.succeededIds.length > 0) {
          try {
            await updateWorkspace(targetWorkspaceId, { expanded: true })
          } catch (error) {
            console.warn('Moved chats but failed to expand the destination workspace:', error)
          }
        }
        finishBulkAction(result, 'move')
      } catch (error) {
        console.error('Failed to move selected chats:', error)
        toast.error(t('Failed to move selected chats.'))
      } finally {
        setBulkAction(null)
      }
    },
    [bulkAction, finishBulkAction, orderedSelectedIds, t]
  )
  const deleteSelectedSessions = useCallback(async () => {
    if (orderedSelectedIds.length === 0 || bulkAction) return
    setBulkAction('delete')
    try {
      const result = await runBulkSessionAction(orderedSelectedIds, deleteSessionStore)
      setDeleteModalOpened(false)
      const currentSessionId = routerState.location.pathname.match(/^\/session\/([^/]+)$/)?.[1]
      if (currentSessionId && result.succeededIds.includes(currentSessionId)) {
        void router.navigate({ to: '/', replace: true })
      }
      finishBulkAction(result, 'delete')
    } catch (error) {
      console.error('Failed to delete selected chats:', error)
      toast.error(t('Failed to delete selected chats.'))
    } finally {
      setBulkAction(null)
    }
  }, [bulkAction, finishBulkAction, orderedSelectedIds, routerState.location.pathname, t])
  const moveMenuItems = useMemo<ActionMenuItemProps[]>(
    () => [
      {
        text: t('Chat'),
        icon: IconInbox,
        disabled: selectedSessions.length > 0 && selectedSessions.every((session) => !session.workspaceId),
        onClick: () => void moveSelectedSessions(undefined),
      },
      ...workspaces.map<ActionMenuItemProps>((workspace) => ({
        text: workspace.name,
        icon: IconFolder,
        disabled:
          selectedSessions.length > 0 && selectedSessions.every((session) => session.workspaceId === workspace.id),
        onClick: () => void moveSelectedSessions(workspace.id),
      })),
    ],
    [moveSelectedSessions, selectedSessions, t, workspaces]
  )
  useEffect(() => {
    if (!selectionMode) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleteModalOpened && !bulkAction) {
        exitSelectionMode()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bulkAction, deleteModalOpened, exitSelectionMode, selectionMode])
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  const onScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget
      if (target.scrollHeight - target.scrollTop - target.clientHeight < 80) {
        onEndReached()
      }
    },
    [onEndReached]
  )
  useEffect(() => {
    const target = props.sessionListViewportRef.current
    if (!target || !hasNextPage || isFetchingNextPage) return
    if (target.scrollHeight <= target.clientHeight) {
      void fetchNextPage()
    }
  })

  return (
    <>
      <DndContext
        modifiers={[restrictToVerticalAxis]}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        {sortedSessions && (
          <Box
            ref={props.sessionListViewportRef}
            onScroll={onScroll}
            style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
          >
            {selectionMode && (
              <BulkSelectionToolbar
                selectedCount={selectedSessionIds.size}
                bulkAction={bulkAction}
                moveMenuItems={moveMenuItems}
                onDelete={() => setDeleteModalOpened(true)}
                onCancel={exitSelectionMode}
              />
            )}

            <Flex align="center" py="xs" px="md" gap="xs">
              <Text c="workspaice-tertiary" flex={1}>
                {t('Workspaces')}
              </Text>
              {!selectionMode && (
                <Tooltip label={t('New Workspace')} openDelay={1000} withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="workspaice-tertiary"
                    size={24}
                    aria-label={t('New Workspace')}
                    data-testid="new-workspace-button"
                    onClick={() => NiceModal.show('workspace-edit')}
                  >
                    <IconFolderPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Flex>

            {workspaces.map((workspace) => {
              const workspaceSessions = sessionsByWorkspace.get(workspace.id) ?? []
              return (
                <WorkspaceSection
                  key={workspace.id}
                  workspace={workspace}
                  sessions={workspaceSessions}
                  selectedSessionPath={routerState.location.pathname}
                  selectionMode={selectionMode}
                  selectedSessionIds={selectedSessionIds}
                  onToggleSession={toggleSessionSelection}
                />
              )
            })}

            <SessionSectionHeader
              label={t('Chat')}
              droppableId={getDroppableId(undefined)}
              actions={
                !selectionMode ? (
                  <>
                    <Tooltip label={t('Select chats')} openDelay={1000} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="workspaice-tertiary"
                        size={24}
                        aria-label={t('Select chats')}
                        data-testid="select-chats-button"
                        onClick={() => setSelectionMode(true)}
                      >
                        <IconSquareCheck size={18} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label={t('Search')} openDelay={1000} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="workspaice-tertiary"
                        size={24}
                        aria-label={t('Search')}
                        onClick={() => setOpenSearchDialog(true, true)}
                      >
                        <IconSearch size={18} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label={t('Clear Conversation List')} openDelay={1000} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="workspaice-tertiary"
                        size={24}
                        aria-label={t('Clear Conversation List')}
                        onClick={() => NiceModal.show('clear-session-list')}
                      >
                        <IconArchive size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </>
                ) : undefined
              }
            />

            <SortableContext items={chatSessions.map((session) => session.id)} strategy={verticalListSortingStrategy}>
              {chatSessions.map((session) => (
                <SortableItem key={session.id} id={session.id} disabled={selectionMode}>
                  <SessionItem
                    selected={routerState.location.pathname === `/session/${session.id}`}
                    session={session}
                    selectionMode={selectionMode}
                    bulkSelected={selectedSessionIds.has(session.id)}
                    onToggleSelection={toggleSessionSelection}
                  />
                </SortableItem>
              ))}
            </SortableContext>

            {hasNextPage && (
              <Flex justify="center" py="xs">
                <IconLoader2 size={16} className="animate-spin" style={{ color: 'var(--mantine-color-dimmed)' }} />
              </Flex>
            )}
            {!selectionMode && (
              <DragOverlay>
                {activeDragSession ? (
                  <div className="pointer-events-none">
                    <SessionItem
                      selected={routerState.location.pathname === `/session/${activeDragSession.id}`}
                      session={activeDragSession}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            )}
          </Box>
        )}
      </DndContext>

      <BulkDeleteChatsModal
        opened={deleteModalOpened}
        count={selectedSessionIds.size}
        loading={bulkAction === 'delete'}
        onClose={() => {
          if (!bulkAction) setDeleteModalOpened(false)
        }}
        onConfirm={() => void deleteSelectedSessions()}
      />
    </>
  )
}

function BulkSelectionToolbar(props: {
  selectedCount: number
  bulkAction: 'move' | 'delete' | null
  moveMenuItems: ActionMenuItemProps[]
  onDelete: () => void
  onCancel: () => void
}) {
  const { selectedCount, bulkAction, moveMenuItems, onDelete, onCancel } = props
  const { t } = useTranslation()
  const noSelection = selectedCount === 0

  return (
    <Flex
      align="center"
      py="xs"
      px="md"
      gap="xs"
      data-testid="bulk-selection-toolbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        backgroundColor: 'var(--workspaice-background-primary)',
      }}
    >
      <Text c="workspaice-tertiary" flex={1} aria-live="polite">
        {noSelection
          ? t('Select chats')
          : t(selectedCount === 1 ? '1 selected' : '{{count}} selected', { count: selectedCount })}
      </Text>

      <Tooltip label={t('Move selected chats')} openDelay={500} withArrow>
        <Box>
          <ActionMenu type="desktop" items={moveMenuItems} position="bottom-start">
            <ActionIcon
              variant="subtle"
              color="workspaice-tertiary"
              size={24}
              aria-label={t('Move selected chats')}
              data-testid="move-selected-chats-button"
              disabled={noSelection || bulkAction !== null}
            >
              {bulkAction === 'move' ? (
                <IconLoader2 size={18} className="animate-spin" />
              ) : (
                <IconFolderSymlink size={18} />
              )}
            </ActionIcon>
          </ActionMenu>
        </Box>
      </Tooltip>

      <Tooltip label={t('Delete selected chats')} openDelay={500} withArrow>
        <ActionIcon
          variant="subtle"
          color="workspaice-error"
          size={24}
          aria-label={t('Delete selected chats')}
          data-testid="delete-selected-chats-button"
          disabled={noSelection || bulkAction !== null}
          onClick={onDelete}
        >
          {bulkAction === 'delete' ? <IconLoader2 size={18} className="animate-spin" /> : <IconTrash size={18} />}
        </ActionIcon>
      </Tooltip>

      <Tooltip label={t('Cancel selection')} openDelay={500} withArrow>
        <ActionIcon
          variant="subtle"
          color="workspaice-tertiary"
          size={24}
          aria-label={t('Cancel selection')}
          data-testid="cancel-chat-selection-button"
          disabled={bulkAction !== null}
          onClick={onCancel}
        >
          <IconX size={18} />
        </ActionIcon>
      </Tooltip>
    </Flex>
  )
}

function SessionSectionHeader(props: { label: string; droppableId: string; actions?: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: props.droppableId })

  return (
    <Flex
      ref={setNodeRef}
      align="center"
      py="xs"
      px="md"
      gap="xs"
      className={isOver ? 'bg-workspaice-background-brand-secondary' : undefined}
    >
      <Text c="workspaice-tertiary" flex={1}>
        {props.label}
      </Text>
      {props.actions}
    </Flex>
  )
}

function WorkspaceSection(props: {
  workspace: Workspace
  sessions: SessionMetaRecord[]
  selectedSessionPath: string
  selectionMode: boolean
  selectedSessionIds: Set<string>
  onToggleSession: (sessionId: string) => void
}) {
  const { workspace, sessions, selectedSessionPath, selectionMode, selectedSessionIds, onToggleSession } = props
  const { t } = useTranslation()
  const { isOver, setNodeRef } = useDroppable({ id: getDroppableId(workspace.id) })
  const expanded = workspace.expanded !== false
  const selectedSessionInWorkspace = sessions.some((session) => selectedSessionPath === `/session/${session.id}`)
  const [menuOpened, setMenuOpened] = useState(false)
  const [newChatHovered, setNewChatHovered] = useState(false)
  const isSmallScreen = useIsSmallScreen()

  const actionMenuItems = useMemo<ActionMenuItemProps[]>(
    () => [
      {
        text: t('Rename'),
        icon: IconEdit,
        testId: `workspace-rename-${workspace.id}`,
        onClick: () => {
          void NiceModal.show('workspace-edit', { workspace })
        },
      },
      {
        doubleCheck: {
          text: t('Delete Workspace and Chats?') || 'Delete Workspace and Chats?',
          color: 'workspaice-error',
        },
        text: t('Delete'),
        icon: IconTrash,
        testId: `workspace-delete-${workspace.id}`,
        onClick: async () => {
          await deleteWorkspaceAndSessions(workspace.id)
          if (selectedSessionInWorkspace) {
            router.navigate({ to: '/', replace: true })
          }
        },
      },
    ],
    [selectedSessionInWorkspace, t, workspace]
  )

  const onNewChatClick = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation()
      event.preventDefault()
      const sortOrder = getWorkspaceSortOrder(sessions, workspace.id, 0)
      const newSession = await createSessionStore({
        ...initEmptyChatSession(),
        workspaceId: workspace.id,
      })
      const metaStorage = await getMetaStorage()
      await metaStorage.update(newSession.id, { workspaceId: workspace.id, sortOrder })
      updateSessionListData((items) =>
        sortSessionRecords(
          items.map((session) =>
            session.id === newSession.id ? { ...session, workspaceId: workspace.id, sortOrder } : session
          )
        )
      )
      if (!expanded) {
        await updateWorkspace(workspace.id, { expanded: true })
      }
      switchCurrentSession(newSession.id)
    },
    [expanded, sessions, workspace.id]
  )

  return (
    <Box ref={setNodeRef} className={isOver ? 'bg-workspaice-background-brand-secondary' : undefined}>
      <Flex
        align="center"
        className="cursor-pointer rounded-sm group/workspace-item hover:bg-workspaice-background-gray-secondary"
        data-testid={`workspace-row-${workspace.id}`}
        mx="xs"
        px="xs"
        py={8}
        gap={8}
        onClick={() => void updateWorkspace(workspace.id, { expanded: !expanded })}
      >
        <ScalableIcon
          icon={expanded ? IconChevronDown : IconChevronRight}
          size={14}
          className="text-workspaice-tertiary"
        />
        <ScalableIcon icon={expanded ? IconFolderOpen : IconFolder} size={18} className="text-workspaice-primary" />
        <Text span flex={1} lineClamp={1} c="workspaice-primary" fw={500}>
          {workspace.name}
        </Text>
        <Text span size="xs" c="workspaice-tertiary">
          {sessions.length}
        </Text>
        {!selectionMode && (
          <Tooltip label={t('New Chat in Workspace')} openDelay={1000} withArrow>
            <ActionIcon
              variant="subtle"
              size={24}
              color="workspaice-tertiary"
              aria-label={t('New Chat in Workspace')}
              data-testid={`new-chat-in-workspace-${workspace.id}`}
              className={
                isSmallScreen || newChatHovered || menuOpened ? '' : 'group-hover/workspace-item:visible invisible'
              }
              onClick={onNewChatClick}
              onMouseEnter={() => setNewChatHovered(true)}
              onMouseLeave={() => setNewChatHovered(false)}
            >
              <ScalableIcon icon={IconMessagePlus} className="text-inherit" size={16} />
            </ActionIcon>
          </Tooltip>
        )}
        {!selectionMode && (
          <ActionMenu
            type="desktop"
            items={actionMenuItems}
            position="bottom-start"
            opened={menuOpened}
            onChange={(opened) => setMenuOpened(opened)}
          >
            <ActionIcon
              variant="transparent"
              size={24}
              color="workspaice-tertiary"
              aria-label={t('Workspace actions')}
              className={isSmallScreen || menuOpened ? '' : 'group-hover/workspace-item:visible invisible'}
              onClick={(event) => {
                event.stopPropagation()
                event.preventDefault()
              }}
            >
              <ScalableIcon icon={IconDots} className="text-inherit" size={16} />
            </ActionIcon>
          </ActionMenu>
        )}
      </Flex>

      {expanded && (
        <Box ml="md">
          <SortableContext items={sessions.map((session) => session.id)} strategy={verticalListSortingStrategy}>
            {sessions.map((session) => (
              <SortableItem key={session.id} id={session.id} disabled={selectionMode}>
                <SessionItem
                  selected={selectedSessionPath === `/session/${session.id}`}
                  session={session}
                  selectionMode={selectionMode}
                  bulkSelected={selectedSessionIds.has(session.id)}
                  onToggleSelection={onToggleSession}
                />
              </SortableItem>
            ))}
          </SortableContext>
        </Box>
      )}
    </Box>
  )
}

function SortableItem(props: { id: string; disabled?: boolean; children?: React.ReactNode }) {
  const { id, disabled = false, children } = props
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style} {...(!disabled ? attributes : {})} {...(!disabled ? listeners : {})}>
      {children}
    </div>
  )
}
