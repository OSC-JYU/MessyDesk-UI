import { reactive } from 'vue'
import { getDemos, importDemo } from '@/api/demos.js'

// The demo desks shared with the user ("Learn MessyDesk") and copying one into a new desk.
export function useDemos() {
  const state = reactive({ demos: [], importing: '', copied: {}, error: null })

  // A failed list is not an error for the user: the card stays hidden.
  async function load() {
    try {
      state.demos = (await getDemos()) || []
    } catch {
      state.demos = []
    }
  }

  // Copies a demo into a new desk. Returns the route rid of the new desk, or '' when the copy
  // failed. A demo that was copied stays marked as copied until the page is left.
  async function copy(demo) {
    state.importing = demo.id
    state.error = null
    try {
      const result = await importDemo(demo.id)
      const rid = String(result?.project?.['@rid'] || '').replace('#', '')
      if (rid) state.copied[demo.id] = rid
      return rid
    } catch (error) {
      state.error = error
      return ''
    } finally {
      state.importing = ''
    }
  }

  return { state, load, copy }
}
