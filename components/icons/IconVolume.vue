<script setup lang="ts">
defineProps<{
  muted?: boolean
}>()
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
    <path d="M1.4 10.2 H4 L10.2 5.4 V18.6 L4 13.8 H1.4 Z" />
    <path v-if="muted" d="M16 8 L22 16 M22 8 L16 16" />
    <template v-else>
      <path d="M15.2 7.8 Q17.5 12 15.2 16.2" />
      <path d="M19.2 4.5 Q22.6 12 19.2 19.5" />
    </template>
  </svg>
</template>
