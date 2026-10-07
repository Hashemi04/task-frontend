import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import VideoCard from '~/components/video/VideoCard.vue'
import type { VideoSummary } from '~/types/video'

const video: VideoSummary = {
  uid: 'abc',
  title: 'عنوان',
  posterUrl: '',
  posterSrcset: '',
  durationSeconds: 125,
  visitCount: 1200,
  publishedAt: '',
  publishedAtLabel: 'امروز',
  senderName: 'تبدیل',
  profilePhotoUrl: '',
}

describe('VideoCard', () => {
  it('shows the duration', async () => {
    const wrapper = await mountSuspended(VideoCard, { props: { video } })

    expect(wrapper.text()).toContain('02:05')
  })

  it('hides the duration when Aparat does not send one', async () => {
    const wrapper = await mountSuspended(VideoCard, {
      props: { video: { ...video, durationSeconds: 0 } },
    })

    expect(wrapper.text()).not.toContain('00:00')
  })
})
