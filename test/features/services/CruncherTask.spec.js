import { describe, it, expect } from 'vitest'
import { reactive } from 'vue'
import { mount } from '@vue/test-utils'
import CruncherTask from '@/features/services/crunchers/CruncherTask.vue'
import { prepareCatalogue } from '@/features/services/crunchers/crunchers.js'

const catalogue = prepareCatalogue({
  for_format: [
    {
      id: 'md-pypdf_fs',
      name: 'PyPDF',
      category: 'preparation',
      tasks: {
        split: {
          name: 'Split PDF to pages',
          params_help: {
            pages: { name: 'Pages', help: 'e.g. 1-5,8', default: '' },
            delete_original: {
              name: 'Delete the original PDF',
              display: 'checkbox',
              default: true,
              warning: 'Pages outside the range are lost.',
              warning_if_set: 'pages',
            },
          },
        },
      },
    },
    {
      id: 'md-poppler',
      name: 'Poppler',
      category: 'preparation',
      tasks: {
        pdf2text: {
          name: 'Extract text',
          params_help: { pages: { name: 'Pages', default: '', filter: 'set_pages' } },
        },
      },
    },
  ],
})

const mountTask = (serviceId, onSet = false) => {
  const service = catalogue.services.find((s) => s.id === serviceId)
  const task = reactive(service.tasks[0])
  const wrapper = mount(CruncherTask, { props: { service, task, onSet } })
  return { wrapper, task }
}

describe('CruncherTask page ranges', () => {
  it('keeps delete original on by default, without a warning for all pages', () => {
    const { wrapper, task } = mountTask('md-pypdf_fs')
    expect(task.values).toEqual({ pages: '', delete_original: true })
    expect(wrapper.text()).toContain('Delete the original PDF')
    expect(wrapper.text()).not.toContain('Pages outside the range are lost.')
  })

  it('warns when a range is given and the original is deleted', async () => {
    const { wrapper, task } = mountTask('md-pypdf_fs')
    task.values.pages = '1-3'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Pages outside the range are lost.')
    task.values.delete_original = false
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Pages outside the range are lost.')
  })

  it('offers a set page range only for sets', () => {
    expect(mountTask('md-poppler', false).wrapper.text()).not.toContain('Pages')
    expect(mountTask('md-poppler', true).wrapper.text()).toContain('Pages')
  })
})
