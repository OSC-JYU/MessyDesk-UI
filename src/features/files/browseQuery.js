import { ridParam, toRid } from './fileTypes.js'

// A set browse context is also written into the URL (?browseMode=set&...),
// so a reload or a shared link keeps previous/next inside the set.

function count(value, fallback = 0) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export function setContextToQuery(context) {
  if (context?.mode !== 'set') return undefined
  return {
    browseMode: 'set',
    setRid: ridParam(context.set_rid),
    setLabel: context.set_label || '',
    fileCount: String(count(context.file_count)),
    skip: String(count(context.skip)),
    sourceRid: ridParam(context.source_rid),
    sourceLabel: context.source_label || '',
  }
}

// Returns the set context in the query, or null when there is none.
export function setContextFromQuery(query) {
  if (query?.browseMode !== 'set') return null
  const setRid = toRid(query.setRid)
  if (!setRid) return null
  return {
    mode: 'set',
    set_rid: setRid,
    set_label: query.setLabel ? String(query.setLabel) : null,
    file_count: count(query.fileCount),
    skip: count(query.skip),
    source_rid: toRid(query.sourceRid),
    source_label: query.sourceLabel ? String(query.sourceLabel) : null,
  }
}

// Position ("3 / 12") and whether previous/next are possible, for either mode.
export function browsePosition(context) {
  if (context?.mode === 'set') {
    const total = count(context.file_count)
    const index = count(context.skip)
    return { index, total, hasPrev: index > 0, hasNext: index < total - 1 }
  }
  if (context?.mode === 'search') {
    const total = context.results?.length || 0
    const index = count(context.index)
    return { index, total, hasPrev: index > 0, hasNext: index < total - 1 }
  }
  return null
}
