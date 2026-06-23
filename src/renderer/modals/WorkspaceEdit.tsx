import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { Button, Stack, TextInput } from '@mantine/core'
import type { Workspace } from '@shared/types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdaptiveModal } from '@/components/common/AdaptiveModal'
import { createWorkspace, updateWorkspace } from '@/stores/workspaceStore'

const WorkspaceEdit = NiceModal.create(({ workspace }: { workspace?: Workspace }) => {
  const modal = useModal()
  const { t } = useTranslation()
  const [name, setName] = useState(workspace?.name ?? '')
  const [saving, setSaving] = useState(false)
  const trimmedName = name.trim()

  useEffect(() => {
    if (modal.visible) {
      setName(workspace?.name ?? '')
    }
  }, [modal.visible, workspace])

  const onClose = () => {
    modal.resolve()
    modal.hide()
  }

  const onSave = async () => {
    if (!trimmedName || saving) return
    setSaving(true)
    try {
      if (workspace) {
        await updateWorkspace(workspace.id, { name: trimmedName })
        modal.resolve({ ...workspace, name: trimmedName })
      } else {
        modal.resolve(await createWorkspace(trimmedName))
      }
      modal.hide()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdaptiveModal
      opened={modal.visible}
      onClose={onClose}
      centered
      size="sm"
      title={workspace ? t('Rename Workspace') : t('New Workspace')}
    >
      <Stack>
        <TextInput
          label={t('Name')}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void onSave()
            }
          }}
          autoFocus
          data-testid="workspace-name-input"
        />
        <AdaptiveModal.Actions>
          <AdaptiveModal.CloseButton onClick={onClose} />
          <Button disabled={!trimmedName} loading={saving} onClick={onSave} data-testid="workspace-save-button">
            {workspace ? t('Save') : t('Create')}
          </Button>
        </AdaptiveModal.Actions>
      </Stack>
    </AdaptiveModal>
  )
})

export default WorkspaceEdit
