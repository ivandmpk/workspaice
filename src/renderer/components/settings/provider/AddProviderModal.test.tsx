/**
 * @vitest-environment jsdom
 */
import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddProviderModal } from './AddProviderModal'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

describe('AddProviderModal', () => {
  beforeEach(() => {
    navigate.mockReset()
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
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  it('requires a name before allowing custom provider creation', () => {
    render(
      <MantineProvider>
        <AddProviderModal opened onClose={vi.fn()} />
      </MantineProvider>
    )

    expect((screen.getByTestId('custom-provider-add-button') as HTMLButtonElement).disabled).toBe(true)

    fireEvent.change(screen.getByTestId('custom-provider-name-input'), {
      target: { value: 'Local test provider' },
    })

    expect((screen.getByTestId('custom-provider-add-button') as HTMLButtonElement).disabled).toBe(false)
  })
})
