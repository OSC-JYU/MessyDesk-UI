import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('@/api/files.js', () => ({
  getDocInfo: vi.fn(async (rid) => ({ '@rid': rid, label: 'letter.txt', type: 'text' })),
}))
vi.mock('@/api/projects.js', () => ({ getNodePath: vi.fn(), getSetFiles: vi.fn() }))

import { useFileOpener } from '@/features/search/useFileOpener.js'
import { useFileViewer } from '@/features/files/useFileViewer.js'
import { getSetFiles } from '@/api/projects.js'
import { fileBrowse } from '@/stores/fileBrowse.js'

const blank = { render: () => null }
function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/entities', name: 'entities', component: blank },
      { path: '/search', name: 'search', component: blank },
      { path: '/project/:rid', name: 'project-graph', component: blank },
      { path: '/project/:rid/search', name: 'project-search', component: blank },
      { path: '/project/:rid/entities', name: 'project-entities', component: blank },
      { path: '/project/:rid/file/:fileRid', name: 'project-file', component: blank },
      { path: '/files/:rid', name: 'files', component: blank },
    ],
  })
}

// Mounts a component that exposes the opener and the viewer, as the Tags or
// Search page and the file viewer would use them.
async function setup(start) {
  const router = makeRouter()
  router.push(start)
  await router.isReady()
  let api
  mount(
    defineComponent({
      setup() {
        api = { open: useFileOpener(), viewer: useFileViewer() }
        return () => h('div')
      },
    }),
    { global: { plugins: [router] } },
  )
  return { router, api }
}

const results = [{ rid: '#73:0', label: 'letter.txt' }]

beforeEach(() => {
  fileBrowse.file = null
  fileBrowse.context = null
})

describe('Back to results', () => {
  it('returns to the Tags page a file was opened from, even inside a desk', async () => {
    const { router, api } = await setup('/entities')
    await api.open({
      result: results[0],
      index: 0,
      results,
      query: 'Tags: Helsinki',
      projectRid: '#1:0',
      kind: 'tags',
    })
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('project-file')
    expect(fileBrowse.context).toMatchObject({ kind: 'tags', returnTo: '/entities' })

    api.viewer.back({ origin: '#9:2' })
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/entities')
  })

  it("returns to a desk's Tags tab", async () => {
    const { router, api } = await setup('/project/1:0/entities')
    await api.open({
      result: results[0],
      index: 0,
      results,
      query: 'Tags: x',
      projectRid: '#1:0',
      kind: 'tags',
    })
    await flushPromises()
    api.viewer.back({ origin: '#9:2' })
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('project-entities')
  })

  it('returns to Search with its query for search results', async () => {
    const { router, api } = await setup('/search?q=friend')
    await api.open({ result: results[0], index: 0, results, query: 'friend' })
    await flushPromises()
    expect(fileBrowse.context.kind).toBe('search')
    api.viewer.back({ origin: '#9:2' })
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/search?q=friend')
  })

  it('steps through the whole set in the grouped order and goes back to the PDF of the file', async () => {
    const { router, api } = await setup('/project/1:0/file/73:0')
    getSetFiles.mockResolvedValue({
      files: [{ '@rid': '#73:1', label: 'page_002.txt', origin_rid: '#9:2' }],
    })
    fileBrowse.file = { '@rid': '#73:0' }
    fileBrowse.context = { mode: 'set', set_rid: '#5:1', file_count: 3, skip: 0 }
    await api.viewer.step(1)
    expect(getSetFiles).toHaveBeenCalledWith('#5:1', 1, 1, { group: 'origin', order: 'flat' })
    await flushPromises()
    api.viewer.back({ origin: '#9:2' })
    await flushPromises()
    expect(router.currentRoute.value.query).toMatchObject({ openSet: '5:1', openOrigin: '9:2' })
  })
})
