import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({
  getCoders: vi.fn(),
  addCoder: vi.fn(),
  lockCoder: vi.fn(),
  removeCoder: vi.fn(),
  getUserNames: vi.fn(),
  copyCodingSet: vi.fn(),
  createCodingSets: vi.fn(),
  exportCoding: vi.fn(),
  getCodingContent: vi.fn(),
  getCodingCoverage: vi.fn(),
  getCodingRegions: vi.fn(),
  saveCodingRegions: vi.fn(),
  tagCodingRegion: vi.fn(),
  untagCodingRegion: vi.fn(),
  getCodingTags: vi.fn(),
  getCodingTexts: vi.fn(),
  getMyCodingSets: vi.fn(),
}))
vi.mock('@/api/coding.js', () => api)
vi.mock('@/api/files.js', () => ({
  getNodeFile: vi.fn(),
  getTextROIs: vi.fn(),
  saveTextROIs: vi.fn(),
  tagTextRegion: vi.fn(),
  untagTextRegion: vi.fn(),
  getTextCoverage: vi.fn(),
  importTextSpans: vi.fn(),
}))
vi.mock('@/api/entities.js', () => ({ getTags: vi.fn(), createDeskTag: vi.fn(), getNerRegions: vi.fn() }))

import CodersPanel from '@/features/project/panel/CodersPanel.vue'
import TextRoiEditor from '@/features/files/roi/TextRoiEditor.vue'
import { codingTextApi } from '@/features/files/roi/textApi.js'

describe('CodersPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getCoders.mockResolvedValue([{ user_rid: '#3:2', name: 'Ann', locked: false }])
    api.getUserNames.mockResolvedValue([
      { rid: '#3:2', name: 'Ann' },
      { rid: '#3:3', name: 'Bob' },
    ])
  })

  it('lists coders, offers only users that are not coders yet, and never shows e-mails', async () => {
    const wrapper = mount(CodersPanel, { props: { setRid: '#9:1' } })
    await flushPromises()
    expect(wrapper.text()).toContain('Ann')
    expect(wrapper.findComponent({ name: 'VAutocomplete' }).props('items')).toEqual([
      { value: '#3:3', title: 'Bob' },
    ])
  })

  it('locks and removes a coder', async () => {
    const wrapper = mount(CodersPanel, { props: { setRid: '#9:1' } })
    await flushPromises()
    const buttons = wrapper.findAll('button')
    await buttons.find((b) => b.text() === 'Lock').trigger('click')
    expect(api.lockCoder).toHaveBeenCalledWith('#9:1', '#3:2', true)
    await wrapper.find('button[aria-label="Remove Ann"]').trigger('click')
    expect(api.removeCoder).toHaveBeenCalledWith('#9:1', '#3:2')
  })
})

describe('CodersPanel, owner tools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getCoders.mockResolvedValue([
      { user_rid: '#3:2', name: 'Ann', locked: false, progress: { texts: 4, with_passages: 3, passages: 9, untagged: 2 } },
    ])
    api.getUserNames.mockResolvedValue([])
  })

  it('shows how far each coder is', async () => {
    const wrapper = mount(CodersPanel, { props: { setRid: '#9:1', deskRid: '#1:0' } })
    await flushPromises()
    expect(wrapper.find('.coders__progress').text()).toBe('3/4')
  })

  it('copies the set as a final set and says what was made', async () => {
    api.copyCodingSet.mockResolvedValue({ label: 'Final', passages: 9 })
    const wrapper = mount(CodersPanel, { props: { setRid: '#9:1', deskRid: '#1:0' } })
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text().includes('Copy as a final set')).trigger('click')
    await flushPromises()
    expect(api.copyCodingSet).toHaveBeenCalledWith('#9:1', 'Final')
    expect(wrapper.text()).toContain('Made “Final” with 9 passages')
  })

  it('exports JSON and CSV of this set only', async () => {
    api.exportCoding.mockResolvedValue(new Blob(['{}']))
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const wrapper = mount(CodersPanel, { props: { setRid: '#9:1', deskRid: '#1:0' } })
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text() === 'Export CSV').trigger('click')
    await flushPromises()
    expect(api.exportCoding).toHaveBeenCalledWith('#1:0', { roiSet: '#9:1', format: 'csv' })
  })
})

describe('TextRoiEditor as a coder', () => {
  const mountCoder = async (extra = {}) => {
    const wrapper = mount(TextRoiEditor, {
      props: {
        file: { '@rid': '#5:1' },
        target: '#9:1',
        api: codingTextApi(),
        ...extra,
      },
      global: { stubs: { VAlert: true } },
    })
    await flushPromises()
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    api.getCodingContent.mockResolvedValue('Hei maailma')
    api.getCodingRegions.mockResolvedValue({
      rois: { a: { id: 'a', type: 'text', start: 0, end: 3 } },
      region_tags: {},
    })
    api.getCodingTags.mockResolvedValue({ result: [{ rid: '#7:1', label: 'Anger', color: '#e6194b' }] })
    api.getCodingCoverage.mockResolvedValue({ files: {} })
    api.tagCodingRegion.mockResolvedValue({})
  })

  it('reads and tags through the grant routes, with no way to make tags or import', async () => {
    const wrapper = await mountCoder()
    expect(api.getCodingContent).toHaveBeenCalledWith('#9:1', '#5:1')
    expect(api.getCodingRegions).toHaveBeenCalledWith('#9:1', '#5:1')
    expect(api.getCodingTags).toHaveBeenCalledWith('#9:1')
    expect(wrapper.text()).not.toContain('Import from named entities')
    await wrapper.find('.text-roi__excerpt').trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }))
    await flushPromises()
    expect(api.tagCodingRegion).toHaveBeenCalledWith('#9:1', '#5:1', 'a', '#7:1')
    wrapper.unmount()
  })

  it('a picker without permission to create tags does not offer to', async () => {
    const wrapper = await mountCoder()
    await wrapper.find('button.text-roi__add').trigger('click')
    await wrapper.find('.tag-pop input').setValue('Brand new')
    expect(wrapper.find('.tag-pop__tag--new').exists()).toBe(false)
    expect(wrapper.text()).toContain('No matching tag.')
    wrapper.unmount()
  })

  it('a locked set cannot be changed', async () => {
    const wrapper = await mountCoder({ readOnly: true })
    expect(wrapper.text()).toContain('This set is locked')
    expect(wrapper.find('button.text-roi__add').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Remove passage"], [aria-label="Remove passage"]').exists()).toBe(false)
    await wrapper.find('.text-roi__excerpt').trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }))
    await flushPromises()
    expect(api.tagCodingRegion).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
