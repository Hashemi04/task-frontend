<script setup lang="ts">
import type { VideoSummary } from '~/types/video'
import { formatCount } from '~/utils/formatCount'
import { formatDuration } from '~/utils/formatDuration'

const props = withDefaults(
  defineProps<{
    video: VideoSummary
    eager?: boolean
  }>(),
  {
    eager: false,
  }
)

const durationLabel = computed(() =>
  formatDuration(props.video.durationSeconds)
)
const loading = computed(() => (props.eager ? 'eager' : 'lazy'))
</script>

<template>
  <NuxtLink
    :to="`/videos/${video.uid}`"
    class="block rounded-lg border border-surface bg-panel p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
  >
    <div
      class="relative aspect-video overflow-hidden rounded-lg bg-placeholder"
    >
      <img
        v-if="video.posterUrl"
        :src="video.posterUrl"
        :srcset="video.posterSrcset || undefined"
        sizes="(min-width: 1024px) 330px, calc(100vw - 64px)"
        alt=""
        width="640"
        height="360"
        :loading="loading"
        decoding="async"
        class="h-full w-full object-cover"
      />
      <IconEmptyPoster
        v-else
        class="absolute inset-0 h-full w-full text-white/35"
        preserveAspectRatio="none"
        :stroke-width="0.6"
      />
      <span
        v-if="video.durationSeconds > 0"
        class="absolute bottom-4 end-4 rounded-full bg-badge px-2.5 py-1 text-xs text-white"
      >
        {{ durationLabel }}
      </span>
    </div>

    <h2 class="mt-4 text-base font-bold leading-7">
      {{ video.title }}
    </h2>

    <p class="mt-3 flex items-center gap-2 text-sm text-white/80">
      <ChannelAvatar :src="video.profilePhotoUrl" size="sm" :eager="eager" />
      {{ video.senderName }}
    </p>

    <p class="mt-2 text-sm text-white/60">
      {{ formatCount(video.visitCount) }} بازدید - {{ video.publishedAtLabel }}
    </p>
  </NuxtLink>
</template>
