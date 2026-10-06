<script setup lang="ts">
import type { VideoSummary } from "../../types/video";
import { formatDuration } from "../../utils/formatDuration";

const props = defineProps<{
  video: VideoSummary;
}>();

const durationLabel = computed(() => formatDuration(props.video.durationSeconds));
</script>

<template>
  <div class="relative aspect-video overflow-hidden rounded-lg border border-[#343638] bg-[#4f5154]">
    <img
      v-if="video.posterUrl"
      :src="video.posterUrl"
      :alt="video.title"
      class="h-full w-full object-cover"
    />
    <svg
      v-else
      viewBox="0 0 100 56"
      class="absolute inset-0 h-full w-full text-white/30"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="0" x2="100" y2="56" stroke="currentColor" stroke-width="0.35" />
      <line x1="100" y1="0" x2="0" y2="56" stroke="currentColor" stroke-width="0.35" />
    </svg>

    <div class="absolute inset-x-0 bottom-0 px-4 pb-3" dir="ltr">
      <div class="relative h-0.5 bg-[#d9d9d9]">
        <div class="absolute inset-y-0 left-0 w-16 bg-[#F0B90B]" />
      </div>

      <div class="mt-2.5 flex items-center gap-3 text-white">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4zm11.5 3a3.5 3.5 0 0 0-2-3.15v6.3A3.5 3.5 0 0 0 15.5 12z" />
        </svg>
        <span class="text-xs tracking-wide">00:00 / {{ durationLabel }}</span>
        <svg viewBox="0 0 24 24" class="ms-auto h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      </div>
    </div>
  </div>
</template>
