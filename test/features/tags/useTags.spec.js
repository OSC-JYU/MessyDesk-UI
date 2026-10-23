import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/api/entities.js', () => ({
  getEntities: vi.fn(),
  getEntitiesByType: vi.fn(),
  getEntityItems: vi.fn(),
  getMachineTags: vi.fn(),
  getNerLabelGroups: vi.fn(),
  getRoiLabels: vi.fn(),
}))

const api = await import('@/api/entities.js')
const { useTags } = await import('@/features/tags/useTags.js')
const { createRoiLoader } = await import('@/features/tags/tagLoaders.js')
const { reactive, computed } = await import('vue')

beforeEach(() => {
  vi.clearAllMocks()
  api.getEntities.mockResolvedValue([{ type: 'Tag', count: 3 }])
  api.getMachineTags.mockResolvedValue([])
  api.getNerLabelGroups.mockResolvedValue([])
})

describe('useTags', () => {
  it('limits the human tags, machine tags and NER labels to the desk', async () => {
    const tags = useTags(ref('12:3'), ref('#12:3'))
    await flushPromises()
    expect(api.getEntities).toHaveBeenCalledWith({
      projectRids: ['#12:3'],
      createdBy: 'user',
      search: '',
    })
    expect(api.getMachineTags).toHaveBeenCalledWith({ projectRids: ['#12:3'] })
    expect(api.getNerLabelGroups).toHaveBeenCalledWith('', {
      projectRids: ['#12:3'],
      tagRids: [],
      tagMatch: 'or',
    })
    expect(tags.state.types).toEqual([{ type: 'Tag', count: 3 }])
  })

  it('finds files with any selected tag by default, or with all of them', async () => {
    api.getEntityItems.mockResolvedValue({ total: 0, items: [] })
    const tags = useTags(ref('12:3'), ref('#12:3'))
    await flushPromises()
    await tags.toggle({ '@rid': '#30:1', label: 'a' })
    await tags.toggle({ '@rid': '#30:2', label: 'b' })
    expect(api.getEntityItems).toHaveBeenLastCalledWith(expect.any(Array), {
      projectRids: ['#12:3'],
      match: 'or',
      skip: 0,
      limit: 24,
    })
    tags.state.match = 'and'
    await flushPromises()
    expect(api.getEntityItems).toHaveBeenLastCalledWith(expect.any(Array), {
      projectRids: ['#12:3'],
      match: 'and',
      skip: 0,
      limit: 24,
    })
    const calls = api.getEntityItems.mock.calls.length
    tags.state.selected = [tags.state.selected[0]]
    tags.state.match = 'or'
    await flushPromises()
    expect(api.getEntityItems.mock.calls.length).toBe(calls)
  })

  it('loads the files a page at a time from the server', async () => {
    api.getEntityItems.mockResolvedValue({ total: 60, items: [{ '@rid': '#50:1' }] })
    const tags = useTags(ref('12:9'), ref('#12:3'))
    await flushPromises()
    await tags.toggle({ '@rid': '#30:1', label: 'a' })
    expect(tags.state.total).toBe(60)
    expect(api.getNerLabelGroups).toHaveBeenLastCalledWith('', {
      projectRids: ['#12:3'],
      tagRids: ['#30:1'],
      tagMatch: 'or',
    })
    const loads = api.getNerLabelGroups.mock.calls.length
    tags.state.page = 3
    await flushPromises()
    expect(api.getEntityItems).toHaveBeenLastCalledWith(expect.any(Array), {
      projectRids: ['#12:3'],
      match: 'or',
      skip: 48,
      limit: 24,
    })
    expect(api.getNerLabelGroups.mock.calls.length).toBe(loads)
    // A new selection starts from the first page again.
    await tags.toggle({ '@rid': '#30:2', label: 'b' })
    expect(tags.state.page).toBe(1)
    expect(api.getEntityItems).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.objectContaining({ skip: 0 }),
    )
  })

  it('uses the chosen desks in the global view', async () => {
    const tags = useTags(ref('global'), ref(''))
    tags.state.desks = ['#12:4']
    await flushPromises()
    expect(api.getEntities).toHaveBeenLastCalledWith(
      expect.objectContaining({ projectRids: ['#12:4'] }),
    )
  })

  it('loads a type page by page and keeps the desks of the tags', async () => {
    const first = Array.from({ length: 2 }, (_, i) => ({
      '@rid': `#30:${i}`,
      label: `t${i}`,
      desks: [{ rid: '#12:3', label: 'Archive' }],
    }))
    api.getEntitiesByType
      .mockResolvedValueOnce({ total: 3, items: first })
      .mockResolvedValueOnce({ total: 3, items: [{ '@rid': '#30:2', label: 't2' }] })
    const tags = useTags(ref('global'), ref(''))
    await flushPromises()
    await tags.loadType('Tag')
    await tags.loadType('Tag')
    expect(api.getEntitiesByType).toHaveBeenCalledTimes(1)
    await tags.loadType('Tag', true)
    expect(api.getEntitiesByType).toHaveBeenLastCalledWith(
      'Tag',
      expect.objectContaining({ skip: 2, createdBy: 'user' }),
    )
    expect(tags.state.typeItems.Tag.items).toHaveLength(3)
    expect(tags.state.typeItems.Tag.items[0].desks[0].label).toBe('Archive')
  })

  it('keeps a failed load in state.error', async () => {
    api.getNerLabelGroups.mockRejectedValue({ status: 500, message: 'down' })
    const tags = useTags(ref('12:3'), ref('#12:3'))
    await flushPromises()
    expect(tags.state.error.message).toBe('down')
  })
})

describe('createRoiLoader', () => {
  const make = () => {
    const roi = reactive({ items: [], hasMore: false, loading: false, error: null, loaded: false })
    const search = { value: '' }
    const load = createRoiLoader(
      roi,
      computed(() => ['#12:3']),
      () => search.value,
    )
    return { roi, load, search }
  }

  it('loads pages and appends the next one', async () => {
    api.getRoiLabels
      .mockResolvedValueOnce({ items: [{ label: 'a' }], hasMore: true })
      .mockResolvedValueOnce({ items: [{ label: 'b' }], hasMore: false })
    const { roi, load } = make()
    await load()
    expect(roi).toMatchObject({ hasMore: true, loaded: true })
    await load(true)
    expect(api.getRoiLabels).toHaveBeenLastCalledWith({
      projectRids: ['#12:3'],
      search: '',
      offset: 1,
    })
    expect(roi.items.map((i) => i.label)).toEqual(['a', 'b'])
    expect(roi.hasMore).toBe(false)
  })

  it('keeps the error in the ROI state when the search index is down', async () => {
    api.getRoiLabels.mockRejectedValue({ status: 502, message: 'Search index is down' })
    const { roi, load } = make()
    await load()
    expect(roi.error.status).toBe(502)
    expect(roi.items).toEqual([])
    expect(roi.loading).toBe(false)
  })

  it('ignores a slow answer for an older search', async () => {
    let resolveFirst
    api.getRoiLabels
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce({ items: [{ label: 'new' }], hasMore: false })
    const { roi, load, search } = make()
    const first = load()
    search.value = 'n'
    await load()
    resolveFirst({ items: [{ label: 'old' }], hasMore: false })
    await first
    expect(roi.items.map((i) => i.label)).toEqual(['new'])
  })
})
