import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { createError } from '#imports'
import ErrorPage from '~/error.vue'

function mountError(data?: unknown, statusCode = 404) {
  return mountSuspended(ErrorPage, {
    props: { error: createError({ statusCode, data }) },
  })
}

describe('error page', () => {
  it('names missing videos', async () => {
    const wrapper = await mountError({ resource: 'video' })

    expect(wrapper.get('h1').text()).toBe('ویدیو پیدا نشد')
  })

  it('reads the resource from server-serialized data', async () => {
    const wrapper = await mountError(JSON.stringify({ resource: 'video' }))

    expect(wrapper.get('h1').text()).toBe('ویدیو پیدا نشد')
  })

  it('falls back to a generic page message', async () => {
    const wrapper = await mountError('not json')

    expect(wrapper.get('h1').text()).toBe('صفحه پیدا نشد')
  })

  it('shows a generic message for server errors', async () => {
    const wrapper = await mountError({ resource: 'video' }, 500)

    expect(wrapper.get('h1').text()).toBe('خطایی رخ داد')
  })
})
