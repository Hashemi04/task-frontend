<script setup lang="ts">
import type { VideoPage } from '~/types/video'

definePageMeta({ showSearch: true })

const { query } = useSearchQuery()
const requestedPage = useRequestedPage()
const cacheKey = (page: number) => `channel-videos-${query.value}-${page}`

const {
  data: videoPage,
  status,
  refresh,
} = await useAsyncData(
  () => cacheKey(requestedPage.value),
  () => {
    return $fetch<VideoPage>('/api/videos', {
      query: {
        q: query.value || undefined,
        page: requestedPage.value,
        perPage: videoPageSize,
      },
    })
  },
  {
    getCachedData: (key, nuxtApp) =>
      nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  }
)

const { currentPage, pageCount, pageLink } = useVideoPagination(
  videoPage,
  cacheKey
)
const visibleVideos = computed(() => videoPage.value?.items ?? [])

const url = useSiteUrl()
const canonicalUrl = computed(() => {
  if (query.value) return ''
  return url(currentPage.value > 1 ? `/?page=${currentPage.value}` : '/')
})

useSeoMeta({
  robots: () => (query.value ? 'noindex, follow' : undefined),
  ogUrl: () => canonicalUrl.value || undefined,
})

useHead(() => ({
  link: canonicalUrl.value
    ? [{ rel: 'canonical', href: canonicalUrl.value }]
    : [],
}))

// loading: the request is still pending and nothing has arrived yet
const isLoading = computed(() => status.value === 'pending' && !videoPage.value)
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-6 md:px-6" :aria-busy="isLoading">
    <h1 class="sr-only">ویدیوهای آموزشی صرافی تبدیل</h1>

    <!-- loading -->
    <ul v-if="isLoading" class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <li v-for="index in videoPageSize" :key="index">
        <VideoCardSkeleton />
      </li>
    </ul>

    <!-- error -->
    <div
      v-else-if="status === 'error'"
      class="flex flex-col items-center gap-4 py-16 text-center"
      role="alert"
    >
      <p>بارگذاری ویدیوها انجام نشد</p>
      <BaseButton @click="refresh()"> تلاش دوباره </BaseButton>
    </div>

    <!-- empty -->
    <p
      v-else-if="!visibleVideos.length"
      class="py-16 text-center text-white/70"
    >
      ویدیویی برای نمایش وجود ندارد
    </p>

    <!-- ready -->
    <template v-else>
      <ul class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <li v-for="(video, index) in visibleVideos" :key="video.uid">
          <VideoCard :video="video" :eager="index < 3" />
        </li>
      </ul>

      <VideoPagination
        class="mt-8"
        :page="currentPage"
        :page-count="pageCount"
        :page-link="pageLink"
      />
    </template>
  </section>
</template>
