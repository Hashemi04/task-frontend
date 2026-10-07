import type { CatalogVideo } from '~/server/utils/aparat'

const xmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

function xml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (char) => xmlEscapes[char] ?? char)
}

// Google rejects video descriptions longer than 2048 characters.
function clip(value: string, max = 2048) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function videoEntry(video: CatalogVideo, url: (path: string) => string) {
  const details = [
    `<video:thumbnail_loc>${xml(video.posterUrl)}</video:thumbnail_loc>`,
    `<video:title>${xml(clip(video.title, 100))}</video:title>`,
    `<video:description>${xml(clip(video.description || video.title))}</video:description>`,
    video.embedUrl
      ? `<video:player_loc>${xml(video.embedUrl)}</video:player_loc>`
      : '',
    video.durationSeconds
      ? `<video:duration>${video.durationSeconds}</video:duration>`
      : '',
    video.publishedAt
      ? `<video:publication_date>${xml(video.publishedAt)}</video:publication_date>`
      : '',
    `<video:view_count>${video.visitCount}</video:view_count>`,
  ].filter(Boolean)

  const lastmod = video.publishedAt
    ? `<lastmod>${xml(video.publishedAt)}</lastmod>`
    : ''
  const media =
    video.posterUrl && video.embedUrl
      ? `<video:video>${details.join('')}</video:video>`
      : ''

  return `<url><loc>${xml(url(`/videos/${video.uid}`))}</loc>${lastmod}${media}</url>`
}

export function buildSitemap(
  videos: CatalogVideo[],
  url: (path: string) => string
) {
  const entries = [
    `<url><loc>${xml(url('/'))}</loc></url>`,
    ...videos.map((video) => videoEntry(video, url)),
  ]

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
    ...entries,
    '</urlset>',
  ].join('\n')
}
