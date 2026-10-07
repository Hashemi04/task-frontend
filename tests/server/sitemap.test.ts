import { describe, expect, it } from 'vitest'
import { buildSitemap } from '~/server/lib/sitemap'
import type { CatalogVideo } from '~/server/utils/aparat'

const url = (path: string) => `https://videos.tabdeal.org${path}`

function catalogVideo(overrides: Partial<CatalogVideo> = {}): CatalogVideo {
  return {
    uid: 'abc',
    title: 'آموزش & ترفند',
    posterUrl: 'https://static.cdn.asset.aparat.com/p.jpg?width=900&secret=x',
    posterSrcset: '',
    durationSeconds: 517,
    visitCount: 702,
    publishedAt: '2026-09-29T10:00:06+03:30',
    publishedAtLabel: '1 هفته پیش',
    senderName: 'تبدیل',
    profilePhotoUrl: '',
    description: 'توضیح <کامل>',
    embedUrl: 'https://www.aparat.com/video/video/embed/videohash/abc/vt/frame',
    ...overrides,
  }
}

describe('buildSitemap', () => {
  it('lists the home page and every video with its video details', () => {
    const xml = buildSitemap([catalogVideo()], url)

    expect(xml).toContain('<loc>https://videos.tabdeal.org/</loc>')
    expect(xml).toContain('<loc>https://videos.tabdeal.org/videos/abc</loc>')
    expect(xml).toContain('<lastmod>2026-09-29T10:00:06+03:30</lastmod>')
    expect(xml).toContain(
      '<video:thumbnail_loc>https://static.cdn.asset.aparat.com/p.jpg?width=900&amp;secret=x</video:thumbnail_loc>'
    )
    expect(xml).toContain('<video:title>آموزش &amp; ترفند</video:title>')
    expect(xml).toContain(
      '<video:description>توضیح &lt;کامل&gt;</video:description>'
    )
    expect(xml).toContain('<video:duration>517</video:duration>')
    expect(xml).toContain('<video:view_count>702</video:view_count>')
  })

  it('falls back to the title when a video has no description', () => {
    const xml = buildSitemap([catalogVideo({ description: '' })], url)

    expect(xml).toContain(
      '<video:description>آموزش &amp; ترفند</video:description>'
    )
  })

  it('keeps the page but skips video details without a poster or player', () => {
    const xml = buildSitemap([catalogVideo({ embedUrl: '' })], url)

    expect(xml).toContain('<loc>https://videos.tabdeal.org/videos/abc</loc>')
    expect(xml).not.toContain('<video:video>')
  })
})
