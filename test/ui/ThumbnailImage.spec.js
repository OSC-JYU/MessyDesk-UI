import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ThumbnailImage from '@/ui/ThumbnailImage.vue'

describe('ThumbnailImage', () => {
  it('shows the image while it loads', () => {
    const thumb = mount(ThumbnailImage, { props: { src: '/api/thumbnails/a', lazy: true } })
    expect(thumb.get('img').attributes('src')).toBe('/api/thumbnails/a')
    expect(thumb.get('img').attributes('loading')).toBe('lazy')
  })

  it('shows the baking placeholder when there is no thumbnail yet', async () => {
    const thumb = mount(ThumbnailImage, { props: { src: '/api/thumbnails/a' } })
    await thumb.get('img').trigger('error')
    expect(thumb.find('img').exists()).toBe(false)
    expect(thumb.get('[role="img"]').attributes('aria-label')).toBe('Preview not ready yet')
    expect(thumb.text()).toContain('Preview not ready yet')
    expect(thumb.find('.crunch-icon').exists()).toBe(true)
  })

  it('tries again when the source changes', async () => {
    const thumb = mount(ThumbnailImage, { props: { src: '/api/thumbnails/a' } })
    await thumb.get('img').trigger('error')
    await thumb.setProps({ src: '/api/thumbnails/a?v=2' })
    expect(thumb.get('img').attributes('src')).toBe('/api/thumbnails/a?v=2')
  })

  it('leaves out the text when compact', () => {
    const thumb = mount(ThumbnailImage, { props: { compact: true } })
    expect(thumb.text()).toBe('')
    expect(thumb.classes()).toContain('thumbnail--compact')
  })
})
