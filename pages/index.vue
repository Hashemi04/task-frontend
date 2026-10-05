<script setup lang="ts">
import { videoPageFixture } from '../data/videos'

const { pageSize, currentPage, pageCount, setPage } = useVideoPagination(videoPageFixture.totalCount)

const visibleVideos = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return videoPageFixture.items.slice(start, start + pageSize.value)
})
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-6 md:px-6">
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
  </section>
</template>
