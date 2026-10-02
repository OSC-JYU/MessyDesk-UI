import { describe, expect, it } from 'vitest'
import {
  indexSubtitle,
  indexTitle,
  indexesInScope,
  runSemanticSearch,
  semanticHitToResult,
} from '@/features/search/semantic.js'

const index = {
  rid: '#10:23',
  project_rid: '#1:0',
  project_label: 'Letters',
  source_set_label: 'Embeddings output',
  model: { id: 'multilingual-e5-small' },
  rows: 25000,
  files: 10000,
}

describe('semantic search', () => {
  it('names an index by model and what was indexed', () => {
    expect(indexTitle(index)).toBe('multilingual-e5-small · Embeddings output')
    expect(indexSubtitle(index)).toContain('passages')
    expect(indexSubtitle(index)).toContain('Letters')
  })

  it('keeps the indexes of the desks in scope', () => {
    expect(indexesInScope([index], [])).toHaveLength(1)
    expect(indexesInScope([index], ['1:0'])).toHaveLength(1)
    expect(indexesInScope([index], ['#2:0'])).toHaveLength(0)
  })

  it('turns a hit into an escaped result card', () => {
    const card = semanticHitToResult({ rid: '10:2', label: 'a.txt', similarity: 0.8829, snippet: '<b>ship</b>' })
    expect(card.rid).toBe('#10:2')
    expect(card.badge).toBe('0.88')
    expect(card.snippetHtml).toBe('&lt;b&gt;ship&lt;/b&gt;')
  })

  it('waits until the search is done', async () => {
    const answers = [{ status: 'queued' }, { status: 'done', hits: [{ rid: '#1:1' }] }]
    const api = {
      startSemanticSearch: async () => ({ search_id: 'x' }),
      getSemanticSearch: async () => answers.shift(),
    }
    const result = await runSemanticSearch({ index: '#10:23', query: 'q' }, { api, intervalMs: 1 })
    expect(result.hits).toHaveLength(1)
  })

  it('reports a failed search', async () => {
    const api = {
      startSemanticSearch: async () => ({ search_id: 'x' }),
      getSemanticSearch: async () => ({ status: 'failed', error: 'model missing' }),
    }
    await expect(runSemanticSearch({ index: '#1:1', query: 'q' }, { api })).rejects.toThrow('model missing')
  })
})
