import { reactive, ref, watch } from 'vue'
import { getNerRegions } from '@/api/entities.js'
import { importTextSpans } from '@/api/files.js'
import { ownerTextApi } from './textApi.js'
import { makeRegionId, regionsOf } from './textRegions.js'

// The regions of one text in one ROI set, loaded from and saved to the backend. Every change is
// saved right away; saving always replaces all regions of the text in the set.
export function useTextRois(fileRid, setRid, api = ownerTextApi) {
  const state = reactive({ regions: [], tags: {}, stale: false, loading: false, saving: false, error: null })
  const savedNotice = ref(false)
  let token = 0

  async function load() {
    const file = fileRid()
    const set = setRid()
    state.regions = []
    state.tags = {}
    state.stale = false
    state.error = null
    if (!file || !set) return
    const mine = ++token
    state.loading = true
    try {
      const data = await api.getRegions(file, set)
      if (mine !== token) return
      state.regions = regionsOf(data)
      state.tags = data?.region_tags || {}
      state.stale = Boolean(data?.stale)
    } catch (error) {
      // No ROI file yet: a text without regions.
      if (error?.response?.status && error.response.status !== 404) state.error = error
    } finally {
      if (mine === token) state.loading = false
    }
  }

  async function save() {
    const file = fileRid()
    const set = setRid()
    if (!file || !set) return
    state.saving = true
    state.error = null
    try {
      const map = Object.fromEntries(state.regions.map((r) => [r.id, r]))
      await api.saveRegions(file, set, map)
      state.stale = false
      savedNotice.value = true
    } catch (error) {
      state.error = error
    } finally {
      state.saving = false
    }
  }

  async function add(start, end) {
    const region = { id: makeRegionId(), type: 'text', start, end }
    state.regions = [...state.regions, region].sort((a, b) => a.start - b.start || b.end - a.end)
    await save()
    return region
  }

  // Moves the edges of a region. Its tags stay with it.
  async function setRange(id, start, end) {
    state.regions = state.regions
      .map((r) => (r.id === id ? { ...r, start, end, text: undefined } : r))
      .sort((a, b) => a.start - b.start || b.end - a.end)
    await save()
  }

  async function remove(id) {
    state.regions = state.regions.filter((r) => r.id !== id)
    const rest = { ...state.tags }
    delete rest[id]
    state.tags = rest
    await save()
  }

  // Runs of named-entity recognition on this text, to import their spans as passages.
  async function nerRuns() {
    const runs = (await getNerRegions(fileRid()).catch(() => [])) || []
    return runs
      .filter((run) => !run.error)
      .map((run) => {
        const spans = Object.values(run.rois || {}).filter((r) => Number.isInteger(r?.start))
        const labels = {}
        for (const s of spans) if (s.label) labels[s.label] = (labels[s.label] || 0) + 1
        return { rid: run.rid, service: run.service_id, task: run.task, created: run.created, labels }
      })
      .filter((run) => Object.keys(run.labels).length)
  }

  async function importRun(nerRid, labels) {
    state.error = null
    try {
      const result = await importTextSpans(fileRid(), setRid(), nerRid, labels)
      await load()
      return result
    } catch (error) {
      state.error = error
      return null
    }
  }

  // A region can have any number of tags, or none.
  async function tag(regionId, entity) {
    if ((state.tags[regionId] || []).some((t) => t.rid === entity.rid)) return
    state.error = null
    try {
      await api.tag(fileRid(), setRid(), regionId, entity.rid)
      state.tags = {
        ...state.tags,
        [regionId]: [...(state.tags[regionId] || []), { ...entity }],
      }
    } catch (error) {
      state.error = error
    }
  }

  async function untag(regionId, entityRid) {
    state.error = null
    try {
      await api.untag(fileRid(), setRid(), regionId, entityRid)
      state.tags = {
        ...state.tags,
        [regionId]: (state.tags[regionId] || []).filter((t) => t.rid !== entityRid),
      }
    } catch (error) {
      state.error = error
    }
  }

  watch(() => [fileRid(), setRid()], load, { immediate: true })
  return { state, savedNotice, nerRuns, importRun, add, setRange, remove, tag, untag, reload: load }
}
