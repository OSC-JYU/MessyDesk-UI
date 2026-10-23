import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/entities.js', () => ({
  getEntityTypes: vi.fn(),
  createEntityType: vi.fn(),
  deleteEntityType: vi.fn(),
}))

const api = await import('@/api/entities.js')
const { default: TagTypesDialog } = await import('@/features/tags/TagTypesDialog.vue')

const types = [
  { type: 'Tag', label: 'Tag', color: '#112233', count: 5, protected: true },
  { type: 'Person', label: 'Person', color: '#223344', count: 3 },
  { type: 'Mood', label: 'Mood', color: '#334455', count: 0 },
]

const body = () => document.body
const click = async (selector) => {
  body().querySelector(selector).click()
  await flushPromises()
}
const rows = () => [...body().querySelectorAll('[data-test="type-row"]')]
const rowOf = (name) => rows().find((row) => row.textContent.includes(name))

async function mountTypes() {
  const wrapper = mount(TagTypesDialog, { props: { modelValue: true }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  api.getEntityTypes.mockResolvedValue(types)
})
afterEach(() => (document.body.innerHTML = ''))

describe('TagTypesDialog', () => {
  it('lists types with counts across all desks', async () => {
    await mountTypes()
    expect(api.getEntityTypes).toHaveBeenCalledWith({ counts: true })
    expect(rows()).toHaveLength(3)
    expect(body().textContent).toContain('all desks')
    expect(rowOf('Person').textContent).toContain('3')
  })

  it('offers no delete for Tag and disables it for a type with tags', async () => {
    await mountTypes()
    expect(rowOf('Tag').querySelector('[data-test="type-delete"]')).toBeNull()
    expect(rowOf('Tag').querySelector('[data-test="type-protected"]')).toBeTruthy()
    expect(rowOf('Person').querySelector('[data-test="type-delete"]').disabled).toBe(true)
    expect(rowOf('Mood').querySelector('[data-test="type-delete"]').disabled).toBe(false)
  })

  it('confirms before deleting an empty type and tells the parent', async () => {
    api.deleteEntityType.mockResolvedValue({ deleted: true })
    const wrapper = await mountTypes()
    rowOf('Mood').querySelector('[data-test="type-delete"]').click()
    await flushPromises()
    expect(api.deleteEntityType).not.toHaveBeenCalled()
    expect(body().textContent).toContain('Delete tag type')
    await click('[data-test="confirm"]')
    expect(api.deleteEntityType).toHaveBeenCalledWith('Mood')
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })

  it('shows the backend message when adding a type fails', async () => {
    api.createEntityType.mockRejectedValue({ status: 409, message: 'The type already exists' })
    await mountTypes()
    expect(body().querySelector('[data-test="type-add"]').disabled).toBe(true)
    const input = [...body().querySelectorAll('input')].find((i) => i.maxLength === 40)
    input.value = 'tag'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    await click('[data-test="type-add"]')
    expect(api.createEntityType).toHaveBeenCalledWith('tag', 'blue-grey')
    expect(body().textContent).toContain('The type already exists')
  })
})
