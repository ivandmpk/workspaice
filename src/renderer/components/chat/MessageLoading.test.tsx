/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MessageStatuses from './MessageLoading'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { attempt?: number; maxAttempts?: number }) =>
      values
        ? key.replace('{{attempt}}', String(values.attempt)).replace('{{maxAttempts}}', String(values.maxAttempts))
        : key,
  }),
}))

describe('MessageStatuses', () => {
  it('renders nothing without active statuses', () => {
    const { container } = render(<MessageStatuses statuses={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows local file processing mode', () => {
    render(<MessageStatuses statuses={[{ type: 'sending_file', mode: 'local' }]} />)
    expect(screen.getByText('Reading file...')).toBeTruthy()
    expect(screen.getByText('Local Mode')).toBeTruthy()
  })

  it('shows advanced webpage processing mode', () => {
    render(<MessageStatuses statuses={[{ type: 'loading_webpage', mode: 'advanced' }]} />)
    expect(screen.getByText('Loading webpage...')).toBeTruthy()
    expect(screen.getByText('Advanced Mode')).toBeTruthy()
  })

  it('shows retry progress', () => {
    render(<MessageStatuses statuses={[{ type: 'retrying', attempt: 2, maxAttempts: 5, error: 'rate limited' }]} />)
    expect(screen.getByText('Retrying 2/5')).toBeTruthy()
  })
})
