import { describe, expect, it } from 'vitest'
import {
  codePointIndex,
  regionsOf,
  segmentsOf,
  selectionOffsets,
} from '@/features/files/roi/textRegions.js'

const text = 'Hei 😀 maailma'

describe('text regions', () => {
  it('maps code point offsets to UTF-16 indexes', () => {
    const index = codePointIndex(text)
    expect(index.length).toBe([...text].length + 1)
    expect(index[4]).toBe(4)
    expect(index[5]).toBe(6) // the emoji takes two UTF-16 units
    expect(index.at(-1)).toBe(text.length)
  })

  it('reads regions from a map or a list and drops broken ones', () => {
    const a = { id: 'a', start: 4, end: 5 }
    const b = { id: 'b', start: 0, end: 3 }
    expect(regionsOf({ rois: { a, b } }).map((r) => r.id)).toEqual(['b', 'a'])
    expect(regionsOf({ rois: [a, { id: 'x', start: 2, end: 2 }, { id: 'y' }] })).toEqual([a])
    expect(regionsOf(null)).toEqual([])
  })

  it('cuts the text at region boundaries and keeps all of it', () => {
    const segments = segmentsOf(text, [
      { id: 'outer', start: 0, end: 7 },
      { id: 'inner', start: 4, end: 5 },
    ])
    expect(segments.map((s) => s.text).join('')).toBe(text)
    expect(segments.map((s) => [s.text, s.ids])).toEqual([
      ['Hei ', ['outer']],
      ['😀', ['outer', 'inner']],
      [' m', ['outer']],
      ['aailma', []],
    ])
  })

  it('has one unmarked segment for a text without regions', () => {
    expect(segmentsOf('abc', [])).toEqual([{ start: 0, end: 3, text: 'abc', ids: [] }])
  })

  it('turns a selection into code point offsets', () => {
    const root = document.createElement('pre')
    root.innerHTML = '<span>Hei </span><span>😀 maailma</span>'
    document.body.append(root)
    const range = document.createRange()
    range.setStart(root.firstChild.firstChild, 2) // inside "Hei "
    range.setEnd(root.lastChild.firstChild, 2) // after the emoji (2 UTF-16 units)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    expect(selectionOffsets(root, text)).toEqual({ start: 2, end: 5 })
    selection.removeAllRanges()
    expect(selectionOffsets(root, text)).toBeNull()
    root.remove()
  })
})
