// The cruncher catalogue for one node (/api/services/files/{rid}): which
// services and filters can process it, grouped by category, and how a chosen
// task becomes the process request the queue expects.

// The four tool categories of the help pages (docs/help/3.tools.md).
export const CATEGORIES = [
  { value: 'preparation', title: 'Preparation & annotation', icon: 'mdi-content-cut' },
  { value: 'linguistic', title: 'Linguistic & statistical analysis', icon: 'mdi-alphabetical' },
  { value: 'ml', title: 'Task-specific machine learning', icon: 'mdi-brain' },
  { value: 'generative', title: 'Generative AI', icon: 'mdi-creation' },
]

const UNCATEGORIZED = {
  value: 'uncategorized',
  title: 'Uncategorized',
  icon: 'mdi-help-circle-outline',
}
const KNOWN = new Set(CATEGORIES.map((c) => c.value))
// Internal services; the backend already leaves them out, this is a second guard.
const SYSTEM = 'system'

export function categoryOf(item) {
  if (item.category === SYSTEM) return SYSTEM
  return KNOWN.has(item.category) ? item.category : UNCATEGORIZED.value
}

export function categoryTitle(value) {
  return [...CATEGORIES, UNCATEGORIZED].find((c) => c.value === value)?.title || UNCATEGORIZED.title
}

// Dropdown values can come as { key: label }; Vuetify wants [{ value, title }].
function normaliseValues(values) {
  if (values && typeof values === 'object' && !Array.isArray(values)) {
    return Object.entries(values).map(([value, title]) => ({ value, title }))
  }
  return values
}

// Returns usable services (tasks sorted by name, each with a `values` object
// holding the parameter defaults) and filters.
export function prepareCatalogue(result) {
  const services = (result?.for_format || [])
    .filter((service) => service.id !== 'thumbnailer' && Object.keys(service.tasks || {}).length)
    .filter((service) => categoryOf(service) !== SYSTEM)
    .map((service) => {
      const tasks = Object.entries(service.tasks)
        .sort(([, a], [, b]) => String(a.name).localeCompare(String(b.name)))
        .map(([key, task]) => {
          const params = {}
          const values = {}
          for (const [param, help] of Object.entries(task.params_help || {})) {
            params[param] = { ...help, values: normaliseValues(help.values) }
            values[param] = help.multi ? [] : help.default
          }
          return { ...task, key, params_help: task.params_help ? params : undefined, values }
        })
      return { ...service, tasks }
    })
  const filters = (Array.isArray(result?.filters) ? result.filters : []).filter(
    (filter) => categoryOf(filter) !== SYSTEM,
  )
  return { services, filters }
}

export function categoryTabs(catalogue) {
  const hasOther = [...catalogue.services, ...catalogue.filters].some(
    (item) => categoryOf(item) === UNCATEGORIZED.value,
  )
  return hasOther ? [...CATEGORIES, UNCATEGORIZED] : [...CATEGORIES]
}

export function inCategory(items, category) {
  return items.filter((item) => categoryOf(item) === category)
}

// Tasks and filters whose names or descriptions contain the query.
export function searchCatalogue(catalogue, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  const matches = (...parts) => parts.filter(Boolean).join(' ').toLowerCase().includes(needle)
  const results = []
  for (const service of catalogue.services) {
    for (const task of service.tasks) {
      if (
        matches(
          service.name,
          service.description,
          service.id,
          task.name,
          task.description,
          task.key,
        )
      ) {
        results.push({
          kind: 'task',
          key: `task:${service.id}:${task.key}`,
          service,
          task,
          name: task.name,
        })
      }
    }
  }
  for (const filter of catalogue.filters) {
    if (matches(filter.name, filter.description, filter.id)) {
      results.push({
        kind: 'filter',
        key: `filter:${filter.id}`,
        filter,
        name: filter.name || filter.id,
      })
    }
  }
  return results.sort((a, b) => String(a.name).localeCompare(String(b.name)))
}

// Fills {{param}} placeholders of a task's info text with the chosen values.
export function fillInfo(info, values) {
  let text = info
  for (const [key, value] of Object.entries(values || {})) {
    text = text.replaceAll(`{{${key}}}`, value ? value : 'Not given')
  }
  return text
}

// The process request for running `task` of `service`.
export function buildProcess(service, task, model) {
  const process = { service: service.id, id: task.key, params: task.values }
  if (model) process.model = model
  if (service.external_tasks) {
    process.name = task.name
    process.description = task.description
    process.system_params = task.system_params
  }
  if (task.output_type || task.json_schema) process.system_params ??= {}
  if (task.output_type) process.system_params.output_type = task.output_type
  if (task.json_schema) process.system_params.json_schema = task.json_schema
  if (task.info) process.info = fillInfo(task.info, task.values)
  return process
}

// Which queue endpoint runs a process for this node.
export function processTarget(nodeType, cruncherFilter) {
  const type = String(nodeType || '').toLowerCase()
  if (type === 'source') return 'source'
  if (type === 'set' || type.endsWith('-set')) return 'set'
  if (cruncherFilter === 'ROI') return 'roi'
  return 'file'
}
