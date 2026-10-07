import { describe, expect, it } from 'vitest'
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

const mp4 = (profile: string, url: string) => ({ profile, urls: [url] })

describe('numberCount', () => {
  it('rounds a finite number', () => {
    expect(numberCount(12)).toBe(12)
    expect(numberCount(12.6)).toBe(13)
  })

  it('reads Persian digits and the هزار and میلیون suffixes', () => {
    expect(numberCount('۱۲۳')).toBe(123)
    expect(numberCount('1.5 هزار')).toBe(1500)
    expect(numberCount('2 میلیون')).toBe(2_000_000)
  })

  it('reads thousands separators and the Persian decimal point', () => {
    expect(numberCount('1,234')).toBe(1234)
    expect(numberCount('۱٬۲۳۴٬۵۶۷')).toBe(1_234_567)
    expect(numberCount('٢٬٥٠٠')).toBe(2500)
    expect(numberCount('۱٫۵ هزار')).toBe(1500)
  })

  it('returns 0 when there is no number', () => {
    expect(numberCount('ندارد')).toBe(0)
    expect(numberCount(Number.NaN)).toBe(0)
  })
})

describe('mp4Url', () => {
  it('prefers 720p over a higher profile that appears first', () => {
    const url = mp4Url([
      mp4('1080p', 'https://caspian.asset.aparat.com/video/1080.mp4?t=1'),
      mp4('720p', 'https://caspian.asset.aparat.com/video/720.mp4?t=1'),
    ])

    expect(url).toBe('https://caspian.asset.aparat.com/video/720.mp4?t=1')
  })

  it('rejects files that are not an https mp4 on Aparat', () => {
    expect(
      mp4Url([mp4('720p', 'http://caspian.asset.aparat.com/video/720.mp4')])
    ).toBe('')
    expect(mp4Url([mp4('720p', 'https://evil.example/video/720.mp4')])).toBe('')
    expect(
      mp4Url([
        mp4('720p', 'https://caspian.asset.aparat.com/video/720.apt?t=1'),
      ])
    ).toBe('')
    expect(mp4Url('https://caspian.asset.aparat.com/video/720.mp4')).toBe('')
  })
})

describe('asText', () => {
  it('trims strings and drops everything else', () => {
    expect(asText('  عنوان ')).toBe('عنوان')
    expect(asText(12)).toBe('')
    expect(asText(null)).toBe('')
  })
})

describe('plainText', () => {
  it('decodes the entities Aparat sends', () => {
    expect(plainText(' بخش &laquo;اهرم آسان&raquo; ')).toBe('بخش «اهرم آسان»')
    expect(plainText('Q&amp;A &#8211; &#x2022;')).toBe('Q&A – •')
  })

  it('keeps unknown or invalid entities as text', () => {
    expect(plainText('&unknown; &#0; &#xFFFFFFF;')).toBe(
      '&unknown; &#0; &#xFFFFFFF;'
    )
  })

  it('returns an empty string for non-strings', () => {
    expect(plainText(null)).toBe('')
  })
})

describe('isoDate', () => {
  it('adds the Tehran offset to Aparat wall-clock times', () => {
    expect(isoDate('2026-09-29 10:00:06')).toBe('2026-09-29T10:00:06+03:30')
  })

  it('uses daylight saving time for summer uploads before 2023', () => {
    expect(isoDate('2020-07-01 12:00:00')).toBe('2020-07-01T12:00:00+04:30')
    expect(isoDate('2021-01-10 08:00:00')).toBe('2021-01-10T08:00:00+03:30')
    expect(isoDate('2023-07-01 12:00:00')).toBe('2023-07-01T12:00:00+03:30')
  })

  it('keeps dates that already carry an offset', () => {
    expect(isoDate('2026-09-29T10:00:06+03:30')).toBe(
      '2026-09-29T10:00:06+03:30'
    )
    expect(isoDate('2026-09-29T06:30:06Z')).toBe('2026-09-29T06:30:06Z')
  })

  it('drops labels it cannot place in time', () => {
    expect(isoDate('07 مهر 1405')).toBe('')
    expect(isoDate(undefined)).toBe('')
  })
})

describe('aparatUrl', () => {
  it('accepts https links on Aparat hosts only', () => {
    expect(aparatUrl('https://www.aparat.com/video/embed/a')).toBe(
      'https://www.aparat.com/video/embed/a'
    )
    expect(aparatUrl('http://www.aparat.com/a')).toBe('')
    expect(aparatUrl('https://aparat.com.evil.io/a')).toBe('')
    expect(aparatUrl('javascript:alert(1)')).toBe('')
  })
})

describe('posterSrcset', () => {
  it('lists the poster sizes Aparat provides', () => {
    expect(
      posterSrcset({
        small_poster: 'https://static.cdn.asset.aparat.com/p.jpg?width=300',
        big_poster: 'https://static.cdn.asset.aparat.com/p.jpg?width=900',
        medium_poster: 'https://example.com/p.jpg',
      })
    ).toBe(
      'https://static.cdn.asset.aparat.com/p.jpg?width=300 300w, https://static.cdn.asset.aparat.com/p.jpg?width=900 900w'
    )
  })

  it('is empty without posters', () => {
    expect(posterSrcset({})).toBe('')
  })
})

describe('isRecord', () => {
  it('accepts objects only', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord([])).toBe(true)
    expect(isRecord(null)).toBe(false)
    expect(isRecord('x')).toBe(false)
  })
})
