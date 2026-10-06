import type { VideoDetail, VideoPage, VideoSummary } from '../../types/video'

const channelUsername = 'tabdealplatform'
const listUrl = `https://www.aparat.com/api/fa/v1/user/video/list/username/${channelUsername}`

interface AparatResource {
  type?: string
  attributes?: Record<string, unknown>
}

interface AparatDocument {
  data?: AparatResource | AparatResource[]
  included?: AparatResource[]
}

export async function fetchChannelPage(): Promise<VideoPage> {
  const items: VideoSummary[] = []
  let totalCount = 0
  let next: string | null = listUrl

  for (let attempt = 0; attempt < 5 && next; attempt += 1) {
    const document = await aparat(next)
    if (!document) {
      throw createError({
        statusCode: 502,
        message: 'بارگذاری ویدیوها انجام نشد',
      })
    }

    const channel = resourceAttributes(document, 'channel')
    const videos = (document.included ?? []).filter((item) => item.type === 'Video')

    for (const video of videos) {
      const summary = mapSummary(video.attributes ?? {}, channel)
      if (summary.uid) items.push(summary)
    }

    const list = firstData(document)
    totalCount = numberCount(list.total) || items.length
    const link = list.link
    const nextLink = isRecord(link) ? text(link.next) : ''
    next = nextLink && items.length < totalCount ? nextLink : null
  }

  return {
    items,
    page: 1,
    perPage: items.length,
    totalCount,
  }
}

export async function fetchVideoDetail(uid: string): Promise<VideoDetail | null> {
  if (!/^[\w-]+$/.test(uid)) return null

  const document = await aparat(
    `https://www.aparat.com/api/fa/v1/video/video/show/videohash/${uid}`,
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
      headers: { 'user-agent': 'Mozilla/5.0' },
    })
  } catch (error) {
    const statusCode = errorStatus(error)
    if (statusCode === 400 || statusCode === 404) return null
    throw error
  }
}

function mapSummary(video: Record<string, unknown>, channel: Record<string, unknown>): VideoSummary {
  return {
    uid: text(video.uid),
    title: text(video.title),
    posterUrl: text(video.big_poster),
    durationSeconds: numberCount(video.duration),
    visitCount: numberCount(video.visit_cnt_int ?? video.visit_cnt_non_formatted ?? video.visit_cnt),
    publishedAtLabel: text(video.sdate),
    senderName: text(video.sender_name) || text(channel.displayName) || text(channel.name),
    profilePhotoUrl: text(video.profilePhoto) || text(channel.avatar),
  }
}

function mapDetail(video: Record<string, unknown>, channel: Record<string, unknown>): VideoDetail {
  return {
    ...mapSummary(
      {
        ...video,
        sender_name: video.sender_name ?? channel.displayName ?? channel.name,
        profilePhoto: video.profilePhoto ?? channel.avatar,
        visit_cnt_int: video.visit_cnt_non_formatted ?? video.visit_cnt,
      },
      channel,
    ),
    description: text(video.description),
    likeCount: numberCount(video.like_cnt_non_formatted ?? video.like_cnt),
    followerCount: numberCount(channel.follower_cnt),
    tags: stringList(video.tags),
    playbackUrl: mp4Url(video.file_link_all),
  }
}

function mp4Url(value: unknown) {
  if (!Array.isArray(value)) return ''

  const items = value.filter(isRecord)
  const preferred = ['720p', '480p', '360p', '1080p', '240p', '144p']

  for (const profile of preferred) {
    const match = items.find((item) => text(item.profile) === profile)
    const url = firstMp4(match)
    if (url) return url
  }

  return firstMp4(items[0])
}

function firstMp4(item: Record<string, unknown> | undefined) {
  if (!item || !Array.isArray(item.urls)) return ''

  const url = text(item.urls[0])
  try {
    const parsed = new URL(url)
    const hostOk = parsed.hostname === 'asset.aparat.com' || parsed.hostname.endsWith('.asset.aparat.com')
    if (parsed.protocol === 'https:' && hostOk && parsed.pathname.endsWith('.mp4')) {
      return parsed.toString()
    }
  } catch {
    return ''
  }

  return ''
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
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

function numberCount(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value)

  const raw = text(value).replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  const match = raw.match(/[\d.]+/)
  if (!match) return 0

  const amount = Number(match[0])
  if (!Number.isFinite(amount)) return 0
  if (raw.includes('میلیون')) return Math.round(amount * 1_000_000)
  if (raw.includes('هزار')) return Math.round(amount * 1_000)
  return Math.round(amount)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function errorStatus(error: unknown) {
  if (!isRecord(error)) return 0
  const statusCode = error.statusCode ?? error.status
  return typeof statusCode === 'number' ? statusCode : 0
}
