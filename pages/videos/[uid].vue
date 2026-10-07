<script setup lang="ts">
import type { VideoDetail } from '~/types/video'
import { formatCount } from '~/utils/formatCount'
import { videoJsonLd } from '~/utils/videoJsonLd'

const route = useRoute()

const { data: video, error } = await useAsyncData(
  () => `video-${route.params.uid}`,
  () => $fetch<VideoDetail>(`/api/videos/${route.params.uid}`)
)

if (error.value) {
  const statusCode = error.value.statusCode ?? 500
  throw createError({
    statusCode,
    message: statusCode === 404 ? 'ویدیو پیدا نشد' : 'بارگذاری ویدیو انجام نشد',
    data: { resource: 'video' },
    fatal: true,
  })
}

const descriptionExpanded = ref(false)
const descriptionOverflows = ref(false)
const descriptionRef = ref<HTMLParagraphElement | null>(null)

async function measureDescription() {
  descriptionExpanded.value = false
  descriptionOverflows.value = false
  await nextTick()
  const element = descriptionRef.value
  if (!element) return
  descriptionOverflows.value = element.scrollHeight > element.clientHeight + 1
}

onMounted(measureDescription)
watch(() => video.value?.uid, measureDescription)

function showFullDescription() {
  descriptionExpanded.value = true
}

const url = useSiteUrl()
const pageUrl = computed(() => url(`/videos/${video.value?.uid ?? ''}`))
const title = computed(() => video.value?.title ?? 'ویدیو پیدا نشد')
const description = computed(() => {
  const raw = video.value?.description.replace(/\s+/g, ' ').trim() ?? ''
  return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw
})

useSeoMeta({
  title,
  description: () => description.value || undefined,
  ogType: 'video.other',
  ogUrl: pageUrl,
  ogTitle: title,
  ogDescription: () => description.value || undefined,
  ogImage: () => video.value?.posterUrl || undefined,
  ogImageAlt: title,
})

useHead(() => ({
  link: [{ rel: 'canonical', href: pageUrl.value }],
  script: video.value
    ? [
        {
          key: 'video-json-ld',
          type: 'application/ld+json',
          innerHTML: videoJsonLd(video.value, pageUrl.value),
        },
      ]
    : [],
}))
</script>

<template>
  <section v-if="video" class="min-h-full">
    <div class="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <VideoPlayer :key="video.uid" :video="video" />

      <h1 class="mt-4 text-lg font-bold leading-7">
        {{ video.title }}
      </h1>

      <div class="mt-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <ChannelAvatar :src="video.profilePhotoUrl" eager />
          <div class="flex flex-col gap-0.5">
            <p class="text-sm leading-5">{{ video.senderName }}</p>
            <p class="text-xs leading-4 text-white/70">
              {{ formatCount(video.followerCount) }} دنبال کننده
            </p>
          </div>
        </div>

        <p
          dir="ltr"
          class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-control-edge bg-control px-2.5 text-xs leading-none text-white/80"
        >
          <IconHeart class="h-3.5 w-3.5 shrink-0 -translate-y-px" />
          <span class="leading-none">{{ formatCount(video.likeCount) }}</span>
          <span class="sr-only">پسند</span>
        </p>
      </div>

      <p class="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-white/70">
        <span>{{ formatCount(video.visitCount) }} بازدید</span>
        <span aria-hidden="true">•</span>
        <span>{{ video.publishedAtLabel }}</span>
        <template v-if="video.tags.length">
          <span aria-hidden="true">•</span>
          <span v-for="tag in video.tags" :key="tag" class="text-link">
            #{{ tag }}
          </span>
        </template>
      </p>

      <p
        ref="descriptionRef"
        class="mt-2 whitespace-pre-line text-sm leading-6 text-white/70"
        :class="{ 'line-clamp-2': !descriptionExpanded }"
      >
        {{ video.description }}
      </p>
      <button
        v-if="descriptionOverflows && !descriptionExpanded"
        type="button"
        class="mt-1 rounded text-sm text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        @click="showFullDescription"
      >
        بیشتر
      </button>
    </div>
  </section>
</template>
