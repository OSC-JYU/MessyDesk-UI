<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import web from '../web.js'
import { store } from './Store.js'
import JYUHeader_main from './JYUHeader_main.vue'

const router = useRouter()
const organizationLogoModules = import.meta.glob('../assets/images/organisation.{svg,png}', { eager: true, import: 'default' })
const organizationLogoSrc = Object.values(organizationLogoModules)[0] || ''
const createSection = ref(null)
const projectInput = ref(null)

document.title = 'MessyDesk - Home'

const state = reactive({
  loadingProjects: false,
  loadingCrunchers: false,
  projects: [],
  services: [],
  projectName: '',
  createPending: false,
  createError: '',
  renameDialog: false,
  renameProjectRid: '',
  renameProjectName: '',
  renamePending: false,
  renameError: '',
  sortKey: 'name',
  sortDirection: 'asc',
  loadError: '',
  eventSource: null,
  examples: [
    {
      title: 'Old Letters To Searchable Text',
      description: 'Start with scanned pages, clean them, run text reading, and collect one searchable folder for close reading.',
      level: 'Beginner',
      route: '/intro'
    },
    {
      title: 'Photo Archive To Themed Collection',
      description: 'Organize a mixed image collection and create a tidy material set for exhibitions or teaching.',
      level: 'Beginner',
      route: '/intro'
    },
    {
      title: 'Build A Reusable Workflow',
      description: 'Save a successful processing sequence so your next project starts faster and stays consistent.',
      level: 'Intermediate',
      route: '/prompts'
    }
  ],
  news: [
    {
      title: 'Image Region Editor Is Available',
      date: '2026-03-10',
      text: 'You can now mark and reuse named image regions for repeated material processing.'
    },
    {
      title: 'Service Detail View Improved',
      date: '2026-02-21',
      text: 'Service pages now show clearer capability notes and safer status controls.'
    },
    {
      title: 'Search View Keeps Your Context',
      date: '2026-01-29',
      text: 'Returning from search now preserves your current working context more reliably.'
    }
  ]
})

const runningJobs = computed(() => {
  return Object.entries(store.running_processes || {})
    .map(([rid, data]) => ({ rid, ...data }))
    .filter(job => ['running', 'paused', 'cancelling'].includes(job.status))
})

function formatEta(etaSec) {
  if (etaSec === null || etaSec === undefined || etaSec === '') return 'n/a'
  const sec = Number(etaSec)
  if (!Number.isFinite(sec)) return 'n/a'
  if (sec < 60) return `${Math.max(sec, 0)}s`
  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60
  if (minutes < 60) return `${minutes}m ${seconds}s`
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  return `${hours}h ${remMin}m`
}

function getBatchStatus(batch, fallback = 'running') {
  if (!batch) return fallback
  return batch.status || batch.state || fallback
}

function renderEta(batch) {
  if (!batch || batch.eta_sec === null || batch.eta_sec === undefined) return ''
  return `, ETA ${formatEta(batch.eta_sec)}`
}

async function hydrateBatch(processRid) {
  try {
    const batch = await web.getBatch(processRid)
    if (!batch) return
    if (!store.running_processes[processRid]) {
      store.running_processes[processRid] = { status: getBatchStatus(batch, 'running'), message: 'Working...', batch: null }
    }
    const processed = batch.processed_files ?? 0
    const total = batch.total_files ?? '?'
    const failed = batch.failed_files ?? 0
    store.running_processes[processRid].status = getBatchStatus(batch, store.running_processes[processRid].status)
    store.running_processes[processRid].batch = batch
    store.running_processes[processRid].message = `${processed}/${total} files, failed ${failed}${renderEta(batch)}`
  } catch (error) {
    console.log('batch hydrate failed', processRid, error?.message)
  }
}

function connectSSE() {
  if (state.eventSource) {
    state.eventSource.close()
  }

  state.eventSource = new EventSource(`${import.meta.env.VITE_API_PATH}/events`)

  state.eventSource.onmessage = async (event) => {
    try {
      const wsdata = JSON.parse(event.data)
      if (!wsdata?.process?.['@rid']) return
      const processRid = wsdata.process['@rid']

      if (!store.running_processes[processRid]) {
        store.running_processes[processRid] = { status: 'running', message: 'Working...', batch: null }
      }

      if (wsdata.command === 'process_update') {
        store.running_processes[processRid].status = getBatchStatus(wsdata?.batch, wsdata?.process?.status || 'running')
        if (wsdata.batch) {
          const processed = wsdata.batch.processed_files ?? wsdata.current_file ?? 0
          const total = wsdata.batch.total_files ?? wsdata.total_files ?? '?'
          const failed = wsdata.batch.failed_files ?? 0
          store.running_processes[processRid].batch = wsdata.batch
          store.running_processes[processRid].message = `${processed}/${total} files, failed ${failed}${renderEta(wsdata.batch)}`
        } else {
          await hydrateBatch(processRid)
        }
      }

      if (wsdata.command === 'process_finished') {
        store.running_processes[processRid].status = getBatchStatus(wsdata?.batch, wsdata?.process?.status || 'done')
        if (wsdata.batch) {
          store.running_processes[processRid].batch = wsdata.batch
          store.running_processes[processRid].message = `Done ${wsdata.batch.processed_files ?? 0}/${wsdata.batch.total_files ?? '?'}${renderEta(wsdata.batch)}`
        }
      }
    } catch (error) {
      console.log('main SSE parse failed', error?.message)
    }
  }
}

const activeCrunchers = computed(() => {
  return state.services
    .filter(service => {
      const runningConsumers = Array.isArray(service.consumers) ? service.consumers.length : 0
      return runningConsumers > 0 || service.active === true
    })
    .map(service => ({
      id: service.id,
      name: service.name || service.id,
      description: service.description || 'Working in the background',
      workers: Array.isArray(service.consumers) ? service.consumers.length : 1
    }))
    .sort((a, b) => b.workers - a.workers)
})

const projectsWithMeta = computed(() => {
  return state.projects.map(project => {
    return {
      ...project,
      displayName: project.label || project.name || 'Untitled desk',
      nameValue: (project.label || project.name || 'Untitled desk').toLowerCase(),
      sizeValue: getSizeValue(project),
      nodeCountValue: getNodeCountValue(project),
      expirationValue: getExpirationValue(project),
      sizeText: formatSize(project),
      nodeCountText: formatNodeCount(project),
      expirationText: formatExpiration(project)
    }
  })
})

const sortedProjects = computed(() => {
  const projects = [...projectsWithMeta.value]
  const direction = state.sortDirection === 'asc' ? 1 : -1

  projects.sort((a, b) => {
    let left = ''
    let right = ''

    if (state.sortKey === 'size') {
      left = a.sizeValue
      right = b.sizeValue
    } else if (state.sortKey === 'nodes') {
      left = a.nodeCountValue
      right = b.nodeCountValue
    } else if (state.sortKey === 'expires') {
      left = a.expirationValue
      right = b.expirationValue
    } else {
      left = a.nameValue
      right = b.nameValue
    }

    if (left < right) return -1 * direction
    if (left > right) return 1 * direction
    return 0
  })

  return projects
})

function getSizeValue(project) {
  const raw =
    readNumber(project.size_mb) ??
    readNumber(project.sizeMB) ??
    readNumber(project.sizeMb) ??
    readNumber(project.total_size_mb) ??
    readNumber(project.total_mb) ??
    readNumber(project.size)

  if (raw == null) return -1
  return raw > 1024 * 1024 ? raw / (1024 * 1024) : raw
}

function getNodeCountValue(project) {
  return (
    readNumber(project.node_count) ??
    readNumber(project.nodes_count) ??
    readNumber(project.item_count) ??
    readNumber(project.file_count) ??
    readNumber(project.count) ??
    -1
  )
}

function getExpirationValue(project) {
  const raw =
    project.expiration_date ||
    project.expiry_date ||
    project.expires_at ||
    project.expires ||
    project.expire_at ||
    project.valid_until

  if (!raw) return Number.POSITIVE_INFINITY
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime()
}

function sortBy(key) {
  if (state.sortKey === key) {
    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc'
    return
  }

  state.sortKey = key
  state.sortDirection = 'asc'
}

function sortIcon(key) {
  if (state.sortKey !== key) return 'mdi-swap-vertical'
  return state.sortDirection === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
}

function formatSize(project) {
  const raw =
    readNumber(project.size_mb) ??
    readNumber(project.sizeMB) ??
    readNumber(project.sizeMb) ??
    readNumber(project.total_size_mb) ??
    readNumber(project.total_mb) ??
    readNumber(project.size)

  if (raw == null) {
    return 'No estimate yet'
  }

  let mb = raw
  if (raw > 1024 * 1024) {
    mb = raw / (1024 * 1024)
  }

  return `${mb.toFixed(1)} MB`
}

function formatNodeCount(project) {
  const count =
    readNumber(project.node_count) ??
    readNumber(project.nodes_count) ??
    readNumber(project.item_count) ??
    readNumber(project.file_count) ??
    readNumber(project.count)

  if (count == null) {
    return 'Not counted yet'
  }

  return `${Math.floor(count)} items`
}

function formatExpiration(project) {
  const raw =
    project.expiration_date ||
    project.expiry_date ||
    project.expires_at ||
    project.expires ||
    project.expire_at ||
    project.valid_until

  if (!raw) {
    return 'No date'
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return String(raw)
  }

  return date.toLocaleDateString()
}

function readNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function openProject(project) {
  if (!project || !project['@rid']) {
    return
  }

  router.push({
    name: 'project-graph',
    params: { rid: project['@rid'].replace('#', '') }
  })
}

function openRoute(path) {
  if (!path) {
    return
  }

  router.push(path)
}

function changeTab(tab) {
  if (tab === 1) {
    router.push('/search')
    return
  }

  if (tab === 2) {
    router.push('/tags')
    return
  }

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function focusCreateProject() {
  await nextTick()
  createSection.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const input = projectInput.value?.$el?.querySelector('input')
  input?.focus()
}

async function loadProjects() {
  state.loadingProjects = true
  try {
    state.projects = await web.getProjects()
    store.projects = state.projects
  } catch (error) {
    state.loadError = error.message || 'Could not load desks.'
  } finally {
    state.loadingProjects = false
  }
}

async function refreshProjects() {
  state.loadingProjects = true
  state.loadError = ''
  try {
    await web.updateProjectSizes()
    state.projects = await web.getProjects()
    store.projects = state.projects
  } catch (error) {
    state.loadError = error.message || 'Could not refresh desk sizes.'
  } finally {
    state.loadingProjects = false
  }
}

async function loadCrunchers() {
  state.loadingCrunchers = true
  try {
    const response = await web.getServices()
    state.services = Object.entries(response || {}).map(([id, service]) => ({ id, ...service }))
  } catch (error) {
    state.loadError = error.message || 'Could not load active tools.'
  } finally {
    state.loadingCrunchers = false
  }
}

async function createProject() {
  const name = state.projectName.trim()
  if (!name) {
    state.createError = 'Please give your desk a name.'
    return
  }

  state.createPending = true
  state.createError = ''
  try {
    await web.createProject(name, '', Math.floor(Math.random() * 200), Math.floor(Math.random() * 200))
    state.projectName = ''
    await loadProjects()
  } catch (error) {
    state.createError = error.message || 'Could not create desk.'
  } finally {
    state.createPending = false
  }
}

function openRenameDialog(project) {
  if (!project || !project['@rid']) {
    return
  }

  state.renameProjectRid = project['@rid']
  state.renameProjectName = project.displayName || project.label || ''
  state.renameError = ''
  state.renameDialog = true
}

function closeRenameDialog() {
  state.renameDialog = false
  state.renameProjectRid = ''
  state.renameProjectName = ''
  state.renameError = ''
}

async function renameProject() {
  const label = state.renameProjectName.trim()
  if (!label) {
    state.renameError = 'Please provide a desk name.'
    return
  }

  if (!state.renameProjectRid) {
    state.renameError = 'No project selected.'
    return
  }

  state.renamePending = true
  state.renameError = ''
  try {
    await web.setProjectAttribute(state.renameProjectRid, { key: 'label', value: label })
    closeRenameDialog()
    await loadProjects()
  } catch (error) {
    state.renameError = error.message || 'Could not rename desk.'
  } finally {
    state.renamePending = false
  }
}

onMounted(async () => {
  await Promise.all([loadProjects(), loadCrunchers()])
  connectSSE()
  for (const rid of Object.keys(store.running_processes || {})) {
    await hydrateBatch(rid)
  }
})

onUnmounted(() => {
  if (state.eventSource) {
    state.eventSource.close()
    state.eventSource = null
  }
})
</script>

<template>
  <v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
    <v-layout class="fill-height">
      <JYUHeader_main
        mode="projects"
        @create-project="focusCreateProject"
        @change-tab="changeTab"
      />

      <v-main class="fill-height main-scroll">
        <v-container fluid class="main-shell pa-4 pa-md-8">
    <v-row class="hero-row mb-6 mb-md-8">
      <v-col cols="12" lg="8">
        <section class="hero reveal-1">
          <h1 class="hero-title mb-3">Digital tools for digital humanists.</h1>
          <p class="hero-text mb-0">
            Keep your material in one calm place. Open an existing desk, create a new one,
            and follow what is currently running.
          </p>
        </section>
      </v-col>

      <v-col v-if="organizationLogoSrc" cols="12" lg="4" class="hero-logo-slot reveal-1">
        <v-card class="panel org-logo-card" rounded="xl" elevation="2">
          <v-card-text class="d-flex justify-center py-4">
            <img :src="organizationLogoSrc" alt="Organization logo" class="org-logo" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="state.loadError" type="error" class="mb-6" variant="tonal">
      {{ state.loadError }}
    </v-alert>

    <v-row>
      <v-col cols="12" lg="8" class="reveal-2">
        <v-card class="panel mb-6" rounded="xl" elevation="2">
          <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
            <div>
              <div class="text-overline">Your Desks</div>
              <div class="text-h5 font-weight-bold">Project Listing</div>
            </div>
            <v-btn size="small" variant="outlined" @click="refreshProjects" :loading="state.loadingProjects">
              Refresh
            </v-btn>
          </v-card-title>

          <v-card-text class="pt-0">
            <v-skeleton-loader
              v-if="state.loadingProjects"
              type="table"
              class="my-2"
            ></v-skeleton-loader>

            <template v-else>
              <v-table density="comfortable" class="project-table">
                <thead>
                  <tr>
                    <th>
                      <button type="button" class="sort-button" @click="sortBy('name')">
                        Desk Name <v-icon size="small" :icon="sortIcon('name')" />
                      </button>
                    </th>
                    <th>
                      <button type="button" class="sort-button" @click="sortBy('size')">
                        Size <v-icon size="small" :icon="sortIcon('size')" />
                      </button>
                    </th>
                    <th>
                      <button type="button" class="sort-button" @click="sortBy('nodes')">
                        Items (nodes) <v-icon size="small" :icon="sortIcon('nodes')" />
                      </button>
                    </th>
                    <th>
                      <button type="button" class="sort-button" @click="sortBy('expires')">
                        Expires <v-icon size="small" :icon="sortIcon('expires')" />
                      </button>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="project in sortedProjects" :key="project['@rid']">
                    <td
                      class="font-weight-medium project-name-click"
                      role="button"
                      tabindex="0"
                      title="Open desk"
                      @click="openProject(project)"
                      @keyup.enter="openProject(project)"
                    >
                      {{ project.displayName }}
                    </td>
                    <td>{{ project.sizeText }}</td>
                    <td>{{ project.nodeCountText }}</td>
                    <td>{{ project.expirationText }}</td>
                    <td>
                      <div class="d-flex justify-end">
                        <v-btn
                          icon="mdi-pencil"
                          size="small"
                          variant="text"
                          color="secondary"
                          title="Rename desk"
                          @click="openRenameDialog(project)"
                        ></v-btn>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <div v-if="projectsWithMeta.length === 0" class="empty-state">
                No desks yet. Create your first one below.
              </div>
            </template>
          </v-card-text>
        </v-card>

        <v-card ref="createSection" class="panel create-panel" rounded="xl" elevation="2">
          <v-card-title>
            <div class="text-overline">Start Something New</div>
            <div class="text-h5 font-weight-bold">Create New Project</div>
          </v-card-title>

          <v-card-text>
            <p class="mb-4">
              Give your desk a clear name, for example: <i>Letters 1917</i> or <i>Museum Photos Spring</i>.
            </p>

            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  ref="projectInput"
                  v-model="state.projectName"
                  label="Desk Name"
                  variant="outlined"
                  hide-details="auto"
                  @keyup.enter="createProject"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4" class="d-flex align-center">
                <v-btn
                  class="w-100"
                  color="secondary"
                  size="large"
                  variant="flat"
                  :loading="state.createPending"
                  @click="createProject"
                >
                  Create Desk
                </v-btn>
              </v-col>
            </v-row>

            <v-alert v-if="state.createError" type="error" variant="tonal" class="mt-4">
              {{ state.createError }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4" class="reveal-3 right-column">
        <v-card class="panel mb-6" rounded="xl" elevation="2">
          <v-card-title>
            <div class="text-overline">Live Jobs</div>
            <div class="text-h6 font-weight-bold">Running Processing Jobs</div>
          </v-card-title>

          <v-card-text>
            <v-list v-if="runningJobs.length > 0" class="bg-transparent" lines="two">
              <v-list-item v-for="job in runningJobs" :key="job.rid" class="px-0">
                <v-list-item-title>{{ job.rid }}</v-list-item-title>
                <v-list-item-subtitle>{{ job.message }}</v-list-item-subtitle>
                <template #append>
                  <v-chip size="small" :color="job.status === 'paused' ? 'warning' : (job.status === 'cancelling' ? 'error' : 'success')" variant="tonal">
                    {{ job.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>

            <div v-else class="empty-state">
              No running jobs right now.
            </div>
          </v-card-text>
        </v-card>

        <v-card class="panel mb-6" rounded="xl" elevation="2">
          <v-card-title>
            <div class="text-overline">Live Now</div>
            <div class="text-h6 font-weight-bold">Active Crunchers</div>
          </v-card-title>

          <v-card-text>
            <v-skeleton-loader
              v-if="state.loadingCrunchers"
              type="list-item-three-line"
            ></v-skeleton-loader>

            <v-list v-else class="bg-transparent" lines="two">
              <v-list-item v-for="service in activeCrunchers" :key="service.id" class="px-0">
                <v-list-item-title>{{ service.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ service.description }}</v-list-item-subtitle>
                <template #append>
                  <v-chip color="primary" size="small" variant="tonal">{{ service.workers }} running</v-chip>
                </template>
              </v-list-item>
            </v-list>

            <div v-if="!state.loadingCrunchers && activeCrunchers.length === 0" class="empty-state">
              No active crunchers right now.
            </div>
          </v-card-text>
        </v-card>

        <v-card class="panel mb-6" rounded="xl" elevation="2">
          <v-card-title>
            <div class="text-overline">Learn By Doing</div>
            <div class="text-h6 font-weight-bold">Example Cases</div>
          </v-card-title>
          <v-card-text>
            <v-list class="bg-transparent" lines="three">
              <v-list-item v-for="example in state.examples" :key="example.title" class="px-0">
                <v-list-item-title>{{ example.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ example.description }}</v-list-item-subtitle>
                <template #append>
                  <v-btn size="small" variant="text" color="primary" @click="openRoute(example.route)">
                    Open
                  </v-btn>
                </template>
                <template #prepend>
                  <v-chip size="x-small" variant="outlined">{{ example.level }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card class="panel" rounded="xl" elevation="2">
          <v-card-title>
            <div class="text-overline">Updates</div>
            <div class="text-h6 font-weight-bold">News</div>
          </v-card-title>
          <v-card-text>
            <v-timeline density="compact" side="end" truncate-line="both">
              <v-timeline-item
                v-for="item in state.news"
                :key="item.title"
                dot-color="secondary"
                size="small"
              >
                <div class="text-caption text-medium-emphasis">{{ formatExpiration({ expires_at: item.date }) }}</div>
                <div class="font-weight-medium">{{ item.title }}</div>
                <div class="text-body-2">{{ item.text }}</div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="state.renameDialog" max-width="560">
      <v-card>
        <v-card-title>Rename Desk</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="state.renameProjectName"
            label="Desk Name"
            variant="outlined"
            hide-details="auto"
            @keyup.enter="renameProject"
          ></v-text-field>
          <v-alert v-if="state.renameError" type="error" variant="tonal" class="mt-4">
            {{ state.renameError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeRenameDialog">Cancel</v-btn>
          <v-btn color="primary" :loading="state.renamePending" @click="renameProject">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <footer class="main-footer mt-8">
      <div class="footer-text">Created by Open Science Centre/University of Jyvaskyla</div>
      <a
        href="https://github.com/OSC-JYU/MessyDesk"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >
        github: https://github.com/OSC-JYU/MessyDesk
      </a>
    </footer>
        </v-container>
      </v-main>
    </v-layout>
  </v-card>
</template>

<style scoped>
@font-face {
  font-family: 'Junicode';
  src: url('../assets/fonts/junicode.woff') format('woff');
  font-weight: 400;
  font-style: normal;
}

.main-shell {
  --md-page-base: #edf2f6;
  --md-ink: #17324f;
  --md-muted: #4f6580;
  --md-accent: #1976d2;
  --md-secondary: #1f8a70;
  --md-panel: rgba(255, 255, 255, 0.92);
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 12%, rgba(25, 118, 210, 0.14), transparent 28%),
    radial-gradient(circle at 78% 16%, rgba(31, 138, 112, 0.12), transparent 30%),
    linear-gradient(125deg, #e6edf4 0%, var(--md-page-base) 52%, #dce7f2 100%);
  color: var(--md-ink);
  font-family: 'Junicode', 'Palatino Linotype', serif;
}

.main-scroll {
  overflow-y: auto;
}

.right-column {
  position: relative;
  overflow: hidden;
}

.right-column::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(19, 84, 122, 0.2), rgba(128, 208, 199, 0.14)), url('../assets/images/right-column-bg2.png');
  background-size: cover;
  background-position: center;
  opacity: 0.28;
  pointer-events: none;
  z-index: 0;
}

.right-column > * {
  position: relative;
  z-index: 1;
}

.hero {
  max-width: 900px;
  position: relative;
  z-index: 1;
}

.hero-logo-slot {
  display: flex;
  align-items: center;
}

.hero-kicker {
  font-size: 0.9rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1f8a70;
  font-weight: 700;
}

.hero-title {
  font-size: clamp(1.9rem, 3.2vw, 3rem);
  line-height: 1.1;
  color: #124870;
}

.hero-text {
  font-size: clamp(1.05rem, 1.4vw, 1.25rem);
  color: var(--md-muted);
  max-width: 760px;
}

.panel {
  border: 1px solid rgba(18, 72, 112, 0.14);
  background: var(--md-panel);
  backdrop-filter: blur(2px);
  box-shadow: 0 6px 18px rgba(14, 67, 101, 0.08);
  position: relative;
  z-index: 1;
}

.create-panel {
  border-top: 4px solid #1976d2;
}

.project-table :deep(th) {
  color: var(--md-muted);
  font-weight: 700;
}

.sort-button {
  border: 0;
  background: transparent;
  color: inherit;
  font-weight: inherit;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0;
  cursor: pointer;
}

.sort-button:hover {
  color: #1565c0;
}

.project-table :deep(td) {
  border-bottom-color: rgba(25, 84, 124, 0.12);
}

.project-name-click {
  cursor: pointer;
}

.project-name-click:hover {
  color: #1565c0;
  text-decoration: underline;
}

.org-logo-card {
  background: rgba(255, 255, 255, 0.84);
}

.org-logo {
  max-width: 100%;
  max-height: 78px;
  object-fit: contain;
}

.empty-state {
  margin-top: 1rem;
  border: 1px dashed rgba(25, 84, 124, 0.26);
  border-radius: 10px;
  padding: 1rem;
  color: var(--md-muted);
  background: rgba(255, 255, 255, 0.52);
}

.main-footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid rgba(25, 84, 124, 0.2);
  padding-top: 1rem;
  padding-bottom: 0.5rem;
  color: var(--md-muted);
}

.footer-text {
  font-size: 0.92rem;
}

.footer-link {
  display: inline-block;
  margin-top: 0.3rem;
  color: #1565c0;
  text-decoration: none;
  font-size: 0.92rem;
}

.footer-link:hover {
  text-decoration: underline;
}

.reveal-1,
.reveal-2,
.reveal-3 {
  opacity: 0;
  transform: translateY(12px);
  animation: riseIn 520ms ease forwards;
}

.reveal-2 {
  animation-delay: 120ms;
}

.reveal-3 {
  animation-delay: 220ms;
}

@keyframes riseIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1279px) {
  .right-column::before {
    opacity: 0.14;
  }

  .hero {
    margin-bottom: 1.25rem;
  }
}
</style>
