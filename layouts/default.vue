<script setup lang="ts">
const route = useRoute()
const url = useSiteUrl()

const title = 'ویدیوهای صرافی تبدیل'
const description = 'ویدیوهای آموزشی کانال صرافی ارز دیجیتال تبدیل'

useSeoMeta({
  title,
  description,
  ogSiteName: 'صرافی تبدیل',
  ogLocale: 'fa_IR',
  ogType: 'website',
  ogTitle: title,
  ogDescription: description,
  ogImage: url('/og-image.png'),
  ogImageAlt: title,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ink">
    <AppHeader :show-search="route.meta.showSearch === true" />
    <main class="flex-1 bg-surface">
      <slot />
    </main>
  </div>
</template>
