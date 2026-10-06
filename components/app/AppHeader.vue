<script setup lang="ts">
const route = useRoute();
const showSearch = computed(() => !route.path.startsWith("/videos/"));
const { query, submitSearch } = useSearchQuery();
const draft = ref(query.value);

watch(query, (value) => {
  draft.value = value;
});

function onSubmit() {
  submitSearch(draft.value);
}
</script>

<template>
  <header class="sticky top-0 z-30 overflow-hidden bg-ink">
    <div
      class="relative mx-auto flex max-w-6xl items-start px-4 pt-3 md:px-6"
      :class="showSearch ? 'pb-3 md:pt-6 md:pb-5' : 'pb-4 md:py-4'"
    >
      <div
        class="pointer-events-none absolute inset-x-0 -top-2 bottom-0 bg-[radial-gradient(120%_100%_at_84%_0%,rgba(240,186,11,0.98)_0%,rgba(240,186,11,0.62)_40%,transparent_72%)] md:hidden"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -top-4 start-0 hidden h-44 w-[36rem] bg-[radial-gradient(ellipse_at_72%_28%,rgba(240,186,11,0.95)_0%,rgba(240,186,11,0.5)_32%,transparent_68%)] md:block"
        aria-hidden="true"
      />

      <NuxtLink to="/" class="relative" aria-label="تبدیل">
        <img src="/tabdeal.svg" alt="" class="h-8 w-auto md:h-10" />
      </NuxtLink>
    </div>
  </header>

  <div v-if="showSearch" class="mx-auto w-full max-w-6xl px-4 py-7 md:px-6">
    <form
      class="flex h-20 w-full items-center justify-center gap-4 rounded-lg bg-[#2C2E30] p-3"
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
        class="h-12 min-w-0 flex-1 rounded bg-[#3B3D3F] py-3 pl-4 pr-2 text-sm text-white placeholder:text-white/45 focus:outline-none"
      />
      <BaseButton type="submit" class="h-12 w-[97px]"> جستجو </BaseButton>
    </form>
  </div>
</template>
