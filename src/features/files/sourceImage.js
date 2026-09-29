import { getNodePath } from '@/api/projects.js'
import { isImage } from './fileTypes.js'

// The image a derived file (OCR text, face data, …) was made from: the
// nearest image before it in its lineage.
export async function sourceImageOf(file) {
  const path = (await getNodePath(file['@rid'])) || []
  const at = path.findIndex((node) => node['@rid'] === file['@rid'])
  const before = at < 0 ? path : path.slice(0, at)
  return [...before].reverse().find((node) => isImage(node)) || null
}
