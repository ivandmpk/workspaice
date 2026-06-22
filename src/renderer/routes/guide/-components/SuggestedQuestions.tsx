/**
 * SuggestedQuestions - "Guess what you want to ask" quick questions
 * Displays after successful login to help users explore common topics
 */

import { Box, Stack, Text, UnstyledButton } from '@mantine/core'
import { IconSparkles } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { ScalableIcon } from '@/components/common/ScalableIcon'

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void
  disabled?: boolean
}

export function SuggestedQuestions({ onQuestionClick, disabled }: SuggestedQuestionsProps) {
  const { t } = useTranslation()

  const questions = [
    t('I want to try WorkspAIce for free!'),
    t('What is an API? Where to get it? How to connect?'),
    t('What is the relationship between WorkspAIce and other model providers?'),
    t('How do I switch to different models, like DeepSeek?'),
    t('Where is the Knowledge Base feature?'),
  ]

  return (
    <Box mt="lg">
      {/* Section header */}
      <Text size="xs" c="workspaice-tertiary" fw={500} mb="xs" className="flex items-center gap-1.5">
        <ScalableIcon icon={IconSparkles} size={12} className="text-workspaice-tint-brand opacity-70" />
        {t('You might also want to ask')}
      </Text>

      {/* Question chips */}
      <Stack gap={6}>
        {questions.map((question) => (
          <UnstyledButton
            key={question}
            onClick={() => !disabled && onQuestionClick(question)}
            disabled={disabled}
            className={`
              group
              px-3 py-2 rounded-lg
              bg-workspaice-background-secondary
              border border-workspaice-border-primary
              transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-workspaice-tint-brand/50 hover:bg-workspaice-background-brand-secondary/30'}
            `}
          >
            <Text
              size="sm"
              c="workspaice-secondary"
              className={`
                transition-colors duration-200
                ${!disabled && 'group-hover:text-workspaice-tint-brand'}
              `}
            >
              {question}
            </Text>
          </UnstyledButton>
        ))}
      </Stack>
    </Box>
  )
}
