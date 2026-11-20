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
  'original-pdf': 'mdi-file-pdf-box',
  text: 'mdi-file-document-outline',
}

// Colour names are Vuetify theme colours.
const NODE_COLOURS = { Project: 'primary', Source: 'warning', Process: 'secondary' }
const FILE_COLOURS = { image: 'graph', pdf: 'error', 'original-pdf': 'error', text: 'info' }

export function visibleLineage(path) {
  return (path || []).filter((node) => !['User', 'Set'].includes(String(node['@type'] || '')))
}

// A PDF that was deleted from disk after it was split: the node stays as a record only.
export function isRemoved(node) {
  return node?._file_removed === true
}

export function nodeIcon(node) {
  if (isRemoved(node)) return 'mdi-file-remove-outline'
  return FILE_ICONS[node.type] || NODE_ICONS[node['@type']] || 'mdi-file-outline'
}

export function nodeColour(node) {
  if (isRemoved(node)) return undefined
  return FILE_COLOURS[node.type] || NODE_COLOURS[node['@type']] || undefined
}

export function nodeKind(node) {
  if (node['@type'] === 'File' && node.type) return node.type
  return String(node['@type'] || '').toLowerCase()
}

export function isOpenable(node) {
  const kind = String(node?.['@type'] || '').toLowerCase()
  return (
    kind === 'file' &&
    String(node?.type || '').toLowerCase() !== 'zip' &&
    Boolean(node?.['@rid']) &&
    !isRemoved(node)
  )
}

function fileNodes(path) {
  return (path || []).filter(
    (n) =>
      String(n?.['@type'] || '').toLowerCase() === 'file' &&
      String(n?.type || '').toLowerCase() !== 'zip',
  )
}

// How many file steps `rid` is from `contextRid` in the path (the path lists the file first, so an ancestor is positive).
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

// The file `offset` steps from `contextRid` in the path (1 = parent), or null when the
// path does not reach that far. Unlike fileAtOffset it does not stop at the end of the path.
export function ancestorAt(path, contextRid, offset) {
  const files = fileNodes(path)
  const from = files.findIndex((n) => n['@rid'] === contextRid)
  if (from < 0 || !offset) return null
  return files[from + offset]?.['@rid'] || null
}

export function levelLabel(level) {
  if (level <= 0) return 'current'
  if (level === 1) return 'parent'
  if (level === 2) return 'grandparent'
  return `ancestor +${level}`
}
