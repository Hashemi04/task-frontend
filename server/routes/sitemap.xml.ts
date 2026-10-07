import { buildSitemap } from '~/server/lib/sitemap'

export default defineEventHandler(async (event) => {
  const videos = await fetchChannelVideos()

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return buildSitemap(videos, (path) => siteUrl(event, path))
})
