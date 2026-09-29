import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('@/api/services.js', () => ({
  getServicesForFile: vi.fn(),
  createFileProcess: vi.fn(),
  createSetProcess: vi.fn(),
  createROIProcess: vi.fn(),
  createSourceProcess: vi.fn(),
  createFilter: vi.fn(),
}))

import * as api from '@/api/services.js'
import CruncherPicker from '@/features/services/crunchers/CruncherPicker.vue'

const catalogue = {
  for_format: [
    {
      id: 'md-imaginary',
      name: 'Imaginary',
      category: 'preparation',
      tasks: {
        rotate: {
          name: 'Rotate',
          description: 'Rotate an image',
          params_help: { angle: { name: 'Angle', display: 'dropdown', values: { 90: '90°', 180: '180°' }, default: '90' } },
        },
      },
    },
  ],
  filters: [{ id: 'mdf-size', name: 'Size filter', category: 'preparation' }],
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/help/services/:service/', name: 'service-help', component: { template: '<div />' } }],
})

async function mountPicker(node = { id: '#76:0', type: 'image' }) {
  const wrapper = mount(CruncherPicker, {
    props: { node, cruncherFilter: '' },
    global: { plugins: [router] },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

async function click(wrapper, text) {
  const target = wrapper.findAll('button').find((b) => b.text().includes(text))
  expect(target, `button "${text}"`).toBeTruthy()
  await target.trigger('click')
  await flushPromises()
}

beforeEach(() => {
  vi.resetAllMocks()
  api.getServicesForFile.mockResolvedValue(structuredClone(catalogue))
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('CruncherPicker', () => {
  it('loads the crunchers for the node', async () => {
    const wrapper = await mountPicker()
    expect(api.getServicesForFile).toHaveBeenCalledWith('#76:0', '')
    expect(wrapper.text()).toContain('Imaginary')
    expect(wrapper.text()).toContain('Size filter')
  })

  it('runs a task on a file with its default parameters and reports done', async () => {
    api.createFileProcess.mockResolvedValue({})
    const wrapper = await mountPicker()
    await click(wrapper, 'Imaginary')
    await click(wrapper, 'Rotate')
    await click(wrapper, 'Crunch file')
    expect(api.createFileProcess).toHaveBeenCalledWith(
      { service: 'md-imaginary', id: 'rotate', params: { angle: '90' } },
      '#76:0',
    )
    expect(wrapper.emitted('done')).toEqual([[{ reload: false }]])
  })

  it('runs on the set endpoint for sets', async () => {
    api.createSetProcess.mockResolvedValue({})
    const wrapper = await mountPicker({ id: '#121:0', type: 'set' })
    await click(wrapper, 'Imaginary')
    await click(wrapper, 'Rotate')
    await click(wrapper, 'Crunch files in set')
    expect(api.createSetProcess).toHaveBeenCalledOnce()
    expect(api.createFileProcess).not.toHaveBeenCalled()
  })

  it('shows the error and stays open when starting fails', async () => {
    api.createFileProcess.mockRejectedValue({ status: 500, message: 'Queue is down' })
    const wrapper = await mountPicker()
    await click(wrapper, 'Imaginary')
    await click(wrapper, 'Rotate')
    await click(wrapper, 'Crunch file')
    expect(wrapper.text()).toContain('Queue is down')
    expect(wrapper.emitted('done')).toBeUndefined()
  })

  it('creates a filter and asks for a reload', async () => {
    api.createFilter.mockResolvedValue({})
    const wrapper = await mountPicker()
    await click(wrapper, 'Size filter')
    await click(wrapper, 'Create filter')
    expect(api.createFilter).toHaveBeenCalledWith('mdf-size', '#76:0')
    expect(wrapper.emitted('done')).toEqual([[{ reload: true }]])
  })

  it('shows an empty state without a node', async () => {
    const wrapper = await mountPicker(null)
    expect(api.getServicesForFile).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('No file selected')
  })
})
