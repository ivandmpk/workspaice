import { ActionIcon, Button, Container, Flex } from '@mantine/core'
import { Icon24Hours } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { ScalableIcon } from '@/components/common/ScalableIcon'

export const Route = createFileRoute('/dev/css-var')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Container>
      <h1>CSS Variables Preview</h1>

      {[
        'workspaice-brand',
        'workspaice-success',
        'workspaice-error',
        'workspaice-warning',
        'workspaice-gray',
        'workspaice-primary',
        'workspaice-secondary',
        'workspaice-tertiary',
      ].map((color) => (
        <>
          <h5>{color}</h5>
          <Flex align="center" gap="md">
            <Button color={color} variant="filled">
              Filled
            </Button>
            <Button color={color} variant="light">
              Light
            </Button>
            <Button color={color} variant="outline">
              Outline
            </Button>
            <Button color={color} variant="subtle">
              Subtle
            </Button>
            <Button color={color} variant="transparent">
              Transparent
            </Button>
            <Button color={color} variant="white">
              White
            </Button>
          </Flex>
        </>
      ))}

      <Flex gap="lg">
        <ActionIcon variant="filled" size={44} radius={0} color="workspaice-primary">
          <ScalableIcon icon={Icon24Hours} size={16} strokeWidth={1.5} />
        </ActionIcon>
        <ActionIcon variant="light" size={44} radius={0} color="workspaice-primary">
          <ScalableIcon icon={Icon24Hours} size={16} strokeWidth={1.5} />
        </ActionIcon>
        <ActionIcon variant="outline" size={44} radius={0} color="workspaice-primary">
          <ScalableIcon icon={Icon24Hours} size={16} strokeWidth={1.5} />
        </ActionIcon>
        <ActionIcon variant="subtle" size={44} radius={0} color="workspaice-primary">
          <ScalableIcon icon={Icon24Hours} size={16} strokeWidth={1.5} />
        </ActionIcon>
        <ActionIcon variant="transparent" size={44} radius={0} color="workspaice-primary">
          <ScalableIcon icon={Icon24Hours} size={16} strokeWidth={1.5} />
        </ActionIcon>
        <ActionIcon variant="white" size={44} radius={0} color="workspaice-primary">
          <ScalableIcon icon={Icon24Hours} size={16} strokeWidth={1.5} />
        </ActionIcon>
      </Flex>
    </Container>
  )
}
