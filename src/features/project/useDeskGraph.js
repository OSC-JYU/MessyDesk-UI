import { onMounted, onUnmounted, reactive } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { getProject, setProjectAttribute } from '@/api/projects.js'
import {
  EMPTY_DESK_ID,
  isThumbnailUpdate,
  layoutLeftToRight,
  mergeNodeFields,
  nodesFromAddEvent,
  toFlowGraph,
} from './graphModel.js'
import { relatives } from './nodeKinds.js'

// The graph of one desk: loading and laying it out, live updates from
// server events (window 'md-sse', dispatched by services/events.js), and
// the isolate / hide-processes views.
export function useDeskGraph(workspace, { onThumbnailsChanged } = {}) {
  const flow = useVueFlow()
  const graph = reactive({
    nodes: [],
    edges: [],
    loading: false,
    error: null,
    isolated: false,
    compact: false,
  })
  let focusAfterLayout = null

  function relayout() {
    graph.nodes = layoutLeftToRight(graph.nodes, graph.edges)
  }

  async function load() {
    graph.loading = true
    graph.error = null
    try {
      const { nodes, edges } = toFlowGraph(await getProject(workspace.state.deskRid))
      graph.nodes = layoutLeftToRight(nodes, edges)
      graph.edges = edges
      graph.isolated = false
      graph.compact = false
      focusAfterLayout = workspace.state.focusId
      workspace.state.focusId = null
    } catch (error) {
      graph.error = error
    } finally {
      graph.loading = false
    }
  }

  function fitTo(id, padding = 5) {
    const node = graph.nodes.find((n) => n.id === id)
    if (node) workspace.select(node)
    flow.fitView({ nodes: [id], duration: 800, padding })
  }

  flow.onNodesInitialized(() => {
    if (focusAfterLayout) fitTo(focusAfterLayout)
    else flow.fitView()
    focusAfterLayout = null
  })

  // Positions are snapped to a 100 px grid and saved on the node.
  flow.onNodeDragStop(({ node }) => {
    if (!node) return
    workspace.select(node)
    const position = {
      x: Math.round(node.position.x / 100) * 100,
      y: Math.round(node.position.y / 100) * 100,
    }
    setProjectAttribute(node.id, { key: 'position', value: position }).catch(() => {})
  })

  function randomPosition() {
    const { width = 800, height = 600 } = flow.dimensions.value || {}
    return { x: Math.random() * width, y: Math.random() * height }
  }

  function updateNode(rid, fields) {
    if (!fields) return
    const update = { ...fields }
    if (isThumbnailUpdate(update) && update.thumbnail_version === undefined)
      update.thumbnail_version = Date.now()
    const node = graph.nodes.find((n) => n.id === rid)
    if (node?.data && mergeNodeFields(node.data, update)) {
      node.data = { ...node.data }
      flow.updateNodeData(rid, { ...node.data })
    }
    if (isThumbnailUpdate(update)) onThumbnailsChanged?.(rid, update)
  }

  function addFromEvent(event) {
    // Files uploaded into a set are not drawn on the desk.
    if (event.set) return
    graph.nodes = graph.nodes.filter((n) => n.id !== EMPTY_DESK_ID)
    const added = nodesFromAddEvent(event, randomPosition)
    graph.nodes.push(...added.nodes)
    graph.edges.push(...added.edges)
    relayout()
    focusAfterLayout = added.id
    if (event.process) updateNode(event.process['@rid'], event.process)
  }

  function onEvent({ detail: event }) {
    switch (event?.command) {
      case 'add':
      case 'add_and_finish':
        addFromEvent(event)
        break
      case 'update':
        updateNode(event.target, event.node)
        break
      case 'process_update':
      case 'process_finished':
        if (event.process) updateNode(event.process['@rid'], event.process)
        if (event.set) updateNode(event.set['@rid'], event.set)
        break
    }
  }

  // Isolate: show only the selected node and everything connected to it.
  function toggleIsolate() {
    graph.isolated = !graph.isolated
    const selected = workspace.state.selected
    if (graph.isolated && selected) {
      const node = flow.findNode(selected.id)
      const keep = new Set([
        selected.id,
        ...[...relatives(node, flow.getIncomers), ...relatives(node, flow.getOutgoers)].map(
          (n) => n.id,
        ),
      ])
      for (const n of graph.nodes) flow.updateNode(n.id, { hidden: !keep.has(n.id) })
      flow.fitView({ nodes: [selected.id], duration: 800, padding: 5 })
    } else {
      graph.isolated = false
      for (const n of graph.nodes) flow.updateNode(n.id, { hidden: false })
      flow.fitView({ duration: 800 })
    }
  }

  // Hide processes: connect each process's input straight to its outputs.
  function toggleProcesses() {
    if (graph.compact) {
      load()
      return
    }
    const shortcuts = []
    for (const node of graph.nodes.filter((n) => n.type === 'process')) {
      const input = flow.getIncomers(node)[0]
      if (input)
        for (const child of flow.getOutgoers(node))
          shortcuts.push({ id: `${input.id}=>${child.id}`, source: input.id, target: child.id })
      flow.updateNode(node.id, { hidden: true })
    }
    graph.edges.push(...shortcuts)
    graph.compact = true
    relayout()
  }

  onMounted(() => window.addEventListener('md-sse', onEvent))
  onUnmounted(() => window.removeEventListener('md-sse', onEvent))

  return { graph, flow, load, fitTo, toggleIsolate, toggleProcesses }
}
