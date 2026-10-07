import { describe, expect, it } from 'vitest'
import { clampPage, paginationItems } from './pagination'

const pages = (items: ReturnType<typeof paginationItems>) =>
  items.map((item) => (item.type === 'page' ? item.page : '...'))

describe('clampPage', () => {
  it('keeps an in-range page', () => {
    expect(clampPage(2, 10)).toBe(2)
  })

  it('pulls a page back inside the catalog', () => {
    expect(clampPage(0, 5)).toBe(1)
    expect(clampPage(9, 3)).toBe(3)
    expect(clampPage(Number.NaN, 4)).toBe(1)
    expect(clampPage(2, 0)).toBe(1)
  })
})

describe('paginationItems', () => {
  it('lists every page when they fit in the window', () => {
    expect(pages(paginationItems(2, 4))).toEqual([1, 2, 3, 4])
    expect(pages(paginationItems(1, 1))).toEqual([1])
  })

  it('centers the window on the current page', () => {
    expect(pages(paginationItems(6, 12))).toEqual(['...', 4, 5, 6, 7, 8, '...'])
  })

  it('pins the window to the first pages', () => {
    expect(pages(paginationItems(1, 12))).toEqual([1, 2, 3, 4, 5, '...'])
    expect(pages(paginationItems(3, 12))).toEqual([1, 2, 3, 4, 5, '...'])
  })

  it('pins the window to the last pages', () => {
    expect(pages(paginationItems(12, 12))).toEqual(['...', 8, 9, 10, 11, 12])
    expect(pages(paginationItems(11, 12))).toEqual(['...', 8, 9, 10, 11, 12])
  })

  it('clamps an out-of-range page before building the window', () => {
    expect(pages(paginationItems(40, 7))).toEqual(['...', 3, 4, 5, 6, 7])
    expect(pages(paginationItems(0, 0))).toEqual([1])
  })

  it('gives each ellipsis a distinct position', () => {
    const ellipses = paginationItems(6, 12).filter(
      (item) => item.type === 'ellipsis'
    )
    expect(ellipses).toEqual([
      { type: 'ellipsis', position: 'start' },
      { type: 'ellipsis', position: 'end' },
    ])
  })
})
