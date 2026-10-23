// Turning search hits and tagged files into the cards of the results grid.

export function toRid(value) {
  if (!value && value !== 0) return ''
  const raw = String(value)
  return raw.startsWith('#') ? raw : `#${raw}`
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Solr highlights come as text with <em> around the matches. Everything else
// is escaped, so the result is safe to render as HTML.
export function highlightHtml(snippet) {
  if (!snippet) return ''
  return escapeHtml(snippet)
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>')
}

// Wraps text[start:end] in <mark>, escaping the text around it. Offsets are
// character offsets into the raw text, so the text is sliced before escaping.
export function markedHtml(rawText, start, end) {
  const text = typeof rawText === 'string' ? rawText : JSON.stringify(rawText, null, 2)
  const valid =
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 0 &&
    end > start &&
    end <= text.length
  if (!valid) return escapeHtml(text)
  return `${escapeHtml(text.slice(0, start))}<mark class="md-hit">${escapeHtml(text.slice(start, end))}</mark>${escapeHtml(text.slice(end))}`
}

// Thumbnails are served next to the file: /api/thumbnails/<dir of path>/thumbnail.jpg
export function thumbnailUrl(filePath) {
  if (!filePath || typeof filePath !== 'string') return ''
  const dir = filePath.substring(0, filePath.lastIndexOf('/'))
  if (!dir) return ''
  const base = String(import.meta.env.VITE_API_PATH || '').replace(/\/$/, '')
  return `${base}/api/thumbnails/${dir}/thumbnail.jpg`
}

function fileName(filePath) {
  return (
    String(filePath || '')
      .split('/')
      .filter(Boolean)
      .pop() || ''
  )
}

function firstHighlight(highlighting, id) {
  const hl = highlighting?.[id] || {}
  return hl.fulltext_exact?.[0] || hl.fulltext?.[0] || ''
}

// A Solr search document (with the response's highlighting) as a result card.
export function searchDocToResult(doc, highlighting) {
  const rid = toRid(doc.node || doc.id)
  const snippet = firstHighlight(highlighting, doc.id)
  return {
    rid,
    label:
      String(doc.label || '').trim() ||
      fileName(doc.path) ||
      String(doc.id || '') ||
      rid.replace('#', ''),
    type: doc.type || 'text',
    entities: doc.entities || [],
    snippetHtml: highlightHtml(snippet),
    text: doc.description || '',
    thumb: thumbnailUrl(doc.path),
    score: doc.score ?? null,
    highlight: (highlighting?.[doc.id]?.fulltext || []).join(' '),
  }
}

// A file found through a tag as a result card.
export function taggedFileToResult(item) {
  const rid = toRid(item['@rid'] || item.rid || item.id)
  return {
    rid,
    label: item.label || item.name || rid,
    type: item.type || item.extension || 'text',
    entities: item.entities || [],
    snippetHtml: '',
    text: item.description || item.info || '',
    thumb: item.thumb
      ? `${item.thumb.replace(/\/thumbnail\.jpg$/, '')}/thumbnail.jpg`
      : thumbnailUrl(item.path),
    score: null,
    highlight: '',
  }
}

// The list the file viewer steps through with previous/next.
export function browseList(results) {
  return results.map(({ rid, label, score, highlight }) => ({ rid, label, score, highlight }))
}

export function pageOf(items, page, perPage) {
  const start = (page - 1) * perPage
  return items.slice(start, start + perPage)
}

export function pageCount(total, perPage) {
  return Math.max(1, Math.ceil(total / perPage))
}
