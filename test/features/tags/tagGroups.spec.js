import { describe, it, expect } from 'vitest'
import { groupByRun, nerLabelKey, runLabel } from '@/features/tags/tagGroups.js'

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

})
