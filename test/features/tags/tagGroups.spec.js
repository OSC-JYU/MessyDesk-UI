import { describe, it, expect } from 'vitest'
import { groupByRun, manualTagTypes, nerLabelKey, runLabel } from '@/features/tags/tagGroups.js'

describe('tagGroups', () => {
  it('groups tags by the service and task that made them', () => {
    const groups = groupByRun([
      { service_id: 'md-gliner2', task: 'extract_entities', label: 'person' },
      { service_id: 'md-gliner2', task: 'extract_entities', label: 'place' },
      { service_id: 'md-lingua', task: 'detect_language', label: 'fi' },
    ])
    expect(groups.map((g) => [g.key, g.tags.length])).toEqual([
      ['md-gliner2:extract_entities', 2],
      ['md-lingua:detect_language', 1],
    ])
    expect(runLabel(groups[0])).toBe('gliner2: extract entities')
  })

  it('keys NER labels by run and label', () => {
    expect(nerLabelKey({ service_id: 's', task: 't', label: 'person' })).toBe('s:t:person')
  })

  it('lists manual tags only, filtered by label, dropping empty types', () => {
    const types = [
      {
        type: 'Person',
        items: [{ label: 'Alvar Aalto' }, { label: 'Auto', created_by: 'machine' }],
      },
      { type: 'Place', items: [{ label: 'Jyväskylä' }] },
      { type: 'Machine', items: [{ label: 'fi', created_by: 'machine' }] },
    ]
    expect(manualTagTypes(types).map((t) => [t.type, t.items.length])).toEqual([
      ['Person', 1],
      ['Place', 1],
    ])
    expect(manualTagTypes(types, 'aalto').map((t) => t.type)).toEqual(['Person'])
  })
})
