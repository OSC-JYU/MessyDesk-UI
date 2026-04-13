<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import web from '../web.js'
import { store } from './Store.js'
import SetPanel from './displays/SetPanel.vue'

document.title = 'MessyDesk - tags'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  projectRid: { type: String, default: null }
})

const stateKey = computed(() => {
  const current = props.projectRid || route.params.rid || 'global'
  return String(current).replace('#', '')
})

const filesPerPage = 24

const state = reactive({
  types: [],
  entity_schema: [],
  selected_entities: [],
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
}

function getSavedProjectRids(savedState) {
  if (!savedState || !Array.isArray(savedState.selectedProjectRids)) return null
  return savedState.selectedProjectRids
}

function saveState() {
  const key = stateKey.value
  store.entities_page_states[key] = {
    selected_entities: state.selected_entities,
    items: state.items,
    panelOpen: state.panelOpen,
    page: state.page,
    projectFilterIgnored: state.projectFilterIgnored,
    add: state.add,
    current_type: state.current_type,
    new_label: state.new_label,
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

const panelNode = computed(() => ({
  label: state.selected_entities.length
    ? `Tags: ${state.selected_entities.map(e => e.label).join(', ')}`
    : 'Tag results'
}))

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
  state.selected_entities.push(entity)
  await refreshItems()
}

async function unselect(entity) {
  state.selected_entities = state.selected_entities.filter(e => e['@rid'] !== entity['@rid'])
  await refreshItems()
}

async function refreshItems() {
  if (state.selected_entities.length === 0) {
    state.items = []
    state.panelOpen = false
    state.page = 1
    return
  }

  const response = await web.getEntityItems(state.selected_entities, { projectRids: selectedProjectRids.value })
  state.projectFilterIgnored = Boolean(response?._project_filter_ignored)
  state.items = Array.isArray(response) ? response : []
  state.page = 1
  state.panelOpen = state.items.length > 0
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
    query: `Tags: ${state.selected_entities.map(e => e.label).join(', ')}`,
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
  state.types = await web.getEntities()
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

async function onProjectSelectionChange() {
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

async function hydrateState() {
  const key = stateKey.value
  const saved = store.entities_page_states[key]
  const savedRids = getSavedProjectRids(saved)
  await loadProjects(savedRids)
  state.types = await web.getEntities()
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
  }
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
    state.selected_projects.map((p) => p.value).join(',')
  ],
  () => saveState(),
  { deep: true }
)
</script>

<template>
  <v-row class="w-100 fill-height m-0 p-0">
    <v-col cols="9" class="p-0 m-0 fill-height">
      <SetPanel
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
            <v-expansion-panel v-for="type in state.types" :key="type.type">
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

          <v-btn v-if="!state.add" color="primary" block class="mb-3" @click="state.add = true">Add new</v-btn>

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

          <v-alert v-if="state.items.length === 0" type="info" variant="tonal" class="mt-3">
            Select one or more tags from the tag picker to see matching files.
          </v-alert>
        </v-card>
      </div>
    </v-col>
  </v-row>
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

.entities-sidebar-card {
  background: rgba(255, 255, 255, 0.9);
}
</style>
