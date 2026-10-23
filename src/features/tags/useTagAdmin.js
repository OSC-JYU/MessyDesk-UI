import { reactive, ref, watch } from 'vue'
import {
  deleteEntity,
  getEntityUsage,
  getTagAdmin,
  removeDeskTag,
  renameEntity,
} from '@/api/entities.js'

export const ADMIN_PAGE_SIZE = 25

// The admin table of human tags for a desk (`deskRid` ref; empty = all the user's tags).
export function useTagAdmin(deskRid) {
  const state = reactive({
    items: [],
    total: 0,
    page: 1,
    search: '',
    loading: false,
    error: null,
  })

  let token = 0
  async function load() {
    const mine = ++token
    state.loading = true
    state.error = null
    try {
      const response = await getTagAdmin({
        projectRid: deskRid.value,
        search: state.search,
        skip: (state.page - 1) * ADMIN_PAGE_SIZE,
        limit: ADMIN_PAGE_SIZE,
      })
      if (mine !== token) return
      state.items = response?.items || []
      state.total = response?.total ?? state.items.length
    } catch (error) {
      if (mine !== token) return
      state.error = error
      state.items = []
    } finally {
      if (mine === token) state.loading = false
    }
  }

  let timer = null
  watch(
    () => state.search,
    () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        state.page = 1
        load()
      }, 300)
    },
  )
  watch(() => state.page, load)
  watch(deskRid, () => {
    state.page = 1
    load()
  })

  return { state, load }
}

// Rename, remove-from-desk and delete-everywhere of one tag. `begin` fetches the tag's usage for
// the warning; `confirm` does the action and calls `onDone` so the table can reload.
export function useTagAction(deskRid, onDone) {
  const state = reactive({
    open: false,
    action: null,
    tag: null,
    usage: null,
    label: '',
    loading: false,
    pending: false,
    error: null,
    conflict: false,
  })
  const opened = ref(0)

  async function begin(action, tag) {
    Object.assign(state, {
      open: true,
      action,
      tag,
      usage: null,
      label: tag.label,
      loading: true,
      pending: false,
      error: null,
      conflict: false,
    })
    const mine = ++opened.value
    try {
      const usage = await getEntityUsage(tag.rid)
      if (mine === opened.value) state.usage = usage
    } catch (error) {
      if (mine === opened.value) state.error = error
    } finally {
      if (mine === opened.value) state.loading = false
    }
  }

  const unchanged = () => state.action === 'rename' && state.label.trim() === state.tag?.label

  async function confirm() {
    if (state.action === 'rename' && (!state.label.trim() || unchanged())) return
    state.pending = true
    state.error = null
    state.conflict = false
    try {
      if (state.action === 'rename') await renameEntity(state.tag.rid, state.label.trim())
      else if (state.action === 'remove') await removeDeskTag(deskRid.value, state.tag.rid)
      else await deleteEntity(state.tag.rid)
      state.open = false
      await onDone?.()
    } catch (error) {
      state.conflict = error?.status === 409
      state.error = error
    } finally {
      state.pending = false
    }
  }

  return { state, begin, confirm, unchanged }
}
