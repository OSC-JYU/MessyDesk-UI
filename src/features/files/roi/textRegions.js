// Text regions on the client. Offsets are Unicode code points, as the backend stores them
// (see MessyDesk modules/rois/text-regions.ts); the browser's strings are UTF-16, so every offset
// that comes from or goes to the DOM is converted here.

// UTF-16 index of every code point offset (length + 1 entries, the last one is the text length).
export function codePointIndex(text) {
  const index = []
  let unit = 0
  for (const char of text) {
    index.push(unit)
    unit += char.length
  }
  index.push(unit)
  return index
}

// Regions of a saved roi.json (a map or a list) as a list sorted by position.
export function regionsOf(data) {
  const rois = data?.rois ?? {}
  const list = Array.isArray(rois) ? rois : Object.values(rois)
  return list
    .filter((r) => Number.isInteger(r?.start) && Number.isInteger(r?.end) && r.end > r.start)
    .sort((a, b) => a.start - b.start || b.end - a.end)
}

// The text cut at every region boundary, so that overlapping and nested regions can be drawn:
// each segment lists the ids of the regions that cover it. Segments with no region are kept, so
// joining the segment texts gives back the whole text.
export function segmentsOf(text, regions) {
  const index = codePointIndex(text)
  const length = index.length - 1
  const cuts = new Set([0, length])
  for (const r of regions) {
    cuts.add(Math.max(0, Math.min(r.start, length)))
    cuts.add(Math.max(0, Math.min(r.end, length)))
  }
  const points = [...cuts].sort((a, b) => a - b)
  const segments = []
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    const ids = regions.filter((r) => r.start < end && r.end > start).map((r) => r.id)
    segments.push({ start, end, text: text.slice(index[start], index[end]), ids })
  }
  return segments
}

// A selection inside `root` (an element holding exactly the text) as code point offsets, or null
// when nothing is selected there.
export function selectionOffsets(root, text, selection = window.getSelection()) {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null
  const range = selection.getRangeAt(0)
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null
  const unitOffset = (container, offset) => {
    const before = document.createRange()
    before.selectNodeContents(root)
    before.setEnd(container, offset)
    return before.toString().length
  }
  const index = codePointIndex(text)
  const toCodePoint = (unit) => {
    // Binary search: the last code point that starts at or before the UTF-16 index.
    let low = 0
    let high = index.length - 1
    while (low < high) {
      const mid = Math.ceil((low + high) / 2)
      if (index[mid] <= unit) low = mid
      else high = mid - 1
    }
    return low
  }
  const start = toCodePoint(unitOffset(range.startContainer, range.startOffset))
  const end = toCodePoint(unitOffset(range.endContainer, range.endOffset))
  return end > start ? { start, end } : null
}

export function makeRegionId() {
  return `r_${Math.random().toString(36).slice(2, 10)}`
}
