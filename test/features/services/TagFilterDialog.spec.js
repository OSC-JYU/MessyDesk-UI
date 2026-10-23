import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

vi.mock('@/api/services.js', () => ({ createFilter: vi.fn() }))

const { createFilter } = await import('@/api/services.js')
const { default: TagFilterDialog } =
  await import('@/features/services/crunchers/TagFilterDialog.vue')

// Stands in for the picker: records the desk it got and lets the test choose tags and labels.
const roi = { service_id: 'md-gliner2', task: 'extract', model: '', label: 'person' }
const PickerStub = defineComponent({
  name: 'TagPicker',
  props: {
    deskRid: { type: String, default: '' },
    tags: { type: Array, default: () => [] },
    roi: { type: Array, default: () => [] },
  },
  emits: ['update:tags', 'update:roi'],
  setup(props, { emit }) {
    return () =>
      h('button', {
        'data-test': 'picker',
        'data-desk': props.deskRid,
        onClick: () => {
          emit('update:tags', [{ '@rid': '#30:1', label: 'urgent' }])
          emit('update:roi', [roi])
        },
      })
  },
})

async function mountDialog() {
  const wrapper = mount(TagFilterDialog, {
    props: { modelValue: false, filterId: 'mdf-set-filter', setRid: '#20:1', deskRid: '#12:3' },
    global: { stubs: { TagPicker: PickerStub } },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

const body = () => document.body
const click = async (selector) => {
  body().querySelector(selector).click()
  await flushPromises()
}
const createButton = () =>
  [...body().querySelectorAll('button')].find((b) => b.textContent.includes('Create filter'))

beforeEach(() => vi.clearAllMocks())
afterEach(() => (document.body.innerHTML = ''))

describe('TagFilterDialog', () => {
  it('gives the picker the set\u2019s desk and sends tags and ROI labels together', async () => {
    createFilter.mockResolvedValue({})
    const wrapper = await mountDialog()
    expect(body().querySelector('[data-test="picker"]').dataset.desk).toBe('#12:3')
    await click('[data-test="picker"]')
    createButton().click()
    await flushPromises()
    expect(createFilter).toHaveBeenCalledWith('mdf-set-filter', '#20:1', {
      selection_mode: 'include',
      selected_entity_rids: ['#30:1'],
      selected_roi_labels: [roi],
      match: 'or',
    })
    expect(wrapper.emitted('created')).toHaveLength(1)
  })

  it('asks for a tag or label before creating the filter', async () => {
    await mountDialog()
    createButton().click()
    await flushPromises()
    expect(createFilter).not.toHaveBeenCalled()
    expect(body().textContent).toContain('Select at least one tag or label.')
  })

  it('shows the error of a failed filter, such as an index that is down', async () => {
    createFilter.mockRejectedValue({ status: 502, message: 'Search index is down' })
    await mountDialog()
    await click('[data-test="picker"]')
    createButton().click()
    await flushPromises()
    expect(body().textContent).toContain('Search index is down')
  })
})
