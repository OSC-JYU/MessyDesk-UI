import { describe, it, expect } from 'vitest'
import {
  displayFor,
  isImage,
  isReference,
  isTextLike,
  ridParam,
  toRid,
} from '@/features/files/fileTypes.js'
import {
  browsePosition,
  setContextFromQuery,
  setContextToQuery,
} from '@/features/files/browseQuery.js'
import {
  fileAtOffset,
  isOpenable,
  levelLabel,
  nodeKind,
  offsetInLineage,
  visibleLineage,
} from '@/features/files/lineage.js'
import { rectBetween, normalizeRotation, toImagePixels } from '@/features/files/imageEdit.js'

describe('fileTypes', () => {
  it.each([
    [{ type: 'image' }, 'image'],
    [{ type: 'pdf' }, 'pdf'],
    [{ type: 'text', extension: 'txt' }, 'text'],
    [{ type: 'csv' }, 'text'],
    [{ type: 'ocr.json' }, 'ocr'],
    [{ type: 'polygons.json' }, 'lines'],
    [{ type: 'human.json' }, 'human'],
    [{ type: 'similarity.json' }, 'similarity'],
    [{ type: 'fields.json' }, 'fields'],
    [{ type: 'similarity_index', extension: 'safetensors' }, 'index'],
    [{ type: 'vector_index', extension: 'safetensors' }, 'index'],
    [{ type: 'osd.json' }, 'json'],
    [{ type: 'weird', extension: 'hocr' }, 'hocr'],
    [{ type: 'weird', extension: 'bin' }, 'json'],
  ])('%o is shown by %s', (file, display) => {
    expect(displayFor(file)).toBe(display)
  })

  it('classifies files', () => {
    expect(isImage({ '@type': 'Image' })).toBe(true)
    expect(isTextLike({ type: 'ner.json' })).toBe(true)
    expect(isTextLike({ type: 'image' })).toBe(false)
    expect(isReference({ ref: '#1:0' })).toBe(true)
    expect(toRid('1:0')).toBe('#1:0')
    expect(ridParam('#1:0')).toBe('1:0')
  })
})

describe('browseQuery', () => {
  const context = {
    mode: 'set',
    set_rid: '#121:0',
    set_label: 'Letters',
    file_count: 12,
    skip: 3,
    source_rid: '#5:0',
    source_label: 'scan.pdf',
  }

  it('round-trips a set context through the URL', () => {
    const query = setContextToQuery(context)
    expect(query).toEqual({
      browseMode: 'set',
      setRid: '121:0',
      setLabel: 'Letters',
      fileCount: '12',
      skip: '3',
      sourceRid: '5:0',
      sourceLabel: 'scan.pdf',
    })
    expect(setContextFromQuery(query)).toEqual(context)
  })

  it('has no set context without browseMode=set or a set', () => {
    expect(setContextToQuery({ mode: 'search' })).toBeUndefined()
    expect(setContextFromQuery({})).toBeNull()
    expect(setContextFromQuery({ browseMode: 'set' })).toBeNull()
  })

  it('gives the position in a set or a result list', () => {
    expect(browsePosition(context)).toEqual({ index: 3, total: 12, hasPrev: true, hasNext: true })
    expect(browsePosition({ mode: 'search', index: 0, results: [{}, {}] })).toEqual({
      index: 0,
      total: 2,
      hasPrev: false,
      hasNext: true,
    })
    expect(browsePosition(null)).toBeNull()
  })
})

describe('lineage', () => {
  const path = [
    { '@rid': '#1:0', '@type': 'Project', label: 'Eka' },
    { '@rid': '#9:0', '@type': 'User' },
    { '@rid': '#2:0', '@type': 'File', type: 'image', label: 'scan.jpg' },
    { '@rid': '#3:0', '@type': 'Process', label: 'OCR' },
    { '@rid': '#4:0', '@type': 'File', type: 'ocr.json', label: 'scan.json' },
    { '@rid': '#6:0', '@type': 'File', type: 'zip' },
  ]

  it('hides users and sets and opens only files', () => {
    expect(visibleLineage(path).map((n) => n['@rid'])).not.toContain('#9:0')
    expect(isOpenable(path[2])).toBe(true)
    expect(isOpenable(path[3])).toBe(false)
    expect(isOpenable(path[5])).toBe(false)
    expect(nodeKind(path[2])).toBe('image')
    expect(nodeKind(path[3])).toBe('process')
  })

  it('counts file steps and finds the file at an offset', () => {
    expect(offsetInLineage(path, '#2:0', '#4:0')).toBe(-1)
    expect(fileAtOffset(path, '#4:0', -1)).toBe('#2:0')
    expect(fileAtOffset(path, '#4:0', -5)).toBe('#2:0')
    expect(fileAtOffset(path, '#4:0', 0)).toBe('#4:0')
    expect(fileAtOffset(path, '#missing', -1)).toBe('#missing')
  })

  it('names levels', () => {
    expect([0, 1, 2, 4].map(levelLabel)).toEqual([
      'current',
      'parent',
      'grandparent',
      'ancestor +4',
    ])
  })
})

describe('imageEdit', () => {
  it('normalises rotation', () => {
    expect(normalizeRotation(-90)).toBe(270)
    expect(normalizeRotation(450)).toBe(90)
  })

  it('maps a crop on the preview to image pixels, clamped', () => {
    const selection = rectBetween({ x: 50, y: 40 }, { x: 10, y: 20 })
    expect(selection).toEqual({ x: 10, y: 20, width: 40, height: 20 })
    expect(
      toImagePixels(selection, { width: 100, height: 50 }, { width: 1000, height: 500 }),
    ).toEqual({
      x: 100,
      y: 200,
      width: 400,
      height: 200,
    })
    expect(
      toImagePixels(
        { x: 90, y: 0, width: 50, height: 10 },
        { width: 100, height: 100 },
        { width: 100, height: 100 },
      ),
    ).toMatchObject({ width: 10 })
    expect(toImagePixels(null, { width: 1, height: 1 }, { width: 1, height: 1 })).toBeNull()
  })
})
