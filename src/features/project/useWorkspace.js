import { inject, provide, reactive } from 'vue'

const KEY = Symbol('workspace')

// State and actions of one open desk, shared by the graph, the node panel,
// the nodes and the dialogs (provided by ProjectWorkspace). Dialogs are
// opened through these actions instead of global flags.
export function createWorkspace(deskRid) {
  const ws = reactive({
    deskRid,
    desk: null, // the desk's own node, when known
    selected: null, // the selected Vue Flow node
    reloadToken: 0, // bump to reload the graph
    focusId: null, // node to fit into view after the next load
    fitRequest: null, // { id } to fit a node into view now
    dialogs: {
      crunchers: { open: false, node: null, filter: '' },
      deleteNode: { open: false, node: null },
      createSet: { open: false },
      createSource: { open: false, type: '' },
      upload: { request: 0 }, // bump to pick a file for the desk
      setUpload: { request: 0, set: null }, // bump to pick files for a set
    },
    drawerOpen: false,
  })

  const actions = {
    select(node) {
      ws.selected = node
    },
    reload(focusId = null) {
      ws.focusId = focusId
      ws.reloadToken++
    },
    fitTo(id) {
      ws.fitRequest = { id, at: Date.now() }
    },
    openCrunchers(node, filter = '') {
      ws.selected = node
      Object.assign(ws.dialogs.crunchers, { open: true, node, filter })
    },
    askDelete(node) {
      Object.assign(ws.dialogs.deleteNode, { open: true, node })
    },
    openCreateSet() {
      ws.dialogs.createSet.open = true
    },
    openCreateSource(type) {
      Object.assign(ws.dialogs.createSource, { open: true, type })
    },
    uploadToDesk() {
      ws.dialogs.upload.request++
    },
    uploadToSet(set) {
      ws.dialogs.setUpload.set = set
      ws.dialogs.setUpload.request++
    },
  }

  const workspace = { state: ws, ...actions }
  provide(KEY, workspace)
  return workspace
}

export function useWorkspace() {
  const workspace = inject(KEY, null)
  if (!workspace) throw new Error('useWorkspace() needs a ProjectWorkspace above it')
  return workspace
}
