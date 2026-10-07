const countFormat = new Intl.NumberFormat('fa-IR')

export function formatCount(value: number) {
  return countFormat.format(Number.isFinite(value) ? value : 0)
}
