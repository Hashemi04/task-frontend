import { describe, expect, it } from 'vitest'
import { formatCount } from './formatCount'
import { toPersianDigits } from './formatDigits'
import { formatDuration } from './formatDuration'

describe('formatDuration', () => {
  it('leaves out the hours for short videos', () => {
    expect(formatDuration(0)).toBe('۰۰:۰۰')
    expect(formatDuration(192)).toBe('۰۳:۱۲')
    expect(formatDuration(3599)).toBe('۵۹:۵۹')
  })

  it('shows the hours once the video reaches one hour', () => {
    expect(formatDuration(3600)).toBe('۰۱:۰۰:۰۰')
    expect(formatDuration(3723)).toBe('۰۱:۰۲:۰۳')
  })

  it('treats invalid durations as zero', () => {
    expect(formatDuration(-5)).toBe('۰۰:۰۰')
    expect(formatDuration(Number.NaN)).toBe('۰۰:۰۰')
    expect(formatDuration(61.9)).toBe('۰۱:۰۱')
  })
})

describe('formatCount', () => {
  it('groups thousands with Persian digits', () => {
    expect(formatCount(624)).toBe('۶۲۴')
    expect(formatCount(1234567)).toBe('۱٬۲۳۴٬۵۶۷')
  })

  it('treats a non-finite count as zero', () => {
    expect(formatCount(Number.NaN)).toBe('۰')
  })
})

describe('toPersianDigits', () => {
  it('converts Latin and Arabic digits', () => {
    expect(toPersianDigits('1 هفته پیش')).toBe('۱ هفته پیش')
    expect(toPersianDigits('٢٠٢٦')).toBe('۲۰۲۶')
    expect(toPersianDigits(404)).toBe('۴۰۴')
  })
})
