export function useSiteUrl() {
  const { siteUrl } = useRuntimeConfig().public
  const origin = siteUrl ? siteUrl.replace(/\/+$/, '') : useRequestURL().origin

  return (path: string) => `${origin}${path}`
}
