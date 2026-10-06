<script setup lang="ts">
import type { VideoPage } from '~/types/video'

const route = useRoute()
const { query } = useSearchQuery()
const pageSize = useVideoPageSize()

const requestedPage = computed(() => {
  const value = Number(route.query.page)
  return Number.isInteger(value) && value > 0 ? value : 1
})

const {
  data: videoPage,
  status,
  refresh,
} = await useAsyncData(
  () =>
    `channel-videos-${query.value}-${requestedPage.value}-${pageSize.value}`,
  () => {
    return $fetch<VideoPage>('/api/videos', {
      query: {
        q: query.value || undefined,
        page: requestedPage.value,
        perPage: pageSize.value,
      },
    })
  },
  { watch: [query, requestedPage, pageSize] }
)

const totalCount = computed(() => videoPage.value?.totalCount ?? 0)
const { currentPage, pageCount, setPage } = useVideoPagination(
  totalCount,
  pageSize
)
const visibleVideos = computed(() => videoPage.value?.items ?? [])

// loading: the request is still pending and nothing has arrived yet
const isLoading = computed(() => status.value === 'pending' && !videoPage.value)
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-6 md:px-6" :aria-busy="isLoading">
    <!-- loading -->
    <ul v-if="isLoading" class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <li v-for="index in pageSize" :key="index">
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
        <li v-for="video in visibleVideos" :key="video.uid">
          <VideoCard :video="video" />
        </li>
      </ul>

      <VideoPagination
        class="mt-8"
        :page="currentPage"
        :page-count="pageCount"
        @change="setPage"
      />
    </template>
  </section>
</template>
