import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDocInfo } from '@/api/files.js'
import { getNodePath, getSetFiles } from '@/api/projects.js'
import { fileBrowse } from '@/stores/fileBrowse.js'
import { setContextFromQuery, setContextToQuery } from './browseQuery.js'
import { fileAtOffset } from './lineage.js'
import { ridParam, toRid } from './fileTypes.js'

// Which file the viewer shows and how the user moves between files: the
// route (/project/:rid/file/:fileRid or /files/:rid), previous/next in a set
// or result list, and stepping up the lineage.
//
// `contextRid` is the file the user is browsing (a set member or a search
// hit); `offset` is how many lineage steps from it the shown file is, so
// that previous/next keep showing, say, the OCR result of each page.
export function useFileViewer() {
  const route = useRoute()
  const router = useRouter()

  const deskRid = computed(() => (route.name === 'project-file' ? ridParam(route.params.rid) : ''))
  const routeFileRid = computed(() =>
    toRid(route.name === 'project-file' ? route.params.fileRid : route.params.rid),
  )
  const nav = reactive({ contextRid: null, offset: 0, loading: false, error: null })
  let pendingContext = null
  let token = 0

  async function ensureFile(rid) {
    if (fileBrowse.file?.['@rid'] === rid) return
    const mine = ++token
    nav.loading = true
    nav.error = null
    try {
      const file = await getDocInfo(rid)
      if (mine === token && routeFileRid.value === rid) fileBrowse.file = file
    } catch (error) {
      if (mine === token) nav.error = error
    } finally {
      if (mine === token) nav.loading = false
    }
  }

  // The route decides the file; a set context in the query survives reloads.
  watch(
    routeFileRid,
    async (rid, previous) => {
      if (!rid) return
      const fromQuery = setContextFromQuery(route.query)
      if (fromQuery) fileBrowse.context = fromQuery
      if (pendingContext) {
        nav.contextRid = pendingContext
        pendingContext = null
      } else if (previous !== undefined || !nav.contextRid) {
        nav.contextRid = rid
        nav.offset = 0
      }
      await ensureFile(rid)
    },
    { immediate: true },
  )

  async function shownRidFor(contextRid) {
    if (!nav.offset) return contextRid
    const path = await getNodePath(contextRid).catch(() => null)
    return fileAtOffset(path, contextRid, nav.offset)
  }

  async function go(rid, { keepContext = false, contextRid = null } = {}) {
    const target = toRid(rid)
    if (keepContext) {
      pendingContext = contextRid || nav.contextRid
      nav.contextRid = pendingContext
    } else {
      pendingContext = null
      Object.assign(nav, { contextRid: target, offset: 0 })
    }
    const query = keepContext ? setContextToQuery(fileBrowse.context) : undefined
    const location = deskRid.value
      ? { name: 'project-file', params: { rid: deskRid.value, fileRid: ridParam(target) }, query }
      : { name: 'files', params: { rid: ridParam(target) } }
    if (target === routeFileRid.value) {
      pendingContext = null
      await router.replace(location)
      await ensureFile(target)
    } else {
      await router.push(location)
    }
  }

  async function step(delta) {
    const ctx = fileBrowse.context
    if (ctx?.mode === 'set') {
      const skip = (ctx.skip || 0) + delta
      if (skip < 0 || skip >= (ctx.file_count || 0)) return
      const response = await getSetFiles(ctx.set_rid, skip, 1)
      const file = response?.files?.[0]
      if (!file) return
      ctx.skip = skip
      await go(await shownRidFor(file['@rid']), { keepContext: true, contextRid: file['@rid'] })
    } else if (ctx?.mode === 'search') {
      const index = (ctx.index || 0) + delta
      const result = ctx.results?.[index]
      if (!result) return
      ctx.index = index
      await go(await shownRidFor(result.rid), { keepContext: true, contextRid: result.rid })
    }
  }

  // A file up (or down) the lineage of the browsed file was picked.
  function openInLineage({ node, offset }) {
    nav.offset = offset
    return go(node['@rid'], { keepContext: true })
  }

  function close() {
    if (deskRid.value) router.push({ name: 'project-graph', params: { rid: deskRid.value } })
    else router.back()
  }

  function back() {
    const ctx = fileBrowse.context
    if (ctx?.mode === 'set' && deskRid.value && ctx.set_rid) {
      const query = { openSet: ridParam(ctx.set_rid) }
      if (ctx.source_rid) query.sourceRid = ridParam(ctx.source_rid)
      router.push({ name: 'project-graph', params: { rid: deskRid.value }, query })
    } else if (ctx?.mode === 'search' && ctx.returnTo) {
      // The Search or Tags page the file was opened from.
      router.push(ctx.returnTo)
    } else if (ctx?.mode === 'search' && deskRid.value) {
      router.push({ name: 'project-search', params: { rid: deskRid.value } })
    } else {
      close()
    }
  }

  return { nav, deskRid, step, openInLineage, close, back }
}
