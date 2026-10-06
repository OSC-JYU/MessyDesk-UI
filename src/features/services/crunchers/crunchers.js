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
          // Tasks without their own parameters (prompts) use the service's common ones.
          if (!task.params_help) {
            for (const [param, help] of Object.entries(service.params_help || {})) {
              values[param] = help.multi ? [] : help.default
            }
          }
          return { ...task, key, params_help: task.params_help ? params : undefined, values }
        })
      return { ...service, tasks }
    })
  const filters = (Array.isArray(result?.filters) ? result.filters : []).filter(
    (filter) => categoryOf(filter) !== SYSTEM,
  )
  return { services, filters, llm: llmEntries(services) }
}

// ---- LLM services --------------------------------------------------------------------------
// LLM services (`external_tasks`, one per provider) are not listed one by one. They make up one
// "AI prompts" entry, plus one entry per task of their own (such as "Tag with AI"), where the user
// picks the prompt, then the model, then the provider (MessyDesk plan/llm-adapter.md 4.5).

export function isLlmService(service) {
  return Boolean(service?.external_tasks)
}

// A user's prompt offered as a task, as opposed to a task of the descriptor.
export function isPromptTask(task) {
  return Boolean(task?.system_params)
}

const byName = (a, b) => String(a.name).localeCompare(String(b.name))

export function llmEntries(services) {
  const prompts = new Map()
  const fixed = new Map()
  for (const service of services.filter(isLlmService)) {
    for (const task of service.tasks) {
      const map = isPromptTask(task) ? prompts : fixed
      if (!map.has(task.key)) map.set(task.key, task)
    }
  }
  const entries = []
  if (prompts.size) {
    entries.push({
      key: 'llm:prompts',
      kind: 'prompts',
      name: 'AI prompts',
      description: 'Run one of your prompts with the language model and provider you choose',
      category: 'generative',
      tasks: [...prompts.values()].sort(byName),
    })
  }
  for (const [key, task] of [...fixed.entries()].sort(([, a], [, b]) => byName(a, b))) {
    entries.push({
      key: `llm:task:${key}`,
      kind: 'task',
      name: task.name,
      description: task.description,
      category: 'generative',
      tasks: [task],
    })
  }
  return entries
}

function modelFits(model, task) {
  if (!isPromptTask(task) || !task.type || !model?.supported_types?.length) return true
  return model.supported_types.includes(task.type)
}

const LOCATION_ORDER = { 'on-premise': 0 }

// The models that can run `task`, one per family (the same model from several providers shows
// once), each with the providers offering it, on-premise ones first.
export function llmModels(services, task) {
  const families = new Map()
  for (const service of services.filter(isLlmService)) {
    if (!service.tasks.some((t) => t.key === task?.key)) continue
    for (const [id, model] of Object.entries(service.models || {})) {
      if (!modelFits(model, task)) continue
      const family = model.family || model.name || id
      if (!families.has(family)) {
        families.set(family, {
          family,
          name: model.name || id,
          description: model.description || '',
          supported_types: model.supported_types || [],
          offers: [],
        })
      }
      families.get(family).offers.push({ service, modelId: id, model })
    }
  }
  for (const entry of families.values()) {
    entry.offers.sort(
      (a, b) =>
        (LOCATION_ORDER[a.service.location] ?? 1) - (LOCATION_ORDER[b.service.location] ?? 1) ||
        String(a.service.name).localeCompare(String(b.service.name)),
    )
  }
  return [...families.values()].sort(byName)
}

// The provider's own copy of the task (its parameter values are kept per service).
export function providerTask(service, task) {
  return service?.tasks?.find((t) => t.key === task?.key) || null
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
  for (const entry of catalogue.llm || []) {
    for (const task of entry.tasks) {
      if (
        matches(entry.name, entry.description, task.name, task.description, task.content, task.key)
      ) {
        results.push({ kind: 'llm', key: `${entry.key}:${task.key}`, entry, task, name: task.name })
      }
    }
  }
  for (const service of catalogue.services) {
    if (isLlmService(service)) continue
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
  if (service.external_tasks && isPromptTask(task)) {
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
