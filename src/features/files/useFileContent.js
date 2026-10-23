import { reactive, watch } from 'vue'
import { getNodeFile } from '@/api/files.js'

// Loads the content of `file` (a ref/getter to a file node) whenever the
// file changes, ignoring answers for a file that is no longer shown.
export function useFileContent(file) {
  const state = reactive({ content: null, loading: false, error: null })
  let token = 0

  async function load() {
    const rid = file()?.['@rid']
    if (!rid) return
    const mine = ++token
    state.loading = true
    state.error = null
    try {
      const content = await getNodeFile(rid)
      if (mine === token) state.content = content
    } catch (error) {
      if (mine === token) state.error = error
    } finally {
      if (mine === token) state.loading = false
    }
  }

  watch(() => file()?.['@rid'], load, { immediate: true })
  return { state, reload: load }
}

export function asText(content) {
  if (content === null || content === undefined) return ''
  return typeof content === 'string' ? content : JSON.stringify(content, null, 2)
}
