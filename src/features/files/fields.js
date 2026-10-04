// Extracted fields (fields.json, from GLiNER2's extract_data): the fields asked for and one record
// per instance found, each field { text, confidence, start, end } or null.
// { format: 'messydesk-fields/1', fields: [name], records: [{ name: value|null }], source: { rid, label } }

export function parseFields(content) {
  const data = typeof content === 'string' ? JSON.parse(content) : content
  const fields = Array.isArray(data?.fields) ? data.fields.map(String) : []
  const records = (Array.isArray(data?.records) ? data.records : []).map((record) =>
    Object.fromEntries(fields.map((field) => [field, normalizeValue(record?.[field])])),
  )
  return { fields, records, source: data?.source || null, model: data?.model || null }
}

function normalizeValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return { text: value, confidence: null, start: null, end: null }
  if (typeof value?.text !== 'string') return null
  const number = (n) => (Number.isFinite(Number(n)) && n !== null ? Number(n) : null)
  return {
    text: value.text,
    confidence: number(value.confidence),
    start: number(value.start),
    end: number(value.end),
  }
}

// Shown as a percentage, rounded down so that 0.999 is not 100 %.
export function confidenceLabel(confidence) {
  return Number.isFinite(confidence) ? `${Math.floor(confidence * 100)} %` : ''
}

export function confidenceLevel(confidence) {
  if (!Number.isFinite(confidence)) return 'unknown'
  if (confidence >= 0.9) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

// The source text around a value: before, the value itself, after (at most `context` characters
// on each side), or null when the value has no place in the text.
export function excerpt(text, value, context = 300) {
  if (typeof text !== 'string' || !value || value.start === null || value.end === null) return null
  if (value.start < 0 || value.end > text.length || value.start >= value.end) return null
  const from = Math.max(0, value.start - context)
  const to = Math.min(text.length, value.end + context)
  return {
    before: (from > 0 ? '… ' : '') + text.slice(from, value.start),
    match: text.slice(value.start, value.end),
    after: text.slice(value.end, to) + (to < text.length ? ' …' : ''),
  }
}
