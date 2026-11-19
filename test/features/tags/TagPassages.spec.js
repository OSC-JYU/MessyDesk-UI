import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({ getTagPassages: vi.fn() }))
vi.mock('@/api/entities.js', () => api)

import TagPassages from '@/features/tags/TagPassages.vue'

const item = {
  file_rid: '#5:1',
  file_label: 'interview.txt',
  roi_set: '#9:1',
  region_id: 'r1',
  text: 'maailma',
  before: 'Hei ',
  after: ', kuinka',
  tags: [{ rid: '#7:1', label: 'Anger', color: '#e6194b' }],
}

const tags = [{ '@rid': '#7:1', label: 'Anger' }]

describe('TagPassages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getTagPassages.mockResolvedValue({ total: 1, items: [item] })
  })

  it('shows each passage with its surroundings, its text and its tags', async () => {
    const wrapper = mount(TagPassages, { props: { tags, deskRids: ['#1:0'] } })
    await flushPromises()
    expect(api.getTagPassages).toHaveBeenCalledWith(tags, { projectRids: ['#1:0'], skip: 0, limit: 20 })
    expect(wrapper.find('mark').text()).toBe('maailma')
    expect(wrapper.find('.passages__quote').text()).toBe('Hei maailma, kuinka')
    expect(wrapper.text()).toContain('Anger')
    expect(wrapper.text()).toContain('Coded passages (1)')
  })

  it('opens the text of a passage', async () => {
    const wrapper = mount(TagPassages, { props: { tags } })
    await flushPromises()
    await wrapper.find('.passages__file').trigger('click')
    expect(wrapper.emitted('open-file')[0][0]).toMatchObject({ file_rid: '#5:1', file_label: 'interview.txt' })
  })

  it('says so when the tags have no coded passages', async () => {
    api.getTagPassages.mockResolvedValue({ total: 0, items: [] })
    const wrapper = mount(TagPassages, { props: { tags } })
    await flushPromises()
    expect(wrapper.text()).toContain('No coded passages')
  })

  it('does not ask for anything without tags', async () => {
    mount(TagPassages, { props: { tags: [] } })
    await flushPromises()
    expect(api.getTagPassages).not.toHaveBeenCalled()
  })
})
