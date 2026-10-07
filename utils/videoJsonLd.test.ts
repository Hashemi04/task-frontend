import { describe, expect, it } from 'vitest'
import type { VideoDetail } from '~/types/video'
import { isoDuration, videoJsonLd } from './videoJsonLd'

const video: VideoDetail = {
  uid: 'abc',
  title: 'آموزش اهرم',
  posterUrl: 'https://static.cdn.asset.aparat.com/p.jpg',
  posterSrcset: '',
  durationSeconds: 517,
  visitCount: 702,
  publishedAt: '2026-09-29T10:00:06+03:30',
  publishedAtLabel: '1 هفته پیش',
  senderName: 'صرافی تبدیل',
  profilePhotoUrl: '',
  description: 'توضیح',
  likeCount: 17,
  followerCount: 7000,
  tags: ['کریپتو', 'تتر'],
  playbackUrl: '',
  embedUrl: 'https://www.aparat.com/video/video/embed/videohash/abc/vt/frame',
}

describe('isoDuration', () => {
  it('writes ISO 8601 durations without empty parts', () => {
    expect(isoDuration(517)).toBe('PT8M37S')
    expect(isoDuration(3600)).toBe('PT1H')
    expect(isoDuration(6202)).toBe('PT1H43M22S')
    expect(isoDuration(0)).toBe('')
  })
})

describe('videoJsonLd', () => {
  it('describes the video for search engines', () => {
    expect(JSON.parse(videoJsonLd(video, 'https://x.ir/videos/abc'))).toEqual({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'آموزش اهرم',
      description: 'توضیح',
      thumbnailUrl: 'https://static.cdn.asset.aparat.com/p.jpg',
      uploadDate: '2026-09-29T10:00:06+03:30',
      duration: 'PT8M37S',
      embedUrl:
        'https://www.aparat.com/video/video/embed/videohash/abc/vt/frame',
      url: 'https://x.ir/videos/abc',
      inLanguage: 'fa',
      keywords: 'کریپتو, تتر',
      author: { '@type': 'Organization', name: 'صرافی تبدیل' },
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'WatchAction' },
        userInteractionCount: 702,
      },
    })
  })

  it('leaves out missing fields and falls back to the title', () => {
    const data = JSON.parse(
      videoJsonLd(
        {
          ...video,
          description: '',
          publishedAt: '',
          embedUrl: '',
          tags: [],
          senderName: '',
        },
        'https://x.ir/videos/abc'
      )
    )

    expect(data.description).toBe('آموزش اهرم')
    expect(data).not.toHaveProperty('uploadDate')
    expect(data).not.toHaveProperty('embedUrl')
    expect(data).not.toHaveProperty('keywords')
    expect(data).not.toHaveProperty('author')
  })

  it('cannot close the surrounding script tag', () => {
    const json = videoJsonLd(
      { ...video, title: '</script><script>alert(1)</script>' },
      'https://x.ir/videos/abc'
    )

    expect(json).not.toContain('</script>')
    expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script>')
  })
})
