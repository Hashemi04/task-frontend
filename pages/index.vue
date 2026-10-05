<script setup lang="ts">
import { videoPageFixture } from '../data/videos'
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-6 md:px-6">
    <ul class="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <li v-for="video in videoPageFixture.items" :key="video.uid">
        <VideoCard :video="video" />
      </li>
    </ul>
  </section>
</template>
