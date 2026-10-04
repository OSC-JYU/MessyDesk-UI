// What kind of file a file node is, for choosing its display and tools.

export function isImage(file) {
  return Boolean(file) && (file.type === 'image' || file['@type'] === 'Image')
}

export function isTextLike(file) {
  const type = String(file?.type || '').toLowerCase()
  return ['text', 'csv', 'html', 'json'].includes(type) || type.endsWith('.json')
}

// Reference nodes point at another node's file and cannot be edited.
export function isReference(file) {
  return Boolean(file?.ref || file?.ref_rid)
}

export function toRid(value) {
  if (value === undefined || value === null || value === '') return null
  const raw = String(value)
  return raw.startsWith('#') ? raw : `#${raw}`
}

export function ridParam(rid) {
  return rid ? String(rid).replace('#', '') : ''
}

// Display names, by file type first and file extension second. The viewer
// maps them to components (displays/index.js).
const BY_TYPE = {
  image: 'image',
  pdf: 'pdf',
  text: 'text',
  html: 'text',
  json: 'text',
  csv: 'text',
  'ocr.json': 'ocr',
  'polygons.json': 'lines',
  'osd.json': 'json',
  'human.json': 'human',
  'dspace7.json': 'json',
  'similarity.json': 'similarity',
  similarity_index: 'index',
  vector_index: 'index',
}

const BY_EXTENSION = { hocr: 'hocr', json: 'json', txt: 'text' }

export function displayFor(file) {
  if (!file) return null
  const type = String(file.type || '').toLowerCase()
  const ext = String(file.extension || '').toLowerCase()
  return BY_TYPE[type] || BY_EXTENSION[ext] || 'json'
}
