import { reactive } from 'vue'
import { ownerTextApi } from './textApi.js'

// The tags of a desk, to code with: the codebook. Sorted by label, so a tag keeps its number
// (key 1-9) while the user codes. A tag made here is a human tag of the desk.
export function useCodebook(deskRid, setRid = () => '', api = ownerTextApi) {
  const state = reactive({ tags: [], loading: false, error: null })

  async function load() {
    const desk = deskRid()
    if (!desk && api === ownerTextApi) return
    state.loading = true
    state.error = null
    try {
      state.tags = (await api.tags(desk, setRid()))
        .map((t) => ({ rid: t.rid, label: t.label, color: t.color, icon: t.icon }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label)))
    } catch (error) {
      state.error = error
    } finally {
      state.loading = false
    }
  }

  // Makes the tag (or finds the desk's tag with this label) and adds it to the codebook.
  async function create(label) {
    if (!api.createTag) throw new Error('Tags cannot be made here')
    const row = await api.createTag(deskRid(), label)
    const rid = row?.['@rid'] || row?.rid
    if (!rid) throw new Error('The tag could not be created')
    const tag = { rid, label: row.label, color: row.color, icon: row.icon }
    if (!state.tags.some((t) => t.rid === rid)) {
      state.tags = [...state.tags, tag].sort((a, b) => String(a.label).localeCompare(String(b.label)))
    }
    return tag
  }

  load()
  return { state, create, reload: load }
}
