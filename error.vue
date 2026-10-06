<script setup lang="ts">
import type { NuxtError } from '#app'
import AppHeader from '~/components/app/AppHeader.vue'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => {
  const code = props.error.statusCode ?? 500
  if (code === 404) return 404
  if (code >= 500) return 500
  return code
})

const route = useRoute()
const isMissing = computed(() => statusCode.value === 404)
const isVideo = computed(() => route.path.startsWith('/videos/'))

const heading = computed(() => {
  if (!isMissing.value) return 'خطایی رخ داد'
  return isVideo.value ? 'ویدیو پیدا نشد' : 'صفحه پیدا نشد'
})

const detail = computed(() => {
  if (!isMissing.value) return 'بارگذاری صفحه انجام نشد. کمی بعد دوباره تلاش کنید.'
  return isVideo.value ? 'این ویدیو در کانال تبدیل نیست.' : 'این آدرس در تبدیل نیست.'
})

useHead({
  title: computed(() => `${statusCode.value} - ${heading.value}`),
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen bg-ink">
    <AppHeader />
    <main class="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center md:px-6">
      <p class="text-6xl font-bold text-[#F0B90B]">{{ statusCode }}</p>
      <h1 class="mt-4 text-lg font-bold">{{ heading }}</h1>
      <p class="mt-2 max-w-md text-sm leading-6 text-white/60">
        {{ detail }}
      </p>
      <BaseButton class="mt-6" @click="goHome">
        بازگشت به ویدیوها
      </BaseButton>
    </main>
  </div>
</template>
