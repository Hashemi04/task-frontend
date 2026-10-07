import type { VideoDetail } from '~/types/video'

export function isoDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds))
  if (!seconds) return ''

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${rest ? `${rest}S` : ''}`
}

export function videoJsonLd(video: VideoDetail, pageUrl: string) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description || video.title,
    thumbnailUrl: video.posterUrl || undefined,
    uploadDate: video.publishedAt || undefined,
    duration: isoDuration(video.durationSeconds) || undefined,
    embedUrl: video.embedUrl || undefined,
    url: pageUrl,
    inLanguage: 'fa',
    keywords: video.tags.length ? video.tags.join(', ') : undefined,
    author: video.senderName
      ? { '@type': 'Organization', name: video.senderName }
      : undefined,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: video.visitCount,
    },
  }

  // Keeps "</script>" inside a title or description from closing the tag.
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
