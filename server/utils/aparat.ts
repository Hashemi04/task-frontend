import type { VideoDetail, VideoPage, VideoSummary } from '~/types/video'
import { clampPage } from '~/utils/pagination'
import { searchKey } from '~/server/lib/searchText'
import { createMemoryCache } from '~/server/lib/memoryCache'
import {
  aparatChannel,
  aparatDocument,
  aparatList,
  aparatVideo,
  describeIssues,
  type AparatChannel,
  type AparatDocument,
  type AparatVideo,
} from '~/server/lib/aparatSchema'
import {
  aparatUrl,
  asText,
  isoDate,
  isRecord,
  mp4Url,
  numberCount,
  plainText,
  posterSrcset,
} from '~/server/lib/videoParse'

const requestTimeoutMs = 8_000
// Aparat returns 40 videos per page and only exposes a cursor to the next one.
const maxCatalogPages = 20

export interface CatalogVideo extends VideoSummary {
  description: string
  embedUrl: string
}

const catalogCache = createMemoryCache<CatalogVideo[]>({
  name: 'aparat catalog',
  ttlMs: 60_000,
  maxEntries: 1,
})

const detailCache = createMemoryCache<VideoDetail | null>({
  name: 'aparat video',
  ttlMs: 300_000,
  maxEntries: 200,
})

export async function fetchChannelPage(
  input: {
    q?: string
    page?: number
    perPage?: number
  } = {}
): Promise<VideoPage> {
  const catalog = await loadCatalog()
  const q = searchKey(input.q ?? '')
  const matched = q
    ? catalog.filter((video) => searchKey(video.title).includes(q))
    : catalog
  const perPage = clampPerPage(input.perPage)
  const pageCount = Math.max(1, Math.ceil(matched.length / perPage))
  const page = clampPage(input.page ?? 1, matched.length === 0 ? 1 : pageCount)
  const start = (page - 1) * perPage

  return {
    items: matched.slice(start, start + perPage).map(toSummary),
    page,
    perPage,
    totalCount: matched.length,
  }
}

export function fetchChannelVideos() {
  return loadCatalog()
}

export function fetchVideoDetail(uid: string): Promise<VideoDetail | null> {
  if (!/^[\w-]+$/.test(uid)) return Promise.resolve(null)
  return detailCache(uid, () => fetchDetail(uid))
}

function toSummary({
  description: _description,
  embedUrl: _embedUrl,
  ...summary
}: CatalogVideo) {
  return summary
}

function loadCatalog() {
  const { aparatChannel: channel } = useRuntimeConfig()
  return catalogCache(channel.toLowerCase(), () => fetchCatalog(channel))
}

async function fetchCatalog(channelName: string) {
  const items: CatalogVideo[] = []
  const seen = new Set<string>()
  let next = `https://www.aparat.com/api/fa/v1/user/video/list/username/${encodeURIComponent(channelName)}`
  let pages = 0

  while (next && pages < maxCatalogPages) {
    const document = await aparat(next)
    pages += 1
    if (!document) throw badGateway('بارگذاری ویدیوها انجام نشد')

    const channel = channelAttributes(document)
    const videos = (document.included ?? []).filter(
      (item) => item.type === 'Video'
    )

    for (const resource of videos) {
      const video = parseVideo(resource.attributes)
      if (!video || seen.has(video.uid)) continue
      seen.add(video.uid)
      items.push({
        ...mapSummary(video, channel),
        description: plainText(video.description),
        embedUrl: aparatUrl(video.frame),
      })
    }

    const list = aparatList.safeParse(firstData(document))
    const nextLink = list.success ? aparatUrl(list.data.link?.next) : ''
    next = videos.length > 0 ? nextLink : ''
  }

  if (next) {
    console.warn(
      `[aparat] "${channelName}" has more than ${maxCatalogPages} pages; listing only the first ${items.length} videos`
    )
  }

  return items
}

async function fetchDetail(uid: string): Promise<VideoDetail | null> {
  const document = await aparat(
    `https://www.aparat.com/api/fa/v1/video/video/show/videohash/${uid}`
  )
  if (!document) return null

  const data = firstData(document)
  if (asText(data.uid) !== uid || asText(data.deleted) === 'yes') return null

  const channel = channelAttributes(document)
  const owner = asText(data.owner_username) || asText(channel.username)
  const { aparatChannel: channelName } = useRuntimeConfig()
  if (owner.toLowerCase() !== channelName.toLowerCase()) return null

  const video = aparatVideo.safeParse(data)
  if (!video.success) {
    console.error(
      `[aparat] video "${uid}" has an unexpected shape: ${describeIssues(video.error)}`
    )
    throw badGateway('بارگذاری ویدیو انجام نشد')
  }

  return mapDetail(video.data, channel)
}

async function aparat(url: string): Promise<AparatDocument | null> {
  let body: unknown
  try {
    body = await $fetch(url, {
      timeout: requestTimeoutMs,
      headers: { 'user-agent': 'Mozilla/5.0' },
    })
  } catch (error) {
    const statusCode = errorStatus(error)
    if (statusCode === 400 || statusCode === 404) return null
    console.error(
      `[aparat] request failed (${statusCode || 'no response'}): ${url}`,
      error
    )
    throw error
  }

  const document = aparatDocument.safeParse(body)
  if (!document.success) {
    console.error(
      `[aparat] unexpected response from ${url}: ${describeIssues(document.error)}`
    )
    throw badGateway('بارگذاری ویدیوها انجام نشد')
  }
  return document.data
}

function parseVideo(attributes: unknown) {
  const video = aparatVideo.safeParse(attributes ?? {})
  if (video.success) return video.data

  const uid = isRecord(attributes) ? asText(attributes.uid) : ''
  console.warn(
    `[aparat] skipped video "${uid || 'unknown'}": ${describeIssues(video.error)}`
  )
  return null
}

function mapSummary(video: AparatVideo, channel: AparatChannel): VideoSummary {
  return {
    uid: video.uid,
    title: plainText(video.title),
    posterUrl: asText(video.big_poster),
    posterSrcset: posterSrcset(video),
    durationSeconds: numberCount(video.duration),
    visitCount: numberCount(
      video.visit_cnt_int ?? video.visit_cnt_non_formatted ?? video.visit_cnt
    ),
    publishedAt:
      isoDate(video.sdate_real) ||
      isoDate(video.sdate_rss) ||
      isoDate(video.mdate),
    publishedAtLabel: asText(video.sdate),
    senderName:
      plainText(video.sender_name) ||
      plainText(channel.displayName) ||
      plainText(channel.name),
    profilePhotoUrl: asText(video.profilePhoto) || asText(channel.avatar),
  }
}

function mapDetail(video: AparatVideo, channel: AparatChannel): VideoDetail {
  return {
    ...mapSummary(video, channel),
    description: plainText(video.description),
    likeCount: numberCount(video.like_cnt_non_formatted ?? video.like_cnt),
    followerCount: numberCount(channel.follower_cnt),
    tags: stringList(video.tags),
    playbackUrl: mp4Url(video.file_link_all),
    embedUrl: aparatUrl(video.frame_src) || aparatUrl(video.frame),
  }
}

function channelAttributes(document: AparatDocument): AparatChannel {
  const resource = (document.included ?? []).find(
    (item) => item.type === 'channel'
  )
  const channel = aparatChannel.safeParse(resource?.attributes ?? {})
  if (channel.success) return channel.data

  console.warn(
    `[aparat] ignored channel details: ${describeIssues(channel.error)}`
  )
  return {}
}

function firstData(document: AparatDocument): Record<string, unknown> {
  const data = Array.isArray(document.data) ? document.data[0] : document.data
  return data?.attributes ?? {}
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(plainText).filter((item) => item !== '')
}

function clampPerPage(value: number | undefined) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return 9
  return Math.min(parsed, 24)
}

function badGateway(message: string) {
  return createError({ statusCode: 502, message })
}

function errorStatus(error: unknown) {
  if (!isRecord(error)) return 0
  const statusCode = error.statusCode ?? error.status
  return typeof statusCode === 'number' ? statusCode : 0
}
