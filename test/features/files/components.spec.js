import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@/api/files.js', () => ({
  getNodeFile: vi.fn(),
  createFileVersion: vi.fn(),
  revertFileVersion: vi.fn(),
}))

import { getNodeFile, createFileVersion } from '@/api/files.js'
import TextDisplay from '@/features/files/displays/TextDisplay.vue'
import QuickEditTool from '@/features/files/tools/QuickEditTool.vue'
import BrowseBar from '@/features/files/BrowseBar.vue'
import ImageDisplay from '@/features/files/displays/ImageDisplay.vue'

const textFile = { '@rid': '#76:0', type: 'text', label: 'notes.txt' }

beforeEach(() => vi.clearAllMocks())

describe('TextDisplay', () => {
  it('shows plain text escaped', async () => {
    getNodeFile.mockResolvedValue('<b>bold?</b>\nline two')
    const wrapper = mount(TextDisplay, { props: { file: textFile } })
    await flushPromises()
    expect(wrapper.find('pre').text()).toBe('<b>bold?</b>\nline two')
    expect(wrapper.find('b').exists()).toBe(false)
  })

  it('renders Markdown without scripts', async () => {
    getNodeFile.mockResolvedValue('# Title\n<img src=x onerror="alert(1)">')
    const wrapper = mount(TextDisplay, { props: { file: textFile, markdown: true } })
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Title')
    expect(wrapper.html()).not.toContain('onerror')
  })

  it('edits and saves a new version', async () => {
    getNodeFile.mockResolvedValue('old')
    createFileVersion.mockResolvedValue({})
    const wrapper = mount(TextDisplay, { props: { file: textFile } })
    await flushPromises()
    wrapper.vm.startEdit()
    await flushPromises()
    await wrapper.get('textarea').setValue('new text')
    await wrapper.vm.saveEdit()
    expect(createFileVersion).toHaveBeenCalledWith('#76:0', { content: 'new text' })
    expect(getNodeFile).toHaveBeenCalledTimes(2)
  })
})

describe('QuickEditTool', () => {
  const edit = { rotation: 0, cropMode: false, hasCrop: false, textMode: false, busy: false }

  it('offers rotate and crop for images, and save after a rotation', async () => {
    const wrapper = mount(QuickEditTool, { props: { file: { type: 'image' }, edit } })
    await wrapper.get('[aria-label="Rotate right"]').trigger('click')
    expect(wrapper.emitted('rotate')).toEqual([[90]])
    expect(wrapper.text()).not.toContain('Save quick edit')
    await wrapper.setProps({ edit: { ...edit, rotation: 90 } })
    expect(wrapper.text()).toContain('Save quick edit')
  })

  it('offers text editing for text files', async () => {
    const wrapper = mount(QuickEditTool, {
      props: { file: { type: 'text' }, edit, canEditText: true },
    })
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Edit text')
      .trigger('click')
    expect(wrapper.emitted('start-text')).toHaveLength(1)
  })

  it('refuses to edit reference files and offers revert for edited ones', () => {
    const ref = mount(QuickEditTool, { props: { file: { type: 'image', ref: '#1:0' }, edit } })
    expect(ref.text()).toContain('cannot be edited')
    const edited = mount(QuickEditTool, {
      props: { file: { type: 'text', edited: true }, edit, canEditText: true },
    })
    expect(edited.text()).toContain('Revert quick edit')
  })
})

describe('BrowseBar', () => {
  it('shows the set, the position and steps', async () => {
    const context = { mode: 'set', set_label: 'Letters', file_count: 3, skip: 0 }
    const wrapper = mount(BrowseBar, { props: { context, file: { label: 'a.jpg' } } })
    expect(wrapper.text()).toContain('Letters')
    expect(wrapper.text()).toContain('1 / 3')
    expect(wrapper.get('[aria-label="Previous file"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[aria-label="Next file"]').trigger('click')
    expect(wrapper.emitted('next')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Back to set')
    expect(wrapper.get('h2').text()).toBe('a.jpg')
  })

  it('goes back to the set or to the PDF from the path, and closes to the desk', async () => {
    const context = {
      mode: 'set',
      set_label: 'Letters',
      file_count: 3,
      skip: 1,
      origin_rid: '#9:2',
    }
    const file = { label: 'page_002.txt', origin_label: 'report.pdf' }
    const wrapper = mount(BrowseBar, { props: { context, file } })
    const steps = wrapper.findAll('.crumbs__step')
    expect(steps.map((s) => s.text())).toEqual(['Letters', 'report.pdf'])
    expect(wrapper.get('h2').text()).toBe('page_002.txt')
    await steps[0].trigger('click')
    await steps[1].trigger('click')
    expect(wrapper.emitted('back')).toEqual([[{}], [{ origin: '#9:2' }]])
    await wrapper.get('[aria-label="Close file"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('goes back to the results of a search from the path', async () => {
    const context = { mode: 'search', query: 'Helsinki', kind: 'tags', index: 0, results: [{}] }
    const wrapper = mount(BrowseBar, { props: { context, file: { label: 'a.txt' } } })
    await wrapper.get('.crumbs__step').trigger('click')
    expect(wrapper.get('.crumbs__step').text()).toBe('Helsinki')
    expect(wrapper.emitted('back')).toEqual([[{}]])
  })

  it('shows the PDF the file comes from after the set', () => {
    const context = { mode: 'set', set_label: 'Letters', file_count: 3, skip: 1 }
    const file = { label: 'page_002.txt', origin_label: 'report.pdf' }
    const wrapper = mount(BrowseBar, { props: { context, file } })
    expect(wrapper.text()).toContain('Letters')
    expect(wrapper.text()).toContain('report.pdf')
    const plain = mount(BrowseBar, { props: { context, file: { label: 'a.jpg' } } })
    expect(plain.text()).not.toContain('report.pdf')
  })

  it('shows only the file name and close without a context', () => {
    const wrapper = mount(BrowseBar, { props: { context: null, file: { label: 'a.jpg' } } })
    expect(wrapper.text()).toContain('a.jpg')
    expect(wrapper.find('[aria-label="Next file"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Close file"]').exists()).toBe(true)
  })
})

describe('ImageDisplay', () => {
  it('shows the "not ready" placeholder when the preview is missing', async () => {
    const display = mount(ImageDisplay, {
      props: { file: { '@rid': '#1:0', path: 'data/x/1_0/a.jpg', label: 'a.jpg' } },
    })
    await display.get('img').trigger('error')
    expect(display.text()).toContain('Preview not ready yet')
    expect(display.find('.image-display__missing').exists()).toBe(true)
  })
})
