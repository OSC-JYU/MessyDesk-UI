import { describe, it, expect } from 'vitest'
import { parseOcrRegions } from '@/features/files/ocr.js'
import { imageAncestorPath, parseLineSegments } from '@/features/files/lineSegments.js'
import { bboxFromTitle, hocrBody, imageNameFromTitle } from '@/features/files/hocr.js'
import {
  docRids,
  documentCoverage,
  matchStartToken,
  queryCoverage,
  similarityLevel,
  tokenAt,
  tokenizeWithOffsets,
} from '@/features/files/similarity.js'

const box = (x1, y1, x2, y2) => [
  { x: x1, y: y1 },
  { x: x2, y: y1 },
  { x: x2, y: y2 },
  { x: x1, y: y2 },
]

describe('OCR regions', () => {
  it('puts regions in reading order and converts boxes', () => {
    const regions = parseOcrRegions([
      { text: 'second line', coordinates: box(0.1, 0.5, 0.4, 0.55) },
      { text: 'right', coordinates: box(0.6, 0.1, 0.9, 0.15) },
      { text: 'left', coordinates: box(0.1, 0.105, 0.4, 0.155) },
    ])
    expect(regions.map((r) => r.text)).toEqual(['left', 'right', 'second line'])
    expect(regions[0]).toMatchObject({ left: 0.1, top: 0.105 })
    expect(regions[0].width).toBeCloseTo(0.3)
  })

  it('accepts JSON text and ignores bad data', () => {
    expect(
      parseOcrRegions(JSON.stringify([{ text: 'a', coordinates: box(0, 0, 1, 1) }])),
    ).toHaveLength(1)
    expect(parseOcrRegions('not json')).toEqual([])
    expect(parseOcrRegions({})).toEqual([])
  })
})

describe('line segments', () => {
  it('reads polygons, confidences, boxes and the image size', () => {
    const data = parseLineSegments({
      line_polygons: [
        [
          [0, 0],
          [10, 0],
          [10, 5],
        ],
      ],
      line_confs: [0.9],
      line_boxes: [[0, 0, 10, 5]],
      image_shape: [500, 800],
      source_path: 'data/p/scan.jpg',
    })
    expect(data).toMatchObject({ width: 800, height: 500, sourcePath: 'data/p/scan.jpg' })
    expect(data.lines[0]).toEqual({
      points: '0,0 10,0 10,5',
      confidence: 0.9,
      size: { width: 10, height: 5 },
    })
  })

  it('prefers an image ancestor, then a PDF', () => {
    expect(
      imageAncestorPath([
        { type: 'pdf', path: 'a.pdf' },
        { type: 'image', path: 'a.jpg' },
      ]),
    ).toBe('a.jpg')
    expect(imageAncestorPath([{ type: 'pdf', path: 'a.pdf' }])).toBe('a.pdf')
    expect(imageAncestorPath(null)).toBeNull()
  })
})

describe('hOCR', () => {
  it('reads boxes and image names from titles', () => {
    expect(bboxFromTitle("image 'x.jpg'; bbox 10 20 110 60; x_wconf 90")).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 40,
    })
    expect(bboxFromTitle('nothing')).toBeNull()
    expect(imageNameFromTitle('image "/data/pages/p1.png"; bbox 0 0 1 1')).toBe('p1.png')
  })

  it('takes the body of an hOCR document', () => {
    expect(hocrBody('<html><body class="x"><p>hi</p></body></html>')).toBe('<p>hi</p>')
    expect(hocrBody('<p>no body</p>')).toBe('<p>no body</p>')
  })
})

describe('similarity', () => {
  const text = 'one two  three four'
  const doc = { text, ...tokenizeWithOffsets(text) }

  it('tokenizes with character offsets', () => {
    expect(doc.tokens).toEqual(['one', 'two', 'three', 'four'])
    expect(doc.offsets).toEqual([0, 4, 9, 15])
    expect(tokenAt(doc.offsets, text.length, 10)).toBe(2)
    expect(tokenAt(doc.offsets, text.length, 7)).toBe(1)
    expect(tokenAt(doc.offsets, text.length, text.length)).toBe(3)
  })

  it('finds where a match starts', () => {
    expect(matchStartToken({ text_start_char: 9 }, doc)).toBe(2)
    expect(matchStartToken({ text_start_token: 1 }, null)).toBe(1)
    expect(matchStartToken({ start_token: 4 }, doc)).toBe(1)
    expect(matchStartToken({}, null)).toBe(0)
  })

  it('maps tokens to the matches covering them', () => {
    const data = {
      window_size: 2,
      chunk_similarities: [
        { similarity: 0.97, doc_index: 0, query_start_token: 0, text_start_char: 4 },
        { similarity: 0.5, doc_index: 1, query_start_token: 1, text_start_token: 0 },
      ],
    }
    expect([...queryCoverage(data).entries()]).toEqual([
      [0, [0]],
      [1, [0, 1]],
      [2, [1]],
    ])
    expect([...documentCoverage(data, 0, doc).keys()]).toEqual([1, 2])
    expect(similarityLevel(0.97)).toBe('high')
    expect(similarityLevel(0.85)).toBe('medium')
    expect(similarityLevel(0.5)).toBe('low')
  })

  it('lists the documents', () => {
    expect(docRids({ doc_map: ['1:0', '2:0'] })).toEqual(['1:0', '2:0'])
    expect(docRids({ text_file: '3:0' })).toEqual(['3:0'])
    expect(docRids({})).toEqual([])
  })
})
