<script setup lang="ts">
import type { NuxtError } from '#app'
import { toPersianDigits } from '~/utils/formatDigits'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => {
  const code = props.error.statusCode ?? 500
  if (code === 404) return 404
  if (code >= 500) return 500
  return code
})

const isMissing = computed(() => statusCode.value === 404)
const isVideo = computed(() => {
  const data = errorData(props.error.data)
  return isRecord(data) && data.resource === 'video'
})

// Server-rendered errors arrive with `data` serialized as a JSON string.
function errorData(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const heading = computed(() => {
  if (!isMissing.value) return 'خطایی رخ داد'
  return isVideo.value ? 'ویدیو پیدا نشد' : 'صفحه پیدا نشد'
})

const detail = computed(() => {
  if (!isMissing.value)
    return 'بارگذاری صفحه انجام نشد. کمی بعد دوباره تلاش کنید.'
  return isVideo.value
    ? 'این ویدیو در کانال تبدیل نیست.'
    : 'این آدرس در تبدیل نیست.'
})

useHead({
  title: computed(
    () => `${toPersianDigits(statusCode.value)} - ${heading.value}`
  ),
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen bg-ink">
    <AppHeader />
    <main
      class="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center md:px-6"
    >
      <p class="text-6xl font-bold text-accent">
        {{ toPersianDigits(statusCode) }}
      </p>
      <h1 class="mt-4 text-lg font-bold">{{ heading }}</h1>
      <p class="mt-2 max-w-md text-sm leading-6 text-white/60">
        {{ detail }}
      </p>
      <BaseButton class="mt-6" @click="goHome"> بازگشت به ویدیوها </BaseButton>
    </main>
  </div>
</template>
