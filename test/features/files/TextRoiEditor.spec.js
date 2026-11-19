import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({
  getNodeFile: vi.fn(),
  getTextROIs: vi.fn(),
  getTextCoverage: vi.fn(),
  saveTextROIs: vi.fn(),
  tagTextRegion: vi.fn(),
  untagTextRegion: vi.fn(),
  importTextSpans: vi.fn(),
}))
const tagApi = vi.hoisted(() => ({ getTags: vi.fn(), createDeskTag: vi.fn(), getNerRegions: vi.fn() }))
vi.mock('@/api/files.js', () => api)
vi.mock('@/api/entities.js', () => tagApi)

import TextRoiEditor from '@/features/files/roi/TextRoiEditor.vue'

const text = 'Hei 😀 maailma\nToinen rivi'

async function mountEditor(extra = {}, options = {}) {
  const wrapper = mount(TextRoiEditor, {
    props: { file: { '@rid': '#5:1' }, target: '#9:1', deskRid: '#1:0', ...extra },
    global: { stubs: { VAlert: true } },
    ...options,
  })
  await flushPromises()
  return wrapper
}

describe('TextRoiEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getNodeFile.mockResolvedValue(text)
    api.getTextROIs.mockResolvedValue({
      rois: { a: { id: 'a', type: 'text', start: 4, end: 5, text: '😀' } },
      stale: false,
    })
    api.saveTextROIs.mockResolvedValue({ data: {} })
    api.tagTextRegion.mockResolvedValue({})
    api.getTextCoverage.mockResolvedValue({ files: {} })
    api.untagTextRegion.mockResolvedValue({})
    tagApi.getTags.mockResolvedValue({
      result: [
        { rid: '#7:2', label: 'Hope', color: '#3cb44b' },
        { rid: '#7:1', label: 'Anger', color: '#e6194b' },
      ],
    })
  })

  it('renders exactly the text, with the regions marked', async () => {
    const wrapper = await mountEditor()
    expect(wrapper.find('pre').element.textContent).toBe(text)
    expect(wrapper.findAll('.text-roi__mark').map((m) => m.text())).toEqual(['😀'])
    expect(wrapper.text()).toContain('Passages (1)')
  })

  it('shows a warning when the text changed after marking', async () => {
    api.getTextROIs.mockResolvedValue({ rois: {}, stale: true })
    const wrapper = await mountEditor()
    expect(wrapper.findComponent({ name: 'VAlert' }).exists()).toBe(true)
  })

  it('works for a text without a region file yet', async () => {
    api.getTextROIs.mockRejectedValue({ response: { status: 404 } })
    const wrapper = await mountEditor()
    expect(wrapper.find('pre').element.textContent).toBe(text)
    expect(wrapper.text()).toContain('No passages marked yet')
  })

  it('lists the desk tags as a codebook sorted by label, with numbers', async () => {
    const wrapper = await mountEditor()
    const legend = wrapper.findAll('.text-roi__legend-item').map((b) => b.text())
    expect(legend[0]).toContain('1')
    expect(legend[0]).toContain('Anger')
    expect(legend[1]).toContain('Hope')
  })

  it('shows the tags of a region, and an untagged region stays valid', async () => {
    api.getTextROIs.mockResolvedValue({
      rois: {
        a: { id: 'a', type: 'text', start: 4, end: 5 },
        b: { id: 'b', type: 'text', start: 0, end: 3 },
      },
      region_tags: { a: [{ rid: '#7:1', label: 'Anger', color: '#e6194b' }] },
    })
    const wrapper = await mountEditor()
    const items = wrapper.findAll('.text-roi__item')
    expect(items).toHaveLength(2)
    expect(items[1].find('.text-roi__chip').text()).toContain('Anger')
    expect(items[0].find('.text-roi__chip').exists()).toBe(false)
    expect(wrapper.text()).toContain('Only without tags (1)')
    // Tagged text is coloured by its tag, the untagged passage is amber.
    const marks = wrapper.findAll('.text-roi__mark')
    expect(marks[1].attributes('style')).toContain('rgb(230, 25, 75)')
    expect(marks[0].attributes('style')).toContain('255, 193, 7')
  })

  it('tags the selected passage with a number key and untags it with the same key', async () => {
    api.getTextROIs.mockResolvedValue({
      rois: { a: { id: 'a', type: 'text', start: 4, end: 5 } },
      region_tags: {},
    })
    const wrapper = await mountEditor()
    await wrapper.find('.text-roi__excerpt').trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }))
    await flushPromises()
    expect(api.tagTextRegion).toHaveBeenCalledWith('#5:1', '#9:1', 'a', '#7:1')
    expect(wrapper.find('.text-roi__chip').text()).toContain('Anger')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }))
    await flushPromises()
    expect(api.untagTextRegion).toHaveBeenCalledWith('#5:1', '#9:1', 'a', '#7:1')
    expect(wrapper.find('.text-roi__chip').exists()).toBe(false)
    wrapper.unmount()
  })

  it('ignores number keys when no passage is selected', async () => {
    const wrapper = await mountEditor()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }))
    await flushPromises()
    expect(api.tagTextRegion).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('has no navigation buttons outside a set', async () => {
    const wrapper = await mountEditor()
    expect(wrapper.text()).not.toContain('Next text without passages')
  })

  it('goes to the next text without passages, using fresh coverage', async () => {
    api.getTextCoverage.mockResolvedValue({
      files: { '#5:1': { regions: 1, tagged: 0, untagged: 1 }, '#5:2': { regions: 2, tagged: 2, untagged: 0 } },
    })
    const findNext = vi.fn().mockResolvedValue(true)
    const wrapper = await mountEditor({ findNext })
    expect(wrapper.text()).toContain('Texts with passages: 2')
    const button = wrapper.findAll('button').find((b) => b.text().includes('without passages'))
    await button.trigger('click')
    await flushPromises()
    const matches = findNext.mock.calls[0][0]
    expect(matches('#5:2')).toBe(false) // has passages
    expect(matches('#5:3')).toBe(true) // none yet
    expect(matches('#5:1')).toBe(false) // the shown text is never the answer
  })

  it('goes to the next text with untagged passages, and says when there is none', async () => {
    api.getTextCoverage.mockResolvedValue({
      files: { '#5:2': { regions: 2, tagged: 2, untagged: 0 }, '#5:3': { regions: 1, tagged: 0, untagged: 1 } },
    })
    const findNext = vi.fn().mockResolvedValue(false)
    const wrapper = await mountEditor({ findNext })
    const button = wrapper.findAll('button').find((b) => b.text().includes('untagged passages'))
    await button.trigger('click')
    await flushPromises()
    const matches = findNext.mock.calls[0][0]
    expect(matches('#5:2')).toBe(false)
    expect(matches('#5:3')).toBe(true)
    expect(wrapper.text()).toContain('No other text has untagged passages.')
  })

  it('changes the extent of a passage with the next selection and keeps it otherwise', async () => {
    api.getTextROIs.mockResolvedValue({
      rois: { a: { id: 'a', type: 'text', start: 4, end: 5 } },
      region_tags: { a: [{ rid: '#7:1', label: 'Anger', color: '#e6194b' }] },
    })
    const wrapper = await mountEditor({}, { attachTo: document.body })
    await wrapper.find('button[aria-label="Change the extent of the passage"]').trigger('click')
    expect(wrapper.text()).toContain('Select the new text for the passage')
    const pre = wrapper.find('pre').element
    const first = pre.querySelector('span').firstChild
    const range = document.createRange()
    range.setStart(first, 0)
    range.setEnd(first, 3)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    await wrapper.find('pre').trigger('mouseup')
    await flushPromises()
    const saved = api.saveTextROIs.mock.calls.at(-1)[2]
    expect(saved.a.start).toBe(0)
    expect(saved.a.end).toBe(3)
    expect(wrapper.find('.text-roi__chip').text()).toContain('Anger')
    expect(wrapper.text()).not.toContain('Select the new text for the passage')
    wrapper.unmount()
  })

  it('escape cancels changing the extent', async () => {
    const wrapper = await mountEditor()
    await wrapper.find('button[aria-label="Change the extent of the passage"]').trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(wrapper.text()).not.toContain('Select the new text for the passage')
    wrapper.unmount()
  })

  it('escape closes the tag popup even when the focus is in the text', async () => {
    api.getTextROIs.mockResolvedValue({ rois: { a: { id: 'a', type: 'text', start: 4, end: 5 } } })
    const wrapper = await mountEditor({}, { attachTo: document.body })
    await wrapper.find('button.text-roi__add').trigger('click')
    expect(wrapper.find('.tag-pop').exists()).toBe(true)
    document.body.focus()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(wrapper.find('.tag-pop').exists()).toBe(false)
    wrapper.unmount()
  })

  it('imports the spans of a named-entity run and says what came in', async () => {
    tagApi.getNerRegions.mockResolvedValue([
      { rid: '#8:1', service_id: 'md-gliner2', task: 'extract_entities', rois: { a: { start: 0, end: 3, label: 'greeting' }, b: { start: 4, end: 5, label: 'greeting' } } },
      { rid: '#8:2', error: 'broken' },
    ])
    api.importTextSpans.mockResolvedValue({ regions: 2, tags: 1, skipped: 0 })
    const wrapper = await mountEditor()
    await wrapper.find('button[aria-label], section[aria-label="Import from named entities"] button').trigger('click')
    await flushPromises()
    const run = wrapper.find('.text-roi__run')
    expect(run.text()).toContain('greeting (2)')
    expect(wrapper.findAll('.text-roi__run')).toHaveLength(1)
    await run.trigger('click')
    await flushPromises()
    expect(api.importTextSpans).toHaveBeenCalledWith('#5:1', '#9:1', '#8:1', undefined)
    expect(wrapper.text()).toContain('Imported 2 passages with 1 tags.')
  })
})
