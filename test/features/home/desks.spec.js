import { describe, it, expect } from 'vitest'
import { indexedDocsByProject, sortDesks, toDeskRow } from '@/features/home/desks.js'

const project = {
  '@rid': '#1:0',
  label: 'Eka',
  node_count: 6,
  expiration_date: '2027-03-28',
}

describe('toDeskRow', () => {
  it('formats a project for the desk list', () => {
    const row = toDeskRow(project, { '#1:0': 12 })
    expect(row).toMatchObject({
      rid: '#1:0',
      routeRid: '1:0',
      name: 'Eka',
      itemsText: '6 items',
      sizeText: 'No estimate yet',
      docsText: '12 docs',
    })
    expect(row.expires.getFullYear()).toBe(2027)
  })

  it('shows 0 docs for a project missing from loaded search info, n/a when not loaded', () => {
    expect(toDeskRow(project, {}).docsText).toBe('0 docs')
    expect(toDeskRow(project, null).docsText).toBe('n/a')
  })

  it('reads older size fields and converts bytes to MB', () => {
    expect(toDeskRow({ ...project, size_mb: 12.34 }).sizeText).toBe('12.3 MB')
    expect(toDeskRow({ ...project, size: 3 * 1024 * 1024 * 1024 }).sizeText).toBe('3072.0 MB')
  })

  it('names unnamed desks', () => {
    expect(toDeskRow({ '@rid': '#2:0' }).name).toBe('Untitled desk')
  })
})

describe('indexedDocsByProject', () => {
  it('maps project rids (with or without #) to doc counts', () => {
    const info = {
      project_counts: [
        { project_rid: '1:0', docs: 4 },
        { project_rid: '#3:0', docs: 'x' },
      ],
    }
    expect(indexedDocsByProject(info)).toEqual({ '#1:0': 4 })
  })
})

describe('sortDesks', () => {
  const rows = [
    toDeskRow({ '@rid': '#1:0', label: 'beta', node_count: 3, expiration_date: '2027-01-01' }),
    toDeskRow({ '@rid': '#2:0', label: 'Alpha', node_count: 10 }),
    toDeskRow({ '@rid': '#3:0', label: 'gamma', node_count: 1, expiration_date: '2026-12-01' }),
  ]
  const names = (list) => list.map((row) => row.name)

  it('sorts by name without regard to case', () => {
    expect(names(sortDesks(rows, 'name', 'asc'))).toEqual(['Alpha', 'beta', 'gamma'])
    expect(names(sortDesks(rows, 'name', 'desc'))).toEqual(['gamma', 'beta', 'Alpha'])
  })

  it('sorts by item count', () => {
    expect(names(sortDesks(rows, 'items', 'desc'))).toEqual(['Alpha', 'beta', 'gamma'])
  })

  it('puts desks without an expiry date last', () => {
    expect(names(sortDesks(rows, 'expires', 'asc'))).toEqual(['gamma', 'beta', 'Alpha'])
  })

  it('does not change the input', () => {
    const copy = [...rows]
    sortDesks(rows, 'items')
    expect(rows).toEqual(copy)
  })
})
