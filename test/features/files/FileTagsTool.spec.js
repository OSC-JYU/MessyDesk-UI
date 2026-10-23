import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/entities.js', () => ({
  createEntity: vi.fn(),
  getEntities: vi.fn(),
  getEntitiesByType: vi.fn(),
  linkEntityToItem: vi.fn(),
  unLinkEntity: vi.fn(),
}))
vi.mock('@/api/files.js', () => ({ getDocInfo: vi.fn() }))

const api = await import('@/api/entities.js')
const { default: FileTagsTool } = await import('@/features/files/tools/FileTagsTool.vue')

const file = {
  '@rid': '#50:1',
  entities: [
    { rid: '#30:1', label: 'urgent', tagged_by: [{ rid: '#5:1', name: 'Ann' }] },
    { rid: '#40:1', label: 'cat', tagged_by: [] },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  api.getEntities.mockResolvedValue([{ type: 'Tag', count: 1 }])
  api.getEntitiesByType.mockResolvedValue({ total: 0, items: [] })
})

describe('FileTagsTool', () => {
  it('suggests the desk\u2019s human tags', async () => {
    mount(FileTagsTool, { props: { file, deskRid: '12:3' } })
    await flushPromises()
    expect(api.getEntities).toHaveBeenCalledWith({ projectRid: '12:3', createdBy: 'user' })
  })

  it('only attaches existing tags: new tags are made in Tag admin', async () => {
    const wrapper = mount(FileTagsTool, { props: { file, deskRid: '12:3' } })
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(false)
    expect(api.createEntity).not.toHaveBeenCalled()
  })

  it('lists all human tags outside a desk', async () => {
    mount(FileTagsTool, { props: { file } })
    await flushPromises()
    expect(api.getEntities).toHaveBeenCalledWith({ projectRid: '', createdBy: 'user' })
  })
})
