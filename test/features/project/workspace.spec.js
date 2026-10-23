import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createWorkspace, useWorkspace } from '@/features/project/useWorkspace.js'

function withWorkspace() {
  let workspace
  let seen
  const Child = defineComponent({
    setup() {
      seen = useWorkspace()
      return () => h('div')
    },
  })
  mount(
    defineComponent({
      setup() {
        workspace = createWorkspace('#1:0')
        return () => h(Child)
      },
    }),
  )
  return { workspace, seen }
}

describe('workspace', () => {
  it('is shared with components below it', () => {
    const { workspace, seen } = withWorkspace()
    expect(seen).toBe(workspace)
    expect(workspace.state.deskRid).toBe('#1:0')
  })

  it('opens dialogs through actions', () => {
    const { workspace } = withWorkspace()
    const node = { id: '#5:0' }
    workspace.openCrunchers(node, 'ROI')
    expect(workspace.state.dialogs.crunchers).toEqual({ open: true, node, filter: 'ROI' })
    expect(workspace.state.selected).toEqual(node)
    workspace.askDelete(node)
    expect(workspace.state.dialogs.deleteNode.open).toBe(true)
    workspace.openCreateSource('nextcloud')
    expect(workspace.state.dialogs.createSource).toEqual({ open: true, type: 'nextcloud' })
    workspace.uploadToSet(node)
    expect(workspace.state.dialogs.setUpload).toEqual({ request: 1, set: node })
  })

  it('reloads with a node to focus', () => {
    const { workspace } = withWorkspace()
    workspace.reload('#9:0')
    expect(workspace.state.reloadToken).toBe(1)
    expect(workspace.state.focusId).toBe('#9:0')
  })

  it('needs a workspace above', () => {
    expect(() => mount(defineComponent({ setup: () => (useWorkspace(), () => h('div')) }))).toThrow(
      /ProjectWorkspace/,
    )
  })
})
