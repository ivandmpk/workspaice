import NiceModal from '@ebay/nice-modal-react'
import { ActionIcon, Flex, Text } from '@mantine/core'
import type { SessionMeta } from '@shared/types'
import {
  IconCopy,
  IconDots,
  IconEdit,
  IconFolder,
  IconInbox,
  IconStar,
  IconStarFilled,
  IconTrash,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { memo, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { router } from '@/router'
import {
  deleteSession as deleteSessionStore,
  getSession,
  updateSession as updateSessionStore,
} from '@/stores/chatStore'
import { copyAndSwitchSession, switchCurrentSession } from '@/stores/sessionActions'
import { useUIStore } from '@/stores/uiStore'
import { moveSessionToWorkspace, useWorkspaces } from '@/stores/workspaceStore'
import ActionMenu, { type ActionMenuItemProps } from '../ActionMenu'
import { AssistantAvatar } from '../common/Avatar'
import { ScalableIcon } from '../common/ScalableIcon'

export interface Props {
  session: SessionMeta
  selected: boolean
}

function SessionItem(props: Props) {
  const { session, selected } = props
  const { t } = useTranslation()
  const setShowSidebar = useUIStore((s) => s.setShowSidebar)
  const onClick = () => {
    switchCurrentSession(session.id)
    if (isSmallScreen) {
      setShowSidebar(false)
    }
  }
  const isSmallScreen = useIsSmallScreen()
  // const smallSize = theme.typography.pxToRem(20)

  const [menuOpened, setMenuOpened] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deletingRef = useRef(false)
  const { data: workspaces = [] } = useWorkspaces()

  const actionMenuItems = useMemo<ActionMenuItemProps[]>(() => {
    const moveItems: ActionMenuItemProps[] = [
      { divider: true },
      {
        text: t('Move to Workspace'),
        icon: IconInbox,
        disabled: !session.workspaceId,
        onClick: () => {
          void moveSessionToWorkspace(session.id, undefined)
        },
      },
      ...workspaces.map<ActionMenuItemProps>((workspace) => ({
        text: workspace.name,
        icon: IconFolder,
        disabled: session.workspaceId === workspace.id,
        onClick: () => {
          void moveSessionToWorkspace(session.id, workspace.id)
        },
      })),
    ]

    return [
      {
        text: t('Edit'),
        icon: IconEdit,
        onClick: async () => {
          await NiceModal.show('session-settings', {
            session: await getSession(session.id),
          })
        },
      },
      {
        text: t('Copy'),
        icon: IconCopy,
        onClick: () => {
          copyAndSwitchSession(session)
        },
      },
      {
        text: session.starred ? t('Unstar') : t('Star'),
        icon: session.starred ? IconStarFilled : IconStar,
        onClick: () => {
          void updateSessionStore(session.id, { starred: !session.starred })
        },
      },
      ...moveItems,
      { divider: true },
      {
        doubleCheck: true,
        text: t('Delete'),
        icon: IconTrash,
        disabled: deleting,
        onClick: async () => {
          if (deletingRef.current) {
            return
          }
          deletingRef.current = true
          setDeleting(true)
          try {
            await deleteSessionStore(session.id)
            // Only navigate if deleting the currently selected session
            if (selected) {
              router.navigate({ to: '/', replace: true })
            }
          } catch (error) {
            console.error('Failed to delete session:', error)
            deletingRef.current = false
            setDeleting(false)
          }
        },
      },
    ]
  }, [session, selected, t, deleting, workspaces])

  return (
    <Flex
      align="center"
      className={clsx(
        'cursor-pointer rounded-sm group/session-item',
        isSmallScreen
          ? ''
          : selected
            ? 'bg-workspaice-background-brand-secondary'
            : 'hover:bg-workspaice-background-gray-secondary'
      )}
      mx="xs"
      px="xs"
      py={10}
      gap={10}
      onClick={onClick}
    >
      <AssistantAvatar
        avatarKey={session.assistantAvatarKey}
        picUrl={session.picUrl}
        sessionType={session.type}
        size="sm"
        type="chat"
        c={selected ? 'workspaice-brand' : 'workspaice-primary'}
      />

      <Text span flex={1} lineClamp={1} c={selected ? 'workspaice-brand' : 'workspaice-primary'}>
        {session.name}
      </Text>

      <ActionMenu
        type="desktop"
        items={actionMenuItems}
        position="bottom-start"
        opened={menuOpened}
        onChange={(opened) => setMenuOpened(opened)}
      >
        <ActionIcon
          variant="transparent"
          size={20}
          color={session.starred ? 'workspaice-brand' : 'workspaice-tertiary'}
          className={isSmallScreen || session.starred || menuOpened ? '' : 'group-hover/session-item:visible invisible'}
          onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()
          }}
        >
          {session.starred ? (
            <ScalableIcon icon={IconStarFilled} className="text-inherit" size={16} />
          ) : (
            <ScalableIcon icon={IconDots} className="text-inherit" size={16} />
          )}
        </ActionIcon>
      </ActionMenu>
    </Flex>
  )
}

export default memo(SessionItem)
