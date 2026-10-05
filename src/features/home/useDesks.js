import { computed, onMounted, onUnmounted, reactive } from 'vue'
import {
  createProject,
  deleteProject,
  getProjects,
  getStorageSummary,
  reindexProjectSearch,
  setProjectAttribute,
  updateProjectSizes,
} from '@/api/projects.js'
import { getSearchInfo } from '@/api/search.js'
import { indexedDocsByProject, sortDesks, toDeskRow } from './desks.js'

// State and actions of the desk list on the home screen.
export function useDesks() {
  const state = reactive({
    projects: [],
    docsByProject: null,
    storage: null,
    loading: false,
    error: null,
    sortKey: 'name',
    sortDirection: 'asc',
  })

  const rows = computed(() => {
    const all = state.projects.map((project) => toDeskRow(project, state.docsByProject))
    return sortDesks(all, state.sortKey, state.sortDirection)
  })

  async function load() {
    state.loading = true
    state.error = null
    const [projects, searchInfo, storage] = await Promise.allSettled([
      getProjects(),
      getSearchInfo(),
      getStorageSummary(),
    ])
    if (projects.status === 'fulfilled') state.projects = projects.value || []
    else state.error = projects.reason
    state.docsByProject =
      searchInfo.status === 'fulfilled' ? indexedDocsByProject(searchInfo.value) : null
    if (storage.status === 'fulfilled') state.storage = storage.value
    state.loading = false
  }

  // Recalculates desk sizes on the server, then reloads.
  async function refresh() {
    state.loading = true
    try {
      await updateProjectSizes()
    } catch (error) {
      state.error = error
    }
    await load()
  }

  function sortBy(key) {
    if (state.sortKey === key) {
      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      state.sortKey = key
      state.sortDirection = 'asc'
    }
  }

  // Returns the new desk's route rid.
  async function create(name) {
    const x = Math.floor(Math.random() * 200)
    const y = Math.floor(Math.random() * 200)
    const created = await createProject(name, '', x, y)
    if (created?.['@rid']) return created['@rid'].replace('#', '')
    await load()
    return state.projects
      .find((p) => String(p.label || '').trim() === name)
      ?.['@rid']?.replace('#', '')
  }

  async function rename(rid, label) {
    await setProjectAttribute(rid, { key: 'label', value: label })
    await load()
  }

  async function reindex(rid) {
    const result = await reindexProjectSearch(rid)
    await load()
    return result
  }

  async function remove(rid) {
    await deleteProject(rid)
    await load()
  }

  // A desk is deleted in the background (backend decision G5): it leaves the list at once; the
  // list is reloaded when the delete ends (storage figures change, or the desk comes back if the
  // delete failed).
  function onEvent({ detail: event }) {
    if (event?.command === 'delete_finished' || event?.command === 'delete_failed') load()
  }
  onMounted(() => window.addEventListener('md-sse', onEvent))
  onUnmounted(() => window.removeEventListener('md-sse', onEvent))

  return { state, rows, load, refresh, sortBy, create, rename, reindex, remove }
}
