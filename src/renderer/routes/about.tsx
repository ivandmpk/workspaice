import {
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Image,
  Popover,
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconChevronRight,
  IconClipboard,
  IconFileText,
  IconHome,
  IconMail,
  IconMessage2,
  IconPencil,
  IconRefresh,
  IconX,
} from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { Fragment, type ReactElement, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScalableIcon } from '@/components/common/ScalableIcon'
import BrandGithub from '@/components/icons/BrandGithub'
import BrandRedNote from '@/components/icons/BrandRedNote'
import BrandWechat from '@/components/icons/BrandWechat'
import Page from '@/components/layout/Page'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import useVersion from '@/hooks/useVersion'
import { buildWorkspAIceUrl } from '@/packages/remote'
import platform from '@/platform'
import iconPNG from '@/static/icon.png'
import IMG_WECHAT_QRCODE from '@/static/wechat_qrcode.png'
import { useLanguage } from '@/stores/settingsStore'
import { installUpdate, useUpdateStore } from '@/stores/updateStore'

export const Route = createFileRoute('/about')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t, i18n: _i18n } = useTranslation()
  const version = useVersion()
  const language = useLanguage()
  const isSmallScreen = useIsSmallScreen()

  return (
    <Page title={t('About')}>
      <Container size="md" p={0}>
        <Stack gap="xxl" px={isSmallScreen ? 'sm' : 'md'} py={isSmallScreen ? 'xl' : 'md'}>
          <Flex gap="xxl" p="md" className="rounded-lg bg-workspaice-background-secondary">
            <Image h={100} w={100} mah={'20vw'} maw={'20vw'} src={iconPNG} />
            <Stack flex={1} gap="xxs">
              <Flex justify="space-between" align="center" wrap="wrap" gap={isSmallScreen ? 'xs' : 'sm'} rowGap="xs">
                <Title order={5} lh={1.5} lineClamp={1} title={`WorkspAIce v${version.version}`}>
                  WorkspAIce {/\d/.test(version.version) ? `(v${version.version})` : ''}
                </Title>

                <UpdateSection language={language} needCheckUpdate={version.needCheckUpdate} />
              </Flex>
              <Text>{t('about-slogan')}</Text>
              <Text c="workspaice-tertiary">{t('about-introduction')}</Text>

              <Flex gap="sm">
                <Anchor
                  size="sm"
                  href="https://workspaiceai.app/privacy"
                  target="_blank"
                  underline="hover"
                  c="workspaice-tertiary"
                >
                  {t('Privacy Policy')}
                </Anchor>
                <Anchor
                  size="sm"
                  href="https://workspaiceai.app/terms"
                  target="_blank"
                  underline="hover"
                  c="workspaice-tertiary"
                >
                  {t('User Terms')}
                </Anchor>
              </Flex>
            </Stack>
          </Flex>

          <List>
            <ListItem
              icon={<BrandGithub className="w-full h-full" />}
              title={t('Github')}
              link="https://github.com/workspaiceai/workspaice"
              value="workspaice"
            />
            {/* <ListItem
              icon={<BrandX className="w-full h-full" />}
              title={t('X(Twitter)')}
              link="https://x.com/WorkspAIceAI_HQ"
              value="@WorkspAIceAI_HQ"
            /> */}
            <ListItem
              icon={<BrandRedNote className="w-full h-full" />}
              title={t('RedNote')}
              link="https://www.xiaohongshu.com/user/profile/67b581b6000000000e01d11f"
              value="@63844903136"
            />
            <ListItem icon={<BrandWechat className="w-full h-full" />} title={t('WeChat')} right={<WechatQRCode />} />
          </List>

          <List>
            <ListItem
              icon={<IconHome className="w-full h-full" />}
              title={t('Official Site')}
              link={buildWorkspAIceUrl(`/redirect_app/homepage/${language}`)}
            />
            <ListItem
              icon={<IconClipboard className="w-full h-full" />}
              title={t('Survey')}
              link={_i18n.language === 'zh-Hans' ? 'https://jsj.top/f/fcMYEa' : 'https://jsj.top/f/RUMbvY'}
            />
            <ListItem
              icon={<IconPencil className="w-full h-full" />}
              title={t('Feedback')}
              link={buildWorkspAIceUrl(`/redirect_app/feedback/${language}`)}
            />
            <ListItem
              icon={<IconFileText className="w-full h-full" />}
              title={t('Changelog')}
              link={`https://workspaiceai.app/${language.split('-')[0] || 'en'}/help-center/changelog`}
            />
            <ListItem
              icon={<IconMail className="w-full h-full" />}
              title={t('E-mail')}
              link={`mailto:hi@workspaiceai.com`}
              value="hi@workspaiceai.com"
            />
            <ListItem
              icon={<IconMessage2 className="w-full h-full" />}
              title={t('FAQs')}
              link={`https://workspaiceai.app/${language.split('-')[0] || 'en'}/help-center/workspaice-ai-service-faqs`}
            />
          </List>
        </Stack>
      </Container>
    </Page>
  )
}

/**
 * Update section in the About page hero.
 * Desktop: check button, progress bar, error/retry, restart & install.
 * Mobile: "New version available" hint linking to app store.
 */
function UpdateSection({ language, needCheckUpdate }: { language: string; needCheckUpdate: boolean }) {
  const isDesktop = platform.type === 'desktop'

  if (isDesktop) {
    return <DesktopUpdateSection />
  }

  // Mobile and Web both use external link
  return <MobileUpdateHint language={language} needCheckUpdate={needCheckUpdate} />
}

function MobileUpdateHint({ language, needCheckUpdate }: { language: string; needCheckUpdate: boolean }) {
  const { t } = useTranslation()

  if (needCheckUpdate) {
    return (
      <Button
        size="xs"
        variant="light"
        color="workspaice-brand"
        radius="xl"
        className="flex-shrink-0"
        onClick={() => platform.openLink(buildWorkspAIceUrl(`/redirect_app/check_update/${language}`))}
      >
        {t('New version available')}
      </Button>
    )
  }

  return (
    <Button
      size="xs"
      variant="default"
      radius="xl"
      className="flex-shrink-0"
      onClick={() => platform.openLink(buildWorkspAIceUrl(`/redirect_app/check_update/${language}`))}
    >
      {t('Check Update')}
    </Button>
  )
}

function DesktopUpdateSection() {
  const { t } = useTranslation()
  const status = useUpdateStore((s) => s.status)
  const progress = useUpdateStore((s) => s.progress)
  const updateVersion = useUpdateStore((s) => s.version)
  const error = useUpdateStore((s) => s.error)

  const handleCheck = async () => {
    useUpdateStore.setState({ status: 'checking', error: null })
    try {
      const result = await platform.checkForUpdate?.()
      // If check was skipped (another check already in progress), reset UI
      if (result && !result.started) {
        const { status: currentStatus } = useUpdateStore.getState()
        if (currentStatus === 'checking') {
          useUpdateStore.setState({ status: 'idle' })
        }
      }
    } catch {
      useUpdateStore.setState({ status: 'idle' })
    }
    // Safety timeout: if still stuck at 'checking' after 30s, reset
    setTimeout(() => {
      if (useUpdateStore.getState().status === 'checking') {
        useUpdateStore.setState({ status: 'idle' })
      }
    }, 30_000)
  }

  const handleInstall = installUpdate

  switch (status) {
    case 'checking':
      return (
        <Button size="xs" variant="default" radius="xl" className="flex-shrink-0" loading>
          {t('Checking...')}
        </Button>
      )

    case 'available':
    case 'downloading':
      return (
        <Stack gap={4} flex={1} maw={200}>
          <Text size="xs" c="workspaice-brand" ta="right">
            {status === 'downloading'
              ? `${t('Downloading...')} ${progress}%`
              : `${t('New version available')}${updateVersion ? ` v${updateVersion}` : ''}`}
          </Text>
          {status === 'downloading' && <Progress value={progress} size="xs" color="workspaice-brand" animated />}
        </Stack>
      )

    case 'downloaded':
      return (
        <Button
          size="xs"
          variant="filled"
          color="workspaice-brand"
          radius="xl"
          className="flex-shrink-0"
          leftSection={<ScalableIcon icon={IconRefresh} size={14} />}
          onClick={handleInstall}
        >
          {t('Restart & Update')}
          {updateVersion ? ` (v${updateVersion})` : ''}
        </Button>
      )

    case 'error':
      return (
        <Stack gap={2} align="flex-end" className="flex-shrink-0">
          <Flex gap="xs" align="center">
            <Text size="xs" c="workspaice-error">
              {t('Update failed')}
            </Text>
            <Button size="xs" variant="default" radius="xl" onClick={handleCheck}>
              {t('Retry')}
            </Button>
          </Flex>
          <Anchor
            size="xs"
            c="workspaice-tertiary"
            onClick={() => platform.openLink(buildWorkspAIceUrl('/redirect_app/homepage/'))}
          >
            {t('Download from official site')}
          </Anchor>
        </Stack>
      )

    case 'up-to-date':
      return (
        <Text size="xs" c="workspaice-tertiary" className="flex-shrink-0">
          {t('Already up to date')}
        </Text>
      )

    default:
      return (
        <Button size="xs" variant="default" radius="xl" className="flex-shrink-0" onClick={handleCheck}>
          {t('Check Update')}
        </Button>
      )
  }
}

function WechatQRCode() {
  const { t } = useTranslation()
  const [opened, { close, open }] = useDisclosure(false)
  return (
    <Popover position="top" withArrow shadow="md" opened={opened}>
      <Popover.Target>
        <Text onMouseEnter={open} onMouseLeave={close} c="workspaice-brand" className="cursor-pointer">
          {t('QR Code')}
        </Text>
      </Popover.Target>
      <Popover.Dropdown style={{ pointerEvents: 'none' }}>
        <Image src={IMG_WECHAT_QRCODE} alt="wechat qrcode" w={160} h={160} />
      </Popover.Dropdown>
    </Popover>
  )
}

function List(props: { children: ReactElement[] }) {
  return (
    <Stack gap={0} className="rounded-lg bg-workspaice-background-secondary">
      {props.children.map((child, index) => (
        <Fragment key={`child-${index}`}>
          {child}
          {index !== props.children.length - 1 && <Divider />}
        </Fragment>
      ))}
    </Stack>
  )
}

function ListItem({
  icon,
  title,
  link,
  value,
  right,
}: {
  icon: ReactElement
  title: string
  link?: string
  value?: string
  right?: ReactElement
}) {
  return (
    <Flex
      px="md"
      py="sm"
      gap="xs"
      align="center"
      className={link ? 'cursor-pointer' : ''}
      onClick={() => link && platform.openLink(link)}
      c="workspaice-tertiary"
    >
      <Box w={20} h={20} className="flex-shrink-0 " c="workspaice-primary">
        {icon}
      </Box>
      <Text flex={1} size="md">
        {title}
      </Text>

      {right ? (
        right
      ) : (
        <>
          {value && (
            <Text size="md" c="workspaice-tertiary">
              {value}
            </Text>
          )}
          {link && <ScalableIcon icon={IconChevronRight} size={20} className="!text-inherit" />}
        </>
      )}
    </Flex>
  )
}
