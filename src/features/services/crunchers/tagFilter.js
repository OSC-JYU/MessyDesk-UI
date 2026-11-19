// The request of the tag filter (`mdf-set-filter`): tags and ROI labels are combined in one match.
export function tagFilterPayload({ mode, tags, roi, match, label, level }) {
  const untagged = mode === 'untagged'
  const payload = {
    selection_mode: mode,
    selected_entity_rids: untagged ? [] : tags.map((tag) => tag['@rid']),
    selected_roi_labels: untagged ? [] : roi,
    match: mode === 'include' ? match : 'or',
  }
  // Whole-file tags are the default; the server only needs to hear about the other choices.
  if (level === 'passage' || level === 'any') payload.tag_level = level
  if (String(label || '').trim()) payload.set_label = label.trim()
  return payload
}
