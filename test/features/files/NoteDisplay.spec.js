import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const saved = []
vi.mock('@/api/files.js', () => ({
  getNodeFile: async () => 'first',
  createFileVersion: async (rid, payload) => (saved.push([rid, payload.content]), {}),
}))

const { default: NoteDisplay } = await import('@/features/files/displays/NoteDisplay.vue')

describe('NoteDisplay', () => {
  it('saves a changed note when the viewer leaves it, and not an unchanged one', async () => {
    const file = { '@rid': '#5:1', type: 'text', note: true }
    const wrapper = mount(NoteDisplay, { props: { file } })
    await flushPromises()
    expect(wrapper.text()).toContain('Saved')
    wrapper.unmount()
    expect(saved).toEqual([])

    const edited = mount(NoteDisplay, { props: { file } })
    await flushPromises()
    await edited.find('textarea').setValue('second')
    expect(edited.text()).toContain('Not saved yet')
    edited.unmount()
    expect(saved).toEqual([['#5:1', 'second']])
  })

  it('saves at once with the Save button and shows that it is saved', async () => {
    saved.length = 0
    const wrapper = mount(NoteDisplay, { props: { file: { '@rid': '#5:2', note: true } } })
    await flushPromises()
    await wrapper.find('textarea').setValue('third')
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(saved).toEqual([['#5:2', 'third']])
    expect(wrapper.text()).toContain('Saved')
    wrapper.unmount()
    expect(saved).toHaveLength(1)
  })
})
