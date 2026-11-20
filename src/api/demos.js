// Demo desks ("Learn MessyDesk"): listing and import for users, management for admins.
// Thin wrappers over the Axios client in client.js, grouped by area.
import web from './client.js'

export const getDemos = (...args) => web.getDemos(...args)
export const importDemo = (...args) => web.importDemo(...args)
export const getAdminDemos = (...args) => web.getAdminDemos(...args)
export const createDemo = (...args) => web.createDemo(...args)
export const uploadDemoBundle = (...args) => web.uploadDemoBundle(...args)
export const updateDemo = (...args) => web.updateDemo(...args)
export const reexportDemo = (...args) => web.reexportDemo(...args)
export const uploadDemoCover = (...args) => web.uploadDemoCover(...args)
export const deleteDemo = (...args) => web.deleteDemo(...args)

// The cover is an image the browser loads itself; `version` changes when the demo does.
export function demoCoverUrl(demo) {
  const base = String(import.meta.env.VITE_API_PATH || '').replace(/\/$/, '')
  return `${base}/api/demos/${encodeURIComponent(demo.id)}/cover?v=${demo.version || 0}`
}

export function demoBundleUrl(demo) {
  const base = String(import.meta.env.VITE_API_PATH || '').replace(/\/$/, '')
  return `${base}/api/admin/demos/${encodeURIComponent(demo.id)}/bundle`
}
