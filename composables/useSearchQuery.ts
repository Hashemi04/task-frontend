export function useSearchQuery() {
  const route = useRoute()
  const router = useRouter()

  const query = computed(() => {
    const value = route.query.q
    return typeof value === 'string' ? value : ''
  })

  async function submitSearch(value: string) {
    const q = value.trim()

    await router.replace({
      query: {
        ...route.query,
        q: q || undefined,
      },
    })
  }

  return { query, submitSearch }
}
