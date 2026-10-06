export function numberCount(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value))
    return Math.round(value)

  const raw = asText(value).replace(/[۰-۹]/g, (digit) =>
    String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
  )
  const match = raw.match(/[\d.]+/)
  if (!match) return 0

  const amount = Number(match[0])
  if (!Number.isFinite(amount)) return 0
  if (raw.includes('میلیون')) return Math.round(amount * 1_000_000)
  if (raw.includes('هزار')) return Math.round(amount * 1_000)
  return Math.round(amount)
}

export function mp4Url(value: unknown) {
  if (!Array.isArray(value)) return ''

  const items = value.filter(isRecord)
  const preferred = ['720p', '480p', '360p', '1080p', '240p', '144p']

  for (const profile of preferred) {
    const match = items.find((item) => asText(item.profile) === profile)
    const url = firstMp4(match)
    if (url) return url
  }

  return firstMp4(items[0])
}

function firstMp4(item: Record<string, unknown> | undefined) {
  if (!item || !Array.isArray(item.urls)) return ''

  const url = asText(item.urls[0])
  try {
    const parsed = new URL(url)
    const hostOk =
      parsed.hostname === 'asset.aparat.com' ||
      parsed.hostname.endsWith('.asset.aparat.com')
    if (
      parsed.protocol === 'https:' &&
      hostOk &&
      parsed.pathname.endsWith('.mp4')
    ) {
      return parsed.toString()
    }
  } catch {
    return ''
  }

  return ''
}

export function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
