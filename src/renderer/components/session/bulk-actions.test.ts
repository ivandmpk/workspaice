import type { SessionMetaRecord } from '@shared/types'
import { describe, expect, it, vi } from 'vitest'
import { getBulkMoveSortOrders, runBulkSessionAction } from './bulk-actions'

function makeSession(id: string, workspaceId: string | undefined, sortOrder: number): SessionMetaRecord {
  return {
    id,
    name: id,
    workspaceId,
    sortOrder,
    createdAt: sortOrder,
  }
}

describe('runBulkSessionAction', () => {
  it('keeps successful and failed session ids separate', async () => {
    const action = vi.fn((id: string) => {
      return id === 'failed' ? Promise.reject(new Error('failed')) : Promise.resolve()
    })

    await expect(runBulkSessionAction(['first', 'failed', 'last'], action)).resolves.toEqual({
      succeededIds: ['first', 'last'],
      failedIds: ['failed'],
    })
    expect(action).toHaveBeenCalledTimes(3)
  })
})

describe('getBulkMoveSortOrders', () => {
  it('places moved sessions above the destination and preserves their order', () => {
    const sessions = [
      makeSession('destination', 'workspace-b', 5000),
      makeSession('first', 'workspace-a', 4000),
      makeSession('second', undefined, 3000),
    ]

    const orders = getBulkMoveSortOrders(['first', 'second'], sessions, 'workspace-b', 1000)

    expect(orders.get('first')).toBeGreaterThan(5000)
    expect(orders.get('second')).toBeGreaterThan(5000)
    expect(orders.get('first')).toBeGreaterThan(orders.get('second') as number)
  })

  it('ignores selected sessions already in the destination when finding the top order', () => {
    const sessions = [makeSession('moving', 'workspace-b', 9000), makeSession('destination', 'workspace-b', 5000)]

    const orders = getBulkMoveSortOrders(['moving'], sessions, 'workspace-b', 1000)

    expect(orders.get('moving')).toBe(6000)
  })
})
