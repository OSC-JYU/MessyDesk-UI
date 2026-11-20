import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@/api/projects.js', () => ({ getSetFiles: vi.fn() }))
vi.mock('@/api/files.js', () => ({ getImageROIs: vi.fn() }))

import { getSetFiles } from '@/api/projects.js'
import { setSettings } from '@/stores/settings.js'
import SetBrowser from '@/features/project/SetBrowser.vue'

const file = (rid, label, page) => ({
  '@rid': rid,
  label,
  type: 'text',
  page_number: page,
  info: label,
})
const set = { id: '#5:1', data: { label: 'Texts' } }

const top = {
  grouped: true,
  file_count: 7,
  entries_total: 3,
  groups_total: 2,
  files_offset: 6,
  entries: [
    {
      kind: 'group',
      origin_rid: '#9:1',
      origin_label: 'a.pdf',
      count: 4,
      cover: file('#6:1', 'page_001.txt', 1),
    },
    {
      kind: 'group',
      origin_rid: '#9:2',
      origin_label: 'b.pdf',
      count: 2,
      cover: file('#6:5', 'page_001.txt', 1),
    },
    file('#6:9', 'loose.txt'),
  ],
}
const inside = {
  grouped: true,
  file_count: 2,
  set_total: 7,
  offset: 4,
  origin: { rid: '#9:2', label: 'b.pdf' },
  files: [file('#6:5', 'page_001.txt', 1), file('#6:6', 'page_002.txt', 2)],
}

const mountBrowser = (props = {}) =>
  mount(SetBrowser, { props: { set, ...props }, global: { stubs: { ResultsGrid: false } } })

beforeEach(() => {
  getSetFiles.mockReset()
  setSettings({ group_pdf: 'on' })
})

describe('SetBrowser grouping', () => {
  it('shows a card per PDF, then the files that come from no PDF', async () => {
    getSetFiles.mockResolvedValue(top)
    const wrapper = mountBrowser()
    await flushPromises()
    expect(getSetFiles).toHaveBeenCalledWith('#5:1', 0, 10, { group: 'origin', origin: undefined })
    const cards = wrapper.findAll('.result-card')
    expect(cards.map((c) => c.find('.result-card__label').text())).toEqual([
      'a.pdf',
      'b.pdf',
      'loose.txt',
    ])
    expect(cards[0].classes()).toContain('result-card--group')
    expect(cards[0].text()).toContain('4 files')
    expect(cards[2].classes()).not.toContain('result-card--group')
    expect(wrapper.text()).toContain('2 PDFs and 1 files')
  })

  it('opens a PDF on click, shows the breadcrumb and gives viewer positions in the whole set', async () => {
    getSetFiles.mockResolvedValueOnce(top).mockResolvedValue(inside)
    const wrapper = mountBrowser()
    await flushPromises()
    await wrapper.findAll('.result-card')[1].trigger('click')
    await flushPromises()
    expect(getSetFiles).toHaveBeenLastCalledWith('#5:1', 0, 10, { group: 'origin', origin: '#9:2' })
    expect(wrapper.find('.crumbs__step').text()).toBe('Texts')
    expect(wrapper.text()).toContain('b.pdf')
    await wrapper.findAll('.result-card')[1].trigger('click')
    expect(wrapper.emitted('open')[0][0]).toEqual({ rid: '#6:6', index: 5, total: 7, origin: '' })
  })

  it('goes back to the top level from the breadcrumb', async () => {
    getSetFiles.mockResolvedValueOnce(top).mockResolvedValueOnce(inside).mockResolvedValue(top)
    const wrapper = mountBrowser()
    await flushPromises()
    await wrapper.findAll('.result-card')[1].trigger('click')
    await flushPromises()
    await wrapper.find('.crumbs__step').trigger('click')
    await flushPromises()
    expect(wrapper.find('.crumbs__step').exists()).toBe(false)
    expect(wrapper.findAll('.result-card')).toHaveLength(3)
  })

  it('positions a file without a PDF after all the grouped files', async () => {
    getSetFiles.mockResolvedValue(top)
    const wrapper = mountBrowser()
    await flushPromises()
    await wrapper.findAll('.result-card')[2].trigger('click')
    expect(wrapper.emitted('open')[0][0]).toEqual({ rid: '#6:9', index: 6, total: 7, origin: '' })
  })

  it('lists the whole set in the grouped order when the setting is off, and can switch on', async () => {
    setSettings({ group_pdf: 'off' })
    getSetFiles.mockResolvedValueOnce({
      grouped: true,
      file_count: 2,
      files: [file('#6:1', 'page_001.txt', 1)],
    })
    const wrapper = mountBrowser()
    await flushPromises()
    expect(getSetFiles).toHaveBeenCalledWith('#5:1', 0, 10, { group: 'origin', order: 'flat' })
    getSetFiles.mockResolvedValue(top)
    const toggle = wrapper.findAll('button').find((b) => b.text() === 'Group by PDF')
    await toggle.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.result-card--group')).toHaveLength(2)
  })

  it('has no toggle for a set that holds nothing from a PDF', async () => {
    getSetFiles.mockResolvedValue({ grouped: false, file_count: 1, files: [file('#6:1', 'x.txt')] })
    const wrapper = mountBrowser()
    await flushPromises()
    expect(wrapper.text()).not.toContain('Show all files')
    expect(wrapper.text()).not.toContain('Group by PDF')
  })

  it('opens inside a PDF when coming back from the file viewer', async () => {
    getSetFiles.mockResolvedValue(inside)
    const wrapper = mountBrowser({ initialOrigin: '#9:2', initialPage: 3 })
    await flushPromises()
    expect(getSetFiles).toHaveBeenCalledWith('#5:1', 0, 10, { group: 'origin', origin: '#9:2' })
    expect(wrapper.find('.crumbs__step').exists()).toBe(true)
  })
})
