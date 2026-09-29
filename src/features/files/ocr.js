// OCR results (ocr.json): [{ text, confidence, coordinates: [4 points] }]
// with coordinates relative to the image (0–1). Regions are put in reading
// order: top to bottom, and left to right within a line.

const SAME_LINE = 0.02

export function parseOcrRegions(data) {
  let items = data
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items)
    } catch {
      return []
    }
  }
  if (!Array.isArray(items)) return []
  return items
    .filter((item) => Array.isArray(item?.coordinates) && item.coordinates.length >= 3)
    .map((item) => {
      const [p0, p1, p2] = item.coordinates
      return {
        text: item.text,
        confidence: item.confidence,
        left: p0.x,
        top: p0.y,
        width: p1.x - p0.x,
        height: p2.y - p0.y,
        centerX: (p0.x + p2.x) / 2,
        centerY: (p0.y + p2.y) / 2,
      }
    })
    .sort((a, b) =>
      Math.abs(a.centerY - b.centerY) > SAME_LINE ? a.centerY - b.centerY : a.centerX - b.centerX,
    )
}
