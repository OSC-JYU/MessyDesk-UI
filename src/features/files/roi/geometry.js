// Regions of interest (ROIs) are stored in percent of the image:
//   rect    { left, top, width, height }
//   circle  { cx, cy, r }          r in percent of the shorter image side
//   polygon { points: [{ xPct, yPct }] }
// These helpers convert to and from pixels of the shown image ({ width, height }).

export const MIN_SIZE_PX = 12

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export function makeShapeId() {
  return `roi_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

export function rectPx(shape, size) {
  return {
    x: (shape.left / 100) * size.width,
    y: (shape.top / 100) * size.height,
    width: (shape.width / 100) * size.width,
    height: (shape.height / 100) * size.height,
  }
}

export function circlePx(shape, size) {
  return {
    cx: (shape.cx / 100) * size.width,
    cy: (shape.cy / 100) * size.height,
    r: (shape.r / 100) * Math.min(size.width, size.height),
  }
}

export function pointPx(point, size) {
  return { x: (point.xPct / 100) * size.width, y: (point.yPct / 100) * size.height }
}

export function polygonPoints(points, size) {
  return points
    .map((p) => pointPx(p, size))
    .map(({ x, y }) => `${x},${y}`)
    .join(' ')
}

// Where to put a shape's label: its centre (polygon centroid).
export function labelPosition(shape, size) {
  if (shape.type === 'rect') {
    const r = rectPx(shape, size)
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }
  if (shape.type === 'circle') {
    const c = circlePx(shape, size)
    return { x: c.cx, y: c.cy }
  }
  const pts = (shape.points || []).map((p) => pointPx(p, size))
  if (!pts.length) return { x: 0, y: 0 }
  if (pts.length < 3) return pts[0]
  let area = 0
  let cx = 0
  let cy = 0
  pts.forEach((p1, i) => {
    const p2 = pts[(i + 1) % pts.length]
    const cross = p1.x * p2.y - p2.x * p1.y
    area += cross
    cx += (p1.x + p2.x) * cross
    cy += (p1.y + p2.y) * cross
  })
  area /= 2
  return area ? { x: cx / (6 * area), y: cy / (6 * area) } : pts[0]
}

// The largest radius (px) a circle centred at `center` can have inside the image.
export function maxRadiusPx(center, size) {
  return Math.min(center.x, size.width - center.x, center.y, size.height - center.y)
}

// A new rect or circle being drawn from `start` to `point` (both
// { x, y, xPct, yPct } in the shown image).
export function draftShape(tool, start, point, size, base) {
  if (tool === 'rect') {
    return {
      ...base,
      left: Math.min(start.xPct, point.xPct),
      top: Math.min(start.yPct, point.yPct),
      width: Math.abs(point.xPct - start.xPct),
      height: Math.abs(point.yPct - start.yPct),
    }
  }
  const radius = Math.min(
    Math.hypot(point.x - start.x, point.y - start.y),
    maxRadiusPx(start, size),
  )
  return { ...base, r: (radius / Math.min(size.width, size.height)) * 100 }
}

export function isBigEnough(shape, size) {
  if (shape.type === 'rect') {
    const r = rectPx(shape, size)
    return r.width >= MIN_SIZE_PX && r.height >= MIN_SIZE_PX
  }
  if (shape.type === 'circle') return circlePx(shape, size).r * 2 >= MIN_SIZE_PX
  return (shape.points || []).length >= 3
}

// The shape after dragging it (or one of its handles) by `delta`
// ({ xPct, yPct, x, y } between the start point and now).
export function dragShape(base, drag, delta, current, size) {
  const shape = structuredClone(base)
  if (drag.type === 'move') {
    if (shape.type === 'rect') {
      shape.left = clamp(base.left + delta.xPct, 0, 100 - base.width)
      shape.top = clamp(base.top + delta.yPct, 0, 100 - base.height)
    } else if (shape.type === 'circle') {
      const r = (base.r / 100) * Math.min(size.width, size.height)
      shape.cx =
        (clamp(((base.cx + delta.xPct) / 100) * size.width, r, size.width - r) / size.width) * 100
      shape.cy =
        (clamp(((base.cy + delta.yPct) / 100) * size.height, r, size.height - r) / size.height) *
        100
    } else {
      shape.points = base.points.map((p) => ({
        xPct: clamp(p.xPct + delta.xPct, 0, 100),
        yPct: clamp(p.yPct + delta.yPct, 0, 100),
      }))
    }
  } else if (drag.type === 'resize-rect') {
    const minW = (MIN_SIZE_PX / size.width) * 100
    const minH = (MIN_SIZE_PX / size.height) * 100
    if (drag.handle.includes('right'))
      shape.width = clamp(base.width + delta.xPct, minW, 100 - base.left)
    if (drag.handle.includes('left')) {
      shape.left = clamp(base.left + delta.xPct, 0, base.left + base.width - minW)
      shape.width = clamp(base.width - delta.xPct, minW, base.left + base.width)
    }
    if (drag.handle.includes('bottom'))
      shape.height = clamp(base.height + delta.yPct, minH, 100 - base.top)
    if (drag.handle.includes('top')) {
      shape.top = clamp(base.top + delta.yPct, 0, base.top + base.height - minH)
      shape.height = clamp(base.height - delta.yPct, minH, base.top + base.height)
    }
  } else if (drag.type === 'resize-circle') {
    const center = pointPx({ xPct: base.cx, yPct: base.cy }, size)
    const r = Math.min(
      Math.max(MIN_SIZE_PX / 2, Math.hypot(current.x - center.x, current.y - center.y)),
      maxRadiusPx(center, size),
    )
    shape.r = clamp((r / Math.min(size.width, size.height)) * 100, 0, 100)
  } else if (drag.type === 'move-point') {
    shape.points = base.points.map((p, i) =>
      i === drag.pointIndex
        ? { xPct: clamp(p.xPct + delta.xPct, 0, 100), yPct: clamp(p.yPct + delta.yPct, 0, 100) }
        : p,
    )
  }
  return shape
}

export function rectHandles(shape, size) {
  const r = rectPx(shape, size)
  return [
    { key: 'top-left', x: r.x, y: r.y },
    { key: 'top-right', x: r.x + r.width, y: r.y },
    { key: 'bottom-left', x: r.x, y: r.y + r.height },
    { key: 'bottom-right', x: r.x + r.width, y: r.y + r.height },
  ]
}

// ROIs from the API: an array, or a map { id: shape } (possibly under `rois`).
export function normalizeRois(rois) {
  if (!rois) return []
  if (Array.isArray(rois))
    return rois.map((r) => ({ ...r, id: r.id || r['@rid'] || makeShapeId() }))
  const map = rois.rois && typeof rois.rois === 'object' ? rois.rois : rois
  return Object.entries(map)
    .filter(([, data]) => data && typeof data === 'object')
    .map(([id, data]) => ({
      ...data,
      id: id || data.id || data['@rid'] || makeShapeId(),
      '@rid': data['@rid'] || id,
    }))
}

export function roiFileRid(rois) {
  return rois && typeof rois === 'object' ? rois['@rid'] || rois.rid || rois.roi_rid || null : null
}

// Shapes as the map the API saves.
export function shapesToMap(shapes) {
  return Object.fromEntries(
    shapes.map((shape) => {
      const id = shape['@rid'] || shape.id || makeShapeId()
      return [id, { ...shape, id, '@rid': id }]
    }),
  )
}
