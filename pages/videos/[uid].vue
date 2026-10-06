<script setup lang="ts">
import type { VideoDetail } from "../../types/video";

const route = useRoute();

const { data: video, error } = await useAsyncData(
  () => `video-${route.params.uid}`,
  () => $fetch<VideoDetail>(`/api/videos/${route.params.uid}`),
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    message: "ویدیو پیدا نشد",
    fatal: true,
  });
}

const followerLabel = computed(() => {
  return new Intl.NumberFormat("en-US").format(video.value?.followerCount ?? 0);
});

const descriptionExpanded = ref(false);
const descriptionOverflows = ref(false);
const descriptionRef = ref<HTMLParagraphElement | null>(null);

async function measureDescription() {
  descriptionExpanded.value = false;
  descriptionOverflows.value = false;
  await nextTick();
  const element = descriptionRef.value;
  if (!element) return;
  descriptionOverflows.value = element.scrollHeight > element.clientHeight + 1;
}

onMounted(measureDescription);
watch(() => video.value?.uid, measureDescription);

function showFullDescription() {
  descriptionExpanded.value = true;
}

useHead(() => {
  const raw = video.value?.description.replace(/\s+/g, " ").trim() ?? "";
  const description = raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;

  return {
    title: video.value?.title ?? "ویدیو پیدا نشد",
    meta: description
      ? [{ key: "description", name: "description", content: description }]
      : [],
  };
});
</script>

<template>
  <section v-if="video" class="min-h-full bg-[#404244]">
    <div class="mx-auto max-w-6xl px-4 p-10 md:px-6">
      <VideoPlayer :video="video" />

      <h1 class="mt-4 text-lg font-bold leading-7">
        {{ video.title }}
      </h1>

      <div class="mt-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span
            class="relative block size-10 shrink-0 overflow-hidden rounded-full bg-black"
          >
            <img
              :src="video.profilePhotoUrl"
              alt=""
              class="absolute inset-x-0 top-0 h-[165%] w-full max-w-none object-cover object-top"
            />
          </span>
          <div class="flex flex-col gap-0.5">
            <p class="text-sm leading-5">{{ video.senderName }}</p>
            <p class="text-xs leading-4 text-white/70">
              {{ followerLabel }} دنبال کننده
            </p>
          </div>
        </div>

        <button
          type="button"
          dir="ltr"
          class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#4a4c4f] bg-[#323436] px-2.5 text-xs leading-none text-white/80"
        >
          <svg
            viewBox="5 7 14 13"
            class="h-3.5 w-3.5 shrink-0 -translate-y-px"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            aria-hidden="true"
          >
            <path
              d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"
            />
          </svg>
          <span class="leading-none">{{ video.likeCount }}</span>
        </button>
      </div>

      <p class="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-white/70">
        <span>{{ video.visitCount }} بازدید</span>
        <span aria-hidden="true">•</span>
        <span>{{ video.publishedAtLabel }}</span>
        <span aria-hidden="true">•</span>
        <span v-for="tag in video.tags" :key="tag" class="text-[#6EC0E0]">
          #{{ tag }}
        </span>
      </p>

      <p
        ref="descriptionRef"
        class="mt-2 text-sm leading-6 text-white/70"
        :class="{ 'line-clamp-2': !descriptionExpanded }"
      >
        {{ video.description }}
      </p>
      <button
        v-if="descriptionOverflows && !descriptionExpanded"
        type="button"
        class="mt-1 text-sm text-[#6EC0E0]"
        @click="showFullDescription"
      >
        بیشتر
      </button>
    </div>
  </section>
</template>
