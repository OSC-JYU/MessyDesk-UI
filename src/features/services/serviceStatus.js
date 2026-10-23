// Reading the service registry (/api/services) and the active job list
// (/api/queue/jobs) for the services screens.

export function toServiceList(registry) {
  return Object.entries(registry || {})
    .map(([key, service]) => ({ ...service, id: service.id || key }))
    .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
}

export function isRunning(service) {
  return Array.isArray(service.consumers) && service.consumers.length > 0
}

export function serviceLocation(service) {
  if (service.nomad === true) return 'nomad'
  if (service.location === 'external') return 'external'
  if (service.local_url) return 'local'
  return service.location || 'unknown'
}

export function serviceSource(service) {
  return service.kind || (service.nomad ? 'nomad' : service.registration?.source || 'disk')
}

export function supportedTypes(services) {
  const types = new Set()
  for (const service of services) {
    for (const type of service.supported_types || []) types.add(type)
    for (const format of service.supported_formats || []) types.add(format)
  }
  return [...types].sort()
}

export function supportsType(service, type) {
  if (!type) return true
  return (
    (service.supported_types || []).includes(type) ||
    (service.supported_formats || []).includes(type)
  )
}

// Queue load per service id, summed over its active jobs.
export function loadByService(jobs) {
  const byService = {}
  for (const job of jobs || []) {
    const id = job.service_id || String(job.queue || '').replace(/_batch$/, '')
    byService[id] ??= { queued: 0, running: 0, total: 0, jobs: [] }
    byService[id].queued += Number(job.queued_files || 0)
    byService[id].running += Number(job.running_files || 0)
    byService[id].total += Number(job.total_files || 0)
    byService[id].jobs.push(job)
  }
  return byService
}

export const EMPTY_LOAD = Object.freeze({ queued: 0, running: 0, total: 0, jobs: [] })

export function lastSeenLabel(service, now = Date.now()) {
  const seen = service.registration?.last_seen
  const date = seen ? new Date(seen) : null
  if (!date || Number.isNaN(date.getTime())) return '—'
  const secs = Math.max(0, Math.floor((now - date.getTime()) / 1000))
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return date.toLocaleDateString()
}
