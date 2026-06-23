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
  IconLoader2,
  IconMessagePlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react'
import { useRouterState } from '@tanstack/react-router'
import { type CSSProperties, type MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { router } from '@/router'
import { sortSessionRecords } from '@/storage/SessionMetaStorage'
import {
  createSession as createSessionStore,
  getMetaStorage,
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
  const routerState = useRouterState()
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
            <Flex align="center" py="xs" px="md" gap="xs">
              <Text c="workspaice-tertiary" flex={1}>
                {t('Workspaces')}
              </Text>
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
            </Flex>

            {workspaces.map((workspace) => {
              const workspaceSessions = sessionsByWorkspace.get(workspace.id) ?? []
              return (
                <WorkspaceSection
                  key={workspace.id}
                  workspace={workspace}
                  sessions={workspaceSessions}
                  selectedSessionPath={routerState.location.pathname}
                />
              )
            })}

            <SessionSectionHeader
              label={t('Chat')}
              droppableId={getDroppableId(undefined)}
              actions={
                <>
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
              }
            />

            <SortableContext items={chatSessions.map((session) => session.id)} strategy={verticalListSortingStrategy}>
              {chatSessions.map((session) => (
                <SortableItem key={session.id} id={session.id}>
                  <SessionItem
                    selected={routerState.location.pathname === `/session/${session.id}`}
                    session={session}
                  />
                </SortableItem>
              ))}
            </SortableContext>

            {hasNextPage && (
              <Flex justify="center" py="xs">
                <IconLoader2 size={16} className="animate-spin" style={{ color: 'var(--mantine-color-dimmed)' }} />
              </Flex>
            )}
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
          </Box>
        )}
      </DndContext>
    </>
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

function WorkspaceSection(props: { workspace: Workspace; sessions: SessionMetaRecord[]; selectedSessionPath: string }) {
  const { workspace, sessions, selectedSessionPath } = props
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
      </Flex>

      {expanded && (
        <Box ml="md">
          <SortableContext items={sessions.map((session) => session.id)} strategy={verticalListSortingStrategy}>
            {sessions.map((session) => (
              <SortableItem key={session.id} id={session.id}>
                <SessionItem selected={selectedSessionPath === `/session/${session.id}`} session={session} />
              </SortableItem>
            ))}
          </SortableContext>
        </Box>
      )}
    </Box>
  )
}

function SortableItem(props: { id: string; children?: React.ReactNode }) {
  const { id, children } = props
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}
