import { describe, it, expect } from 'vitest'
import {
  browseList,
  highlightHtml,
  markedHtml,
  pageCount,
  pageOf,
  searchDocToResult,
  taggedFileToResult,
  thumbnailUrl,
  toRid,
} from '@/features/search/results.js'

describe('results', () => {
  it('normalises rids', () => {
    expect(toRid('12:3')).toBe('#12:3')
    expect(toRid('#12:3')).toBe('#12:3')
    expect(toRid(null)).toBe('')
  })

  it('keeps only the <em> highlights as HTML', () => {
    expect(highlightHtml('<b>x</b> <em>kirje</em> & "y"')).toBe(
      '&lt;b&gt;x&lt;/b&gt; <em>kirje</em> &amp; &quot;y&quot;',
    )
  })

  it('marks a mention by character offsets before escaping', () => {
    expect(markedHtml('a <b> Aalto!', 6, 11)).toBe('a &lt;b&gt; <mark class="md-hit">Aalto</mark>!')
    expect(markedHtml('<x>', 5, 9)).toBe('&lt;x&gt;')
    expect(markedHtml({ a: 1 }, 0, 1)).toContain('<mark')
  })

  it('builds thumbnail URLs from the file directory', () => {
    expect(thumbnailUrl('data/p/1/file.jpg')).toBe('/api/thumbnails/data/p/1/thumbnail.jpg')
    expect(thumbnailUrl('file.jpg')).toBe('')
  })

  it('turns a Solr document into a result', () => {
    const highlighting = { d1: { fulltext_exact: ['a <em>kirje</em>'], fulltext: ['x', 'y'] } }
    const result = searchDocToResult(
      { id: 'd1', node: '76:0', path: 'data/p/letter.txt', type: 'text', score: 2 },
      highlighting,
    )
    expect(result).toMatchObject({
      rid: '#76:0',
      label: 'letter.txt',
      snippetHtml: 'a <em>kirje</em>',
      score: 2,
      highlight: 'x y',
    })
  })

  it('turns a tagged file into a result', () => {
    expect(
      taggedFileToResult({
        '@rid': '#5:1',
        label: 'scan.jpg',
        type: 'image',
        path: 'a/b/scan.jpg',
      }),
    ).toMatchObject({
      rid: '#5:1',
      label: 'scan.jpg',
      thumb: '/api/thumbnails/a/b/thumbnail.jpg',
    })
  })

  it('keeps what the file viewer needs for previous/next', () => {
    expect(browseList([{ rid: '#1:0', label: 'a', score: 1, highlight: '', extra: 1 }])).toEqual([
      { rid: '#1:0', label: 'a', score: 1, highlight: '' },
    ])
  })

  it('pages lists', () => {
    const items = Array.from({ length: 30 }, (_, i) => i)
    expect(pageOf(items, 2, 24)).toEqual([24, 25, 26, 27, 28, 29])
    expect(pageCount(30, 24)).toBe(2)
    expect(pageCount(0, 24)).toBe(1)
  })
})
