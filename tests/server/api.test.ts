import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Handler = (event: unknown) => unknown

const fetchChannelPage = vi.fn()
const fetchVideoDetail = vi.fn()
let query: Record<string, unknown> = {}
let routerParam: string | undefined

beforeEach(() => {
  vi.resetModules()
  fetchChannelPage.mockReset().mockResolvedValue({ items: [] })
  fetchVideoDetail.mockReset()
  vi.stubGlobal('defineEventHandler', (handler: Handler) => handler)
  vi.stubGlobal('getQuery', () => query)
  vi.stubGlobal('getRouterParam', () => routerParam)
  vi.stubGlobal('fetchChannelPage', fetchChannelPage)
  vi.stubGlobal('fetchVideoDetail', fetchVideoDetail)
  vi.stubGlobal(
    'createError',
    (input: { statusCode: number; message: string }) =>
      Object.assign(new Error(input.message), input)
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function listHandler() {
  return (await import('~/server/api/videos.get')).default as Handler
}

async function detailHandler() {
  return (await import('~/server/api/videos/[uid].get')).default as Handler
}

describe('GET /api/videos', () => {
  it('passes the parsed query to the catalog', async () => {
    query = { q: 'btc', page: '2', perPage: '6' }
    await (
      await listHandler()
    )({})

    expect(fetchChannelPage).toHaveBeenCalledWith({
      q: 'btc',
      page: 2,
      perPage: 6,
    })
  })

  it('ignores values that are not a string or a number', async () => {
    query = { q: ['a', 'b'], page: 'two', perPage: 'Infinity' }
    await (
      await listHandler()
    )({})

    expect(fetchChannelPage).toHaveBeenCalledWith({
      q: '',
      page: undefined,
      perPage: undefined,
    })
  })
})

describe('GET /api/videos/:uid', () => {
  it('returns the video', async () => {
    routerParam = 'abc'
    fetchVideoDetail.mockResolvedValue({ uid: 'abc' })

    expect(await (await detailHandler())({})).toEqual({
      uid: 'abc',
    })
    expect(fetchVideoDetail).toHaveBeenCalledWith('abc')
  })

  it('throws a 404 when the video does not exist', async () => {
    routerParam = undefined
    fetchVideoDetail.mockResolvedValue(null)

    await expect((await detailHandler())({})).rejects.toMatchObject({
      statusCode: 404,
    })
    expect(fetchVideoDetail).toHaveBeenCalledWith('')
  })
})
