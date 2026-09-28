<script setup>
import { computed, nextTick, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import web from '../web.js'
import { store } from './Store.js'
import SetPanel from './displays/SetPanel.vue'
import JYUHeader_main from './JYUHeader_main.vue'

document.title = 'MessyDesk - tags'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  projectRid: { type: String, default: null }
})

const isStandaloneRoute = computed(() => ['search', 'entities', 'tags'].includes(String(route.name || '')))

const stateKey = computed(() => {
  const current = props.projectRid || route.params.rid || 'global'
  return String(current).replace('#', '')
})

const filesPerPage = 24

const state = reactive({
  types: [],
  entity_schema: [],
  selected_entities: [],
  machine_tags: [],
  tag_mentions: {},
  global_search: '',
  mention_preview: { tagKey: null, loading: false, error: null, fileRid: null, fileLabel: null, mentionText: null, html: '' },
  items: [],
  projects: [],
  selected_projects: [],
  project_input: '',
  panelOpen: false,
  page: 1,
  projectFilterIgnored: false,

  add: false,
  current_type: '',
  new_label: '',
})

function applySavedState(savedState) {
  state.selected_entities = Array.isArray(savedState?.selected_entities) ? savedState.selected_entities : []
  state.items = Array.isArray(savedState?.items) ? savedState.items : []
  state.panelOpen = Boolean(savedState?.panelOpen)
  state.page = savedState?.page || 1
  state.projectFilterIgnored = Boolean(savedState?.projectFilterIgnored)
  state.add = Boolean(savedState?.add)
  state.current_type = savedState?.current_type || ''
  state.new_label = savedState?.new_label || ''
  state.global_search = savedState?.global_search || ''
}

function getSavedProjectRids(savedState) {
  if (!savedState || !Array.isArray(savedState.selectedProjectRids)) return null
  return savedState.selectedProjectRids
}

function getEntitiesPageStates() {
  if (!store.entities_page_states) {
    store.entities_page_states = {}
  }
  return store.entities_page_states
}

function saveState() {
  const key = stateKey.value
  const buckets = getEntitiesPageStates()
  buckets[key] = {
    selected_entities: state.selected_entities,
    items: state.items,
    panelOpen: state.panelOpen,
    page: state.page,
    projectFilterIgnored: state.projectFilterIgnored,
    add: state.add,
    current_type: state.current_type,
    new_label: state.new_label,
    global_search: state.global_search,
    selectedProjectRids: state.selected_projects.map((p) => p.value)
  }
}

const selectedProjectRids = computed(() => {
  if (state.selected_projects.length > 0) {
    return state.selected_projects.map((p) => p.value)
  }

  const current = props.projectRid || route.params.rid || ''
  return current ? ['#' + String(current).replace('#', '')] : []
})

const navigationProjectRid = computed(() => {
  const current = props.projectRid || route.params.rid || ''
  if (current) return '#' + String(current).replace('#', '')
  if (selectedProjectRids.value.length === 1) return selectedProjectRids.value[0]
  return ''
})

// Opened from within a project (project-entities route / projectRid prop): the project context
// is fixed by that route, so there's nothing to pick - project selection only makes sense when
// browsing tags from the standalone /entities page.
const hasFixedProjectContext = computed(() => Boolean(props.projectRid || route.params.rid))

const totalPages = computed(() => Math.max(1, Math.ceil(state.items.length / filesPerPage)))
const visibleItems = computed(() => {
  const start = (state.page - 1) * filesPerPage
  return state.items.slice(start, start + filesPerPage)
})

const panelSetData = computed(() => ({
  mode: 'flat',
  file_count: state.items.length,
  group_count: 0,
}))

const panelNode = computed(() => {

  return {
    label: state.selected_entities.length
      ? `Tags: ${state.selected_entities.map(e => e.label).join(', ')}`
      : 'Tag results'
  }
})

// Machine/NER tags (\u00a76) are grouped by the service+task run that produced them, so a user
// always knows which tool found a given label rather than mixing them in with manual tags.
const machineTagGroups = computed(() => {
  const groups = new Map()
  for (const tag of state.machine_tags) {
    const key = `${tag.service_id}:${tag.task}`
    if (!groups.has(key)) groups.set(key, { key, service_id: tag.service_id, task: tag.task, tags: [] })
    groups.get(key).tags.push(tag)
  }
  return Array.from(groups.values())
})

// Counts are noise while just browsing, but while actively searching they tell the user how many
// findings back up each accordion - tag.count is already the matching-mention count in that case
// (graph.getNerLabelGroups), not just the label's total.
const isSearchActive = computed(() => String(state.global_search || '').trim().length > 0)
function groupMatchCount(group) {
  return group.tags.reduce((sum, tag) => sum + (tag.count || 0), 0)
}
// The top search box filters manual tag types client-side by label text, and re-queries NER label
// groups server-side (below) since matches there need to look inside each run's ner.json mention
// text, not just the label name - matching "Alvar Aalto" under "henkil\u00f6", say.
const filteredTypes = computed(() => {
  const needle = String(state.global_search || '').trim().toLowerCase()
  if (!needle) return state.types
  return state.types
    .map((type) => ({ ...type, items: (type.items || []).filter((item) => String(item.label || '').toLowerCase().includes(needle)) }))
    .filter((type) => type.items.length > 0)
})

// While one or more manual tags are selected, NER browsing narrows to just the files that match
// that selection (state.items, already loaded by refreshItems) - lets a user combine a manual tag
// with NER search to find the actual mention inside already-tagged files.
const selectedTagFileRids = computed(() => (
  state.selected_entities.length > 0 ? state.items.map((item) => item['@rid'] || item.rid) : []
))

async function refreshNerData() {
  const search = String(state.global_search || '').trim()
  state.machine_tags = await web.getNerLabelGroups(search, {
    projectRids: selectedProjectRids.value,
    fileRids: selectedTagFileRids.value,
  })
  // Already-open labels keep browsing live: carry the same text/scope into their own mention search.
  for (const tagState of Object.values(state.tag_mentions)) {
    tagState.search = search
    if (tagState.loaded && tagState.tag) await loadMentions(tagState.tag, 1)
  }
}

let globalSearchDebounce = null
watch(() => state.global_search, () => {
  clearTimeout(globalSearchDebounce)
  globalSearchDebounce = setTimeout(refreshNerData, 300)
})

// service.json task ids are snake_case; "extract entities" reads better than "extract_entities".
function formatTaskLabel(task) {
  return String(task || '').replace(/_/g, ' ')
}

// service.json service ids are all "md-"-prefixed (md-gliner2, md-uvdoc, ...); the prefix is an
// internal naming convention, not something worth a user's attention here.
function formatServiceLabel(service_id) {
  return String(service_id || '').replace(/^md-/, '')
}

const panelItems = computed(() => {
  return visibleItems.value.map((item, index) => normalizeEntityItem(item, index))
})

function normalizeEntityItem(item, localIndex) {
  const ridRaw = item['@rid'] || item.rid || item.id || ''
  const rid = String(ridRaw).startsWith('#') ? String(ridRaw) : '#' + String(ridRaw)
  return {
    '@rid': rid,
    label: item.label || item.name || rid,
    type: item.type || item.extension || 'text',
    entities: item.entities || [],
    description: item.description || '',
    info: item.info || '',
    thumb: item.thumb || buildThumbBase(item.path),
    thumbnail_version: item.thumbnail_version || (Date.now() + localIndex),
    expand: false,
  }
}

function buildThumbBase(filePath) {
  if (!filePath || typeof filePath !== 'string') return ''
  const lastIndex = filePath.lastIndexOf('/')
  if (lastIndex === -1) return ''
  const base = `/api/thumbnails/${filePath.substring(0, lastIndex)}`
  return import.meta.env.VITE_API_PATH ? `${import.meta.env.VITE_API_PATH}${base}` : base
}

async function selectEntity(entity) {
  if (state.selected_entities.find(e => e['@rid'] === entity['@rid'])) return
  closeMentionPreview()
  state.selected_entities.push(entity)
  await refreshItems()
}

async function unselect(entity) {
  state.selected_entities = state.selected_entities.filter(e => e['@rid'] !== entity['@rid'])
  await refreshItems()
}

// One label under a machine/NER tag group is browsed as its own accordion (not routed through the
// manual-tag file panel): the actual mention text (e.g. "John Smith" under PERSON) isn't stored on
// TagLink, only file+label, so it's read on demand from each tagged file's ner.json and aggregated,
// paged and searched server-side (graph.getNerLabelMentions). NER never creates tags, so groups
// are keyed by label text, not an entity rid (see MessyDesk's tags.md §1).
function tagKey(tag) {
  return `${tag.service_id}:${tag.task}:${tag.label}`
}

function getTagState(tag) {
  const key = tagKey(tag)
  if (!state.tag_mentions[key]) {
    state.tag_mentions[key] = { items: [], total: 0, page: 1, pageSize: 20, search: String(state.global_search || ''), loaded: false, loading: false, activeMention: null, tag }
  }
  return state.tag_mentions[key]
}

let mentionSearchDebounce = null

async function loadMentions(tag, page = 1) {
  const tagState = getTagState(tag)
  tagState.loading = true
  tagState.activeMention = null
  if (state.mention_preview.tagKey === tagKey(tag)) closeMentionPreview()
  try {
    const response = await web.getNerLabelMentions(tag.service_id, tag.task, tag.label, {
      search: tagState.search,
      page,
      pageSize: tagState.pageSize,
      projectRids: selectedProjectRids.value,
      fileRids: selectedTagFileRids.value,
    })
    tagState.items = response?.mentions || []
    tagState.total = response?.total || 0
    tagState.page = response?.page || page
    tagState.loaded = true
  } finally {
    tagState.loading = false
  }
}

function onMentionSearchInput(tag) {
  clearTimeout(mentionSearchDebounce)
  mentionSearchDebounce = setTimeout(() => loadMentions(tag, 1), 300)
}

// A mention can occur in more than one file/region ("hits"); clicking it opens a one-at-a-time
// browser over those hits and, like clicking a manual tag shows its files in the main area
// (refreshItems below), loads the actual source text inline with the matched span highlighted.
function selectMention(tag, mention) {
  const tagState = getTagState(tag)
  const opening = tagState.activeMention?.text !== mention.text
  tagState.activeMention = opening ? { text: mention.text, hits: mention.hits || [], index: 0 } : null
  if (opening) {
    loadMentionPreview(tag)
  } else {
    closeMentionPreview()
  }
}

function stepMention(tag, delta) {
  const active = getTagState(tag).activeMention
  if (!active) return
  const next = active.index + delta
  if (next < 0 || next >= active.hits.length) return
  active.index = next
  loadMentionPreview(tag)
}

function currentHit(tag) {
  const active = getTagState(tag).activeMention
  if (!active) return null
  return active.hits[active.index] || null
}

function escapeHtmlText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// region.start/end are character offsets into the source file's raw text (see MD-Gliner2's
// entities_to_regions); slice on the raw text first, then escape each piece separately so
// escaping never shifts the offsets the highlight span depends on.
function buildHighlightedHtml(rawText, start, end) {
  const text = typeof rawText === 'string' ? rawText : JSON.stringify(rawText, null, 2)
  const hasRange = Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start && end <= text.length
  if (!hasRange) return escapeHtmlText(text).replace(/\n/g, '<br>')

  const before = escapeHtmlText(text.slice(0, start))
  const match = escapeHtmlText(text.slice(start, end))
  const after = escapeHtmlText(text.slice(end))
  return `${before}<mark id="ner-hit-mark" class="ner-hit-mark">${match}</mark>${after}`.replace(/\n/g, '<br>')
}

function closeMentionPreview() {
  state.mention_preview = { tagKey: null, loading: false, error: null, fileRid: null, fileLabel: null, mentionText: null, html: '' }
}

async function loadMentionPreview(tag) {
  const hit = currentHit(tag)
  if (!hit?.file_rid) {
    closeMentionPreview()
    return
  }

  const key = tagKey(tag)
  const mentionText = getTagState(tag).activeMention?.text || ''
  state.mention_preview = { tagKey: key, loading: true, error: null, fileRid: hit.file_rid, fileLabel: hit.file_label, mentionText, html: '' }

  try {
    const content = await web.getNodeFile(hit.file_rid)
    if (state.mention_preview.tagKey !== key || currentHit(tag) !== hit) return
    state.mention_preview.html = buildHighlightedHtml(content, hit.start, hit.end)
  } catch (error) {
    if (state.mention_preview.tagKey === key) state.mention_preview.error = 'Could not load file content'
  } finally {
    if (state.mention_preview.tagKey === key) state.mention_preview.loading = false
  }

  await nextTick()
  document.getElementById('ner-hit-mark')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function openHitFile(hit) {
  if (!hit?.file_rid) return
  const fileRid = String(hit.file_rid).replace('#', '')
  const projectRid = navigationProjectRid.value
  if (projectRid) {
    router.push({ name: 'project-file', params: { rid: projectRid.replace('#', ''), fileRid } })
  } else {
    router.push({ name: 'files', params: { rid: fileRid } })
  }
}

async function refreshItems() {
  if (state.selected_entities.length === 0) {
    state.items = []
    state.panelOpen = false
    state.page = 1
    await refreshNerData()
    return
  }

  const response = await web.getEntityItems(state.selected_entities, { projectRids: selectedProjectRids.value })
  state.projectFilterIgnored = Boolean(response?._project_filter_ignored)
  state.items = Array.isArray(response) ? response : []
  state.page = 1
  state.panelOpen = state.items.length > 0
  await refreshNerData()
}

async function openTaggedFile(payload) {
  const file = payload?.file
  const localIndex = payload?.index ?? 0
  if (!file || !file['@rid']) return

  const rid = file['@rid']
  const absoluteIndex = ((state.page - 1) * filesPerPage) + localIndex

  const response = await web.getDocInfo(rid)
  store.file = response
  store.file_browse_context = {
    mode: 'search',
    query: panelNode.value.label,
    results: state.items.map((item) => {
      const itemRidRaw = item['@rid'] || item.rid || item.id
      const itemRid = String(itemRidRaw).startsWith('#') ? String(itemRidRaw) : '#' + String(itemRidRaw)
      return {
        rid: itemRid,
        label: item.label || item.name || itemRid,
        score: null,
        highlight: ''
      }
    }),
    index: absoluteIndex,
  }

  const fileRid = rid.replace('#', '')
  const projectRid = navigationProjectRid.value
  if (projectRid) {
    router.push({ name: 'project-file', params: { rid: projectRid.replace('#', ''), fileRid } })
  } else {
    router.push({ name: 'files', params: { rid: fileRid } })
  }
}

function entityProps(item) {
  return {
    title: item.type,
    value: item.type
  }
}

async function create() {
  await web.createEntity(state.current_type, state.new_label)
  state.add = false
  state.new_label = ''
  state.types = await web.getEntities({ projectRids: selectedProjectRids.value })
}

async function loadProjects(initialSelectionRids = null) {
  const projects = await web.getProjects()
  state.projects = []
  for (const project of projects) {
    state.projects.push({ value: project['@rid'], title: project.label })
  }

  if (Array.isArray(initialSelectionRids)) {
    state.selected_projects = state.projects.filter((p) => initialSelectionRids.includes(p.value))
    return
  }

  const initialProject = props.projectRid || route.params.rid || ''
  if (!initialProject) {
    state.selected_projects = []
    return
  }

  const normalized = '#' + String(initialProject).replace('#', '')
  const found = state.projects.find((p) => p.value === normalized)
  state.selected_projects = found ? [found] : []
}

// Selecting/deselecting a project re-scopes both the manual tag type list and the NER label
// groups to that project, not just the currently-shown file results.
async function onProjectSelectionChange() {
  state.types = await web.getEntities({ projectRids: selectedProjectRids.value })
  await refreshItems()
}

function addProjectByValue(value) {
  if (!value) return
  const project = state.projects.find((p) => p.value === value)
  if (!project) return
  if (state.selected_projects.find((p) => p.value === project.value)) return
  state.selected_projects.push(project)
  state.project_input = ''
  onProjectSelectionChange()
}

function removeProject(project) {
  state.selected_projects = state.selected_projects.filter((p) => p.value !== project.value)
  onProjectSelectionChange()
}

function changeTab(tab) {
  if (tab === 1) {
    router.push({ name: 'search' })
    return
  }

  if (tab === 2) {
    router.push({ name: 'entities' })
    return
  }

  router.push({ name: 'Home' })
}

async function hydrateState() {
  const key = stateKey.value
  const buckets = getEntitiesPageStates()
  const saved = buckets[key]
  const savedRids = getSavedProjectRids(saved)
  await loadProjects(savedRids)
  state.types = await web.getEntities({ projectRids: selectedProjectRids.value })
  state.entity_schema = await web.getEntitySchema()

  if (saved) {
    applySavedState(saved)
  } else {
    state.selected_entities = []
    state.items = []
    state.panelOpen = false
    state.page = 1
    state.projectFilterIgnored = false
    state.add = false
    state.current_type = ''
    state.new_label = ''
    state.global_search = ''
  }

  await refreshNerData()
}

watch(stateKey, async () => {
  await hydrateState()
}, { immediate: true })

watch(
  () => [
    state.selected_entities,
    state.items,
    state.panelOpen,
    state.page,
    state.projectFilterIgnored,
    state.add,
    state.current_type,
    state.new_label,
    state.global_search,
    state.selected_projects.map((p) => p.value).join(',')
  ],
  () => saveState(),
  { deep: true }
)
</script>

<template>
  <v-layout class="fill-height">
    <JYUHeader_main v-if="isStandaloneRoute" mode="projects" @change-tab="changeTab" />

    <v-main class="fill-height">
      <v-row class="w-100 fill-height m-0 p-0">
        <v-col cols="9" class="p-0 m-0 fill-height">
          <v-card v-if="state.mention_preview.tagKey" flat class="fill-height overflow-y-auto mention-preview-card pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <div class="text-subtitle-1">{{ state.mention_preview.fileLabel }}</div>
                <div class="text-caption text-medium-emphasis">"{{ state.mention_preview.mentionText }}"</div>
              </div>
              <div>
                <v-btn variant="text" density="compact" @click="openHitFile({ file_rid: state.mention_preview.fileRid })">
                  Open file
                </v-btn>
                <v-btn icon="mdi-close" size="small" variant="text" @click="closeMentionPreview"></v-btn>
              </div>
            </div>

            <v-progress-linear v-if="state.mention_preview.loading" indeterminate class="mb-2"></v-progress-linear>
            <div v-else-if="state.mention_preview.error" class="text-caption text-medium-emphasis">{{ state.mention_preview.error }}</div>
            <div v-else class="mention-preview-text" v-html="state.mention_preview.html"></div>
          </v-card>

          <SetPanel
            v-else
            inline
            :show-close="false"
            :model-value="true"
            :panel-node="panelNode"
            :setdata="panelSetData"
            :set-items="panelItems"
            :page="state.page"
            :total-pages="totalPages"
            :show-expand="false"
            :allow-add-file="false"
            @update:page="state.page = $event"
            @open-file="openTaggedFile"
          />
        </v-col>

        <v-col cols="3" class="p-0 m-0 fill-height full-background">
          <div class="entities-sidebar pa-3">
            <v-card variant="flat" class="entities-sidebar-card pa-3">
              <v-text-field
                v-model="state.global_search"
                label="Search tags"
                density="comfortable"
                variant="outlined"
                prepend-inner-icon="mdi-magnify"
                clearable
                hide-details
                class="mb-3"
              ></v-text-field>

              <template v-if="!hasFixedProjectContext">
                <v-select
                  v-model="state.project_input"
                  :items="state.projects"
                  item-title="title"
                  item-value="value"
                  label="Tag context"
                  density="comfortable"
                  variant="outlined"
                  @update:model-value="addProjectByValue"
                ></v-select>

                <div class="mb-2">
                  <v-chip
                    v-for="project in state.selected_projects"
                    :key="project.value"
                    color="teal-darken-2"
                    class="mr-2 mb-2"
                    @click="removeProject(project)"
                  >
                    {{ project.title }}
                    <v-icon end>mdi-close</v-icon>
                  </v-chip>

                  <div v-if="state.selected_projects.length === 0" class="text-caption text-medium-emphasis mb-2">
                    No project selected: tag results are collected from all your projects.
                  </div>
                </div>
              </template>

              <div class="mb-2">
                <v-chip
                  v-for="entity in state.selected_entities"
                  :key="entity['@rid']"
                  :color="entity.color || 'primary'"
                  class="mr-2 mb-2"
                  @click="unselect(entity)"
                >
                  {{ entity.label }}
                  <v-icon end>mdi-close</v-icon>
                </v-chip>
              </div>

              <v-expansion-panels class="mb-3">
                <v-expansion-panel v-for="type in filteredTypes" :key="type.type">
                  <v-expansion-panel-title>{{ type.type }} ({{ type.count }})</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-chip
                      v-for="item in type.items"
                      :key="item['@rid']"
                      class="mr-2 mb-2"
                      @click="selectEntity(item)"
                    >
                      {{ item.label }}
                    </v-chip>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <div v-if="machineTagGroups.length" class="mb-3">
                <div class="text-subtitle-2 mb-1">NER results</div>
                <v-expansion-panels>
                  <v-expansion-panel v-for="group in machineTagGroups" :key="group.key">
                    <v-expansion-panel-title>
                      {{ formatServiceLabel(group.service_id) }}: {{ formatTaskLabel(group.task) }}
                      <span v-if="isSearchActive" class="ml-1 text-caption">({{ groupMatchCount(group) }})</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-expansion-panels variant="accordion">
                        <v-expansion-panel v-for="tag in group.tags" :key="tagKey(tag)">
                          <v-expansion-panel-title @click="() => { if (!getTagState(tag).loaded) loadMentions(tag, 1) }">
                            {{ tag.label }}
                            <span v-if="isSearchActive" class="ml-1 text-caption">({{ tag.count }})</span>
                          </v-expansion-panel-title>
                          <v-expansion-panel-text>
                            <v-text-field
                              :model-value="getTagState(tag).search"
                              @update:model-value="(v) => { getTagState(tag).search = v; onMentionSearchInput(tag) }"
                              label="Search names"
                              density="compact"
                              variant="outlined"
                              prepend-inner-icon="mdi-magnify"
                              clearable
                              hide-details
                              class="mb-2"
                            ></v-text-field>

                            <v-progress-linear v-if="getTagState(tag).loading" indeterminate class="mb-2"></v-progress-linear>

                            <template v-else>
                              <v-chip
                                v-for="mention in getTagState(tag).items"
                                v-show="!getTagState(tag).activeMention || getTagState(tag).activeMention.hits.length <= 1 || getTagState(tag).activeMention.text === mention.text"
                                :key="mention.text"
                                class="mr-2 mb-2"
                                :color="getTagState(tag).activeMention?.text === mention.text ? 'deep-purple' : undefined"
                                variant="tonal"
                                @click="selectMention(tag, mention)"
                              >
                                {{ mention.text }} <span v-if="mention.count > 1" class="ml-1 text-caption">({{ mention.count }})</span>
                              </v-chip>

                              <div v-if="getTagState(tag).loaded && !getTagState(tag).items.length" class="text-caption text-medium-emphasis">
                                No matches
                              </div>

                              <v-card v-if="getTagState(tag).activeMention" variant="outlined" class="pa-3 mt-2">
                                <div class="d-flex align-center justify-space-between">
                                  <strong>{{ getTagState(tag).activeMention.text }}</strong>
                                  <v-btn icon="mdi-close" size="x-small" variant="text" @click="() => { getTagState(tag).activeMention = null; closeMentionPreview() }"></v-btn>
                                </div>

                                <div v-if="getTagState(tag).activeMention.hits.length > 1" class="d-flex align-center mt-1">
                                  <v-btn
                                    icon="mdi-chevron-left"
                                    size="x-small"
                                    variant="text"
                                    :disabled="getTagState(tag).activeMention.index === 0"
                                    @click="stepMention(tag, -1)"
                                  ></v-btn>
                                  <span class="mx-2 text-caption">{{ getTagState(tag).activeMention.index + 1 }} / {{ getTagState(tag).activeMention.hits.length }}</span>
                                  <v-btn
                                    icon="mdi-chevron-right"
                                    size="x-small"
                                    variant="text"
                                    :disabled="getTagState(tag).activeMention.index === getTagState(tag).activeMention.hits.length - 1"
                                    @click="stepMention(tag, 1)"
                                  ></v-btn>
                                </div>

                                <div class="mt-2 text-caption">
                                  {{ currentHit(tag)?.file_label }}
                                  <span v-if="currentHit(tag)?.confidence != null" class="ml-2">
                                    confidence: {{ currentHit(tag).confidence }}
                                  </span>
                                </div>
                              </v-card>

                              <v-pagination
                                v-if="getTagState(tag).total > getTagState(tag).pageSize"
                                :model-value="getTagState(tag).page"
                                @update:model-value="(p) => loadMentions(tag, p)"
                                :length="Math.max(1, Math.ceil(getTagState(tag).total / getTagState(tag).pageSize))"
                                :total-visible="6"
                                density="compact"
                                class="mt-2"
                              ></v-pagination>
                            </template>
                          </v-expansion-panel-text>
                        </v-expansion-panel>
                      </v-expansion-panels>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>

              <v-btn
                v-if="!state.add"
                icon="mdi-plus"
                size="small"
                color="primary"
                variant="tonal"
                class="mb-3"
                @click="state.add = true"
              ></v-btn>

              <v-card v-if="state.add" title="Add new Tag">
                <v-card-text>
                  <v-select :items="state.entity_schema" v-model="state.current_type" label="Tag Type" :item-props="entityProps"></v-select>
                  <v-text-field v-model="state.new_label" label="Tag Label"></v-text-field>
                </v-card-text>
                <v-card-actions>
                  <v-btn @click="create" color="primary" v-if="state.current_type">Create</v-btn>
                  <v-btn @click="state.add = false">Cancel</v-btn>
                </v-card-actions>
              </v-card>

              <v-alert
                v-if="state.projectFilterIgnored && selectedProjectRids.length > 0"
                type="info"
                variant="tonal"
                class="mt-3"
              >
                Project filtering is not yet available in backend. Showing global tag results for now.
              </v-alert>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-main>
  </v-layout>
</template>

<style scoped>
.full-background {
  background-image: linear-gradient(rgba(19, 84, 122, 0.8), rgba(128, 208, 199, 0.8)), url('../assets/images/right-column-bg2.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}

.entities-sidebar {
  height: 100%;
  overflow-y: auto;
}

.mention-preview-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.mention-preview-text :deep(.ner-hit-mark) {
  background-color: #ffe082;
  padding: 0 2px;
}

.entities-sidebar-card {
  background: rgba(255, 255, 255, 0.9);
}
</style>
