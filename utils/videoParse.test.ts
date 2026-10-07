import { describe, expect, it } from 'vitest'
import { asText, isRecord, mp4Url, numberCount } from './videoParse'

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

describe('isRecord', () => {
  it('accepts objects only', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord([])).toBe(true)
    expect(isRecord(null)).toBe(false)
    expect(isRecord('x')).toBe(false)
  })
})
