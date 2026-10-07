<script setup lang="ts">
defineProps<{
  exit?: boolean
}>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="exit">
      <path d="M3.2 8.2 H8.2 V3.2" />
      <path d="M20.8 8.2 H15.8 V3.2" />
      <path d="M3.2 15.8 H8.2 V20.8" />
      <path d="M20.8 15.8 H15.8 V20.8" />
    </template>
    <template v-else>
      <path d="M8.2 3.2 H3.2 V8.2" />
      <path d="M15.8 3.2 H20.8 V8.2" />
      <path d="M8.2 20.8 H3.2 V15.8" />
      <path d="M15.8 20.8 H20.8 V15.8" />
    </template>
  </svg>
</template>
