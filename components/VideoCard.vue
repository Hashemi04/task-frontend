<script setup lang="ts">
import type { VideoSummary } from "../types/video";
import { formatDuration } from "../utils/formatDuration";

const props = defineProps<{
  video: VideoSummary;
}>();

const durationLabel = computed(() =>
  formatDuration(props.video.durationSeconds),
);
</script>

<template>
  <NuxtLink
    :to="`/videos/${video.uid}`"
    class="block rounded-lg bg-[#2C2E30] p-3"
  >
    <div class="relative aspect-video overflow-hidden rounded bg-[#6d7075]">
      <img
        v-if="video.posterUrl"
        :src="video.posterUrl"
        :alt="video.title"
        class="h-full w-full object-cover"
      />
      <svg
        v-else
        viewBox="0 0 100 56"
        class="absolute inset-0 h-full w-full text-white/35"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1="0"
          y1="0"
          x2="100"
          y2="56"
          stroke="currentColor"
          stroke-width="0.6"
        />
        <line
          x1="100"
          y1="0"
          x2="0"
          y2="56"
          stroke="currentColor"
          stroke-width="0.6"
        />
      </svg>
      <span
        class="absolute bottom-3 end-3 rounded-full bg-black/75 px-2.5 py-1 text-xs text-white"
      >
        {{ durationLabel }}
      </span>
    </div>

    <h2 class="mt-3 text-base font-bold leading-7">
      {{ video.title }}
    </h2>

    <p class="mt-2 flex items-center gap-2 text-sm text-white/80">
      <img
        :src="video.profilePhotoUrl"
        alt=""
        class="h-5 w-5 shrink-0 rounded-full object-cover"
      />
      {{ video.senderName }}
    </p>

    <p class="mt-1 text-sm text-white/60">
      {{ video.visitCount }} بازدید - {{ video.publishedAtLabel }}
    </p>
  </NuxtLink>
</template>
