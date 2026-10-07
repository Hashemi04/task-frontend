import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRouter } from '#imports'
import AppHeader from '~/components/app/AppHeader.vue'

afterEach(async () => {
  vi.restoreAllMocks()
  await useRouter().replace('/')
})

describe('AppHeader', () => {
  it('hides the search form unless the page asks for it', async () => {
    const wrapper = await mountSuspended(AppHeader)

    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('pushes a trimmed search and resets the page', async () => {
    const router = useRouter()
    const push = vi.spyOn(router, 'push')
    const wrapper = await mountSuspended(AppHeader, {
      props: { showSearch: true },
      route: '/?page=3',
    })

    await wrapper.get('input[type="search"]').setValue('  تتر  ')
    await wrapper.get('form').trigger('submit')

    expect(push).toHaveBeenCalledWith({
      query: { q: 'تتر', page: undefined },
    })
  })

  it('clears the search when the field is empty', async () => {
    const push = vi.spyOn(useRouter(), 'push')
    const wrapper = await mountSuspended(AppHeader, {
      props: { showSearch: true },
      route: '/?q=btc',
    })

    await wrapper.get('input[type="search"]').setValue('   ')
    await wrapper.get('form').trigger('submit')

    expect(push).toHaveBeenCalledWith({
      query: { q: undefined, page: undefined },
    })
  })

  it('fills the field from the URL', async () => {
    const wrapper = await mountSuspended(AppHeader, {
      props: { showSearch: true },
      route: '/?q=btc',
    })

    expect(
      (wrapper.get('input[type="search"]').element as HTMLInputElement).value
    ).toBe('btc')
  })

  it('marks the logo as current only on the first unfiltered page', async () => {
    const home = await mountSuspended(AppHeader, { route: '/' })
    expect(home.get('a[href="/"]').attributes('aria-current')).toBe('page')

    const paged = await mountSuspended(AppHeader, { route: '/?page=2' })
    expect(paged.get('a[href="/"]').attributes('aria-current')).toBeUndefined()
  })
})
