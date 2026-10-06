<script setup lang="ts">
import { videoPageFixture } from '../data/videos'

const { data: videoPage, status, refresh } = await useAsyncData('channel-videos', async () => videoPageFixture)

const totalCount = computed(() => videoPage.value?.totalCount ?? 0)
const { pageSize, currentPage, pageCount, setPage } = useVideoPagination(totalCount)

const visibleVideos = computed(() => {
  const items = videoPage.value?.items ?? []
  const start = (currentPage.value - 1) * pageSize.value
  return items.slice(start, start + pageSize.value)
})

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
    <div v-else-if="status === 'error'" class="flex flex-col items-center gap-4 py-16 text-center" role="alert">
      <p>بارگذاری ویدیوها انجام نشد</p>
      <BaseButton @click="refresh()">
        تلاش دوباره
      </BaseButton>
    </div>

    <!-- empty -->
    <p v-else-if="!videoPage?.items.length" class="py-16 text-center text-white/70">
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
