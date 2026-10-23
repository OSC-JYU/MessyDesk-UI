import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/files.js', () => ({
  createFileThumbnail: vi.fn(),
  createFileVersion: vi.fn(),
  getDocInfo: vi.fn(),
  getNodeFileBlob: vi.fn(),
  revertFileVersion: vi.fn(),
}))
vi.mock('@/features/files/tools/FileTagsTool.vue', () => ({ default: { template: '<div />' } }))

const api = await import('@/api/files.js')
const { useQuickEdit } = await import('@/features/files/useQuickEdit.js')
const { default: FileToolsPanel } = await import('@/features/files/tools/FileToolsPanel.vue')

const edit = { busy: false, message: null }
const mountPanel = (file) => mount(FileToolsPanel, { props: { file, edit } })
const button = (wrapper) => wrapper.find('[data-test="regenerate-thumbnail"]')

beforeEach(() => vi.clearAllMocks())

describe('Regenerate thumbnail button', () => {
  it('is shown for an image and asks the viewer to regenerate', async () => {
    const wrapper = mountPanel({ '@rid': '#10:1', type: 'image', label: 'a.png' })
    expect(button(wrapper).exists()).toBe(true)
    await button(wrapper).trigger('click')
    expect(wrapper.emitted('quick-edit')).toEqual([['thumbnail']])
  })

  it('is not shown for other files or for a reference to an image', () => {
    expect(button(mountPanel({ '@rid': '#10:2', type: 'pdf', label: 'a.pdf' })).exists()).toBe(
      false,
    )
    expect(button(mountPanel({ '@rid': '#10:3', type: 'text', label: 'a.txt' })).exists()).toBe(
      false,
    )
    expect(button(mountPanel({ '@rid': '#10:4', type: 'image', ref: '#10:1' })).exists()).toBe(
      false,
    )
  })
})

describe('thumbnail quick action', () => {
  it('requests the thumbnail and says so', async () => {
    api.createFileThumbnail.mockResolvedValue({})
    const { edit: state, act } = useQuickEdit(
      () => ({ '@rid': '#10:1', type: 'image' }),
      () => null,
      () => {},
    )
    act('thumbnail')
    await flushPromises()
    expect(api.createFileThumbnail).toHaveBeenCalledWith('#10:1')
    expect(state.message).toEqual({ text: 'The thumbnail is being regenerated.', type: 'success' })
  })

  it('shows the backend message when the thumbnailer is not running', async () => {
    api.createFileThumbnail.mockRejectedValue({
      response: { data: { message: 'Thumbnailer service is not running.' } },
    })
    const { edit: state, act } = useQuickEdit(
      () => ({ '@rid': '#10:1', type: 'image' }),
      () => null,
      () => {},
    )
    act('thumbnail')
    await flushPromises()
    expect(state.message).toEqual({ text: 'Thumbnailer service is not running.', type: 'error' })
  })
})
