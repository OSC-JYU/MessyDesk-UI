// Turning the backend's project records into the rows of the desk list.
// Projects have carried their size, item count and expiry under several field
// names over time, so each reader tries them in order.

function readNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function firstNumber(project, keys) {
  for (const key of keys) {
    const value = readNumber(project[key])
    if (value !== null) return value
  }
  return null
}

export function normalizeRid(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw.startsWith('#') ? raw : `#${raw}`
}

// Size in MB; some records store bytes, which are converted.
export function deskSizeMb(project) {
  const raw = firstNumber(project, [
    'size_mb',
    'sizeMB',
    'sizeMb',
    'total_size_mb',
    'total_mb',
    'size',
  ])
  if (raw === null) return null
  return raw > 1024 * 1024 ? raw / (1024 * 1024) : raw
}

export function deskItemCount(project) {
  return firstNumber(project, ['node_count', 'nodes_count', 'item_count', 'file_count', 'count'])
}

export function deskExpiry(project) {
  const raw =
    project.expiration_date ||
    project.expiry_date ||
    project.expires_at ||
    project.expires ||
    project.expire_at ||
    project.valid_until
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

// Map of project rid → number of indexed search documents, from /api/search/info.
export function indexedDocsByProject(searchInfo) {
  const byProject = {}
  for (const item of searchInfo?.project_counts || []) {
    const docs = Number(item?.docs)
    const rid = normalizeRid(item?.project_rid)
    if (rid && Number.isFinite(docs)) byProject[rid] = docs
  }
  return byProject
}

export function toDeskRow(project, docsByProject) {
  const rid = normalizeRid(project['@rid'])
  const name = String(project.label || project.name || '').trim() || 'Untitled desk'
  const sizeMb = deskSizeMb(project)
  const items = deskItemCount(project)
  const expires = deskExpiry(project)
  const docs = docsByProject ? (docsByProject[rid] ?? 0) : null
  return {
    rid,
    routeRid: rid.replace('#', ''),
    name,
    sizeMb,
    items,
    docs,
    expires,
    sizeText: sizeMb === null ? 'No estimate yet' : `${sizeMb.toFixed(1)} MB`,
    itemsText: items === null ? 'Not counted yet' : `${Math.floor(items)} items`,
    docsText: docs === null ? 'n/a' : `${docs} docs`,
    expiresText: expires ? expires.toLocaleDateString() : 'No date',
  }
}

const SORT_VALUES = {
  name: (row) => row.name.toLowerCase(),
  size: (row) => row.sizeMb ?? -1,
  items: (row) => row.items ?? -1,
  docs: (row) => row.docs ?? -1,
  expires: (row) => (row.expires ? row.expires.getTime() : Number.POSITIVE_INFINITY),
}

export function sortDesks(rows, key = 'name', direction = 'asc') {
  const value = SORT_VALUES[key] || SORT_VALUES.name
  const sign = direction === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const left = value(a)
    const right = value(b)
    if (left < right) return -sign
    if (left > right) return sign
    return 0
  })
}
