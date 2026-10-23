// Building a DSpace 7 discovery (Solr) query from field criteria.

export const MATCH_TYPES = [
  { title: 'Contains', value: 'contains' },
  { title: 'Exact match', value: 'exact' },
  { title: 'Does not contain', value: 'notcontains' },
  { title: 'Starts with', value: 'wildcard_start' },
  { title: 'Ends with', value: 'wildcard_end' },
  { title: 'Contains (wildcard)', value: 'wildcard_contains' },
]

const SPECIAL = /[:*+\-&|!(){}[\]^"~?\\\s]/

export function solrValue(value, matchType) {
  const v = value.trim()
  switch (matchType) {
    case 'exact':
      return `"${v}"`
    case 'wildcard_start':
      return `${v}*`
    case 'wildcard_end':
      return `*${v}`
    case 'wildcard_contains':
      return `*${v}*`
    default:
      return SPECIAL.test(v) ? `"${v}"` : v
  }
}

// criteria: [{ fieldId, matchType, value }]; fields: [{ id, name }].
export function buildSolrQuery(criteria, fields, general = '') {
  const parts = []
  for (const c of criteria) {
    const field = fields.find((f) => f.id === c.fieldId)
    if (!field || !c.value?.trim()) continue
    parts.push(
      c.matchType === 'notcontains'
        ? `NOT ${field.name}:${solrValue(c.value, 'contains')}`
        : `${field.name}:${solrValue(c.value, c.matchType)}`,
    )
  }
  if (general.trim()) parts.push(general.trim())
  return parts.join(' AND ')
}

export function scopeName(hierarchy, id) {
  for (const community of hierarchy) {
    if (community.id === id) return community.name
    const collection = (community.collections || []).find((c) => c.id === id)
    if (collection) return collection.name
  }
  return 'Unknown scope'
}

export function queryString(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}
