import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({ mergeEntities: vi.fn() }))
vi.mock('@/api/entities.js', () => api)

import TagMergeDialog from '@/features/tags/TagMergeDialog.vue'

const tags = [
  { rid: '#7:1', label: 'Anger', type: 'Tag' },
  { rid: '#7:2', label: 'Wrath', type: 'Tag' },
]
const preview = {
  target: { rid: '#7:1', label: 'Anger' },
  sources: [{ rid: '#7:2', label: 'Wrath' }],
  desks: [{ rid: '#1:0', label: 'Desk A' }],
  links: 5,
  duplicates: 2,
}

async function open(props = {}) {
  const wrapper = mount(TagMergeDialog, {
    props: { modelValue: false, tags, ...props },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}
const body = () => document.body.textContent

describe('TagMergeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    api.mergeEntities.mockResolvedValue(preview)
  })

  it('previews the effect with a dry run before anything is merged', async () => {
    const wrapper = await open()
    expect(api.mergeEntities).toHaveBeenCalledTimes(1)
    expect(api.mergeEntities).toHaveBeenCalledWith('#7:1', ['#7:2'], true)
    expect(body()).toContain('"Wrath" will be deleted and merged into "Anger"')
    expect(body()).toContain('5 tag links move')
    expect(body()).toContain('2 that the kept tag already has are not doubled')
    expect(body()).toContain('Desk A')
    expect(body()).toContain('cannot be undone')
    wrapper.unmount()
  })

  it('merges for real on confirm and says so', async () => {
    const wrapper = await open()
    document.querySelector('[data-test="confirm"]').click()
    await flushPromises()
    expect(api.mergeEntities).toHaveBeenLastCalledWith('#7:1', ['#7:2'])
    expect(wrapper.emitted('merged')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
    wrapper.unmount()
  })

  it('refuses tags of different types', async () => {
    const wrapper = await open({
      tags: [tags[0], { rid: '#7:9', label: 'Paris', type: 'Location' }],
    })
    expect(api.mergeEntities).not.toHaveBeenCalled()
    expect(body()).toContain('Only tags of one type can be merged.')
    expect(document.querySelector('[data-test="confirm"]').disabled).toBe(true)
    wrapper.unmount()
  })

  it('shows the server error and does not close', async () => {
    api.mergeEntities.mockResolvedValueOnce(preview).mockRejectedValueOnce({
      response: { data: { message: 'Tag not found' } },
    })
    const wrapper = await open()
    document.querySelector('[data-test="confirm"]').click()
    await flushPromises()
    expect(body()).toContain('Tag not found')
    expect(wrapper.emitted('merged')).toBeUndefined()
    wrapper.unmount()
  })
})
