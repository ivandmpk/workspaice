import { Box, Text } from '@mantine/core'
import { IconWand } from '@tabler/icons-react'
import type { FC } from 'react'
import type { EnabledSkill } from '@/packages/skills/useEnabledSkills'

const SkillSlashMenu: FC<{
  skills: EnabledSkill[]
  activeIndex: number
  onSelect: (skill: EnabledSkill) => void
  onHover: (index: number) => void
}> = ({ skills, activeIndex, onSelect, onHover }) => {
  return (
    <Box className="absolute bottom-full left-0 mb-1 z-50 w-[min(420px,90vw)] max-h-64 overflow-auto rounded-md border border-solid border-workspaice-border-primary bg-workspaice-background-primary shadow-md">
      {skills.map((skill, i) => (
        <Box
          key={skill.name}
          role="option"
          aria-selected={i === activeIndex}
          // Use mousedown so selection fires before the textarea blurs.
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(skill)
          }}
          onMouseEnter={() => onHover(i)}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
            i === activeIndex ? 'bg-workspaice-background-gray-secondary' : ''
          }`}
        >
          <IconWand size={16} className="shrink-0 text-workspaice-tint-tertiary" />
          <Box className="min-w-0">
            <Text size="sm" fw={500} className="truncate">
              /{skill.name}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {skill.description}
            </Text>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default SkillSlashMenu
