// PAGE XML (page.xml, e.g. from nafrec): text regions with text lines, each
// with a polygon (Coords points="x,y x,y …") and its text (TextEquiv/Unicode).
// Any PAGE schema version: elements are matched by local name.

function children(element, name) {
  return Array.from(element?.children || []).filter((child) => child.localName === name)
}

function ownText(element) {
  const equiv = children(element, 'TextEquiv')[0]
  return children(equiv, 'Unicode')[0]?.textContent ?? ''
}

function parsePoints(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number))
    .filter((pair) => pair.length === 2 && pair.every(Number.isFinite))
}

function boundingBox(points) {
  if (!points.length) return null
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

function parseLine(element) {
  const points = parsePoints(children(element, 'Coords')[0]?.getAttribute('points'))
  return {
    id: element.getAttribute('id') || '',
    text: ownText(element),
    points: points.map(([x, y]) => `${x},${y}`).join(' '),
    box: boundingBox(points),
  }
}

export function parsePageXml(raw) {
  const empty = { width: 0, height: 0, imageFilename: '', regions: [], lines: [] }
  if (!raw || typeof raw !== 'string') return empty
  const doc = new DOMParser().parseFromString(raw, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) return empty
  const page = Array.from(doc.getElementsByTagNameNS('*', 'Page'))[0]
  if (!page) return empty

  const regions = []
  const lines = []
  for (const region of page.getElementsByTagNameNS('*', 'TextRegion')) {
    const regionLines = children(region, 'TextLine').map(parseLine)
    if (!regionLines.length) continue
    regions.push({ id: region.getAttribute('id') || '', lines: regionLines })
    lines.push(...regionLines)
  }
  return {
    width: Number(page.getAttribute('imageWidth')) || 0,
    height: Number(page.getAttribute('imageHeight')) || 0,
    imageFilename: page.getAttribute('imageFilename') || '',
    regions,
    lines,
  }
}

// The plain text: one line per TextLine, as MD-text-base_fs's pagexml2text writes it.
export function pageXmlText(page) {
  return page.lines.map((line) => line.text).join('\n')
}
