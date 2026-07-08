import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cache } from './cache'

describe('main-process memory cache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  it('reuses a value until its ttl expires', async () => {
    const getter = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')

    await expect(cache('ttl-key', getter, { ttl: 1000 })).resolves.toBe('first')
    await expect(cache('ttl-key', getter, { ttl: 1000 })).resolves.toBe('first')
    expect(getter).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1001)
    await expect(cache('ttl-key', getter, { ttl: 1000 })).resolves.toBe('second')
    expect(getter).toHaveBeenCalledTimes(2)
  })

  it('can use an expired value when refresh fails', async () => {
    const getter = vi.fn().mockResolvedValueOnce({ value: 1 }).mockRejectedValueOnce(new Error('offline'))

    const initial = await cache('fallback-key', getter, { ttl: 10 })
    vi.advanceTimersByTime(11)
    const fallback = await cache('fallback-key', getter, { ttl: 10, refreshFallbackToCache: true })

    expect(fallback).toBe(initial)
  })

  it('propagates getter failures without a cached fallback', async () => {
    await expect(
      cache('failure-key', vi.fn().mockRejectedValue(new Error('offline')), { ttl: 10, refreshFallbackToCache: true })
    ).rejects.toThrow('offline')
  })
})
