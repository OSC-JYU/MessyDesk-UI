// Grouping and labelling of machine tags and NER labels, which are both
// grouped by the service and task run that produced them.

export function groupByRun(tags) {
  const groups = new Map()
  for (const tag of tags || []) {
    const key = `${tag.service_id}:${tag.task}`
    if (!groups.has(key))
      groups.set(key, { key, service_id: tag.service_id, task: tag.task, tags: [] })
    groups.get(key).tags.push(tag)
  }
  return [...groups.values()]
}

// Service ids share an internal "md-" prefix and task ids are snake_case.
export function runLabel(group) {
  const service = String(group.service_id || '').replace(/^md-/, '')
  const task = String(group.task || '').replace(/_/g, ' ')
  return `${service}: ${task}`
}

export function nerLabelKey(tag) {
  return `${tag.service_id}:${tag.task}:${tag.label}`
}

// Manual tag types, without tags created by machines (those are listed as
// machine tags), filtered by label text.
export function manualTagTypes(types, search = '') {
  const needle = String(search || '')
    .trim()
    .toLowerCase()
  return (types || [])
    .map((type) => ({
      ...type,
      items: (type.items || []).filter(
        (item) =>
          item.created_by !== 'machine' &&
          (!needle ||
            String(item.label || '')
              .toLowerCase()
              .includes(needle)),
      ),
    }))
    .filter((type) => type.items.length)
}
