import { Button, Flex, Modal, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { type FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { skillsController } from '@/packages/skills/controller'
import { toastError } from '@/packages/toast'

const NAME_RE = /^[a-z0-9-]+$/

const CreateSkillModal: FC<{
  opened: boolean
  onClose: () => void
  onCreated: (name: string) => void
}> = ({ opened, onClose, onCreated }) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setName('')
    setDescription('')
    setBody('')
  }

  const nameValid = name.length > 0 && name.length <= 64 && NAME_RE.test(name)
  const canSave = nameValid && description.trim().length > 0 && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const result = await skillsController.createSkill(name, description.trim(), body)
      if (!result.success) {
        toastError(result.error ?? t('Failed to create skill'))
        return
      }
      toast.success(t('Skill created'))
      onCreated(result.skillName)
      reset()
      onClose()
    } catch (error) {
      toastError(error instanceof Error ? error.message : t('Failed to create skill'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('New Skill')} size="lg" centered>
      <Stack gap="sm">
        <TextInput
          label={t('Name')}
          description={t('Lowercase letters, numbers and hyphens only')}
          placeholder="my-skill"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          error={name.length > 0 && !nameValid ? String(t('Invalid name')) : undefined}
          required
        />
        <TextInput
          label={t('Description')}
          description={t('Shown in the skill list and the "/" menu')}
          placeholder={String(t('What this skill does and when to use it'))}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          required
        />
        <Textarea
          label={t('Instructions')}
          description={t('Markdown instructions the model follows when the skill is invoked')}
          placeholder={'# Instructions\n\n...'}
          value={body}
          onChange={(e) => setBody(e.currentTarget.value)}
          autosize
          minRows={6}
          maxRows={16}
        />
        <Flex justify="flex-end" gap="xs" mt="xs">
          <Button variant="subtle" color="gray" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button onClick={() => void handleSave()} loading={saving} disabled={!canSave}>
            {t('Create')}
          </Button>
        </Flex>
        {!nameValid && name.length === 0 && (
          <Text size="xs" c="dimmed">
            {t('Tip: keep instructions focused — under ~5000 tokens works best.')}
          </Text>
        )}
      </Stack>
    </Modal>
  )
}

export default CreateSkillModal
