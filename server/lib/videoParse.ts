export function numberCount(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value))
    return Math.round(value)

  const raw = asText(value)
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[,٬]/g, '')
    .replace(/٫/g, '.')
  const match = raw.match(/\d+(?:\.\d+)?/)
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

const tehranOffsetFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tehran',
  timeZoneName: 'longOffset',
})

function tehranOffsetMinutes(instant: number) {
  const name = tehranOffsetFormat
    .formatToParts(new Date(instant))
    .find((part) => part.type === 'timeZoneName')?.value
  const match = name?.match(/^GMT([+-])(\d{2}):(\d{2})$/)
  if (!match) return 210
  const minutes = Number(match[2]) * 60 + Number(match[3])
  return match[1] === '-' ? -minutes : minutes
}

function offsetLabel(minutes: number) {
  const sign = minutes < 0 ? '-' : '+'
  const absolute = Math.abs(minutes)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`
}

// Aparat sends Tehran wall-clock time without an offset, and Iran used
// daylight saving time (+04:30) in summer until 2022.
export function isoDate(value: unknown) {
  const text = asText(value)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(text))
    return text
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/
  )
  if (!match) return ''

  const [, year, month, day, hour, minute, second] = match.map(Number)
  const wallClock = Date.UTC(year!, month! - 1, day, hour, minute, second)
  const guess = tehranOffsetMinutes(wallClock)
  const offset = tehranOffsetMinutes(wallClock - guess * 60_000)
  return `${text.replace(' ', 'T')}${offsetLabel(offset)}`
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
