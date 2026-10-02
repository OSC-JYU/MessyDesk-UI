// Semantic search: vector indexes as panels, hits as result cards, and waiting for a search
// (it runs as a short job in the queue, so the backend answers with an id first).
import { getSemanticSearch, startSemanticSearch } from '@/api/search.js'
import { thumbnailUrl, toRid } from './results.js'

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// The panel title: model first, then what was indexed.
export function indexTitle(index) {
  const model = index?.model?.id || 'Unknown model'
  const source = index?.source_set_label || index?.label || 'Vector index'
  return `${model} · ${source}`
}

export function indexSubtitle(index) {
  const parts = []
  if (Number.isFinite(index?.files)) parts.push(`${index.files} files`)
  if (Number.isFinite(index?.rows)) parts.push(`${index.rows.toLocaleString()} passages`)
  if (index?.project_label) parts.push(index.project_label)
  return parts.join(' · ')
}

// Indexes of the desks in scope: one desk, the selected desks, or all.
export function indexesInScope(indexes, deskRids) {
  if (!deskRids?.length) return indexes
  const wanted = new Set(deskRids.map(toRid))
  return indexes.filter((index) => wanted.has(toRid(index.project_rid)))
}

// A hit as a result card; the similarity goes in the badge.
export function semanticHitToResult(hit) {
  const rid = toRid(hit.rid)
  return {
    rid,
    label: hit.label || rid,
    type: hit.type || 'text',
    entities: [],
    snippetHtml: hit.snippet ? escapeHtml(hit.snippet) : '',
    text: '',
    thumb: thumbnailUrl(hit.path),
    score: hit.similarity ?? null,
    badge: Number.isFinite(hit.similarity) ? hit.similarity.toFixed(2) : '',
    highlight: '',
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Starts a search and waits for it. The first search of a model can take a while (the
// service loads the model), so the wait is generous.
export async function runSemanticSearch(
  { index, query, k = 30, level = 'chunk' },
  { timeoutMs = 120000, intervalMs = 700, api = { startSemanticSearch, getSemanticSearch } } = {},
) {
  const started = await api.startSemanticSearch({ index, query, k, level })
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const search = await api.getSemanticSearch(started.search_id)
    if (search.status === 'done') return search
    if (search.status === 'failed') throw new Error(search.error || 'Search failed')
    if (Date.now() > deadline) throw new Error('The search did not finish in time. Is the service running?')
    await sleep(intervalMs)
  }
}
