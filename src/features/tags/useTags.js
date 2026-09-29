import { computed, reactive, watch } from 'vue'
import { getEntities, getEntityItems, getMachineTags, getNerLabelGroups } from '@/api/entities.js'
import { recall, remember } from '@/stores/pageMemory.js'
import { taggedFileToResult } from '@/features/search/results.js'
import { groupByRun, manualTagTypes } from './tagGroups.js'

// State of the Tags screen for one scope (a desk, or 'global').
export function useTags(scope, fixedDeskRid) {
  const state = reactive({
    types: [],
    selected: [],
    files: [],
    page: 1,
    desks: [],
    search: '',
    nerLabels: [],
    machineTags: [],
    filterIgnored: false,
    loading: false,
    error: null,
  })

  const deskRids = computed(() => (fixedDeskRid.value ? [fixedDeskRid.value] : state.desks))
  const manualTypes = computed(() => manualTagTypes(state.types, state.search))
  const nerGroups = computed(() => groupByRun(state.nerLabels))
  const machineGroups = computed(() => groupByRun(state.machineTags))
  const results = computed(() => state.files.map(taggedFileToResult))
  // With tags selected, NER browsing is narrowed to the files that have them.
  const selectedFileRids = computed(() =>
    state.selected.length ? state.files.map((file) => file['@rid'] || file.rid) : [],
  )

  async function guard(action) {
    try {
      state.error = null
      await action()
    } catch (error) {
      state.error = error
    }
  }

  const loadTypes = () =>
    guard(async () => (state.types = (await getEntities({ projectRids: deskRids.value })) || []))

  const loadNer = () =>
    guard(async () => {
      const [labels, machine] = await Promise.all([
        getNerLabelGroups(String(state.search || '').trim(), {
          projectRids: deskRids.value,
          fileRids: selectedFileRids.value,
        }),
        getMachineTags(),
      ])
      state.nerLabels = labels || []
      state.machineTags = machine || []
    })

  async function loadFiles() {
    if (!state.selected.length) {
      state.files = []
    } else {
      state.loading = true
      await guard(async () => {
        const response = await getEntityItems(state.selected, { projectRids: deskRids.value })
        state.filterIgnored = Boolean(response?._project_filter_ignored)
        state.files = Array.isArray(response) ? response : []
      })
      state.loading = false
    }
    state.page = 1
    await loadNer()
  }

  function isSelected(rid) {
    return state.selected.some((tag) => tag['@rid'] === rid)
  }

  function toggle(tag) {
    state.selected = isSelected(tag['@rid'])
      ? state.selected.filter((t) => t['@rid'] !== tag['@rid'])
      : [...state.selected, tag]
    return loadFiles()
  }

  async function restore(key) {
    const saved = recall('tags', key)
    Object.assign(state, {
      selected: saved?.selected || [],
      files: saved?.files || [],
      page: saved?.page || 1,
      desks: saved?.desks || [],
      search: saved?.search || '',
      filterIgnored: Boolean(saved?.filterIgnored),
      error: null,
    })
    await loadTypes()
    await loadNer()
  }

  watch(scope, restore, { immediate: true })
  watch(
    () => [state.selected, state.files, state.page, state.desks, state.search],
    () =>
      remember('tags', scope.value, {
        selected: state.selected,
        files: state.files,
        page: state.page,
        desks: state.desks,
        search: state.search,
        filterIgnored: state.filterIgnored,
      }),
    { deep: true },
  )

  let searchTimer = null
  watch(
    () => state.search,
    () => {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(loadNer, 300)
    },
  )
  watch(
    () => state.desks,
    async () => {
      await loadTypes()
      await loadFiles()
    },
    { deep: true },
  )

  return {
    state,
    deskRids,
    manualTypes,
    nerGroups,
    machineGroups,
    results,
    selectedFileRids,
    isSelected,
    toggle,
    loadTypes,
  }
}
