<script setup lang="ts">
import AppHeader from '~/components/app/AppHeader.vue'

useHead({
  title: 'ویدیوهای صرافی تبدیل',
})
</script>

<template>
  <div class="min-h-screen bg-ink">
    <AppHeader />
    <main>
      <slot />
    </main>
  </div>
</template>
