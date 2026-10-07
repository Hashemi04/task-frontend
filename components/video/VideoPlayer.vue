<script setup lang="ts">
import type { VideoDetail } from '~/types/video'

const props = defineProps<{
  video: VideoDetail
}>()

const root = ref<HTMLElement | null>(null)
const media = ref<HTMLVideoElement | null>(null)
const playing = ref(false)
const muted = ref(false)
const progress = ref(0)
const started = ref(false)
const buffering = ref(false)
const failed = ref(false)

const unavailable = computed(() => !props.video.playbackUrl)
const notice = computed(() => {
  if (unavailable.value) return 'پخش این ویدیو در دسترس نیست'
  if (failed.value) return 'پخش ویدیو انجام نشد'
  return ''
})

function onError() {
  failed.value = true
  buffering.value = false
  playing.value = false
}

function sync() {
  const element = media.value
  if (!element || !element.duration) {
    progress.value = 0
    return
  }
  progress.value = (element.currentTime / element.duration) * 100
}

async function togglePlay() {
  const element = media.value
  if (!element || notice.value) return

  if (element.paused) {
    started.value = true
    try {
      await element.play()
    } catch (error) {
      if (!isInterruptedPlay(error)) throw error
    }
    return
  }

  element.pause()
}

function isInterruptedPlay(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'AbortError')
  )
}

function toggleMute() {
  const element = media.value
  if (!element) return
  element.muted = !element.muted
  muted.value = element.muted
}

function seekTo(clientX: number, bar: HTMLElement) {
  const element = media.value
  if (!element || !element.duration) return

  const rect = bar.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  element.currentTime = ratio * element.duration
  started.value = true
  sync()
}

function scrub(event: PointerEvent) {
  const bar = event.currentTarget
  if (!(bar instanceof HTMLElement)) return
  if (event.type === 'pointermove' && event.buttons !== 1) return

  if (event.type === 'pointerdown') bar.setPointerCapture(event.pointerId)
  seekTo(event.clientX, bar)
}

function seekBy(seconds: number) {
  const element = media.value
  if (!element || !element.duration) return

  element.currentTime = Math.min(
    element.duration,
    Math.max(0, element.currentTime + seconds)
  )
  started.value = true
  sync()
}

function onKeydown(event: KeyboardEvent) {
  if (notice.value || event.metaKey || event.ctrlKey || event.altKey) return
  if (
    event.target instanceof HTMLButtonElement &&
    (event.key === ' ' || event.key === 'Enter')
  )
    return

  if (event.key === ' ' || event.key === 'k' || event.key === 'K') {
    event.preventDefault()
    togglePlay()
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    seekBy(-5)
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    seekBy(5)
    return
  }

  if (event.key === 'm' || event.key === 'M') {
    event.preventDefault()
    toggleMute()
    return
  }

  if (event.key === 'f' || event.key === 'F') {
    event.preventDefault()
    toggleFullscreen()
  }
}

type WebkitVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void
}

async function toggleFullscreen() {
  const element = root.value
  const video = media.value as WebkitVideoElement | null
  if (!element) return

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else if (typeof element.requestFullscreen === 'function') {
      await element.requestFullscreen()
    } else {
      // iPhone Safari only supports native fullscreen on the video element.
      video?.webkitEnterFullscreen?.()
    }
  } catch {
    // The browser can refuse fullscreen; the player keeps working inline.
  }
}
</script>

<template>
  <div
    ref="root"
    tabindex="0"
    role="region"
    aria-label="پخش‌کننده ویدیو"
    aria-keyshortcuts="Space k ArrowLeft ArrowRight m f"
    class="relative aspect-video overflow-hidden rounded-lg border border-edge bg-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    @keydown="onKeydown"
  >
    <video
      ref="media"
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
      @volumechange="muted = media?.muted ?? false"
      @waiting="buffering = true"
      @playing="buffering = false"
      @canplay="buffering = false"
      @error="onError"
    />

    <IconEmptyPoster
      v-if="!video.posterUrl && !started"
      class="pointer-events-none absolute inset-0 h-full w-full text-white/30"
      preserveAspectRatio="none"
    />

    <p
      v-if="notice"
      class="absolute inset-0 flex items-center justify-center bg-black/60 px-4 text-center text-sm"
      role="status"
    >
      {{ notice }}
    </p>

    <div
      v-else-if="buffering"
      class="pointer-events-none absolute inset-0 flex items-center justify-center"
      role="status"
      aria-label="در حال بارگذاری"
    >
      <span
        class="size-10 animate-spin rounded-full border-4 border-white/30 border-t-white"
      />
    </div>

    <div
      v-if="!notice"
      class="absolute inset-x-0 bottom-0 z-10 px-4 pb-3"
      dir="ltr"
    >
      <button
        type="button"
        class="relative block h-1.5 w-full cursor-pointer bg-track"
        aria-label="موقعیت پخش"
        aria-keyshortcuts="ArrowLeft ArrowRight"
        @pointerdown="scrub"
        @pointermove="scrub"
      >
        <span
          class="absolute inset-y-0 left-0 bg-accent"
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
