const countFormat = new Intl.NumberFormat('en-US')

export function formatCount(value: number) {
  return countFormat.format(Number.isFinite(value) ? value : 0)
}
