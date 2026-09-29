import dagre from 'dagre'
import { nodeTypeFor } from './nodes/index.js'

// Turning the project graph from the API into Vue Flow nodes and edges, and
// keeping it up to date from server events.

const apiBase = () => String(import.meta.env.VITE_API_PATH || '')

// Node fields copied from the API node into the Vue Flow node data.
const DATA_FIELDS = [
  'service',
  'model',
  'metadata',
  'forward',
  'process_rid',
  'error',
  'error_count',
  'processed',
  'params',
  'types',
]

export const EMPTY_DESK_ID = 'empty-desk'

export function toFlowNode(apiNode) {
  const d = apiNode.data
  const rawType = String(d.type || '').toLowerCase()
  const isSearchSet = rawType === 'search' && String(d._type || '').toLowerCase() === 'set'
  const type = isSearchSet ? 'search-set' : rawType || String(d._type || '').toLowerCase()
  const data = {
    '@type': d['@type'],
    type,
    label: isSearchSet ? d.label || 'Search Index' : d.label || d.name,
    description: d.description,
    info: d.info,
    file_count: d.file_count,
    count: d.count,
    roi_count: d.roi_count,
  }
  if (d._type) data._type = String(d._type).toLowerCase()
  if (d.paths) data.paths = [...d.paths]
  if (d.text_samples) data.text_samples = [...d.text_samples]
  if (d.image) data.image = apiBase() + d.image
  for (const key of DATA_FIELDS) if (d[key] !== undefined && d[key] !== null) data[key] = d[key]
  // data.type keeps the file type; the node type picks the component.
  const node = { id: d.id, type: nodeTypeFor(type), data }
  if (apiNode.position) node.position = apiNode.position
  return node
}

export function toFlowGraph(project) {
  const nodes = (project?.nodes || []).map(toFlowNode)
  const edges = (project?.edges || []).map((e) => ({
    id: e.data.id,
    source: e.data.source,
    target: e.data.target,
  }))
  if (!nodes.length) {
    nodes.push({
      id: EMPTY_DESK_ID,
      type: 'empty',
      position: { x: 0, y: 0 },
      data: { type: 'empty', label: 'Your desk is empty!' },
    })
  }
  return { nodes, edges }
}

// Left-to-right layout with dagre; every node counts as 200×200.
export function layoutLeftToRight(nodes, edges) {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'LR', nodesep: 270, ranksep: 200 })
  for (const node of nodes) graph.setNode(node.id, { width: 200, height: 200 })
  for (const edge of edges) graph.setEdge(edge.source, edge.target)
  dagre.layout(graph)
  return nodes.map((node) => {
    const at = graph.node(node.id)
    return {
      ...node,
      targetPosition: 'left',
      sourcePosition: 'right',
      position: { x: at.x, y: at.y },
    }
  })
}

// Fields a server "update" event may change on a node.
const UPDATE_FIELDS = [
  'image',
  'thumb',
  'thumbnail_version',
  'status',
  'label',
  'description',
  'info',
  'file_count',
  'count',
  'roi_count',
  'duration',
  'metadata',
  'paths',
  'edited',
]

// Copies changed fields onto `target`; returns whether anything changed.
export function mergeNodeFields(target, source) {
  if (!target || !source) return false
  let changed = false
  for (const key of UPDATE_FIELDS) {
    if (source[key] !== undefined) {
      target[key] = source[key]
      changed = true
    }
  }
  return changed
}

export function isThumbnailUpdate(node) {
  return (
    Boolean(node) &&
    ['thumbnail_version', 'thumb', 'image', 'paths'].some((k) => node[k] !== undefined)
  )
}

// The nodes and edges a server "add" event brings: the new node, the edge
// from its input, and for a process with an output its (still running)
// output set.
export function nodesFromAddEvent(event, randomPosition) {
  const id = event.node['@rid'] || event.node.rid || event.node.id
  const data = {
    ...event.node,
    type: String(event.node['@type'] || '').toLowerCase(),
    image: event.image,
  }
  if (event.type === 'process') {
    data.status = event.output && event.node['@type'] === 'SetProcess' ? 'waiting' : 'running'
  }
  const nodes = [
    { id, type: nodeTypeFor(event.type), data, image: event.image, position: randomPosition() },
  ]
  const edges = []
  if (event.input) edges.push({ id: `${event.input}->${id}`, source: event.input, target: id })
  if (event.output) {
    const out = event.output
    const outType = String(out.type || out['@type'] || '').toLowerCase()
    nodes.push({
      id: out['@rid'],
      type: outType === 'search' ? 'search-set' : 'set',
      data: { ...out, type: outType, status: 'running' },
      image: out.image,
      position: randomPosition(),
    })
    edges.push({ id: `${id}->${out['@rid']}`, source: id, target: out['@rid'] })
  }
  return { id, nodes, edges }
}
