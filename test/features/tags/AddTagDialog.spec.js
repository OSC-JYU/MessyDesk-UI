import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/entities.js', () => ({ createEntity: vi.fn(), getEntityTypes: vi.fn() }))
vi.mock('@/api/projects.js', () => ({ getProjects: vi.fn() }))

const api = await import('@/api/entities.js')
const { getProjects } = await import('@/api/projects.js')
const { default: AddTagDialog } = await import('@/features/tags/AddTagDialog.vue')

const body = () => document.body
const submitButton = () => body().querySelector('button[type="submit"]')

async function mountDialog(props = { deskRid: '#12:3' }) {
  const wrapper = mount(AddTagDialog, {
    props: { modelValue: false, ...props },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

async function typeLabel(text) {
  const input = [...body().querySelectorAll('input')].filter((i) => i.type === 'text').at(-1)
  input.value = text
  input.dispatchEvent(new Event('input'))
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  api.getEntityTypes.mockResolvedValue([
    { type: 'Person', label: 'Person' },
    { type: 'Tag', label: 'Tag' },
  ])
  getProjects.mockResolvedValue([{ '@rid': '#12:3', label: 'Archive' }])
})
afterEach(() => (document.body.innerHTML = ''))

describe('AddTagDialog', () => {
  it('starts with the type Tag and creates only when a label is given', async () => {
    api.createEntity.mockResolvedValue({})
    const wrapper = await mountDialog()
    expect(body().textContent).toContain('Tag')
    expect(submitButton().disabled).toBe(true)
    await typeLabel('urgent')
    expect(submitButton().disabled).toBe(false)
    submitButton().click()
    await flushPromises()
    expect(api.createEntity).toHaveBeenCalledWith('Tag', 'urgent', '#12:3')
    expect(wrapper.emitted('created')).toHaveLength(1)
  })

  it('starts with the first type when the user has no Tag type', async () => {
    api.getEntityTypes.mockResolvedValue([{ type: 'Person', label: 'Person' }])
    api.createEntity.mockResolvedValue({})
    await mountDialog()
    await typeLabel('Ann')
    submitButton().click()
    await flushPromises()
    expect(api.createEntity).toHaveBeenCalledWith('Person', 'Ann', '#12:3')
  })

  it('needs a desk in the global view', async () => {
    await mountDialog({ deskRid: '' })
    await typeLabel('urgent')
    expect(submitButton().disabled).toBe(true)
  })

  it('shows the error of a rejected type', async () => {
    api.createEntity.mockRejectedValue({ status: 400, message: 'Unknown type' })
    await mountDialog()
    await typeLabel('urgent')
    submitButton().click()
    await flushPromises()
    expect(body().textContent).toContain('Unknown type')
  })
})
