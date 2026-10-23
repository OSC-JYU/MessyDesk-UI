import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/entities.js', () => ({
  getEntities: vi.fn(),
  getEntitiesByType: vi.fn(),
  getMachineTags: vi.fn(),
  getRoiLabels: vi.fn(),
}))

const api = await import('@/api/entities.js')
const { default: TagPicker } = await import('@/features/tags/TagPicker.vue')

const machine = [
  {
    entity_rid: '#40:1',
    label: 'cat',
    count: 4,
    service_id: 'md-llm-azure',
    service_name: 'Azure OpenAI',
    task: 'autotag',
    model: 'gpt-5.1',
  },
  { entity_rid: '#40:2', label: 'dog', count: 2, service_id: 'md-llm-openai', task: 'autotag' },
]
const roiPage = (labels, hasMore = false) => ({
  items: labels.map((label) => ({
    service_id: 'md-gliner2',
    task: 'extract_entities',
    model: '',
    label,
    count: 5,
  })),
  hasMore,
})

async function mountPicker(props = {}) {
  const wrapper = mount(TagPicker, {
    props: {
      deskRid: '#12:3',
      tags: [],
      roi: [],
      'onUpdate:tags': (value) => wrapper.setProps({ tags: value }),
      'onUpdate:roi': (value) => wrapper.setProps({ roi: value }),
      ...props,
    },
  })
  await flushPromises()
  return wrapper
}

const title = (wrapper, text) =>
  wrapper.findAll('.v-expansion-panel-title').find((node) => node.text().includes(text))

beforeEach(() => {
  vi.clearAllMocks()
  api.getEntities.mockResolvedValue([
    { type: 'Tag', count: 2 },
    { type: 'Person', count: 1 },
  ])
  api.getEntitiesByType.mockResolvedValue({
    total: 2,
    items: [
      { '@rid': '#30:1', label: 'urgent', desks: [{ rid: '#12:3', label: 'Archive' }] },
      { '@rid': '#30:2', label: 'later', desks: [] },
    ],
  })
  api.getMachineTags.mockResolvedValue(machine)
  api.getRoiLabels.mockResolvedValue(roiPage(['person', 'place']))
})

describe('TagPicker', () => {
  it('lists collapsed groups for the desk without loading every tag', async () => {
    const wrapper = await mountPicker()
    expect(api.getEntities).toHaveBeenCalledWith(
      expect.objectContaining({ projectRids: ['#12:3'], createdBy: 'user' }),
    )
    expect(api.getMachineTags).toHaveBeenCalledWith({ projectRids: ['#12:3'] })
    expect(title(wrapper, 'Tag (2)')).toBeTruthy()
    expect(title(wrapper, 'Person (1)')).toBeTruthy()
    expect(title(wrapper, 'gpt-5.1 (Azure OpenAI): autotag (1)')).toBeTruthy()
    expect(title(wrapper, 'llm-openai: autotag (1)')).toBeTruthy()
    expect(title(wrapper, 'Found in text (ROI labels)')).toBeTruthy()
    expect(api.getEntitiesByType).not.toHaveBeenCalled()
    expect(api.getRoiLabels).not.toHaveBeenCalled()
  })

  it('loads a type when it is opened and selects a tag by clicking it', async () => {
    const wrapper = await mountPicker()
    await title(wrapper, 'Tag (2)').trigger('click')
    await flushPromises()
    expect(api.getEntitiesByType).toHaveBeenCalledWith(
      'Tag',
      expect.objectContaining({ projectRids: ['#12:3'], skip: 0 }),
    )
    const chip = wrapper.findAll('.v-chip').find((node) => node.text() === 'urgent')
    await chip.trigger('click')
    expect(wrapper.emitted('update:tags').at(-1)[0]).toEqual([{ '@rid': '#30:1', label: 'urgent' }])
    expect(wrapper.find('[data-test="selected"]').text()).toContain('urgent')
  })

  it('shows the desks of tags only without a fixed desk', async () => {
    const wrapper = await mountPicker({ deskRid: '' })
    await title(wrapper, 'Tag (2)').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Archive')
    const scoped = await mountPicker()
    await title(scoped, 'Tag (2)').trigger('click')
    await flushPromises()
    expect(scoped.text()).not.toContain('Archive')
  })

  it('selects a machine tag by its entity rid', async () => {
    const wrapper = await mountPicker()
    await title(wrapper, 'llm-openai: autotag').trigger('click')
    await flushPromises()
    await wrapper
      .findAll('.v-chip')
      .find((node) => node.text().startsWith('dog'))
      .trigger('click')
    expect(wrapper.emitted('update:tags').at(-1)[0]).toEqual([{ '@rid': '#40:2', label: 'dog' }])
  })

  it('loads ROI labels when their section opens, grouped by run, with load more', async () => {
    api.getRoiLabels
      .mockResolvedValueOnce(roiPage(['person'], true))
      .mockResolvedValueOnce(roiPage(['place']))
    const wrapper = await mountPicker()
    await title(wrapper, 'Found in text').trigger('click')
    await flushPromises()
    expect(api.getRoiLabels).toHaveBeenCalledWith(
      expect.objectContaining({ projectRids: ['#12:3'], offset: 0 }),
    )
    expect(title(wrapper, 'gliner2: extract entities')).toBeTruthy()
    await title(wrapper, 'gliner2: extract entities').trigger('click')
    await flushPromises()
    await wrapper
      .findAll('.v-chip')
      .find((node) => node.text().startsWith('person'))
      .trigger('click')
    expect(wrapper.emitted('update:roi').at(-1)[0]).toEqual([
      { service_id: 'md-gliner2', task: 'extract_entities', model: '', label: 'person' },
    ])
    expect(wrapper.text()).toContain('(5)')
    await wrapper.find('[data-test="roi-more"]').trigger('click')
    await flushPromises()
    expect(api.getRoiLabels).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 1 }))
    expect(wrapper.find('[data-test="roi-more"]').exists()).toBe(false)
  })

  it('shows an error in the ROI section only when the search index is down', async () => {
    api.getRoiLabels.mockRejectedValue({ status: 502, message: 'Search index is down' })
    const wrapper = await mountPicker()
    await title(wrapper, 'Found in text').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load ROI labels')
    expect(wrapper.text()).toContain('Search index is down')
    expect(wrapper.text()).not.toContain('Could not load tags')
    expect(title(wrapper, 'Tag (2)')).toBeTruthy()
  })

  it('searches the desk\u2019s tags and filters machine tags by the search text', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = await mountPicker()
      await wrapper.find('input').setValue('cat')
      await vi.advanceTimersByTimeAsync(350)
      await flushPromises()
      expect(api.getEntities).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'cat' }))
      expect(title(wrapper, 'gpt-5.1 (Azure OpenAI)')).toBeTruthy()
      expect(title(wrapper, 'llm-openai')).toBeFalsy()
    } finally {
      vi.useRealTimers()
    }
  })
})
