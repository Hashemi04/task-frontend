<script setup lang="ts">
import type { RouteLocationRaw } from '#vue-router'

type ButtonVariant = 'primary' | 'ghost' | 'page'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    type?: 'button' | 'submit' | 'reset'
    active?: boolean
    disabled?: boolean
    to?: RouteLocationRaw
  }>(),
  {
    variant: 'primary',
    type: 'button',
    active: false,
    disabled: false,
    to: undefined,
  }
)

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'h-12 gap-1 rounded bg-accent px-4 text-sm font-bold text-ink focus-visible:ring-white',
  ghost:
    'size-8 rounded-full text-lg text-white/70 hover:text-white focus-visible:ring-accent disabled:text-white/20',
  page: 'size-8 rounded-full text-sm focus-visible:ring-accent',
}

const classes = computed(() => [
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed',
  variantClasses[props.variant],
  props.variant === 'page' &&
    (props.active
      ? 'bg-accent font-bold text-ink'
      : 'text-white/70 hover:text-white'),
])
</script>

<template>
  <NuxtLink
    v-if="to && !disabled"
    :to="to"
    :class="classes"
    :aria-current="active ? 'page' : undefined"
  >
    <slot />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
