// Telling Vue Flow nodes apart when they are opened.

const lower = (v) => String(v || '').toLowerCase()
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff', 'heic', 'heif']
const NOT_FILES = new Set([
  'project',
  'set',
  'search-set',
  'search',
  'roi-set',
  'process',
  'setprocess',
  'filter',
  'nextcloud',
  'dspace7',
])

export function isSetLike(node) {
  return (
    lower(node?.data?.['@type']) === 'set' ||
    ['set', 'search-set'].includes(lower(node?.type)) ||
    ['set', 'roi-set'].includes(lower(node?.data?.type))
  )
}

export function isFileLike(node) {
  return lower(node?.data?.['@type']) === 'file'
}

function hasImageName(extension, label) {
  return (
    IMAGE_EXTENSIONS.includes(lower(extension)) ||
    IMAGE_EXTENSIONS.some((ext) => lower(label).endsWith(`.${ext}`))
  )
}

export function isImageLike(node) {
  return (
    isFileLike(node) &&
    (lower(node?.type) === 'image' ||
      lower(node?.data?.type) === 'image' ||
      hasImageName(node?.data?.extension, node?.data?.label))
  )
}

export function isRoiJson(node) {
  const d = node?.data || node
  return (
    lower(d?.type) === 'roi.json' ||
    lower(d?.extension) === 'json' ||
    lower(d?.label).endsWith('.roi.json')
  )
}

// A node that opens in the file viewer.
export function opensAsFile(node) {
  const d = node?.data || {}
  const type = lower(d.type)
  const isFile =
    lower(d['@type']) === 'file' ||
    lower(d._type) === 'file' ||
    type === 'file' ||
    (type && !NOT_FILES.has(type))
  return isFile && lower(node?.type) !== 'zip' && type !== 'zip'
}

// The file an ROI set's regions are drawn on, from the ROI set's path:
// the first image, or else the first file that is not ROI data.
export function roiSourceFromPath(path) {
  const files = (path || []).filter((n) => lower(n?.['@type']) === 'file' && !isRoiJson(n))
  const image = files.find((n) => lower(n.type) === 'image' || hasImageName(n.extension, n.label))
  return (image || files[0])?.['@rid'] || null
}

// Walks up from an ROI set to what it was made from: the nearest image,
// else the nearest file, else the nearest set.
export function roiSourceNode(roiNode, incomers) {
  const queue = [...(incomers(roiNode) || [])]
  const seen = new Set([roiNode?.id])
  let file = null
  let set = null
  while (queue.length) {
    const current = queue.shift()
    if (!current || seen.has(current.id)) continue
    seen.add(current.id)
    if (isImageLike(current)) return current
    if (!file && isFileLike(current)) file = current
    if (!set && isSetLike(current)) set = current
    queue.push(...(incomers(current) || []).filter((p) => p && !seen.has(p.id)))
  }
  return file || set
}

// Every node above (`incomers`) or below (`outgoers`) a node.
export function relatives(node, next) {
  const found = new Map()
  const queue = [...(next(node) || [])]
  while (queue.length) {
    const current = queue.shift()
    if (!current || found.has(current.id)) continue
    found.set(current.id, current)
    queue.push(...(next(current) || []))
  }
  return [...found.values()]
}
