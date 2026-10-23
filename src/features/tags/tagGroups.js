// Grouping and labelling of machine tags and NER labels, which are both
// grouped by the service, task and model run that produced them.

export function groupByRun(tags) {
  const groups = new Map()
  for (const tag of tags || []) {
    const key = `${tag.service_id}:${tag.task}:${tag.model || ''}`
    if (!groups.has(key))
      groups.set(key, {
        key,
        service_id: tag.service_id,
        service_name: tag.service_name,
        task: tag.task,
        model: tag.model || null,
        tags: [],
      })
    groups.get(key).tags.push(tag)
  }
  return [...groups.values()]
}

// Service ids share an internal "md-" prefix and task ids are snake_case. A run with a model is
// named after the model and its provider, e.g. "gpt-5.1 (Azure OpenAI): autotag".
export function runLabel(group) {
  const service = String(group.service_id || '').replace(/^md-/, '')
  const task = String(group.task || '').replace(/_/g, ' ')
  if (group.model) return `${group.model} (${group.service_name || service}): ${task}`
  return `${service}: ${task}`
}

export function nerLabelKey(tag) {
  return `${tag.service_id}:${tag.task}:${tag.label}`
}

// Names of the desks a human tag belongs to, for the global view: "Desk A, Desk B +2".
export function deskHint(tag, max = 2) {
  const names = (tag?.desks || []).map((desk) => desk.label || desk.rid).filter(Boolean)
  if (!names.length) return ''
  const shown = names.slice(0, max).join(', ')
  return names.length > max ? `${shown} +${names.length - max}` : shown
}

// An ROI label criterion as the tag filter sends it; `model` is '' when the run had none.
export function roiCriterion(item) {
  return {
    service_id: item.service_id,
    task: item.task,
    model: item.model || '',
    label: item.label,
  }
}

export function roiKey(item) {
  const { service_id, task, model, label } = roiCriterion(item)
  return [service_id, task, model, label].join('|')
}

// "Tagged by Ann, Bob" from a file's tag (`tagged_by: [{ rid, name }]`); '' for machine-only tags.
export function taggedByText(entity) {
  const names = (entity?.tagged_by || []).map((user) => user.name || user.rid).filter(Boolean)
  return names.length ? `Tagged by ${names.join(', ')}` : ''
}
