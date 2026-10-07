import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useNuxtApp, useRouter, useVideoPagination } from '#imports'
import type { VideoPage } from '~/types/video'

function page(number: number, totalCount = 27): VideoPage {
  return { items: [], page: number, perPage: 9, totalCount }
}

function harness(videoPage: ReturnType<typeof ref<VideoPage | null>>) {
  return defineComponent({
    setup() {
      const pagination = useVideoPagination(videoPage, (n) => `test-key-${n}`)
      return () =>
        h('p', `${pagination.currentPage.value}/${pagination.pageCount.value}`)
    },
  })
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(async () => {
  vi.restoreAllMocks()
  await useRouter().replace('/')
})

describe('useVideoPagination', () => {
  it('takes the page and page count from the server response', async () => {
    const wrapper = await mountSuspended(harness(ref(page(2))), {
      route: '/?page=2',
    })

    expect(wrapper.text()).toBe('2/3')
  })

  it('corrects the URL and reuses the response when the server clamps the page', async () => {
    await mountSuspended(harness(ref(page(3))), { route: '/?page=9' })

    await vi.waitFor(() =>
      expect(useRouter().currentRoute.value.query.page).toBe('3')
    )
    expect(useNuxtApp().payload.data['test-key-3']).toEqual(page(3))
  })

  it('builds links that keep the other query parameters', async () => {
    let link: unknown
    const Harness = defineComponent({
      setup() {
        link = useVideoPagination(ref(page(1)), String).pageLink(1)
        return () => h('p')
      },
    })
    await mountSuspended(Harness, { route: '/?q=btc&page=2' })

    expect(link).toEqual({ query: { q: 'btc', page: undefined } })
  })

  it('scrolls to the top when moving to another page', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    await mountSuspended(harness(ref(page(1))), { route: '/' })

    await useRouter().push('/?page=2')
    await flush()

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 })
  })

  it('does not jump to the top on back and forward navigation', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    await mountSuspended(harness(ref(page(1))), { route: '/' })

    window.dispatchEvent(new PopStateEvent('popstate'))
    await useRouter().push('/?page=2')
    await flush()

    expect(scrollTo).not.toHaveBeenCalledWith({ top: 0, left: 0 })
  })
})
