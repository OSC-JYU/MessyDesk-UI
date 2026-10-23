import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/entities.js', () => ({
  getTagAdmin: vi.fn(),
  getEntityUsage: vi.fn(),
  renameEntity: vi.fn(),
  deleteEntity: vi.fn(),
  removeDeskTag: vi.fn(),
  importDeskTags: vi.fn(),
  getEntityTypes: vi.fn(),
  createEntityType: vi.fn(),
  deleteEntityType: vi.fn(),
  createEntity: vi.fn(),
}))
vi.mock('@/api/projects.js', () => ({ getProjects: vi.fn() }))

const api = await import('@/api/entities.js')
const { session } = await import('@/stores/session.js')
const { default: TagAdminDialog } = await import('@/features/tags/TagAdminDialog.vue')

const me = { rid: '#5:1', name: 'Ann' }
const items = [
  {
    rid: '#30:1',
    label: 'urgent',
    type: 'Tag',
    files: 4,
    creator: me,
    desks: [
      { rid: '#12:3', label: 'Archive' },
      { rid: '#12:4', label: 'Letters' },
    ],
  },
]

const body = () => document.body
const click = async (selector) => {
  body().querySelector(selector).click()
  await flushPromises()
}

async function mountAdmin(deskRid = '') {
  const wrapper = mount(TagAdminDialog, {
    props: { modelValue: true, deskRid },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  session.user = { rid: '#5:1' }
  api.getTagAdmin.mockResolvedValue({ total: 1, items })
  api.getEntityUsage.mockResolvedValue({
    rid: '#30:1',
    label: 'urgent',
    files: 4,
    desks: [
      { rid: '#12:3', label: 'Archive', files: 3 },
      { rid: '#12:4', label: 'Letters', files: 1 },
    ],
  })
})

afterEach(() => {
  document.body.innerHTML = ''
  session.user = null
})

describe('TagAdminDialog', () => {
  it('lists the desk\u2019s tags with remove and import, but not delete everywhere', async () => {
    await mountAdmin('#12:3')
    expect(api.getTagAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ projectRid: '#12:3', skip: 0, limit: 25 }),
    )
    expect(body().querySelectorAll('[data-test="admin-row"]')).toHaveLength(1)
    expect(body().textContent).toContain('Letters')
    expect(body().querySelector('[data-test="admin-remove"]')).toBeTruthy()
    expect(body().querySelector('[data-test="admin-import"]')).toBeTruthy()
    expect(body().querySelector('[data-test="admin-delete"]')).toBeNull()
    expect(body().textContent).not.toContain('Created by')
  })

  it('offers delete everywhere in the global view, and a creator column for other users', async () => {
    api.getTagAdmin.mockResolvedValue({
      total: 1,
      items: [{ ...items[0], creator: { rid: '#5:2', name: 'Bob' } }],
    })
    await mountAdmin('')
    expect(api.getTagAdmin).toHaveBeenCalledWith(expect.objectContaining({ projectRid: '' }))
    expect(body().querySelector('[data-test="admin-delete"]')).toBeTruthy()
    expect(body().querySelector('[data-test="admin-remove"]')).toBeNull()
    expect(body().querySelector('[data-test="admin-import"]')).toBeNull()
    expect(body().textContent).toContain('Created by')
    expect(body().textContent).toContain('Bob')
  })

  it('warns about the other desks before renaming and shows a name conflict', async () => {
    api.renameEntity.mockRejectedValue({
      status: 409,
      message: 'The desk "Letters" already has a tag "taken"',
    })
    await mountAdmin('#12:3')
    await click('[data-test="admin-rename"]')
    expect(api.getEntityUsage).toHaveBeenCalledWith('#30:1')
    expect(body().textContent).toContain('4 files')
    expect(body().textContent).toContain('every desk that has it')
    expect(body().textContent).toContain('Letters (1 file)')

    const input = [...body().querySelectorAll('input')].at(-1)
    expect(input).toBeTruthy()
    input.value = 'taken'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    await click('[data-test="confirm"]')
    expect(api.renameEntity).toHaveBeenCalledWith('#30:1', 'taken')
    expect(body().textContent).toContain('That name is already in use')
    expect(body().textContent).toContain('already has a tag "taken"')
  })

  it('removes a tag from the desk after the warning and reloads the list', async () => {
    api.removeDeskTag.mockResolvedValue({ deleted: false })
    const wrapper = await mountAdmin('#12:3')
    await click('[data-test="admin-remove"]')
    expect(body().textContent).toContain('3 files of this desk')
    expect(body().textContent).toContain('The tag stays in: Letters')
    await click('[data-test="confirm"]')
    expect(api.removeDeskTag).toHaveBeenCalledWith('#12:3', '#30:1')
    expect(api.getTagAdmin).toHaveBeenCalledTimes(2)
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })

  it('says delete everywhere cannot be undone', async () => {
    api.deleteEntity.mockResolvedValue({ deleted: true })
    await mountAdmin('')
    await click('[data-test="admin-delete"]')
    expect(body().textContent).toContain('This cannot be undone.')
    expect(body().textContent).toContain('Archive (3 files), Letters (1 file)')
    await click('[data-test="confirm"]')
    expect(api.deleteEntity).toHaveBeenCalledWith('#30:1')
  })

  it('shows a load error with a retry', async () => {
    api.getTagAdmin.mockRejectedValueOnce({ status: 500, message: 'boom' })
    await mountAdmin('#12:3')
    expect(body().textContent).toContain('boom')
    await click('[data-test="retry"]')
    expect(body().querySelectorAll('[data-test="admin-row"]')).toHaveLength(1)
  })

  it('opens the tag types and reloads the table after a change', async () => {
    api.getEntityTypes.mockResolvedValue([{ type: 'Tag', label: 'Tag', count: 1, protected: true }])
    api.createEntityType.mockResolvedValue({})
    const wrapper = await mountAdmin('#12:3')
    await click('[data-test="admin-types"]')
    expect(api.getEntityTypes).toHaveBeenCalledWith({ counts: true })
    const input = [...body().querySelectorAll('input')].find(
      (i) => i.type === 'text' && i.maxLength === 40,
    )
    input.value = 'Mood'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    await click('[data-test="type-add"]')
    expect(api.createEntityType).toHaveBeenCalledWith('Mood', 'blue-grey')
    expect(api.getTagAdmin).toHaveBeenCalledTimes(2)
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })
})
