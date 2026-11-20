import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

// the lineage of a text: the text, the page it came from, the original PDF
const lineages = {
  '#73:0': ['#73:0', '#74:0', '#75:0'],
  '#73:1': ['#73:1', '#74:1'],
}
const nodes = Object.fromEntries(
  Object.values(lineages)
    .flat()
    .map((rid) => [rid, { '@rid': rid, '@type': 'File', type: 'text', label: `file ${rid}` }]),
)

vi.mock('@/api/files.js', () => ({ getDocInfo: vi.fn(async (rid) => nodes[rid]) }))
vi.mock('@/api/projects.js', () => ({
  getNodePath: vi.fn(async (rid) => lineages[rid].map((r) => nodes[r])),
  getSetFiles: vi.fn(async (set, skip) => ({
    files: [{ '@rid': skip === 1 ? '#73:1' : '#73:0' }],
  })),
}))

import { useFileViewer } from '@/features/files/useFileViewer.js'
import { fileBrowse } from '@/stores/fileBrowse.js'
import { setSettings } from '@/stores/settings.js'

const blank = { render: () => null }

async function setup(start) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/project/:rid/file/:fileRid', name: 'project-file', component: blank },
      { path: '/files/:rid', name: 'files', component: blank },
    ],
  })
  router.push(start)
  await router.isReady()
  let viewer
  mount(
    defineComponent({
      setup() {
        viewer = useFileViewer()
        return () => h('div')
      },
    }),
    { global: { plugins: [router] } },
  )
  await flushPromises()
  return { router, viewer }
}

beforeEach(() => {
  fileBrowse.file = null
  fileBrowse.compare = null
  fileBrowse.sideBySide = null
  fileBrowse.context = null
  setSettings({ lineage_compare: 'on' })
})

describe('side by side lineage', () => {
  it('opens the picked file beside the browsed one, and closes it on a second click', async () => {
    const { router, viewer } = await setup('/project/1:0/file/73:0')
    await viewer.openInLineage({ node: nodes['#74:0'], offset: 1 })
    await flushPromises()
    expect(router.currentRoute.value.params.fileRid).toBe('73:0')
    expect(router.currentRoute.value.query.compare).toBe('1')
    expect(fileBrowse.file['@rid']).toBe('#73:0')
    expect(fileBrowse.compare['@rid']).toBe('#74:0')

    await viewer.openInLineage({ node: nodes['#75:0'], offset: 2 })
    await flushPromises()
    expect(fileBrowse.compare['@rid']).toBe('#75:0')

    await viewer.openInLineage({ node: nodes['#75:0'], offset: 2 })
    await flushPromises()
    expect(fileBrowse.compare).toBeNull()
    expect(router.currentRoute.value.query.compare).toBeUndefined()

    await viewer.openInLineage({ node: nodes['#74:0'], offset: 1 })
    await viewer.openInLineage({ node: nodes['#73:0'], offset: 0 })
    await flushPromises()
    expect(fileBrowse.compare).toBeNull()
  })

  it('keeps the level when stepping, so each file stays beside its own source', async () => {
    const { router, viewer } = await setup('/project/1:0/file/73:0')
    fileBrowse.context = { mode: 'set', set_rid: '#5:1', file_count: 2, skip: 0 }
    await viewer.openInLineage({ node: nodes['#74:0'], offset: 1 })
    await flushPromises()
    await viewer.step(1)
    await flushPromises()
    expect(router.currentRoute.value.params.fileRid).toBe('73:1')
    expect(router.currentRoute.value.query.compare).toBe('1')
    expect(fileBrowse.compare['@rid']).toBe('#74:1')
  })

  it('shows nothing beside a file whose lineage is shorter', async () => {
    const { viewer } = await setup('/project/1:0/file/73:1')
    await viewer.openInLineage({ node: nodes['#74:1'], offset: 1 })
    await flushPromises()
    expect(fileBrowse.compare['@rid']).toBe('#74:1')
    viewer.nav.compareOffset = 2
    await flushPromises()
    expect(fileBrowse.compare).toBeNull()
  })

  it('keeps the comparison across a reload (the level is in the URL)', async () => {
    const { viewer } = await setup('/project/1:0/file/73:0?compare=2')
    expect(viewer.nav.compareOffset).toBe(2)
    expect(fileBrowse.compare['@rid']).toBe('#75:0')
  })

  it('replaces the browsed file when the setting is off, until switched on for the view', async () => {
    setSettings({ lineage_compare: 'off' })
    const { router, viewer } = await setup('/project/1:0/file/73:0')
    expect(viewer.sideBySide.value).toBe(false)
    await viewer.openInLineage({ node: nodes['#74:0'], offset: 1 })
    await flushPromises()
    expect(router.currentRoute.value.params.fileRid).toBe('74:0')
    expect(viewer.nav.compareOffset).toBe(0)
    expect(fileBrowse.compare).toBeNull()

    await viewer.toggleSideBySide()
    await flushPromises()
    expect(viewer.sideBySide.value).toBe(true)
    expect(router.currentRoute.value.params.fileRid).toBe('73:0')
    await viewer.openInLineage({ node: nodes['#75:0'], offset: 2 })
    await flushPromises()
    expect(fileBrowse.compare['@rid']).toBe('#75:0')

    await viewer.toggleSideBySide()
    await flushPromises()
    expect(viewer.sideBySide.value).toBe(false)
    expect(fileBrowse.compare).toBeNull()
  })
})
