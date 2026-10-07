import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Fetch = (url: string) => Promise<unknown>

const channel = {
  type: 'channel',
  attributes: {
    username: 'tabdeal',
    displayName: 'تبدیل',
    avatar: 'https://example.com/a.jpg',
  },
}

function video(uid: string, title: string) {
  return {
    type: 'Video',
    attributes: { uid, title, duration: 90, visit_cnt_int: 10, sdate: 'امروز' },
  }
}

const listUrl = 'https://www.aparat.com/api/fa/v1/user/video/list/username'
const nextPage = (id: number) =>
  `${listUrl}/tabdeal/perpage/40/nextid/${id}/isnextpage/true`

// Aparat reports `total` as the page size, not the size of the channel.
function listDocument(
  videos: { type: string; attributes: Record<string, unknown> }[],
  next = ''
) {
  return {
    data: [
      {
        type: 'Row',
        attributes: { total: videos.length, link: next ? { next } : null },
      },
    ],
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
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
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
  vi.restoreAllMocks()
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
      .mockResolvedValueOnce(listDocument(catalog.slice(0, 6), nextPage(1)))
      .mockResolvedValueOnce(listDocument(catalog.slice(6)))
    const { fetchChannelPage } = await loadAparat()

    const result = await fetchChannelPage({ page: 2, perPage: 5 })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${listUrl}/tabdeal`,
      expect.any(Object)
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      nextPage(1),
      expect.any(Object)
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
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
    fetchMock.mockResolvedValueOnce(listDocument(catalog))
    const { fetchChannelPage } = await loadAparat()

    const result = await fetchChannelPage({ q: '  BITCOIN ', perPage: 24 })

    expect(result.totalCount).toBe(6)
    expect(result.items.every((item) => item.title.startsWith('Bitcoin'))).toBe(
      true
    )
  })

  it('clamps the page and the page size', async () => {
    fetchMock.mockResolvedValueOnce(listDocument(catalog))
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

  it('ignores Persian spelling variants when searching', async () => {
    fetchMock.mockResolvedValueOnce(
      listDocument([
        video('a', 'آموزش كيف پول'),
        video('b', 'خرید بیت‌کوین'),
        video('c', 'نسخه ۲۰۲۶'),
        video('d', 'تتر'),
      ])
    )
    const { fetchChannelPage } = await loadAparat()

    const uids = async (q: string) =>
      (await fetchChannelPage({ q })).items.map((item) => item.uid)

    expect(await uids('کیف پول')).toEqual(['a'])
    expect(await uids('اموزش')).toEqual(['a'])
    expect(await uids('بیت کوین')).toEqual(['b'])
    expect(await uids('بیتکوین')).toEqual(['b'])
    expect(await uids('2026')).toEqual(['c'])
  })

  it('serves the last catalog when Aparat fails after the cache expires', async () => {
    vi.useFakeTimers()
    try {
      fetchMock
        .mockResolvedValueOnce(listDocument(catalog))
        .mockRejectedValueOnce(httpError(503))
      const { fetchChannelPage } = await loadAparat()

      await fetchChannelPage()
      vi.advanceTimersByTime(61_000)

      expect((await fetchChannelPage()).totalCount).toBe(12)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('drops duplicate videos', async () => {
    fetchMock.mockResolvedValueOnce(
      listDocument([video('a', 'one'), video('a', 'one'), video('b', 'two')])
    )
    const { fetchChannelPage } = await loadAparat()

    expect((await fetchChannelPage()).totalCount).toBe(2)
  })

  it('shares one catalog request between concurrent callers and caches it', async () => {
    fetchMock.mockResolvedValue(listDocument(catalog))
    const { fetchChannelPage } = await loadAparat()

    await Promise.all([fetchChannelPage(), fetchChannelPage()])
    await fetchChannelPage({ q: 'آموزش' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('keeps descriptions and embed links out of the list response', async () => {
    fetchMock.mockResolvedValueOnce(
      listDocument([
        {
          type: 'Video',
          attributes: {
            ...video('a', 'one').attributes,
            description: 'متن &laquo;کامل&raquo;',
            frame:
              'https://www.aparat.com/video/video/embed/videohash/a/vt/frame',
            sdate_rss: '2026-09-29 10:00:06',
          },
        },
      ])
    )
    const { fetchChannelPage, fetchChannelVideos } = await loadAparat()

    const [item] = (await fetchChannelPage()).items
    expect(item).not.toHaveProperty('description')
    expect(item).not.toHaveProperty('embedUrl')
    expect(item?.publishedAt).toBe('2026-09-29T10:00:06+03:30')

    expect(await fetchChannelVideos()).toMatchObject([
      {
        uid: 'a',
        description: 'متن «کامل»',
        embedUrl:
          'https://www.aparat.com/video/video/embed/videohash/a/vt/frame',
      },
    ])
  })

  it('reports a bad gateway when Aparat rejects the list', async () => {
    fetchMock.mockRejectedValueOnce(httpError(404))
    const { fetchChannelPage } = await loadAparat()

    await expect(fetchChannelPage()).rejects.toMatchObject({ statusCode: 502 })
  })

  it('keeps paging after the first 40 videos', async () => {
    const page = (start: number) =>
      Array.from({ length: 40 }, (_, index) =>
        video(`p${start + index}`, `ویدیو ${start + index}`)
      )
    fetchMock
      .mockResolvedValueOnce(listDocument(page(0), nextPage(1)))
      .mockResolvedValueOnce(listDocument(page(40), nextPage(2)))
      .mockResolvedValueOnce(listDocument(page(80)))
    const { fetchChannelPage } = await loadAparat()

    expect((await fetchChannelPage()).totalCount).toBe(120)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('stops at the page limit and logs that the list is cut off', async () => {
    let id = 0
    fetchMock.mockImplementation(async () =>
      listDocument([video(`v${id}`, 'x')], nextPage(++id))
    )
    const { fetchChannelPage } = await loadAparat()

    expect((await fetchChannelPage()).totalCount).toBe(20)
    expect(fetchMock).toHaveBeenCalledTimes(20)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('more than 20 pages')
    )
  })

  it('does not follow a next link outside Aparat', async () => {
    fetchMock.mockResolvedValueOnce(
      listDocument(catalog, 'https://evil.example/list')
    )
    const { fetchChannelPage } = await loadAparat()

    expect((await fetchChannelPage()).totalCount).toBe(12)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('skips and logs videos with an unexpected shape', async () => {
    fetchMock.mockResolvedValueOnce(
      listDocument([
        video('a', 'one'),
        { type: 'Video', attributes: { uid: 'b', title: 42 } },
        { type: 'Video', attributes: { title: 'no uid' } },
      ])
    )
    const { fetchChannelPage } = await loadAparat()

    expect((await fetchChannelPage()).items.map((item) => item.uid)).toEqual([
      'a',
    ])
    expect(console.warn).toHaveBeenCalledTimes(2)
  })

  it('reports a bad gateway and logs when the response shape changes', async () => {
    fetchMock.mockResolvedValueOnce({ data: 'oops', included: {} })
    const { fetchChannelPage } = await loadAparat()

    await expect(fetchChannelPage()).rejects.toMatchObject({ statusCode: 502 })
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('unexpected response')
    )
  })

  it('logs upstream failures', async () => {
    fetchMock.mockRejectedValueOnce(httpError(503))
    const { fetchChannelPage } = await loadAparat()

    await expect(fetchChannelPage()).rejects.toMatchObject({ statusCode: 503 })
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('request failed (503)'),
      expect.any(Error)
    )
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
        sdate_real: '2026-09-29 10:00:06',
        frame_src:
          'https://www.aparat.com/video/video/embed/videohash/abc/vt/frame',
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
      publishedAt: '2026-09-29T10:00:06+03:30',
      embedUrl:
        'https://www.aparat.com/video/video/embed/videohash/abc/vt/frame',
    })
  })

  it('rejects a video from another channel', async () => {
    fetchMock.mockResolvedValueOnce({
      data: {
        type: 'video',
        attributes: { uid: 'abc', owner_username: 'scam' },
      },
      included: [
        { type: 'channel', attributes: { username: 'scam', displayName: 'x' } },
      ],
    })
    const { fetchVideoDetail } = await loadAparat()

    expect(await fetchVideoDetail('abc')).toBeNull()
  })

  it('matches the channel without caring about case', async () => {
    fetchMock.mockResolvedValueOnce(
      detailDocument({ uid: 'abc', title: 'عنوان', owner_username: 'TabDeal' })
    )
    const { fetchVideoDetail } = await loadAparat()

    expect(await fetchVideoDetail('abc')).toMatchObject({ uid: 'abc' })
  })

  it('rejects an invalid uid without calling Aparat', async () => {
    const { fetchVideoDetail } = await loadAparat()

    expect(await fetchVideoDetail('../secret')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null for a missing, mismatched or deleted video', async () => {
    const { fetchVideoDetail } = await loadAparat()

    fetchMock.mockRejectedValueOnce(httpError(404))
    expect(await fetchVideoDetail('missing')).toBeNull()

    fetchMock.mockResolvedValueOnce(detailDocument({ uid: 'other' }))
    expect(await fetchVideoDetail('mismatched')).toBeNull()

    fetchMock.mockResolvedValueOnce(
      detailDocument({ uid: 'deleted', title: 'x', deleted: 'yes' })
    )
    expect(await fetchVideoDetail('deleted')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('caches videos, including missing ones', async () => {
    fetchMock
      .mockResolvedValueOnce(detailDocument({ uid: 'abc', title: 'عنوان' }))
      .mockRejectedValueOnce(httpError(404))
    const { fetchVideoDetail } = await loadAparat()

    await fetchVideoDetail('abc')
    await fetchVideoDetail('abc')
    await fetchVideoDetail('gone')
    expect(await fetchVideoDetail('gone')).toBeNull()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reports a bad gateway and logs when the video shape changes', async () => {
    fetchMock.mockResolvedValueOnce(detailDocument({ uid: 'abc', title: 7 }))
    const { fetchVideoDetail } = await loadAparat()

    await expect(fetchVideoDetail('abc')).rejects.toMatchObject({
      statusCode: 502,
    })
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('unexpected shape')
    )
  })

  it('passes other upstream failures through', async () => {
    fetchMock.mockRejectedValueOnce(httpError(503))
    const { fetchVideoDetail } = await loadAparat()

    await expect(fetchVideoDetail('abc')).rejects.toMatchObject({
      statusCode: 503,
    })
  })
})
