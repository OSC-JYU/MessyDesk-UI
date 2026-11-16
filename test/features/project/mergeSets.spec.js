import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

const merged = []
vi.mock('@/api/projects.js', () => ({
  mergeSets: async (rids, label) => (
    merged.push([rids, label]),
    { output_set: { '@rid': '#9:1' } }
  ),
}))

const { createWorkspace } = await import('@/features/project/useWorkspace.js')
const { default: MergeSetsPanel } = await import('@/features/project/panel/MergeSetsPanel.vue')

const set = (id, count, types = ['image']) => ({
  id,
  type: 'set',
  data: { label: `Set ${id}`, count, types },
})

function open(workspaceSetup) {
  let workspace
  const Host = defineComponent({
    setup() {
      workspace = createWorkspace('#1:0')
      workspaceSetup(workspace)
      return () => h(MergeSetsPanel)
    },
  })
  const wrapper = mount(Host)
  return { wrapper, workspace }
}

describe('merging sets', () => {
  it('shift-click picks sets, a second shift-click takes one out again', () => {
    const { workspace } = open(() => {})
    workspace.select(set('#5:1', 3))
    workspace.toggleSet(set('#5:2', 4))
    expect(workspace.state.selectedSets.map((n) => n.id)).toEqual(['#5:1', '#5:2'])
    workspace.toggleSet(set('#5:2', 4))
    expect(workspace.state.selectedSets.map((n) => n.id)).toEqual(['#5:1'])
    workspace.select(null)
    expect(workspace.state.selectedSets).toEqual([])
  })

  it('merges the picked sets with the typed name', async () => {
    const { wrapper, workspace } = open((ws) => {
      ws.startMerge(set('#5:1', 3))
      ws.toggleSet(set('#5:2', 4))
    })
    expect(wrapper.text()).toContain('Up to 7 files')
    await wrapper.find('input').setValue('Both')
    const button = wrapper.findAll('button').find((b) => b.text() === 'Merge')
    await button.trigger('click')
    await flushPromises()
    expect(merged).toEqual([[['#5:1', '#5:2'], 'Both']])
    expect(workspace.state.selectedSets).toEqual([])
  })

  it('does not offer a merge of different kinds of files', () => {
    const { wrapper } = open((ws) => {
      ws.startMerge(set('#5:1', 3, ['image']))
      ws.toggleSet(set('#5:2', 4, ['text']))
    })
    expect(wrapper.text()).toContain('different kinds of files')
    expect(
      wrapper
        .findAll('button')
        .find((b) => b.text() === 'Merge')
        .attributes('disabled'),
    ).toBeDefined()
  })
})
