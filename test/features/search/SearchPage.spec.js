import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('@/api/search.js', () => ({ search: vi.fn() }))
vi.mock('@/api/files.js', () => ({ getDocInfo: vi.fn() }))
vi.mock('@/api/projects.js', () => ({ getProjects: vi.fn().mockResolvedValue([]) }))

import { search } from '@/api/search.js'
import { getDocInfo } from '@/api/files.js'
import { fileBrowse } from '@/stores/fileBrowse.js'
import SearchPage from '@/features/search/SearchPage.vue'

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/search', name: 'search', component: SearchPage },
      { path: '/project/:rid/search', name: 'project-search', component: SearchPage },
      { path: '/project/:rid/file/:fileRid', name: 'project-file', component: Stub },
      { path: '/files/:rid', name: 'files', component: Stub },
    ],
  })
}

const response = {
  response: {
    docs: [
      { id: 'd1', node: '76:0', label: 'letter.txt', type: 'text' },
      { id: 'd2', node: '73:0', label: 'notes.txt', type: 'text' },
    ],
  },
  highlighting: { d1: { fulltext: ['dear <em>friend</em>'] } },
}

async function mountAt(path) {
  const router = makeRouter()
  router.push(path)
  await router.isReady()
  const wrapper = mount(SearchPage, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return { wrapper, router }
}

async function searchFor(wrapper, text) {
  await wrapper.get('input').setValue(text)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  search.mockResolvedValue(response)
  getDocInfo.mockImplementation(async (rid) => ({ '@rid': rid }))
})

describe('SearchPage', () => {
  it('searches inside the desk of the route and shows highlighted hits', async () => {
    const { wrapper } = await mountAt('/project/1:0/search')
    await searchFor(wrapper, 'friend')
    expect(search).toHaveBeenCalledWith('friend', { projectRids: ['#1:0'], rows: 500, fuzzy: false })
    expect(wrapper.text()).toContain('Search: friend')
    expect(wrapper.text()).toContain('2 files')
    expect(wrapper.find('.result-card__snippet em').text()).toBe('friend')
  })

  it('opens a hit in its desk and keeps the list for previous/next', async () => {
    const { wrapper, router } = await mountAt('/project/1:0/search')
    await searchFor(wrapper, 'friend')
    await wrapper.findAll('.result-card')[1].trigger('click')
    await flushPromises()
    await vi.waitFor(() =>
      expect(router.currentRoute.value.fullPath).toBe('/project/1:0/file/73:0'),
    )
    expect(fileBrowse.file).toEqual({ '@rid': '#73:0' })
    expect(fileBrowse.context).toMatchObject({ mode: 'search', query: 'friend', index: 1 })
    expect(fileBrowse.context.results.map((r) => r.rid)).toEqual(['#76:0', '#73:0'])
  })

  it('opens hits of a search across desks in the stand-alone file view', async () => {
    const { wrapper, router } = await mountAt('/search')
    await searchFor(wrapper, 'friend')
    expect(search).toHaveBeenCalledWith('friend', { projectRids: [], rows: 500, fuzzy: false })
    await wrapper.findAll('.result-card')[0].trigger('click')
    await flushPromises()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/files/76:0'))
  })

  it('says when nothing matched', async () => {
    search.mockResolvedValue({ response: { docs: [] } })
    const { wrapper } = await mountAt('/search')
    await searchFor(wrapper, 'nothing')
    expect(wrapper.text()).toContain('No matches')
  })
})
