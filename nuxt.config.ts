// https://nuxt.com/docs/api/configuration/nuxt-config
// Shared caching is left to the CDN: Nitro's in-memory route cache is
// per-instance on serverless hosts, and on Vercel it becomes ISR that never
// expires.
function cdnCache(seconds: number) {
  return {
    'cache-control': `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 10}`,
  }
}
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint', '@nuxt/test-utils/module'],
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  runtimeConfig: {
    aparatChannel: 'tabdealplatform',
    public: {
      siteUrl: 'https://tabdeal-frontend-task.vercel.app',
    },
  },
  routeRules: {
    '/': { headers: cdnCache(60) },
    '/videos/**': { headers: cdnCache(300) },
    '/api/videos': { headers: cdnCache(60) },
    '/api/videos/**': { headers: cdnCache(300) },
    '/sitemap.xml': { headers: cdnCache(3600) },
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'fa',
        dir: 'rtl',
      },
      meta: [{ name: 'theme-color', content: '#141414' }],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://static.cdn.asset.aparat.com' },
      ],
    },
  },
})
