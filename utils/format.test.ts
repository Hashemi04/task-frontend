import { describe, expect, it } from 'vitest'
import { formatCount } from './formatCount'
import { formatDuration } from './formatDuration'

describe('formatDuration', () => {
  it('leaves out the hours for short videos', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(192)).toBe('03:12')
    expect(formatDuration(3599)).toBe('59:59')
  })

  it('shows the hours once the video reaches one hour', () => {
    expect(formatDuration(3600)).toBe('01:00:00')
    expect(formatDuration(3723)).toBe('01:02:03')
  })

  it('treats invalid durations as zero', () => {
    expect(formatDuration(-5)).toBe('00:00')
    expect(formatDuration(Number.NaN)).toBe('00:00')
    expect(formatDuration(61.9)).toBe('01:01')
  })
})

describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(624)).toBe('624')
    expect(formatCount(1234567)).toBe('1,234,567')
  })

  it('treats a non-finite count as zero', () => {
    expect(formatCount(Number.NaN)).toBe('0')
  })
})
