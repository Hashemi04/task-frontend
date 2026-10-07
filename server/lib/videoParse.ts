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

export function aparatUrl(value: unknown) {
  try {
    const url = new URL(asText(value))
    const hostOk =
      url.hostname === 'aparat.com' || url.hostname.endsWith('.aparat.com')
    return url.protocol === 'https:' && hostOk ? url.toString() : ''
  } catch {
    return ''
  }
}

const posterWidths = [
  ['small_poster', 300],
  ['medium_poster', 700],
  ['big_poster', 900],
] as const

export function posterSrcset(video: Record<string, unknown>) {
  return posterWidths
    .map(([key, width]) => {
      const url = aparatUrl(video[key])
      return url ? `${url} ${width}w` : ''
    })
    .filter(Boolean)
    .join(', ')
}

// Aparat sends Tehran wall-clock time without an offset. Iran has used +03:30
// all year since 2022, so older summer uploads can be an hour off.
export function isoDate(value: unknown) {
  const text = asText(value)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(text))
    return text
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/)
  return match ? `${match[1]}T${match[2]}+03:30` : ''
}

export function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

const namedEntities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  zwnj: '\u200C',
  laquo: '«',
  raquo: '»',
}

// Aparat returns titles and descriptions with HTML entities; Vue escapes text again.
export function plainText(value: unknown) {
  return asText(value).replace(
    /&(#x[\da-f]+|#\d+|[a-z]+);/gi,
    (entity, name: string) => {
      if (name[0] !== '#') return namedEntities[name.toLowerCase()] ?? entity
      const code =
        name[1] === 'x' || name[1] === 'X'
          ? parseInt(name.slice(2), 16)
          : parseInt(name.slice(1), 10)
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity
    }
  )
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
