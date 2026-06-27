import { Button, Group, Modal, Stack, Text } from '@mantine/core'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

const BulkDeleteChatsModal: FC<{
  opened: boolean
  count: number
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}> = ({ opened, count, loading, onClose, onConfirm }) => {
  const { t } = useTranslation()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('Delete selected chats?')}
      centered
      size="sm"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
    >
      <Stack gap="md">
        <Text size="sm">
          {t(count === 1 ? 'Permanently delete 1 selected chat?' : 'Permanently delete {{count}} selected chats?', {
            count,
          })}
        </Text>
        <Text size="sm" c="dimmed">
          {t('This action cannot be undone.')}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            {t('Cancel')}
          </Button>
          <Button color="workspaice-error" onClick={onConfirm} loading={loading}>
            {t(count === 1 ? 'Delete 1 chat' : 'Delete {{count}} chats', { count })}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default BulkDeleteChatsModal
