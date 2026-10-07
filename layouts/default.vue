<script setup lang="ts">
import AppHeader from '~/components/app/AppHeader.vue'

useHead({
  title: 'ویدیوهای صرافی تبدیل',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'ویدیوهای آموزشی کانال صرافی ارز دیجیتال تبدیل',
    },
  ],
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ink">
    <AppHeader />
    <main class="flex-1 bg-[#404244]">
      <slot />
    </main>
  </div>
</template>
