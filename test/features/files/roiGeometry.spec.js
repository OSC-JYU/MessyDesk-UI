import { describe, it, expect } from 'vitest'
import {
  circlePx,
  dragShape,
  draftShape,
  isBigEnough,
  labelPosition,
  normalizeRois,
  polygonPoints,
  rectHandles,
  rectPx,
  roiFileRid,
  shapesToMap,
} from '@/features/files/roi/geometry.js'

const size = { width: 200, height: 100 }
const rect = { id: 'r', type: 'rect', left: 10, top: 20, width: 50, height: 40 }
const circle = { id: 'c', type: 'circle', cx: 50, cy: 50, r: 10 }
const poly = {
  id: 'p',
  type: 'polygon',
  points: [
    { xPct: 0, yPct: 0 },
    { xPct: 50, yPct: 0 },
    { xPct: 0, yPct: 50 },
  ],
}

describe('ROI geometry', () => {
  it('converts percent shapes to pixels', () => {
    expect(rectPx(rect, size)).toEqual({ x: 20, y: 20, width: 100, height: 40 })
    expect(circlePx(circle, size)).toEqual({ cx: 100, cy: 50, r: 10 })
    expect(polygonPoints(poly.points, size)).toBe('0,0 100,0 0,50')
    expect(rectHandles(rect, size).map((h) => h.key)).toEqual([
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ])
  })

  it('places labels in the middle of shapes', () => {
    expect(labelPosition(rect, size)).toEqual({ x: 70, y: 40 })
    expect(labelPosition(circle, size)).toEqual({ x: 100, y: 50 })
    const centroid = labelPosition(poly, size)
    expect(centroid.x).toBeCloseTo(100 / 3)
    expect(centroid.y).toBeCloseTo(50 / 3)
  })

  it('draws rects and circles from a drag', () => {
    const start = { x: 20, y: 10, xPct: 10, yPct: 10 }
    const end = { x: 60, y: 50, xPct: 30, yPct: 50 }
    expect(draftShape('rect', end, start, size, { type: 'rect' })).toMatchObject({
      left: 10,
      top: 10,
      width: 20,
      height: 40,
    })
    const c = draftShape(
      'circle',
      { x: 100, y: 50, xPct: 50, yPct: 50 },
      { x: 130, y: 90, xPct: 65, yPct: 90 },
      size,
      { type: 'circle' },
    )
    expect(c.r).toBe(50) // clamped to the image edge: 50 px of a 100 px short side
  })

  it('ignores shapes too small to use', () => {
    expect(isBigEnough({ type: 'rect', left: 0, top: 0, width: 5, height: 50 }, size)).toBe(false)
    expect(isBigEnough(rect, size)).toBe(true)
    expect(isBigEnough({ type: 'polygon', points: [{}, {}] }, size)).toBe(false)
  })

  it('moves and resizes shapes inside the image', () => {
    expect(dragShape(rect, { type: 'move' }, { xPct: 80, yPct: -30 }, null, size)).toMatchObject({
      left: 50,
      top: 0,
    })
    expect(
      dragShape(
        rect,
        { type: 'resize-rect', handle: 'bottom-right' },
        { xPct: 10, yPct: 10 },
        null,
        size,
      ),
    ).toMatchObject({ width: 60, height: 50 })
    expect(
      dragShape(
        rect,
        { type: 'resize-rect', handle: 'top-left' },
        { xPct: 5, yPct: 5 },
        null,
        size,
      ),
    ).toMatchObject({
      left: 15,
      top: 25,
      width: 45,
      height: 35,
    })
    const moved = dragShape(
      poly,
      { type: 'move-point', pointIndex: 1 },
      { xPct: 10, yPct: 10 },
      null,
      size,
    )
    expect(moved.points[1]).toEqual({ xPct: 60, yPct: 10 })
    expect(moved.points[0]).toEqual(poly.points[0])
    expect(rect.left).toBe(10) // the original is not changed
  })

  it('reads ROIs from the API and writes them back as a map', () => {
    const shapes = normalizeRois({ '@rid': '#77:0', rois: { a: { type: 'rect', label: 'A' } } })
    expect(shapes).toEqual([{ type: 'rect', label: 'A', id: 'a', '@rid': 'a' }])
    expect(roiFileRid({ '@rid': '#77:0' })).toBe('#77:0')
    expect(normalizeRois([{ '@rid': 'x' }])[0].id).toBe('x')
    expect(normalizeRois(null)).toEqual([])
    expect(shapesToMap([{ id: 'a', type: 'rect' }])).toEqual({
      a: { id: 'a', '@rid': 'a', type: 'rect' },
    })
  })
})
