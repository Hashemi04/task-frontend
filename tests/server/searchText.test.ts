import { describe, expect, it } from 'vitest'
import { searchKey } from '~/server/lib/searchText'

describe('searchKey', () => {
  it('maps Arabic letters to their Persian forms', () => {
    expect(searchKey('كيف')).toBe(searchKey('کیف'))
    expect(searchKey('مدرسة')).toBe(searchKey('مدرسه'))
  })

  it('treats spaces and half-spaces the same way', () => {
    expect(searchKey('می‌کنیم')).toBe('میکنیم')
    expect(searchKey('می کنیم')).toBe('میکنیم')
  })

  it('drops diacritics and the tatweel', () => {
    expect(searchKey('ارزِ دیجیـــتال')).toBe(searchKey('ارز دیجیتال'))
  })

  it('reads Persian and Arabic digits as Latin digits', () => {
    expect(searchKey('۲۰۲۶')).toBe('2026')
    expect(searchKey('٢٠٢٦')).toBe('2026')
  })

  it('ignores Latin letter case', () => {
    expect(searchKey('  Bitcoin ')).toBe('bitcoin')
  })
})
