// https://nuxt.com/docs/api/configuration/nuxt-config
// Cached renders only see the headers listed here, and pages build absolute
// URLs from the host when `siteUrl` is not set.
const hostHeaders = ['host', 'x-forwarded-host', 'x-forwarded-proto']

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
      siteUrl: '',
    },
  },
  routeRules: {
    '/': { cache: { swr: true, maxAge: 60, varies: hostHeaders } },
    '/videos/**': { cache: { swr: true, maxAge: 300, varies: hostHeaders } },
    '/sitemap.xml': { cache: { swr: true, maxAge: 3600, varies: hostHeaders } },
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
