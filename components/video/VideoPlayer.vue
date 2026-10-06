<script setup lang="ts">
import type { VideoDetail } from "../../types/video";

const props = defineProps<{
  video: VideoDetail;
}>();

const root = ref<HTMLElement | null>(null);
const media = ref<HTMLVideoElement | null>(null);
const playing = ref(false);
const muted = ref(false);
const progress = ref(0);
const started = ref(false);

watch(
  () => props.video.uid,
  () => {
    playing.value = false;
    muted.value = false;
    progress.value = 0;
    started.value = false;
  },
);

function sync() {
  const element = media.value;
  if (!element || !element.duration) {
    progress.value = 0;
    return;
  }
  progress.value = (element.currentTime / element.duration) * 100;
}

async function togglePlay() {
  const element = media.value;
  if (!element || !props.video.playbackUrl) return;

  if (element.paused) {
    started.value = true;
    await element.play();
    return;
  }

  element.pause();
}

function toggleMute() {
  const element = media.value;
  if (!element) return;
  element.muted = !element.muted;
  muted.value = element.muted;
}

function seek(event: MouseEvent) {
  const element = media.value;
  const bar = event.currentTarget;
  if (
    event.detail === 0 ||
    !element ||
    !element.duration ||
    !(bar instanceof HTMLElement)
  )
    return;

  const rect = bar.getBoundingClientRect();
  const ratio = Math.min(
    1,
    Math.max(0, (event.clientX - rect.left) / rect.width),
  );
  element.currentTime = ratio * element.duration;
  started.value = true;
  sync();
}

function seekBy(seconds: number) {
  const element = media.value;
  if (!element || !element.duration) return;

  element.currentTime = Math.min(
    element.duration,
    Math.max(0, element.currentTime + seconds),
  );
  started.value = true;
  sync();
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target))
    return;
  if (
    event.target instanceof HTMLButtonElement &&
    (event.key === " " || event.key === "Enter")
  )
    return;

  if (event.key === " " || event.key === "k" || event.key === "K") {
    event.preventDefault();
    togglePlay();
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    seekBy(-5);
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    seekBy(5);
    return;
  }

  if (event.key === "m" || event.key === "M") {
    event.preventDefault();
    toggleMute();
    return;
  }

  if (event.key === "f" || event.key === "F") {
    event.preventDefault();
    toggleFullscreen();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  onScopeDispose(() => window.removeEventListener("keydown", onKeydown));
});

function toggleFullscreen() {
  const element = root.value;
  if (!element) return;

  if (document.fullscreenElement) {
    document.exitFullscreen();
    return;
  }

  element.requestFullscreen();
}
</script>

<template>
  <div
    ref="root"
    class="relative aspect-video overflow-hidden rounded-lg border border-[#343638] bg-[#4f5154]"
  >
    <video
      ref="media"
      :key="video.uid"
      :src="video.playbackUrl || undefined"
      :poster="video.posterUrl || undefined"
      class="h-full w-full object-contain"
      playsinline
      preload="metadata"
      @click="togglePlay"
      @loadedmetadata="sync"
      @timeupdate="sync"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
    />

    <IconEmptyPoster
      v-if="!video.posterUrl && !started"
      class="pointer-events-none absolute inset-0 h-full w-full text-white/30"
      preserveAspectRatio="none"
    />

    <div class="absolute inset-x-0 bottom-0 z-10 px-4 pb-3" dir="ltr">
      <button
        type="button"
        class="relative block h-0.5 w-full bg-[#d9d9d9]"
        aria-label="موقعیت پخش"
        aria-keyshortcuts="ArrowLeft ArrowRight"
        @click="seek"
      >
        <span
          class="absolute inset-y-0 left-0 bg-[#F0B90B]"
          :style="{ width: `${progress}%` }"
        />
      </button>

      <div class="mt-2.5 flex items-center gap-3 text-white">
        <button
          type="button"
          :aria-label="playing ? 'توقف' : 'پخش'"
          aria-keyshortcuts="Space"
          @click="togglePlay"
        >
          <IconPause v-if="playing" class="size-6" />
          <IconPlay v-else class="size-6" />
        </button>

        <button
          type="button"
          :aria-label="muted ? 'روشن کردن صدا' : 'قطع صدا'"
          aria-keyshortcuts="m"
          @click="toggleMute"
        >
          <IconVolume class="size-6" :muted="muted" />
        </button>

        <button
          type="button"
          class="ms-auto"
          aria-label="تمام‌صفحه"
          aria-keyshortcuts="f"
          @click="toggleFullscreen"
        >
          <IconFullscreen class="size-6" />
        </button>
      </div>
    </div>
  </div>
</template>
