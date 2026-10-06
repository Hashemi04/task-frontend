<script setup lang="ts">
const route = useRoute()
const showSearch = computed(() => !route.path.startsWith('/videos/'))
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
    class="sticky top-0 z-30 -mb-px overflow-hidden bg-ink bg-no-repeat"
    :class="
      showSearch
        ? 'bg-[radial-gradient(140%_100%_at_50%_34%,rgba(240,186,11,0.95)_0%,rgba(240,186,11,0.5)_24%,rgba(240,186,11,0.22)_52%,transparent_80%)] bg-[length:100%_192px] md:bg-[radial-gradient(90%_100%_at_84%_30%,rgba(240,186,11,0.95)_0%,rgba(240,186,11,0.42)_28%,transparent_68%)] md:bg-[length:100%_220px]'
        : 'bg-[radial-gradient(120%_140%_at_50%_50%,rgba(240,186,11,0.95)_0%,rgba(240,186,11,0.4)_40%,transparent_72%)] md:bg-[radial-gradient(70%_140%_at_84%_40%,rgba(240,186,11,0.9)_0%,rgba(240,186,11,0.35)_34%,transparent_68%)]'
    "
  >
    <div
      class="relative mx-auto flex max-w-6xl items-start px-4 pt-3 md:px-6"
      :class="showSearch ? 'pb-3 md:pt-6 md:pb-5' : 'pb-4 md:py-4'"
    >
      <NuxtLink to="/" class="relative z-10" aria-label="تبدیل">
        <img
          src="/tabdeal.svg"
          alt=""
          width="165"
          height="48"
          class="h-8 w-auto md:h-10"
        />
      </NuxtLink>
    </div>
  </header>

  <div
    v-if="showSearch"
    class="relative bg-[radial-gradient(140%_100%_at_50%_34%,rgba(240,186,11,0.95)_0%,rgba(240,186,11,0.5)_24%,rgba(240,186,11,0.22)_52%,transparent_80%)] bg-[length:100%_192px] bg-[position:0_-56px] bg-no-repeat md:bg-[radial-gradient(90%_100%_at_84%_30%,rgba(240,186,11,0.95)_0%,rgba(240,186,11,0.42)_28%,transparent_68%)] md:bg-[length:100%_220px] md:bg-[position:0_-84px]"
  >
    <div class="relative z-10 mx-auto w-full max-w-6xl px-4 py-7 md:px-6">
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
        <BaseButton type="submit" class="h-12 gap-1 px-4">
          <IconSearch class="shrink-0" />
          جستجو
        </BaseButton>
      </form>
    </div>
  </div>
</template>
