import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
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

  it('shows the time and exposes it on the seek slider', async () => {
    const wrapper = await mountPlayer({ durationSeconds: 125 })
    const slider = wrapper.get('[role="slider"]')

    expect(wrapper.text()).toContain('00:00 / 02:05')
    expect(slider.attributes('aria-valuemax')).toBe('125')
    expect(slider.attributes('aria-valuetext')).toBe('00:00 از 02:05')

    const video = wrapper.get('video')
    Object.defineProperty(video.element, 'duration', { value: 200 })
    video.element.currentTime = 65
    await video.trigger('timeupdate')

    expect(wrapper.text()).toContain('01:05 / 03:20')
    expect(slider.attributes('aria-valuenow')).toBe('65')
  })

  it('jumps to the start and end from the slider', async () => {
    const wrapper = await mountPlayer()
    const video = wrapper.get('video')
    Object.defineProperty(video.element, 'duration', { value: 200 })
    video.element.currentTime = 50
    const slider = wrapper.get('[role="slider"]')

    await slider.trigger('keydown', { key: 'End' })
    expect(video.element.currentTime).toBe(200)

    await slider.trigger('keydown', { key: 'Home' })
    expect(video.element.currentTime).toBe(0)

    await slider.trigger('keydown', { key: 'ArrowUp' })
    expect(video.element.currentTime).toBe(5)
  })

  it('switches the fullscreen button when fullscreen opens and closes', async () => {
    const wrapper = await mountPlayer()
    const region = wrapper.get('[role="region"]').element
    let current: Element | null = null
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => current,
    })

    try {
      current = region
      document.dispatchEvent(new Event('fullscreenchange'))
      await nextTick()
      expect(wrapper.find('[aria-label="خروج از تمام‌صفحه"]').exists()).toBe(
        true
      )

      current = null
      document.dispatchEvent(new Event('fullscreenchange'))
      await nextTick()
      expect(wrapper.find('[aria-label="تمام‌صفحه"]').exists()).toBe(true)
    } finally {
      Reflect.deleteProperty(document, 'fullscreenElement')
    }
  })

  it('reloads the video after a failure when retrying', async () => {
    const load = vi
      .spyOn(HTMLMediaElement.prototype, 'load')
      .mockImplementation(() => {})
    const wrapper = await mountPlayer()

    await wrapper.get('video').trigger('error')
    await wrapper.get('button').trigger('click')

    expect(load).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="پخش"]').exists()).toBe(true)
  })

  it('shows the error instead of throwing when the file cannot play', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(
      new DOMException('bad file', 'NotSupportedError')
    )
    const wrapper = await mountPlayer()

    await wrapper.get('[aria-label="پخش"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toBe('پخش ویدیو انجام نشد')
  })

  it('switches the button label while playing', async () => {
    const wrapper = await mountPlayer()

    await wrapper.get('video').trigger('play')
    expect(wrapper.find('[aria-label="توقف"]').exists()).toBe(true)

    await wrapper.get('video').trigger('pause')
    expect(wrapper.find('[aria-label="پخش"]').exists()).toBe(true)
  })
})
