// The lineage panel: the chain of nodes a file was derived from.

const NODE_ICONS = {
  Project: 'mdi-desk',
  Set: 'mdi-folder-multiple-outline',
  Source: 'mdi-database-outline',
  Process: 'mdi-cog-outline',
  File: 'mdi-file-outline',
}
const FILE_ICONS = {
  image: 'mdi-image-outline',
  pdf: 'mdi-file-pdf-box',
  text: 'mdi-file-document-outline',
}

// Colour names are Vuetify theme colours.
const NODE_COLOURS = { Project: 'primary', Source: 'warning', Process: 'secondary' }
const FILE_COLOURS = { image: 'graph', pdf: 'error', text: 'info' }

export function visibleLineage(path) {
  return (path || []).filter((node) => !['User', 'Set'].includes(String(node['@type'] || '')))
}

export function nodeIcon(node) {
  return FILE_ICONS[node.type] || NODE_ICONS[node['@type']] || 'mdi-file-outline'
}

export function nodeColour(node) {
  return FILE_COLOURS[node.type] || NODE_COLOURS[node['@type']] || undefined
}

export function nodeKind(node) {
  if (node['@type'] === 'File' && node.type) return node.type
  return String(node['@type'] || '').toLowerCase()
}

export function isOpenable(node) {
  const kind = String(node?.['@type'] || '').toLowerCase()
  return (
    kind === 'file' && String(node?.type || '').toLowerCase() !== 'zip' && Boolean(node?.['@rid'])
  )
}

function fileNodes(path) {
  return (path || []).filter(
    (n) =>
      String(n?.['@type'] || '').toLowerCase() === 'file' &&
      String(n?.type || '').toLowerCase() !== 'zip',
  )
}

// How many file steps `rid` is from `contextRid` in the path (negative = ancestor).
export function offsetInLineage(path, rid, contextRid) {
  const files = fileNodes(path)
  const at = files.findIndex((n) => n['@rid'] === rid)
  const from = files.findIndex((n) => n['@rid'] === contextRid)
  return at < 0 || from < 0 ? 0 : at - from
}

// The file `offset` steps from `contextRid` in the path, clamped to the path.
export function fileAtOffset(path, contextRid, offset) {
  const files = fileNodes(path)
  const from = files.findIndex((n) => n['@rid'] === contextRid)
  if (from < 0 || !offset) return contextRid
  const target = Math.max(0, Math.min(files.length - 1, from + offset))
  return files[target]?.['@rid'] || contextRid
}

export function levelLabel(level) {
  if (level <= 0) return 'current'
  if (level === 1) return 'parent'
  if (level === 2) return 'grandparent'
  return `ancestor +${level}`
}
