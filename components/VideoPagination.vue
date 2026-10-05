<script setup lang="ts">
const props = defineProps<{
  page: number
  pageCount: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const windowSize = 5

const items = computed(() => {
  const count = props.pageCount
  const current = props.page

  if (count <= windowSize) {
    return Array.from({ length: count }, (_, index) => ({
      type: 'page' as const,
      value: index + 1,
    }))
  }

  let start = current - 2
  let end = current + 2

  if (start < 1) {
    start = 1
    end = windowSize
  } else if (end > count) {
    end = count
    start = count - windowSize + 1
  }

  const result: Array<{ type: 'page' | 'ellipsis', value: number | string }> = []

  if (start > 1) result.push({ type: 'ellipsis', value: 'start' })

  for (let number = start; number <= end; number += 1) {
    result.push({ type: 'page', value: number })
  }

  if (end < count) result.push({ type: 'ellipsis', value: 'end' })

  return result
})
</script>

<template>
  <nav dir="ltr" class="flex flex-nowrap items-center justify-center gap-1 sm:gap-3" aria-label="صفحه‌بندی">
    <BaseButton
      variant="ghost"
      :disabled="page === 1"
      aria-label="صفحه اول"
      @click="emit('change', 1)"
    >
      «
    </BaseButton>

    <BaseButton
      variant="ghost"
      :disabled="page === 1"
      aria-label="صفحه قبل"
      @click="emit('change', page - 1)"
    >
      ‹
    </BaseButton>

    <template v-for="item in items" :key="`${item.type}-${item.value}`">
      <span
        v-if="item.type === 'ellipsis'"
        class="flex size-8 shrink-0 items-center justify-center text-sm text-white/50"
      >
        ...
      </span>
      <BaseButton
        v-else
        variant="page"
        :active="item.value === page"
        :aria-current="item.value === page ? 'page' : undefined"
        @click="emit('change', Number(item.value))"
      >
        {{ item.value }}
      </BaseButton>
    </template>

    <BaseButton
      variant="ghost"
      :disabled="page === pageCount"
      aria-label="صفحه بعد"
      @click="emit('change', page + 1)"
    >
      ›
    </BaseButton>

    <BaseButton
      variant="ghost"
      :disabled="page === pageCount"
      aria-label="صفحه آخر"
      @click="emit('change', pageCount)"
    >
      »
    </BaseButton>
  </nav>
</template>
