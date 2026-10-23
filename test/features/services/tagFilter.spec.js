import { describe, expect, it } from 'vitest'
import { tagFilterPayload } from '@/features/services/crunchers/tagFilter.js'

const roi = [{ service_id: 'md-gliner2', task: 'extract', model: '', label: 'person' }]

describe('tagFilterPayload', () => {
  it('sends tags and ROI labels together', () => {
    expect(
      tagFilterPayload({
        mode: 'include',
        tags: [{ '@rid': '#30:1', label: 'a' }],
        roi,
        match: 'and',
        label: ' My set ',
      }),
    ).toEqual({
      selection_mode: 'include',
      selected_entity_rids: ['#30:1'],
      selected_roi_labels: roi,
      match: 'and',
      set_label: 'My set',
    })
  })

  it('sends no criteria for untagged files and always matches any for exclude', () => {
    const untagged = tagFilterPayload({
      mode: 'untagged',
      tags: [{ '@rid': '#1:1' }],
      roi,
      match: 'and',
    })
    expect(untagged.selected_entity_rids).toEqual([])
    expect(untagged.selected_roi_labels).toEqual([])
    expect(tagFilterPayload({ mode: 'exclude', tags: [], roi, match: 'and' }).match).toBe('or')
  })
})
