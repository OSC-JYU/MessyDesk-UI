import { computed, reactive, watch } from 'vue'
import { getEntityItems, getNerLabelGroups } from '@/api/entities.js'
import { recall, remember } from '@/stores/pageMemory.js'
import { taggedFileToResult } from '@/features/search/results.js'
import { groupByRun } from './tagGroups.js'
import { createTagLoaders } from './tagLoaders.js'

// Files shown per page; the server pages the tagged files.
export const TAGGED_FILES_PER_PAGE = 24

// State of the Tags screen for one scope (a desk, or 'global').
export function useTags(scope, fixedDeskRid) {
  const state = reactive({
    // Manual tag types with counts; a type's tags are loaded when it is opened (typeItems).
    types: [],
    typeItems: {},
    selected: [],
    // Files with any ('or', the default) or all ('and') of the selected tags.
    match: 'or',
    files: [],
    total: 0,
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
  const manualTypes = computed(() => state.types)
  const nerGroups = computed(() => groupByRun(state.nerLabels))
  const machineGroups = computed(() => groupByRun(state.machineTags))
  const results = computed(() => state.files.map(taggedFileToResult))
  // With tags selected, NER browsing is narrowed (by the server) to the files that have them.
  const selectedTagRids = computed(() => state.selected.map((tag) => tag['@rid']))

  const { guard, loadTypes, loadType, loadMachine } = createTagLoaders(state, deskRids)

  const loadNer = () =>
    guard(async () => {
      const [labels] = await Promise.all([
        getNerLabelGroups(String(state.search || '').trim(), {
          projectRids: deskRids.value,
          tagRids: selectedTagRids.value,
          tagMatch: state.match,
        }),
        loadMachine(),
      ])
      state.nerLabels = labels || []
    })

  // The page of files the grid shows; changing the page does not reload the NER lists.
  let loadedPage = 1
  async function loadPage() {
    loadedPage = state.page
    state.loading = true
    await guard(async () => {
      const response = await getEntityItems(state.selected, {
        projectRids: deskRids.value,
        match: state.match,
        skip: (state.page - 1) * TAGGED_FILES_PER_PAGE,
        limit: TAGGED_FILES_PER_PAGE,
      })
      state.filterIgnored = Boolean(response?._project_filter_ignored)
      state.files = response?.items || []
      state.total = response?.total || 0
    })
    state.loading = false
  }

  async function loadFiles() {
    state.page = 1
    loadedPage = 1
    if (state.selected.length) {
      await loadPage()
    } else {
      state.files = []
      state.total = 0
    }
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
      match: saved?.match === 'and' ? 'and' : 'or',
      files: saved?.files || [],
      total: saved?.total || 0,
      page: saved?.page || 1,
      desks: saved?.desks || [],
      search: saved?.search || '',
      filterIgnored: Boolean(saved?.filterIgnored),
      error: null,
    })
    loadedPage = state.page
    await loadTypes()
    await loadNer()
  }

  watch(scope, restore, { immediate: true })
  watch(
    () => [
      state.selected,
      state.match,
      state.files,
      state.total,
      state.page,
      state.desks,
      state.search,
    ],
    () =>
      remember('tags', scope.value, {
        selected: state.selected,
        match: state.match,
        files: state.files,
        total: state.total,
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
      searchTimer = setTimeout(() => {
        loadTypes()
        loadNer()
      }, 300)
    },
  )
  watch(
    () => state.page,
    () => state.page !== loadedPage && state.selected.length && loadPage(),
  )
  // The match only matters with several tags selected.
  watch(
    () => state.match,
    () => state.selected.length > 1 && loadFiles(),
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
    selectedTagRids,
    isSelected,
    toggle,
    loadTypes,
    loadType,
  }
}
