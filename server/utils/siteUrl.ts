import type { H3Event } from 'h3'

export function siteUrl(event: H3Event, path: string) {
  const configured = useRuntimeConfig(event).public.siteUrl
  const origin = configured
    ? configured.replace(/\/+$/, '')
    : getRequestURL(event).origin
  return `${origin}${path}`
}
