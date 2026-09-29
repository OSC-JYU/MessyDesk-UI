// Text similarity results (similarity.json): chunks of a query text matched
// against one or more original documents.
// { query_text, window_size, overlap, max_similarity, chunk_count,
//   doc_map: [rid, …] | text_file: rid,
//   chunk_similarities: [{ similarity, doc_index, query_start_token,
//                          text_start_char | text_start_token | … }] }

export function tokenize(text) {
  return typeof text === 'string' ? text.split(/\s+/).filter(Boolean) : []
}

// Tokens and the character offset where each starts.
export function tokenizeWithOffsets(text) {
  const tokens = []
  const offsets = []
  if (typeof text !== 'string') return { tokens, offsets }
  const re = /\S+/g
  let m
  while ((m = re.exec(text))) {
    tokens.push(m[0])
    offsets.push(m.index)
  }
  return { tokens, offsets }
}

// Index of the token a character offset falls in (whitespace belongs to the
// token before it).
export function tokenAt(offsets, textLength, charPos) {
  for (let i = 0; i < offsets.length; i++) {
    const end = i < offsets.length - 1 ? offsets[i + 1] : textLength
    if (charPos >= offsets[i] && charPos < end) return i
  }
  if (charPos === textLength && offsets.length) return offsets.length - 1
  return Math.max(0, offsets.filter((o) => o < charPos).length - 1)
}

// Where a match starts in its original document, in tokens. `doc` is
// { text, offsets } when the document is loaded.
export function matchStartToken(match, doc) {
  if (match.text_start_char !== undefined && doc?.text) {
    return tokenAt(doc.offsets, doc.text.length, match.text_start_char)
  }
  if (match.text_start_token !== undefined) return match.text_start_token
  if (match.original_start_token !== undefined) return match.original_start_token
  if (match.start_token !== undefined && doc?.text) {
    return tokenize(doc.text.substring(0, match.start_token)).length
  }
  return match.start_token ?? 0
}

export const docIndexOf = (match) => match.doc_index ?? 0

// Map of token index → indexes of the matches covering it.
function coverage(starts, windowSize) {
  const map = new Map()
  starts.forEach(({ start, matchIndex }) => {
    for (let i = 0; i < windowSize; i++) {
      const at = start + i
      if (!map.has(at)) map.set(at, [])
      map.get(at).push(matchIndex)
    }
  })
  return map
}

export function queryCoverage(data) {
  const matches = data?.chunk_similarities || []
  return coverage(
    matches.map((m, matchIndex) => ({ start: m.query_start_token, matchIndex })),
    data?.window_size || 15,
  )
}

export function documentCoverage(data, docIndex, doc) {
  const matches = data?.chunk_similarities || []
  return coverage(
    matches
      .map((m, matchIndex) => ({ m, matchIndex }))
      .filter(({ m }) => docIndexOf(m) === docIndex)
      .map(({ m, matchIndex }) => ({ start: matchStartToken(m, doc), matchIndex })),
    data?.window_size || 15,
  )
}

export function similarityLevel(similarity) {
  if (similarity >= 0.95) return 'high'
  if (similarity >= 0.8) return 'medium'
  return 'low'
}

export function docRids(data) {
  if (Array.isArray(data?.doc_map)) return data.doc_map
  return data?.text_file ? [data.text_file] : []
}
