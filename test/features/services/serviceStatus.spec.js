import { describe, it, expect } from 'vitest'
import {
  isRunning,
  lastSeenLabel,
  loadByService,
  serviceLocation,
  serviceSource,
  supportedTypes,
  supportsType,
  toServiceList,
} from '@/features/services/serviceStatus.js'

describe('serviceStatus', () => {
  it('lists services sorted by name, filling in ids from keys', () => {
    const list = toServiceList({ 'md-b': { name: 'Beta' }, 'md-a': { id: 'md-a', name: 'Alpha' } })
    expect(list.map((s) => s.id)).toEqual(['md-a', 'md-b'])
  })

  it('is running only with consumers', () => {
    expect(isRunning({ consumers: ['x'] })).toBe(true)
    expect(isRunning({ consumers: [] })).toBe(false)
    expect(isRunning({})).toBe(false)
  })

  it.each([
    [{ nomad: true }, 'nomad'],
    [{ location: 'external' }, 'external'],
    [{ local_url: 'http://x' }, 'local'],
    [{}, 'unknown'],
  ])('location of %o is %s', (service, location) => {
    expect(serviceLocation(service)).toBe(location)
  })

  it('names the source of a service', () => {
    expect(serviceSource({ kind: 'external' })).toBe('external')
    expect(serviceSource({ registration: { source: 'explicit-descriptor' } })).toBe(
      'explicit-descriptor',
    )
    expect(serviceSource({})).toBe('disk')
  })

  it('collects supported types and formats and filters by them', () => {
    const services = [
      { supported_types: ['image'], supported_formats: ['png'] },
      { supported_formats: ['txt'] },
    ]
    expect(supportedTypes(services)).toEqual(['image', 'png', 'txt'])
    expect(supportsType(services[1], 'txt')).toBe(true)
    expect(supportsType(services[1], 'image')).toBe(false)
    expect(supportsType(services[1], null)).toBe(true)
  })

  it('sums queue load per service, including batch queues', () => {
    const load = loadByService([
      { service_id: 'md-a', queued_files: 2, running_files: 1, total_files: 3 },
      { queue: 'md-a_batch', queued_files: '4', total_files: 4 },
    ])
    expect(load['md-a']).toMatchObject({ queued: 6, running: 1, total: 7 })
    expect(load['md-a'].jobs).toHaveLength(2)
  })

  it('says when a service was last seen', () => {
    const now = Date.parse('2026-09-29T12:00:00Z')
    const at = (iso) => ({ registration: { last_seen: iso } })
    expect(lastSeenLabel(at('2026-09-29T11:59:30Z'), now)).toBe('30s ago')
    expect(lastSeenLabel(at('2026-09-29T11:30:00Z'), now)).toBe('30m ago')
    expect(lastSeenLabel(at('2026-09-29T09:00:00Z'), now)).toBe('3h ago')
    expect(lastSeenLabel({}, now)).toBe('—')
  })
})
