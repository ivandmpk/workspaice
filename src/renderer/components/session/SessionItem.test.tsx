/**
 * @vitest-environment jsdom
 */
import { MantineProvider } from '@mantine/core'
import type { SessionMeta } from '@shared/types'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SessionItem from './SessionItem'

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => (values ? key.replace('{{name}}', values.name ?? '') : key),
  }),
}))

vi.mock('@/hooks/useScreenChange', () => ({ useIsSmallScreen: () => false }))
vi.mock('@/router', () => ({ router: { navigate: vi.fn() } }))
vi.mock('@/stores/chatStore', () => ({
  deleteSession: vi.fn(),
  getSession: vi.fn(),
  updateSession: vi.fn(),
}))
vi.mock('@/stores/sessionActions', () => ({
  copyAndSwitchSession: vi.fn(),
  switchCurrentSession: vi.fn(),
}))
vi.mock('@/stores/uiStore', () => ({
  useUIStore: (selector: (state: { setShowSidebar: () => void }) => unknown) => selector({ setShowSidebar: vi.fn() }),
}))
vi.mock('@/stores/workspaceStore', () => ({
  moveSessionToWorkspace: vi.fn(),
  useWorkspaces: () => ({ data: [] }),
}))

const session = {
  id: 'test-chat',
  name: 'Test chat',
  createdAt: 1,
  sortOrder: 1,
} as SessionMeta

describe('SessionItem selection mode', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
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

  it('toggles the session from either the row or checkbox and hides single-chat actions', () => {
    const onToggleSelection = vi.fn()
    const { rerender } = render(
      <MantineProvider>
        <SessionItem
          session={session}
          selected={false}
          selectionMode
          bulkSelected={false}
          onToggleSelection={onToggleSelection}
        />
      </MantineProvider>
    )

    const checkbox = screen.getByRole('checkbox', { name: 'Select Test chat' }) as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    expect(screen.queryAllByRole('button')).toHaveLength(0)

    fireEvent.click(screen.getByText('Test chat'))
    fireEvent.click(checkbox)
    expect(onToggleSelection).toHaveBeenNthCalledWith(1, 'test-chat')
    expect(onToggleSelection).toHaveBeenNthCalledWith(2, 'test-chat')

    rerender(
      <MantineProvider>
        <SessionItem
          session={session}
          selected={false}
          selectionMode
          bulkSelected
          onToggleSelection={onToggleSelection}
        />
      </MantineProvider>
    )

    expect((screen.getByRole('checkbox', { name: 'Select Test chat' }) as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText('Test chat').parentElement?.className).toContain('bg-workspaice-background-brand-secondary')
  })
})
