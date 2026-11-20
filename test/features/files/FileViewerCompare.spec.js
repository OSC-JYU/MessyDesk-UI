import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

const nodes = {
  '#73:0': { '@rid': '#73:0', '@type': 'File', type: 'text', label: 'result.txt' },
  '#74:0': { '@rid': '#74:0', '@type': 'File', type: 'image', label: 'source.png' },
}

vi.mock('@/api/files.js', () => ({ getDocInfo: vi.fn(async (rid) => nodes[rid]) }))
vi.mock('@/api/projects.js', () => ({
  getNodePath: vi.fn(async () => [nodes['#73:0'], nodes['#74:0']]),
  getSetFiles: vi.fn(),
}))
vi.mock('@/features/files/displays/index.js', () => ({
  displays: {
    text: { props: ['file'], template: '<div class="show-text">{{ file.label }}</div>' },
    image: { props: ['file'], template: '<div class="show-image">{{ file.label }}</div>' },
    json: { props: ['file'], template: '<div class="show-json" />' },
  },
}))

import FileViewer from '@/features/files/FileViewer.vue'
import { fileBrowse } from '@/stores/fileBrowse.js'
import { setSettings } from '@/stores/settings.js'

const blank = { render: () => null }

async function open(url) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/project/:rid/file/:fileRid', name: 'project-file', component: blank }],
  })
  router.push(url)
  await router.isReady()
  const wrapper = mount(FileViewer, {
    global: {
      plugins: [router],
      stubs: {
        FileToolsPanel: {
          props: ['collapsed'],
          template: '<aside class="tools-stub" :data-collapsed="collapsed" />',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  Object.assign(fileBrowse, { file: null, compare: null, sideBySide: null, context: null })
  setSettings({ lineage_compare: 'on' })
})

describe('FileViewer side by side', () => {
  it('shows one file, with the tools open, until a lineage file is picked', async () => {
    const wrapper = await open('/project/1:0/file/73:0')
    expect(wrapper.findAll('.viewer__pane')).toHaveLength(1)
    expect(wrapper.find('.show-text').text()).toBe('result.txt')
    expect(wrapper.get('.tools-stub').attributes('data-collapsed')).toBe('false')
  })

  it('opens the source on the left and folds the tools away, then restores them', async () => {
    const wrapper = await open('/project/1:0/file/73:0')
    await wrapper.findAll('.lineage__item button')[1].trigger('click')
    await flushPromises()
    const panes = wrapper.findAll('.viewer__pane')
    expect(panes).toHaveLength(2)
    expect(panes[0].find('.show-image').text()).toBe('source.png')
    expect(panes[1].find('.show-text').text()).toBe('result.txt')
    expect(panes[0].text()).toContain('parent')
    expect(wrapper.get('.tools-stub').attributes('data-collapsed')).toBe('true')

    await wrapper.get('[aria-label="Close the second file"]').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.viewer__pane')).toHaveLength(1)
    expect(wrapper.get('.tools-stub').attributes('data-collapsed')).toBe('false')
  })

  it('opens the comparison from the URL with the tools already folded', async () => {
    const wrapper = await open('/project/1:0/file/73:0?compare=1')
    expect(wrapper.findAll('.viewer__pane')).toHaveLength(2)
    expect(wrapper.get('.tools-stub').attributes('data-collapsed')).toBe('true')
  })

  it('has a button in the lineage that switches between side by side and replacing', async () => {
    const wrapper = await open('/project/1:0/file/73:0')
    const toggle = wrapper.get('[aria-label="Open files in place"]')
    expect(toggle.attributes('aria-pressed')).toBe('true')
    await toggle.trigger('click')
    await flushPromises()
    expect(wrapper.get('[aria-label="Open files side by side"]').attributes('aria-pressed')).toBe(
      'false',
    )
    await wrapper.findAll('.lineage__item button')[1].trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.viewer__pane')).toHaveLength(1)
    expect(wrapper.find('.show-image').text()).toBe('source.png')
  })
})
