<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src: string
    size?: 'sm' | 'md'
    eager?: boolean
  }>(),
  {
    size: 'md',
    eager: false,
  }
)

const pixels = computed(() => (props.size === 'sm' ? 20 : 40))
</script>

<template>
  <span
    class="relative block shrink-0 overflow-hidden rounded-full bg-black"
    :class="size === 'sm' ? 'size-5' : 'size-10'"
  >
    <!-- The channel photo stacks the logo above the wordmark; the
         oversized top-anchored image keeps only the logo in the circle. -->
    <img
      v-if="src"
      :src="src"
      alt=""
      :width="pixels"
      :height="pixels"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="absolute inset-x-0 top-0 h-[165%] w-full max-w-none object-cover object-top"
    />
  </span>
</template>
