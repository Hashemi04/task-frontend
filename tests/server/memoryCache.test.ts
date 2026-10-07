import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryCache } from '~/server/lib/memoryCache'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function cache(maxEntries = 10) {
  return createMemoryCache<string>({ name: 'test', ttlMs: 1_000, maxEntries })
}

describe('createMemoryCache', () => {
  it('reuses a value until it expires', async () => {
    const get = cache()
    const load = vi.fn().mockResolvedValue('a')

    await get('key', load)
    await get('key', load)
    expect(load).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1_001)
    await get('key', load)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('shares one load between concurrent callers', async () => {
    const get = cache()
    const load = vi.fn().mockResolvedValue('a')

    expect(await Promise.all([get('key', load), get('key', load)])).toEqual([
      'a',
      'a',
    ])
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('serves the last value and logs when a refresh fails', async () => {
    const get = cache()
    await get('key', () => Promise.resolve('old'))
    vi.advanceTimersByTime(1_001)

    expect(await get('key', () => Promise.reject(new Error('down')))).toBe(
      'old'
    )
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('rejects when nothing is cached yet', async () => {
    const get = cache()

    await expect(
      get('key', () => Promise.reject(new Error('down')))
    ).rejects.toThrow('down')
    expect(await get('key', () => Promise.resolve('new'))).toBe('new')
  })

  it('drops the oldest entry past the size limit', async () => {
    const get = cache(2)
    const load = (value: string) => vi.fn().mockResolvedValue(value)

    await get('a', load('a'))
    await get('b', load('b'))
    await get('c', load('c'))

    const reloadA = load('a2')
    const reloadC = load('c2')
    expect(await get('a', reloadA)).toBe('a2')
    expect(await get('c', reloadC)).toBe('c')
    expect(reloadC).not.toHaveBeenCalled()
  })
})
