import type { VideoDetail, VideoPage, VideoSummary } from '~/types/video'
import { clampPage, mp4Url, numberCount } from '~/utils/videoParse'

const channelUsername = 'tabdealplatform'
const listUrl = `https://www.aparat.com/api/fa/v1/user/video/list/username/${channelUsername}`
const catalogTtlMs = 60_000
const requestTimeoutMs = 8_000
const maxCatalogPages = 20

let catalogCache: { at: number; items: VideoSummary[] } | null = null
let catalogRequest: Promise<VideoSummary[]> | null = null

interface AparatResource {
  type?: string
  attributes?: Record<string, unknown>
}

interface AparatDocument {
  data?: AparatResource | AparatResource[]
  included?: AparatResource[]
}

export async function fetchChannelPage(
  input: {
    q?: string
    page?: number
    perPage?: number
  } = {}
): Promise<VideoPage> {
  const catalog = await loadCatalog()
  const q = (input.q ?? '').trim().toLowerCase()
  const matched = q
    ? catalog.filter((video) => video.title.toLowerCase().includes(q))
    : catalog
  const perPage = clampPerPage(input.perPage)
  const pageCount = Math.max(1, Math.ceil(matched.length / perPage))
  const page = clampPage(input.page ?? 1, matched.length === 0 ? 1 : pageCount)
  const start = (page - 1) * perPage

  return {
    items: matched.slice(start, start + perPage),
    page,
    perPage,
    totalCount: matched.length,
  }
}

async function loadCatalog() {
  if (catalogCache && Date.now() - catalogCache.at < catalogTtlMs) {
    return catalogCache.items
  }

  if (!catalogRequest) {
    catalogRequest = fetchCatalog().finally(() => {
      catalogRequest = null
    })
  }

  return catalogRequest
}

async function fetchCatalog() {
  const items: VideoSummary[] = []
  const seen = new Set<string>()
  let next: string | null = listUrl
  let reportedTotal = 0

  for (let attempt = 0; attempt < maxCatalogPages && next; attempt += 1) {
    const document = await aparat(next)
    if (!document) {
      throw createError({
        statusCode: 502,
        message: 'بارگذاری ویدیوها انجام نشد',
      })
    }

    const channel = resourceAttributes(document, 'channel')
    const videos = (document.included ?? []).filter(
      (item) => item.type === 'Video'
    )

    for (const video of videos) {
      const summary = mapSummary(video.attributes ?? {}, channel)
      if (!summary.uid || seen.has(summary.uid)) continue
      seen.add(summary.uid)
      items.push(summary)
    }

    const list = firstData(document)
    reportedTotal = numberCount(list.total) || items.length
    const link = list.link
    const nextLink = isRecord(link) ? text(link.next) : ''
    next = nextLink && items.length < reportedTotal ? nextLink : null
  }

  catalogCache = { at: Date.now(), items }
  return items
}

function clampPerPage(value: number | undefined) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return 9
  return Math.min(parsed, 24)
}

export async function fetchVideoDetail(
  uid: string
): Promise<VideoDetail | null> {
  if (!/^[\w-]+$/.test(uid)) return null

  const document = await aparat(
    `https://www.aparat.com/api/fa/v1/video/video/show/videohash/${uid}`
  )
  if (!document) return null

  const video = firstData(document)
  if (text(video.uid) !== uid || text(video.deleted) === 'yes') return null

  const channel = resourceAttributes(document, 'channel')
  return mapDetail(video, channel)
}

async function aparat(url: string): Promise<AparatDocument | null> {
  try {
    return await $fetch<AparatDocument>(url, {
      timeout: requestTimeoutMs,
      headers: { 'user-agent': 'Mozilla/5.0' },
    })
  } catch (error) {
    const statusCode = errorStatus(error)
    if (statusCode === 400 || statusCode === 404) return null
    throw error
  }
}

function mapSummary(
  video: Record<string, unknown>,
  channel: Record<string, unknown>
): VideoSummary {
  return {
    uid: text(video.uid),
    title: text(video.title),
    posterUrl: text(video.big_poster),
    durationSeconds: numberCount(video.duration),
    visitCount: numberCount(
      video.visit_cnt_int ?? video.visit_cnt_non_formatted ?? video.visit_cnt
    ),
    publishedAtLabel: text(video.sdate),
    senderName:
      text(video.sender_name) ||
      text(channel.displayName) ||
      text(channel.name),
    profilePhotoUrl: text(video.profilePhoto) || text(channel.avatar),
  }
}

function mapDetail(
  video: Record<string, unknown>,
  channel: Record<string, unknown>
): VideoDetail {
  return {
    ...mapSummary(
      {
        ...video,
        sender_name: video.sender_name ?? channel.displayName ?? channel.name,
        profilePhoto: video.profilePhoto ?? channel.avatar,
      },
      channel
    ),
    description: text(video.description),
    likeCount: numberCount(video.like_cnt_non_formatted ?? video.like_cnt),
    followerCount: numberCount(channel.follower_cnt),
    tags: stringList(video.tags),
    playbackUrl: mp4Url(video.file_link_all),
  }
}

function resourceAttributes(document: AparatDocument, type: string) {
  const resource = (document.included ?? []).find((item) => item.type === type)
  return resource?.attributes ?? {}
}

function firstData(document: AparatDocument) {
  const data = Array.isArray(document.data) ? document.data[0] : document.data
  return data?.attributes ?? {}
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function errorStatus(error: unknown) {
  if (!isRecord(error)) return 0
  const statusCode = error.statusCode ?? error.status
  return typeof statusCode === 'number' ? statusCode : 0
}
