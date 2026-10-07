export type PaginationItem =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; position: 'start' | 'end' }

export function clampPage(page: number, pageCount: number) {
  const count = Math.max(1, Math.trunc(pageCount) || 1)
  const requested = Number.isFinite(page) ? Math.trunc(page) : 1
  return Math.min(Math.max(1, requested), count)
}

export function paginationItems(
  page: number,
  pageCount: number,
  windowSize = 5
): PaginationItem[] {
  const count = Math.max(1, Math.trunc(pageCount) || 1)
  const current = clampPage(page, count)
  const size = Math.min(windowSize, count)
  const start = Math.min(
    Math.max(1, current - Math.floor(size / 2)),
    count - size + 1
  )
  const end = start + size - 1

  const items: PaginationItem[] = []
  if (start > 1) items.push({ type: 'ellipsis', position: 'start' })
  for (let number = start; number <= end; number += 1) {
    items.push({ type: 'page', page: number })
  }
  if (end < count) items.push({ type: 'ellipsis', position: 'end' })

  return items
}
