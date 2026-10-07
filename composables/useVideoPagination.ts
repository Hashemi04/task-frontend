import type { RouteLocationRaw } from '#vue-router'
import type { VideoPage } from '~/types/video'

export const videoPageSize = 9

export function useRequestedPage() {
  const route = useRoute()

  return computed(() => {
    const value = Number(route.query.page)
    return Number.isInteger(value) && value > 0 ? value : 1
  })
}

export function useVideoPagination(
  videoPage: Ref<VideoPage | null | undefined>,
  cacheKey: (page: number) => string
) {
  const route = useRoute()
  const router = useRouter()
  const requestedPage = useRequestedPage()

  const currentPage = computed(
    () => videoPage.value?.page ?? requestedPage.value
  )

  const pageCount = computed(() => {
    const result = videoPage.value
    if (!result) return 1
    return Math.max(1, Math.ceil(result.totalCount / result.perPage))
  })

  function pageLink(page: number): RouteLocationRaw {
    return {
      query: {
        ...route.query,
        page: page === 1 ? undefined : String(page),
      },
    }
  }

  if (import.meta.client) {
    const nuxtApp = useNuxtApp()
    const listPath = route.path
    let restoring = false
    const onPopState = () => {
      restoring = true
    }

    onMounted(() => window.addEventListener('popstate', onPopState))
    onBeforeUnmount(() => window.removeEventListener('popstate', onPopState))

    watch(
      () => route.fullPath,
      async () => {
        if (route.path !== listPath) return
        if (!restoring) {
          window.scrollTo({ top: 0, left: 0 })
          return
        }

        restoring = false
        const saved: unknown = window.history.state?.scroll
        await nextTick()
        if (isScrollPosition(saved)) {
          requestAnimationFrame(() => window.scrollTo(saved))
        }
      }
    )

    watch(
      () => videoPage.value?.page,
      (page) => {
        if (page === undefined || page === requestedPage.value) return
        nuxtApp.payload.data[cacheKey(page)] = videoPage.value
        router.replace(pageLink(page))
      },
      { immediate: true }
    )
  }

  return { currentPage, pageCount, pageLink }
}

function isScrollPosition(
  value: unknown
): value is { left: number; top: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { top?: unknown }).top === 'number' &&
    typeof (value as { left?: unknown }).left === 'number'
  )
}
