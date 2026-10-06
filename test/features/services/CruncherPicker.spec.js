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
          params_help: {
            angle: {
              name: 'Angle',
              display: 'dropdown',
              values: { 90: '90°', 180: '180°' },
              default: '90',
            },
          },
        },
      },
    },
  ],
  filters: [{ id: 'mdf-size', name: 'Size filter', category: 'preparation' }],
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/help/services/:service/', name: 'service-help', component: { template: '<div />' } },
  ],
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

  describe('LLM services', () => {
    const params_help = { temperature: { name: 'Temperature', default: 0.2 } }
    const summary = {
      name: 'Summary',
      description: 'Short summary',
      content: 'Summarise.',
      type: 'text',
      output_type: 'text',
      system_params: { prompts: { content: 'Summarise.' } },
    }
    const autotag = {
      name: 'Tag with AI',
      description: 'Tags',
      autotag: true,
      params_help: { labels: { name: 'Categories' } },
    }
    const llmCatalogue = {
      for_format: [
        {
          id: 'md-llm-ollama',
          name: 'Ollama',
          category: 'generative',
          location: 'on-premise',
          external_tasks: 'prompts',
          params_help,
          models: {
            'gemma3:4b': {
              name: 'Gemma 3 4B',
              family: 'gemma-3-4b',
              supported_types: ['text', 'image'],
            },
            'gpt-oss:20b': {
              name: 'gpt-oss 20B',
              family: 'gpt-oss-20b',
              supported_types: ['text'],
            },
          },
          tasks: { summary, autotag },
        },
        {
          id: 'md-llm-vllm',
          name: 'vLLM',
          category: 'generative',
          location: 'on-premise',
          external_tasks: 'prompts',
          params_help,
          models: {
            'gpt-oss-20b': {
              name: 'gpt-oss 20B',
              family: 'gpt-oss-20b',
              supported_types: ['text'],
            },
          },
          tasks: { summary, autotag },
        },
      ],
      filters: [],
    }

    beforeEach(() => {
      api.getServicesForFile.mockResolvedValue(structuredClone(llmCatalogue))
    })

    it('shows one AI prompts entry and one per own task instead of each provider', async () => {
      const wrapper = await mountPicker({ id: '#76:0', type: 'text' })
      await click(wrapper, 'Generative AI')
      expect(wrapper.text()).toContain('AI prompts')
      expect(wrapper.text()).toContain('Tag with AI')
      expect(wrapper.text()).not.toContain('Ollama')
    })

    it('runs a prompt with the chosen model on the chosen provider', async () => {
      api.createFileProcess.mockResolvedValue({})
      const wrapper = await mountPicker({ id: '#76:0', type: 'text' })
      await wrapper.find('input').setValue('Summary')
      await flushPromises()
      await click(wrapper, 'Summary')
      await wrapper.find('input[type="radio"][value="gpt-oss-20b"]').setValue()
      await flushPromises()
      // the same model from two providers: the provider is chosen last
      expect(wrapper.text()).toContain('Ollama')
      expect(wrapper.text()).toContain('vLLM')
      await wrapper.find('input[type="radio"][value="md-llm-vllm:gpt-oss-20b"]').setValue()
      await flushPromises()
      await click(wrapper, 'Crunch file')
      expect(api.createFileProcess).toHaveBeenCalledWith(
        {
          service: 'md-llm-vllm',
          id: 'summary',
          params: { temperature: 0.2 },
          model: 'gpt-oss-20b',
          name: 'Summary',
          description: 'Short summary',
          system_params: { prompts: { content: 'Summarise.' }, output_type: 'text' },
        },
        '#76:0',
      )
    })

    it('runs the autotagger like a normal task, with a model', async () => {
      api.createFileProcess.mockResolvedValue({})
      const wrapper = await mountPicker({ id: '#76:0', type: 'text' })
      await click(wrapper, 'Generative AI')
      await click(wrapper, 'Tag with AI')
      // Gemma is only on Ollama, so the provider is preselected
      await wrapper.find('input[type="radio"][value="gemma-3-4b"]').setValue()
      await flushPromises()
      await click(wrapper, 'Crunch file')
      const [process] = api.createFileProcess.mock.calls[0]
      expect(process).toMatchObject({ service: 'md-llm-ollama', id: 'autotag', model: 'gemma3:4b' })
      expect(process.system_params).toBeUndefined()
    })
  })
})
