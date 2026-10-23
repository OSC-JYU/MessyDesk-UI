import { describe, it, expect } from 'vitest'
import {
  buildSolrQuery,
  queryString,
  scopeName,
  solrValue,
} from '@/features/services/crunchers/dspaceQuery.js'

describe('dspaceQuery', () => {
  it.each([
    ['letters', 'contains', 'letters'],
    ['old letters', 'contains', '"old letters"'],
    ['letters', 'exact', '"letters"'],
    ['let', 'wildcard_start', 'let*'],
    ['ters', 'wildcard_end', '*ters'],
    ['tte', 'wildcard_contains', '*tte*'],
  ])('%s with %s → %s', (value, type, expected) => {
    expect(solrValue(value, type)).toBe(expected)
  })

  it('joins field criteria and the general query with AND', () => {
    const fields = [
      { id: 1, name: 'dc.title' },
      { id: 2, name: 'dc.subject' },
    ]
    const criteria = [
      { fieldId: 1, matchType: 'contains', value: 'letters' },
      { fieldId: 2, matchType: 'notcontains', value: 'war' },
      { fieldId: 3, matchType: 'contains', value: 'unknown field' },
      { fieldId: 1, matchType: 'contains', value: '  ' },
    ]
    expect(buildSolrQuery(criteria, fields, 'jyväskylä')).toBe(
      'dc.title:letters AND NOT dc.subject:war AND jyväskylä',
    )
  })

  it('names scopes from the community hierarchy', () => {
    const hierarchy = [{ id: 'c1', name: 'Archive', collections: [{ id: 'k1', name: 'Letters' }] }]
    expect(scopeName(hierarchy, 'c1')).toBe('Archive')
    expect(scopeName(hierarchy, 'k1')).toBe('Letters')
    expect(scopeName(hierarchy, 'x')).toBe('Unknown scope')
  })

  it('builds a query string without empty values', () => {
    expect(queryString({ query: 'a b', scope: null, page: 0 })).toBe('query=a%20b&page=0')
  })
})
