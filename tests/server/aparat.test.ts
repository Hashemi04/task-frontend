import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Fetch = (url: string) => Promise<unknown>

const channel = {
  type: 'channel',
  attributes: { displayName: 'تبدیل', avatar: 'https://example.com/a.jpg' },
}

function video(uid: string, title: string) {
  return {
    type: 'Video',
    attributes: { uid, title, duration: 90, visit_cnt_int: 10, sdate: 'امروز' },
  }
}

function listDocument(
  videos: ReturnType<typeof video>[],
  total: number,
  next = ''
) {
  return {
    data: [{ type: 'list', attributes: { total, link: { next } } }],
    included: [channel, ...videos],
  }
}

function detailDocument(attributes: Record<string, unknown>) {
  return {
    data: { type: 'video', attributes },
    included: [
      { ...channel, attributes: { ...channel.attributes, follower_cnt: 7 } },
    ],
  }
}

function httpError(statusCode: number) {
  return Object.assign(new Error(`HTTP ${statusCode}`), { statusCode })
}

let fetchMock: ReturnType<typeof vi.fn<Fetch>>

async function loadAparat() {
  vi.resetModules()
  return import('~/server/utils/aparat')
}

beforeEach(() => {
  fetchMock = vi.fn<Fetch>()
  vi.stubGlobal('$fetch', fetchMock)
  vi.stubGlobal('useRuntimeConfig', () => ({ aparatChannel: 'tabdeal' }))
  vi.stubGlobal(
    'createError',
    (input: { statusCode: number; message: string }) =>
      Object.assign(new Error(input.message), input)
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchChannelPage', () => {
  const catalog = Array.from({ length: 12 }, (_, index) =>
    video(
      `v${index + 1}`,
      index % 2 ? `Bitcoin ${index + 1}` : `آموزش ${index + 1}`
    )
  )

  it('follows the next links and pages through the whole channel', async () => {
    fetchMock
      .mockResolvedValueOnce(listDocument(catalog.slice(0, 6), 12, 'page-2'))
      .mockResolvedValueOnce(listDocument(catalog.slice(6), 12))
    const { fetchChannelPage } = await loadAparat()

    const result = await fetchChannelPage({ page: 2, perPage: 5 })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://www.aparat.com/api/fa/v1/user/video/list/username/tabdeal',
      expect.any(Object)
    )
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'page-2', expect.any(Object))
    expect(result.totalCount).toBe(12)
    expect(result.page).toBe(2)
    expect(result.items.map((item) => item.uid)).toEqual([
      'v6',
      'v7',
      'v8',
      'v9',
      'v10',
    ])
    expect(result.items[0]?.senderName).toBe('تبدیل')
  })

  it('filters by title without caring about case', async () => {
    fetchMock.mockResolvedValueOnce(listDocument(catalog, 12))
    const { fetchChannelPage } = await loadAparat()

    const result = await fetchChannelPage({ q: '  BITCOIN ', perPage: 24 })

    expect(result.totalCount).toBe(6)
    expect(result.items.every((item) => item.title.startsWith('Bitcoin'))).toBe(
      true
    )
  })

  it('clamps the page and the page size', async () => {
    fetchMock.mockResolvedValueOnce(listDocument(catalog, 12))
    const { fetchChannelPage } = await loadAparat()

    expect(await fetchChannelPage({ page: 99, perPage: 5 })).toMatchObject({
      page: 3,
      perPage: 5,
    })
    expect(await fetchChannelPage({ perPage: 500 })).toMatchObject({
      perPage: 24,
    })
    expect(await fetchChannelPage({ perPage: 0 })).toMatchObject({
      perPage: 9,
    })
  })

  it('drops duplicate videos', async () => {
    fetchMock.mockResolvedValueOnce(
      listDocument([video('a', 'one'), video('a', 'one'), video('b', 'two')], 3)
    )
    const { fetchChannelPage } = await loadAparat()

    expect((await fetchChannelPage()).totalCount).toBe(2)
  })

  it('shares one catalog request between concurrent callers and caches it', async () => {
    fetchMock.mockResolvedValue(listDocument(catalog, 12))
    const { fetchChannelPage } = await loadAparat()

    await Promise.all([fetchChannelPage(), fetchChannelPage()])
    await fetchChannelPage({ q: 'آموزش' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports a bad gateway when Aparat rejects the list', async () => {
    fetchMock.mockRejectedValueOnce(httpError(404))
    const { fetchChannelPage } = await loadAparat()

    await expect(fetchChannelPage()).rejects.toMatchObject({ statusCode: 502 })
  })
})

describe('fetchVideoDetail', () => {
  it('maps the video and its channel', async () => {
    fetchMock.mockResolvedValueOnce(
      detailDocument({
        uid: 'abc',
        title: 'عنوان',
        description: 'توضیح',
        like_cnt: '1.5 هزار',
        tags: ['btc', '', 3],
      })
    )
    const { fetchVideoDetail } = await loadAparat()

    expect(await fetchVideoDetail('abc')).toMatchObject({
      uid: 'abc',
      title: 'عنوان',
      description: 'توضیح',
      likeCount: 1500,
      followerCount: 7,
      tags: ['btc'],
      senderName: 'تبدیل',
    })
  })

  it('rejects an invalid uid without calling Aparat', async () => {
    const { fetchVideoDetail } = await loadAparat()

    expect(await fetchVideoDetail('../secret')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null for a missing, mismatched or deleted video', async () => {
    const { fetchVideoDetail } = await loadAparat()

    fetchMock.mockRejectedValueOnce(httpError(404))
    expect(await fetchVideoDetail('abc')).toBeNull()

    fetchMock.mockResolvedValueOnce(detailDocument({ uid: 'other' }))
    expect(await fetchVideoDetail('abc')).toBeNull()

    fetchMock.mockResolvedValueOnce(
      detailDocument({ uid: 'abc', deleted: 'yes' })
    )
    expect(await fetchVideoDetail('abc')).toBeNull()
  })

  it('passes other upstream failures through', async () => {
    fetchMock.mockRejectedValueOnce(httpError(503))
    const { fetchVideoDetail } = await loadAparat()

    await expect(fetchVideoDetail('abc')).rejects.toMatchObject({
      statusCode: 503,
    })
  })
})
