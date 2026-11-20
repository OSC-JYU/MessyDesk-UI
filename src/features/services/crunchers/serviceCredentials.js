import { getServices } from '@/api/services.js'

// The credential field definitions of a service that asks the user for several credentials per
// run, looked up by service id (a `_batch`/`_fs` queue name is accepted too). Returns [] when the
// service has none or the lookup fails, so callers fall back to the single API key dialog.
export async function loadCredentialFields(serviceId) {
  if (!serviceId) return []
  try {
    const registry = (await getServices()) || {}
    const id = String(serviceId)
    const service = registry[id] || registry[id.replace(/_(fs|batch)$/, '')]
    const fields = service?.credentials
    return service?.api_key_source === 'user' && Array.isArray(fields) ? fields : []
  } catch {
    return []
  }
}
