import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { vuetify } from '../../setup.js'
import CruncherService from '@/features/services/crunchers/CruncherService.vue'
import { decodeCredentials } from '@/features/services/crunchers/credentials.js'

const service = {
  id: 'md-roihu-htr',
  name: 'Roihu HTR',
  api_key_source: 'user',
  credentials: [
    { name: 'token', label: 'FirecREST token', secret: true, required: true },
    { name: 'project', label: 'CSC project', secret: false, required: true },
    { name: 'allas_project', label: 'Allas project', secret: false, required: false },
  ],
  tasks: [{ key: 'htr', name: 'HTR', description: 'Recognise text' }],
}

// Stands in for the task form: it only needs to emit `run`.
const CruncherTaskStub = {
  emits: ['run'],
  template: '<button class="run" @click="$emit(\'run\')">Run</button>',
}

// The panels are collapsed (and lazy) by default; render their content straight away.
const passthrough = { template: '<div><slot /></div>' }

function mountService(props = {}) {
  return mount(CruncherService, {
    props: { service, ...props },
    global: {
      plugins: [vuetify],
      stubs: {
        CruncherTask: CruncherTaskStub,
        VExpansionPanel: passthrough,
        VExpansionPanels: passthrough,
        VExpansionPanelTitle: passthrough,
        VExpansionPanelText: passthrough,
      },
    },
    attachTo: document.body,
  })
}

async function fill(wrapper, name, value) {
  await wrapper.find(`[data-test="credential-${name}"] input`).setValue(value)
}

describe('CruncherService credentials', () => {
  it('does not emit run while a required field is empty', async () => {
    const wrapper = mountService()
    await fill(wrapper, 'token', 'secret')
    await wrapper.find('button.run').trigger('click')
    expect(wrapper.emitted('run')).toBeUndefined()
    expect(wrapper.text()).toContain('Enter the CSC project')
    wrapper.unmount()
  })

  it('emits a key that decodes to the entered values', async () => {
    const wrapper = mountService()
    await fill(wrapper, 'token', ' secret ')
    await fill(wrapper, 'project', 'project_1')
    await wrapper.find('button.run').trigger('click')
    const [task, model, key] = wrapper.emitted('run')[0]
    expect(task.key).toBe('htr')
    expect(model).toBeNull()
    expect(decodeCredentials(key)).toEqual({ token: 'secret', project: 'project_1' })
    expect(wrapper.find('[data-test="credential-token"] input').element.value).toBe('')
    wrapper.unmount()
  })

  it('shows no form for a service without credentials', async () => {
    const wrapper = mountService({ service: { ...service, credentials: undefined } })
    expect(wrapper.find('[data-test="credentials-form"]').exists()).toBe(false)
    await wrapper.find('button.run').trigger('click')
    expect(wrapper.emitted('run')[0]).toHaveLength(2)
    wrapper.unmount()
  })
})
