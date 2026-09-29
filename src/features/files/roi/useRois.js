import { reactive, ref, watch } from 'vue'
import { deleteImageROI, getImageROIs, saveImageROIs, updateImageROI } from '@/api/files.js'
import { normalizeRois, roiFileRid, shapesToMap } from './geometry.js'

// The regions of one image in one ROI set, loaded from and saved to the
// backend. With auto-save on, every change is saved right away.
export function useRois(fileRid, setRid) {
  const state = reactive({ shapes: [], roiRid: null, loading: false, dirty: false, error: null })
  const autoSave = ref(true)
  const savedNotice = ref(false)
  let token = 0

  async function load() {
    const file = fileRid()
    const set = setRid()
    state.shapes = []
    state.roiRid = null
    state.dirty = false
    if (!file || !set) return
    const mine = ++token
    state.loading = true
    try {
      const rois = await getImageROIs(file, set)
      if (mine !== token) return
      state.shapes = normalizeRois(rois)
      state.roiRid = roiFileRid(rois)
    } catch {
      // No ROI file yet: an image without regions.
    } finally {
      if (mine === token) state.loading = false
    }
  }

  async function save(force = false) {
    if (!autoSave.value && !force) {
      state.dirty = true
      return
    }
    const file = fileRid()
    const set = setRid()
    if (!file || !set) return
    const map = shapesToMap(state.shapes)
    state.error = null
    try {
      if (state.roiRid && !Object.keys(map).length) {
        await deleteImageROI(file, set, state.roiRid)
        state.roiRid = null
      } else if (state.roiRid) {
        await updateImageROI(file, set, state.roiRid, map)
      } else {
        const result = await saveImageROIs(file, set, map)
        state.roiRid = result?.data?.['@rid'] || result?.['@rid'] || null
      }
      state.dirty = false
      savedNotice.value = true
    } catch (error) {
      state.error = error
    }
  }

  watch(() => [fileRid(), setRid()], load, { immediate: true })
  watch(autoSave, (on) => on && state.dirty && save(true))

  return { state, autoSave, savedNotice, save, load }
}
