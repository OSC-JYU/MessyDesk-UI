<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import web from '../web.js'
import { store } from './Store.js'
import SetPanel from './displays/SetPanel.vue'

document.title = 'MessyDesk - search'

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
  search: '',
  result: null,
  projects: [],
  selected_projects: [],
  project_input: '',
  panelOpen: false,
  page: 1,
  projectFilterIgnored: false,
})

function applySavedState(savedState) {
  state.search = savedState?.search || ''
  state.result = savedState?.result || null
  state.panelOpen = Boolean(savedState?.panelOpen)
  state.page = savedState?.page || 1
  state.projectFilterIgnored = Boolean(savedState?.projectFilterIgnored)
}

function getSavedProjectRids(savedState) {
  if (!savedState || !Array.isArray(savedState.selectedProjectRids)) return null
  return savedState.selectedProjectRids
}

function saveState() {
  const key = stateKey.value
  store.search_page_states[key] = {
    search: state.search,
    result: state.result,
    panelOpen: state.panelOpen,
    page: state.page,
    projectFilterIgnored: state.projectFilterIgnored,
    selectedProjectRids: state.selected_projects.map((p) => p.value)
  }
}

const selectedProjectRids = computed(() => {
  if (state.selected_projects.length > 0) {
    return state.selected_projects.map((p) => p.value)
  }

  // Default to current project only when coming from project route.
  const current = props.projectRid || route.params.rid || ''
  return current ? ['#' + String(current).replace('#', '')] : []
})

const navigationProjectRid = computed(() => {
  const current = props.projectRid || route.params.rid || ''
  if (current) return '#' + String(current).replace('#', '')
  if (selectedProjectRids.value.length === 1) return selectedProjectRids.value[0]
  return ''
})

const allDocs = computed(() => state.result?.response?.docs || [])
const totalPages = computed(() => Math.max(1, Math.ceil(allDocs.value.length / filesPerPage)))
const visibleDocs = computed(() => {
  const start = (state.page - 1) * filesPerPage
  return allDocs.value.slice(start, start + filesPerPage)
})

const panelSetData = computed(() => ({
  mode: 'flat',
  file_count: allDocs.value.length,
  group_count: 0,
}))

const panelNode = computed(() => ({
  label: state.search ? `Search: ${state.search}` : 'Search results'
}))

const panelItems = computed(() => {
  return visibleDocs.value.map((doc, index) => normalizeSearchDoc(doc, index))
})

function normalizeSearchDoc(doc, localIndex) {
  const rid = String(doc.id || '').startsWith('#') ? String(doc.id) : '#' + String(doc.id)
  return {
    '@rid': rid,
    label: doc.label || doc.id,
    type: doc.type || 'text',
    entities: doc.entities || [],
    description: state.result?.highlighting?.[doc.id]?.fulltext?.join(' ') || '',
    info: doc.description || '',
    thumb: buildThumbBase(doc.path),
    thumbnail_version: Date.now() + localIndex,
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

async function search() {
  if (!state.search) {
    state.result = null
    state.panelOpen = false
    return
  }

  state.result = await web.search(state.search, { projectRids: selectedProjectRids.value })
  state.projectFilterIgnored = Boolean(state.result?._project_filter_ignored)
  state.page = 1
  state.panelOpen = allDocs.value.length > 0
}

async function openFromPanel(payload) {
  const file = payload?.file
  const localIndex = payload?.index ?? 0
  if (!file || !file['@rid']) return

  const rid = file['@rid']
  const absoluteIndex = ((state.page - 1) * filesPerPage) + localIndex
  await go(rid, absoluteIndex)
}

async function go(rid, index) {
  const normalizedRid = String(rid).startsWith('#') ? String(rid) : '#' + String(rid)
  const response = await web.getDocInfo(normalizedRid)

  const docs = allDocs.value
  const searchResults = docs.map((doc) => ({
    rid: String(doc.id).startsWith('#') ? String(doc.id) : '#' + String(doc.id),
    label: doc.label,
    score: doc.score,
    highlight: state.result?.highlighting?.[doc.id]?.fulltext?.join(' ') || ''
  }))

  store.file = response
  store.file_browse_context = {
    mode: 'search',
    query: state.search,
    results: searchResults,
    index: typeof index === 'number' ? index : docs.findIndex(d => d.id === rid || ('#' + d.id) === rid),
  }

  const fileRid = normalizedRid.replace('#', '')
  const projectRid = navigationProjectRid.value

  if (projectRid) {
    router.push({ name: 'project-file', params: { rid: projectRid.replace('#', ''), fileRid } })
  } else {
    router.push({ name: 'files', params: { rid: fileRid } })
  }
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

async function hydrateState() {
  const key = stateKey.value
  const saved = store.search_page_states[key]
  const savedRids = getSavedProjectRids(saved)
  await loadProjects(savedRids)

  if (saved) {
    applySavedState(saved)
  } else {
    state.search = ''
    state.result = null
    state.panelOpen = false
    state.page = 1
    state.projectFilterIgnored = false
  }
}

async function onProjectSelectionChange() {
  if (state.search) {
    await search()
  }
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

watch(stateKey, async () => {
  await hydrateState()
}, { immediate: true })

watch(
  () => [
    state.search,
    state.result,
    state.panelOpen,
    state.page,
    state.projectFilterIgnored,
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
        @open-file="openFromPanel"
      />
    </v-col>

    <v-col cols="3" class="p-0 m-0 fill-height full-background">
      <div class="search-sidebar pa-3">
        <v-card variant="flat" class="search-sidebar-card pa-3">
          <v-select
            v-model="state.project_input"
            :items="state.projects"
            item-title="title"
            item-value="value"
            label="Project context"
            density="comfortable"
            variant="outlined"
            @update:model-value="addProjectByValue"
          ></v-select>

          <div class="mb-2">
            <v-chip
              v-for="project in state.selected_projects"
              :key="project.value"
              class="mr-2 mb-2"
              color="teal-darken-2"
              @click="removeProject(project)"
            >
              {{ project.title }}
              <v-icon end>mdi-close</v-icon>
            </v-chip>
            <div v-if="state.selected_projects.length === 0" class="text-caption text-medium-emphasis">
              No project selected: searching across all your projects.
            </div>
          </div>

          <v-text-field
            v-model="state.search"
            label="Search text"
            density="comfortable"
            variant="outlined"
            @keydown.enter="search"
          ></v-text-field>

          <v-btn color="primary" block class="mb-3" @click="search">Search</v-btn>

          <v-alert
            v-if="state.projectFilterIgnored && selectedProjectRids.length > 0"
            type="info"
            variant="tonal"
            class="mb-3"
          >
            Project filtering is not yet available in backend. Showing global results for now.
          </v-alert>

          <v-alert v-if="state.result && allDocs.length === 0" type="warning" variant="tonal">
            No matches.
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

.search-sidebar {
  height: 100%;
  overflow-y: auto;
}

.search-sidebar-card {
  background: rgba(255, 255, 255, 0.9);
}
</style>
