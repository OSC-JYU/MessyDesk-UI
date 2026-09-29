// Reading hOCR: bounding boxes and image names are in element titles, e.g.
// title="image 'page.jpg'; bbox 10 20 110 60".

export function bboxFromTitle(title) {
  const match = /bbox\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/.exec(String(title || ''))
  if (!match) return null
  const [x1, y1, x2, y2] = match.slice(1).map(Number)
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}

export function imageNameFromTitle(title) {
  const match = /image\s+(["'])(.*?)\1/.exec(String(title || ''))
  return match ? match[2].split('/').pop() : ''
}

// The contents of <body>, or the whole text when there is no body.
export function hocrBody(html) {
  const text = String(html || '')
  const start = text.indexOf('<body')
  if (start < 0) return text
  const open = text.indexOf('>', start) + 1
  const end = text.lastIndexOf('</body>')
  return text.slice(open, end < 0 ? undefined : end)
}
