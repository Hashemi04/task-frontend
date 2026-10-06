<script setup lang="ts">
import type { VideoSummary } from '~/types/video'
import { formatDuration } from '~/utils/formatDuration'

const props = defineProps<{
  video: VideoSummary
}>()

const durationLabel = computed(() =>
  formatDuration(props.video.durationSeconds)
)
</script>

<template>
  <NuxtLink
    :to="`/videos/${video.uid}`"
    class="block rounded-lg border border-[#404244] bg-[#2C2E30] p-4"
  >
    <div class="relative aspect-video overflow-hidden rounded-lg bg-[#4F5154]">
      <img
        v-if="video.posterUrl"
        :src="video.posterUrl"
        :alt="video.title"
        class="h-full w-full object-cover"
      />
      <IconEmptyPoster
        v-else
        class="absolute inset-0 h-full w-full text-white/35"
        preserveAspectRatio="none"
        :stroke-width="0.6"
      />
      <span
        class="absolute bottom-4 end-4 rounded-full bg-[#2F3337] px-2.5 py-1 text-xs text-white"
      >
        {{ durationLabel }}
      </span>
    </div>

    <h2 class="mt-4 text-base font-bold leading-7">
      {{ video.title }}
    </h2>

    <p class="mt-3 flex items-center gap-2 text-sm text-white/80">
      <img
        :src="video.profilePhotoUrl"
        alt=""
        class="h-5 w-5 shrink-0 rounded-full object-cover"
      />
      {{ video.senderName }}
    </p>

    <p class="mt-2 text-sm text-white/60">
      {{ video.visitCount }} بازدید - {{ video.publishedAtLabel }}
    </p>
  </NuxtLink>
</template>
