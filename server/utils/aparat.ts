import type { VideoDetail, VideoPage, VideoSummary } from '~/types/video'
import { clampPage } from '~/utils/pagination'
import { searchKey } from '~/server/lib/searchText'
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

const catalogTtlMs = 60_000
const requestTimeoutMs = 8_000
const maxCatalogPages = 20

export interface CatalogVideo extends VideoSummary {
  description: string
  embedUrl: string
}

let catalogCache: { at: number; items: CatalogVideo[] } | null = null
let catalogRequest: Promise<CatalogVideo[]> | null = null

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

function toSummary({
  description: _description,
  embedUrl: _embedUrl,
  ...summary
}: CatalogVideo) {
  return summary
}

async function loadCatalog() {
  if (catalogCache && Date.now() - catalogCache.at < catalogTtlMs) {
    return catalogCache.items
  }

  if (!catalogRequest) {
    const stale = catalogCache?.items
    catalogRequest = fetchCatalog()
      .catch((error) => {
        if (!stale) throw error
        catalogCache = { at: Date.now(), items: stale }
        return stale
      })
      .finally(() => {
        catalogRequest = null
      })
  }

  return catalogRequest
}

async function fetchCatalog() {
  const items: CatalogVideo[] = []
  const seen = new Set<string>()
  const { aparatChannel } = useRuntimeConfig()
  let next: string | null =
    `https://www.aparat.com/api/fa/v1/user/video/list/username/${encodeURIComponent(aparatChannel)}`

  for (let pageIndex = 0; pageIndex < maxCatalogPages && next; pageIndex += 1) {
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
      const attributes = video.attributes ?? {}
      const summary = mapSummary(attributes, channel)
      if (!summary.uid || seen.has(summary.uid)) continue
      seen.add(summary.uid)
      items.push({
        ...summary,
        description: plainText(attributes.description),
        embedUrl: aparatUrl(attributes.frame),
      })
    }

    const list = firstData(document)
    const reportedTotal = numberCount(list.total) || items.length
    const link = list.link
    const nextLink = isRecord(link) ? asText(link.next) : ''
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
  if (asText(video.uid) !== uid || asText(video.deleted) === 'yes') return null

  const channel = resourceAttributes(document, 'channel')
  const owner = asText(video.owner_username) || asText(channel.username)
  const { aparatChannel } = useRuntimeConfig()
  if (owner.toLowerCase() !== aparatChannel.toLowerCase()) return null

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
    uid: asText(video.uid),
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
    description: plainText(video.description),
    likeCount: numberCount(video.like_cnt_non_formatted ?? video.like_cnt),
    followerCount: numberCount(channel.follower_cnt),
    tags: stringList(video.tags),
    playbackUrl: mp4Url(video.file_link_all),
    embedUrl: aparatUrl(video.frame_src) || aparatUrl(video.frame),
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

function stringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(plainText).filter((item) => item !== '')
}

function errorStatus(error: unknown) {
  if (!isRecord(error)) return 0
  const statusCode = error.statusCode ?? error.status
  return typeof statusCode === 'number' ? statusCode : 0
}
