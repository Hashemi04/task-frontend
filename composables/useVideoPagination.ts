import { clampPage } from '~/utils/videoParse'

const desktopMinWidth = 1024
const desktopPageSize = 9
const mobilePageSize = 6

export function useVideoPagination(
  totalCount: MaybeRef<number>,
  pageSize = useVideoPageSize()
) {
  const route = useRoute()
  const router = useRouter()

  const requestedPage = computed(() => {
    const value = Number(route.query.page)
    return Number.isInteger(value) && value > 0 ? value : 1
  })

  const pageCount = computed(() => {
    return Math.max(1, Math.ceil(toValue(totalCount) / pageSize.value))
  })

  const currentPage = computed(() =>
    clampPage(requestedPage.value, pageCount.value)
  )

  async function setPage(nextPage: number) {
    const page = clampPage(nextPage, pageCount.value)

    await router.replace({
      query: {
        ...route.query,
        page: page === 1 ? undefined : String(page),
      },
    })
  }

  if (import.meta.client) {
    watch(requestedPage, () => {
      window.scrollTo({ top: 0, left: 0 })
    })

    watch(pageCount, (count) => {
      if (requestedPage.value > count) {
        setPage(count)
      }
    })
  }

  return { pageSize, currentPage, pageCount, setPage }
}

export function useVideoPageSize() {
  const pageSize = useState('video-page-size', () => {
    if (import.meta.server) {
      const userAgent = useRequestHeaders(['user-agent'])['user-agent'] ?? ''
      return isMobileUserAgent(userAgent) ? mobilePageSize : desktopPageSize
    }

    return window.matchMedia(`(min-width: ${desktopMinWidth}px)`).matches
      ? desktopPageSize
      : mobilePageSize
  })

  onMounted(() => {
    const media = window.matchMedia(`(min-width: ${desktopMinWidth}px)`)

    const update = () => {
      pageSize.value = media.matches ? desktopPageSize : mobilePageSize
    }

    update()
    media.addEventListener('change', update)
    onScopeDispose(() => media.removeEventListener('change', update))
  })

  return pageSize
}

function isMobileUserAgent(userAgent: string) {
  return /Android|iPhone|iPad|Mobile/i.test(userAgent)
}
