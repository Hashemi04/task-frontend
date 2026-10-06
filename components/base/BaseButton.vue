<script setup lang="ts">
export type ButtonVariant = 'primary' | 'ghost' | 'page'
export type ButtonType = 'button' | 'submit' | 'reset'

interface Props {
  variant?: ButtonVariant
  type?: ButtonType
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  active: false,
})

const variantClass = computed(() => {
  switch (props.variant) {
    // primary: yellow action, used by search and retry
    case 'primary':
      return 'rounded bg-[#F0B90B] px-4 py-3 text-sm font-bold text-ink focus:ring-2 focus:ring-white'
    // ghost: pagination arrows
    case 'ghost':
      return 'size-8 text-lg text-white/50'
    // page: page number, yellow when it is the current page
    case 'page':
      return props.active
        ? 'size-8 rounded-full bg-[#F0B90B] text-sm font-bold text-ink'
        : 'size-8 rounded-full text-sm text-white/50'
    default:
      return ''
  }
})
</script>

<template>
  <button
    :type="type"
    :class="`${variantClass} inline-flex shrink-0 items-center justify-center whitespace-nowrap focus:outline-none disabled:cursor-default`"
  >
    <slot />
  </button>
</template>
