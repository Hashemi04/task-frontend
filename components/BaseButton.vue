<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'ghost' | 'page'
  type?: 'button' | 'submit' | 'reset'
  active?: boolean
}>(), {
  variant: 'primary',
  type: 'button',
  active: false,
})
</script>

<template>
  <button
    :type="type"
    class="inline-flex shrink-0 items-center justify-center focus:outline-none disabled:cursor-default"
    :class="variant === 'primary'
      ? 'rounded bg-[#F0B90B] px-4 py-3 text-sm font-bold text-ink focus:ring-2 focus:ring-white'
      : variant === 'ghost'
        ? 'size-8 text-lg text-white/50'
        : active
          ? 'size-8 rounded-full bg-[#F0B90B] text-sm font-bold text-ink'
          : 'size-8 rounded-full text-sm text-white/50'"
  >
    <slot />
  </button>
</template>
