import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/api/entities.js', () => ({
  getTagAdmin: vi.fn(),
  getEntityUsage: vi.fn(),
  renameEntity: vi.fn(),
  deleteEntity: vi.fn(),
  removeDeskTag: vi.fn(),
  importDeskTags: vi.fn(),
}))
vi.mock('@/api/projects.js', () => ({ getProjects: vi.fn() }))

const api = await import('@/api/entities.js')
const { getProjects } = await import('@/api/projects.js')
const { ADMIN_PAGE_SIZE, useTagAction, useTagAdmin } =
  await import('@/features/tags/useTagAdmin.js')
const { useTagImport } = await import('@/features/tags/useTagImport.js')

const tag = { rid: '#30:1', label: 'urgent' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('useTagAdmin', () => {
  it('loads a page of the desk\u2019s tags', async () => {
    api.getTagAdmin.mockResolvedValue({ total: 60, items: [tag] })
    const { state, load } = useTagAdmin(ref('#12:3'))
    state.page = 2
    await load()
    expect(api.getTagAdmin).toHaveBeenCalledWith({
      projectRid: '#12:3',
      search: '',
      skip: ADMIN_PAGE_SIZE,
      limit: ADMIN_PAGE_SIZE,
    })
    expect(state.items).toEqual([tag])
    expect(state.total).toBe(60)
  })

  it('keeps the error and an empty list when loading fails', async () => {
    api.getTagAdmin.mockRejectedValue({ status: 500, message: 'down' })
    const { state, load } = useTagAdmin(ref(''))
    await load()
    expect(state.error.message).toBe('down')
    expect(state.items).toEqual([])
    expect(state.loading).toBe(false)
  })

  it('searches from the first page after a pause', async () => {
    vi.useFakeTimers()
    api.getTagAdmin.mockResolvedValue({ total: 0, items: [] })
    const { state } = useTagAdmin(ref(''))
    state.page = 3
    await nextTick()
    state.search = 'ur'
    await nextTick()
    await vi.advanceTimersByTimeAsync(350)
    expect(state.page).toBe(1)
    expect(api.getTagAdmin).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'ur', skip: 0 }),
    )
  })
})

describe('useTagAction', () => {
  const usage = { rid: '#30:1', label: 'urgent', files: 2, desks: [] }

  it('fetches the usage before anything is confirmed', async () => {
    api.getEntityUsage.mockResolvedValue(usage)
    const { state, begin } = useTagAction(ref('#12:3'))
    const started = begin('rename', tag)
    expect(state).toMatchObject({ open: true, loading: true, label: 'urgent' })
    await started
    expect(api.getEntityUsage).toHaveBeenCalledWith('#30:1')
    expect(state.usage).toEqual(usage)
    expect(state.loading).toBe(false)
  })

  it('renames, closes and tells the table to reload', async () => {
    api.getEntityUsage.mockResolvedValue(usage)
    api.renameEntity.mockResolvedValue({})
    const done = vi.fn()
    const { state, begin, confirm } = useTagAction(ref('#12:3'), done)
    await begin('rename', tag)
    state.label = ' Urgent! '
    await confirm()
    expect(api.renameEntity).toHaveBeenCalledWith('#30:1', 'Urgent!')
    expect(state.open).toBe(false)
    expect(done).toHaveBeenCalled()
  })

  it('does not rename to the same or an empty name', async () => {
    api.getEntityUsage.mockResolvedValue(usage)
    const { state, begin, confirm, unchanged } = useTagAction(ref('#12:3'))
    await begin('rename', tag)
    expect(unchanged()).toBe(true)
    await confirm()
    state.label = '  '
    await confirm()
    expect(api.renameEntity).not.toHaveBeenCalled()
  })

  it('keeps the dialog open and marks a 409 as a name conflict', async () => {
    api.getEntityUsage.mockResolvedValue(usage)
    api.renameEntity.mockRejectedValue({
      status: 409,
      message: 'The desk "A" already has a tag "x"',
    })
    const done = vi.fn()
    const { state, begin, confirm } = useTagAction(ref('#12:3'), done)
    await begin('rename', tag)
    state.label = 'x'
    await confirm()
    expect(state.open).toBe(true)
    expect(state.conflict).toBe(true)
    expect(state.error.message).toContain('already has a tag')
    expect(done).not.toHaveBeenCalled()
    expect(state.pending).toBe(false)
  })

  it('removes the tag from this desk, and deletes it everywhere', async () => {
    api.getEntityUsage.mockResolvedValue(usage)
    api.removeDeskTag.mockResolvedValue({})
    api.deleteEntity.mockResolvedValue({})
    const { begin, confirm } = useTagAction(ref('#12:3'))
    await begin('remove', tag)
    await confirm()
    expect(api.removeDeskTag).toHaveBeenCalledWith('#12:3', '#30:1')
    await begin('delete', tag)
    await confirm()
    expect(api.deleteEntity).toHaveBeenCalledWith('#30:1')
  })

  it('shows a failed usage lookup instead of the warning', async () => {
    api.getEntityUsage.mockRejectedValue({ status: 404, message: 'Not found' })
    const { state, begin } = useTagAction(ref('#12:3'))
    await begin('delete', tag)
    expect(state.usage).toBeNull()
    expect(state.error.message).toBe('Not found')
  })
})

describe('useTagImport', () => {
  const projects = [
    { '@rid': '#12:3', label: 'Archive' },
    { '@rid': '#12:4', label: 'Letters' },
  ]
  const letters = {
    total: 2,
    items: [
      { rid: '#30:1', label: 'urgent', desks: [{ rid: '#12:4', label: 'Letters' }] },
      {
        rid: '#30:2',
        label: 'shared',
        desks: [
          { rid: '#12:4', label: 'Letters' },
          { rid: '#12:3', label: 'Archive' },
        ],
      },
    ],
  }

  it('offers the other desks and lists a desk\u2019s tags, with shared ones not pickable', async () => {
    getProjects.mockResolvedValue(projects)
    api.getTagAdmin.mockResolvedValue(letters)
    const imp = useTagImport(ref('#12:3'))
    await imp.reset()
    expect(imp.state.desks).toEqual([{ value: '#12:4', title: 'Letters' }])
    imp.state.from = '#12:4'
    await flushPromises()
    expect(api.getTagAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ projectRid: '#12:4', skip: 0 }),
    )
    expect(imp.pickable.value.map((t) => t.label)).toEqual(['urgent'])
    expect(imp.hasTag(letters.items[1])).toBe(true)
  })

  it('imports the selected tags and shows imported, skipped and conflicts', async () => {
    getProjects.mockResolvedValue(projects)
    api.getTagAdmin.mockResolvedValue(letters)
    api.importDeskTags.mockResolvedValue({
      imported: 1,
      skipped: 0,
      conflicts: [{ rid: '#30:9', label: 'clash' }],
    })
    const done = vi.fn()
    const imp = useTagImport(ref('#12:3'), done)
    await imp.reset()
    imp.state.from = '#12:4'
    await flushPromises()
    imp.toggle(letters.items[0])
    await imp.importSelected()
    expect(api.importDeskTags).toHaveBeenCalledWith('#12:3', { entity_rids: ['#30:1'] })
    expect(imp.state.result.conflicts).toHaveLength(1)
    expect(imp.state.selected).toEqual([])
    expect(done).toHaveBeenCalled()
  })

  it('imports every tag of the desk in one call', async () => {
    getProjects.mockResolvedValue(projects)
    api.getTagAdmin.mockResolvedValue(letters)
    api.importDeskTags.mockResolvedValue({ imported: 2, skipped: 0, conflicts: [] })
    const imp = useTagImport(ref('#12:3'))
    await imp.reset()
    imp.state.from = '#12:4'
    await flushPromises()
    await imp.importAll()
    expect(api.importDeskTags).toHaveBeenCalledWith('#12:3', { from_project_rid: '#12:4' })
  })

  it('pages the other desk\u2019s tags', async () => {
    getProjects.mockResolvedValue(projects)
    api.getTagAdmin
      .mockResolvedValueOnce({ total: 3, items: [letters.items[0]] })
      .mockResolvedValueOnce({ total: 3, items: [letters.items[1]] })
    const imp = useTagImport(ref('#12:3'))
    await imp.reset()
    imp.state.from = '#12:4'
    await flushPromises()
    await imp.load(true)
    expect(api.getTagAdmin).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 1 }))
    expect(imp.state.items).toHaveLength(2)
  })
})
