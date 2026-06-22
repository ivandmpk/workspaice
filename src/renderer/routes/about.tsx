import { Anchor, Box, Container, Divider, Flex, Image, Stack, Text, Title } from '@mantine/core'
import { IconChevronRight, IconFileText, IconMail } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { Fragment, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { ScalableIcon } from '@/components/common/ScalableIcon'
import BrandGithub from '@/components/icons/BrandGithub'
import Page from '@/components/layout/Page'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import useVersion from '@/hooks/useVersion'
import platform from '@/platform'
import iconPNG from '@/static/icon.png'
import { useLanguage } from '@/stores/settingsStore'

const GITHUB_URL = 'https://github.com/ivandmpk/workspaice'
const GITHUB_ISSUES_URL = `${GITHUB_URL}/issues`

export const Route = createFileRoute('/about')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  const version = useVersion()
  const isSmallScreen = useIsSmallScreen()
  useLanguage()

  return (
    <Page title={t('About')}>
      <Container size="md" p={0}>
        <Stack gap="xxl" px={isSmallScreen ? 'sm' : 'md'} py={isSmallScreen ? 'xl' : 'md'}>
          <Flex gap="xxl" p="md" className="rounded-lg bg-workspaice-background-secondary">
            <Image h={100} w={100} mah={'20vw'} maw={'20vw'} src={iconPNG} />
            <Stack flex={1} gap="xxs">
              <Title order={5} lh={1.5} lineClamp={1} title={`WorkspAIce v${version.version}`}>
                WorkspAIce {/\d/.test(version.version) ? `(v${version.version})` : ''}
              </Title>
              <Text>{t('about-slogan')}</Text>
              <Text c="workspaice-tertiary">{t('about-introduction')}</Text>

              <Flex gap="sm">
                <Anchor size="sm" href={`${GITHUB_URL}/blob/dev/LICENSE`} target="_blank" underline="hover" c="workspaice-tertiary">
                  {t('License (GPLv3)')}
                </Anchor>
              </Flex>
            </Stack>
          </Flex>

          <List>
            <ListItem
              icon={<BrandGithub className="w-full h-full" />}
              title="GitHub"
              link={GITHUB_URL}
              value="ivandmpk/workspaice"
            />
          </List>

          <List>
            <ListItem
              icon={<IconFileText className="w-full h-full" />}
              title={t('Changelog')}
              link={`${GITHUB_URL}/releases`}
            />
            <ListItem
              icon={<IconMail className="w-full h-full" />}
              title={t('Feedback')}
              link={GITHUB_ISSUES_URL}
            />
          </List>
        </Stack>
      </Container>
    </Page>
  )
}

function List(props: { children: ReactElement | ReactElement[] }) {
  const children = Array.isArray(props.children) ? props.children : [props.children]
  return (
    <Stack gap={0} className="rounded-lg bg-workspaice-background-secondary">
      {children.map((child, index) => (
        <Fragment key={`child-${index}`}>
          {child}
          {index !== children.length - 1 && <Divider />}
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
}: {
  icon: ReactElement
  title: string
  link?: string
  value?: string
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
      <>
        {value && (
          <Text size="md" c="workspaice-tertiary">
            {value}
          </Text>
        )}
        {link && <ScalableIcon icon={IconChevronRight} size={20} className="!text-inherit" />}
      </>
    </Flex>
  )
}
