<script setup lang="ts">
withDefaults(
  defineProps<{
    strokeWidth?: number
  }>(),
  {
    strokeWidth: 0.35,
  },
)
</script>

<template>
  <svg viewBox="0 0 100 56" fill="none" stroke="currentColor" :stroke-width="strokeWidth" aria-hidden="true">
    <line x1="0" y1="0" x2="100" y2="56" />
    <line x1="100" y1="0" x2="0" y2="56" />
  </svg>
</template>
