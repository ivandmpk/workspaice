/**
 * ActionButton - Reusable button for login and provider settings actions
 */

import { Box, Button, Flex, Text } from '@mantine/core'
import { IconCirclePlus, IconExternalLink, IconId, IconInfoCircle, IconSettings } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { trackJkClickEvent } from '@/analytics/jk'
import { JK_EVENTS, JK_PAGE_NAMES } from '@/analytics/jk-events'
import { ScalableIcon } from '@/components/common/ScalableIcon'
import { navigateToSettings } from '@/modals/Settings'

interface LoginButtonProps {
  onLoginSuccess: () => void
}

const GUIDE_ACTION_BUTTON_MAX_WIDTH = 320
const guideActionButtonWidthStyle = {
  width: '100%',
  maxWidth: GUIDE_ACTION_BUTTON_MAX_WIDTH,
} as const

export function LoginButton({ onLoginSuccess }: LoginButtonProps) {
  const { t } = useTranslation()
  const [hasSucceeded, setHasSucceeded] = useState(false)

  const trackLoginButtonClick = useCallback(() => {
    trackJkClickEvent(JK_EVENTS.LOGIN_BUTTON_CLICK, {
      pageName: JK_PAGE_NAMES.HELP_PAGE,
    })
  }, [])

  return (
    <Flex mt="md" style={guideActionButtonWidthStyle}>
      <Button
        onClick={() => {
          trackLoginButtonClick()
          navigateToSettings('/provider')
          setHasSucceeded(true)
          onLoginSuccess()
        }}
        disabled={hasSucceeded}
        variant="light"
        color={hasSucceeded ? 'green' : undefined}
        fullWidth
        h={42}
      >
        {hasSucceeded ? t('Setup Complete') : t('Configure Provider')}
      </Button>
    </Flex>
  )
}

export function ProviderSettingsButton() {
  const { t } = useTranslation()

  return (
    <Flex mt="md">
      <Button
        leftSection={<ScalableIcon icon={IconSettings} size={18} />}
        onClick={() => navigateToSettings('/provider')}
        variant="outline"
      >
        {t('Open Provider Settings')}
      </Button>
    </Flex>
  )
}

/**
 * 普通"新对话"按钮，用于引导完成后的正常跳转场景（登录成功、对话轮次上限等）
 * 对应 tool: show_new_chat_button（客户端本地生成）
 */
interface NewChatButtonProps {
  label?: string
}

export function NewChatButton({ label }: NewChatButtonProps = {}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Flex mt="md" style={guideActionButtonWidthStyle}>
      <Button variant="light" fullWidth h={42} onClick={() => navigate({ to: '/' })}>
        <ScalableIcon icon={IconCirclePlus} className="mr-2" />
        {label ?? t('New Chat')}
      </Button>
    </Flex>
  )
}

/**
 * 提示 block，用于用户误将引导助手当作普通对话时的引导提醒
 * 对应 tool: show_new_chat_tip（后端 AI 判断用户偏离话题时返回）
 */
export function NewChatTip() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Box
      mt="md"
      p="md"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        background: 'var(--mantine-color-yellow-light)',
        border: '1px solid var(--mantine-color-yellow-light-color)',
      }}
    >
      <Flex align="center" gap="xs" mb={4}>
        <IconInfoCircle size={18} style={{ color: 'var(--mantine-color-yellow-8)', flexShrink: 0 }} />
        <Text size="sm" fw={600} style={{ color: 'var(--mantine-color-yellow-8)' }}>
          {t('This is the onboarding assistant')}
        </Text>
      </Flex>
      <Flex align="center" gap={6} wrap="wrap">
        <Text size="sm" c="dimmed">
          {t('For general conversations, please click')}
        </Text>
        <Button variant="light" size="compact-sm" onClick={() => navigate({ to: '/' })}>
          <ScalableIcon icon={IconCirclePlus} className="mr-1" />
          {t('New Chat')}
        </Button>
        <Text size="sm" c="dimmed">
          {t('on the side bar to start a new conversation.')}
        </Text>
      </Flex>
    </Box>
  )
}

export function ViewLicenseButton() {
  const { t } = useTranslation()

  return (
    <Flex mt="xs" style={guideActionButtonWidthStyle}>
      <Button variant="light" fullWidth h={42} onClick={() => navigateToSettings('/provider')}>
        <ScalableIcon icon={IconId} className="mr-2" />
        {t('Open Provider Settings')}
      </Button>
    </Flex>
  )
}

interface FreeTrialLinkProps {
  /** Optional hook that fires after the link successfully opens — used by the guide flow to start polling. */
  onAfterClick?: () => void
}

export function FreeTrialLink({ onAfterClick }: FreeTrialLinkProps = {}) {
  const { t } = useTranslation()
  const [pendingExternalAction, setPendingExternalAction] = useState(false)

  const handleClaimFreePlan = useCallback(async () => {
    setPendingExternalAction(true)
    trackJkClickEvent(JK_EVENTS.FREE_LICENSE_CLAIM_CLICK, {
      pageName: JK_PAGE_NAMES.HELP_PAGE,
      content: 'onboarding_guide',
    })
    try {
      navigateToSettings('/provider')
      onAfterClick?.()
    } finally {
      setPendingExternalAction(false)
    }
  }, [onAfterClick])

  return (
    <Flex mt="md">
      <Button
        leftSection={<ScalableIcon icon={IconExternalLink} size={18} />}
        onClick={() => void handleClaimFreePlan()}
        variant="light"
        style={guideActionButtonWidthStyle}
        h={42}
        loading={pendingExternalAction}
        disabled={pendingExternalAction}
      >
        {t('Configure Provider')}
      </Button>
    </Flex>
  )
}
