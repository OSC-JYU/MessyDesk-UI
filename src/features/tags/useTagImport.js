import { computed, reactive, watch } from 'vue'
import { getTagAdmin, importDeskTags } from '@/api/entities.js'
import { getProjects } from '@/api/projects.js'
import { sameRid } from './tagAdmin.js'

const IMPORT_PAGE_SIZE = 50

// "Import from another desk": pick one of the user's other desks, search its human tags, tick
// some (or take them all) and add them to `deskRid`. Tags the desk already has are not pickable.
export function useTagImport(deskRid, onDone) {
  const state = reactive({
    desks: [],
    from: '',
    items: [],
    total: 0,
    search: '',
    selected: [],
    loading: false,
    pending: false,
    error: null,
    result: null,
  })

  const hasTag = (tag) => (tag.desks || []).some((desk) => sameRid(desk.rid, deskRid.value))
  const pickable = computed(() => state.items.filter((tag) => !hasTag(tag)))

  async function loadDesks() {
    try {
      state.desks = (await getProjects())
        .filter((p) => !sameRid(p['@rid'], deskRid.value))
        .map((p) => ({ value: p['@rid'], title: p.label || p['@rid'] }))
    } catch (error) {
      state.error = error
    }
  }

  let token = 0
  // Loads the first page of the other desk's tags, or with `more` the next one.
  async function load(more = false) {
    if (!state.from) return
    const mine = ++token
    state.loading = true
    state.error = null
    try {
      const page = await getTagAdmin({
        projectRid: state.from,
        search: state.search,
        skip: more ? state.items.length : 0,
        limit: IMPORT_PAGE_SIZE,
      })
      if (mine !== token) return
      state.items = [...(more ? state.items : []), ...(page?.items || [])]
      state.total = page?.total ?? state.items.length
    } catch (error) {
      if (mine !== token) return
      state.error = error
    } finally {
      if (mine === token) state.loading = false
    }
  }

  function reset() {
    Object.assign(state, { from: '', items: [], total: 0, search: '', selected: [], result: null })
    state.error = null
    return loadDesks()
  }

  function toggle(tag) {
    state.selected = state.selected.includes(tag.rid)
      ? state.selected.filter((rid) => rid !== tag.rid)
      : [...state.selected, tag.rid]
  }

  async function run(payload) {
    state.pending = true
    state.error = null
    try {
      state.result = await importDeskTags(deskRid.value, payload)
      state.selected = []
      await onDone?.()
      await load()
    } catch (error) {
      state.error = error
    } finally {
      state.pending = false
    }
  }

  const importSelected = () => state.selected.length && run({ entity_rids: state.selected })
  const importAll = () => state.from && run({ from_project_rid: state.from })

  watch(
    () => state.from,
    () => {
      state.selected = []
      state.result = null
      state.items = []
      return load()
    },
  )
  let timer = null
  watch(
    () => state.search,
    () => {
      clearTimeout(timer)
      timer = setTimeout(load, 300)
    },
  )

  return { state, pickable, hasTag, reset, load, toggle, importSelected, importAll }
}
