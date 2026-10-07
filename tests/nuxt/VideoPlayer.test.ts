import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VideoPlayer from '~/components/video/VideoPlayer.vue'
import type { VideoDetail } from '~/types/video'

const baseVideo: VideoDetail = {
  uid: 'abc',
  title: 'عنوان',
  posterUrl: '',
  posterSrcset: '',
  durationSeconds: 60,
  visitCount: 1,
  publishedAt: '',
  publishedAtLabel: 'امروز',
  senderName: 'تبدیل',
  profilePhotoUrl: '',
  description: '',
  likeCount: 0,
  followerCount: 0,
  tags: [],
  playbackUrl: 'https://caspian.asset.aparat.com/video/720.mp4',
  embedUrl: '',
}

function mountPlayer(video: Partial<VideoDetail> = {}) {
  return mountSuspended(VideoPlayer, {
    props: { video: { ...baseVideo, ...video } },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('VideoPlayer', () => {
  it('says so when the video has no playable file', async () => {
    const wrapper = await mountPlayer({ playbackUrl: '' })

    expect(wrapper.get('[role="status"]').text()).toBe(
      'پخش این ویدیو در دسترس نیست'
    )
    expect(wrapper.find('[aria-label="پخش"]').exists()).toBe(false)
  })

  it('replaces the controls with a message when playback fails', async () => {
    const wrapper = await mountPlayer()
    expect(wrapper.find('[aria-label="پخش"]').exists()).toBe(true)

    await wrapper.get('video').trigger('error')

    expect(wrapper.get('[role="status"]').text()).toBe('پخش ویدیو انجام نشد')
    expect(wrapper.find('[aria-label="پخش"]').exists()).toBe(false)
  })

  it('shows a spinner while the video buffers', async () => {
    const wrapper = await mountPlayer()
    const video = wrapper.get('video')

    await video.trigger('waiting')
    expect(wrapper.find('[aria-label="در حال بارگذاری"]').exists()).toBe(true)

    await video.trigger('playing')
    expect(wrapper.find('[aria-label="در حال بارگذاری"]').exists()).toBe(false)
  })

  it('starts playback from the play button and survives a blocked play', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValue(new DOMException('blocked', 'NotAllowedError'))
    const wrapper = await mountPlayer()

    await wrapper.get('[aria-label="پخش"]').trigger('click')

    expect(play).toHaveBeenCalledTimes(1)
  })

  it('handles shortcuts on the player only', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined)
    const wrapper = await mountPlayer()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    expect(play).not.toHaveBeenCalled()

    await wrapper.get('[role="region"]').trigger('keydown', { key: ' ' })
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('ignores shortcuts while a playback message is shown', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const wrapper = await mountPlayer({ playbackUrl: '' })

    await wrapper.get('[role="region"]').trigger('keydown', { key: ' ' })
    await wrapper.get('[role="region"]').trigger('keydown', { key: 'm' })

    expect(play).not.toHaveBeenCalled()
    expect(wrapper.get('video').element.muted).toBe(false)
  })

  it('switches the button label while playing', async () => {
    const wrapper = await mountPlayer()

    await wrapper.get('video').trigger('play')
    expect(wrapper.find('[aria-label="توقف"]').exists()).toBe(true)

    await wrapper.get('video').trigger('pause')
    expect(wrapper.find('[aria-label="پخش"]').exists()).toBe(true)
  })
})
