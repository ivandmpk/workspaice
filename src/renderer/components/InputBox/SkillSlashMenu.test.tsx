/**
 * @vitest-environment jsdom
 */
import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SkillSlashMenu from './SkillSlashMenu'

const skills = [
  { name: 'review', description: 'Review source code', isBuiltin: false },
  { name: 'translate', description: 'Translate selected text', isBuiltin: true },
]

describe('SkillSlashMenu', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('renders enabled skills and exposes the active option', () => {
    render(
      <MantineProvider>
        <SkillSlashMenu skills={skills} activeIndex={1} onSelect={vi.fn()} onHover={vi.fn()} />
      </MantineProvider>
    )

    expect(screen.getByText('/review')).toBeTruthy()
    expect(screen.getByText('Translate selected text')).toBeTruthy()
    expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe('false')
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true')
  })

  it('selects on mouse down and prevents textarea blur', () => {
    const onSelect = vi.fn()
    render(
      <MantineProvider>
        <SkillSlashMenu skills={skills} activeIndex={0} onSelect={onSelect} onHover={vi.fn()} />
      </MantineProvider>
    )

    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    screen.getAllByRole('option')[0].dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(onSelect).toHaveBeenCalledWith(skills[0])
  })

  it('reports hovered option indices', () => {
    const onHover = vi.fn()
    render(
      <MantineProvider>
        <SkillSlashMenu skills={skills} activeIndex={0} onSelect={vi.fn()} onHover={onHover} />
      </MantineProvider>
    )

    fireEvent.mouseEnter(screen.getAllByRole('option')[1])
    expect(onHover).toHaveBeenCalledWith(1)
  })
})
