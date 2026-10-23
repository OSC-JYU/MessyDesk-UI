// Quick edits of images in the browser: the crop rectangle drawn on the
// preview mapped to image pixels, and rotating or cropping the image data.

export function normalizeRotation(degrees) {
  const mod = Number(degrees || 0) % 360
  return mod < 0 ? mod + 360 : mod
}

export function rectBetween(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

// Maps a rectangle on the shown image (display pixels) to the original
// image (natural pixels), clamped to the image.
export function toImagePixels(selection, display, natural) {
  if (!selection || !display.width || !display.height || !natural.width || !natural.height)
    return null
  const sx = natural.width / display.width
  const sy = natural.height / display.height
  const x = Math.max(0, Math.round(selection.x * sx))
  const y = Math.max(0, Math.round(selection.y * sy))
  return {
    x,
    y,
    width: Math.max(1, Math.min(natural.width - x, Math.round(selection.width * sx))),
    height: Math.max(1, Math.min(natural.height - y, Math.round(selection.height * sy))),
  }
}

function loadImage(blob) {
  const url = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

function canvasToBlob(canvas, type, fallback) {
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b || fallback), type || 'image/png', 0.95),
  )
}

export async function rotateBlob(blob, degrees) {
  const angle = normalizeRotation(degrees)
  if (!angle) return blob
  const { img, url } = await loadImage(blob)
  try {
    const canvas = document.createElement('canvas')
    const swap = angle === 90 || angle === 270
    canvas.width = swap ? img.height : img.width
    canvas.height = swap ? img.width : img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return blob
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((angle * Math.PI) / 180)
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
    return await canvasToBlob(canvas, blob.type, blob)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function cropBlob(blob, crop) {
  if (!crop?.width || !crop?.height) return blob
  const { img, url } = await loadImage(blob)
  try {
    const x = Math.max(0, Math.round(crop.x || 0))
    const y = Math.max(0, Math.round(crop.y || 0))
    const width = Math.max(1, Math.min(img.width - x, Math.round(crop.width)))
    const height = Math.max(1, Math.min(img.height - y, Math.round(crop.height)))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return blob
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
    return await canvasToBlob(canvas, blob.type, blob)
  } finally {
    URL.revokeObjectURL(url)
  }
}
