interface Entry<T> {
  at: number
  value: T
}

export interface MemoryCacheOptions {
  name: string
  ttlMs: number
  maxEntries: number
}

// Each server instance keeps its own copy; on serverless hosts the CDN
// `Cache-Control` headers in `nuxt.config.ts` do the shared caching.
export function createMemoryCache<T>({
  name,
  ttlMs,
  maxEntries,
}: MemoryCacheOptions) {
  const entries = new Map<string, Entry<T>>()
  const pending = new Map<string, Promise<T>>()

  function store(key: string, value: T) {
    entries.delete(key)
    entries.set(key, { at: Date.now(), value })
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value
      if (oldest === undefined) break
      entries.delete(oldest)
    }
  }

  return function get(key: string, load: () => Promise<T>): Promise<T> {
    const entry = entries.get(key)
    if (entry && Date.now() - entry.at < ttlMs) {
      return Promise.resolve(entry.value)
    }

    const running = pending.get(key)
    if (running) return running

    const request = load()
      .then((value) => {
        store(key, value)
        return value
      })
      .catch((error: unknown) => {
        if (!entry) throw error
        console.warn(
          `[${name}] refresh failed, serving the cached value for "${key}"`,
          error
        )
        store(key, entry.value)
        return entry.value
      })
      .finally(() => {
        pending.delete(key)
      })

    pending.set(key, request)
    return request
  }
}
