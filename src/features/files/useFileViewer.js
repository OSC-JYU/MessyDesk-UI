import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDocInfo } from '@/api/files.js'
import { getNodePath, getSetFiles } from '@/api/projects.js'
import { fileBrowse } from '@/stores/fileBrowse.js'
import { setContextFromQuery, setContextToQuery } from './browseQuery.js'
import { settings } from '@/stores/settings.js'
import { ancestorAt, fileAtOffset } from './lineage.js'
import { ridParam, toRid } from './fileTypes.js'

// Which file the viewer shows and how the user moves between files: the
// route (/project/:rid/file/:fileRid or /files/:rid), previous/next in a set
// or result list, and stepping up the lineage.
//
// `contextRid` is the file the user is browsing (a set member or a search
// hit); `offset` is how many lineage steps from it the shown file is, so
// that previous/next keep showing, say, the OCR result of each page.
//
// Side by side: a file picked in the lineage opens beside the browsed file
// instead of replacing it. `compareOffset` (1 = parent, 2 = grandparent) is how far
// up the lineage that file is; previous/next keep it at the same level, so each
// result stays next to its source. The level is in the URL (`?compare=1`).
export function useFileViewer() {
  const route = useRoute()
  const router = useRouter()

  const deskRid = computed(() => (route.name === 'project-file' ? ridParam(route.params.rid) : ''))
  const routeFileRid = computed(() =>
    toRid(route.name === 'project-file' ? route.params.fileRid : route.params.rid),
  )
  const nav = reactive({
    contextRid: null,
    offset: 0,
    compareOffset: 0,
    compareLoading: false,
    loading: false,
    error: null,
  })
  const sideBySide = computed(() => (fileBrowse.sideBySide ?? settings.lineage_compare) === 'on')
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
        const level = Number.parseInt(route.query.compare, 10)
        nav.contextRid = rid
        nav.offset = 0
        nav.compareOffset = previous === undefined && level > 0 ? level : 0
      }
      await ensureFile(rid)
    },
    { immediate: true },
  )

  // The file beside the browsed one: the ancestor `compareOffset` steps up, when there is one.
  let compareToken = 0
  async function loadCompare() {
    const mine = ++compareToken
    if (!nav.compareOffset || !nav.contextRid) {
      fileBrowse.compare = null
      nav.compareLoading = false
      return
    }
    // never leave the source of the previous file beside the new one
    fileBrowse.compare = null
    nav.compareLoading = true
    const path = await getNodePath(nav.contextRid).catch(() => null)
    const rid = ancestorAt(path, nav.contextRid, nav.compareOffset)
    try {
      const file = rid ? await getDocInfo(rid) : null
      if (mine === compareToken) fileBrowse.compare = file
    } catch {
      if (mine === compareToken) fileBrowse.compare = null
    } finally {
      if (mine === compareToken) nav.compareLoading = false
    }
  }
  watch(() => [nav.contextRid, nav.compareOffset], loadCompare, { immediate: true })

  // The query of the file route: the browse context and the compared level.
  function viewQuery() {
    const query = setContextToQuery(fileBrowse.context) || {}
    if (nav.compareOffset) query.compare = String(nav.compareOffset)
    return Object.keys(query).length ? query : undefined
  }

  function updateQuery() {
    return router.replace({ name: route.name, params: route.params, query: viewQuery() })
  }

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
      Object.assign(nav, { contextRid: target, offset: 0, compareOffset: 0 })
    }
    const query = keepContext ? viewQuery() : undefined
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
      // The whole set in the order the set browser lists it (grouped by original PDF).
      const response = await getSetFiles(ctx.set_rid, skip, 1, { group: 'origin', order: 'flat' })
      const file = response?.files?.[0]
      if (!file) return
      ctx.skip = skip
      ctx.origin_rid = file.origin_rid || ''
      await go(await shownRidFor(file['@rid']), { keepContext: true, contextRid: file['@rid'] })
    } else if (ctx?.mode === 'search') {
      const index = (ctx.index || 0) + delta
      const result = ctx.results?.[index]
      if (!result) return
      ctx.index = index
      await go(await shownRidFor(result.rid), { keepContext: true, contextRid: result.rid })
    }
  }

  // Goes to the next file of the set (after the shown one, then from the start) for which
  // `matches(rid)` is true, in the order previous/next use. Returns false when there is none.
  async function findNext(matches) {
    const ctx = fileBrowse.context
    if (ctx?.mode !== 'set') return false
    const total = ctx.file_count || 0
    const CHUNK = 200
    const start = (ctx.skip || 0) + 1
    // From just after the shown file to the end, then from the start up to the shown file.
    for (const [from, to] of [[start, total], [0, start - 1]]) {
      for (let skip = from; skip < to; skip += CHUNK) {
        const response = await getSetFiles(ctx.set_rid, skip, Math.min(CHUNK, to - skip), {
          group: 'origin',
          order: 'flat',
        })
        const files = response?.files || []
        const at = files.findIndex((f) => matches(f['@rid']))
        if (at >= 0) {
          ctx.skip = skip + at
          ctx.origin_rid = files[at].origin_rid || ''
          await go(await shownRidFor(files[at]['@rid']), {
            keepContext: true,
            contextRid: files[at]['@rid'],
          })
          return true
        }
      }
    }
    return false
  }

  // A file up the lineage of the browsed file was picked: beside the browsed file (a second click
  // on it, or on the browsed file, closes it again), or in its place.
  async function openInLineage({ node, offset }) {
    if (!sideBySide.value) {
      nav.offset = offset
      return go(node['@rid'], { keepContext: true })
    }
    const backToContext = nav.offset !== 0
    nav.offset = 0
    nav.compareOffset = !offset || offset === nav.compareOffset ? 0 : offset
    if (backToContext) return go(nav.contextRid, { keepContext: true })
    return updateQuery()
  }

  function closeCompare() {
    if (!nav.compareOffset) return undefined
    nav.compareOffset = 0
    return updateQuery()
  }

  // Switches this view between side by side and replacing, for this view only.
  async function toggleSideBySide() {
    const on = !sideBySide.value
    fileBrowse.sideBySide = on ? 'on' : 'off'
    if (!on) return closeCompare()
    if (nav.offset !== 0) {
      nav.offset = 0
      return go(nav.contextRid, { keepContext: true })
    }
    return undefined
  }

  function close() {
    if (deskRid.value) router.push({ name: 'project-graph', params: { rid: deskRid.value } })
    else router.back()
  }

  // Back to the set (or to the PDF `origin` inside it) or the results the file was opened from.
  function back({ origin = '' } = {}) {
    const ctx = fileBrowse.context
    if (ctx?.mode === 'set' && deskRid.value && ctx.set_rid) {
      const query = { openSet: ridParam(ctx.set_rid) }
      if (origin) query.openOrigin = ridParam(origin)
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

  return {
    nav,
    deskRid,
    sideBySide,
    step,
    findNext,
    openInLineage,
    closeCompare,
    toggleSideBySide,
    close,
    back,
  }
}
