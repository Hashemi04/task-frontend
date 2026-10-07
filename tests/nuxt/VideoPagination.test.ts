import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import VideoPagination from '~/components/video/VideoPagination.vue'

const pageLink = (page: number) => ({ query: { page: String(page) } })

describe('VideoPagination', () => {
  it('renders every page as a link with the current one marked', async () => {
    const wrapper = await mountSuspended(VideoPagination, {
      props: { page: 6, pageCount: 12, pageLink },
    })

    const current = wrapper.get('[aria-current="page"]')
    expect(wrapper.findAll('[aria-current]')).toHaveLength(1)
    expect(current.element.tagName).toBe('A')
    expect(current.text()).toBe('۶')
    expect(current.attributes('href')).toContain('page=6')

    const numbers = wrapper
      .findAll('a')
      .map((link) => link.text())
      .filter((text) => /^[۰-۹]+$/.test(text))
    expect(numbers).toEqual(['۴', '۵', '۶', '۷', '۸'])
    expect(wrapper.text().match(/\.\.\./g)).toHaveLength(2)
  })

  it('disables the backward controls on the first page', async () => {
    const wrapper = await mountSuspended(VideoPagination, {
      props: { page: 1, pageCount: 3, pageLink },
    })

    expect(wrapper.get('[aria-label="صفحه اول"]').attributes()).toHaveProperty(
      'disabled'
    )
    expect(wrapper.get('[aria-label="صفحه قبل"]').element.tagName).toBe(
      'BUTTON'
    )
    expect(wrapper.get('[aria-label="صفحه بعد"]').attributes('href')).toContain(
      'page=2'
    )
  })

  it('disables the forward controls on the last page', async () => {
    const wrapper = await mountSuspended(VideoPagination, {
      props: { page: 3, pageCount: 3, pageLink },
    })

    expect(wrapper.get('[aria-label="صفحه آخر"]').attributes()).toHaveProperty(
      'disabled'
    )
    expect(wrapper.get('[aria-label="صفحه قبل"]').attributes('href')).toContain(
      'page=2'
    )
  })
})
