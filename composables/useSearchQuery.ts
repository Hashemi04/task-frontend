export function useSearchQuery() {
  const route = useRoute()
  const router = useRouter()

  const query = computed(() => {
    const value = route.query.q
    return typeof value === 'string' ? value : ''
  })

  async function submitSearch(value: string) {
    const q = value.trim()

    await router.push({
      query: {
        ...route.query,
        q: q || undefined,
        page: undefined,
      },
    })
  }

  return { query, submitSearch }
}
