import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({
  getNodeFile: vi.fn(),
  createFileVersion: vi.fn(),
  revertFileVersion: vi.fn(),
}))
vi.mock('@/api/files.js', () => api)

import TextDisplay from '@/features/files/displays/TextDisplay.vue'
import { fileBrowse } from '@/stores/fileBrowse.js'

const text = 'Hei 😀 maailma, kuinka voit?'
const mountDisplay = (props = {}) =>
  mount(TextDisplay, { props: { file: { '@rid': '#5:1' }, ...props }, attachTo: document.body })

describe('TextDisplay with a passage in focus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getNodeFile.mockResolvedValue(text)
    fileBrowse.focus = null
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('marks the passage by code point offsets and scrolls to it', async () => {
    fileBrowse.focus = { fileRid: '#5:1', start: 6, end: 13 }
    const wrapper = mountDisplay()
    await flushPromises()
    expect(wrapper.find('mark').text()).toBe('maailma')
    expect(wrapper.find('pre').element.textContent).toBe(text)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('ignores a passage of another text, or one outside the text', async () => {
    fileBrowse.focus = { fileRid: '#5:9', start: 6, end: 13 }
    let wrapper = mountDisplay()
    await flushPromises()
    expect(wrapper.find('mark').exists()).toBe(false)
    wrapper.unmount()
    fileBrowse.focus = { fileRid: '#5:1', start: 6, end: 999 }
    wrapper = mountDisplay()
    await flushPromises()
    expect(wrapper.find('mark').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows plain text as before without a passage', async () => {
    const wrapper = mountDisplay()
    await flushPromises()
    expect(wrapper.find('pre').text()).toBe(text)
    wrapper.unmount()
  })
})
