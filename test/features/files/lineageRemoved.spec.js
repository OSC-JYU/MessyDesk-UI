import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@/api/projects.js', () => ({
  getNodePath: vi.fn(async () => [
    { '@rid': '#1:0', '@type': 'File', type: 'text', label: 'page_002.txt' },
    { '@rid': '#1:1', '@type': 'File', type: 'pdf', label: 'page_002.pdf' },
    {
      '@rid': '#1:2',
      '@type': 'File',
      type: 'original-pdf',
      label: 'report.pdf',
      _file_removed: true,
    },
  ]),
}))

import LineagePanel from '@/features/files/LineagePanel.vue'
import { isOpenable, isRemoved, nodeIcon } from '@/features/files/lineage.js'

describe('lineage of a deleted file', () => {
  it('does not open a PDF that was deleted after splitting', () => {
    const removed = { '@type': 'File', type: 'original-pdf', '@rid': '#1:2', _file_removed: true }
    expect(isRemoved(removed)).toBe(true)
    expect(isOpenable(removed)).toBe(false)
    expect(isOpenable({ ...removed, _file_removed: undefined })).toBe(true)
    expect(nodeIcon(removed)).toBe('mdi-file-remove-outline')
  })

  it('shows it as deleted and opens only the files that exist', async () => {
    const wrapper = mount(LineagePanel, { props: { contextRid: '#1:0', selectedRid: '#1:0' } })
    await flushPromises()
    const items = wrapper.findAll('.lineage__item')
    expect(items).toHaveLength(3)
    expect(items[2].classes()).toContain('lineage__item--removed')
    expect(items[2].text()).toContain('File deleted after splitting')
    expect(items[2].find('button').exists()).toBe(false)
    expect(items[1].find('button').exists()).toBe(true)
    await items[2].find('.lineage__node').trigger('click')
    expect(wrapper.emitted('open')).toBeUndefined()
    await items[1].find('button').trigger('click')
    expect(wrapper.emitted('open')).toHaveLength(1)
  })
})
