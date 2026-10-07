<script setup lang="ts">
withDefaults(
  defineProps<{
    showSearch?: boolean
  }>(),
  {
    showSearch: false,
  }
)

const route = useRoute()
const { query, submitSearch } = useSearchQuery()
const draft = ref(query.value)

watch(query, (value) => {
  draft.value = value
})

function onSubmit() {
  submitSearch(draft.value)
}
</script>

<template>
  <header
    class="sticky top-0 z-30 -mb-px overflow-hidden bg-ink"
    :class="showSearch ? 'glow-search' : 'glow-header'"
  >
    <div
      class="relative mx-auto flex max-w-6xl items-start px-4 pt-3 md:px-6"
      :class="showSearch ? 'pb-3 md:pt-6 md:pb-5' : 'pb-4 md:py-4'"
    >
      <NuxtLink v-slot="{ href, navigate }" to="/" custom>
        <a
          :href="href ?? undefined"
          class="relative z-10"
          aria-label="تبدیل"
          :aria-current="route.fullPath === '/' ? 'page' : undefined"
          @click="navigate"
        >
          <img
            src="/tabdeal.svg"
            alt=""
            width="165"
            height="48"
            class="h-8 w-auto md:h-10"
          />
        </a>
      </NuxtLink>
    </div>
  </header>

  <div
    v-if="showSearch"
    class="glow-search relative bg-[position:0_-56px] md:bg-[position:0_-84px]"
  >
    <div class="relative z-10 mx-auto w-full max-w-6xl px-4 py-7 md:px-6">
      <form
        class="flex h-20 w-full items-center justify-center gap-4 rounded-lg bg-panel p-3"
        @submit.prevent="onSubmit"
      >
        <label class="sr-only" for="video-search">جستجوی عنوان ویدیو</label>
        <input
          id="video-search"
          v-model="draft"
          type="search"
          name="q"
          placeholder="جستجو ویدیو..."
          autocomplete="off"
          class="h-12 min-w-0 flex-1 rounded bg-field py-3 pl-4 pr-2 text-sm text-white placeholder:text-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        />
        <BaseButton type="submit">
          <IconSearch class="shrink-0" />
          جستجو
        </BaseButton>
      </form>
    </div>
  </div>
</template>
