// Line segmentation results (polygons.json):
// { line_polygons: [[[x, y], …], …], line_confs: [], line_boxes: [[x1, y1, x2, y2]],
//   image_shape: [height, width], source_path?, source_rid? }

export function parseLineSegments(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw || {}
  const polygons = data.line_polygons || []
  const confidences = data.line_confs || []
  const boxes = data.line_boxes || []
  const [height = 0, width = 0] = data.image_shape || []
  return {
    width,
    height,
    lines: polygons.map((polygon, index) => {
      const box = boxes[index]
      return {
        points: polygon.map(([x, y]) => `${x},${y}`).join(' '),
        confidence: confidences[index] ?? null,
        size: box ? { width: box[2] - box[0], height: box[3] - box[1] } : null,
      }
    }),
    sourcePath: data.source_path || data.image_path || data.source?.path || null,
    sourceRid: data.source_rid || data.source?.['@rid'] || null,
  }
}

// The nearest image among a file's ancestors, or a PDF when there is no image.
export function imageAncestorPath(ancestors) {
  const list = Array.isArray(ancestors) ? ancestors : []
  const kind = (item) => String(item?.type || '').toLowerCase()
  return (
    (list.find((a) => kind(a) === 'image') || list.find((a) => kind(a) === 'pdf'))?.path || null
  )
}
