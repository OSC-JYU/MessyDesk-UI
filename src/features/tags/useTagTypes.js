import { reactive } from 'vue'
import { createEntityType, deleteEntityType, getEntityTypes } from '@/api/entities.js'

// The user's tag types with how many tags each has (in all desks): add a type and delete an
// empty one. `onChanged` runs after an add or delete so other lists can refresh.
export function useTagTypes(onChanged) {
  const state = reactive({
    types: [],
    loading: false,
    error: null,
    name: '',
    color: 'blue-grey',
    adding: false,
    addError: null,
    confirm: { open: false, type: null, pending: false, error: null },
  })

  async function load() {
    state.loading = true
    state.error = null
    try {
      state.types = (await getEntityTypes({ counts: true })) || []
    } catch (error) {
      state.error = error
    } finally {
      state.loading = false
    }
  }

  async function add() {
    const name = state.name.trim()
    if (!name) return
    state.adding = true
    state.addError = null
    try {
      await createEntityType(name, state.color)
      state.name = ''
      state.color = 'blue-grey'
      await load()
      await onChanged?.()
    } catch (error) {
      state.addError = error
    } finally {
      state.adding = false
    }
  }

  function askDelete(type) {
    Object.assign(state.confirm, { open: true, type, pending: false, error: null })
  }

  async function confirmDelete() {
    const confirm = state.confirm
    confirm.pending = true
    confirm.error = null
    try {
      await deleteEntityType(confirm.type.type)
      confirm.open = false
      await load()
      await onChanged?.()
    } catch (error) {
      confirm.error = error
    } finally {
      confirm.pending = false
    }
  }

  return { state, load, add, askDelete, confirmDelete }
}
