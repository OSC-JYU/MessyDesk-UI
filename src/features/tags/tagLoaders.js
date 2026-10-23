import { getEntities, getEntitiesByType, getMachineTags, getRoiLabels } from '@/api/entities.js'

// Loading of the tag lists shared by the Tags page and the TagPicker. They fill a reactive
// `state` that has `search`, `types`, `typeItems`, `machineTags` and `error`; `deskRids` is a
// ref/computed array of the desks the lists are limited to (none = all).
export function createTagLoaders(state, deskRids) {
  async function guard(action) {
    try {
      state.error = null
      await action()
    } catch (error) {
      state.error = error
    }
  }

  const tagQuery = () => ({ projectRids: deskRids.value, createdBy: 'user', search: state.search })

  const loadTypes = () =>
    guard(async () => {
      state.types = (await getEntities(tagQuery())) || []
      state.typeItems = {}
    })

  // Loads the first page of a type's tags, or with `more` the next page.
  async function loadType(type, more = false) {
    const current = state.typeItems[type]
    if (current?.loading || (current && !more)) return
    const skip = more && current ? current.items.length : 0
    state.typeItems[type] = {
      items: current?.items || [],
      total: current?.total ?? 0,
      loading: true,
    }
    await guard(async () => {
      const page = await getEntitiesByType(type, { ...tagQuery(), skip })
      state.typeItems[type] = {
        items: [...(skip ? current.items : []), ...(page?.items || [])],
        total: page?.total ?? 0,
        loading: false,
      }
    })
    if (state.typeItems[type]?.loading) state.typeItems[type].loading = false
  }

  const loadMachine = () =>
    guard(async () => {
      state.machineTags = (await getMachineTags({ projectRids: deskRids.value })) || []
    })

  return { guard, loadTypes, loadType, loadMachine }
}

// Pages of ROI labels (indexed `ner.json` runs) into `roi` ({ items, hasMore, loading, error }).
// A failure (for example the search index being down) is kept in `roi.error` only.
export function createRoiLoader(roi, deskRids, search) {
  let token = 0

  return async function loadRoi(more = false) {
    if (roi.loading && more) return
    const mine = ++token
    const offset = more ? roi.items.length : 0
    roi.loading = true
    roi.error = null
    try {
      const page = await getRoiLabels({
        projectRids: deskRids.value,
        search: search(),
        offset,
      })
      if (mine !== token) return
      roi.items = [...(more ? roi.items : []), ...(page?.items || [])]
      roi.hasMore = Boolean(page?.hasMore)
      roi.loaded = true
    } catch (error) {
      if (mine !== token) return
      roi.error = error
      if (!more) roi.items = []
      roi.hasMore = false
    } finally {
      if (mine === token) roi.loading = false
    }
  }
}
