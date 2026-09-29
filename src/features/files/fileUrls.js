import { ridParam } from './fileTypes.js'

const base = () => String(import.meta.env.VITE_API_PATH || '').replace(/\/$/, '')

// The file itself, as the browser can open or download it.
export function fileUrl(rid) {
  return `${base()}/api/files/${ridParam(rid)}`
}

// The image-sized preview of a file, served by path. `version` busts the
// browser cache after an edit.
export function previewUrl(path, version) {
  if (!path) return ''
  const url = `${base()}/api/thumbnails/${path}`
  return version ? `${url}?v=${version}` : url
}

// The preview the backend keeps in a file's folder.
export function folderPreviewUrl(path) {
  const dir = String(path || '').substring(0, String(path || '').lastIndexOf('/'))
  return dir ? `${base()}/api/thumbnails/${dir}` : ''
}
