import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import VersionTools from '../../../src/components/displays/VersionTools.vue'

function createWrapper(props = {}) {
  return mount(VersionTools, {
    props,
    global: {
      stubs: {
        'v-alert': {
          template: '<div><slot /></div>',
        },
        'v-icon': {
          template: '<i><slot /></i>',
        },
        'v-btn': {
          props: ['disabled'],
          emits: ['click'],
          template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  })
}

describe('VersionTools', () => {
  it('shows start edit for editable text file and emits start-edit', async () => {
    const wrapper = createWrapper({
      file: { type: 'text', label: 'note.txt' },
      textEditMode: false,
      supportsTextEditing: true,
    })

    const buttons = wrapper.findAll('button')
    const startButton = buttons.find((button) => button.text().includes('Start edit'))

    expect(startButton).toBeTruthy()
    await startButton.trigger('click')
    expect(wrapper.emitted('start-edit')).toBeTruthy()
  })

  it('shows save and cancel in text edit mode', async () => {
    const wrapper = createWrapper({
      file: { type: 'text', label: 'note.txt' },
      textEditMode: true,
      supportsTextEditing: true,
    })

    const buttons = wrapper.findAll('button')
    const saveButton = buttons.find((button) => button.text().includes('Save quick edit'))
    const cancelButton = buttons.find((button) => button.text().includes('Cancel edit'))

    expect(saveButton).toBeTruthy()
    expect(cancelButton).toBeTruthy()

    await saveButton.trigger('click')
    await cancelButton.trigger('click')

    expect(wrapper.emitted('save-edit')).toBeTruthy()
    expect(wrapper.emitted('cancel-edit')).toBeTruthy()
  })

  it('shows revert action when file has edited metadata', async () => {
    const wrapper = createWrapper({
      file: { type: 'text', edited: { task: 'text-edit' } },
      supportsTextEditing: true,
    })

    const buttons = wrapper.findAll('button')
    const revertButton = buttons.find((button) => button.text().includes('Revert quick edit'))

    expect(revertButton).toBeTruthy()
    await revertButton.trigger('click')
    expect(wrapper.emitted('revert-edit')).toBeTruthy()
  })

  it('hides text edit controls for reference files', () => {
    const wrapper = createWrapper({
      file: { type: 'text', ref: true },
      supportsTextEditing: true,
    })

    const text = wrapper.text()
    expect(text.includes('Start edit')).toBe(false)
    expect(text.includes('Save quick edit')).toBe(false)
  })

  it('shows crop controls for image files and emits crop events', async () => {
    const wrapper = createWrapper({
      file: { type: 'image', label: 'image.png' },
      imageCropMode: false,
      hasImageCropSelection: false,
    })

    const startCropButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Start crop'))
    expect(startCropButton).toBeTruthy()
    await startCropButton.trigger('click')
    expect(wrapper.emitted('start-crop')).toBeTruthy()

    await wrapper.setProps({ imageCropMode: true, hasImageCropSelection: true })
    const clearButton = wrapper.findAll('button').find((button) => button.text().includes('Clear'))
    const cancelButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Cancel'))

    expect(clearButton).toBeTruthy()
    expect(cancelButton).toBeTruthy()

    await clearButton.trigger('click')
    await cancelButton.trigger('click')

    expect(wrapper.emitted('clear-crop')).toBeTruthy()
    expect(wrapper.emitted('cancel-crop')).toBeTruthy()
  })
})
