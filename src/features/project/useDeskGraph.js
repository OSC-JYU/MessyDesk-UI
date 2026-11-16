import { nextTick, onMounted, onUnmounted, reactive } from 'vue'
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

const PROCESS_TYPES = new Set(['process', 'setprocess', 'filter'])

// The graph of one desk: loading and laying it out, live updates from
// server events (window 'md-sse', dispatched by services/events.js), and
// the isolate / hide-processes views.
export function useDeskGraph(workspace, { onThumbnailsChanged, onSetContentChanged } = {}) {
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
  const collapsed = new Set()

  async function load() {
    graph.loading = true
    graph.error = null
    try {
      const { nodes, edges } = toFlowGraph(await getProject(workspace.state.deskRid))
      graph.nodes = layoutLeftToRight(nodes, edges)
      graph.edges = edges
      graph.isolated = false
      graph.compact = false
      collapsed.clear()
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
    if (event.set) return onSetContentChanged?.()
    graph.nodes = graph.nodes.filter((n) => n.id !== EMPTY_DESK_ID)
    const added = nodesFromAddEvent(event, randomPosition)
    graph.nodes.push(...added.nodes)
    // Vue Flow drops an edge whose nodes it does not have yet, so the edges
    // go in once it has taken the new nodes. The layout counts them already.
    const edges = added.edges
    graph.nodes = layoutLeftToRight(graph.nodes, [...graph.edges, ...edges])
    nextTick(() => (graph.edges = [...graph.edges, ...edges]))
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
      // Deletes finish in the background (backend decision G5): the desk is reloaded when one
      // ends, so the node's children go too, or the node comes back if the delete failed.
      case 'delete_finished':
      case 'delete_failed':
        load()
        break
      case 'process_update':
      case 'process_finished':
        if (event.process) updateNode(event.process['@rid'], event.process)
        if (event.set) updateNode(event.set['@rid'], event.set)
        onSetContentChanged?.()
        break
    }
  }

  // Hidden flags go on the graph's own nodes (not only on Vue Flow's copies), so a new layout
  // cannot bring hidden nodes back. Processes hidden by "Hide processes" stay hidden always.
  function setHidden(isHidden) {
    graph.nodes = graph.nodes.map((n) => ({ ...n, hidden: collapsed.has(n.id) || isHidden(n) }))
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
      setHidden((n) => !keep.has(n.id))
      nextTick(() => flow.fitView({ nodes: [selected.id], duration: 800, padding: 5 }))
    } else {
      graph.isolated = false
      setHidden(() => false)
      nextTick(() => flow.fitView({ duration: 800 }))
    }
  }

  // A Solr process has no output node: when processes are hidden it stays as a magnifying glass.
  const isSolrLeaf = (node) =>
    /solr/i.test(`${node.data.service || ''} ${node.data.label || ''}`) &&
    !flow.getOutgoers(flow.findNode(node.id)).length

  // Hide processes: connect each process's input straight to its outputs, and write the process
  // title on top of each output.
  function toggleProcesses() {
    graph.isolated = false
    if (graph.compact) {
      collapsed.clear()
      const nodes = graph.nodes.map((n) => {
        const data = { ...n.data }
        const type = data.origType || n.type
        delete data.via
        delete data.origType
        return { ...n, type, data, hidden: false }
      })
      const edges = graph.edges.filter((e) => !String(e.id).includes('=>'))
      graph.nodes = layoutLeftToRight(nodes, edges)
      graph.edges = edges
      graph.compact = false
      nextTick(() => flow.fitView({ duration: 800 }))
      return
    }
    const processes = graph.nodes.filter((n) => PROCESS_TYPES.has(n.type))
    const solr = new Set(processes.filter(isSolrLeaf).map((n) => n.id))
    for (const n of processes) if (!solr.has(n.id)) collapsed.add(n.id)
    const shortcuts = []
    const via = new Map()
    for (const id of collapsed) {
      const node = flow.findNode(id)
      const process = graph.nodes.find((n) => n.id === id)
      for (const child of flow.getOutgoers(node)) {
        via.set(child.id, { label: process.data.label, error: Boolean(process.data.error) })
        for (const input of flow.getIncomers(node))
          shortcuts.push({ id: `${input.id}=>${child.id}`, source: input.id, target: child.id })
      }
    }
    const visible = graph.nodes.filter((n) => !collapsed.has(n.id))
    const visibleEdges = [...graph.edges, ...shortcuts].filter(
      (e) => !collapsed.has(e.source) && !collapsed.has(e.target),
    )
    const placed = new Map(layoutLeftToRight(visible, visibleEdges).map((n) => [n.id, n]))
    graph.nodes = graph.nodes.map((n) => {
      const shown = placed.get(n.id)
      if (!shown) return { ...n, hidden: true }
      if (solr.has(n.id))
        return { ...shown, type: 'search-set', data: { ...shown.data, origType: n.type } }
      return via.has(n.id) ? { ...shown, data: { ...shown.data, via: via.get(n.id) } } : shown
    })
    graph.edges = [...graph.edges, ...shortcuts]
    graph.compact = true
    nextTick(() => flow.fitView({ duration: 800 }))
  }

  onMounted(() => window.addEventListener('md-sse', onEvent))
  onUnmounted(() => window.removeEventListener('md-sse', onEvent))

  return { graph, flow, load, fitTo, toggleIsolate, toggleProcesses }
}
