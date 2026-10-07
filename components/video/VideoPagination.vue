<script setup lang="ts">
import type { RouteLocationRaw } from '#vue-router'
import { toPersianDigits } from '~/utils/formatDigits'
import { paginationItems } from '~/utils/pagination'

const props = defineProps<{
  page: number
  pageCount: number
  pageLink: (page: number) => RouteLocationRaw
}>()

const items = computed(() => paginationItems(props.page, props.pageCount))
</script>

<template>
  <nav
    dir="ltr"
    class="flex flex-nowrap items-center justify-center gap-1 sm:gap-3"
    aria-label="صفحه‌بندی"
  >
    <BaseButton
      variant="ghost"
      :disabled="page === 1"
      :to="pageLink(1)"
      aria-label="صفحه اول"
    >
      «
    </BaseButton>

    <BaseButton
      variant="ghost"
      :disabled="page === 1"
      :to="pageLink(page - 1)"
      aria-label="صفحه قبل"
    >
      ‹
    </BaseButton>

    <template
      v-for="item in items"
      :key="item.type === 'page' ? `page-${item.page}` : item.position"
    >
      <span
        v-if="item.type === 'ellipsis'"
        class="flex size-8 shrink-0 items-center justify-center text-sm text-white/50"
      >
        ...
      </span>
      <BaseButton
        v-else
        variant="page"
        :active="item.page === page"
        :to="pageLink(item.page)"
      >
        {{ toPersianDigits(item.page) }}
      </BaseButton>
    </template>

    <BaseButton
      variant="ghost"
      :disabled="page === pageCount"
      :to="pageLink(page + 1)"
      aria-label="صفحه بعد"
    >
      ›
    </BaseButton>

    <BaseButton
      variant="ghost"
      :disabled="page === pageCount"
      :to="pageLink(pageCount)"
      aria-label="صفحه آخر"
    >
      »
    </BaseButton>
  </nav>
</template>
