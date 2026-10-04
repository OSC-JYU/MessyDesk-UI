import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const started = []
vi.mock('@/api/search.js', () => ({
  startSemanticSearch: async (body) => (started.push(body), { search_id: 's1' }),
  getSemanticSearch: async () => ({
    status: 'done',
    query: 'the old captain stood on deck',
    comparison: { window_size: 15, overlap: 5, threshold: 0.3, query_windows: 1 },
    hits: [
      {
        rid: '#10:2',
        label: 'b.txt',
        similarity: 0.9,
        start_char: 0,
        end_char: 10,
        query_start_token: 1,
      },
    ],
  }),
}))
vi.mock('@/api/files.js', () => ({
  getNodeFile: async () => 'The old captain stood on deck.',
  getDocInfo: async () => ({ label: 'b.txt' }),
}))

const { default: IndexDisplay } = await import('@/features/files/displays/IndexDisplay.vue')

describe('IndexDisplay', () => {
  it('compares a pasted text with a similarity index and shows the matches', async () => {
    const wrapper = mount(IndexDisplay, {
      props: { file: { '@rid': '#30:1', type: 'similarity_index' } },
    })
    expect(wrapper.text()).toContain('Smallest match 30%')
    await wrapper.find('textarea').setValue('the old captain stood on deck')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(started[0]).toMatchObject({ index: '#30:1', k: 100, threshold: 0.3 })
    expect(wrapper.text()).toContain('Match 1 (90.0%)')
    expect(wrapper.text()).toContain('b.txt')
  })

  it('searches a vector index without a threshold', async () => {
    started.length = 0
    const wrapper = mount(IndexDisplay, {
      props: { file: { '@rid': '#30:2', type: 'vector_index' } },
    })
    expect(wrapper.text()).not.toContain('Smallest match')
    await wrapper.find('textarea').setValue('ships')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(started[0].threshold).toBeUndefined()
  })
})
